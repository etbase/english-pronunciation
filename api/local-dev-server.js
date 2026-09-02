'use strict';

// 本機真人測試用：同一個行程開靜態網站（8080）與 API（7071）。
// 不依賴 Azure Functions Core Tools 的 extension bundle。
// 正式部署仍走 Function App；這個檔案只給本機 Chrome 測試。
// Speech Key 只從 gitignore 的 local.settings.json 讀取，不會送到瀏覽器。

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
  parseAllowedOrigins,
  pickCorsOrigin,
  corsHeaders,
  validateTtsBody,
  buildSsml,
  getTtsUrl
} = require('./src/lib/tts-helpers');
const { runAssess } = require('./src/lib/assess-run');

const ROOT = path.resolve(__dirname, '..');
const SETTINGS_FILE = path.join(__dirname, 'local.settings.json');
const STATIC_PORT = Number(process.env.LOCAL_STATIC_PORT || 8080);
const API_PORT = Number(process.env.LOCAL_API_PORT || 7071);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8'
};

function loadEnv(){
  if(!fs.existsSync(SETTINGS_FILE)){
    throw new Error('Missing api/local.settings.json');
  }
  const json = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  return json.Values || {};
}

function blockedPath(rel){
  const n = rel.replace(/\\/g, '/').toLowerCase();
  if(n.includes('local.settings.json')) return true;
  if(n.includes('.env')) return true;
  if(n === '.git' || n.startsWith('.git/')) return true;
  if(n.includes('node_modules')) return true;
  if(n.startsWith('api/src/') && n.endsWith('.js')) return false;
  return false;
}

function send(res, status, headers, body){
  res.writeHead(status, headers);
  res.end(body);
}

function applyResult(res, result, binaryBody){
  send(res, result.status, result.headers || {}, binaryBody !== undefined ? binaryBody : (result.jsonBody ? JSON.stringify(result.jsonBody) : ''));
}

async function readJsonBody(req){
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if(!raw.trim()) return {};
  return JSON.parse(raw);
}

async function runTts({ method, origin, body, env, log }){
  const logger = typeof log === 'function' ? log : () => {};
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
  const cors = pickCorsOrigin(origin || null, allowedOrigins);
  if(!cors.ok){
    return {
      status: 403,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(null) },
      jsonBody: { error: 'Origin is not allowed.' }
    };
  }
  if(method === 'OPTIONS'){
    return { status: 204, headers: corsHeaders(cors.origin), jsonBody: null };
  }
  if(method !== 'POST'){
    return {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: 'Method not allowed.' }
    };
  }

  const parsed = validateTtsBody(body);
  if(!parsed.ok){
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: parsed.error }
    };
  }

  const speechKey = String(env.AZURE_SPEECH_KEY || '').trim();
  const speechRegion = String(env.AZURE_SPEECH_REGION || '').trim();
  const ttsUrl = getTtsUrl(speechRegion);
  if(!speechKey || speechKey === 'YOUR_KEY_HERE' || !ttsUrl){
    return {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: 'Speech service is not configured.' }
    };
  }

  let azureResponse;
  try{
    azureResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'english-pronunciation-tts'
      },
      body: buildSsml(parsed.text, parsed.voice),
      signal: AbortSignal.timeout(15000)
    });
  }catch(error){
    logger(`TTS upstream request failed: ${error && error.name}`);
    return {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: 'Unable to generate speech.' }
    };
  }

  if(!azureResponse.ok){
    logger(`TTS upstream status ${azureResponse.status}`);
    return {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: 'Unable to generate speech.' }
    };
  }

  const audioBuffer = Buffer.from(await azureResponse.arrayBuffer());
  if(!audioBuffer.length){
    return {
      status: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(cors.origin) },
      jsonBody: { error: 'Unable to generate speech.' }
    };
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      ...corsHeaders(cors.origin)
    },
    body: audioBuffer
  };
}

function serveStatic(req, res){
  const url = new URL(req.url, 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname);
  if(rel === '/') rel = '/index.html';
  rel = rel.replace(/^\/+/, '');
  if(blockedPath(rel)){
    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
    return;
  }
  const file = path.normalize(path.join(ROOT, rel));
  if(!file.startsWith(ROOT + path.sep) && file !== ROOT){
    send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
    return;
  }
  fs.readFile(file, (err, data) => {
    if(err){
      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if(ext === '.html' || ext === '.js' || ext === '.css'){
      headers['Cache-Control'] = 'no-store';
    }
    send(res, 200, headers, data);
  });
}

function isLoopbackOrigin(origin){
  if(!origin) return false;
  try{
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }catch{
    return false;
  }
}

async function serveApi(req, res, env){
  const url = new URL(req.url, 'http://127.0.0.1');
  const origin = req.headers.origin || null;
  const method = req.method || 'GET';
  const localEnv = isLoopbackOrigin(origin)
    ? { ...env, ALLOWED_ORIGINS: String(env.ALLOWED_ORIGINS || '') + ',' + origin }
    : env;

  if(url.pathname === '/api/assess'){
    let body = null;
    if(method === 'POST'){
      try{ body = await readJsonBody(req); }
      catch{
        console.log(`API POST /api/assess origin=${origin || '-'} bad-json`);
        applyResult(res, {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          jsonBody: { error: 'Request body must be JSON.', code: 'BAD_REQUEST' }
        });
        return;
      }
    }
    const audioChars = body && typeof body.audioBase64 === 'string' ? body.audioBase64.length : 0;
    console.log(`API ${method} /api/assess origin=${origin || '-'} audioChars=${audioChars} textChars=${body && typeof body.text === 'string' ? body.text.trim().length : 0}`);
    const result = await runAssess({ method, origin, body, env: localEnv, log: console.log });
    console.log(`API /api/assess -> ${result.status}`);
    applyResult(res, result);
    return;
  }

  if(url.pathname === '/api/tts'){
    let body = null;
    if(method === 'POST'){
      try{ body = await readJsonBody(req); }
      catch{
        applyResult(res, {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          jsonBody: { error: 'Request body must be JSON.' }
        });
        return;
      }
    }
    const result = await runTts({ method, origin, body, env: localEnv, log: console.log });
    applyResult(res, result, result.body);
    return;
  }

  send(res, 404, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ error: 'Not found.' }));
}

function listen(server, port, label){
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    // 不綁死 127.0.0.1，讓 Chrome 走 localhost（IPv6 ::1）或 127.0.0.1 都能連上。
    server.listen(port, () => resolve());
  }).then(() => {
    console.log(`${label} http://127.0.0.1:${port} and http://localhost:${port}`);
  });
}

async function main(){
  const env = loadEnv();
  if(!String(env.AZURE_SPEECH_KEY || '').trim() || env.AZURE_SPEECH_KEY === 'YOUR_KEY_HERE'){
    throw new Error('AZURE_SPEECH_KEY is not set in api/local.settings.json');
  }

  const staticServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if(url.pathname.startsWith('/api/')){
      serveApi(req, res, env).catch((error) => {
        console.error(error && error.name);
        if(!res.headersSent){
          send(res, 500, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ error: 'Server error.', code: 'ASSESS_FAILED' }));
        }
      });
      return;
    }
    serveStatic(req, res);
  });
  const apiServer = http.createServer((req, res) => {
    serveApi(req, res, env).catch((error) => {
      console.error(error && error.name);
      if(!res.headersSent){
        send(res, 500, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify({ error: 'Server error.', code: 'ASSESS_FAILED' }));
      }
    });
  });

  await listen(staticServer, STATIC_PORT, 'Website');
  await listen(apiServer, API_PORT, 'API');
  console.log('Open http://localhost:8080/ in Chrome');
  console.log('Local API is same-origin: http://localhost:8080/api/assess');
  console.log('Speech Key stays in api/local.settings.json (not sent to the browser).');
}

main().catch((error) => {
  console.error(error && error.message ? error.message : 'Failed to start local servers');
  process.exit(1);
});
