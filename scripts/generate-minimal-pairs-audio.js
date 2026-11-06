#!/usr/bin/env node
// 用本機 Azure Speech（en-US-AvaNeural / en-US-GuyNeural）產生最小對立單字 MP3。
// Key 只從 api/local.settings.json 讀取，不會寫進前端或 git。
// 可重跑：已存在且大小足夠的 MP3 會略過。
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SETTINGS_FILE = path.join(ROOT, 'api', 'local.settings.json');
const CSV_FILE = process.argv[2] || '/Users/mact/Downloads/Minimal_Pairs_A-Z_錄音對照表.csv';
const OUT_DIR = path.join(ROOT, 'assets', 'kk', 'minimal-pairs');
const DATA_FILE = path.join(ROOT, 'js', 'kk-minimal-pairs-data.js');
const MIN_BYTES = 400;
const CONCURRENCY = 3;

const VOICES = [
  { id: 'en-US-AvaNeural', folder: 'female', suffix: 'female', label: '女聲' },
  { id: 'en-US-GuyNeural', folder: 'male', suffix: 'male', label: '男聲' }
];

// 孤立單字時 Azure 可能唸成另一個意思。對照表的組別決定這裡要的讀音。
const IPA_OVERRIDE = {
  // 單獨唸 live 時，Ava / Guy 預設是形容詞 /laɪv/。這份對照表要的是動詞 /lɪv/。
  // Guy 需要重音符號，否則短音 ɪ 會接近 love。
  live: 'ˈlɪv',
  lead: 'liːd',
  read: 'ɹiːd'
};

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

function splitParts(value) {
  return String(value || '').split(';').map(function (part) {
    return part.trim();
  }).filter(Boolean);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(function (line) {
    return line.trim();
  });
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;
    const id = cols[0].trim();
    const word = cols[1].trim();
    const groups = splitParts(cols[2]);
    const contrasts = splitParts(cols.slice(3, cols.length - 1).join(','));
    const suggested = cols[cols.length - 1].trim();
    const base = suggested.replace(/\.[^.]+$/, '');
    if (!id || !word || !base) continue;
    rows.push({
      id: id,
      text: word,
      groups: groups,
      contrasts: contrasts,
      fileBase: base
    });
  }
  return rows;
}

function buildGroups(words) {
  const map = Object.create(null);
  words.forEach(function (word) {
    word.groups.forEach(function (groupId, index) {
      if (!map[groupId]) {
        map[groupId] = {
          id: groupId,
          contrast: word.contrasts[index] || word.contrasts[0] || '',
          kind: groupId.charAt(0) === 'V' ? 'vowel' : 'consonant'
        };
      }
    });
  });
  return Object.keys(map).map(function (id) {
    return map[id];
  }).sort(function (a, b) {
    const ak = a.kind === 'vowel' ? 0 : 1;
    const bk = b.kind === 'vowel' ? 0 : 1;
    if (ak !== bk) return ak - bk;
    return a.id.localeCompare(b.id, 'en', { numeric: true });
  });
}

function fileNameFor(word, voice) {
  return word.fileBase + '_' + voice.suffix + '.mp3';
}

function buildSsml(word, voiceId) {
  const ipa = IPA_OVERRIDE[word.text.toLowerCase()];
  const spoken = ipa
    ? '<phoneme alphabet="ipa" ph="' + escapeXml(ipa) + '">' + escapeXml(word.text) + '</phoneme>'
    : escapeXml(word.text);
  return [
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">',
    '<voice name="' + voiceId + '">',
    spoken,
    '</voice></speak>'
  ].join('');
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function synthesize(settings, word, voice) {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(settings.url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': settings.key,
        'Content-Type': 'application/ssml+xml; charset=utf-8',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'english-pronunciation-minimal-pairs'
      },
      body: buildSsml(word, voice.id),
      signal: AbortSignal.timeout(20000)
    });
    lastStatus = response.status;
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < MIN_BYTES) {
        throw new Error(word.text + ' ' + voice.suffix + ' audio too small (' + buffer.length + ' bytes)');
      }
      return buffer;
    }
    if (response.status === 429 || response.status >= 500) {
      await sleep(500 * attempt);
      continue;
    }
    const detail = await response.text().catch(function () {
      return '';
    });
    throw new Error('TTS HTTP ' + response.status + (detail ? ' ' + detail.slice(0, 180) : ''));
  }
  throw new Error('TTS HTTP ' + lastStatus + ' after retries');
}

function writeZip(folder, zipFile) {
  const files = fs.readdirSync(folder).filter(function (name) {
    return name.endsWith('.mp3');
  }).sort().map(function (name) {
    return path.join(folder, name);
  });
  if (!files.length) return 0;
  const result = spawnSync('zip', ['-j', '-q', '-FS', zipFile].concat(files), { cwd: ROOT });
  if (result.status !== 0) {
    throw new Error('zip failed for ' + path.basename(zipFile));
  }
  return files.length;
}

function writeData(words, groups) {
  const files = {
    female: [],
    male: []
  };
  VOICES.forEach(function (voice) {
    const dir = path.join(OUT_DIR, voice.folder);
    if (!fs.existsSync(dir)) return;
    files[voice.folder] = fs.readdirSync(dir).filter(function (name) {
      return name.endsWith('.mp3');
    }).sort();
  });
  const payload = {
    source: 'Minimal_Pairs_A-Z_錄音對照表.csv',
    voices: VOICES.map(function (voice) {
      return { id: voice.id, label: voice.label, folder: voice.folder, suffix: voice.suffix };
    }),
    audioBase: 'assets/kk/minimal-pairs/',
    zips: {
      female: 'assets/kk/minimal-pairs/minimal-pairs-female.zip',
      male: 'assets/kk/minimal-pairs/minimal-pairs-male.zip'
    },
    stats: {
      words: words.length,
      groups: groups.length,
      vowels: groups.filter(function (group) { return group.kind === 'vowel'; }).length,
      consonants: groups.filter(function (group) { return group.kind === 'consonant'; }).length
    },
    groups: groups,
    words: words.map(function (word) {
      return {
        id: word.id,
        text: word.text,
        groups: word.groups,
        contrasts: word.contrasts,
        fileBase: word.fileBase,
        files: {
          female: fileNameFor(word, VOICES[0]),
          male: fileNameFor(word, VOICES[1])
        }
      };
    }),
    files: files
  };
  const source = [
    '// Minimal pair word audio. Rebuild with:',
    '// node scripts/generate-minimal-pairs-audio.js',
    '(function (global) {',
    '  global.KK_MINIMAL_PAIRS = ' + JSON.stringify(payload, null, 2) + ';',
    '})(window);',
    ''
  ].join('\n');
  fs.writeFileSync(DATA_FILE, source);
}

async function runPool(jobs, worker) {
  let index = 0;
  let done = 0;
  async function next() {
    while (index < jobs.length) {
      const current = index;
      index += 1;
      await worker(jobs[current], current);
      done += 1;
      if (done % 20 === 0 || done === jobs.length) {
        process.stdout.write('progress ' + done + ' / ' + jobs.length + '\n');
      }
    }
  }
  const workers = [];
  const n = Math.min(CONCURRENCY, jobs.length) || 1;
  for (let i = 0; i < n; i += 1) workers.push(next());
  await Promise.all(workers);
}

async function main() {
  if (!fs.existsSync(CSV_FILE)) {
    throw new Error('Missing CSV: ' + CSV_FILE);
  }
  const words = parseCsv(fs.readFileSync(CSV_FILE, 'utf8'));
  if (words.length < 200) {
    throw new Error('Expected about 212 words, got ' + words.length);
  }
  const groups = buildGroups(words);
  const settings = loadSpeechSettings();
  VOICES.forEach(function (voice) {
    fs.mkdirSync(path.join(OUT_DIR, voice.folder), { recursive: true });
  });
  writeData(words, groups);

  const jobs = [];
  words.forEach(function (word) {
    VOICES.forEach(function (voice) {
      jobs.push({ word: word, voice: voice });
    });
  });

  const failures = [];
  await runPool(jobs, async function (job) {
    const name = fileNameFor(job.word, job.voice);
    const outFile = path.join(OUT_DIR, job.voice.folder, name);
    if (fs.existsSync(outFile) && fs.statSync(outFile).size >= MIN_BYTES) {
      return;
    }
    try {
      const audio = await synthesize(settings, job.word, job.voice);
      fs.writeFileSync(outFile, audio);
      process.stdout.write(name + ' ' + job.word.text + ' ' + audio.length + '\n');
    } catch (error) {
      failures.push(name + ': ' + (error && error.message ? error.message : error));
      process.stderr.write('FAIL ' + name + ' ' + (error && error.message ? error.message : error) + '\n');
    }
  });

  VOICES.forEach(function (voice) {
    const count = writeZip(path.join(OUT_DIR, voice.folder), path.join(OUT_DIR, 'minimal-pairs-' + voice.folder + '.zip'));
    process.stdout.write('zip ' + voice.folder + ' ' + count + '\n');
  });
  writeData(words, groups);
  process.stdout.write('words ' + words.length + ' groups ' + groups.length + ' failures ' + failures.length + '\n');
  if (failures.length) {
    throw new Error(failures.slice(0, 8).join('\n'));
  }
}

main().catch(function (error) {
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
