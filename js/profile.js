
const profileName = document.getElementById('profileName');
const avatarInitial = document.getElementById('avatarInitial');
const profileEmail = document.getElementById('profileEmail');
const profileProvider = document.getElementById('profileProvider');
const profileJoined = document.getElementById('profileJoined');
const editNameBtn = document.getElementById('editNameBtn');
const editNameForm = document.getElementById('editNameForm');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const logoutBtn = document.getElementById('logoutBtn');
const folderList = document.getElementById('folderList');
const newFolderInput = document.getElementById('newFolderInput');
const newFolderBtn = document.getElementById('newFolderBtn');
let renamingFolderId = null;
const openFolderIds = new Set();

function renderUser(user){
  profileName.textContent = user.name;
  avatarInitial.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
  profileEmail.textContent = user.email || '';
  profileProvider.textContent = user.provider === 'google' ? 'Google（模擬）' : '模擬帳號';
  profileJoined.textContent = user.loginAt || '--';
}

const user = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
if(!user){
  location.href = 'login.html';
}else{
  renderUser(user);
  renderFolders();
}

editNameBtn.addEventListener('click', () => {
  nameInput.value = profileName.textContent;
  editNameForm.style.display = 'grid';
  nameInput.focus();
});

cancelNameBtn.addEventListener('click', () => {
  editNameForm.style.display = 'none';
});

saveNameBtn.addEventListener('click', () => {
  const newName = nameInput.value.trim();
  if(!newName) return;
  const current = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
  if(!current) return;
  current.name = newName;
  localStorage.setItem('pronunciationUser', JSON.stringify(current));
  renderUser(current);
  editNameForm.style.display = 'none';
  if(window.refreshAccountIcon) window.refreshAccountIcon();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('pronunciationUser');
  location.href = 'login.html';
});

// 資料夾清單：每個資料夾顯示裡面收藏的句子，可以重新命名／刪除資料夾（預設資料夾不能刪），
// 每句收藏可以直接「重新練習」帶回練習頁，或「移除」收藏。
// 每個資料夾用 <details> 做成跟使用說明 QA 一樣可以收合的卡片，不會一次全部展開；
// 用 openFolderIds 記住使用者展開過哪些資料夾，重新渲染（例如移除一句收藏）後不會又全部收合回去。
function renderFolders(){
  const folders = getFolders();
  const saved = getSavedSentences();
  folderList.innerHTML = folders.map(f => {
    const items = saved.filter(s => s.folderId === f.id);
    const isRenaming = f.id === renamingFolderId;
    return `
      <details class="folder-card" data-folder-id="${f.id}"${openFolderIds.has(f.id) ? ' open' : ''}>
        <summary>
          <div class="folder-card-header">
            <img src="assets/icons/folder.svg" alt="">
            ${isRenaming ? `
              <div class="folder-rename-form" onclick="event.stopPropagation()">
                <input type="text" id="renameFolderInput-${f.id}" value="${escapeHtmlLocal(f.name)}" maxlength="20">
                <button type="button" class="small-btn btn-compact" onclick="confirmRenameFolder('${f.id}')">儲存</button>
                <button type="button" class="small-btn btn-outline btn-compact" onclick="cancelRenameFolder()">取消</button>
              </div>
            ` : `
              <strong>${escapeHtmlLocal(f.name)}</strong>
              <span class="folder-count">${items.length} 句</span>
              ${f.id !== DEFAULT_FOLDER_ID ? `
                <div class="folder-card-actions" onclick="event.stopPropagation()">
                  <button type="button" class="small-btn btn-outline" onclick="startRenameFolder('${f.id}')">重新命名</button>
                  <button type="button" class="small-btn btn-danger-outline" onclick="removeFolder('${f.id}')">刪除資料夾</button>
                </div>
              ` : ''}
            `}
          </div>
        </summary>
        <div class="folder-sentences">
          ${items.length ? items.map(s => `
            <div class="folder-sentence-row">
              <div class="folder-sentence-top">
                <span class="folder-sentence-text">${escapeHtmlLocal(s.text)}</span>
                <span class="folder-sentence-date">${s.savedAt}</span>
              </div>
              <div class="folder-sentence-actions">
                <button type="button" class="small-btn" onclick="speakFromFolder('${encodeURIComponent(s.text)}')">聽標準發音</button>
                <button type="button" class="small-btn btn-outline" onclick="rePracticeFromFolder('${encodeURIComponent(s.text)}')">重新練習</button>
                <button type="button" class="small-btn btn-danger-outline" onclick="removeSavedSentence('${encodeURIComponent(s.text)}')">移除</button>
              </div>
            </div>
          `).join('') : '<p class="folder-empty">這個資料夾還沒有收藏的句子。</p>'}
        </div>
      </details>
    `;
  }).join('');

  folderList.querySelectorAll('details.folder-card').forEach(d => {
    d.addEventListener('toggle', () => {
      if(d.open) openFolderIds.add(d.dataset.folderId);
      else openFolderIds.delete(d.dataset.folderId);
    });
  });
}

function startRenameFolder(id){ renamingFolderId = id; renderFolders(); }
function cancelRenameFolder(){ renamingFolderId = null; renderFolders(); }
function confirmRenameFolder(id){
  const input = document.getElementById('renameFolderInput-' + id);
  const name = input ? input.value.trim() : '';
  if(name) renameFolder(id, name);
  renamingFolderId = null;
  renderFolders();
}

function removeFolder(id){
  if(!confirm('確定要刪除這個資料夾嗎？裡面收藏的句子也會一併刪除，無法復原。')) return;
  deleteFolder(id);
  renderFolders();
}

function rePracticeFromFolder(encodedText){
  location.href = `index.html?sentence=${encodedText}`;
}

function speakFromFolder(encodedText){
  const text = decodeURIComponent(encodedText);
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function removeSavedSentence(encodedText){
  unsaveSentence(decodeURIComponent(encodedText));
  renderFolders();
}

newFolderBtn.addEventListener('click', () => {
  const name = newFolderInput.value.trim();
  if(!name) return;
  createFolder(name);
  newFolderInput.value = '';
  renderFolders();
});
newFolderInput.addEventListener('keydown', e => {
  if(e.key === 'Enter') newFolderBtn.click();
});
