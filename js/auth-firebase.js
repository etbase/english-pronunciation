// Firebase Authentication + Google 登入。
// 只有 js/firebase-config.js 填好公開設定時才會接管 AUTH_BACKEND。
(function (global) {
  if (global.AUTH_BACKEND) return;
  if (typeof global.isFirebaseConfigured !== 'function' || !global.isFirebaseConfigured()) return;
  if (!global.firebase || !global.firebase.auth) return;

  const config = global.FIREBASE_CONFIG;
  if (!global.firebase.apps || !global.firebase.apps.length) {
    global.firebase.initializeApp(config);
  }

  const auth = global.firebase.auth();
  const provider = new global.firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let readyResolve;
  const ready = new Promise(function (resolve) {
    readyResolve = resolve;
  });
  let readySettled = false;

  function mapUser(fbUser) {
    if (!fbUser) return null;
    const createdAt = fbUser.metadata && fbUser.metadata.creationTime
      ? new Date(fbUser.metadata.creationTime).toLocaleString('zh-TW')
      : '';
    return {
      uid: fbUser.uid,
      displayName: fbUser.displayName || '',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || null,
      provider: 'google',
      createdAt: createdAt
    };
  }

  function currentUser() {
    return mapUser(auth.currentUser);
  }

  function markReady() {
    if (readySettled) return;
    readySettled = true;
    readyResolve();
  }

  auth.onAuthStateChanged(function () {
    markReady();
  });

  global.AUTH_BACKEND = {
    isFirebase: true,

    whenReady: function () {
      return ready;
    },

    getCurrentUser: currentUser,

    getIdToken: function () {
      const user = auth.currentUser;
      if (!user) return Promise.resolve(null);
      return user.getIdToken();
    },

    signIn: function () {
      return auth.signInWithPopup(provider).then(function (result) {
        return mapUser(result && result.user);
      });
    },

    signOut: function () {
      return auth.signOut();
    },

    updateProfile: function (patch) {
      const user = auth.currentUser;
      if (!user) return Promise.resolve(null);
      const next = {};
      if (patch && patch.displayName != null) {
        const name = String(patch.displayName).trim();
        if (name) next.displayName = name;
      }
      if (patch && patch.photoURL !== undefined) {
        next.photoURL = patch.photoURL || null;
      }
      const apply = Object.keys(next).length ? user.updateProfile(next) : Promise.resolve();
      return apply.then(function () {
        return currentUser();
      });
    },

    getProviderLabel: function (user) {
      if (!user) return '';
      return 'Google';
    },

    subscribe: function (callback) {
      return auth.onAuthStateChanged(function (fbUser) {
        callback(mapUser(fbUser));
      });
    }
  };
})(window);
