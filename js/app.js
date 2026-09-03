
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
  if(!assessApiUrl()){
    setStatus(ASSESS_ERROR_TEXT.NOT_CONFIGURED);
    return;
  }

  analyzeBtn.disabled = true;
  try{
    const payload = await runPronunciationAssessment(text, lastRecordingBlob, setStatus);
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
