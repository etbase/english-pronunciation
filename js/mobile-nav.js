// 小螢幕（<=1100px）時，側邊欄改成可收合的滑出選單，避免縮小視窗後完全找不到導覽入口。
(function(){
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if(!toggle || !sidebar || !overlay) return;

  function openMenu(){
    sidebar.classList.add('open');
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu(){
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    if(sidebar.classList.contains('open')) closeMenu();
    else openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();
