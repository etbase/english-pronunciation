
const googleLogin = document.getElementById('googleLogin');
const loginStatus = document.getElementById('loginStatus');

// 已登入的使用者不需要再看到登入畫面，直接進個人頁面。
const existingUser = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
if(existingUser){
  location.href = 'profile.html';
}

googleLogin.addEventListener('click', () => {
  // 模擬 Google 登入：正式版會改成真正的 Firebase Authentication，
  // 名字、Email 會直接來自 Google 帳號本身，而不是手動輸入。
  const user = {
    name: 'Ellie',
    email: 'ellie@example.com',
    provider: 'google',
    loginAt: new Date().toLocaleString('zh-TW')
  };
  localStorage.setItem('pronunciationUser', JSON.stringify(user));
  loginStatus.textContent = `已登入：${user.name}，正在前往個人頁面…`;
  location.href = 'profile.html';
});
