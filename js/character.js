// 自由練習與課程學習共用的角色狀態。只負責分析區角色圖片，不參與評分或錄音。
(function (global) {
  const BASE = 'assets/characters/';
  const IMAGES = {
    ready: BASE + 'character_ready.webp',
    listening: BASE + 'character_listening.webp',
    speaking01: BASE + 'character_speaking01.webp',
    speaking02: BASE + 'character_speaking02.webp',
    thinking: BASE + 'character_thinking.webp',
    happy: BASE + 'character_happy.webp',
    sad: BASE + 'character_sad.webp'
  };
  const HAPPY_MIN = 80;

  let currentState = 'ready';
  let nextSpeakingIs01 = true;
  let preloaded = false;

  function characterImage(){
    return document.getElementById('characterImage');
  }

  function preload(){
    if(preloaded) return;
    preloaded = true;
    Object.keys(IMAGES).forEach(function(state){
      const image = new Image();
      image.src = IMAGES[state];
    });
  }

  function setState(state){
    if(!IMAGES[state]) return;
    currentState = state;
    const img = characterImage();
    if(!img) return;
    img.removeAttribute('onerror');
    img.alt = '角色';
    if(img.getAttribute('src') !== IMAGES[state]){
      img.src = IMAGES[state];
    }
  }

  function resetForNewPractice(){
    nextSpeakingIs01 = true;
    setState('ready');
  }

  function onRecordingStarted(){
    setState('listening');
  }

  function onRecordingFailedToStart(){
    setState('ready');
  }

  function onRecordingEmpty(){
    setState('ready');
  }

  function onPlaybackStarted(){
    if(currentState === 'thinking') return;
    setState(nextSpeakingIs01 ? 'speaking01' : 'speaking02');
    nextSpeakingIs01 = !nextSpeakingIs01;
  }

  function onAnalyzeStarted(){
    setState('thinking');
  }

  function onAnalyzeSuccess(overallScore){
    const score = typeof overallScore === 'number' ? overallScore : Number(overallScore);
    if(!Number.isFinite(score)){
      setState('ready');
      return;
    }
    setState(score >= HAPPY_MIN ? 'happy' : 'sad');
  }

  function onAnalyzeFailed(){
    setState('ready');
  }

  function init(){
    preload();
    resetForNewPractice();
  }

  global.Character = {
    IMAGES: IMAGES,
    init: init,
    preload: preload,
    setState: setState,
    resetForNewPractice: resetForNewPractice,
    onRecordingStarted: onRecordingStarted,
    onRecordingFailedToStart: onRecordingFailedToStart,
    onRecordingEmpty: onRecordingEmpty,
    onPlaybackStarted: onPlaybackStarted,
    onAnalyzeStarted: onAnalyzeStarted,
    onAnalyzeSuccess: onAnalyzeSuccess,
    onAnalyzeFailed: onAnalyzeFailed,
    getState: function(){ return currentState; }
  };
})(window);
