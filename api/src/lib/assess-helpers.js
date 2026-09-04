'use strict';

const { MAX_TEXT_LENGTH } = require('./tts-helpers');

// 未來若要開啟韻律評分，只改這裡為 true，並在回傳中帶出 ProsodyScore。
// 本次必須維持 false：不呼叫、不加購、不回傳 Prosody 分數。
const ENABLE_PROSODY_ASSESSMENT = false;

const MAX_AUDIO_BYTES = 1_200_000;
const MAX_AUDIO_SECONDS = 30;
const REQUIRED_SAMPLE_RATE = 16000;
const REQUIRED_BITS = 16;
const REQUIRED_CHANNELS = 1;
const LOW_ACCURACY_THRESHOLD = 60;

function getAssessUrl(region){
  const safeRegion = String(region || '').trim().toLowerCase();
  if(!/^[a-z0-9]+$/.test(safeRegion)){
    return null;
  }
  return `https://${safeRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
}

function buildPronunciationAssessmentConfig(referenceText){
  // 本專案走 Azure Speech REST short-audio API（Pronunciation-Assessment header），不是 Speech SDK。
  // REST 文件欄位：ReferenceText、GradingSystem、Granularity、Dimension、EnableMiscue、PhonemeAlphabet。
  const params = {
    ReferenceText: String(referenceText || ''),
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: true,
    PhonemeAlphabet: 'IPA'
  };
  if(ENABLE_PROSODY_ASSESSMENT){
    params.EnableProsodyAssessment = true;
  }
  return params;
}

function buildPronunciationAssessmentHeader(referenceText){
  return Buffer.from(JSON.stringify(buildPronunciationAssessmentConfig(referenceText)), 'utf8').toString('base64');
}

function findChunk(buffer, id, start){
  let offset = start;
  while(offset + 8 <= buffer.length){
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if(chunkId === id){
      return { offset: offset + 8, size: chunkSize, header: offset };
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return null;
}

function validateWavPcm16kMono(buffer){
  if(!Buffer.isBuffer(buffer) || buffer.length < 44){
    return { ok: false, error: 'audio must be a WAV file.' };
  }
  if(buffer.length > MAX_AUDIO_BYTES){
    return { ok: false, error: 'audio is too large.' };
  }
  if(buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE'){
    return { ok: false, error: 'audio must be WAV PCM.' };
  }

  const fmt = findChunk(buffer, 'fmt ', 12);
  if(!fmt || fmt.size < 16){
    return { ok: false, error: 'audio must be WAV PCM.' };
  }

  const audioFormat = buffer.readUInt16LE(fmt.offset);
  const channels = buffer.readUInt16LE(fmt.offset + 2);
  const sampleRate = buffer.readUInt32LE(fmt.offset + 4);
  const bitsPerSample = buffer.readUInt16LE(fmt.offset + 14);

  if(audioFormat !== 1){
    return { ok: false, error: 'audio must be uncompressed PCM WAV.' };
  }
  if(channels !== REQUIRED_CHANNELS){
    return { ok: false, error: 'audio must be mono.' };
  }
  if(sampleRate !== REQUIRED_SAMPLE_RATE){
    return { ok: false, error: 'audio must be 16 kHz.' };
  }
  if(bitsPerSample !== REQUIRED_BITS){
    return { ok: false, error: 'audio must be 16-bit PCM.' };
  }

  const data = findChunk(buffer, 'data', 12);
  if(!data || data.size <= 0){
    return { ok: false, error: 'audio has no PCM data.' };
  }
  const bytesPerSecond = REQUIRED_SAMPLE_RATE * REQUIRED_CHANNELS * (REQUIRED_BITS / 8);
  const seconds = data.size / bytesPerSecond;
  if(seconds > MAX_AUDIO_SECONDS){
    return { ok: false, error: 'audio must be 30 seconds or shorter.' };
  }
  if(seconds < 0.2){
    return { ok: false, error: 'audio is too short.' };
  }

  return { ok: true, buffer, seconds };
}

function decodeAudioBase64(raw){
  if(typeof raw !== 'string' || !raw.trim()){
    return { ok: false, error: 'audio is required.' };
  }
  let value = raw.trim();
  const comma = value.indexOf(',');
  if(value.startsWith('data:') && comma !== -1){
    value = value.slice(comma + 1);
  }
  let buffer;
  try{
    buffer = Buffer.from(value, 'base64');
  }catch{
    return { ok: false, error: 'audio is not valid base64.' };
  }
  if(!buffer.length){
    return { ok: false, error: 'audio is required.' };
  }
  return { ok: true, buffer };
}

function validateAssessBody(body){
  if(!body || typeof body !== 'object' || Array.isArray(body)){
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if(!text){
    return { ok: false, error: 'text is required.' };
  }
  if(text === '[object Object]'){
    return { ok: false, error: 'text must be the English reference sentence, not an object.' };
  }
  if(text.length > MAX_TEXT_LENGTH){
    return { ok: false, error: `text must be ${MAX_TEXT_LENGTH} characters or fewer.` };
  }

  const audioRaw = typeof body.audioBase64 === 'string' ? body.audioBase64
    : (typeof body.audio === 'string' ? body.audio : '');
  const decoded = decodeAudioBase64(audioRaw);
  if(!decoded.ok){
    return decoded;
  }

  const wav = validateWavPcm16kMono(decoded.buffer);
  if(!wav.ok){
    return wav;
  }

  return { ok: true, text, audio: wav.buffer, seconds: wav.seconds };
}

function asScore(value){
  if(typeof value !== 'number' || !Number.isFinite(value)){
    return null;
  }
  return value;
}

function displayScore(value){
  const score = asScore(value);
  if(score == null) return null;
  return Math.round(score);
}

function assessmentOf(node){
  if(!node || typeof node !== 'object') return {};
  if(node.PronunciationAssessment && typeof node.PronunciationAssessment === 'object'){
    return node.PronunciationAssessment;
  }
  return node;
}

function collectPhonemes(wordNode){
  const list = Array.isArray(wordNode.Phonemes) ? wordNode.Phonemes : [];
  return list.map(item => {
    const pa = assessmentOf(item);
    const nBest = Array.isArray(pa.NBestPhonemes) ? pa.NBestPhonemes.map(entry => ({
      phoneme: String(entry.Phoneme || ''),
      score: asScore(entry.Score)
    })).filter(entry => entry.phoneme) : [];
    return {
      phoneme: String(item.Phoneme || ''),
      accuracyScore: asScore(pa.AccuracyScore),
      offset: item.Offset,
      duration: item.Duration,
      nBestPhonemes: nBest
    };
  }).filter(item => item.phoneme);
}

function phonemesInRange(phonemes, offset, duration){
  if(typeof offset !== 'number' || typeof duration !== 'number'){
    return [];
  }
  const start = offset;
  const end = offset + duration;
  return phonemes.filter(item => typeof item.offset === 'number' && item.offset >= start && item.offset < end);
}

function collectSyllables(wordNode, phonemes){
  const list = Array.isArray(wordNode.Syllables) ? wordNode.Syllables : [];
  return list.map(item => {
    const pa = assessmentOf(item);
    return {
      syllable: String(item.Syllable || ''),
      accuracyScore: asScore(pa.AccuracyScore),
      offset: item.Offset,
      duration: item.Duration,
      phonemes: phonemesInRange(phonemes, item.Offset, item.Duration)
    };
  }).filter(item => item.syllable);
}

function collectWord(wordNode){
  const pa = assessmentOf(wordNode);
  const phonemes = collectPhonemes(wordNode);
  const syllables = collectSyllables(wordNode, phonemes);
  const assigned = new Set();
  syllables.forEach(syl => syl.phonemes.forEach(ph => assigned.add(ph)));
  const leftoverPhonemes = phonemes.filter(ph => !assigned.has(ph));

  return {
    word: String(wordNode.Word || wordNode.word || ''),
    accuracyScore: asScore(pa.AccuracyScore),
    errorType: String(pa.ErrorType || 'None'),
    offset: wordNode.Offset,
    duration: wordNode.Duration,
    syllables,
    phonemes: leftoverPhonemes
  };
}

function isFiniteScore(value){
  return typeof value === 'number' && Number.isFinite(value);
}

function phonemesWithWord(words){
  const list = [];
  (words || []).forEach(word => {
    const name = word && word.word ? String(word.word) : '';
    const push = (ph) => {
      if(!ph) return;
      list.push({
        phoneme: String(ph.phoneme || ''),
        word: name,
        score: asScore(ph.accuracyScore)
      });
    };
    (word.syllables || []).forEach(syl => (syl.phonemes || []).forEach(push));
    (word.phonemes || []).forEach(push);
  });
  return list;
}

function weakestAverage(items, getScore){
  const valid = (items || []).filter(item => isFiniteScore(getScore(item)));
  if(!valid.length){
    return { valid: [], weakest: [], average: null };
  }
  const sorted = valid.slice().sort((a, b) => getScore(a) - getScore(b));
  const count = Math.max(1, Math.ceil(sorted.length * 0.2));
  const weakest = sorted.slice(0, count);
  const average = weakest.reduce((sum, item) => sum + getScore(item), 0) / weakest.length;
  return { valid, weakest, average };
}

const TICKS_PER_MS = 10000;
const FLUENCY_ALLOWED_GAP_MS = 250;
const FLUENCY_LONG_PAUSE_MS = 800;
const FLUENCY_EDGE_GRACE_MS = 1500;

function ticksToMs(ticks){
  if(!isFiniteScore(ticks)) return null;
  return ticks / TICKS_PER_MS;
}

function spokenWordsForFluency(words){
  return (words || []).filter(word => {
    if(!word || word.errorType === 'Omission') return false;
    return ticksToMs(word.offset) != null && ticksToMs(word.duration) != null && word.duration > 0;
  }).slice().sort((a, b) => a.offset - b.offset);
}

function excessPauseMs(gapMs){
  if(!isFiniteScore(gapMs) || gapMs <= FLUENCY_ALLOWED_GAP_MS) return 0;
  let excess = gapMs - FLUENCY_ALLOWED_GAP_MS;
  if(gapMs > FLUENCY_LONG_PAUSE_MS){
    excess += (gapMs - FLUENCY_LONG_PAUSE_MS);
  }
  return excess;
}

function computePauseFluency(words, azureFluency, audioSeconds){
  const azure = asScore(azureFluency);
  const spoken = spokenWordsForFluency(words);
  const pauses = [];
  let speechMs = 0;
  let excessMs = 0;

  spoken.forEach(word => {
    speechMs += ticksToMs(word.duration);
  });

  for(let i = 0; i < spoken.length - 1; i++){
    const current = spoken[i];
    const next = spoken[i + 1];
    const gapMs = Math.max(0, ticksToMs(next.offset) - (ticksToMs(current.offset) + ticksToMs(current.duration)));
    const excess = excessPauseMs(gapMs);
    excessMs += excess;
    pauses.push({
      afterWord: current.word,
      beforeWord: next.word,
      gapMs: Math.round(gapMs),
      excessMs: Math.round(excess)
    });
  }

  if(isFiniteScore(audioSeconds) && audioSeconds > 0 && spoken.length){
    const audioMs = audioSeconds * 1000;
    const firstStart = ticksToMs(spoken[0].offset);
    const last = spoken[spoken.length - 1];
    const lastEnd = ticksToMs(last.offset) + ticksToMs(last.duration);
    const leadingExcess = Math.max(0, firstStart - FLUENCY_EDGE_GRACE_MS);
    const trailingExcess = Math.max(0, audioMs - lastEnd - FLUENCY_EDGE_GRACE_MS);
    excessMs += leadingExcess + trailingExcess;
    if(leadingExcess > 0){
      pauses.push({ afterWord: '', beforeWord: spoken[0].word, gapMs: Math.round(firstStart), excessMs: Math.round(leadingExcess), edge: 'leading' });
    }
    if(trailingExcess > 0){
      pauses.push({ afterWord: last.word, beforeWord: '', gapMs: Math.round(Math.max(0, audioMs - lastEnd)), excessMs: Math.round(trailingExcess), edge: 'trailing' });
    }
  }

  const canMeasure = speechMs > 0 && (pauses.length > 0 || excessMs > 0);
  const pauseFluency = canMeasure ? (100 * speechMs / (speechMs + excessMs)) : azure;
  const longPauseCount = pauses.filter(item => item.gapMs >= FLUENCY_LONG_PAUSE_MS).length;
  return {
    azureFluencyScore: azure,
    pauseFluency: asScore(pauseFluency),
    speechMs: Math.round(speechMs),
    excessPauseMs: Math.round(excessMs),
    longPauseCount,
    pauses,
    customFluency: azure == null ? null : Math.min(azure, azure * 0.4 + pauseFluency * 0.6)
  };
}

function computeCustomOverall(pronScore, words, accuracy, fluency, completeness, audioSeconds){
  const pron = asScore(pronScore);
  if(pron == null) return null;

  const azureAccuracy = asScore(accuracy);
  const azureFluency = asScore(fluency);
  const azureCompleteness = asScore(completeness);

  const wordItems = (words || []).map(word => ({
    word: String(word && word.word || ''),
    score: asScore(word && word.accuracyScore)
  }));
  const wordSlice = weakestAverage(wordItems, item => item.score);
  const phonemeSlice = weakestAverage(phonemesWithWord(words), item => item.score);

  const overallWeakWordScore = wordSlice.average == null ? pron : wordSlice.average;
  const overallWeakPhonemeScore = phonemeSlice.average == null ? overallWeakWordScore : phonemeSlice.average;
  const customOverall = pron * 0.7 + overallWeakWordScore * 0.2 + overallWeakPhonemeScore * 0.1;

  const accuracyWeakWordScore = wordSlice.average == null ? azureAccuracy : wordSlice.average;
  const accuracyWeakPhonemeScore = phonemeSlice.average == null ? accuracyWeakWordScore : phonemeSlice.average;
  const customAccuracy = azureAccuracy == null
    ? null
    : Math.min(azureAccuracy, azureAccuracy * 0.4 + accuracyWeakWordScore * 0.4 + accuracyWeakPhonemeScore * 0.2);

  const fluencyDebug = computePauseFluency(words, azureFluency, audioSeconds);
  const customFluency = fluencyDebug.customFluency;

  return {
    azurePronScore: pron,
    accuracyScore: azureAccuracy,
    fluencyScore: azureFluency,
    completenessScore: azureCompleteness,
    wordScores: wordSlice.valid.map(item => ({ word: item.word, score: item.score })),
    weakest20PercentWords: wordSlice.weakest.map(item => ({ word: item.word, score: item.score })),
    weakWordScore: overallWeakWordScore,
    phonemeScores: phonemeSlice.valid.map(item => ({ phoneme: item.phoneme, word: item.word, score: item.score })),
    weakest20PercentPhonemes: phonemeSlice.weakest.map(item => ({ phoneme: item.phoneme, word: item.word, score: item.score })),
    weakPhonemeScore: overallWeakPhonemeScore,
    customOverall,
    displayOverall: Math.round(customOverall),
    customAccuracy,
    displayAccuracy: customAccuracy == null ? null : Math.round(customAccuracy),
    pauseFluency: fluencyDebug.pauseFluency,
    excessPauseMs: fluencyDebug.excessPauseMs,
    longPauseCount: fluencyDebug.longPauseCount,
    pauses: fluencyDebug.pauses,
    customFluency,
    displayFluency: customFluency == null ? null : Math.round(customFluency)
  };
}

function isSuccessStatus(status){
  return status === 'Success' || status === 0 || status === '0';
}

function parseAssessmentResult(azureJson, options){
  if(!azureJson || typeof azureJson !== 'object'){
    return { ok: false, error: 'Azure response is missing assessment data.' };
  }

  const status = azureJson.RecognitionStatus;
  if(status && !isSuccessStatus(status)){
    return { ok: false, error: 'NO_SPEECH', recognitionStatus: String(status) };
  }

  const nbest = Array.isArray(azureJson.NBest) ? azureJson.NBest[0] : null;
  if(!nbest || typeof nbest !== 'object'){
    return { ok: false, error: 'Azure response is missing assessment data.' };
  }

  const pa = assessmentOf(nbest);
  const overall = asScore(pa.PronScore);
  const accuracy = asScore(pa.AccuracyScore);
  const fluency = asScore(pa.FluencyScore);
  const completeness = asScore(pa.CompletenessScore);

  if(overall == null || accuracy == null || fluency == null || completeness == null){
    return { ok: false, error: 'Azure response is missing required scores.' };
  }

  const words = (Array.isArray(nbest.Words) ? nbest.Words : []).map(collectWord).filter(item => item.word);
  const mispronunciations = [];
  const omissions = [];
  const insertions = [];

  words.forEach(word => {
    const type = word.errorType;
    if(type === 'Omission'){
      omissions.push({ word: word.word, accuracyScore: word.accuracyScore });
    }else if(type === 'Insertion'){
      insertions.push({ word: word.word, accuracyScore: word.accuracyScore });
    }else if(type === 'Mispronunciation'){
      mispronunciations.push({ word: word.word, accuracyScore: word.accuracyScore });
    }
  });

  const overallDebug = computeCustomOverall(
    overall,
    words,
    accuracy,
    fluency,
    completeness,
    options && options.audioSeconds
  );

  return {
    ok: true,
    scores: {
      overall,
      accuracy,
      fluency,
      completeness
    },
    displayScores: {
      overall: overallDebug.displayOverall,
      accuracy: overallDebug.displayAccuracy,
      fluency: overallDebug.displayFluency,
      completeness: displayScore(completeness)
    },
    overallDebug,
    recognizedText: String(azureJson.DisplayText || nbest.Display || ''),
    recognizedLexical: String(nbest.Lexical || nbest.ITN || ''),
    words,
    issues: {
      mispronunciations,
      omissions,
      insertions
    },
    prosody: {
      enabled: ENABLE_PROSODY_ASSESSMENT
    },
    lowAccuracyThreshold: LOW_ACCURACY_THRESHOLD
  };
}

function flattenPhonemes(words){
  const list = [];
  (words || []).forEach(word => {
    (word.syllables || []).forEach(syl => {
      (syl.phonemes || []).forEach(ph => list.push(ph));
    });
    (word.phonemes || []).forEach(ph => list.push(ph));
  });
  return list;
}

function normalizeEnglish(text){
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countByErrorType(words, type){
  return (words || []).filter(word => word.errorType === type).length;
}

function buildAssessmentDiagnostic(referenceText, parsed, azureJson){
  const words = (parsed && parsed.words) || [];
  const scores = (parsed && parsed.scores) || {};
  const phonemes = flattenPhonemes(words);
  const totalWords = words.length;
  const lowAccuracyWords = words.filter(word => typeof word.accuracyScore === 'number' && word.accuracyScore < 60);
  const veryLowAccuracyWords = words.filter(word => typeof word.accuracyScore === 'number' && word.accuracyScore < 40);
  const lowAccuracyPhonemes = phonemes.filter(ph => typeof ph.accuracyScore === 'number' && ph.accuracyScore < 60);
  const veryLowAccuracyPhonemes = phonemes.filter(ph => typeof ph.accuracyScore === 'number' && ph.accuracyScore < 40);
  const nbest = azureJson && Array.isArray(azureJson.NBest) ? azureJson.NBest[0] : null;
  const sampleWord = nbest && Array.isArray(nbest.Words) && nbest.Words[0] && typeof nbest.Words[0] === 'object'
    ? nbest.Words[0]
    : null;
  const pron = asScore(scores.overall);
  const completeness = asScore(scores.completeness);
  const recognizedText = String((parsed && parsed.recognizedText) || '');
  const recognizedLexical = String((parsed && parsed.recognizedLexical) || '');
  const reference = String(referenceText || '');
  const textMismatch = normalizeEnglish(reference) !== normalizeEnglish(recognizedText || recognizedLexical);

  return {
    referenceText: reference,
    recognizedText,
    recognizedLexical,
    recognitionStatus: azureJson && azureJson.RecognitionStatus ? String(azureJson.RecognitionStatus) : '',
    PronScore: pron,
    AccuracyScore: asScore(scores.accuracy),
    FluencyScore: asScore(scores.fluency),
    CompletenessScore: completeness,
    totalWords,
    words: words.map(word => ({
      word: word.word,
      accuracyScore: word.accuracyScore,
      errorType: word.errorType
    })),
    lowAccuracyWords: lowAccuracyWords.length,
    veryLowAccuracyWords: veryLowAccuracyWords.length,
    lowAccuracyRatio: totalWords ? lowAccuracyWords.length / totalWords : 0,
    mispronunciationCount: countByErrorType(words, 'Mispronunciation'),
    omissionCount: countByErrorType(words, 'Omission'),
    insertionCount: countByErrorType(words, 'Insertion'),
    totalPhonemes: phonemes.length,
    lowAccuracyPhonemes: lowAccuracyPhonemes.length,
    veryLowAccuracyPhonemes: veryLowAccuracyPhonemes.length,
    lowPhonemeRatio: phonemes.length ? lowAccuracyPhonemes.length / phonemes.length : 0,
    hasWordAccuracy: words.some(word => typeof word.accuracyScore === 'number'),
    hasErrorType: words.some(word => !!word.errorType),
    hasSyllableData: words.some(word => Array.isArray(word.syllables) && word.syllables.length > 0),
    hasPhonemeData: phonemes.length > 0,
    rawNBestKeys: nbest ? Object.keys(nbest) : [],
    rawSampleWordKeys: sampleWord ? Object.keys(sampleWord) : [],
    flags: {
      highPronLowWordAccuracy: pron != null && pron > 90 && totalWords > 0 && (lowAccuracyWords.length / totalWords) >= 0.3,
      highPronLowCompleteness: pron != null && pron > 90 && completeness != null && completeness < 70,
      highPronMismatchedText: pron != null && pron > 90 && textMismatch,
      highPronLowPhoneme: pron != null && pron > 90 && phonemes.length > 0 && (lowAccuracyPhonemes.length / phonemes.length) >= 0.3
    },
    overallDebug: parsed && parsed.overallDebug ? parsed.overallDebug : null
  };
}

module.exports = {
  ENABLE_PROSODY_ASSESSMENT,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
  LOW_ACCURACY_THRESHOLD,
  getAssessUrl,
  buildPronunciationAssessmentConfig,
  buildPronunciationAssessmentHeader,
  validateWavPcm16kMono,
  validateAssessBody,
  parseAssessmentResult,
  buildAssessmentDiagnostic,
  computeCustomOverall,
  displayScore
};
