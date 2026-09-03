
const googleLogin = document.getElementById('googleLogin');
const loginStatus = document.getElementById('loginStatus');

if(Auth.isAuthenticated()){
  location.href = 'profile.html';
}else{
  googleLogin.addEventListener('click', async () => {
    loginStatus.textContent = '正在登入…';
    try{
      const user = await Auth.signIn();
      loginStatus.textContent = `已登入：${user.displayName}，正在前往個人頁面…`;
      location.href = 'profile.html';
    }catch(e){
      loginStatus.textContent = '登入失敗，請再試一次。';
    }
  });
}
