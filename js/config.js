// 前端公開設定：只能放「公開的 API 網址」，不能放 Azure Key / Secret / Token。
// GitHub Pages 上的 JS 對所有訪客都看得到。
(function (global) {
  var isLocal = global.location && (
    global.location.hostname === 'localhost' ||
    global.location.hostname === '127.0.0.1'
  );

  global.PRONUNCIATION_CONFIG = {
    // 本機改打同一個 origin 的 /api/*，避免 Chrome 跨埠（8080→7071）被當成無法連線。
    ttsApiUrl: isLocal
      ? global.location.origin + '/api/tts'
      : 'https://etbase-pronunciation-tts.azurewebsites.net/api/tts',
    assessApiUrl: isLocal
      ? global.location.origin + '/api/assess'
      : 'https://etbase-pronunciation-tts.azurewebsites.net/api/assess',
    // 自由練習英翻中。目前尚無正式 Translation Service，先留空，不要指向未建好的 API。
    translateApiUrl: ''
  };
})(window);
