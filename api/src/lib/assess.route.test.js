'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { runAssess } = require('./assess-run');
const { ENABLE_PROSODY_ASSESSMENT } = require('./assess-helpers');

function loadEnv(){
  const file = path.join(__dirname, '..', '..', 'local.settings.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).Values || {};
}

async function synthesizeReferenceWav(env, text){
  const region = env.AZURE_SPEECH_REGION;
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm',
      'User-Agent': 'english-pronunciation-assess-route-test'
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-AvaNeural">${text}</voice></speak>`,
    signal: AbortSignal.timeout(15000)
  });
  if(!response.ok) throw new Error(`TTS failed ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function startRouteServer(env){
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if(req.url !== '/api/assess'){
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = null;
      if(req.method === 'POST'){
        try{ body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch{
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Request body must be JSON.', code: 'BAD_REQUEST' }));
          return;
        }
      }
      const result = await runAssess({
        method: req.method,
        origin: req.headers.origin,
        body,
        env,
        log: () => {}
      });
      res.writeHead(result.status, result.headers);
      res.end(result.jsonBody ? JSON.stringify(result.jsonBody) : '');
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main(){
  assert.equal(ENABLE_PROSODY_ASSESSMENT, false);
  const env = loadEnv();
  const text = 'Hello.';
  const wav = await synthesizeReferenceWav(env, text);
  const server = await startRouteServer(env);
  const { port } = server.address();
  try{
    const options = await fetch(`http://127.0.0.1:${port}/api/assess`, { method: 'OPTIONS' });
    assert.equal(options.status, 204);

    const bad = await fetch(`http://127.0.0.1:${port}/api/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ text, audioBase64: wav.toString('base64') })
    });
    assert.equal(bad.status, 403);

    const response = await fetch(`http://127.0.0.1:${port}/api/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, audioBase64: wav.toString('base64') })
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(typeof payload.scores.overall, 'number');
    assert.equal(typeof payload.scores.accuracy, 'number');
    assert.equal(typeof payload.scores.fluency, 'number');
    assert.equal(typeof payload.scores.completeness, 'number');
    assert.equal(payload.prosody.enabled, false);
    assert.equal('prosodyScore' in payload.scores, false);
    assert.ok(payload.words.length > 0);
    assert.ok(payload.words.some(word => word.syllables.length > 0));
    assert.ok(payload.words.some(word => word.syllables.some(s => s.phonemes.length > 0)));
    console.log('assess route test passed');
    console.log(JSON.stringify({
      status: response.status,
      PronScore: payload.scores.overall,
      AccuracyScore: payload.scores.accuracy,
      FluencyScore: payload.scores.fluency,
      CompletenessScore: payload.scores.completeness,
      wordCount: payload.words.length,
      issues: payload.issues,
      prosody: payload.prosody
    }, null, 2));
  }finally{
    server.close();
  }
}

main().catch(error => {
  console.error(error && error.message ? error.message : 'route test failed');
  process.exit(1);
});
