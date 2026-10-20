// TEMP KK PHONETIC FEATURE
// 單字例句分頁：沿用 /api/tts（Azure Neural），預設 en-US-AndrewNeural。
// 不自動批次產生。不使用瀏覽器內建語音。
(function () {
  const data = window.KK_EXAMPLES;
  const panel = document.getElementById('kkExamplesPanel');
  const listEl = document.getElementById('kkExList');
  if (!data || !panel || !listEl) return;

  const VOICES = [
    { id: 'en-US-AvaNeural', label: 'Ava' },
    { id: 'en-US-JennyNeural', label: 'Jenny' },
    { id: 'en-US-AriaNeural', label: 'Aria' },
    { id: 'en-US-AndrewNeural', label: 'Andrew' },
    { id: 'en-US-GuyNeural', label: 'Guy' }
  ];
  const DEFAULT_VOICE = data.voiceDefault || 'en-US-AndrewNeural';
  const RATE = 1;
  const CONCURRENCY = 2;
  const MAX_RETRIES = 4;
  const DB_NAME = 'kk-examples-audio';
  const STORE = 'clips';
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
  const voiceRow = document.getElementById('kkExVoiceRow');
  const typeFilter = document.getElementById('kkExTypeFilter');
  const phonemeFilter = document.getElementById('kkExPhonemeFilter');
  const searchInput = document.getElementById('kkExSearch');
  const statusEl = document.getElementById('kkExStatus');
  const progressBar = document.getElementById('kkExProgressBar');
  const progressFill = document.getElementById('kkExProgressFill');
  const pauseBtn = document.getElementById('kkExPause');
  const resumeBtn = document.getElementById('kkExResume');

  let currentVoice = DEFAULT_VOICE;
  let currentAudio = null;
  let statusMap = Object.create(null);
  let dbPromise = null;
  const batch = {
    running: false,
    paused: false,
    stopped: false
  };

  function cacheKey(kind, text, voice) {
    return [kind, voice || currentVoice, String(RATE), text].join('\n');
  }

  function itemAttr(key) {
    return encodeURIComponent(key);
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
      const data = file.data;
      const crc = crc32(data);
      const local = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0x0800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
        data
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
        u32(data.length),
        u32(data.length),
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

  function idbPut(key, buffer) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(buffer, key);
        request.onsuccess = function () {
          resolve();
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
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

  function uniqueItems(kind) {
    if (kind === 'word') return data.uniqueWords.map(function (item) {
      return { kind: 'word', text: item.text, fileName: item.fileName, phonemes: item.phonemes };
    });
    if (kind === 'sentence') return data.uniqueSentences.map(function (item) {
      return { kind: 'sentence', text: item.text, fileName: item.fileName, phonemes: item.phonemes };
    });
    return uniqueItems('word').concat(uniqueItems('sentence'));
  }

  function stopLocalAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (typeof window.stopKkPhonemePlayback === 'function') {
      window.stopKkPhonemePlayback();
    }
    if (typeof window.stopStandardPronunciation === 'function') {
      window.stopStandardPronunciation();
    }
  }

  function showLoginNeeded() {
    setStatus('請先登入 Google 帳號，才能使用 Azure 語音產生音檔。');
  }

  function azureErrorMessage(error) {
    const code = error && error.message;
    if (code === 'LOGIN_REQUIRED') return '請先登入 Google 帳號。';
    if (code === 'NOT_CONFIGURED') return '語音服務尚未設定。';
    if (code === 'RATE_LIMITED') return 'Azure 目前忙碌，稍後會自動重試。';
    return '音檔產生失敗。';
  }

  async function fetchAzureBlob(text) {
    if (typeof window.fetchStandardPronunciationBlob !== 'function') {
      throw new Error('NOT_CONFIGURED');
    }
    return window.fetchStandardPronunciationBlob(text, { voice: currentVoice });
  }

  async function loadCached(item) {
    const key = cacheKey(item.kind, item.text, currentVoice);
    const buffer = await idbGet(key);
    if (!buffer) return null;
    return blobFromBuffer(buffer);
  }

  async function generateItem(item, force) {
    const key = cacheKey(item.kind, item.text, currentVoice);
    if (!force) {
      const cached = await loadCached(item);
      if (cached) {
        statusMap[key] = 'ready';
        return cached;
      }
    }
    statusMap[key] = 'busy';
    paintItemStatus(key);
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      if (batch.stopped) throw new Error('STOPPED');
      try {
        const blob = await fetchAzureBlob(item.text);
        const buffer = await blob.arrayBuffer();
        try {
          await idbPut(key, buffer);
        } catch (error) {
          /* 快取失敗仍回傳音檔 */
        }
        statusMap[key] = 'ready';
        paintItemStatus(key);
        return blobFromBuffer(buffer);
      } catch (error) {
        lastError = error;
        if (error && error.message === 'LOGIN_REQUIRED') throw error;
        const retryable = error && (error.message === 'RATE_LIMITED' || error.message === 'TTS_HTTP');
        if (!retryable || attempt === MAX_RETRIES) break;
        const waitSec = error.retryAfter || Math.min(8, Math.pow(2, attempt));
        await sleep(waitSec * 1000);
      }
    }
    statusMap[key] = 'error';
    paintItemStatus(key);
    throw lastError || new Error('TTS_HTTP');
  }

  function paintItemStatus(key) {
    const row = listEl.querySelector('[data-cache-key="' + itemAttr(key) + '"]');
    if (!row) return;
    const el = row.querySelector('.kk-ex-status');
    const genBtn = row.querySelector('.kk-ex-actions .btn-compact');
    const state = statusMap[key] || 'pending';
    if (el) {
      el.className = 'kk-ex-status' + (state === 'ready' ? ' is-ready' : state === 'busy' ? ' is-busy' : state === 'error' ? ' is-error' : '');
      el.textContent = state === 'ready' ? '已完成' : state === 'busy' ? '產生中' : state === 'error' ? '失敗' : '尚未產生';
    }
    if (genBtn) genBtn.textContent = state === 'ready' ? '重新產生' : '產生音檔';
  }

  async function refreshStatuses() {
    const items = uniqueItems('all');
    await Promise.all(items.map(function (item) {
      const key = cacheKey(item.kind, item.text, currentVoice);
      return idbGet(key).then(function (buffer) {
        statusMap[key] = buffer ? 'ready' : (statusMap[key] === 'error' ? 'error' : 'pending');
      });
    }));
    renderList();
  }

  function visibleGroups() {
    const type = typeFilter ? typeFilter.value : 'all';
    const phoneme = phonemeFilter ? phonemeFilter.value : 'all';
    const query = searchInput ? String(searchInput.value || '').trim().toLowerCase() : '';
    return data.phonemes.map(function (entry) {
      if (phoneme !== 'all' && entry.symbol !== phoneme) return null;
      const words = type === 'sentence' ? [] : entry.words.filter(function (item) {
        return !query || item.text.toLowerCase().indexOf(query) !== -1;
      }).map(function (item) {
        return { kind: 'word', text: item.text, fileName: item.fileName, symbol: entry.symbol };
      });
      const sentences = type === 'word' ? [] : entry.sentences.filter(function (item) {
        return !query || item.text.toLowerCase().indexOf(query) !== -1;
      }).map(function (item) {
        return { kind: 'sentence', text: item.text, fileName: item.fileName, symbol: entry.symbol };
      });
      if (!words.length && !sentences.length) return null;
      return { symbol: entry.symbol, kind: entry.kind, words: words, sentences: sentences };
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

  function renderRow(item) {
    const key = cacheKey(item.kind, item.text, currentVoice);
    const state = statusMap[key] || 'pending';
    const row = document.createElement('div');
    row.className = 'kk-row kk-ex-row';
    row.setAttribute('data-cache-key', itemAttr(key));

    const kind = document.createElement('span');
    kind.className = 'kk-ex-kind';
    kind.textContent = item.kind === 'word' ? '單字' : '例句';
    row.appendChild(kind);

    const text = document.createElement('div');
    text.className = 'kk-ex-text';
    text.textContent = item.text;
    row.appendChild(text);

    const status = document.createElement('span');
    status.className = 'kk-ex-status' + (state === 'ready' ? ' is-ready' : state === 'busy' ? ' is-busy' : state === 'error' ? ' is-error' : '');
    status.textContent = state === 'ready' ? '已完成' : state === 'busy' ? '產生中' : state === 'error' ? '失敗' : '尚未產生';
    row.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'kk-ex-actions';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'small-btn kk-icon-btn';
    playBtn.setAttribute('aria-label', '播放');
    playBtn.innerHTML = '<img src="assets/icons/kkspeaker.svg" alt="">';
    playBtn.addEventListener('click', function () {
      playItem(item);
    });
    actions.appendChild(playBtn);

    const genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.className = 'primary-btn btn-outline btn-compact';
    genBtn.textContent = state === 'ready' ? '重新產生' : '產生音檔';
    genBtn.addEventListener('click', function () {
      generateItem(item, true).then(function () {
        setStatus('');
      }).catch(function (error) {
        if (error && error.message === 'LOGIN_REQUIRED') showLoginNeeded();
        else setStatus(azureErrorMessage(error));
      });
    });
    actions.appendChild(genBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'small-btn btn-outline kk-icon-btn';
    downloadBtn.setAttribute('aria-label', '下載');
    downloadBtn.innerHTML = '<img src="assets/icons/download.svg" alt="">';
    downloadBtn.addEventListener('click', function () {
      downloadItem(item);
    });
    actions.appendChild(downloadBtn);

    row.appendChild(actions);
    return row;
  }

  async function playItem(item) {
    try {
      stopLocalAudio();
      const blob = await generateItem(item, false);
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      currentAudio = audio;
      audio.onended = function () {
        URL.revokeObjectURL(objectUrl);
        if (currentAudio === audio) currentAudio = null;
      };
      audio.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        setStatus('這個音檔暫時無法播放。');
      };
      await audio.play();
      setStatus('');
    } catch (error) {
      if (error && error.message === 'LOGIN_REQUIRED') showLoginNeeded();
      else setStatus(azureErrorMessage(error));
    }
  }

  async function downloadItem(item) {
    try {
      const blob = await generateItem(item, false);
      downloadBlob(blob, item.fileName);
      setStatus('');
    } catch (error) {
      if (error && error.message === 'LOGIN_REQUIRED') showLoginNeeded();
      else setStatus(azureErrorMessage(error));
    }
  }

  async function missingCount(kind) {
    const items = uniqueItems(kind);
    let missing = 0;
    for (let i = 0; i < items.length; i += 1) {
      const cached = await loadCached(items[i]);
      if (!cached) missing += 1;
    }
    return { total: items.length, missing: missing, cached: items.length - missing };
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

  async function generateMany(items, label) {
    if (batch.running) return;
    batch.running = true;
    batch.paused = false;
    batch.stopped = false;
    setBatchButtons(true, false);
    let success = 0;
    let failed = 0;
    const failures = [];
    const startMissing = [];
    for (let i = 0; i < items.length; i += 1) {
      const cached = await loadCached(items[i]);
      if (cached) success += 1;
      else startMissing.push(items[i]);
    }
    const total = items.length;
    const remainingStart = startMissing.length;
    setStatus((label || '批次產生') + '：已完成 ' + success + ' / ' + total + '（成功 ' + success + '、失敗 0、剩餘 ' + remainingStart + '）');
    setProgress(success, total);
    try {
      await runPool(startMissing, async function (item) {
        if (batch.stopped) return;
        try {
          await generateItem(item, false);
          success += 1;
        } catch (error) {
          if (error && error.message === 'LOGIN_REQUIRED') {
            batch.stopped = true;
            showLoginNeeded();
            throw error;
          }
          failed += 1;
          failures.push(item.text);
        }
        const remaining = total - success - failed;
        setStatus((label || '批次產生') + '：已完成 ' + (success + failed) + ' / ' + total + '（成功 ' + success + '、失敗 ' + failed + '、剩餘 ' + remaining + '）');
        setProgress(success + failed, total);
      });
    } catch (error) {
      if (!(error && error.message === 'LOGIN_REQUIRED')) {
        setStatus(azureErrorMessage(error));
      }
    }
    batch.running = false;
    setBatchButtons(false, false);
    if (failures.length) {
      setStatus('完成。成功 ' + success + '、失敗 ' + failed + '。失敗項目：' + failures.slice(0, 8).join('、') + (failures.length > 8 ? '…' : ''));
    } else if (!batch.stopped) {
      setStatus('完成。成功 ' + success + '、失敗 0。');
    }
    return { success: success, failed: failed, failures: failures, stopped: batch.stopped };
  }

  async function zipKind(kind) {
    const items = uniqueItems(kind);
    const counts = await missingCount(kind);
    if (counts.missing > 0) {
      const ok = window.confirm('將呼叫 Azure 新產生 ' + counts.missing + ' 個音檔（已有快取 ' + counts.cached + ' 個）。確定繼續？');
      if (!ok) return;
    }
    const result = await generateMany(items, '準備 ZIP');
    if (result.stopped) return;
    if (result.failed) {
      setStatus('有 ' + result.failed + ' 個音檔失敗，已中止打包，避免假裝全部成功。失敗項目：' + result.failures.slice(0, 8).join('、') + (result.failures.length > 8 ? '…' : ''));
      return;
    }
    const files = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const blob = await loadCached(item);
      if (!blob) {
        setStatus('打包時發現缺檔：' + item.text);
        return;
      }
      const buffer = new Uint8Array(await blob.arrayBuffer());
      const folder = item.kind === 'word' ? 'words/' : 'sentences/';
      files.push({ name: folder + item.fileName, data: buffer });
    }
    const zipName = kind === 'word' ? 'KK_Words.zip' : kind === 'sentence' ? 'KK_Sentences.zip' : 'KK_Words_Sentences.zip';
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

  function renderVoiceRow() {
    if (!voiceRow) return;
    voiceRow.innerHTML = '';
    VOICES.forEach(function (voice) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'voice-btn' + (voice.id === currentVoice ? ' selected' : '');
      button.setAttribute('aria-pressed', voice.id === currentVoice ? 'true' : 'false');
      button.textContent = voice.label;
      button.addEventListener('click', function () {
        currentVoice = voice.id;
        renderVoiceRow();
        refreshStatuses();
      });
      voiceRow.appendChild(button);
    });
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

  function renderStats() {
    if (!statsEl) return;
    const s = data.stats;
    statsEl.textContent = '音標分類 ' + s.phonemes + '（母音 ' + s.vowels + '、子音 ' + s.consonants + '）　單字 ' + s.wordRows + '（不重複 ' + s.uniqueWords + '）　例句 ' + s.sentenceRows + '（不重複 ' + s.uniqueSentences + '）　預計 MP3 ' + s.uniqueMp3 + '　語音 en-US-AndrewNeural　語速 1.0x';
  }

  if (tabPhonemes) tabPhonemes.addEventListener('click', function () {
    showTab('phonemes');
  });
  if (tabExamples) tabExamples.addEventListener('click', function () {
    showTab('examples');
  });
  if (typeFilter) typeFilter.addEventListener('change', renderList);
  if (phonemeFilter) phonemeFilter.addEventListener('change', renderList);
  if (searchInput) searchInput.addEventListener('input', renderList);
  const zipAll = document.getElementById('kkExZipAll');
  const zipWords = document.getElementById('kkExZipWords');
  const zipSentences = document.getElementById('kkExZipSentences');
  if (zipAll) zipAll.addEventListener('click', function () {
    zipKind('all');
  });
  if (zipWords) zipWords.addEventListener('click', function () {
    zipKind('word');
  });
  if (zipSentences) zipSentences.addEventListener('click', function () {
    zipKind('sentence');
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
  renderVoiceRow();
  renderPhonemeFilter();
  renderList();
  refreshStatuses();
  if (location.hash === '#examples') showTab('examples');
})();
