// 課程學習 Practice Panel：共用既有 TTS / 錄音 / WAV 轉換 / /api/assess 與結果顯示。
// Voice 固定 Ava；不寫入歷史紀錄、不自動播放、不自動錄音。
(function () {
  const COURSE_VOICE = 'en-US-AvaNeural';
  const COURSE_VOICE_LABEL = 'Ava';

  const panelCol = document.getElementById('coursePracticeCol');
  const sentenceEl = document.getElementById('coursePracticeText');
  const translationEl = document.getElementById('coursePracticeTranslation');
  const speakBtn = document.getElementById('speakBtn');
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusEl = document.getElementById('status');
  const audio = document.getElementById('audio');
  const volumeMeter = document.getElementById('volumeMeter');
  const volumeFill = document.getElementById('volumeFill');

  if(!panelCol || !sentenceEl || !speakBtn || !recordBtn || !stopBtn || !analyzeBtn || !statusEl) return;

  enhanceAudioPlayer(audio, { autoShow: false });

  let currentText = '';
  let mediaRecorder;
  let chunks = [];
  let currentBlobUrl = '';
  let lastRecordingBlob = null;
  let currentStream = null;
  let volumeAudioCtx, volumeAnalyser, volumeData, volumeRAF;

  function setStatus(text){
    statusEl.textContent = text;
  }

  function hasSentence(){
    return !!currentText;
  }

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
    }catch(e){ /* 不支援音量條時仍可錄音 */ }
  }

  function stopVolumeMeter(){
    if(volumeRAF) cancelAnimationFrame(volumeRAF);
    volumeRAF = null;
    if(volumeAudioCtx){ volumeAudioCtx.close(); volumeAudioCtx = null; }
    if(volumeFill) volumeFill.style.width = '0%';
    if(volumeMeter) volumeMeter.style.display = 'none';
  }

  function hideRecordingPlayer(){
    if(audio){
      audio.pause();
      audio.removeAttribute('src');
      if(audio._audioPlayerWrap) audio._audioPlayerWrap.style.display = 'none';
    }
    if(currentBlobUrl){
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = '';
    }
    lastRecordingBlob = null;
  }

  function stopActiveRecording(){
    if(mediaRecorder && mediaRecorder.state !== 'inactive'){
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      try{ mediaRecorder.stop(); }catch(e){ /* already stopped */ }
    }
    if(currentStream){
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
    }
    stopVolumeMeter();
    recordBtn.disabled = !hasSentence();
    stopBtn.disabled = true;
  }

  function resetPracticeSession(){
    if(typeof stopStandardPronunciation === 'function') stopStandardPronunciation();
    stopActiveRecording();
    hideRecordingPlayer();
    analyzeBtn.disabled = true;
    speakBtn.disabled = !hasSentence();
    if(typeof resetAssessmentUi === 'function') resetAssessmentUi();
  }

  function setPracticeEnabled(on){
    speakBtn.disabled = !on;
    recordBtn.disabled = !on;
    stopBtn.disabled = true;
    analyzeBtn.disabled = true;
  }

  function openPracticePanel(){
    panelCol.classList.add('is-open');
  }

  function setTranslation(text){
    if(!translationEl) return;
    const translation = (text || '').trim();
    translationEl.textContent = translation;
    translationEl.hidden = !translation;
  }

  function setCoursePracticeSentence(sentence){
    const english = typeof sentence === 'string'
      ? sentence
      : (sentence && sentence.text) || '';
    const translation = typeof sentence === 'string'
      ? ''
      : (sentence && sentence.translation) || '';
    currentText = english.trim();
    sentenceEl.textContent = currentText || '請從左側選擇一句開始練習。';
    setTranslation(currentText ? translation : '');
    openPracticePanel();
    resetPracticeSession();
    if(currentText){
      setPracticeEnabled(true);
      setStatus('已選取句子。可以播放標準發音，或按「開始錄音」。');
    }else{
      setPracticeEnabled(false);
      setStatus('請先從左側選擇一句，再播放標準發音或開始錄音。');
    }
  }

  function clearCoursePracticeSentence(){
    panelCol.classList.remove('is-open');
    currentText = '';
    sentenceEl.textContent = '請從左側選擇一句開始練習。';
    setTranslation('');
    resetPracticeSession();
    setPracticeEnabled(false);
    setStatus('請先從左側選擇一句，再播放標準發音或開始錄音。');
  }

  speakBtn.addEventListener('click', async () => {
    if(!hasSentence()){ setStatus('請先從左側選擇一句。'); return; }
    setStatus(`正在播放標準發音（${COURSE_VOICE_LABEL}）……`);
    const result = await speakStandardPronunciation(currentText, {
      rate: 1.0,
      voice: COURSE_VOICE
    });
    if(result.source === 'azure'){
      setStatus(`正在播放標準發音（${COURSE_VOICE_LABEL}）。`);
    }else if(result.source === 'fallback'){
      setStatus('Azure 語音暫時無法使用，已改用瀏覽器內建發音。');
    }
  });

  recordBtn.addEventListener('click', async () => {
    if(!hasSentence()){ setStatus('請先從左側選擇一句。'); return; }
    try{
      if(typeof stopStandardPronunciation === 'function') stopStandardPronunciation();
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      currentStream = stream;
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
          currentStream = null;
          analyzeBtn.disabled = true;
          setStatus('這次沒有錄到聲音，請再按「開始錄音」。');
          return;
        }
        currentBlobUrl = URL.createObjectURL(lastRecordingBlob);
        audio.src = currentBlobUrl;
        showAudioPlayer(audio);

        stream.getTracks().forEach(t => t.stop());
        currentStream = null;
        analyzeBtn.disabled = false;
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
    if(!hasSentence()){
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
      const payload = await runPronunciationAssessment(currentText, lastRecordingBlob, setStatus);
      renderAssessment(payload);
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

  setPracticeEnabled(false);
  window.setCoursePracticeSentence = setCoursePracticeSentence;
  window.clearCoursePracticeSentence = clearCoursePracticeSentence;
})();
