'use strict';

const fs = require('node:fs');
const path = require('node:path');

function loadLocalSettings(){
  const file = path.join(__dirname, '..', '..', 'local.settings.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).Values || {};
}

async function synth(key, region, text){
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      'User-Agent': 'english-pronunciation-detail-ui-test'
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-AvaNeural">${text}</voice></speak>`
  });
  if(!res.ok) throw new Error('TTS ' + res.status);
  return Buffer.from(await res.arrayBuffer());
}

async function assess(text, wav){
  const res = await fetch('http://localhost:8080/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8080' },
    body: JSON.stringify({ text, audioBase64: wav.toString('base64') })
  });
  const payload = await res.json();
  const words = payload.words || [];
  const types = {};
  words.forEach(w => { types[w.errorType || 'None'] = (types[w.errorType || 'None'] || 0) + 1; });
  return {
    status: res.status,
    recognizedText: payload.recognizedText,
    types,
    issues: payload.issues,
    words: words.map(w => ({
      word: w.word,
      errorType: w.errorType,
      accuracyScore: w.accuracyScore,
      phonemes: [
        ...(w.syllables || []).flatMap(s => s.phonemes || []),
        ...(w.phonemes || [])
      ].map(p => ({ p: p.phoneme, s: p.accuracyScore }))
    })),
    payload
  };
}

async function main(){
  const env = loadLocalSettings();
  const key = env.AZURE_SPEECH_KEY;
  const region = env.AZURE_SPEECH_REGION;
  const cases = [
    { name: 'insert-world', audio: 'Hello world.', ref: 'Hello.' },
    { name: 'insert-extra', audio: 'Hello particularly extra.', ref: 'Hello.' },
    { name: 'insert-yes', audio: 'I would like a cup of coffee and a bottle of water yes yes.', ref: 'I would like a cup of coffee and a bottle of water.' },
    { name: 'coffee-copy', audio: 'I like copy.', ref: 'I like coffee.' }
  ];
  const extra = {};
  for(const c of cases){
    const wav = await synth(key, region, c.audio);
    const result = await assess(c.ref, wav);
    extra[c.name] = result;
    console.log(c.name, result.status, JSON.stringify(result.types), result.recognizedText);
    console.log(JSON.stringify(result.words));
    console.log('issues', JSON.stringify(result.issues));
    console.log('---');
  }
  const prev = JSON.parse(fs.readFileSync('/tmp/assess-ui-payloads.json', 'utf8'));
  prev.insertions = { status: extra['insert-world'].status, payload: extra['insert-world'].payload };
  prev.mispronunciation = { status: extra['coffee-copy'].status, payload: extra['coffee-copy'].payload };
  prev.mispronunciation_think = { status: extra['think-sink'].status, payload: extra['think-sink'].payload };
  prev.mispronunciation_would = { status: extra['would-wood'].status, payload: extra['would-wood'].payload };
  prev.mispronunciation_ship = { status: extra['sheep-ship'].status, payload: extra['sheep-ship'].payload };
  fs.writeFileSync('/tmp/assess-ui-payloads.json', JSON.stringify(prev));
}

main().catch(error => {
  console.error(error && error.message ? error.message : 'probe failed');
  process.exit(1);
});
