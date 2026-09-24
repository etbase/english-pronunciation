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
    getAvatarMarkup: getAvatarMarkup
  };
})(window);
