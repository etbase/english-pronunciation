'use strict';

const { pickCorsOrigin, parseAllowedOrigins, corsHeaders } = require('./tts-helpers');
const {
  ENABLE_PROSODY_ASSESSMENT,
  getAssessUrl,
  buildPronunciationAssessmentHeader,
  validateAssessBody,
  parseAssessmentResult,
  buildAssessmentDiagnostic
} = require('./assess-helpers');

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

function redactDebugText(value){
  return String(value || '')
    .replace(/Ocp-Apim-Subscription-Key/gi, '[redacted]')
    .replace(/[0-9a-f]{32}/gi, '[redacted]')
    .slice(0, 500);
}

function describeFetchError(error){
  if(!error) return 'unknown';
  const parts = [error.name, error.message].filter(Boolean);
  const cause = error.cause;
  if(cause && typeof cause === 'object'){
    if(cause.code) parts.push('cause=' + cause.code);
    if(cause.message) parts.push(redactDebugText(cause.message));
  }
  return redactDebugText(parts.join(' '));
}

function isLocalDebugOrigin(origin){
  if(!origin) return false;
  try{
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }catch{
    return false;
  }
}

async function runAssess({ method, origin, body, env, log }){
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

  const parsed = validateAssessBody(body);
  if(!parsed.ok){
    return jsonResponse(400, { error: parsed.error, code: 'BAD_REQUEST' }, cors.origin);
  }

  const speechKey = String(env.AZURE_SPEECH_KEY || '').trim();
  const speechRegion = String(env.AZURE_SPEECH_REGION || '').trim();
  const assessUrl = getAssessUrl(speechRegion);

  if(!speechKey || speechKey === 'YOUR_KEY_HERE' || !assessUrl){
    logger('Assess is not configured.');
    return jsonResponse(503, { error: 'Speech service is not configured.', code: 'NOT_CONFIGURED' }, cors.origin);
  }

  logger(`Assess wav bytes=${parsed.audio.length} textChars=${parsed.text.length} region-host=stt.speech.microsoft.com EnableMiscue=true Granularity=Phoneme Prosody=${ENABLE_PROSODY_ASSESSMENT ? 'on' : 'off'}`);

  let azureResponse;
  try{
    azureResponse = await fetch(assessUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Accept': 'application/json',
        'Pronunciation-Assessment': buildPronunciationAssessmentHeader(parsed.text),
        'User-Agent': 'english-pronunciation-assess'
      },
      body: parsed.audio,
      signal: AbortSignal.timeout(20000)
    });
  }catch(error){
    logger(`Assess upstream request failed: ${describeFetchError(error)}`);
    return jsonResponse(502, { error: 'Unable to analyze pronunciation.', code: 'ASSESS_FAILED' }, cors.origin);
  }

  if(!azureResponse.ok){
    let azureText = '';
    try{ azureText = await azureResponse.text(); }catch{ azureText = ''; }
    logger(`Assess upstream status ${azureResponse.status} body=${redactDebugText(azureText)}`);
    return jsonResponse(502, { error: 'Unable to analyze pronunciation.', code: 'ASSESS_FAILED' }, cors.origin);
  }

  let azureJson;
  try{
    azureJson = await azureResponse.json();
  }catch{
    logger('Assess upstream JSON parse failed.');
    return jsonResponse(502, { error: 'Unable to analyze pronunciation.', code: 'ASSESS_FAILED' }, cors.origin);
  }

  const result = parseAssessmentResult(azureJson, { audioSeconds: parsed.seconds });
  if(!result.ok){
    if(result.error === 'NO_SPEECH'){
      return jsonResponse(422, { error: 'No clear English speech was recognized. Please record again.', code: 'NO_SPEECH' }, cors.origin);
    }
    logger(`Assess response missing required scores. recognitionStatus=${azureJson && azureJson.RecognitionStatus || '-'} parse=${result.error}`);
    return jsonResponse(502, { error: 'Unable to analyze pronunciation.', code: 'ASSESS_FAILED' }, cors.origin);
  }

  const diagnostic = buildAssessmentDiagnostic(parsed.text, result, azureJson);
  if(isLocalDebugOrigin(origin)){
    logger('Assess diagnostic ' + JSON.stringify(diagnostic));
  }else{
    logger(`Assess ok, ${parsed.text.length} chars, words=${result.words.length}, recognizedChars=${result.recognizedText.length}, omissions=${result.issues.omissions.length}, insertions=${result.issues.insertions.length}, mispronunciations=${result.issues.mispronunciations.length}, prosody=${ENABLE_PROSODY_ASSESSMENT ? 'on' : 'off'}`);
  }

  return jsonResponse(200, {
    scores: result.scores,
    displayScores: result.displayScores,
    recognizedText: result.recognizedText,
    recognizedLexical: result.recognizedLexical,
    words: result.words,
    issues: result.issues,
    diagnostic,
    overallDebug: result.overallDebug,
    prosody: result.prosody,
    lowAccuracyThreshold: result.lowAccuracyThreshold
  }, cors.origin);
}

module.exports = {
  jsonResponse,
  runAssess
};
