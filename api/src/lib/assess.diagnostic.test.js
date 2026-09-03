'use strict';

// 本機 diagnostic：用 Azure TTS 產生 WAV，直接打 Pronunciation Assessment REST。
// TEST A/B/C 可自動跑。TEST D（把 coffee/bottle/water 明顯念錯）需要真人麥克風，不 fake。
// Speech Key 只從 gitignore 的 local.settings.json 讀取，不會印出。

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {
  ENABLE_PROSODY_ASSESSMENT,
  getAssessUrl,
  buildPronunciationAssessmentConfig,
  buildPronunciationAssessmentHeader,
  parseAssessmentResult,
  buildAssessmentDiagnostic
} = require('./assess-helpers');

const REFERENCE_TEXT = 'I would like a cup of coffee and a bottle of water.';
const SHORT_AUDIO_TEXT = 'I would like coffee.';
const DIFFERENT_AUDIO_TEXT = 'The weather is beautiful today.';

function loadLocalSettings(){
  const file = path.join(__dirname, '..', '..', 'local.settings.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  return json.Values || {};
}

function requireSpeechSettings(values){
  const key = String(values.AZURE_SPEECH_KEY || '').trim();
  const region = String(values.AZURE_SPEECH_REGION || '').trim();
  if(!key || key === 'YOUR_KEY_HERE' || !region){
    throw new Error('Speech settings are missing from api/local.settings.json');
  }
  return { key, region };
}

async function synthesizeWav(key, region, text){
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-AvaNeural">${text}</voice></speak>`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      'User-Agent': 'english-pronunciation-assess-diagnostic'
    },
    body: ssml,
    signal: AbortSignal.timeout(15000)
  });
  if(!response.ok){
    throw new Error(`Azure TTS failed with HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function callAssessment(key, region, referenceText, wav){
  const config = buildPronunciationAssessmentConfig(referenceText);
  const header = buildPronunciationAssessmentHeader(referenceText);
  const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
  assert.equal(decoded.EnableMiscue, true);
  assert.equal(decoded.Granularity, 'Phoneme');
  assert.equal('EnableProsodyAssessment' in decoded, false);
  assert.equal(decoded.ReferenceText, referenceText);

  const response = await fetch(getAssessUrl(region), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Accept': 'application/json',
      'Pronunciation-Assessment': header,
      'User-Agent': 'english-pronunciation-assess-diagnostic'
    },
    body: wav,
    signal: AbortSignal.timeout(20000)
  });
  if(!response.ok){
    throw new Error(`Assess diagnostic failed with status ${response.status}`);
  }
  const azureJson = await response.json();
  const parsed = parseAssessmentResult(azureJson);
  if(!parsed.ok){
    throw new Error(`Assessment parse failed: ${parsed.error}`);
  }
  return {
    config,
    azureJson,
    parsed,
    diagnostic: buildAssessmentDiagnostic(referenceText, parsed, azureJson)
  };
}

function compactSummary(label, audioText, result){
  return {
    test: label,
    audioSpoken: audioText,
    referenceText: result.diagnostic.referenceText,
    recognizedText: result.diagnostic.recognizedText,
    recognizedLexical: result.diagnostic.recognizedLexical,
    PronScore: result.diagnostic.PronScore,
    AccuracyScore: result.diagnostic.AccuracyScore,
    FluencyScore: result.diagnostic.FluencyScore,
    CompletenessScore: result.diagnostic.CompletenessScore,
    totalWords: result.diagnostic.totalWords,
    words: result.diagnostic.words,
    lowAccuracyWords: result.diagnostic.lowAccuracyWords,
    veryLowAccuracyWords: result.diagnostic.veryLowAccuracyWords,
    lowAccuracyRatio: result.diagnostic.lowAccuracyRatio,
    mispronunciationCount: result.diagnostic.mispronunciationCount,
    omissionCount: result.diagnostic.omissionCount,
    insertionCount: result.diagnostic.insertionCount,
    totalPhonemes: result.diagnostic.totalPhonemes,
    lowAccuracyPhonemes: result.diagnostic.lowAccuracyPhonemes,
    veryLowAccuracyPhonemes: result.diagnostic.veryLowAccuracyPhonemes,
    lowPhonemeRatio: result.diagnostic.lowPhonemeRatio,
    hasWordAccuracy: result.diagnostic.hasWordAccuracy,
    hasErrorType: result.diagnostic.hasErrorType,
    hasSyllableData: result.diagnostic.hasSyllableData,
    hasPhonemeData: result.diagnostic.hasPhonemeData,
    rawNBestKeys: result.diagnostic.rawNBestKeys,
    rawSampleWordKeys: result.diagnostic.rawSampleWordKeys,
    flags: result.diagnostic.flags,
    config: result.config
  };
}

async function main(){
  assert.equal(ENABLE_PROSODY_ASSESSMENT, false);
  const { key, region } = requireSpeechSettings(loadLocalSettings());

  const fullWav = await synthesizeWav(key, region, REFERENCE_TEXT);
  const shortWav = await synthesizeWav(key, region, SHORT_AUDIO_TEXT);
  const differentWav = await synthesizeWav(key, region, DIFFERENT_AUDIO_TEXT);

  const testA = await callAssessment(key, region, REFERENCE_TEXT, fullWav);
  const testB = await callAssessment(key, region, REFERENCE_TEXT, shortWav);
  const testC = await callAssessment(key, region, REFERENCE_TEXT, differentWav);

  const report = {
    regionUsed: region,
    prosodyEnabled: ENABLE_PROSODY_ASSESSMENT,
    testA: compactSummary('A-full-match-tts', REFERENCE_TEXT, testA),
    testB: compactSummary('B-omission-tts', SHORT_AUDIO_TEXT, testB),
    testC: compactSummary('C-different-sentence-tts', DIFFERENT_AUDIO_TEXT, testC),
    testD: {
      test: 'D-mispronounce-coffee-bottle-water',
      skipped: true,
      reason: 'Cannot reliably synthesize human mispronunciations with Azure TTS. Needs a real microphone recording.'
    }
  };

  console.log('assess diagnostic tests completed');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(error && error.message ? error.message : 'diagnostic test failed');
  process.exit(1);
});
