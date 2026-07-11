
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
      <strong>${index + 1}. ${escapeHtml(r.text)}</strong>
      <span style="color:#63718a;font-size:14px">${r.createdAt}</span>
      <div class="history-actions">
        <button class="small-btn" onclick="speak('${encodeURIComponent(r.text)}')">聽標準發音</button>
        <button class="small-btn btn-outline" onclick="rePractice(${index})">重新練習</button>
        <button class="small-btn btn-danger-outline" onclick="deleteRecord(${index})">刪除</button>
        ${r.audioUrl ? `<audio controls src="${r.audioUrl}"></audio>` : ''}
      </div>
    </div>
  `).join('');
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
