
const sentence = document.getElementById('sentence');
const counter = document.getElementById('counter');
const speakBtn = document.getElementById('speakBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusEl = document.getElementById('status');
const audio = document.getElementById('audio');
const downloadLink = document.getElementById('downloadLink');
const slowToggle = document.getElementById('slowToggle');
const slowToggleRate = document.getElementById('slowToggleRate');
const volumeMeter = document.getElementById('volumeMeter');
const volumeFill = document.getElementById('volumeFill');
const saveFolderBtn = document.getElementById('saveFolderBtn');

enhanceAudioPlayer(audio, { autoShow: false });

let mediaRecorder;
let chunks = [];
let currentBlobUrl = "";
let lastRecordingBlob = null;

function setStatus(text){ statusEl.textContent = text; }
function updateCounter(){ counter.textContent = `${sentence.value.length} / 200`; }
sentence.addEventListener('input', updateCounter);
updateCounter();

// 從歷史紀錄按「重新練習」跳過來時，網址會帶 ?sentence=...，載入後直接帶入句子。
const prefillSentence = new URLSearchParams(location.search).get('sentence');
if(prefillSentence){
  sentence.value = prefillSentence;
  updateCounter();
  history.replaceState(null, '', location.pathname);
}

// 資料夾收藏：圖示按下去會跳出小面板選資料夾，收藏後圖示會維持「按下去」的樣式，
// 换句話或編輯句子後，圖示狀態也要跟著更新成目前這句話有沒有被收藏過。
function refreshSaveFolderBtnState(){
  if(!saveFolderBtn) return;
  const saved = typeof isSentenceSaved === 'function' && isSentenceSaved(sentence.value.trim());
  saveFolderBtn.classList.toggle('active', !!saved);
  saveFolderBtn.setAttribute('aria-pressed', String(!!saved));
}
if(saveFolderBtn){
  saveFolderBtn.addEventListener('click', () => {
    const text = sentence.value.trim();
    if(!text){ setStatus('請先輸入句子，才能收藏到資料夾。'); return; }
    openFolderPopover(saveFolderBtn, text, refreshSaveFolderBtnState);
  });
  sentence.addEventListener('input', refreshSaveFolderBtnState);
  refreshSaveFolderBtnState();
}

// 慢速播放改用按鈕點擊切換（而不是勾選框），按一下在 1.0（正常）／0.5（慢速）之間切換。
// 已取得的 Azure 音訊不會重新產生，只改 Audio.playbackRate。
let isSlowPlayback = false;
if(slowToggle){
  slowToggle.addEventListener('click', () => {
    isSlowPlayback = !isSlowPlayback;
    slowToggle.classList.toggle('active', isSlowPlayback);
    slowToggle.setAttribute('aria-pressed', String(isSlowPlayback));
    if(slowToggleRate) slowToggleRate.textContent = isSlowPlayback ? '0.5' : '1.0';
    if(typeof setStandardPronunciationRate === 'function'){
      setStandardPronunciationRate(isSlowPlayback ? 0.5 : 1.0);
    }
  });
}

let selectedVoice = 'en-US-AvaNeural';
let selectedVoiceLabel = 'Ava';
const voiceRow = document.getElementById('voiceRow');
if(voiceRow){
  voiceRow.querySelectorAll('.voice-btn').forEach(btn => {
    btn.disabled = false;
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectedVoice = btn.getAttribute('data-voice') || 'en-US-AvaNeural';
      selectedVoiceLabel = btn.getAttribute('data-voice-label') || 'Ava';
      voiceRow.querySelectorAll('.voice-btn').forEach(item => {
        const on = item === btn;
        item.classList.toggle('selected', on);
        item.setAttribute('aria-pressed', String(on));
      });
    });
  });
}

speakBtn.addEventListener('click', async () => {
  const text = sentence.value.trim();
  if(!text){ setStatus('請先輸入英文句子。'); return; }
  setStatus(`正在播放標準發音（${selectedVoiceLabel}）……`);
  const result = await speakStandardPronunciation(text, {
    rate: isSlowPlayback ? 0.5 : 1.0,
    voice: selectedVoice
  });
  if(result.source === 'azure'){
    setStatus(`正在播放標準發音（${selectedVoiceLabel}）。`);
  }else if(result.source === 'fallback'){
    setStatus('Azure 語音暫時無法使用，已改用瀏覽器內建發音。');
  }
});

// 用 Web Audio API 讀麥克風音量，錄音時顯示跳動的音量條，讓使用者確定真的有收到聲音。
let volumeAudioCtx, volumeAnalyser, volumeData, volumeRAF;
function startVolumeMeter(stream){
  try{
    volumeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = volumeAudioCtx.createMediaStreamSource(stream);
    volumeAnalyser = volumeAudioCtx.createAnalyser();
    volumeAnalyser.fftSize = 256;
    source.connect(volumeAnalyser);
    volumeData = new Uint8Array(volumeAnalyser.frequencyBinCount);
    if(volumeMeter) volumeMeter.style.display = 'flex';

    const tick = () => {
      volumeAnalyser.getByteFrequencyData(volumeData);
      let sum = 0;
      for(let i = 0; i < volumeData.length; i++) sum += volumeData[i];
      const avg = sum / volumeData.length;
      const pct = Math.min(100, (avg / 90) * 100);
      if(volumeFill) volumeFill.style.width = `${pct}%`;
      volumeRAF = requestAnimationFrame(tick);
    };
    tick();
  }catch(e){ /* 部分瀏覽器可能不支援 Web Audio API，音量條先不顯示即可，不影響錄音本身 */ }
}

function stopVolumeMeter(){
  if(volumeRAF) cancelAnimationFrame(volumeRAF);
  volumeRAF = null;
  if(volumeAudioCtx){ volumeAudioCtx.close(); volumeAudioCtx = null; }
  if(volumeFill) volumeFill.style.width = '0%';
  if(volumeMeter) volumeMeter.style.display = 'none';
}

// 幫下載檔案取個看得懂的檔名（句子開頭幾個字＋錄音時間），避免每次都同名被瀏覽器自動編號。
function slugify(text){
  const slug = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join('-');
  return slug || 'recording';
}
function timestampLabel(){
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

recordBtn.addEventListener('click', async () => {
  try{
    if(typeof stopStandardPronunciation === 'function') stopStandardPronunciation();
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    chunks = [];
    const types = ['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    const type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    mediaRecorder = type ? new MediaRecorder(stream,{mimeType:type}) : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if(e.data && e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      stopVolumeMeter();
      const actualType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks,{type:actualType});
      lastRecordingBlob = blob.size > 0 ? blob : null;
      if(currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
      if(!lastRecordingBlob){
        stream.getTracks().forEach(t => t.stop());
        analyzeBtn.disabled = true;
        setStatus('這次沒有錄到聲音，請再按「開始錄音」。');
        return;
      }
      currentBlobUrl = URL.createObjectURL(lastRecordingBlob);
      audio.src = currentBlobUrl;
      showAudioPlayer(audio);

      const ext = actualType.includes('mp4') ? 'm4a' : actualType.includes('ogg') ? 'ogg' : 'webm';
      downloadLink.href = currentBlobUrl;
      downloadLink.download = `pronunciation-${slugify(sentence.value.trim())}-${timestampLabel()}.${ext}`;
      downloadLink.style.display = 'flex';

      stream.getTracks().forEach(t => t.stop());
      analyzeBtn.disabled = false;
      saveHistory(sentence.value.trim(), lastRecordingBlob);
      updatePracticeStats();
      setStatus(`錄音完成（${actualType}，${Math.round(lastRecordingBlob.size / 1024)} KB）。可以播放確認，再按「分析發音」。`);
    };

    mediaRecorder.start(250);
    startVolumeMeter(stream);
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    analyzeBtn.disabled = true;
    setStatus('錄音中……請跟著標準發音朗讀。');
  }catch(e){
    setStatus('無法使用麥克風，請確認瀏覽器已允許麥克風權限。');
  }
});

stopBtn.addEventListener('click', () => {
  if(mediaRecorder && mediaRecorder.state !== 'inactive'){
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

const ASSESS_ERROR_TEXT = {
  NO_RECORDING: '請先錄音，再按「分析發音」。',
  NO_TEXT: '請先輸入英文句子。',
  WAV_UNSUPPORTED: '這個瀏覽器無法轉換錄音格式，請改用 Chrome 或 Safari 再試。',
  WAV_CONVERT_FAILED: '錄音無法轉成分析格式，請重新錄音後再試。',
  WAV_ENCODE_FAILED: '錄音無法轉成分析格式，請重新錄音後再試。',
  AUDIO_TOO_LONG: '錄音超過 30 秒，請改唸較短的句子後再分析。',
  AUDIO_TOO_SHORT: '錄音太短，請重新錄一次後再分析。',
  NO_SPEECH: '沒有辨識到清楚的英文，請重新錄音後再試。',
  NOT_CONFIGURED: '評分服務尚未設定，目前無法分析。',
  BAD_REQUEST: '送出的錄音或句子無法分析，請重新錄音後再試。',
  ASSESS_FAILED: '目前無法完成發音分析，請稍後再試。',
  NETWORK: '無法連線到評分服務，請確認網路後再試。'
};

function assessApiUrl(){
  const url = window.PRONUNCIATION_CONFIG && window.PRONUNCIATION_CONFIG.assessApiUrl;
  return url || '';
}

function formatAzureScore(value){
  if(typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function setMetricScore(id, value){
  const score = formatAzureScore(value);
  const bar = document.getElementById(`bar-${id}`);
  const label = document.getElementById(`value-${id}`);
  if(!bar || !label || score == null) return;
  bar.style.width = `${Math.max(0, Math.min(100, score))}%`;
  label.innerHTML = '';
  label.appendChild(document.createTextNode(String(score) + ' '));
  const small = document.createElement('small');
  small.textContent = '/100';
  label.appendChild(small);
}

function joinWords(items){
  return (items || []).map(item => item.word).filter(Boolean).join('、');
}

function joinIssueWords(items){
  return (items || []).map(item => item.word).filter(Boolean).join(' ・ ');
}

function phonemesOfWord(word){
  const list = [];
  (word.syllables || []).forEach(syl => {
    (syl.phonemes || []).forEach(ph => list.push(ph));
  });
  (word.phonemes || []).forEach(ph => list.push(ph));
  return list;
}

function attentionPhonemes(word, threshold){
  const seen = new Set();
  const result = [];
  phonemesOfWord(word).forEach(ph => {
    const symbol = ph && ph.phoneme ? String(ph.phoneme) : '';
    const score = formatAzureScore(ph && ph.accuracyScore);
    if(!symbol || score == null || score >= threshold || seen.has(symbol)) return;
    seen.add(symbol);
    result.push(symbol);
  });
  return result;
}

function appendDetailGroup(parent, title, child){
  const box = document.createElement('div');
  box.className = 'detail-group';
  const heading = document.createElement('strong');
  heading.textContent = title;
  box.appendChild(heading);
  box.appendChild(child);
  parent.appendChild(box);
}

function renderDetailAnalysis(result){
  const groups = document.getElementById('detailGroups');
  const tree = document.getElementById('wordTree');
  const detail = document.getElementById('detailAnalysis');
  if(!groups || !detail) return;

  groups.innerHTML = '';
  if(tree) tree.innerHTML = '';

  const threshold = typeof result.lowAccuracyThreshold === 'number'
    ? result.lowAccuracyThreshold
    : 60;
  const words = result.words || [];
  const misWords = words.filter(word => word.errorType === 'Mispronunciation');
  const omissions = (result.issues && result.issues.omissions) || [];
  const insertions = (result.issues && result.issues.insertions) || [];

  if(misWords.length){
    const list = document.createElement('div');
    list.className = 'detail-issue-list';
    misWords.forEach(word => {
      const item = document.createElement('div');
      item.className = 'detail-issue';
      const name = document.createElement('div');
      name.className = 'detail-issue-word';
      name.textContent = word.word;
      item.appendChild(name);
      const attention = attentionPhonemes(word, threshold);
      if(attention.length){
        const phonemes = document.createElement('p');
        phonemes.className = 'detail-issue-phonemes';
        phonemes.textContent = '需要注意的音：' + attention.map(symbol => '/' + symbol + '/').join('、');
        item.appendChild(phonemes);
      }
      list.appendChild(item);
    });
    appendDetailGroup(groups, '發音需要注意', list);
  }

  if(omissions.length){
    const body = document.createElement('p');
    body.className = 'detail-word-run';
    body.textContent = joinIssueWords(omissions);
    appendDetailGroup(groups, '漏念', body);
  }

  if(insertions.length){
    const body = document.createElement('p');
    body.className = 'detail-word-run';
    body.textContent = joinIssueWords(insertions);
    appendDetailGroup(groups, '多念', body);
  }

  if(!misWords.length && !omissions.length && !insertions.length){
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = '本次沒有偵測到明顯的發音問題。';
    groups.appendChild(empty);
  }

  detail.hidden = false;
}

function renderAssessment(result){
  const scores = result.displayScores || {};
  const overall = formatAzureScore(scores.overall);
  if(overall == null){
    throw new Error('ASSESS_FAILED');
  }

  document.getElementById('overall').textContent = String(overall);
  document.getElementById('scoreRing').style.background = `conic-gradient(var(--teal) 0 ${overall}%, #ecf8f7 ${overall}% 100%)`;
  setMetricScore('accuracy', scores.accuracy);
  setMetricScore('fluency', scores.fluency);
  setMetricScore('completeness', scores.completeness);

  const img = document.getElementById('characterImage');
  if(img){
    img.onerror = null;
    img.src = overall >= 60 ? 'assets/characters/character-koala-happy.png' : 'assets/characters/character-koala-angry.png';
  }

  const issues = result.issues || {};
  const mis = joinWords(issues.mispronunciations);
  const omitted = joinWords(issues.omissions);
  const inserted = joinWords(issues.insertions);
  const facts = [];
  if(result.recognizedText) facts.push(`Azure 辨識為：${result.recognizedText}`);
  if(mis) facts.push(`發音需要注意：${mis}`);
  if(omitted) facts.push(`漏念：${omitted}`);
  if(inserted) facts.push(`多念：${inserted}`);
  if(!mis && !omitted && !inserted) facts.push('Azure 未標示漏字、多字或發音不準的單字。');
  document.getElementById('scoreText').textContent = '';
  document.getElementById('scoreMessage').textContent = facts.join(' ');

  renderDetailAnalysis(result);
}

function assessFailureMessage(code){
  return ASSESS_ERROR_TEXT[code] || ASSESS_ERROR_TEXT.ASSESS_FAILED;
}

function isLocalAssessDebug(){
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function assessDebug(label, detail){
  if(!isLocalAssessDebug()) return;
  if(detail === undefined){
    console.info('[assess]', label);
    return;
  }
  console.info('[assess]', label, detail);
}

analyzeBtn.addEventListener('click', async () => {
  const text = sentence.value.trim();
  if(!text){
    setStatus(ASSESS_ERROR_TEXT.NO_TEXT);
    return;
  }
  if(!lastRecordingBlob){
    setStatus(ASSESS_ERROR_TEXT.NO_RECORDING);
    return;
  }
  const apiUrl = assessApiUrl();
  if(!apiUrl){
    setStatus(ASSESS_ERROR_TEXT.NOT_CONFIGURED);
    return;
  }

  analyzeBtn.disabled = true;
  setStatus('正在準備音訊並送出分析……');
  assessDebug('start', {
    apiUrl,
    textChars: text.length,
    recordingType: lastRecordingBlob.type || '',
    recordingBytes: lastRecordingBlob.size
  });

  try{
    const wavBlob = await recordingBlobToAssessmentWav(lastRecordingBlob);
    assessDebug('wav converted', { wavType: wavBlob.type || 'audio/wav', wavBytes: wavBlob.size });
    setStatus('音訊已轉換，正在送出 Azure 分析……');
    const audioBase64 = await assessmentWavToBase64(wavBlob);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, audioBase64 })
    });
    let payload = null;
    try{ payload = await response.json(); }catch(e){ payload = null; }
    if(!response.ok || !payload || !payload.scores){
      const code = payload && payload.code ? payload.code : (response.status === 422 ? 'NO_SPEECH' : 'ASSESS_FAILED');
      assessDebug('response failed', {
        httpStatus: response.status,
        code,
        error: payload && payload.error ? payload.error : 'response parse failed or scores missing'
      });
      setStatus(assessFailureMessage(code));
      return;
    }
    assessDebug('response ok', {
      httpStatus: response.status,
      PronScore: payload.scores.overall,
      AccuracyScore: payload.scores.accuracy,
      FluencyScore: payload.scores.fluency,
      CompletenessScore: payload.scores.completeness,
      wordCount: Array.isArray(payload.words) ? payload.words.length : 0
    });
    renderAssessment(payload);
    updateHistoryScore(text, payload.displayScores || payload.scores);
    setStatus('分析完成。分數來自 Azure Pronunciation Assessment。');
  }catch(error){
    const message = error && error.message ? String(error.message) : '';
    assessDebug('client exception', { name: error && error.name, message });
    if(message === 'Failed to fetch' || message === 'Load failed' || message === 'NetworkError when attempting to fetch resource.'){
      setStatus(ASSESS_ERROR_TEXT.NETWORK);
    }else{
      setStatus(assessFailureMessage(message || 'ASSESS_FAILED'));
    }
  }finally{
    analyzeBtn.disabled = false;
  }
});

// 錄音改存成 Base64（data URL）而非 Blob URL，避免重新整理頁面後歷史紀錄的音檔失效。
// 同一句話只保留最後一次錄音：儲存前先移除相同句子的舊紀錄。
function saveHistory(text, audioBlob){
  if(!text) return;

  const writeRecord = (audioDataUrl) => {
    const records = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
    const filtered = records.filter(r => r.text !== text);
    filtered.unshift({ text, audioUrl: audioDataUrl || '', score: null, createdAt: new Date().toLocaleString('zh-TW') });
    const trimmed = filtered.slice(0, 10);

    try{
      localStorage.setItem('pronunciationHistory', JSON.stringify(trimmed));
    }catch(e){
      // localStorage 容量不足時，逐步減少保留筆數，盡量保住至少一筆紀錄。
      for(let keep = trimmed.length - 1; keep >= 1; keep--){
        try{
          localStorage.setItem('pronunciationHistory', JSON.stringify(trimmed.slice(0, keep)));
          break;
        }catch(e2){ /* 容量仍不足，繼續減少筆數重試 */ }
      }
    }
  };

  if(!audioBlob){ writeRecord(''); return; }
  const reader = new FileReader();
  reader.onloadend = () => writeRecord(reader.result);
  reader.onerror = () => writeRecord('');
  reader.readAsDataURL(audioBlob);
}

// 錄音跟分析是分開兩個步驟：錄完先存一筆沒有分數的紀錄，等按下「分析發音」算出分數後，
// 再用句子文字找回剛剛那筆紀錄補上分數，這樣歷史紀錄才能顯示每句話的分析結果。
function updateHistoryScore(text, scores){
  if(!text || !scores) return;
  const records = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
  const idx = records.findIndex(r => r.text === text);
  if(idx === -1) return;
  const overall = formatAzureScore(scores.overall);
  if(overall == null) return;
  records[idx].score = overall;
  records[idx].accuracyScore = formatAzureScore(scores.accuracy);
  records[idx].fluencyScore = formatAzureScore(scores.fluency);
  records[idx].completenessScore = formatAzureScore(scores.completeness);
  delete records[idx].prosodyScore;
  try{ localStorage.setItem('pronunciationHistory', JSON.stringify(records)); }catch(e){ /* 容量不足就不補分數，不影響其他紀錄 */ }
}

// 累計練習次數統計，跟 pronunciationHistory（只留最近 10 筆去重紀錄）分開記錄，
// 這樣不會因為去重或超過 10 筆而被蓋掉。
function updatePracticeStats(){
  const stats = JSON.parse(localStorage.getItem('pronunciationStats') || '{}');
  stats.totalRecordings = (stats.totalRecordings || 0) + 1;
  stats.lastRecordedAt = new Date().toLocaleString('zh-TW');
  localStorage.setItem('pronunciationStats', JSON.stringify(stats));
}
