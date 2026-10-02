// TEMP KK PHONETIC FEATURE
// 只服務 kk.html。播放／下載固定音檔，不改動 js/tts.js 或 Azure Function。
(function () {
  const data = window.KK_PHONEMES;
  const listVowels = document.getElementById('kkVowelList');
  const listConsonants = document.getElementById('kkConsonantList');
  const statusEl = document.getElementById('kkStatus');
  const playAllBtn = document.getElementById('kkPlayAll');
  const downloadAllBtn = document.getElementById('kkDownloadAll');
  if (!data || !listVowels || !listConsonants) return;

  let currentAudio = null;
  let playAllQueue = [];
  let playAllIndex = 0;
  const blobCache = Object.create(null);

  function assetUrl(relative) {
    try {
      return new URL(relative, document.baseURI).href;
    } catch (error) {
      return relative;
    }
  }

  function statusFromError(error) {
    const code = error && error.message;
    if (code === 'aborted') return '';
    if (code === 'missing') return '這個音標的音檔還沒匯入。';
    if (code === 'blocked') return '瀏覽器擋住播放，請再按一次。';
    return '這個音標暫時無法播放。';
  }

  function setStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function setPlayingId(id) {
    document.querySelectorAll('.kk-row').forEach(function (row) {
      row.classList.toggle('is-playing', !!id && row.getAttribute('data-id') === id);
    });
  }

  function stopPlayback() {
    playAllQueue = [];
    playAllIndex = 0;
    setPlayingId('');
    stopSingle();
  }

  function playUrl(url, id) {
    const abs = assetUrl(url);
    return loadAudioBlob(abs).then(function (blob) {
      return playBlob(blob, id);
    });
  }

  function loadAudioBlob(abs) {
    if (blobCache[abs]) return Promise.resolve(blobCache[abs]);
    return fetch(abs).then(function (response) {
      if (response.status === 404) throw new Error('missing');
      if (!response.ok) throw new Error('http');
      return response.arrayBuffer();
    }).then(function (buffer) {
      if (!buffer || buffer.byteLength < 800) throw new Error('missing');
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      blobCache[abs] = blob;
      return blob;
    });
  }

  function playBlob(blob, id) {
    return new Promise(function (resolve, reject) {
      stopSingle();
      setPlayingId(id || '');
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.preload = 'auto';
      audio._kkObjectUrl = objectUrl;
      currentAudio = audio;
      let settled = false;
      function finish(error) {
        if (settled) return;
        settled = true;
        if (audio._kkObjectUrl) {
          URL.revokeObjectURL(audio._kkObjectUrl);
          audio._kkObjectUrl = '';
        }
        if (currentAudio === audio) currentAudio = null;
        if (error) reject(error);
        else resolve();
      }
      audio.onended = function () {
        finish(null);
      };
      audio.onerror = function () {
        finish(new Error('decode'));
      };
      audio.src = objectUrl;
      const start = audio.play();
      if (start && typeof start.catch === 'function') {
        start.catch(function (error) {
          const name = error && error.name;
          if (name === 'AbortError') finish(new Error('aborted'));
          else if (name === 'NotAllowedError') finish(new Error('blocked'));
          else finish(new Error('decode'));
        });
      }
    });
  }

  function stopSingle() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio.onerror = null;
      if (currentAudio._kkObjectUrl) {
        URL.revokeObjectURL(currentAudio._kkObjectUrl);
        currentAudio._kkObjectUrl = '';
      }
      currentAudio = null;
    }
  }

  function playPhoneme(item) {
    stopPlayback();
    setStatus('');
    return playUrl(data.audioUrl(item.id), item.id).then(function () {
      setPlayingId('');
    }).catch(function (error) {
      setPlayingId('');
      setStatus(statusFromError(error));
    });
  }

  function downloadPhoneme(item) {
    const url = assetUrl(data.audioUrl(item.id));
    fetch(url).then(function (response) {
      if (!response.ok) throw new Error('missing');
      return response.blob();
    }).then(function (blob) {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = item.id + '.mp3';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setStatus('');
    }).catch(function () {
      setStatus('這個音標的音檔還沒匯入。');
    });
  }

  function playAll() {
    stopPlayback();
    playAllQueue = data.all.slice();
    playAllIndex = 0;
    setStatus('正在播放全部音標…');
    playNextInQueue();
  }

  function playNextInQueue() {
    if (playAllIndex >= playAllQueue.length) {
      setPlayingId('');
      setStatus('');
      return;
    }
    const item = playAllQueue[playAllIndex];
    playUrl(data.audioUrl(item.id), item.id).then(function () {
      playAllIndex += 1;
      playNextInQueue();
    }).catch(function (error) {
      setPlayingId('');
      setStatus(statusFromError(error));
      playAllQueue = [];
    });
  }

  function renderList(parent, items) {
    parent.innerHTML = '';
    items.forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'kk-row';
      row.setAttribute('data-id', item.id);

      const symbol = document.createElement('div');
      symbol.className = 'kk-symbol';
      symbol.textContent = '/' + item.symbol + '/';
      row.appendChild(symbol);

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'small-btn kk-icon-btn';
      playBtn.setAttribute('aria-label', '播放 ' + item.symbol);
      playBtn.innerHTML = '<img src="assets/icons/kkspeaker.svg" alt="">';
      playBtn.addEventListener('click', function () {
        playPhoneme(item);
      });
      row.appendChild(playBtn);

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'small-btn btn-outline kk-icon-btn';
      downloadBtn.setAttribute('aria-label', '下載 ' + item.symbol);
      downloadBtn.innerHTML = '<img src="assets/icons/download.svg" alt="">';
      downloadBtn.addEventListener('click', function () {
        downloadPhoneme(item);
      });
      row.appendChild(downloadBtn);

      parent.appendChild(row);
    });
  }

  renderList(listVowels, data.vowels);
  renderList(listConsonants, data.consonants);

  if (playAllBtn) {
    playAllBtn.addEventListener('click', playAll);
  }

  if (downloadAllBtn) {
    downloadAllBtn.hidden = true;
    fetch(assetUrl(data.zipUrl), { method: 'HEAD' }).then(function (response) {
      if (!response.ok) return;
      downloadAllBtn.hidden = false;
      downloadAllBtn.addEventListener('click', function () {
        const link = document.createElement('a');
        link.href = assetUrl(data.zipUrl);
        link.download = 'kk-phonemes.zip';
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    }).catch(function () {
      downloadAllBtn.hidden = true;
    });
  }

  window.addEventListener('pagehide', stopPlayback);
})();
