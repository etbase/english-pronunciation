
const sentence = document.getElementById('sentence');
const counter = document.getElementById('counter');
const speakBtn = document.getElementById('speakBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusEl = document.getElementById('status');
const audio = document.getElementById('audio');
const downloadLink = document.getElementById('downloadLink');

let mediaRecorder;
let chunks = [];
let currentBlobUrl = "";

function setStatus(text){ statusEl.textContent = text; }
function updateCounter(){ counter.textContent = `${sentence.value.length} / 200`; }
sentence.addEventListener('input', updateCounter);
updateCounter();

speakBtn.addEventListener('click', () => {
  const text = sentence.value.trim();
  if(!text){ setStatus('請先輸入英文句子。'); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
  setStatus('正在播放標準發音。正式版會改用 Azure AI 語音。');
});

recordBtn.addEventListener('click', async () => {
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    chunks = [];
    const types = ['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    const type = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    mediaRecorder = type ? new MediaRecorder(stream,{mimeType:type}) : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const actualType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks,{type:actualType});
      currentBlobUrl = URL.createObjectURL(blob);
      audio.src = currentBlobUrl;
      audio.style.display = 'block';

      const ext = actualType.includes('mp4') ? 'm4a' : actualType.includes('ogg') ? 'ogg' : 'webm';
      downloadLink.href = currentBlobUrl;
      downloadLink.download = `my-pronunciation.${ext}`;
      downloadLink.style.display = 'inline-flex';

      stream.getTracks().forEach(t => t.stop());
      analyzeBtn.disabled = false;
      saveHistory(sentence.value.trim(), currentBlobUrl);
      setStatus('錄音完成。可以播放確認，也可以下載音檔。');
    };

    mediaRecorder.start();
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
  document.getElementById('scoreRing').style.background = `conic-gradient(var(--green) 0 ${score}%, #e6ede2 ${score}% 100%)`;

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

function saveHistory(text, audioUrl){
  if(!text) return;
  const records = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
  records.unshift({ text, audioUrl, createdAt: new Date().toLocaleString('zh-TW') });
  localStorage.setItem('pronunciationHistory', JSON.stringify(records.slice(0,5)));
}
