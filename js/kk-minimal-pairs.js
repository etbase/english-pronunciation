// 最小對立分頁：播放與 ZIP 使用已匯入的 MP3，不呼叫 Azure。
(function () {
  const data = window.KK_MINIMAL_PAIRS;
  const panel = document.getElementById('kkPairsPanel');
  const listEl = document.getElementById('kkMpList');
  if (!data || !panel || !listEl) return;

  const voices = data.voices || [];
  const statsEl = document.getElementById('kkMpStats');
  const groupFilter = document.getElementById('kkMpGroupFilter');
  const statusEl = document.getElementById('kkMpStatus');
  const fileSets = {
    female: new Set((data.files && data.files.female) || []),
    male: new Set((data.files && data.files.male) || [])
  };
  const groupsById = Object.create(null);
  (data.groups || []).forEach(function (group) {
    groupsById[group.id] = group;
  });

  let currentAudio = null;
  let playingKey = '';

  function setStatus(text) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function voiceFolder(voice) {
    return voice.folder || 'female';
  }

  function fileName(word, voice) {
    const files = word.files || {};
    return files[voiceFolder(voice)] || (word.fileBase + '_' + (voice.suffix || voiceFolder(voice)) + '.mp3');
  }

  function fileUrl(word, voice) {
    return data.audioBase + voiceFolder(voice) + '/' + encodeURIComponent(fileName(word, voice));
  }

  function hasFile(word, voice) {
    return fileSets[voiceFolder(voice)] && fileSets[voiceFolder(voice)].has(fileName(word, voice));
  }

  function itemKey(word, voice) {
    return word.id + ':' + voiceFolder(voice);
  }

  function stopPlayback() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    playingKey = '';
    listEl.querySelectorAll('.kk-ex-voice.is-playing').forEach(function (el) {
      el.classList.remove('is-playing');
    });
  }

  function markPlaying(key) {
    listEl.querySelectorAll('.kk-ex-voice.is-playing').forEach(function (el) {
      el.classList.remove('is-playing');
    });
    playingKey = key || '';
    if (!key) return;
    const group = listEl.querySelector('[data-pair-key="' + CSS.escape(key) + '"]');
    if (group) group.classList.add('is-playing');
  }

  function downloadBlob(blob, name) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  function selectedGroupId() {
    return groupFilter ? groupFilter.value : 'all';
  }

  function visibleGroups() {
    const selected = selectedGroupId();
    return (data.groups || []).filter(function (group) {
      return selected === 'all' || group.id === selected;
    }).map(function (group) {
      return {
        id: group.id,
        contrast: group.contrast,
        kind: group.kind,
        words: (data.words || []).filter(function (word) {
          return word.groups.indexOf(group.id) !== -1;
        })
      };
    }).filter(function (group) {
      return group.words.length;
    });
  }

  function renderVoice(word, voice) {
    const key = itemKey(word, voice);
    const ready = hasFile(word, voice);
    const group = document.createElement('div');
    group.className = 'kk-ex-voice' + (playingKey === key ? ' is-playing' : '');
    group.setAttribute('data-pair-key', key);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'primary-btn btn-outline btn-compact kk-ex-play-btn';
    playBtn.setAttribute('aria-label', '播放' + voice.label);
    playBtn.innerHTML = '<img src="assets/icons/kkspeaker.svg" alt="">' + voice.label;
    playBtn.addEventListener('click', function () {
      playWord(word, voice);
    });
    group.appendChild(playBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'small-btn btn-outline kk-icon-btn';
    downloadBtn.setAttribute('aria-label', '下載' + voice.label);
    downloadBtn.innerHTML = '<img src="assets/icons/download.svg" alt="">';
    downloadBtn.addEventListener('click', function () {
      downloadWord(word, voice);
    });
    group.appendChild(downloadBtn);

    const status = document.createElement('span');
    status.className = 'kk-ex-status' + (ready ? ' is-ready' : '');
    status.textContent = ready ? '已完成' : '尚未匯入';
    group.appendChild(status);
    return group;
  }

  function renderRow(word) {
    const row = document.createElement('div');
    row.className = 'kk-row kk-ex-row';

    const kind = document.createElement('span');
    kind.className = 'kk-ex-kind';
    kind.textContent = '單字';
    row.appendChild(kind);

    const text = document.createElement('div');
    text.className = 'kk-ex-text';
    text.textContent = word.text;
    row.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'kk-ex-voices';
    voices.forEach(function (voice) {
      actions.appendChild(renderVoice(word, voice));
    });
    row.appendChild(actions);
    return row;
  }

  function renderList() {
    const groups = visibleGroups();
    listEl.innerHTML = '';
    if (!groups.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = '沒有符合的單字。';
      listEl.appendChild(empty);
      return;
    }
    groups.forEach(function (group) {
      const wrap = document.createElement('div');
      wrap.className = 'kk-ex-group';
      const title = document.createElement('div');
      title.className = 'section-title kk-group-title kk-mp-title';
      const badge = document.createElement('span');
      badge.className = 'num';
      badge.textContent = group.id;
      title.appendChild(badge);
      title.appendChild(document.createTextNode(group.contrast + ' ' + (group.kind === 'vowel' ? '母音' : '子音')));
      wrap.appendChild(title);
      const rows = document.createElement('div');
      rows.className = 'kk-list';
      group.words.forEach(function (word) {
        rows.appendChild(renderRow(word));
      });
      wrap.appendChild(rows);
      listEl.appendChild(wrap);
    });
  }

  function renderFilter() {
    if (!groupFilter) return;
    groupFilter.innerHTML = '<option value="all">全部組別</option>';
    (data.groups || []).forEach(function (group) {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.id + '  ' + group.contrast + '  ' + (group.kind === 'vowel' ? '母音' : '子音');
      groupFilter.appendChild(option);
    });
  }

  function renderStats() {
    if (!statsEl) return;
    const stats = data.stats || {};
    statsEl.textContent = '對立組別 ' + (stats.groups || 0) + '（母音 ' + (stats.vowels || 0) + '、子音 ' + (stats.consonants || 0) + '）　單字 ' + (stats.words || 0) + '　每種聲音應有 MP3 ' + (stats.words || 0) + '　儲存庫女聲 ' + fileSets.female.size + '、男聲 ' + fileSets.male.size;
  }

  async function playWord(word, voice) {
    const key = itemKey(word, voice);
    const name = fileName(word, voice);
    if (!hasFile(word, voice)) {
      setStatus('缺少音檔：' + data.audioBase + voiceFolder(voice) + '/' + name);
      return;
    }
    try {
      if (typeof window.stopKkPhonemePlayback === 'function') window.stopKkPhonemePlayback();
      if (typeof window.stopKkExamplePlayback === 'function') window.stopKkExamplePlayback();
      stopPlayback();
      const audio = new Audio(fileUrl(word, voice));
      currentAudio = audio;
      markPlaying(key);
      audio.onended = function () {
        if (currentAudio === audio) {
          currentAudio = null;
          markPlaying('');
        }
      };
      audio.onerror = function () {
        markPlaying('');
        setStatus('這個音檔暫時無法播放：' + name);
      };
      await audio.play();
      setStatus('');
    } catch (error) {
      markPlaying('');
      setStatus('瀏覽器擋住播放，請再按一次。');
    }
  }

  async function downloadWord(word, voice) {
    const name = fileName(word, voice);
    if (!hasFile(word, voice)) {
      setStatus('缺少音檔：' + data.audioBase + voiceFolder(voice) + '/' + name);
      return;
    }
    try {
      const response = await fetch(fileUrl(word, voice));
      if (!response.ok) throw new Error('HTTP');
      const blob = await response.blob();
      downloadBlob(blob, name);
      setStatus('');
    } catch (error) {
      setStatus('這個音檔暫時無法下載：' + name);
    }
  }

  function downloadZip(folder, downloadName) {
    const url = data.zips && data.zips[folder];
    const count = fileSets[folder] ? fileSets[folder].size : 0;
    if (!url || count !== (data.stats && data.stats.words)) {
      setStatus('ZIP 還沒備齊。儲存庫' + (folder === 'female' ? '女聲' : '男聲') + ' ' + count + ' / ' + ((data.stats && data.stats.words) || 0) + '。');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatus('ZIP 開始下載：' + downloadName + '（' + count + ' 個 MP3）。');
  }

  const zipFemale = document.getElementById('kkMpZipFemale');
  const zipMale = document.getElementById('kkMpZipMale');
  if (zipFemale) zipFemale.addEventListener('click', function () {
    downloadZip('female', 'Minimal_Pairs_female.zip');
  });
  if (zipMale) zipMale.addEventListener('click', function () {
    downloadZip('male', 'Minimal_Pairs_male.zip');
  });
  if (groupFilter) groupFilter.addEventListener('change', renderList);

  renderStats();
  renderFilter();
  renderList();
  window.stopKkPairPlayback = stopPlayback;
})();
