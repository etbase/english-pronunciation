// 前端公開設定：只能放「公開的 API 網址」，不能放 Azure Key / Secret / Token。
// GitHub Pages 上的 JS 對所有訪客都看得到。
(function (global) {
  var isLocal = global.location && (
    global.location.hostname === 'localhost' ||
    global.location.hostname === '127.0.0.1'
  );

  global.PRONUNCIATION_CONFIG = {
    // 本機預設打 Azure Functions 本機埠。
    // 部署 GitHub Pages 前，把下面正式網址改成你的 Function App，例如：
    // https://YOUR-FUNCTION-APP.azurewebsites.net/api/tts
    ttsApiUrl: isLocal
      ? 'http://localhost:7071/api/tts'
      : 'https://YOUR-FUNCTION-APP.azurewebsites.net/api/tts'
  };
})(window);
