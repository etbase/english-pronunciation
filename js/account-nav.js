// 依登入狀態，決定帳戶圖示（側邊欄 + 手機版底部選單）要導向登入頁還是個人頁面，
// 並在已登入時把圖示換成使用者名字的字母頭像（跟我的帳戶頁一致）。
// 目前登入狀態仍是模擬（存在 localStorage），之後接上 Firebase Auth 時，
// 只需要把判斷條件換成真正的登入狀態即可，其餘頁面不用改。
(function(){
  const icon = document.querySelector('.account-icon');
  const bottomLink = document.getElementById('bottomAccountLink');
  const bottomIcon = document.getElementById('bottomAccountIcon');
  if(!icon && !bottomLink) return;

  function renderIconContent(el, user){
    if(!el) return;
    if(user && user.name){
      el.innerHTML = `<span class="account-icon-initial">${(user.name.trim().charAt(0) || '?').toUpperCase()}</span>`;
    }else{
      el.innerHTML = '<img src="assets/icons/profile.svg" alt="">';
    }
  }

  function renderAccountIcon(){
    const user = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
    const target = user ? 'profile.html' : 'login.html';

    if(icon){
      icon.href = target;
      renderIconContent(icon, user);
    }
    if(bottomLink){
      bottomLink.href = target;
    }
    if(bottomIcon){
      renderIconContent(bottomIcon, user);
    }
  }

  renderAccountIcon();
  // 我的帳戶頁改名字後可以立刻呼叫這個函式更新圖示，不需要重新整理頁面。
  window.refreshAccountIcon = renderAccountIcon;
})();
