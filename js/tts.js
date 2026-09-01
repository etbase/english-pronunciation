// 全站共用的標準發音播放：練習頁、歷史紀錄、資料夾都走這裡。
// 瀏覽器只呼叫我們自己的 /api/tts，不會接觸 Azure Key。
// Azure 成功 → 播放 MP3；失敗或尚未設定 API → 退回瀏覽器 speechSynthesis。
// 同一句 text + voice 在這個分頁 session 內會重用已取得的音訊，慢速只用 playbackRate。
(function (global) {
  const DEFAULT_VOICE = 'en-US-AvaNeural';
  const CACHE_LIMIT = 40;
  const cache = new Map();
  const inflight = new Map();
  let currentAudio = null;
  let voices = [];

  function loadVoices(){
    if(!global.speechSynthesis) return;
    voices = global.speechSynthesis.getVoices() || [];
  }
  loadVoices();
  if(global.speechSynthesis && 'onvoiceschanged' in global.speechSynthesis){
    global.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getApiUrl(){
    const url = global.PRONUNCIATION_CONFIG && global.PRONUNCIATION_CONFIG.ttsApiUrl;
    if(!url || url.indexOf('YOUR-FUNCTION-APP') !== -1) return '';
    return url;
  }

  function cacheKey(text, voice){
    return voice + '\n' + text;
  }

  function remember(key, objectUrl){
    if(cache.has(key)){
      URL.revokeObjectURL(cache.get(key));
      cache.delete(key);
    }
    cache.set(key, objectUrl);
    while(cache.size > CACHE_LIMIT){
      const oldest = cache.keys().next().value;
      URL.revokeObjectURL(cache.get(oldest));
      cache.delete(oldest);
    }
  }

  function pickFallbackVoice(){
    return voices.find(v => v.name === 'Daniel')
      || voices.find(v => v.name.includes('Daniel'))
      || voices.find(v => v.lang === 'en-US')
      || voices.find(v => v.lang && v.lang.startsWith('en'))
      || null;
  }

  function stopStandardPronunciation(){
    if(currentAudio){
      currentAudio.pause();
      currentAudio.onended = null;
      currentAudio = null;
    }
    if(global.speechSynthesis){
      global.speechSynthesis.cancel();
    }
  }

  function setStandardPronunciationRate(rate){
    if(currentAudio){
      currentAudio.playbackRate = rate;
    }
  }

  function playObjectUrl(objectUrl, rate){
    stopStandardPronunciation();
    const audio = new Audio(objectUrl);
    audio.playbackRate = rate;
    currentAudio = audio;
    audio.onended = () => {
      if(currentAudio === audio) currentAudio = null;
    };
    return audio.play();
  }

  function fallbackSpeak(text, rate){
    if(!global.speechSynthesis) return;
    stopStandardPronunciation();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickFallbackVoice();
    if(voice){
      utter.voice = voice;
      utter.lang = voice.lang;
    }else{
      utter.lang = 'en-US';
    }
    utter.rate = rate;
    global.speechSynthesis.speak(utter);
  }

  async function fetchTtsAudio(text, voice, apiUrl){
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    });
    if(!response.ok){
      throw new Error('tts-http');
    }
    const blob = await response.blob();
    if(!blob || !blob.size){
      throw new Error('tts-empty');
    }
    return URL.createObjectURL(blob);
  }

  function getCachedOrFetch(text, voice, apiUrl){
    const key = cacheKey(text, voice);
    if(cache.has(key)){
      return Promise.resolve(cache.get(key));
    }
    if(inflight.has(key)){
      return inflight.get(key);
    }
    const pending = fetchTtsAudio(text, voice, apiUrl)
      .then(objectUrl => {
        remember(key, objectUrl);
        inflight.delete(key);
        return objectUrl;
      })
      .catch(error => {
        inflight.delete(key);
        throw error;
      });
    inflight.set(key, pending);
    return pending;
  }

  async function speakStandardPronunciation(text, options){
    const trimmed = String(text || '').trim();
    if(!trimmed){
      return { ok: false, source: 'none' };
    }
    const voice = (options && options.voice) || DEFAULT_VOICE;
    const rate = (options && options.rate) != null ? options.rate : 1;
    const apiUrl = getApiUrl();

    if(apiUrl){
      try{
        const objectUrl = await getCachedOrFetch(trimmed, voice, apiUrl);
        await playObjectUrl(objectUrl, rate);
        return { ok: true, source: 'azure' };
      }catch{
        // Azure API 失敗、尚未部署、或網路錯誤時，改用瀏覽器內建語音。
      }
    }

    fallbackSpeak(trimmed, rate);
    return { ok: true, source: 'fallback' };
  }

  global.speakStandardPronunciation = speakStandardPronunciation;
  global.stopStandardPronunciation = stopStandardPronunciation;
  global.setStandardPronunciationRate = setStandardPronunciationRate;
})(window);
