'use strict';

// 本機端到端測試：Azure TTS 產生可辨識英文 WAV → POST 本機 /api/assess → 驗證真實 Pronunciation Assessment 分數。
// 需要先執行：node local-dev-server.js
// Speech Key 只從 gitignore 的 local.settings.json 讀取，不會寫進測試輸出。

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { ENABLE_PROSODY_ASSESSMENT, validateWavPcm16kMono } = require('./assess-helpers');

const REFERENCE_TEXT = 'I would like a cup of coffee and a bottle of water.';
const ASSESS_URL = process.env.LOCAL_ASSESS_URL || 'http://localhost:8080/api/assess';
const ORIGIN = process.env.LOCAL_ASSESS_ORIGIN || 'http://localhost:8080';

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

async function synthesizeReferenceWav(key, region, text){
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-AvaNeural">${text}</voice></speak>`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      'User-Agent': 'english-pronunciation-assess-local-e2e'
    },
    body: ssml,
    signal: AbortSignal.timeout(15000)
  });
  if(!response.ok){
    throw new Error(`Azure TTS failed with HTTP ${response.status}`);
  }
  const wav = Buffer.from(await response.arrayBuffer());
  const checked = validateWavPcm16kMono(wav);
  if(!checked.ok){
    throw new Error(`TTS WAV is not valid for assessment: ${checked.error}`);
  }
  return wav;
}

async function postAssess(wav, text){
  let response;
  try{
    response = await fetch(ASSESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN
      },
      body: JSON.stringify({
        text,
        audioBase64: wav.toString('base64')
      }),
      signal: AbortSignal.timeout(30000)
    });
  }catch(error){
    throw new Error(`Cannot reach ${ASSESS_URL}. Start it with: node api/local-dev-server.js (${error && error.message ? error.message : 'fetch failed'})`);
  }

  let payload = null;
  try{ payload = await response.json(); }
  catch{ payload = null; }
  return { response, payload };
}

async function main(){
  assert.equal(ENABLE_PROSODY_ASSESSMENT, false);
  const { key, region } = requireSpeechSettings(loadLocalSettings());
  const wav = await synthesizeReferenceWav(key, region, REFERENCE_TEXT);
  const { response, payload } = await postAssess(wav, REFERENCE_TEXT);

  assert.equal(response.status, 200, `expected HTTP 200 from ${ASSESS_URL}, got ${response.status} ${payload && payload.code ? payload.code : ''} ${payload && payload.error ? payload.error : ''}`);
  assert.ok(payload && payload.scores, 'response missing scores');
  assert.equal(typeof payload.scores.overall, 'number');
  assert.equal(typeof payload.scores.accuracy, 'number');
  assert.equal(typeof payload.scores.fluency, 'number');
  assert.equal(typeof payload.scores.completeness, 'number');
  assert.equal(payload.prosody && payload.prosody.enabled, false);
  assert.ok(Array.isArray(payload.words) && payload.words.length > 0, 'word-level data missing');

  const syllableCount = payload.words.reduce((n, word) => n + (word.syllables || []).length, 0);
  const phonemeCount = payload.words.reduce((n, word) => {
    const leftover = (word.phonemes || []).length;
    const nested = (word.syllables || []).reduce((m, syl) => m + (syl.phonemes || []).length, 0);
    return n + leftover + nested;
  }, 0);
  const errorTypes = payload.words.map(word => word.errorType).filter(type => type && type !== 'None');

  assert.ok(syllableCount > 0, 'syllable-level data missing');
  assert.ok(phonemeCount > 0, 'phoneme-level data missing');

  const summary = {
    audioSource: 'Azure TTS riff-16khz-16bit-mono-pcm (en-US-AvaNeural)',
    referenceText: REFERENCE_TEXT,
    assessUrl: ASSESS_URL,
    wavBytes: wav.length,
    httpStatus: response.status,
    PronScore: payload.scores.overall,
    AccuracyScore: payload.scores.accuracy,
    FluencyScore: payload.scores.fluency,
    CompletenessScore: payload.scores.completeness,
    recognizedText: payload.recognizedText || '',
    wordCount: payload.words.length,
    syllableCount,
    phonemeCount,
    errorTypes,
    regionUsed: region,
    prosodyEnabled: payload.prosody.enabled
  };

  console.log('assess local e2e passed');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error(error && error.message ? error.message : 'local e2e failed');
  process.exit(1);
});
