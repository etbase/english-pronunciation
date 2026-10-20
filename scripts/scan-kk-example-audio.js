#!/usr/bin/env node
// TEMP KK PHONETIC FEATURE
// 掃描 assets/kk/examples 內已匯入的 MP3，寫成 js/kk-examples-audio.js。
// 不呼叫 Azure，不產生音檔。
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'assets', 'kk', 'examples');
const OUT = path.join(ROOT, 'js', 'kk-examples-audio.js');

function listMp3(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (name) {
    return name.toLowerCase().endsWith('.mp3');
  }).sort();
}

function main() {
  const payload = {
    base: 'assets/kk/examples/',
    folders: {
      'en-US-AvaNeural': 'female',
      'en-US-GuyNeural': 'male'
    },
    files: {
      female: {
        words: listMp3(path.join(BASE, 'female', 'words')),
        sentences: listMp3(path.join(BASE, 'female', 'sentences'))
      },
      male: {
        words: listMp3(path.join(BASE, 'male', 'words')),
        sentences: listMp3(path.join(BASE, 'male', 'sentences'))
      }
    }
  };
  const source = [
    '// TEMP KK PHONETIC FEATURE',
    '// Snapshot of MP3 files already in assets/kk/examples. Rebuild with:',
    '// node scripts/scan-kk-example-audio.js',
    '(function (global) {',
    '  global.KK_EXAMPLES_AUDIO = ' + JSON.stringify(payload, null, 2) + ';',
    '})(window);',
    ''
  ].join('\n');
  fs.writeFileSync(OUT, source);
}

main();
