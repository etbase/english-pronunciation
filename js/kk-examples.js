// TEMP KK PHONETIC FEATURE
// 單字例句分頁：播放與 ZIP 使用 GitHub 已匯入的 MP3，其次使用瀏覽器 IndexedDB。
// 不自動、不因 ZIP 呼叫 Azure。不使用瀏覽器內建語音。
(function () {
  const data = window.KK_EXAMPLES;
  const audioIndex = window.KK_EXAMPLES_AUDIO || {};
  const panel = document.getElementById('kkExamplesPanel');
  const listEl = document.getElementById('kkExList');
  if (!data || !panel || !listEl) return;

  const VOICES = (data.voices && data.voices.length)
    ? data.voices
    : [
      { id: 'en-US-AvaNeural', label: '女聲' },
      { id: 'en-US-GuyNeural', label: '男聲' }
    ];
  const RATE = 1;
  const CONCURRENCY = 4;
  const DB_NAME = 'kk-examples-audio';
  const STORE = 'clips';
  const AUDIO_BASE = audioIndex.base || 'assets/kk/examples/';
  const VOICE_FOLDERS = audioIndex.folders || {
    'en-US-AvaNeural': 'female',
    'en-US-GuyNeural': 'male'
  };
  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let crc = i;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
      }
      table[i] = crc >>> 0;
    }
    return table;
  })();

  const tabPhonemes = document.getElementById('kkTabPhonemes');
  const tabExamples = document.getElementById('kkTabExamples');
  const phonemePanel = document.getElementById('kkPhonemePanel');
  const statsEl = document.getElementById('kkExStats');
  const phonemeFilter = document.getElementById('kkExPhonemeFilter');
  const statusEl = document.getElementById('kkExStatus');
  const progressBar = document.getElementById('kkExProgressBar');
  const progressFill = document.getElementById('kkExProgressFill');
  const pauseBtn = document.getElementById('kkExPause');
  const resumeBtn = document.getElementById('kkExResume');

  let currentAudio = null;
  let playingKey = '';
  let statusMap = Object.create(null);
  let memoryBlobs = Object.create(null);
  let dbPromise = null;
  const batch = {
    running: false,
    paused: false,
    stopped: false
  };

  const repoSets = (function () {
    const files = audioIndex.files || {};
    const out = {};
    Object.keys(VOICE_FOLDERS).forEach(function (voiceId) {
      const folder = VOICE_FOLDERS[voiceId];
      const group = files[folder] || {};
      out[folder] = {
        word: new Set(group.words || []),
        sentence: new Set(group.sentences || [])
      };
    });
    return out;
  })();

  function cacheKey(kind, text, voice) {
    return [kind, voice, String(RATE), text].join('\n');
  }

  function itemAttr(key) {
    return encodeURIComponent(key);
  }

  function voiceById(id) {
    return VOICES.find(function (voice) {
      return voice.id === id;
    }) || VOICES[0];
  }

  function voiceFolder(voiceId) {
    return VOICE_FOLDERS[voiceId] || 'female';
  }

  function repoHas(item, voiceId) {
    const group = repoSets[voiceFolder(voiceId)];
    return !!(group && group[item.kind] && group[item.kind].has(item.fileName));
  }

  function repoPath(item, voiceId) {
    const kindDir = item.kind === 'word' ? 'words' : 'sentences';
    return AUDIO_BASE + voiceFolder(voiceId) + '/' + kindDir + '/' + item.fileName;
  }

  function repoUrl(item, voiceId) {
    const kindDir = item.kind === 'word' ? 'words' : 'sentences';
    return AUDIO_BASE + voiceFolder(voiceId) + '/' + kindDir + '/' + encodeURIComponent(item.fileName);
  }

  function setStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function setProgress(done, total) {
    if (!progressBar || !progressFill) return;
    if (!total) {
      progressBar.hidden = true;
      progressFill.style.width = '0%';
      return;
    }
    progressBar.hidden = false;
    progressFill.style.width = Math.round((done / total) * 100) + '%';
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i += 1) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function u16(value) {
    return new Uint8Array([value & 0xFF, (value >>> 8) & 0xFF]);
  }

  function u32(value) {
    return new Uint8Array([
      value & 0xFF,
      (value >>> 8) & 0xFF,
      (value >>> 16) & 0xFF,
      (value >>> 24) & 0xFF
    ]);
  }

  function concatBytes(parts) {
    let total = 0;
    parts.forEach(function (part) {
      total += part.length;
    });
    const out = new Uint8Array(total);
    let offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function buildZip(files) {
    const encoder = new TextEncoder();
    const locals = [];
    const centrals = [];
    let offset = 0;
    files.forEach(function (file) {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = file.data;
      const crc = crc32(dataBytes);
      const local = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(dataBytes.length),
        u32(dataBytes.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
        dataBytes
      ]);
      const central = concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(dataBytes.length),
        u32(dataBytes.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    });
    const centralSize = centrals.reduce(function (sum, part) {
      return sum + part.length;
    }, 0);
    const end = concatBytes([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralSize),
      u32(offset),
      u16(0)
    ]);
    return new Blob([concatBytes(locals.concat(centrals, [end]))], { type: 'application/zip' });
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('NO_IDB'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
    return dbPromise;
  }

  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        request.onsuccess = function () {
          resolve(request.result || null);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    }).catch(function () {
      return null;
    });
  }

  function blobFromBuffer(buffer) {
    return new Blob([buffer], { type: 'audio/mpeg' });
  }

  function downloadBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  function uniqueItems() {
    return data.uniqueWords.map(function (item) {
      return { kind: 'word', text: item.text, fileName: item.fileName, phonemes: item.phonemes };
    }).concat(data.uniqueSentences.map(function (item) {
      return { kind: 'sentence', text: item.text, fileName: item.fileName, phonemes: item.phonemes };
    }));
  }

  function stopLocalAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    playingKey = '';
    listEl.querySelectorAll('.kk-ex-voice.is-playing').forEach(function (el) {
      el.classList.remove('is-playing');
    });
    if (typeof window.stopKkPhonemePlayback === 'function') {
      window.stopKkPhonemePlayback();
    }
    if (typeof window.stopStandardPronunciation === 'function') {
      window.stopStandardPronunciation();
    }
  }

  function markPlaying(key) {
    listEl.querySelectorAll('.kk-ex-voice.is-playing').forEach(function (el) {
      el.classList.remove('is-playing');
    });
    playingKey = key || '';
    if (!key) return;
    const group = listEl.querySelector('[data-cache-key="' + itemAttr(key) + '"]');
    if (group) group.classList.add('is-playing');
  }

  async function fetchRepoBlob(item, voiceId) {
    const response = await fetch(repoUrl(item, voiceId));
    if (response.status === 404) throw new Error('MISSING');
    if (!response.ok) throw new Error('HTTP');
    const buffer = await response.arrayBuffer();
    if (!buffer || buffer.byteLength < 800) throw new Error('MISSING');
    return blobFromBuffer(buffer);
  }

  async function loadExisting(item, voiceId) {
    const key = cacheKey(item.kind, item.text, voiceId);
    if (memoryBlobs[key]) {
      statusMap[key] = 'ready';
      paintItemStatus(key);
      return memoryBlobs[key];
    }
    if (repoHas(item, voiceId)) {
      try {
        const blob = await fetchRepoBlob(item, voiceId);
        memoryBlobs[key] = blob;
        statusMap[key] = 'ready';
        paintItemStatus(key);
        return blob;
      } catch (error) {
        /* 清單有檔名但檔案讀不到時，再看 IndexedDB */
      }
    }
    const buffer = await idbGet(key);
    if (buffer) {
      const blob = blobFromBuffer(buffer);
      memoryBlobs[key] = blob;
      statusMap[key] = 'ready';
      paintItemStatus(key);
      return blob;
    }
    statusMap[key] = 'pending';
    paintItemStatus(key);
    return null;
  }

  function paintItemStatus(key) {
    const group = listEl.querySelector('[data-cache-key="' + itemAttr(key) + '"]');
    if (!group) return;
    const el = group.querySelector('.kk-ex-status');
    const state = statusMap[key] || 'pending';
    if (el) {
      el.className = 'kk-ex-status' + (state === 'ready' ? ' is-ready' : state === 'busy' ? ' is-busy' : state === 'error' ? ' is-error' : '');
      el.textContent = state === 'ready' ? '已完成' : state === 'busy' ? '讀取中' : state === 'error' ? '缺少音檔' : '尚未匯入';
    }
    if (playingKey === key) group.classList.add('is-playing');
  }

  async function refreshStatuses() {
    const items = uniqueItems();
    await Promise.all(VOICES.map(function (voice) {
      return Promise.all(items.map(function (item) {
        const key = cacheKey(item.kind, item.text, voice.id);
        if (repoHas(item, voice.id)) {
          statusMap[key] = 'ready';
          return Promise.resolve();
        }
        return idbGet(key).then(function (buffer) {
          statusMap[key] = buffer ? 'ready' : 'pending';
        });
      }));
    }));
    renderList();
  }

  function visibleGroups() {
    const phoneme = phonemeFilter ? phonemeFilter.value : 'all';
    return data.phonemes.map(function (entry) {
      if (phoneme !== 'all' && entry.symbol !== phoneme) return null;
      return {
        symbol: entry.symbol,
        kind: entry.kind,
        words: entry.words.map(function (item) {
          return { kind: 'word', text: item.text, fileName: item.fileName, symbol: entry.symbol };
        }),
        sentences: entry.sentences.map(function (item) {
          return { kind: 'sentence', text: item.text, fileName: item.fileName, symbol: entry.symbol };
        })
      };
    }).filter(Boolean);
  }

  function renderList() {
    const groups = visibleGroups();
    listEl.innerHTML = '';
    if (!groups.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = '沒有符合的單字或例句。';
      listEl.appendChild(empty);
      return;
    }
    groups.forEach(function (group) {
      const wrap = document.createElement('div');
      wrap.className = 'kk-ex-group';
      const title = document.createElement('div');
      title.className = 'section-title kk-group-title';
      title.innerHTML = '<span class="num">/' + group.symbol + '/</span>' + (group.kind === 'vowel' ? '母音' : '子音');
      wrap.appendChild(title);
      const rows = document.createElement('div');
      rows.className = 'kk-list';
      group.words.concat(group.sentences).forEach(function (item) {
        rows.appendChild(renderRow(item));
      });
      wrap.appendChild(rows);
      listEl.appendChild(wrap);
    });
  }

  function renderVoiceControls(item, voice) {
    const key = cacheKey(item.kind, item.text, voice.id);
    const state = statusMap[key] || 'pending';
    const group = document.createElement('div');
    group.className = 'kk-ex-voice' + (playingKey === key ? ' is-playing' : '');
    group.setAttribute('data-cache-key', itemAttr(key));

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'primary-btn btn-outline btn-compact kk-ex-play-btn';
    playBtn.setAttribute('aria-label', '播放' + voice.label);
    playBtn.innerHTML = '<img src="assets/icons/kkspeaker.svg" alt="">' + voice.label;
    playBtn.addEventListener('click', function () {
      playItem(item, voice.id);
    });
    group.appendChild(playBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'small-btn btn-outline kk-icon-btn';
    downloadBtn.setAttribute('aria-label', '下載' + voice.label);
    downloadBtn.innerHTML = '<img src="assets/icons/download.svg" alt="">';
    downloadBtn.addEventListener('click', function () {
      downloadItem(item, voice.id);
    });
    group.appendChild(downloadBtn);

    const status = document.createElement('span');
    status.className = 'kk-ex-status' + (state === 'ready' ? ' is-ready' : state === 'busy' ? ' is-busy' : state === 'error' ? ' is-error' : '');
    status.textContent = state === 'ready' ? '已完成' : state === 'busy' ? '讀取中' : state === 'error' ? '缺少音檔' : '尚未匯入';
    group.appendChild(status);

    return group;
  }

  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'kk-row kk-ex-row';

    const kind = document.createElement('span');
    kind.className = 'kk-ex-kind';
    kind.textContent = item.kind === 'word' ? '單字' : '例句';
    row.appendChild(kind);

    const text = document.createElement('div');
    text.className = 'kk-ex-text';
    text.textContent = item.text;
    row.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'kk-ex-voices';
    VOICES.forEach(function (voice) {
      actions.appendChild(renderVoiceControls(item, voice));
    });
    row.appendChild(actions);
    return row;
  }

  function missingMessage(item, voiceId) {
    const voice = voiceById(voiceId);
    return '缺少音檔：' + repoPath(item, voiceId) + '（' + voice.label + '／' + item.fileName + '）';
  }

  async function playItem(item, voiceId) {
    const key = cacheKey(item.kind, item.text, voiceId);
    try {
      stopLocalAudio();
      statusMap[key] = 'busy';
      paintItemStatus(key);
      const blob = await loadExisting(item, voiceId);
      if (!blob) {
        statusMap[key] = 'error';
        paintItemStatus(key);
        setStatus(missingMessage(item, voiceId));
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      currentAudio = audio;
      markPlaying(key);
      audio.onended = function () {
        URL.revokeObjectURL(objectUrl);
        if (currentAudio === audio) {
          currentAudio = null;
          markPlaying('');
        }
      };
      audio.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        markPlaying('');
        setStatus('這個音檔暫時無法播放。');
      };
      await audio.play();
      setStatus('');
    } catch (error) {
      markPlaying('');
      statusMap[key] = 'error';
      paintItemStatus(key);
      setStatus(missingMessage(item, voiceId));
    }
  }

  async function downloadItem(item, voiceId) {
    const key = cacheKey(item.kind, item.text, voiceId);
    try {
      statusMap[key] = 'busy';
      paintItemStatus(key);
      const blob = await loadExisting(item, voiceId);
      if (!blob) {
        statusMap[key] = 'error';
        paintItemStatus(key);
        setStatus(missingMessage(item, voiceId));
        return;
      }
      downloadBlob(blob, item.fileName);
      setStatus('');
    } catch (error) {
      statusMap[key] = 'error';
      paintItemStatus(key);
      setStatus(missingMessage(item, voiceId));
    }
  }

  async function findMissing(voiceId) {
    const items = uniqueItems();
    const missing = [];
    const ready = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (repoHas(item, voiceId)) {
        ready.push(item);
        continue;
      }
      const buffer = await idbGet(cacheKey(item.kind, item.text, voiceId));
      if (buffer) ready.push(item);
      else missing.push(item);
    }
    return { items: items, missing: missing, ready: ready };
  }

  function formatMissingList(voice, missing) {
    const lines = missing.map(function (item) {
      return repoPath(item, voice.id);
    });
    return '缺少 ' + missing.length + ' 個' + voice.label + '音檔，無法打包 ZIP。缺少項目：\n' + lines.join('\n');
  }

  function setBatchButtons(running, paused) {
    if (pauseBtn) pauseBtn.hidden = !running || paused;
    if (resumeBtn) resumeBtn.hidden = !running || !paused;
  }

  async function runPool(items, worker) {
    let index = 0;
    async function next() {
      while (true) {
        if (batch.stopped) return;
        while (batch.paused && !batch.stopped) {
          await sleep(200);
        }
        if (batch.stopped) return;
        const current = index;
        index += 1;
        if (current >= items.length) return;
        await worker(items[current], current);
      }
    }
    const n = Math.min(CONCURRENCY, items.length) || 1;
    const workers = [];
    for (let i = 0; i < n; i += 1) workers.push(next());
    await Promise.all(workers);
  }

  async function zipVoice(voiceId) {
    if (batch.running) return;
    const voice = voiceById(voiceId);
    const found = await findMissing(voice.id);
    if (found.missing.length) {
      setProgress(0, 0);
      setStatus(formatMissingList(voice, found.missing));
      return;
    }
    batch.running = true;
    batch.paused = false;
    batch.stopped = false;
    setBatchButtons(true, false);
    const items = found.items;
    const files = new Array(items.length);
    let done = 0;
    let failed = 0;
    const failures = [];
    setStatus('打包' + voice.label + ' ZIP：已完成 0 / ' + items.length);
    setProgress(0, items.length);
    try {
      await runPool(items, async function (item, index) {
        if (batch.stopped) return;
        const blob = await loadExisting(item, voice.id);
        done += 1;
        if (!blob) {
          failed += 1;
          failures.push(repoPath(item, voice.id));
          statusMap[cacheKey(item.kind, item.text, voice.id)] = 'error';
          paintItemStatus(cacheKey(item.kind, item.text, voice.id));
        } else {
          const buffer = new Uint8Array(await blob.arrayBuffer());
          const folder = item.kind === 'word' ? 'words/' : 'sentences/';
          files[index] = { name: folder + item.fileName, data: buffer };
        }
        setStatus('打包' + voice.label + ' ZIP：已完成 ' + done + ' / ' + items.length + '（成功 ' + (done - failed) + '、失敗 ' + failed + '、剩餘 ' + (items.length - done) + '）');
        setProgress(done, items.length);
      });
    } finally {
      batch.running = false;
      setBatchButtons(false, false);
    }
    if (batch.stopped) return;
    if (failed) {
      setStatus('有 ' + failed + ' 個' + voice.label + '音檔缺少，已中止打包。缺少項目：\n' + failures.join('\n'));
      return;
    }
    const zipName = 'KK_Words_Sentences_' + voice.label + '.zip';
    downloadBlob(buildZip(files), zipName);
    setStatus('ZIP 已下載：' + zipName + '（' + files.length + ' 個 MP3）。');
  }

  function showTab(name) {
    const examples = name === 'examples';
    if (tabPhonemes) tabPhonemes.classList.toggle('active', !examples);
    if (tabExamples) tabExamples.classList.toggle('active', examples);
    if (phonemePanel) phonemePanel.hidden = examples;
    panel.hidden = !examples;
    if (examples) {
      if (location.hash !== '#examples') location.hash = '#examples';
    } else if (location.hash === '#examples') {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function renderPhonemeFilter() {
    if (!phonemeFilter) return;
    phonemeFilter.innerHTML = '<option value="all">全部音標</option>';
    data.phonemes.forEach(function (entry) {
      const option = document.createElement('option');
      option.value = entry.symbol;
      option.textContent = '/' + entry.symbol + '/ ' + (entry.kind === 'vowel' ? '母音' : '子音');
      phonemeFilter.appendChild(option);
    });
  }

  function repoCount(folder) {
    const files = (audioIndex.files && audioIndex.files[folder]) || {};
    return (files.words || []).length + (files.sentences || []).length;
  }

  function renderStats() {
    if (!statsEl) return;
    const s = data.stats;
    statsEl.textContent = '音標分類 ' + s.phonemes + '（母音 ' + s.vowels + '、子音 ' + s.consonants + '）　單字 ' + s.wordRows + '（不重複 ' + s.uniqueWords + '）　例句 ' + s.sentenceRows + '（不重複 ' + s.uniqueSentences + '）　每種聲音應有 MP3 ' + s.uniqueMp3 + '　儲存庫女聲 ' + repoCount('female') + '、男聲 ' + repoCount('male');
  }

  if (tabPhonemes) tabPhonemes.addEventListener('click', function () {
    showTab('phonemes');
  });
  if (tabExamples) tabExamples.addEventListener('click', function () {
    showTab('examples');
  });
  if (phonemeFilter) phonemeFilter.addEventListener('change', renderList);
  const zipFemale = document.getElementById('kkExZipFemale');
  const zipMale = document.getElementById('kkExZipMale');
  if (zipFemale) zipFemale.addEventListener('click', function () {
    zipVoice('en-US-AvaNeural');
  });
  if (zipMale) zipMale.addEventListener('click', function () {
    zipVoice('en-US-GuyNeural');
  });
  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    batch.paused = true;
    setBatchButtons(true, true);
    setStatus('已暫停。可按「繼續」。');
  });
  if (resumeBtn) resumeBtn.addEventListener('click', function () {
    batch.paused = false;
    setBatchButtons(true, false);
  });

  renderStats();
  renderPhonemeFilter();
  renderList();
  refreshStatuses();
  if (location.hash === '#examples') showTab('examples');
})();
