
const nameInput = document.getElementById('nameInput');
const localLogin = document.getElementById('localLogin');
const googleLogin = document.getElementById('googleLogin');
const loginStatus = document.getElementById('loginStatus');

function login(name){
  const user = { name: name || 'Google 使用者', loginAt: new Date().toLocaleString('zh-TW') };
  localStorage.setItem('pronunciationUser', JSON.stringify(user));
  loginStatus.textContent = `已登入：${user.name}`;
}

localLogin.addEventListener('click', () => login(nameInput.value.trim() || '測試使用者'));
googleLogin.addEventListener('click', () => login('Google 使用者（模擬）'));

const user = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
if(user) loginStatus.textContent = `目前登入：${user.name}`;
