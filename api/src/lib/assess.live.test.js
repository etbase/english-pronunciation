'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {
  ENABLE_PROSODY_ASSESSMENT,
  getAssessUrl,
  buildPronunciationAssessmentHeader,
  parseAssessmentResult
} = require('./assess-helpers');

function loadLocalSettings(){
  const file = path.join(__dirname, '..', '..', 'local.settings.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  return json.Values || {};
}

function requireSpeechSettings(values){
  const key = String(values.AZURE_SPEECH_KEY || '').trim();
  const region = String(values.AZURE_SPEECH_REGION || '').trim();
  if(!key || key === 'YOUR_KEY_HERE' || !region){
    throw new Error('Speech settings are missing.');
  }
  return { key, region };
}

async function synthesizeReferenceWav(key, region, text){
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-AvaNeural">${text}</voice></speak>`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      'User-Agent': 'english-pronunciation-assess-live-test'
    },
    body: ssml,
    signal: AbortSignal.timeout(15000)
  });
  if(!response.ok){
    throw new Error(`TTS live test failed with status ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function callPronunciationAssessment(key, region, text, wav){
  const url = getAssessUrl(region);
  const header = buildPronunciationAssessmentHeader(text);
  assert.equal(Buffer.from(header, 'base64').toString('utf8').includes('EnableProsodyAssessment'), false);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Accept': 'application/json',
      'Pronunciation-Assessment': header,
      'User-Agent': 'english-pronunciation-assess-live-test'
    },
    body: wav,
    signal: AbortSignal.timeout(20000)
  });
  if(!response.ok){
    throw new Error(`Assess live test failed with status ${response.status}`);
  }
  return response.json();
}

async function main(){
  assert.equal(ENABLE_PROSODY_ASSESSMENT, false);
  const { key, region } = requireSpeechSettings(loadLocalSettings());
  const text = 'Hello.';
  const wav = await synthesizeReferenceWav(key, region, text);
  const azureJson = await callPronunciationAssessment(key, region, text, wav);
  const parsed = parseAssessmentResult(azureJson);

  if(!parsed.ok){
    throw new Error(`Assessment parse failed: ${parsed.error}`);
  }

  assert.equal(typeof parsed.scores.overall, 'number');
  assert.equal(typeof parsed.scores.accuracy, 'number');
  assert.equal(typeof parsed.scores.fluency, 'number');
  assert.equal(typeof parsed.scores.completeness, 'number');
  assert.equal(parsed.prosody.enabled, false);
  assert.ok(Array.isArray(parsed.words));
  assert.ok(parsed.words.length > 0, 'word-level data missing');
  const hasSyllable = parsed.words.some(word => word.syllables.length > 0);
  const hasPhoneme = parsed.words.some(word => word.syllables.some(s => s.phonemes.length > 0) || word.phonemes.length > 0);
  assert.equal(hasSyllable, true, 'syllable-level data missing');
  assert.equal(hasPhoneme, true, 'phoneme-level data missing');

  const extraWav = await synthesizeReferenceWav(key, region, 'Hello world.');
  const inserted = await callPronunciationAssessment(key, region, 'Hello.', extraWav);
  const insertedParsed = parseAssessmentResult(inserted);
  if(!insertedParsed.ok){
    throw new Error(`Insertion parse failed: ${insertedParsed.error}`);
  }
  const omitted = await callPronunciationAssessment(key, region, 'Hello world.', wav);
  const omittedParsed = parseAssessmentResult(omitted);
  if(!omittedParsed.ok){
    throw new Error(`Omission parse failed: ${omittedParsed.error}`);
  }

  const summary = {
    recognitionStatus: azureJson.RecognitionStatus,
    recognizedText: parsed.recognizedText,
    PronScore: parsed.scores.overall,
    AccuracyScore: parsed.scores.accuracy,
    FluencyScore: parsed.scores.fluency,
    CompletenessScore: parsed.scores.completeness,
    wordCount: parsed.words.length,
    syllableCount: parsed.words.reduce((n, w) => n + w.syllables.length, 0),
    phonemeCount: parsed.words.reduce((n, w) => n + w.phonemes.length + w.syllables.reduce((m, s) => m + s.phonemes.length, 0), 0),
    mispronunciations: parsed.issues.mispronunciations.map(item => item.word),
    omissions: parsed.issues.omissions.map(item => item.word),
    insertions: parsed.issues.insertions.map(item => item.word),
    omissionProbeReference: 'Hello world.',
    omissionProbe: omittedParsed.issues.omissions.map(item => item.word),
    insertionProbeFromLongerAudio: insertedParsed.issues.insertions.map(item => item.word),
    words: parsed.words.map(word => ({
      word: word.word,
      errorType: word.errorType,
      accuracyScore: word.accuracyScore,
      syllables: word.syllables.map(syl => ({
        syllable: syl.syllable,
        accuracyScore: syl.accuracyScore,
        phonemes: syl.phonemes.map(ph => ({ phoneme: ph.phoneme, accuracyScore: ph.accuracyScore }))
      }))
    })),
    prosodyEnabled: parsed.prosody.enabled
  };

  console.log('assess live test passed');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error(error && error.message ? error.message : 'live test failed');
  process.exit(1);
});
