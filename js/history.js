
const historyList = document.getElementById('historyList');

function getRecords(){
  return JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
}

function renderHistory(){
  const records = getRecords();
  if(!records.length){
    historyList.innerHTML = '<div class="notice">目前還沒有歷史紀錄。請先回到練習頁錄音。</div>';
    return;
  }
  historyList.innerHTML = records.map((r, index) => `
    <div class="history-item">
      <div class="history-item-top">
        <strong>${index + 1}. ${escapeHtml(r.text)}</strong>
        ${r.score != null ? `<span class="history-score">${r.score} 分</span>` : `<span class="history-score history-score-pending">尚未分析</span>`}
      </div>
      <span style="color:#63718a;font-size:14px">${r.createdAt}</span>
      <button type="button" class="history-folder-btn${isSentenceSaved(r.text) ? ' active' : ''}" aria-label="收藏到資料夾" aria-pressed="${isSentenceSaved(r.text)}" onclick="toggleHistoryFolder(this, ${index})">
        <img src="assets/icons/folder.svg" alt="">
      </button>
      <div class="history-actions">
        <button class="small-btn" onclick="speak('${encodeURIComponent(r.text)}')">聽標準發音</button>
        ${r.audioUrl ? `<audio controls src="${r.audioUrl}"></audio>` : ''}
        <button class="small-btn btn-outline" onclick="rePractice(${index})">重新練習</button>
        <button type="button" class="history-delete-btn" aria-label="刪除紀錄" onclick="deleteRecord(${index})">
          <img src="assets/icons/trash.svg" alt="">
        </button>
      </div>
    </div>
  `).join('');

  historyList.querySelectorAll('audio').forEach(el => enhanceAudioPlayer(el));
}

renderHistory();

function speak(encodedText){
  const text = decodeURIComponent(encodedText);
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

// 帶著這句話跳回練習頁，讓使用者可以直接重錄，不用再打一次句子。
function rePractice(index){
  const records = getRecords();
  const record = records[index];
  if(!record) return;
  location.href = `index.html?sentence=${encodeURIComponent(record.text)}`;
}

// 點歷史紀錄卡片右下角的資料夾圖示，跳出跟練習頁一樣的收藏小面板。
function toggleHistoryFolder(anchorEl, index){
  const records = getRecords();
  const record = records[index];
  if(!record) return;
  openFolderPopover(anchorEl, record.text, renderHistory);
}

function deleteRecord(index){
  const records = getRecords();
  if(!records[index]) return;
  if(!confirm('確定要刪除這筆歷史紀錄嗎？')) return;
  records.splice(index, 1);
  localStorage.setItem('pronunciationHistory', JSON.stringify(records));
  renderHistory();
}

function escapeHtml(text){
  return text.replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[m]));
}
