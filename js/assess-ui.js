// 自由練習與課程學習共用：把 Azure Pronunciation Assessment 的回傳畫到畫面上，
// 以及送出既有 /api/assess。不另開 Azure 資源，也不改評分規則。
const ASSESS_ERROR_TEXT = {
  NO_RECORDING: '請先錄音，再按「分析發音」。',
  NO_TEXT: '請先輸入英文句子。',
  WAV_UNSUPPORTED: '這個瀏覽器無法轉換錄音格式，請改用 Chrome 或 Safari 再試。',
  WAV_CONVERT_FAILED: '錄音無法轉成分析格式，請重新錄音後再試。',
  WAV_ENCODE_FAILED: '錄音無法轉成分析格式，請重新錄音後再試。',
  AUDIO_TOO_LONG: '錄音超過 30 秒，請改唸較短的句子後再分析。',
  AUDIO_TOO_SHORT: '錄音太短，請重新錄一次後再分析。',
  NO_SPEECH: '沒有辨識到清楚的英文，請重新錄音後再試。',
  NOT_CONFIGURED: '評分服務尚未設定，目前無法分析。',
  BAD_REQUEST: '送出的錄音或句子無法分析，請重新錄音後再試。',
  ASSESS_FAILED: '目前無法完成發音分析，請稍後再試。',
  NETWORK: '無法連線到評分服務，請確認網路後再試。'
};

function assessApiUrl(){
  const url = window.PRONUNCIATION_CONFIG && window.PRONUNCIATION_CONFIG.assessApiUrl;
  return url || '';
}

function formatAzureScore(value){
  if(typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function setMetricScore(id, value){
  const score = formatAzureScore(value);
  const bar = document.getElementById(`bar-${id}`);
  const label = document.getElementById(`value-${id}`);
  if(!bar || !label || score == null) return;
  bar.style.width = `${Math.max(0, Math.min(100, score))}%`;
  label.innerHTML = '';
  label.appendChild(document.createTextNode(String(score) + ' '));
  const small = document.createElement('small');
  small.textContent = '/100';
  label.appendChild(small);
}

function joinWords(items){
  return (items || []).map(item => item.word).filter(Boolean).join('、');
}

function joinIssueWords(items){
  return (items || []).map(item => item.word).filter(Boolean).join(' ・ ');
}

function phonemesOfWord(word){
  const list = [];
  (word.syllables || []).forEach(syl => {
    (syl.phonemes || []).forEach(ph => list.push(ph));
  });
  (word.phonemes || []).forEach(ph => list.push(ph));
  return list;
}

function attentionPhonemes(word, threshold){
  const seen = new Set();
  const result = [];
  phonemesOfWord(word).forEach(ph => {
    const symbol = ph && ph.phoneme ? String(ph.phoneme) : '';
    const score = formatAzureScore(ph && ph.accuracyScore);
    if(!symbol || score == null || score >= threshold || seen.has(symbol)) return;
    seen.add(symbol);
    result.push(symbol);
  });
  return result;
}

function appendDetailGroup(parent, title, child){
  const box = document.createElement('div');
  box.className = 'detail-group';
  const heading = document.createElement('strong');
  heading.textContent = title;
  box.appendChild(heading);
  box.appendChild(child);
  parent.appendChild(box);
}

function renderDetailAnalysis(result){
  const groups = document.getElementById('detailGroups');
  const tree = document.getElementById('wordTree');
  const detail = document.getElementById('detailAnalysis');
  if(!groups || !detail) return;

  groups.innerHTML = '';
  if(tree) tree.innerHTML = '';

  const threshold = typeof result.lowAccuracyThreshold === 'number'
    ? result.lowAccuracyThreshold
    : 60;
  const words = result.words || [];
  const misWords = words.filter(word => word.errorType === 'Mispronunciation');
  const omissions = (result.issues && result.issues.omissions) || [];
  const insertions = (result.issues && result.issues.insertions) || [];

  if(misWords.length){
    const list = document.createElement('div');
    list.className = 'detail-issue-list';
    misWords.forEach(word => {
      const item = document.createElement('div');
      item.className = 'detail-issue';
      const name = document.createElement('div');
      name.className = 'detail-issue-word';
      name.textContent = word.word;
      item.appendChild(name);
      const attention = attentionPhonemes(word, threshold);
      if(attention.length){
        const phonemes = document.createElement('p');
        phonemes.className = 'detail-issue-phonemes';
        phonemes.textContent = '需要注意的音：' + attention.map(symbol => '/' + symbol + '/').join('、');
        item.appendChild(phonemes);
      }
      list.appendChild(item);
    });
    appendDetailGroup(groups, '發音需要注意', list);
  }

  if(omissions.length){
    const body = document.createElement('p');
    body.className = 'detail-word-run';
    body.textContent = joinIssueWords(omissions);
    appendDetailGroup(groups, '漏念', body);
  }

  if(insertions.length){
    const body = document.createElement('p');
    body.className = 'detail-word-run';
    body.textContent = joinIssueWords(insertions);
    appendDetailGroup(groups, '多念', body);
  }

  if(!misWords.length && !omissions.length && !insertions.length){
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = '本次沒有偵測到明顯的發音問題。';
    groups.appendChild(empty);
  }

  detail.hidden = false;
}

function renderAssessment(result){
  const scores = result.displayScores || {};
  const overall = formatAzureScore(scores.overall);
  if(overall == null){
    throw new Error('ASSESS_FAILED');
  }

  document.getElementById('overall').textContent = String(overall);
  document.getElementById('scoreRing').style.background = `conic-gradient(var(--teal) 0 ${overall}%, #ecf8f7 ${overall}% 100%)`;
  setMetricScore('accuracy', scores.accuracy);
  setMetricScore('fluency', scores.fluency);
  setMetricScore('completeness', scores.completeness);

  const img = document.getElementById('characterImage');
  if(img){
    img.onerror = null;
    img.src = overall >= 60 ? 'assets/characters/character-koala-happy.png' : 'assets/characters/character-koala-angry.png';
  }

  const issues = result.issues || {};
  const mis = joinWords(issues.mispronunciations);
  const omitted = joinWords(issues.omissions);
  const inserted = joinWords(issues.insertions);
  const facts = [];
  if(result.recognizedText) facts.push(`Azure 辨識為：${result.recognizedText}`);
  if(mis) facts.push(`發音需要注意：${mis}`);
  if(omitted) facts.push(`漏念：${omitted}`);
  if(inserted) facts.push(`多念：${inserted}`);
  if(!mis && !omitted && !inserted) facts.push('Azure 未標示漏字、多字或發音不準的單字。');
  const scoreText = document.getElementById('scoreText');
  const scoreMessage = document.getElementById('scoreMessage');
  if(scoreText) scoreText.textContent = '';
  if(scoreMessage) scoreMessage.textContent = facts.join(' ');

  renderDetailAnalysis(result);
}

function resetAssessmentUi(){
  const overall = document.getElementById('overall');
  const scoreRing = document.getElementById('scoreRing');
  if(overall) overall.textContent = '--';
  if(scoreRing) scoreRing.style.background = 'conic-gradient(#e3e9f0 0 100%)';

  ['accuracy', 'fluency', 'completeness'].forEach(id => {
    const bar = document.getElementById(`bar-${id}`);
    const label = document.getElementById(`value-${id}`);
    if(bar) bar.style.width = '0%';
    if(label){
      label.innerHTML = '';
      label.appendChild(document.createTextNode('-- '));
      const small = document.createElement('small');
      small.textContent = '/100';
      label.appendChild(small);
    }
  });

  const scoreText = document.getElementById('scoreText');
  const scoreMessage = document.getElementById('scoreMessage');
  if(scoreText) scoreText.textContent = '';
  if(scoreMessage) scoreMessage.textContent = '尚未分析，請先錄音並按下「分析發音」查看結果。';

  const img = document.getElementById('characterImage');
  if(img){
    img.onerror = function(){
      this.outerHTML = '<div class="character-missing">角色圖片預留區<br>character-koala-default.png</div>';
    };
    img.src = 'assets/characters/character-koala-default.png';
  }

  const groups = document.getElementById('detailGroups');
  const tree = document.getElementById('wordTree');
  const detail = document.getElementById('detailAnalysis');
  if(groups) groups.innerHTML = '';
  if(tree) tree.innerHTML = '';
  if(detail) detail.hidden = true;
}

function assessFailureMessage(code){
  return ASSESS_ERROR_TEXT[code] || ASSESS_ERROR_TEXT.ASSESS_FAILED;
}

function isLocalAssessDebug(){
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function assessDebug(label, detail){
  if(!isLocalAssessDebug()) return;
  if(detail === undefined){
    console.info('[assess]', label);
    return;
  }
  console.info('[assess]', label, detail);
}

async function runPronunciationAssessment(text, recordingBlob, setStatus){
  const apiUrl = assessApiUrl();
  if(!apiUrl){
    throw new Error('NOT_CONFIGURED');
  }

  assessDebug('start', {
    apiUrl,
    textChars: text.length,
    recordingType: recordingBlob.type || '',
    recordingBytes: recordingBlob.size
  });
  if(typeof setStatus === 'function') setStatus('正在準備音訊並送出分析……');

  const wavBlob = await recordingBlobToAssessmentWav(recordingBlob);
  assessDebug('wav converted', { wavType: wavBlob.type || 'audio/wav', wavBytes: wavBlob.size });
  if(typeof setStatus === 'function') setStatus('音訊已轉換，正在送出 Azure 分析……');

  const audioBase64 = await assessmentWavToBase64(wavBlob);
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, audioBase64 })
  });
  let payload = null;
  try{ payload = await response.json(); }catch(e){ payload = null; }
  if(!response.ok || !payload || !payload.scores){
    const code = payload && payload.code ? payload.code : (response.status === 422 ? 'NO_SPEECH' : 'ASSESS_FAILED');
    assessDebug('response failed', {
      httpStatus: response.status,
      code,
      error: payload && payload.error ? payload.error : 'response parse failed or scores missing'
    });
    throw new Error(code);
  }

  assessDebug('response ok', {
    httpStatus: response.status,
    PronScore: payload.scores.overall,
    AccuracyScore: payload.scores.accuracy,
    FluencyScore: payload.scores.fluency,
    CompletenessScore: payload.scores.completeness,
    wordCount: Array.isArray(payload.words) ? payload.words.length : 0
  });
  return payload;
}
