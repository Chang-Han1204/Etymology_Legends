// ══════════════════════════════════════════════
// WEB AUDIO — 8-bit SFX
// ══════════════════════════════════════════════
let AudioCtx = null;

function getAC() {
  if (!AudioCtx) AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return AudioCtx;
}

function playTone(freq, dur, type = 'square', vol = 0.15) {
  try {
    const ac = getAC();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    
    osc.connect(gain);
    gain.connect(ac.destination);
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur);

    // 釋放資源：在音效結束後斷開節點連接
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch (e) {}
}

function sfxCorrect() {
  playTone(523, .08);
  setTimeout(() => playTone(659, .08), 80);
  setTimeout(() => playTone(784, .15), 160);
}

function sfxWrong() {
  playTone(220, .1, 'sawtooth', .2);
  setTimeout(() => playTone(185, .15, 'sawtooth', .2), 100);
}

function sfxLevelUp() {
  [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => setTimeout(() => playTone(f, .08), i * 70));
}

function sfxHit() {
  playTone(440, .06, 'square', .3);
  setTimeout(() => playTone(330, .1, 'square', .15), 60);
}

function sfxBoss() {
  [110, 100, 90].forEach((f, i) => setTimeout(() => playTone(f, .2, 'sawtooth', .25), i * 180));
}

function sfxChest() {
  [659, 784, 988].forEach((f, i) => setTimeout(() => playTone(f, .1), i * 100));
}

function sfxDead() {
  [220, 185, 155, 130].forEach((f, i) => setTimeout(() => playTone(f, .25, 'sawtooth', .3), i * 200));
}

// ══════════════════════════════════════════════
// TEXT-TO-SPEECH
// ══════════════════════════════════════════════

// 預先快取語音清單（瀏覽器非同步載入，第一次 getVoices() 通常是空的）
let _cachedVoices = [];
function _loadVoices() {
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) _cachedVoices = v;
}
if ('speechSynthesis' in window) {
  _loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', _loadVoices);
}

function _pickEnglishVoice() {
  // 優先選 en-US，其次任何 en-* 語音
  return _cachedVoices.find(v => v.lang === 'en-US')
      || _cachedVoices.find(v => v.lang.startsWith('en'))
      || null;
}

function speak(text, rate = 1.0, pitch = 1.0) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 0.8;
  utterance.lang = 'en-US';

  const voice = _pickEnglishVoice();
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

// 詞彙語音播放
function speakVocabSentence(word, sentence) {
  // 將句子中的 ___ 替換為實際單字
  const fullSentence = sentence.replace(/___/g, word);
  speak(fullSentence, 0.9, 1.0);
}

// 文法語音播放
function speakGrammarSentence(sentence) {
  speak(sentence, 0.9, 1.0);
}

