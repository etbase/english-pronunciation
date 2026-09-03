// 全站 Authentication 介面。頁面只透過 Auth.*，不要自己讀寫登入資料。
// Firebase integration point: 保留此檔；之後用 Firebase 實作 AUTH_BACKEND
//（設定放 js/firebase-config.js），取代 js/auth-mock.js。
(function (global) {
  const listeners = [];

  function backend(){
    return global.AUTH_BACKEND;
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
    callback(getCurrentUser());
    return function unsubscribe(){
      const index = listeners.indexOf(callback);
      if(index >= 0) listeners.splice(index, 1);
    };
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
    getProviderLabel: getProviderLabel,
    getAvatarMarkup: getAvatarMarkup
  };
})(window);
