'use strict';

const assert = require('node:assert/strict');
const {
  parseAuthorizationHeader,
  isFirebaseAuthConfigured,
  parseVipEmails,
  isVipEmail,
  requireSpeechAuth
} = require('./firebase-auth');
const { runAssess } = require('./assess-run');
const { runTts } = require('./tts-run');
const { corsHeaders } = require('./tts-helpers');

assert.equal(parseAuthorizationHeader(''), null);
assert.equal(parseAuthorizationHeader('Bearer abc.def'), 'abc.def');
assert.equal(parseAuthorizationHeader('bearer xyz'), 'xyz');
assert.equal(isFirebaseAuthConfigured({}), false);
assert.equal(isFirebaseAuthConfigured({ FIREBASE_WEB_API_KEY: '  ' }), false);
assert.equal(isFirebaseAuthConfigured({ FIREBASE_WEB_API_KEY: 'web-key' }), true);
assert.deepEqual(parseVipEmails({ PROSODY_VIP_EMAILS: 'A@x.com, b@x.com ,,' }), ['a@x.com', 'b@x.com']);
assert.equal(isVipEmail('A@x.com', { PROSODY_VIP_EMAILS: 'a@x.com' }), true);
assert.equal(isVipEmail('other@x.com', { PROSODY_VIP_EMAILS: 'a@x.com' }), false);

assert.equal(corsHeaders(null)['Access-Control-Allow-Headers'].includes('Authorization'), true);

async function main(){
  const anonymous = await requireSpeechAuth({ env: {}, authorization: '' });
  assert.equal(anonymous.ok, true);
  assert.equal(anonymous.required, false);
  assert.equal(anonymous.enableProsody, false);

  const missing = await requireSpeechAuth({
    env: { FIREBASE_WEB_API_KEY: 'web-key' },
    authorization: ''
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 401);
  assert.equal(missing.code, 'LOGIN_REQUIRED');

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      users: [{ localId: 'uid-1', email: 'Vip@Example.com', emailVerified: true }]
    })
  });
  try{
    const vip = await requireSpeechAuth({
      env: {
        FIREBASE_WEB_API_KEY: 'web-key',
        PROSODY_VIP_EMAILS: 'vip@example.com'
      },
      authorization: 'Bearer fake-token'
    });
    assert.equal(vip.ok, true);
    assert.equal(vip.enableProsody, true);
    assert.equal(vip.user.email, 'Vip@Example.com');

    const guest = await requireSpeechAuth({
      env: {
        FIREBASE_WEB_API_KEY: 'web-key',
        PROSODY_VIP_EMAILS: 'other@example.com'
      },
      authorization: 'Bearer fake-token'
    });
    assert.equal(guest.ok, true);
    assert.equal(guest.enableProsody, false);
  }finally{
    global.fetch = originalFetch;
  }

  const assessOptions = await runAssess({
    method: 'OPTIONS',
    origin: null,
    env: { FIREBASE_WEB_API_KEY: 'web-key' },
    log: () => {}
  });
  assert.equal(assessOptions.status, 204);

  const assessDenied = await runAssess({
    method: 'POST',
    origin: null,
    body: { text: 'Hello', audioBase64: 'aa' },
    env: {
      FIREBASE_WEB_API_KEY: 'web-key',
      AZURE_SPEECH_KEY: 'not-used',
      AZURE_SPEECH_REGION: 'eastus'
    },
    authorization: '',
    log: () => {}
  });
  assert.equal(assessDenied.status, 401);
  assert.equal(assessDenied.jsonBody.code, 'LOGIN_REQUIRED');

  const ttsDenied = await runTts({
    method: 'POST',
    origin: null,
    body: { text: 'Hello' },
    env: {
      FIREBASE_WEB_API_KEY: 'web-key',
      AZURE_SPEECH_KEY: 'not-used',
      AZURE_SPEECH_REGION: 'eastus'
    },
    authorization: '',
    log: () => {}
  });
  assert.equal(ttsDenied.status, 401);
  assert.equal(ttsDenied.jsonBody.code, 'LOGIN_REQUIRED');

  console.log('firebase-auth tests passed');
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
