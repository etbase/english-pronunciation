'use strict';

const { app } = require('@azure/functions');
const {
  parseAllowedOrigins,
  pickCorsOrigin,
  corsHeaders,
  validateTtsBody,
  buildSsml,
  getTtsUrl
} = require('../lib/tts-helpers');

function jsonResponse(status, payload, origin){
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin)
    },
    jsonBody: payload
  };
}

app.http('tts', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'tts',
  handler: async (request, context) => {
    const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
    const requestOrigin = request.headers.get('origin');
    const cors = pickCorsOrigin(requestOrigin, allowedOrigins);

    if(!cors.ok){
      return jsonResponse(403, { error: 'Origin is not allowed.' }, null);
    }

    if(request.method === 'OPTIONS'){
      return {
        status: 204,
        headers: corsHeaders(cors.origin)
      };
    }

    let body;
    try{
      body = await request.json();
    }catch{
      return jsonResponse(400, { error: 'Request body must be JSON.' }, cors.origin);
    }

    const parsed = validateTtsBody(body);
    if(!parsed.ok){
      return jsonResponse(400, { error: parsed.error }, cors.origin);
    }

    const speechKey = String(process.env.AZURE_SPEECH_KEY || '').trim();
    const speechRegion = String(process.env.AZURE_SPEECH_REGION || '').trim();
    const ttsUrl = getTtsUrl(speechRegion);

    if(!speechKey || speechKey === 'YOUR_KEY_HERE' || !ttsUrl){
      context.log('TTS is not configured.');
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
      context.log(`TTS upstream request failed: ${error && error.name}`);
      return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
    }

    if(!azureResponse.ok){
      context.log(`TTS upstream status ${azureResponse.status}`);
      return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
    }

    const audioBuffer = Buffer.from(await azureResponse.arrayBuffer());
    if(!audioBuffer.length){
      return jsonResponse(502, { error: 'Unable to generate speech.' }, cors.origin);
    }

    context.log(`TTS ok, ${parsed.text.length} chars, ${parsed.voice}`);

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
});
