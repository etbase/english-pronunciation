
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
const statTotal = document.getElementById('statTotal');
const statLast = document.getElementById('statLast');
const statSentences = document.getElementById('statSentences');

function renderUser(user){
  profileName.textContent = user.name;
  avatarInitial.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
  profileEmail.textContent = user.email || '';
  profileProvider.textContent = user.provider === 'google' ? 'Google（模擬）' : '模擬帳號';
  profileJoined.textContent = user.loginAt || '--';
}

function renderStats(){
  const stats = JSON.parse(localStorage.getItem('pronunciationStats') || 'null');
  statTotal.textContent = stats && stats.totalRecordings ? stats.totalRecordings : 0;
  statLast.textContent = stats && stats.lastRecordedAt ? stats.lastRecordedAt : '--';

  const history = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
  statSentences.textContent = history.length;
}

const user = JSON.parse(localStorage.getItem('pronunciationUser') || 'null');
if(!user){
  location.href = 'login.html';
}else{
  renderUser(user);
  renderStats();
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
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('pronunciationUser');
  location.href = 'login.html';
});
