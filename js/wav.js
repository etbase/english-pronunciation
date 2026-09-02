// 把瀏覽器錄音轉成 Azure Pronunciation Assessment 可接受的 16 kHz / 16-bit / mono PCM WAV。
// 原本的錄音 Blob 不在這裡被改寫，分析用的是另外轉出的版本。
(function (global) {
  const TARGET_RATE = 16000;
  const MAX_SECONDS = 30;

  function mixToMono(audioBuffer){
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    if(channels === 1){
      return audioBuffer.getChannelData(0).slice(0);
    }
    const mixed = new Float32Array(length);
    for(let c = 0; c < channels; c++){
      const data = audioBuffer.getChannelData(c);
      for(let i = 0; i < length; i++){
        mixed[i] += data[i];
      }
    }
    for(let i = 0; i < length; i++){
      mixed[i] /= channels;
    }
    return mixed;
  }

  function resample(float32, fromRate, toRate){
    if(fromRate === toRate) return float32;
    const ratio = fromRate / toRate;
    const newLen = Math.max(1, Math.round(float32.length / ratio));
    const out = new Float32Array(newLen);
    for(let i = 0; i < newLen; i++){
      const src = i * ratio;
      const i0 = Math.floor(src);
      const i1 = Math.min(i0 + 1, float32.length - 1);
      const frac = src - i0;
      out[i] = float32[i0] * (1 - frac) + float32[i1] * frac;
    }
    return out;
  }

  function writeString(view, offset, text){
    for(let i = 0; i < text.length; i++){
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }

  function encodeWavPcm16(float32, sampleRate){
    const dataSize = float32.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for(let i = 0; i < float32.length; i++, offset += 2){
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function blobToBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(new Error('WAV_ENCODE_FAILED'));
      reader.readAsDataURL(blob);
    });
  }

  async function recordingBlobToAssessmentWav(blob){
    if(!blob){
      throw new Error('NO_RECORDING');
    }
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if(!AudioContextClass){
      throw new Error('WAV_UNSUPPORTED');
    }
    const ctx = new AudioContextClass();
    try{
      if(ctx.state === 'suspended'){
        await ctx.resume();
      }
      const arrayBuffer = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const duration = Number.isFinite(decoded.duration) && decoded.duration > 0
        ? decoded.duration
        : (decoded.length / decoded.sampleRate);
      if(duration > MAX_SECONDS){
        throw new Error('AUDIO_TOO_LONG');
      }
      if(duration < 0.2 || decoded.length < TARGET_RATE / 5){
        throw new Error('AUDIO_TOO_SHORT');
      }
      const mono = mixToMono(decoded);
      const resampled = resample(mono, decoded.sampleRate, TARGET_RATE);
      return encodeWavPcm16(resampled, TARGET_RATE);
    }catch(error){
      if(error && error.message && /^(NO_RECORDING|WAV_UNSUPPORTED|AUDIO_TOO_LONG|AUDIO_TOO_SHORT|WAV_ENCODE_FAILED)$/.test(error.message)){
        throw error;
      }
      throw new Error('WAV_CONVERT_FAILED');
    }finally{
      if(ctx && ctx.state !== 'closed'){
        try{ await ctx.close(); }catch(e){ /* ignore */ }
      }
    }
  }

  global.recordingBlobToAssessmentWav = recordingBlobToAssessmentWav;
  global.assessmentWavToBase64 = blobToBase64;
})(window);
