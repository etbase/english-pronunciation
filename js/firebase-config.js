// Firebase 用戶端公開設定。這些值本來就會出現在網頁原始碼裡，不是機密。
// 安全性靠 Firebase Console 的授權網域、後端驗證 ID Token、以及 Security Rules。
// 不要把 Firebase Admin、Azure Key 或其他伺服器端機密寫進這個檔。
(function (global) {
  global.FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCnHDG-fnnzgC8X6ChUwalWlROnsDmmha0',
    authDomain: 'e-english-pronunciation.firebaseapp.com',
    projectId: 'e-english-pronunciation',
    storageBucket: 'e-english-pronunciation.firebasestorage.app',
    messagingSenderId: '482506547282',
    appId: '1:482506547282:web:8bbbd7c44c22730d3cbf8b'
  };

  global.isFirebaseConfigured = function () {
    const config = global.FIREBASE_CONFIG || {};
    return !!(
      String(config.apiKey || '').trim() &&
      String(config.authDomain || '').trim() &&
      String(config.projectId || '').trim()
    );
  };
})(window);
