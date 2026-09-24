// 全站 Authentication 介面。頁面只透過 Auth.*，不要自己讀寫登入資料。
// Firebase 設定在 js/firebase-config.js；有填才走 Google 登入，否則維持模擬登入。
(function (global) {
  const listeners = [];

  function backend(){
    return global.AUTH_BACKEND;
  }

  function whenReady(){
    if(backend() && typeof backend().whenReady === 'function'){
      return backend().whenReady();
    }
    return Promise.resolve();
  }

  function notify(user){
    listeners.slice().forEach(function(fn){
      try{ fn(user); }catch(e){ /* listener 錯誤不影響其他頁面狀態 */ }
    });
  }

  function getCurrentUser(){
    return backend() ? backend().getCurrentUser() : null;
  }

  function isAuthenticated(){
    return !!getCurrentUser();
  }

  function signIn(){
    return backend().signIn().then(function(user){
      notify(user);
      return user;
    });
  }

  function signOut(){
    return backend().signOut().then(function(){
      notify(null);
    });
  }

  function updateProfile(patch){
    return backend().updateProfile(patch).then(function(user){
      notify(user);
      return user;
    });
  }

  function onAuthStateChanged(callback){
    if(typeof callback !== 'function') return function(){};
    listeners.push(callback);
    whenReady().then(function(){
      if(listeners.indexOf(callback) >= 0){
        callback(getCurrentUser());
      }
    });
    return function unsubscribe(){
      const index = listeners.indexOf(callback);
      if(index >= 0) listeners.splice(index, 1);
    };
  }

  function getIdToken(){
    if(backend() && typeof backend().getIdToken === 'function'){
      return Promise.resolve().then(function(){
        return backend().getIdToken();
      });
    }
    return Promise.resolve(null);
  }

  function authHeaders(extra){
    const headers = extra ? Object.assign({}, extra) : {};
    return getIdToken().then(function(token){
      if(token) headers.Authorization = 'Bearer ' + token;
      return headers;
    });
  }

  function isFirebase(){
    return !!(backend() && backend().isFirebase);
  }

  function getProviderLabel(user){
    if(backend() && typeof backend().getProviderLabel === 'function'){
      return backend().getProviderLabel(user);
    }
    if(!user) return '';
    if(user.provider === 'google') return 'Google';
    return user.provider || '';
  }

  function getAvatarMarkup(user){
    if(!user) return '<img src="assets/icons/profile.svg" alt="">';
    if(user.photoURL){
      const src = String(user.photoURL).replace(/"/g, '');
      return '<img class="account-photo" src="' + src + '" alt="">';
    }
    const initial = ((user.displayName || '?').trim().charAt(0) || '?').toUpperCase();
    return '<span class="account-icon-initial">' + initial + '</span>';
  }

  const AVATAR_CACHE_KEY = 'pronunciationAccountAvatar';

  function readAvatarCache(){
    try{
      const raw = JSON.parse(global.sessionStorage.getItem(AVATAR_CACHE_KEY) || 'null');
      if(!raw || typeof raw !== 'object') return null;
      if(raw.signedOut) return { signedOut: true };
      return {
        uid: raw.uid ? String(raw.uid) : '',
        displayName: raw.displayName ? String(raw.displayName) : '',
        photoURL: raw.photoURL ? String(raw.photoURL) : null
      };
    }catch(e){
      return null;
    }
  }

  function writeAvatarCache(user){
    try{
      if(!user){
        global.sessionStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify({ signedOut: true }));
        return;
      }
      global.sessionStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify({
        uid: user.uid || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || null
      }));
    }catch(e){ /* sessionStorage 不可用時略過快取 */ }
  }

  function paintCachedAvatar(el){
    if(!el) return false;
    const cached = readAvatarCache();
    if(!cached) return false;
    el.classList.remove('is-auth-pending');
    if(cached.signedOut){
      if(el.tagName === 'A') el.href = 'login.html';
      el.innerHTML = getAvatarMarkup(null);
      return true;
    }
    if(el.tagName === 'A') el.href = 'profile.html';
    el.innerHTML = getAvatarMarkup(cached);
    return true;
  }

  if(backend() && typeof backend().subscribe === 'function'){
    backend().subscribe(function(user){
      notify(user);
    });
  }

  global.Auth = {
    getCurrentUser: getCurrentUser,
    isAuthenticated: isAuthenticated,
    signIn: signIn,
    signOut: signOut,
    updateProfile: updateProfile,
    onAuthStateChanged: onAuthStateChanged,
    whenReady: whenReady,
    getIdToken: getIdToken,
    authHeaders: authHeaders,
    isFirebase: isFirebase,
    getProviderLabel: getProviderLabel,
    getAvatarMarkup: getAvatarMarkup,
    readAvatarCache: readAvatarCache,
    writeAvatarCache: writeAvatarCache,
    paintCachedAvatar: paintCachedAvatar
  };
})(window);
