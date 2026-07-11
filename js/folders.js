
// 資料夾收藏功能共用邏輯（練習頁、歷史紀錄頁、我的帳戶頁都會用到）。
// 用兩份 localStorage 資料：
// - pronunciationFolders：資料夾清單 [{id, name}]，一定會有一個預設資料夾
// - pronunciationSavedSentences：收藏的句子 [{text, folderId, savedAt}]，同一句話只會存在一個資料夾裡

const DEFAULT_FOLDER_ID = 'default';

function escapeHtmlLocal(text){
  return String(text).replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[m]));
}

function getFolders(){
  let folders = JSON.parse(localStorage.getItem('pronunciationFolders') || 'null');
  if(!folders || !folders.length){
    folders = [{ id: DEFAULT_FOLDER_ID, name: '預設資料夾' }];
    localStorage.setItem('pronunciationFolders', JSON.stringify(folders));
  }
  return folders;
}

function saveFolders(folders){
  localStorage.setItem('pronunciationFolders', JSON.stringify(folders));
}

function createFolder(name){
  const folders = getFolders();
  const id = 'f' + Date.now();
  folders.push({ id, name });
  saveFolders(folders);
  return id;
}

function renameFolder(id, name){
  const folders = getFolders();
  const folder = folders.find(f => f.id === id);
  if(folder){ folder.name = name; saveFolders(folders); }
}

// 刪除資料夾時，裡面收藏的句子改放回預設資料夾，不會直接消失。
function deleteFolder(id){
  if(id === DEFAULT_FOLDER_ID) return;
  const folders = getFolders().filter(f => f.id !== id);
  saveFolders(folders);
  const saved = getSavedSentences();
  saved.forEach(s => { if(s.folderId === id) s.folderId = DEFAULT_FOLDER_ID; });
  saveSavedSentences(saved);
}

function getSavedSentences(){
  return JSON.parse(localStorage.getItem('pronunciationSavedSentences') || '[]');
}

function saveSavedSentences(list){
  localStorage.setItem('pronunciationSavedSentences', JSON.stringify(list));
}

function findSavedEntry(text){
  return getSavedSentences().find(s => s.text === text);
}

function isSentenceSaved(text){
  return !!findSavedEntry(text);
}

function saveSentenceToFolder(text, folderId){
  if(!text) return;
  const list = getSavedSentences().filter(s => s.text !== text);
  list.unshift({ text, folderId, savedAt: new Date().toLocaleString('zh-TW') });
  saveSavedSentences(list);
}

function unsaveSentence(text){
  const list = getSavedSentences().filter(s => s.text !== text);
  saveSavedSentences(list);
}

// 收藏用的小面板：點資料夾圖示後，跳出來選「放進哪個資料夾」或「新增資料夾」。
// 用同一個面板 DOM，動態附加在點擊的按鈕旁邊，練習頁、歷史紀錄頁都能共用。
let activeFolderPopover = null;
let activeFolderPopoverCleanup = null;

function closeFolderPopover(){
  if(activeFolderPopover){ activeFolderPopover.remove(); activeFolderPopover = null; }
  if(activeFolderPopoverCleanup){ activeFolderPopoverCleanup(); activeFolderPopoverCleanup = null; }
}

function openFolderPopover(anchorEl, text, onChange){
  const alreadyOpenForThisAnchor = activeFolderPopover && activeFolderPopover.dataset.anchor === anchorEl.dataset.folderAnchorId;
  closeFolderPopover();
  if(alreadyOpenForThisAnchor) return;
  if(!text) return;

  if(!anchorEl.dataset.folderAnchorId){
    anchorEl.dataset.folderAnchorId = 'anchor-' + Math.random().toString(36).slice(2);
  }

  const popover = document.createElement('div');
  popover.className = 'folder-popover';
  popover.dataset.anchor = anchorEl.dataset.folderAnchorId;

  function render(){
    const folders = getFolders();
    const saved = findSavedEntry(text);
    popover.innerHTML = `
      <div class="folder-popover-title">收藏到資料夾</div>
      <div class="folder-popover-list">
        ${folders.map(f => `
          <button type="button" class="folder-popover-item${saved && saved.folderId === f.id ? ' active' : ''}" data-folder="${f.id}">
            <img src="assets/icons/folder.svg" alt="">${escapeHtmlLocal(f.name)}
          </button>
        `).join('')}
      </div>
      <div class="folder-popover-new">
        <input type="text" class="folder-popover-input" placeholder="新增資料夾名稱" maxlength="20">
        <button type="button" class="folder-popover-add">新增</button>
      </div>
      ${saved ? '<button type="button" class="folder-popover-remove">移除收藏</button>' : ''}
    `;

    popover.querySelectorAll('.folder-popover-item').forEach(btn => {
      btn.addEventListener('click', () => {
        saveSentenceToFolder(text, btn.dataset.folder);
        closeFolderPopover();
        onChange && onChange();
      });
    });

    const input = popover.querySelector('.folder-popover-input');
    const addBtn = popover.querySelector('.folder-popover-add');
    const submitNewFolder = () => {
      const name = input.value.trim();
      if(!name) return;
      const id = createFolder(name);
      saveSentenceToFolder(text, id);
      closeFolderPopover();
      onChange && onChange();
    };
    addBtn.addEventListener('click', submitNewFolder);
    input.addEventListener('keydown', e => { if(e.key === 'Enter') submitNewFolder(); });

    const removeBtn = popover.querySelector('.folder-popover-remove');
    if(removeBtn){
      removeBtn.addEventListener('click', () => {
        unsaveSentence(text);
        closeFolderPopover();
        onChange && onChange();
      });
    }
  }
  render();

  document.body.appendChild(popover);
  const rect = anchorEl.getBoundingClientRect();
  const popRect = popover.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, rect.right + window.scrollX - popRect.width),
    window.innerWidth - popRect.width - 12
  );
  popover.style.top = `${rect.bottom + window.scrollY + 8}px`;
  popover.style.left = `${left}px`;

  const handleOutsideClick = e => {
    if(popover.contains(e.target) || e.target === anchorEl || anchorEl.contains(e.target)) return;
    closeFolderPopover();
  };
  const handleEscape = e => { if(e.key === 'Escape') closeFolderPopover(); };
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);

  activeFolderPopover = popover;
  activeFolderPopoverCleanup = () => {
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleEscape);
  };
}
