// 依登入狀態，決定帳戶圖示（側邊欄 + 手機版底部選單）要導向登入頁還是個人頁面。
// 頭像與「我的帳戶」頁共用 Auth.getAvatarMarkup，來源是 Firebase Auth 目前使用者。
// Firebase 尚未確認登入狀態前不渲染內容，避免先閃出未登入的預設人物 icon。
(function(){
  const icon = document.querySelector('.account-icon');
  const bottomLink = document.getElementById('bottomAccountLink');
  const bottomIcon = document.getElementById('bottomAccountIcon');
  if(!icon && !bottomLink) return;

  function renderIconContent(el, user){
    if(!el) return;
    el.innerHTML = Auth.getAvatarMarkup(user);
  }

  function renderAccountIcon(user){
    const current = user === undefined ? Auth.getCurrentUser() : user;
    const target = current ? 'profile.html' : 'login.html';

    if(icon){
      icon.href = target;
      icon.classList.remove('is-auth-pending');
      renderIconContent(icon, current);
    }
    if(bottomLink){
      bottomLink.href = target;
    }
    if(bottomIcon){
      bottomIcon.classList.remove('is-auth-pending');
      renderIconContent(bottomIcon, current);
    }
  }

  Auth.onAuthStateChanged(renderAccountIcon);
  window.refreshAccountIcon = function(){
    Auth.whenReady().then(function(){
      renderAccountIcon(Auth.getCurrentUser());
    });
  };
})();
