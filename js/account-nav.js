// 依登入狀態，決定帳戶圖示（側邊欄 + 手機版底部選單）要導向登入頁還是個人頁面。
// 頭像與「我的帳戶」頁共用 Auth.getAvatarMarkup。
// 換頁會整頁重載，Firebase 尚未就緒前先用 sessionStorage 上次已確認的頭像，避免每次閃一下。
(function(){
  const icon = document.querySelector('.account-icon');
  const bottomLink = document.getElementById('bottomAccountLink');
  const bottomIcon = document.getElementById('bottomAccountIcon');
  if(!icon && !bottomLink) return;

  function avatarKey(user){
    if(!user) return 'guest';
    return [user.uid || '', user.photoURL || '', user.displayName || ''].join('\n');
  }

  let lastKey = null;

  function renderIconContent(el, user){
    if(!el) return;
    el.innerHTML = Auth.getAvatarMarkup(user);
  }

  function renderAccountIcon(user){
    const current = user === undefined ? Auth.getCurrentUser() : user;
    const key = avatarKey(current);
    const target = current ? 'profile.html' : 'login.html';
    const sameAvatar = key === lastKey;

    if(icon){
      icon.href = target;
      icon.classList.remove('is-auth-pending');
      if(!sameAvatar) renderIconContent(icon, current);
    }
    if(bottomLink){
      bottomLink.href = target;
    }
    if(bottomIcon){
      bottomIcon.classList.remove('is-auth-pending');
      if(!sameAvatar) renderIconContent(bottomIcon, current);
    }
    lastKey = key;
  }

  const cached = Auth.readAvatarCache ? Auth.readAvatarCache() : null;
  if(cached){
    const user = cached.signedOut ? null : cached;
    lastKey = avatarKey(user);
    const target = user ? 'profile.html' : 'login.html';
    if(icon){
      icon.href = target;
      icon.classList.remove('is-auth-pending');
      if(!icon.innerHTML) renderIconContent(icon, user);
    }
    if(bottomLink) bottomLink.href = target;
    if(bottomIcon){
      bottomIcon.classList.remove('is-auth-pending');
      renderIconContent(bottomIcon, user);
    }
  }

  Auth.onAuthStateChanged(function(user){
    if(Auth.writeAvatarCache) Auth.writeAvatarCache(user);
    renderAccountIcon(user);
  });

  window.refreshAccountIcon = function(){
    Auth.whenReady().then(function(){
      const user = Auth.getCurrentUser();
      if(Auth.writeAvatarCache) Auth.writeAvatarCache(user);
      renderAccountIcon(user);
    });
  };
})();
