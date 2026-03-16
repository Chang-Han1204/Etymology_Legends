// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

function shuffle(a) {
  return [...a].sort(() => Math.random() - .5);
}

function speak(w) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(w);
    u.lang = 'en-US';
    u.rate = 0.88;
    speechSynthesis.speak(u);
  }
}

function rnd(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function toast(msg, col = 'var(--gold)') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--panel);border:2px solid ${col};color:${col};padding:9px 18px;font-size:13px;z-index:9999;pointer-events:none;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.6)`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300)
  }, 2500);
}

// ══════════════════════════════════════════════
// TOOLTIP
// ══════════════════════════════════════════════
let activeTip = null;

function removeTip() {
  if (activeTip) {
    activeTip.remove();
    activeTip = null;
  }
}

function showTip(el, word) {
  removeTip();
  const k = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!k || k.length < 2) return;
  const found = vWords.find(w => w.word.toLowerCase() === k);
  const zh = found?.zh || null;
  const tip = document.createElement('span');
  tip.className = 'tip-box';
  const lbl = document.createElement('span');
  lbl.style.color = 'var(--text)';
  lbl.textContent = zh ? `${k} → ${zh}` : k;
  const spk = document.createElement('button');
  spk.className = 'tip-spk';
  spk.textContent = '🔊';
  spk.addEventListener('click', e => {
    e.stopPropagation();
    speak(word);
  });
  tip.appendChild(lbl);
  tip.appendChild(spk);
  el.style.position = 'relative';
  el.appendChild(tip);
  activeTip = tip;
  speak(word);
  const close = (e) => {
    if (!el.contains(e.target)) {
      removeTip();
      document.removeEventListener('click', close, true);
    }
  };
  setTimeout(() => document.addEventListener('click', close, true), 150);
}

function mkCW(text) {
  if (!text) return '';
  // Build pieces safely without innerHTML injection
  const parts = [];
  let last = 0;
  const re = /([a-zA-Z]+(?:'[a-zA-Z]+)?)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(esc(text.slice(last, m.index)));
    const word = m[1];
    const k = word.toLowerCase().replace(/[^a-z]/g, '');
    if (k && k.length >= 2) {
      parts.push(`<span class="cw" onclick="event.stopPropagation();showTip(this,'${word.replace(/'/g, "\\'")}')">${esc(word)}</span>`);
    } else {
      parts.push(esc(word));
    }
    last = m.index + word.length;
  }
  if (last < text.length) parts.push(esc(text.slice(last)));
  return parts.join('');
}

document.addEventListener('click', e => {
  if (!e.target.classList.contains('cw') && !e.target.classList.contains('tip-spk')) removeTip();
});

// ══════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════
function loadLS(key, def) {
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch (e) {}
  return typeof def === 'function' ? def() : JSON.parse(JSON.stringify(def));
}

function saveLS(k, d) {
  localStorage.setItem(k, JSON.stringify(d));
}

