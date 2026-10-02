#!/usr/bin/env node
// TEMP KK PHONETIC FEATURE
// 本機一次性／可重跑腳本：用 Azure Speech SSML <phoneme alphabet="ipa"> 產生
// assets/kk/audio/{id}.mp3（每個音連續 3 次）。不修改 js/tts.js 或 /api/tts。
// Key 只從 api/local.settings.json 讀取，不會寫進前端或 git。
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SETTINGS_FILE = path.join(ROOT, 'api', 'local.settings.json');
const DATA_FILE = path.join(ROOT, 'js', 'kk-data.js');
const OUT_DIR = path.join(ROOT, 'assets', 'kk', 'audio');
const ZIP_FILE = path.join(ROOT, 'assets', 'kk', 'kk-phonemes.zip');
const VOICE = 'en-US-AvaNeural';
const BREAK_MS = 400;
const MIN_BYTES = 800;

function loadPhonemes() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(DATA_FILE, 'utf8'), ctx);
  const data = ctx.window.KK_PHONEMES;
  if (!data || !Array.isArray(data.all) || data.all.length !== 41) {
    throw new Error('js/kk-data.js did not expose 41 phonemes.');
  }
  return data.all;
}

function loadSpeechSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    throw new Error('Missing api/local.settings.json');
  }
  const values = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')).Values || {};
  const key = String(values.AZURE_SPEECH_KEY || '').trim();
  const region = String(values.AZURE_SPEECH_REGION || '').trim().toLowerCase();
  if (!key || key === 'YOUR_KEY_HERE' || !/^[a-z0-9]+$/.test(region)) {
    throw new Error('Azure Speech is not configured.');
  }
  return {
    key,
    url: `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
  };
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPhonemeSsml(ipa) {
  const ph = escapeXml(ipa);
  const unit = `<phoneme alphabet="ipa" ph="${ph}">${ph}</phoneme>`;
  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">',
    `<voice name="${VOICE}">`,
    `${unit}<break time="${BREAK_MS}ms"/>${unit}<break time="${BREAK_MS}ms"/>${unit}`,
    '</voice></speak>'
  ].join('');
}

async function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function synthesize(settings, ipa) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(settings.url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': settings.key,
        'Content-Type': 'application/ssml+xml; charset=utf-8',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'english-pronunciation-kk-phonemes'
      },
      body: buildPhonemeSsml(ipa),
      signal: AbortSignal.timeout(20000)
    });
    lastStatus = response.status;
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < MIN_BYTES) {
        throw new Error('audio too small (' + buffer.length + ' bytes)');
      }
      return buffer;
    }
    if (response.status === 429 || response.status >= 500) {
      await sleep(400 * attempt);
      continue;
    }
    const detail = await response.text().catch(function () {
      return '';
    });
    throw new Error('TTS HTTP ' + response.status + (detail ? ' ' + detail.slice(0, 180) : ''));
  }
  throw new Error('TTS HTTP ' + lastStatus + ' after retries');
}

function writeZip() {
  const files = fs.readdirSync(OUT_DIR).filter(function (name) {
    return name.endsWith('.mp3');
  }).map(function (name) {
    return path.join(OUT_DIR, name);
  });
  const retry = spawnSync('zip', ['-j', '-q', ZIP_FILE].concat(files), { cwd: ROOT });
  if (retry.status !== 0) {
    throw new Error('zip failed');
  }
}

async function main() {
  const phonemes = loadPhonemes();
  const settings = loadSpeechSettings();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const item of phonemes) {
    const outFile = path.join(OUT_DIR, item.id + '.mp3');
    const audio = await synthesize(settings, item.azureIpa);
    fs.writeFileSync(outFile, audio);
    process.stdout.write(item.id + ' /' + item.symbol + '/ ' + audio.length + ' bytes\n');
    await sleep(120);
  }

  writeZip();
  const zipBytes = fs.statSync(ZIP_FILE).size;
  process.stdout.write('zip ' + zipBytes + ' bytes, files ' + phonemes.length + '\n');
}

main().catch(function (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
