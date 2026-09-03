// 自由練習英翻中介面。頁面只透過 Translation.* 取得 sourceText / translatedText。
// 目前沒有正式 Translation Service；有 translateApiUrl 後才會真正送出請求。
// 不要在這裡 hard-code 翻譯，也不要在前端放 API key。
(function (global) {
  const DEBOUNCE_MS = 700;
  const listeners = [];
  let timer = null;
  let requestSeq = 0;
  let current = {
    sourceText: '',
    translatedText: '',
    status: 'idle'
  };

  function cloneState(){
    return {
      sourceText: current.sourceText,
      translatedText: current.translatedText,
      status: current.status
    };
  }

  function notify(){
    const snapshot = cloneState();
    listeners.slice().forEach(function(fn){
      try{ fn(snapshot); }catch(e){ /* ignore */ }
    });
  }

  function translateApiUrl(){
    const url = global.PRONUNCIATION_CONFIG && global.PRONUNCIATION_CONFIG.translateApiUrl;
    return url || '';
  }

  function setState(next){
    current = {
      sourceText: next.sourceText || '',
      translatedText: next.translatedText || '',
      status: next.status || 'idle'
    };
  }

  function invalidateIfSourceChanged(sourceText){
    const text = String(sourceText || '').trim();
    if(current.sourceText === text) return cloneState();
    setState({
      sourceText: text,
      translatedText: '',
      status: text ? 'pending' : 'idle'
    });
    return cloneState();
  }

  async function fetchTranslation(sourceText){
    const text = String(sourceText || '').trim();
    if(!text){
      setState({ sourceText: '', translatedText: '', status: 'idle' });
      return cloneState();
    }

    const apiUrl = translateApiUrl();
    if(!apiUrl){
      setState({ sourceText: text, translatedText: '', status: 'unavailable' });
      return cloneState();
    }

    setState({ sourceText: text, translatedText: '', status: 'loading' });
    const seq = ++requestSeq;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, from: 'en', to: 'zh-Hant' })
    });
    if(seq !== requestSeq) return cloneState();
    if(current.sourceText !== text) return cloneState();

    let payload = null;
    try{ payload = await response.json(); }catch(e){ payload = null; }
    if(seq !== requestSeq || current.sourceText !== text) return cloneState();

    const translated = payload && typeof payload.translatedText === 'string'
      ? payload.translatedText.trim()
      : '';
    if(!response.ok || !translated){
      setState({ sourceText: text, translatedText: '', status: 'error' });
      return cloneState();
    }
    setState({ sourceText: text, translatedText: translated, status: 'ready' });
    return cloneState();
  }

  function translateDebounced(sourceText){
    invalidateIfSourceChanged(sourceText);
    notify();
    if(timer){
      clearTimeout(timer);
      timer = null;
    }
    const text = String(sourceText || '').trim();
    if(!text) return;
    if(!translateApiUrl()){
      setState({ sourceText: text, translatedText: '', status: 'unavailable' });
      notify();
      return;
    }
    timer = setTimeout(function(){
      fetchTranslation(text).then(notify).catch(function(){
        if(current.sourceText !== text) return;
        setState({ sourceText: text, translatedText: '', status: 'error' });
        notify();
      });
    }, DEBOUNCE_MS);
  }

  function onChange(callback){
    if(typeof callback !== 'function') return function(){};
    listeners.push(callback);
    callback(cloneState());
    return function unsubscribe(){
      const index = listeners.indexOf(callback);
      if(index >= 0) listeners.splice(index, 1);
    };
  }

  global.Translation = {
    getCurrent: cloneState,
    invalidateIfSourceChanged: invalidateIfSourceChanged,
    translateDebounced: translateDebounced,
    onChange: onChange
  };
})(window);
