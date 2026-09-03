'use strict';

const assert = require('node:assert/strict');
const {
  ENABLE_PROSODY_ASSESSMENT,
  getAssessUrl,
  buildPronunciationAssessmentConfig,
  buildPronunciationAssessmentHeader,
  validateWavPcm16kMono,
  validateAssessBody,
  parseAssessmentResult,
  buildAssessmentDiagnostic
} = require('./assess-helpers');

function writeWavPcm16kMono(seconds, sampleValue = 0){
  const sampleRate = 16000;
  const samples = Math.round(sampleRate * seconds);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for(let i = 0; i < samples; i++){
    buffer.writeInt16LE(sampleValue, 44 + i * 2);
  }
  return buffer;
}

assert.equal(ENABLE_PROSODY_ASSESSMENT, false);

assert.equal(getAssessUrl('westus3'), 'https://westus3.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed');
assert.equal(getAssessUrl('../evil'), null);

const config = buildPronunciationAssessmentConfig('Hello world');
assert.equal(config.ReferenceText, 'Hello world');
assert.equal(config.GradingSystem, 'HundredMark');
assert.equal(config.Granularity, 'Phoneme');
assert.equal(config.Dimension, 'Comprehensive');
assert.equal(config.EnableMiscue, true);
assert.equal(config.PhonemeAlphabet, 'IPA');
assert.equal('EnableProsodyAssessment' in config, false);

const headerJson = Buffer.from(buildPronunciationAssessmentHeader('Hello'), 'base64').toString('utf8');
assert.equal(headerJson.includes('EnableProsodyAssessment'), false);
assert.equal(headerJson.includes('Hello'), true);

assert.equal(validateWavPcm16kMono(Buffer.from('not-wav')).ok, false);
assert.equal(validateWavPcm16kMono(writeWavPcm16kMono(0.05)).ok, false);
assert.equal(validateWavPcm16kMono(writeWavPcm16kMono(31)).ok, false);
assert.equal(validateWavPcm16kMono(writeWavPcm16kMono(1, 1200)).ok, true);

assert.equal(validateAssessBody(null).ok, false);
assert.equal(validateAssessBody({ text: '   ', audioBase64: 'aa' }).ok, false);
assert.equal(validateAssessBody({ text: 'Hello', audioBase64: writeWavPcm16kMono(0.5).toString('base64') }).ok, true);

const parsed = parseAssessmentResult({
  RecognitionStatus: 'Success',
  DisplayText: 'Hello particularly extra.',
  NBest: [{
    Display: 'Hello particularly extra.',
    Lexical: 'hello particularly extra',
    PronunciationAssessment: {
      AccuracyScore: 88.4,
      FluencyScore: 91.2,
      CompletenessScore: 80,
      PronScore: 86.6,
      ProsodyScore: 12
    },
    Words: [
      {
        Word: 'hello',
        Offset: 1000000,
        Duration: 4000000,
        PronunciationAssessment: { AccuracyScore: 99, ErrorType: 'None' },
        Syllables: [
          {
            Syllable: 'hɛ',
            Offset: 1000000,
            Duration: 1500000,
            PronunciationAssessment: { AccuracyScore: 91 }
          },
          {
            Syllable: 'loʊ',
            Offset: 2500000,
            Duration: 2500000,
            PronunciationAssessment: { AccuracyScore: 100 }
          }
        ],
        Phonemes: [
          { Phoneme: 'h', Offset: 1000000, Duration: 700000, PronunciationAssessment: { AccuracyScore: 98 } },
          { Phoneme: 'ɛ', Offset: 1700000, Duration: 800000, PronunciationAssessment: { AccuracyScore: 47 } },
          { Phoneme: 'l', Offset: 2500000, Duration: 1000000, PronunciationAssessment: { AccuracyScore: 100 } },
          { Phoneme: 'oʊ', Offset: 3500000, Duration: 1500000, PronunciationAssessment: { AccuracyScore: 100 } }
        ]
      },
      {
        Word: 'particularly',
        Offset: 5000000,
        Duration: 3000000,
        PronunciationAssessment: { AccuracyScore: 42, ErrorType: 'Mispronunciation' },
        Syllables: [
          {
            Syllable: 'pər',
            Offset: 5000000,
            Duration: 3000000,
            PronunciationAssessment: { AccuracyScore: 40 }
          }
        ],
        Phonemes: [
          { Phoneme: 'p', Offset: 5000000, Duration: 3000000, PronunciationAssessment: { AccuracyScore: 38 } }
        ]
      },
      {
        Word: 'missing',
        PronunciationAssessment: { ErrorType: 'Omission' }
      },
      {
        Word: 'extra',
        PronunciationAssessment: { AccuracyScore: 70, ErrorType: 'Insertion' }
      }
    ]
  }]
});

assert.equal(parsed.ok, true);
assert.equal(parsed.recognizedText, 'Hello particularly extra.');
assert.equal(parsed.recognizedLexical, 'hello particularly extra');
assert.equal(parsed.scores.overall, 86.6);
assert.equal(parsed.scores.accuracy, 88.4);
assert.equal(parsed.scores.fluency, 91.2);
assert.equal(parsed.scores.completeness, 80);
assert.equal(parsed.displayScores.overall, 87);
assert.equal(parsed.prosody.enabled, false);
assert.equal('prosodyScore' in parsed.scores, false);
assert.equal(parsed.issues.mispronunciations[0].word, 'particularly');
assert.equal(parsed.issues.omissions[0].word, 'missing');
assert.equal(parsed.issues.insertions[0].word, 'extra');
assert.equal(parsed.words[0].syllables.length, 2);
assert.equal(parsed.words[0].syllables[0].phonemes.map(p => p.phoneme).join(''), 'hɛ');
assert.equal(parsed.words[0].syllables[1].phonemes.map(p => p.phoneme).join(''), 'loʊ');
assert.equal(parsed.words[1].syllables[0].accuracyScore, 40);

const restParsed = parseAssessmentResult({
  RecognitionStatus: 'Success',
  DisplayText: 'Hello.',
  NBest: [{
    Display: 'Hello.',
    AccuracyScore: 100,
    FluencyScore: 99,
    CompletenessScore: 98,
    PronScore: 97,
    Words: [{
      Word: 'hello',
      Offset: 0,
      Duration: 100,
      AccuracyScore: 100,
      ErrorType: 'None',
      Syllables: [{ Syllable: 'hɛ', Offset: 0, Duration: 50, AccuracyScore: 100 }],
      Phonemes: [{ Phoneme: 'h', Offset: 0, Duration: 50, AccuracyScore: 100 }]
    }]
  }]
});
assert.equal(restParsed.ok, true);
assert.equal(restParsed.scores.overall, 97);
assert.equal(restParsed.words[0].accuracyScore, 100);
assert.equal(restParsed.words[0].syllables[0].phonemes[0].phoneme, 'h');

const diagnostic = buildAssessmentDiagnostic('Hello world extra.', parsed, {
  RecognitionStatus: 'Success',
  NBest: [{
    Display: 'Hello particularly extra.',
    Lexical: 'hello particularly extra',
    Words: [{ Word: 'hello' }]
  }]
});
assert.equal(diagnostic.referenceText, 'Hello world extra.');
assert.equal(diagnostic.recognizedText, 'Hello particularly extra.');
assert.equal(diagnostic.totalWords, 4);
assert.equal(diagnostic.mispronunciationCount, 1);
assert.equal(diagnostic.omissionCount, 1);
assert.equal(diagnostic.insertionCount, 1);
assert.equal(diagnostic.lowAccuracyWords, 1);
assert.equal(diagnostic.veryLowAccuracyWords, 0);
assert.ok(diagnostic.totalPhonemes > 0);
assert.equal(diagnostic.hasSyllableData, true);
assert.equal(diagnostic.hasPhonemeData, true);
assert.equal(diagnostic.hasErrorType, true);
assert.equal(validateAssessBody({ text: '[object Object]', audioBase64: writeWavPcm16kMono(0.5).toString('base64') }).ok, false);

assert.equal(parseAssessmentResult({ RecognitionStatus: 'NoMatch', NBest: [] }).ok, false);
assert.equal(parseAssessmentResult({
  RecognitionStatus: 'Success',
  NBest: [{ PronunciationAssessment: { AccuracyScore: 90, FluencyScore: 90, CompletenessScore: 90 } }]
}).ok, false);

console.log('assess-helpers tests passed');
