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
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio = null;
    }
  }

  function playUrl(url, id) {
    return new Promise(function (resolve, reject) {
      stopSingle();
      setPlayingId(id || '');
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = function () {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onerror = function () {
        if (currentAudio === audio) currentAudio = null;
        reject(new Error('missing'));
      };
      const start = audio.play();
      if (start && typeof start.catch === 'function') {
        start.catch(function () {
          if (currentAudio === audio) currentAudio = null;
          reject(new Error('blocked'));
        });
      }
    });
  }

  function stopSingle() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio = null;
    }
  }

  function playPhoneme(item) {
    stopPlayback();
    setStatus('');
    return playUrl(data.audioUrl(item.id), item.id).then(function () {
      setPlayingId('');
    }).catch(function () {
      setPlayingId('');
      setStatus('這個音標的音檔還沒匯入。');
    });
  }

  function downloadPhoneme(item) {
    const url = data.audioUrl(item.id);
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
    }).catch(function () {
      setPlayingId('');
      setStatus('這個音標的音檔還沒匯入。');
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
      playBtn.innerHTML = '<img src="assets/icons/speaker.svg" alt="">';
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
    fetch(data.zipUrl, { method: 'HEAD' }).then(function (response) {
      if (!response.ok) return;
      downloadAllBtn.hidden = false;
      downloadAllBtn.addEventListener('click', function () {
        const link = document.createElement('a');
        link.href = data.zipUrl;
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
