'use strict';

const {
  pickCorsOrigin,
  parseAllowedOrigins,
  corsHeaders,
  validateTtsBody,
  buildSsml,
  getTtsUrl
} = require('./tts-helpers');
const { requireSpeechAuth } = require('./firebase-auth');

function jsonResponse(status, payload, origin){
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin)
    },
    jsonBody: payload
  };
}

async function runTts({ method, origin, body, env, authorization, log }){
  const logger = typeof log === 'function' ? log : () => {};
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
  const cors = pickCorsOrigin(origin || null, allowedOrigins);

  if(!cors.ok){
    return jsonResponse(403, { error: 'Origin is not allowed.' }, null);
  }

  if(method === 'OPTIONS'){
    return {
      status: 204,
      headers: corsHeaders(cors.origin),
      jsonBody: null
    };
  }

  if(method !== 'POST'){
    return jsonResponse(405, { error: 'Method not allowed.' }, cors.origin);
  }

  const auth = await requireSpeechAuth({ env, authorization });
  if(!auth.ok){
    return jsonResponse(auth.status, { error: auth.error, code: auth.code }, cors.origin);
  }

  const parsed = validateTtsBody(body);
  if(!parsed.ok){
    return jsonResponse(400, { error: parsed.error }, cors.origin);
  }

  const speechKey = String(env.AZURE_SPEECH_KEY || '').trim();
  const speechRegion = String(env.AZURE_SPEECH_REGION || '').trim();
  const ttsUrl = getTtsUrl(speechRegion);
  if(!speechKey || speechKey === 'YOUR_KEY_HERE' || !ttsUrl){
    logger('TTS is not configured.');
    return jsonResponse(503, { error: 'Speech service is not configured.' }, cors.origin);
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
    return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
  }

  if(!azureResponse.ok){
    logger(`TTS upstream status ${azureResponse.status}`);
    return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
  }

  const audioBuffer = Buffer.from(await azureResponse.arrayBuffer());
  if(!audioBuffer.length){
    return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
  }

  logger(`TTS ok, ${parsed.text.length} chars, ${parsed.voice}`);

  return {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
      ...corsHeaders(cors.origin)
    },
    body: audioBuffer,
    jsonBody: null
  };
}

module.exports = {
  jsonResponse,
  runTts
};
