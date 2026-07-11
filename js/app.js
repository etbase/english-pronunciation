
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
const volumeMeter = document.getElementById('volumeMeter');
const volumeFill = document.getElementById('volumeFill');

let mediaRecorder;
let chunks = [];
let currentBlobUrl = "";

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

// 瀏覽器內建語音（Web Speech API）免費但每個作業系統提供的語音不同，
// 優先挑選使用者指定的 Daniel，若裝置上沒有這個語音則自動退回英文語音。
let voices = [];
function loadVoices(){ voices = window.speechSynthesis.getVoices(); }
loadVoices();
if('onvoiceschanged' in window.speechSynthesis){
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(){
  return voices.find(v => v.name === 'Daniel')
    || voices.find(v => v.name.includes('Daniel'))
    || voices.find(v => v.lang === 'en-US')
    || voices.find(v => v.lang && v.lang.startsWith('en'))
    || null;
}

speakBtn.addEventListener('click', () => {
  const text = sentence.value.trim();
  if(!text){ setStatus('請先輸入英文句子。'); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if(voice){
    utter.voice = voice;
    utter.lang = voice.lang;
  }else{
    utter.lang = 'en-US';
  }
  utter.rate = (slowToggle && slowToggle.checked) ? 0.6 : 0.9;
  window.speechSynthesis.speak(utter);
  setStatus('正在播放標準發音。正式版會改用 Azure AI 語音。');
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
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    chunks = [];
    const types = ['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    const type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    mediaRecorder = type ? new MediaRecorder(stream,{mimeType:type}) : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      stopVolumeMeter();
      const actualType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks,{type:actualType});
      currentBlobUrl = URL.createObjectURL(blob);
      audio.src = currentBlobUrl;
      audio.style.display = 'block';

      const ext = actualType.includes('mp4') ? 'm4a' : actualType.includes('ogg') ? 'ogg' : 'webm';
      downloadLink.href = currentBlobUrl;
      downloadLink.download = `pronunciation-${slugify(sentence.value.trim())}-${timestampLabel()}.${ext}`;
      downloadLink.style.display = 'flex';

      stream.getTracks().forEach(t => t.stop());
      analyzeBtn.disabled = false;
      saveHistory(sentence.value.trim(), blob);
      updatePracticeStats();
      setStatus('錄音完成。可以播放確認，也可以下載音檔。');
    };

    mediaRecorder.start();
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

const metricIds = ['accuracy','stress','rhythm','connected','elision','fluency'];

analyzeBtn.addEventListener('click', () => {
  const score = Math.floor(Math.random() * 41) + 50; // 50-90 demo
  document.getElementById('overall').textContent = score;
  document.getElementById('scoreRing').style.background = `conic-gradient(var(--teal) 0 ${score}%, #dff4f2 ${score}% 100%)`;

  const img = document.getElementById('characterImage');
  if(img){
    img.onerror = null;
    img.src = score >= 60 ? 'assets/characters/character-koala-happy.png' : 'assets/characters/character-koala-angry.png';
  }
  document.getElementById('scoreText').textContent = score >= 60 ? 'Great!' : 'Keep Trying!';
  document.getElementById('scoreMessage').innerHTML = score >= 60
    ? '你的發音清晰，節奏掌握得不錯，<br>再練習連音會更自然喔！'
    : '這次分數偏低，可以先放慢速度，<br>再重新錄一次。';

  metricIds.forEach(id => {
    const metricScore = Math.floor(Math.random() * 41) + 50; // 50-90 demo，暫用與 overall 相同的模擬邏輯
    document.getElementById(`bar-${id}`).style.width = `${metricScore}%`;
    document.getElementById(`value-${id}`).innerHTML = `${metricScore} <small>/100</small>`;
  });

  setStatus('目前為模擬分析。正式版會把錄音送到 Azure Speech 做真正分析。');
});

// 錄音改存成 Base64（data URL）而非 Blob URL，避免重新整理頁面後歷史紀錄的音檔失效。
// 同一句話只保留最後一次錄音：儲存前先移除相同句子的舊紀錄。
function saveHistory(text, audioBlob){
  if(!text) return;

  const writeRecord = (audioDataUrl) => {
    const records = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
    const filtered = records.filter(r => r.text !== text);
    filtered.unshift({ text, audioUrl: audioDataUrl || '', createdAt: new Date().toLocaleString('zh-TW') });
    const trimmed = filtered.slice(0, 5);

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

// 給「我的帳戶」頁面顯示用的累計統計，跟 pronunicationHistory（只留最近 5 筆去重紀錄）分開記錄，
// 這樣才能顯示「總練習次數」等不會因為去重或超過 5 筆而被蓋掉的數字。
function updatePracticeStats(){
  const stats = JSON.parse(localStorage.getItem('pronunciationStats') || '{}');
  stats.totalRecordings = (stats.totalRecordings || 0) + 1;
  stats.lastRecordedAt = new Date().toLocaleString('zh-TW');
  localStorage.setItem('pronunciationStats', JSON.stringify(stats));
}
