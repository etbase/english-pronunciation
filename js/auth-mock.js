// Mock Authentication backend。
// Firebase integration point: 之後改載入 Firebase 版 AUTH_BACKEND，此檔即可停用。
// 介面需與 js/auth-service.js 使用的 AUTH_BACKEND 方法一致。
(function (global) {
  const STORAGE_KEY = 'pronunciationUser';
  const MOCK_UID = 'mock-google-ellie';

  function cloneUser(user){
    return user ? {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || null,
      provider: user.provider,
      createdAt: user.createdAt
    } : null;
  }

  function normalizeUser(raw){
    if(!raw || typeof raw !== 'object') return null;
    const displayName = String(raw.displayName || raw.name || '').trim();
    const email = String(raw.email || '').trim();
    if(!displayName && !email) return null;
    return {
      uid: raw.uid || MOCK_UID,
      displayName: displayName || 'Ellie',
      email: email || 'ellie@example.com',
      photoURL: raw.photoURL || null,
      provider: raw.provider || 'google',
      createdAt: raw.createdAt || raw.loginAt || ''
    };
  }

  function readUser(){
    try{
      const raw = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || 'null');
      const user = normalizeUser(raw);
      if(user && raw && (raw.name || raw.loginAt || !raw.uid)){
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
      return cloneUser(user);
    }catch(e){
      return null;
    }
  }

  function writeUser(user){
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  global.AUTH_BACKEND = {
    getCurrentUser: readUser,

    signIn: function(){
      const user = {
        uid: MOCK_UID,
        displayName: 'Ellie',
        email: 'ellie@example.com',
        photoURL: null,
        provider: 'google',
        createdAt: new Date().toLocaleString('zh-TW')
      };
      writeUser(user);
      return Promise.resolve(cloneUser(user));
    },

    signOut: function(){
      global.localStorage.removeItem(STORAGE_KEY);
      return Promise.resolve();
    },

    updateProfile: function(patch){
      const current = readUser();
      if(!current) return Promise.resolve(null);
      if(patch && patch.displayName != null){
        const name = String(patch.displayName).trim();
        if(name) current.displayName = name;
      }
      if(patch && patch.photoURL !== undefined){
        current.photoURL = patch.photoURL || null;
      }
      writeUser(current);
      return Promise.resolve(cloneUser(current));
    },

    getProviderLabel: function(user){
      if(!user) return '';
      if(user.provider === 'google') return 'Google（模擬）';
      return user.provider || '模擬帳號';
    },

    subscribe: function(callback){
      global.addEventListener('storage', function(event){
        if(event.key === STORAGE_KEY) callback(readUser());
      });
    }
  };
})(window);
