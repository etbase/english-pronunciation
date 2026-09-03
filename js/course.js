// 課程頁：依 COURSE_UNITS 動態顯示 Unit 列表或單一 Unit 的句子列表。
// 點句子會 selected，並把該句帶入 Practice Panel；不自動播放、不自動錄音、不寫入歷史紀錄。
(function () {
  const homeView = document.getElementById('courseHomeView');
  const unitView = document.getElementById('courseUnitView');
  const unitGrid = document.getElementById('courseUnitGrid');
  const unitBack = document.getElementById('courseUnitBack');
  const unitEyebrow = document.getElementById('courseUnitEyebrow');
  const unitTitleEn = document.getElementById('courseUnitTitleEn');
  const unitTitleZh = document.getElementById('courseUnitTitleZh');
  const unitCount = document.getElementById('courseUnitCount');
  const sentenceList = document.getElementById('courseSentenceList');

  if(!homeView || !unitView || !unitGrid || !sentenceList) return;

  const units = Array.isArray(window.COURSE_UNITS) ? window.COURSE_UNITS : [];
  let selectedSentenceId = null;

  function pad2(value){
    return String(value).padStart(2, '0');
  }

  function unitHeading(unit){
    return 'Unit ' + pad2(unit.number);
  }

  function sentenceCountLabel(count){
    return count + (count === 1 ? ' sentence' : ' sentences');
  }

  function findUnit(id){
    return units.find(unit => unit.id === id) || null;
  }

  function selectedUnitId(){
    return new URLSearchParams(location.search).get('unit');
  }

  function renderHome(){
    unitGrid.innerHTML = '';
    units.forEach(unit => {
      const card = document.createElement('a');
      card.className = 'course-unit-card';
      card.href = 'course.html?unit=' + encodeURIComponent(unit.id);

      const num = document.createElement('div');
      num.className = 'course-unit-num';
      num.textContent = unitHeading(unit);

      const titleEn = document.createElement('div');
      titleEn.className = 'course-unit-title-en';
      titleEn.textContent = unit.titleEn;

      const titleZh = document.createElement('div');
      titleZh.className = 'course-unit-title-zh';
      titleZh.textContent = unit.titleZh;

      const count = document.createElement('div');
      count.className = 'course-unit-count';
      count.textContent = sentenceCountLabel((unit.sentences || []).length);

      card.appendChild(num);
      card.appendChild(titleEn);
      card.appendChild(titleZh);
      card.appendChild(count);
      unitGrid.appendChild(card);
    });
  }

  function setSelectedSentence(id){
    selectedSentenceId = id;
    sentenceList.querySelectorAll('.course-sentence').forEach(btn => {
      const on = btn.getAttribute('data-sentence-id') === id;
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  function renderUnit(unit){
    const sentences = unit.sentences || [];
    selectedSentenceId = null;
    unitEyebrow.textContent = unitHeading(unit);
    unitTitleEn.textContent = unit.titleEn;
    unitTitleZh.textContent = unit.titleZh;
    unitCount.textContent = sentenceCountLabel(sentences.length);
    if(unitBack) unitBack.href = 'course.html';
    if(typeof clearCoursePracticeSentence === 'function') clearCoursePracticeSentence();

    sentenceList.innerHTML = '';
    sentences.forEach((sentence, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'course-sentence';
      btn.setAttribute('data-sentence-id', sentence.id);
      btn.setAttribute('aria-pressed', 'false');

      const num = document.createElement('span');
      num.className = 'course-sentence-num';
      num.textContent = pad2(index + 1);

      const text = document.createElement('span');
      text.className = 'course-sentence-text';
      text.textContent = sentence.text;

      btn.appendChild(num);
      btn.appendChild(text);
      btn.addEventListener('click', () => {
        setSelectedSentence(sentence.id);
        if(typeof setCoursePracticeSentence === 'function'){
          setCoursePracticeSentence(sentence);
        }
      });
      sentenceList.appendChild(btn);
    });
  }

  function showViews(unit){
    if(unit){
      homeView.hidden = true;
      unitView.hidden = false;
      renderUnit(unit);
      return;
    }
    unitView.hidden = true;
    homeView.hidden = false;
    renderHome();
  }

  function syncFromUrl(){
    const unit = findUnit(selectedUnitId());
    showViews(unit);
  }

  renderHome();
  syncFromUrl();
})();
