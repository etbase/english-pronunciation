// 依登入狀態，決定左上角帳戶圖示要導向登入頁還是個人頁面。
// 目前登入狀態仍是模擬（存在 localStorage），之後接上 Firebase Auth 時，
// 只需要把判斷條件換成真正的登入狀態即可，其餘頁面不用改。
(function(){
  const icon = document.querySelector('.account-icon');
  if(!icon) return;
  const user = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
  icon.href = user ? 'profile.html' : 'login.html';
})();
