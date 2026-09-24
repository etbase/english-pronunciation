'use strict';

function parseAuthorizationHeader(header){
  const raw = String(header || '').trim();
  if(!raw) return null;
  const match = /^Bearer\s+(\S+)/i.exec(raw);
  return match ? match[1] : null;
}

function firebaseWebApiKey(env){
  return String((env && env.FIREBASE_WEB_API_KEY) || '').trim();
}

function isFirebaseAuthConfigured(env){
  return !!firebaseWebApiKey(env);
}

function parseVipEmails(env){
  return String((env && env.PROSODY_VIP_EMAILS) || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function isVipEmail(email, env){
  const needle = String(email || '').trim().toLowerCase();
  if(!needle) return false;
  return parseVipEmails(env).includes(needle);
}

async function lookupFirebaseUser(idToken, env){
  const key = firebaseWebApiKey(env);
  if(!key || !idToken) return null;

  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(10000)
    }
  );
  if(!response.ok) return null;

  let json;
  try{
    json = await response.json();
  }catch{
    return null;
  }

  const user = Array.isArray(json.users) ? json.users[0] : null;
  if(!user) return null;

  return {
    uid: String(user.localId || ''),
    email: String(user.email || '').trim(),
    emailVerified: user.emailVerified === true
  };
}

function loginRequired(){
  return {
    ok: false,
    status: 401,
    code: 'LOGIN_REQUIRED',
    error: 'Please sign in to use this service.'
  };
}

async function requireSpeechAuth({ env, authorization }){
  if(!isFirebaseAuthConfigured(env)){
    return {
      ok: true,
      required: false,
      user: null,
      enableProsody: false
    };
  }

  const idToken = parseAuthorizationHeader(authorization);
  if(!idToken) return loginRequired();

  let user;
  try{
    user = await lookupFirebaseUser(idToken, env);
  }catch{
    return loginRequired();
  }

  if(!user || !user.email || !user.emailVerified){
    return loginRequired();
  }

  return {
    ok: true,
    required: true,
    user,
    enableProsody: isVipEmail(user.email, env)
  };
}

module.exports = {
  parseAuthorizationHeader,
  firebaseWebApiKey,
  isFirebaseAuthConfigured,
  parseVipEmails,
  isVipEmail,
  lookupFirebaseUser,
  requireSpeechAuth
};
