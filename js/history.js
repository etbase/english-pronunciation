
const historyList = document.getElementById('historyList');
const records = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');

if(!records.length){
  historyList.innerHTML = '<div class="notice">目前還沒有歷史紀錄。請先回到練習頁錄音。</div>';
}else{
  historyList.innerHTML = records.map((r, index) => `
    <div class="history-item">
      <strong>${index + 1}. ${escapeHtml(r.text)}</strong>
      <span style="color:#63718a;font-size:14px">${r.createdAt}</span>
      <div class="history-actions">
        <button class="small-btn" onclick="speak('${encodeURIComponent(r.text)}')">聽標準發音</button>
        ${r.audioUrl ? `<audio controls src="${r.audioUrl}"></audio>` : ''}
      </div>
    </div>
  `).join('');
}

function speak(encodedText){
  const text = decodeURIComponent(encodedText);
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function escapeHtml(text){
  return text.replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[m]));
}
