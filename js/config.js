// 前端公開設定：只能放「公開的 API 網址」，不能放 Azure Key / Secret / Token。
// GitHub Pages 上的 JS 對所有訪客都看得到。
(function (global) {
  var isLocal = global.location && (
    global.location.hostname === 'localhost' ||
    global.location.hostname === '127.0.0.1'
  );

  global.PRONUNCIATION_CONFIG = {
    // 本機打 Azure Functions 本機埠；GitHub Pages 打已部署的 Function（只有公開網址，沒有 Key）。
    ttsApiUrl: isLocal
      ? 'http://localhost:7071/api/tts'
      : 'https://etbase-pronunciation-tts.azurewebsites.net/api/tts'
  };
})(window);
