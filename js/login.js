
const googleLogin = document.getElementById('googleLogin');
const loginStatus = document.getElementById('loginStatus');
const hint = document.querySelector('.hint');

function loginErrorText(error){
  const code = error && error.code;
  if(code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'){
    return '已取消登入。';
  }
  if(code === 'auth/popup-blocked'){
    return '瀏覽器封鎖了登入視窗，請允許彈出視窗後再試。';
  }
  if(code === 'auth/unauthorized-domain'){
    return '這個網域尚未加入 Firebase 授權網域。';
  }
  return '登入失敗，請再試一次。';
}

Auth.whenReady().then(function(){
  if(Auth.isFirebase()){
    if(hint) hint.textContent = '請用 Google 帳號登入。正式環境的發音分析與 Azure 標準發音需要登入，以免公開網站被濫用。韻律自然度（Prosody）只開放給指定 VIP 測試帳號。';
    googleLogin.textContent = '使用 Google 登入';
    if(loginStatus) loginStatus.textContent = '登入後可使用「我的帳戶」，並在正式環境使用發音分析。';
  }else{
    if(hint) hint.textContent = '目前尚未填入 Firebase 設定，先使用模擬登入。填好 js/firebase-config.js 後會改成真正的 Google 登入。';
    googleLogin.textContent = '使用 Google 登入（模擬）';
  }

  if(Auth.isAuthenticated()){
    location.href = 'profile.html';
    return;
  }

  googleLogin.addEventListener('click', async () => {
    loginStatus.textContent = '正在登入…';
    try{
      const user = await Auth.signIn();
      loginStatus.textContent = `已登入：${user.displayName}，正在前往個人頁面…`;
      location.href = 'profile.html';
    }catch(e){
      loginStatus.textContent = loginErrorText(e);
    }
  });
});
