// 全站會員方案：Auth 確認登入後讀取 Firestore users/{uid}.plan。
// 只讀不寫。文件不存在或 plan 不是 vip → free；權限／網路失敗 → error，不當成 free。
(function (global) {
  const listeners = [];
  let loadSeq = 0;
  let firstLoadDone;
  const firstLoad = new Promise(function(resolve){
    firstLoadDone = resolve;
  });
  let state = {
    status: 'loading',
    plan: null,
    uid: null,
    error: null
  };

  function snapshot(){
    return {
      status: state.status,
      plan: state.plan,
      uid: state.uid,
      error: state.error
    };
  }

  function notify(){
    const current = snapshot();
    listeners.slice().forEach(function(fn){
      try{ fn(current); }catch(e){ /* listener 錯誤不影響其他頁面 */ }
    });
  }

  function setState(next){
    state = next;
    notify();
  }

  function planFromData(data){
    return data && data.plan === 'vip' ? 'vip' : 'free';
  }

  function readPlan(user, seq){
    function isCurrent(){
      return seq === loadSeq;
    }

    if(!user){
      if(isCurrent()){
        setState({ status: 'ready', plan: null, uid: null, error: null });
      }
      firstLoadDone();
      return Promise.resolve(snapshot());
    }

    if(typeof global.Auth === 'undefined' || !Auth.isFirebase()){
      if(isCurrent()){
        setState({ status: 'ready', plan: 'free', uid: user.uid, error: null });
      }
      firstLoadDone();
      return Promise.resolve(snapshot());
    }

    if(!global.firebase || typeof global.firebase.firestore !== 'function'){
      const error = new Error('Cloud Firestore SDK is not loaded.');
      console.error('[membership] Firestore SDK missing', error);
      if(isCurrent()){
        setState({ status: 'error', plan: null, uid: user.uid, error: 'sdk-missing' });
      }
      firstLoadDone();
      return Promise.resolve(snapshot());
    }

    if(isCurrent()){
      setState({ status: 'loading', plan: null, uid: user.uid, error: null });
    }

    return global.firebase.firestore().collection('users').doc(user.uid).get()
      .then(function(doc){
        if(!isCurrent()) return snapshot();
        const plan = doc.exists ? planFromData(doc.data()) : 'free';
        setState({ status: 'ready', plan: plan, uid: user.uid, error: null });
        firstLoadDone();
        return snapshot();
      })
      .catch(function(error){
        const code = error && (error.code || error.message) ? String(error.code || error.message) : 'unknown';
        console.error('[membership] failed to read users/' + user.uid, error);
        if(isCurrent()){
          setState({ status: 'error', plan: null, uid: user.uid, error: code });
        }
        firstLoadDone();
        return snapshot();
      });
  }

  function refresh(user){
    const seq = ++loadSeq;
    const currentUser = user === undefined
      ? (global.Auth ? Auth.getCurrentUser() : null)
      : user;
    readPlan(currentUser, seq);
  }

  function whenReady(){
    const authReady = global.Auth && typeof Auth.whenReady === 'function'
      ? Auth.whenReady()
      : Promise.resolve();
    return authReady.then(function(){
      return firstLoad;
    }).then(function(){
      return snapshot();
    });
  }

  function getCurrentUserPlan(){
    return state.plan;
  }

  function isVip(){
    return state.status === 'ready' && state.plan === 'vip';
  }

  function getStatus(){
    return state.status;
  }

  function onChange(callback){
    if(typeof callback !== 'function') return function(){};
    listeners.push(callback);
    callback(snapshot());
    return function unsubscribe(){
      const index = listeners.indexOf(callback);
      if(index >= 0) listeners.splice(index, 1);
    };
  }

  if(global.Auth && typeof Auth.onAuthStateChanged === 'function'){
    Auth.onAuthStateChanged(function(user){
      refresh(user);
    });
  }else{
    setState({ status: 'error', plan: null, uid: null, error: 'auth-missing' });
    console.error('[membership] Auth is not available.');
    firstLoadDone();
  }

  global.Membership = {
    whenReady: whenReady,
    getCurrentUserPlan: getCurrentUserPlan,
    isVip: isVip,
    getStatus: getStatus,
    onChange: onChange
  };
})(window);
