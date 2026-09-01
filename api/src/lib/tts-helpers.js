'use strict';

const MAX_TEXT_LENGTH = 200;
const DEFAULT_VOICE = 'en-US-AvaNeural';
const ALLOWED_VOICES = Object.freeze([
  'en-US-AvaNeural',
  'en-US-AndrewNeural',
  'en-US-JennyNeural',
  'en-US-EmmaNeural'
]);

function parseAllowedOrigins(raw){
  return String(raw || '')
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(s => s && s !== '*');
}

function pickCorsOrigin(requestOrigin, allowedList){
  if(!requestOrigin){
    return { ok: true, origin: null };
  }
  if(allowedList.includes(requestOrigin)){
    return { ok: true, origin: requestOrigin };
  }
  return { ok: false, origin: null };
}

function corsHeaders(origin){
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
  if(origin){
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function escapeXml(text){
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validateTtsBody(body){
  if(!body || typeof body !== 'object' || Array.isArray(body)){
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if(!text){
    return { ok: false, error: 'text is required.' };
  }
  if(text.length > MAX_TEXT_LENGTH){
    return { ok: false, error: `text must be ${MAX_TEXT_LENGTH} characters or fewer.` };
  }

  const voice = typeof body.voice === 'string' && body.voice.trim()
    ? body.voice.trim()
    : DEFAULT_VOICE;
  if(!ALLOWED_VOICES.includes(voice)){
    return { ok: false, error: 'voice is not allowed.' };
  }

  return { ok: true, text, voice };
}

function buildSsml(text, voice){
  return [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`,
    `<voice name="${escapeXml(voice)}">${escapeXml(text)}</voice>`,
    `</speak>`
  ].join('');
}

function getTtsUrl(region){
  const safeRegion = String(region || '').trim().toLowerCase();
  if(!/^[a-z0-9]+$/.test(safeRegion)){
    return null;
  }
  return `https://${safeRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
}

module.exports = {
  MAX_TEXT_LENGTH,
  DEFAULT_VOICE,
  ALLOWED_VOICES,
  parseAllowedOrigins,
  pickCorsOrigin,
  corsHeaders,
  escapeXml,
  validateTtsBody,
  buildSsml,
  getTtsUrl
};
