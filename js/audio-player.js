
// 自訂錄音播放條。Chrome／Safari 內建 <audio controls> 的時間軸底色，即使在淺色模式下也是
// 深灰色（約 rgb(89,89,89)），且瀏覽器只開放少數幾個私有偽元素可以覆蓋樣式，沒辦法把時間軸
// 內部的進度顏色也一起改掉，所以這裡改用 <input type="range"> 自己畫一條淺灰底、青綠色進度的播放條，
// 顏色可以完全跟網站其他地方（音量條、指標進度條）保持一致。

function formatAudioTime(sec){
  if(!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// autoShow=false 用在練習頁：頁面載入時先隱藏播放條，等錄完音才用 showAudioPlayer() 顯示。
// 歷史紀錄頁的每筆錄音則是渲染出來就要看到，維持預設的 autoShow=true。
function enhanceAudioPlayer(audioEl, options){
  if(!audioEl || audioEl.dataset.enhanced) return;
  const autoShow = !options || options.autoShow !== false;
  audioEl.dataset.enhanced = '1';
  audioEl.removeAttribute('controls');
  audioEl.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'audio-player';
  wrap.style.display = autoShow ? 'flex' : 'none';
  wrap.innerHTML = `
    <button type="button" class="audio-toggle" aria-label="播放">
      <span class="audio-icon-play"></span>
      <span class="audio-icon-pause"></span>
    </button>
    <span class="audio-time audio-current">0:00</span>
    <input type="range" class="audio-seek" min="0" max="100" value="0" step="0.1">
    <span class="audio-time audio-duration">0:00</span>
  `;
  audioEl.insertAdjacentElement('afterend', wrap);
  audioEl._audioPlayerWrap = wrap;

  const toggleBtn = wrap.querySelector('.audio-toggle');
  const currentEl = wrap.querySelector('.audio-current');
  const durationEl = wrap.querySelector('.audio-duration');
  const seek = wrap.querySelector('.audio-seek');
  let dragging = false;

  function paintSeek(pct){
    seek.style.background = `linear-gradient(to right, var(--teal) 0%, var(--teal) ${pct}%, #e8edf4 ${pct}%, #e8edf4 100%)`;
  }
  paintSeek(0);

  audioEl.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatAudioTime(audioEl.duration);
  });
  audioEl.addEventListener('timeupdate', () => {
    if(dragging) return;
    const pct = audioEl.duration ? (audioEl.currentTime / audioEl.duration) * 100 : 0;
    seek.value = pct;
    paintSeek(pct);
    currentEl.textContent = formatAudioTime(audioEl.currentTime);
  });
  audioEl.addEventListener('play', () => toggleBtn.classList.add('playing'));
  audioEl.addEventListener('pause', () => toggleBtn.classList.remove('playing'));
  audioEl.addEventListener('ended', () => toggleBtn.classList.remove('playing'));

  toggleBtn.addEventListener('click', () => {
    if(!audioEl.src){ return; }
    if(audioEl.paused) audioEl.play(); else audioEl.pause();
  });

  seek.addEventListener('input', () => {
    dragging = true;
    paintSeek(Number(seek.value));
    if(audioEl.duration){
      currentEl.textContent = formatAudioTime((seek.value / 100) * audioEl.duration);
    }
  });
  seek.addEventListener('change', () => {
    if(audioEl.duration){
      audioEl.currentTime = (seek.value / 100) * audioEl.duration;
    }
    dragging = false;
  });

  if(audioEl.readyState >= 1 && audioEl.duration){
    durationEl.textContent = formatAudioTime(audioEl.duration);
  }
}

function showAudioPlayer(audioEl){
  if(audioEl && audioEl._audioPlayerWrap){
    audioEl._audioPlayerWrap.style.display = 'flex';
  }
}
