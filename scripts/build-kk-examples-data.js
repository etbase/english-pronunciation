#!/usr/bin/env node
// TEMP KK PHONETIC FEATURE
// 從本機 kk-phonetic-learning 原始碼抽出單字／例句，寫成 js/kk-examples-data.js。
// 不修改來源網站。產出檔供 kk.html 離線使用。
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, '..', 'kk-phonetic-learning');
const OUT_FILE = path.join(ROOT, 'js', 'kk-examples-data.js');

function loadSource() {
  if (!fs.existsSync(path.join(SRC_DIR, 'data.js'))) {
    throw new Error('Cannot find ../kk-phonetic-learning/data.js');
  }
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(SRC_DIR, 'data.js'), 'utf8') +
      '\nthis.vowels=vowels;this.consonants=consonants;this.practiceWords=practiceWords;this.positionWords=positionWords;',
    ctx
  );
  vm.runInContext(
    fs.readFileSync(path.join(SRC_DIR, 'phrases-v2.js'), 'utf8') +
      '\nthis.practicePhrases=practicePhrases;',
    ctx
  );
  return ctx;
}

function plainPhrase(text) {
  return String(text).replace(/[\[\]]/g, '');
}

function shortHash(text) {
  let hash = 2166136261;
  const input = String(text);
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).slice(0, 4);
}

function sanitizeFileName(text) {
  let name = String(text).trim();
  name = name.replace(/[/\\:*?"<>|]/g, '');
  name = name.replace(/[.?!]+$/g, '');
  name = name.replace(/\s+/g, ' ').trim();
  return name || 'audio';
}

function uniqueFileNames(items) {
  const used = Object.create(null);
  items.forEach(function (item) {
    const base = sanitizeFileName(item.text);
    let fileName = base + '.mp3';
    if (used[fileName] && used[fileName] !== item.text) {
      fileName = base + ' ' + shortHash(item.text) + '.mp3';
    }
    while (used[fileName] && used[fileName] !== item.text) {
      fileName = base + ' ' + shortHash(item.text + fileName) + '.mp3';
    }
    used[fileName] = item.text;
    item.fileName = fileName;
  });
}

function main() {
  const src = loadSource();
  const vowels = src.vowels.map(function (row) {
    return { symbol: row[0], kind: 'vowel', example: row[1] };
  });
  const consonants = src.consonants.map(function (row) {
    return { symbol: row[0], kind: 'consonant', example: row[1] };
  });
  const phonemeMeta = vowels.concat(consonants);

  const phonemes = phonemeMeta.map(function (meta) {
    const seenWords = Object.create(null);
    const words = [];
    (src.practiceWords[meta.symbol] || []).concat(src.positionWords[meta.symbol] || []).forEach(function (word) {
      if (!word || seenWords[word]) return;
      seenWords[word] = true;
      words.push(word);
    });
    const sentences = (src.practicePhrases[meta.symbol] || []).map(function (marked) {
      return { text: plainPhrase(marked), marked: marked };
    });
    return {
      symbol: meta.symbol,
      kind: meta.kind,
      example: meta.example,
      words: words,
      sentences: sentences
    };
  });

  const uniqueWordMap = Object.create(null);
  const uniqueSentenceMap = Object.create(null);
  let wordRows = 0;
  let sentenceRows = 0;

  phonemes.forEach(function (entry) {
    entry.words.forEach(function (word) {
      wordRows += 1;
      if (!uniqueWordMap[word]) uniqueWordMap[word] = { text: word, phonemes: [] };
      uniqueWordMap[word].phonemes.push(entry.symbol);
    });
    entry.sentences.forEach(function (sentence) {
      sentenceRows += 1;
      if (!uniqueSentenceMap[sentence.text]) {
        uniqueSentenceMap[sentence.text] = { text: sentence.text, phonemes: [] };
      }
      uniqueSentenceMap[sentence.text].phonemes.push(entry.symbol);
    });
  });

  const uniqueWords = Object.keys(uniqueWordMap).map(function (key) {
    return uniqueWordMap[key];
  });
  const uniqueSentences = Object.keys(uniqueSentenceMap).map(function (key) {
    return uniqueSentenceMap[key];
  });
  uniqueFileNames(uniqueWords);
  uniqueFileNames(uniqueSentences);

  const wordFileByText = Object.create(null);
  uniqueWords.forEach(function (item) {
    wordFileByText[item.text] = item.fileName;
  });
  const sentenceFileByText = Object.create(null);
  uniqueSentences.forEach(function (item) {
    sentenceFileByText[item.text] = item.fileName;
  });

  phonemes.forEach(function (entry) {
    entry.words = entry.words.map(function (word) {
      return { text: word, fileName: wordFileByText[word] };
    });
    entry.sentences = entry.sentences.map(function (sentence) {
      return {
        text: sentence.text,
        marked: sentence.marked,
        fileName: sentenceFileByText[sentence.text]
      };
    });
  });

  const payload = {
    source: 'https://etbase.github.io/kk-phonetic-learning/',
    voices: [
      { id: 'en-US-AvaNeural', label: '女聲' },
      { id: 'en-US-GuyNeural', label: '男聲' }
    ],
    voiceDefault: 'en-US-AvaNeural',
    rate: 1,
    stats: {
      phonemes: phonemes.length,
      vowels: vowels.length,
      consonants: consonants.length,
      wordRows: wordRows,
      uniqueWords: uniqueWords.length,
      sentenceRows: sentenceRows,
      uniqueSentences: uniqueSentences.length,
      uniqueMp3: uniqueWords.length + uniqueSentences.length
    },
    phonemes: phonemes,
    uniqueWords: uniqueWords,
    uniqueSentences: uniqueSentences
  };

  const output = [
    '// TEMP KK PHONETIC FEATURE',
    '// Snapshot of words/sentences from kk-phonetic-learning. Do not fetch that site at runtime.',
    '// Rebuild with: node scripts/build-kk-examples-data.js',
    '(function (global) {',
    '  global.KK_EXAMPLES = ' + JSON.stringify(payload, null, 2) + ';',
    '})(window);',
    ''
  ].join('\n');

  fs.writeFileSync(OUT_FILE, output);
  process.stdout.write(JSON.stringify(payload.stats, null, 2) + '\n');
  process.stdout.write('wrote ' + path.relative(ROOT, OUT_FILE) + '\n');
}

main();
