// 依登入狀態，決定帳戶圖示（側邊欄 + 手機版底部選單）要導向登入頁還是個人頁面。
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
      renderIconContent(icon, current);
    }
    if(bottomLink){
      bottomLink.href = target;
    }
    if(bottomIcon){
      renderIconContent(bottomIcon, current);
    }
  }

  Auth.onAuthStateChanged(renderAccountIcon);
  window.refreshAccountIcon = function(){ renderAccountIcon(); };
})();
