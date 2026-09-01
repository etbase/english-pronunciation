'use strict';

const assert = require('node:assert/strict');
const {
  DEFAULT_VOICE,
  escapeXml,
  validateTtsBody,
  buildSsml,
  parseAllowedOrigins,
  pickCorsOrigin,
  getTtsUrl
} = require('./tts-helpers');

assert.equal(escapeXml('a&b<c>"d"\'e'), 'a&amp;b&lt;c&gt;&quot;d&quot;&apos;e');

assert.equal(validateTtsBody(null).ok, false);
assert.equal(validateTtsBody({ text: '   ' }).ok, false);
assert.equal(validateTtsBody({ text: 'x'.repeat(201) }).ok, false);
assert.equal(validateTtsBody({ text: 'Hello', voice: 'en-US-AriaNeural' }).ok, true);
assert.equal(validateTtsBody({ text: 'Hello', voice: 'en-US-GuyNeural' }).ok, true);
assert.equal(validateTtsBody({ text: 'Hello', voice: 'en-US-JennyNeural' }).ok, true);

const valid = validateTtsBody({ text: '  Hello world  ' });
assert.equal(valid.ok, true);
assert.equal(valid.text, 'Hello world');
assert.equal(valid.voice, DEFAULT_VOICE);

const ssml = buildSsml('Hello <world>', 'en-US-AvaNeural');
assert.equal(ssml.includes('Hello &lt;world&gt;'), true);
assert.equal(ssml.includes('en-US-AvaNeural'), true);

assert.deepEqual(
  parseAllowedOrigins('http://localhost:8080, *, https://USERNAME.github.io/'),
  ['http://localhost:8080', 'https://USERNAME.github.io']
);

assert.equal(pickCorsOrigin('https://evil.example', ['https://USERNAME.github.io']).ok, false);
assert.equal(pickCorsOrigin('https://USERNAME.github.io', ['https://USERNAME.github.io']).ok, true);
assert.equal(pickCorsOrigin(null, []).ok, true);

assert.equal(getTtsUrl('eastus'), 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1');
assert.equal(getTtsUrl('../evil'), null);

console.log('tts-helpers tests passed');
