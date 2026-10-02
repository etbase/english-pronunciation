// TEMP KK PHONETIC FEATURE
// 41 個 KK 音標資料。音檔路徑：assets/kk/audio/{id}.mp3（每個檔已是連續 3 次發音）
// azureIpa 預留給之後用 Azure SSML <phoneme alphabet="ipa"> 產生音檔，這頁目前不呼叫 /api/tts。
(function (global) {
  const VOWELS = [
    { id: 'i', symbol: 'i', azureIpa: 'i' },
    { id: 'ih', symbol: 'ɪ', azureIpa: 'ɪ' },
    { id: 'ey', symbol: 'e', azureIpa: 'eɪ' },
    { id: 'eh', symbol: 'ɛ', azureIpa: 'ɛ' },
    { id: 'ae', symbol: 'æ', azureIpa: 'æ' },
    { id: 'aa', symbol: 'ɑ', azureIpa: 'ɑ' },
    { id: 'ao', symbol: 'ɔ', azureIpa: 'ɔ' },
    { id: 'ow', symbol: 'o', azureIpa: 'oʊ' },
    { id: 'uh', symbol: 'ʊ', azureIpa: 'ʊ' },
    { id: 'uw', symbol: 'u', azureIpa: 'u' },
    { id: 'ah', symbol: 'ʌ', azureIpa: 'ʌ' },
    { id: 'ax', symbol: 'ə', azureIpa: 'ə' },
    { id: 'er', symbol: 'ɝ', azureIpa: 'ɝ' },
    { id: 'ay', symbol: 'aɪ', azureIpa: 'aɪ' },
    { id: 'aw', symbol: 'aʊ', azureIpa: 'aʊ' },
    { id: 'oy', symbol: 'ɔɪ', azureIpa: 'ɔɪ' },
    { id: 'yu', symbol: 'ju', azureIpa: 'ju' }
  ];

  const CONSONANTS = [
    { id: 'p', symbol: 'p', azureIpa: 'p' },
    { id: 'b', symbol: 'b', azureIpa: 'b' },
    { id: 't', symbol: 't', azureIpa: 't' },
    { id: 'd', symbol: 'd', azureIpa: 'd' },
    { id: 'k', symbol: 'k', azureIpa: 'k' },
    { id: 'g', symbol: 'g', azureIpa: 'g' },
    { id: 'f', symbol: 'f', azureIpa: 'f' },
    { id: 'v', symbol: 'v', azureIpa: 'v' },
    { id: 'th', symbol: 'θ', azureIpa: 'θ' },
    { id: 'dh', symbol: 'ð', azureIpa: 'ð' },
    { id: 's', symbol: 's', azureIpa: 's' },
    { id: 'z', symbol: 'z', azureIpa: 'z' },
    { id: 'sh', symbol: 'ʃ', azureIpa: 'ʃ' },
    { id: 'zh', symbol: 'ʒ', azureIpa: 'ʒ' },
    { id: 'ch', symbol: 'tʃ', azureIpa: 'tʃ' },
    { id: 'jh', symbol: 'dʒ', azureIpa: 'dʒ' },
    { id: 'm', symbol: 'm', azureIpa: 'm' },
    { id: 'n', symbol: 'n', azureIpa: 'n' },
    { id: 'ng', symbol: 'ŋ', azureIpa: 'ŋ' },
    { id: 'l', symbol: 'l', azureIpa: 'l' },
    { id: 'r', symbol: 'r', azureIpa: 'ɹ' },
    { id: 'y', symbol: 'j', azureIpa: 'j' },
    { id: 'w', symbol: 'w', azureIpa: 'w' },
    { id: 'h', symbol: 'h', azureIpa: 'h' }
  ];

  global.KK_PHONEMES = {
    vowels: VOWELS,
    consonants: CONSONANTS,
    all: VOWELS.concat(CONSONANTS),
    audioUrl: function (id) {
      return 'assets/kk/audio/' + id + '.mp3';
    },
    zipUrl: 'assets/kk/kk-phonemes.zip'
  };
})(window);
