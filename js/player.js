// ══════════════════════════════════════════════
// PLAYER STATS
// ══════════════════════════════════════════════



function getPlayerClass() {
  // 獲取所有職業並依等級排序，預設等級為 1
  const sortedClasses = Object.values(CLASSES).sort((a, b) => (a.lv || 1) - (b.lv || 1));
  let c = sortedClasses[0]; // 預設為最低等級職業

  for (const ci of sortedClasses) {
    if (player.lv >= (ci.lv || 1)) c = ci;
  }
  return c;
}

function getMaxHp() {
  const cls = getPlayerClass();
  return (cls.baseHp || 100) + (player.lv - 1) * 20;
}

function getMaxMp() {
  const cls = getPlayerClass();
  return (cls.baseMp || 50) + (player.lv - 1) * 5;
}

function getAtk() {
  const cls = getPlayerClass();
  let atk = (player.baseAtk || cls.baseAtk || 10);
  // 這裡可以加入其他加成邏輯
  return atk;
}

function getDef() {
  const cls = getPlayerClass();
  let def = (player.baseDef || cls.baseDef || 5);
  return def;
}

function getCrit() {
  return 0.05 + (player.combo || 0) * 0.01;
}

// ══════════════════════════════════════════════
// DAMAGE CALC
// ══════════════════════════════════════════════
function calculateDamage(isGrammar = false, isBoss = false) {
  const atk = getAtk();
  const eDef = currentEnemy ? currentEnemy.def : 0;
  let dmg = Math.max(1, atk - Math.floor(eDef * 0.5));
  if (isGrammar) {
    dmg += Math.floor((gStats.correct || 0) / 10) * 2;
  }
  dmg += Math.floor((vStats.correct || 0) / 10);
  if (player.combo >= 5) dmg = Math.round(dmg * 1.3);
  let isCrit = false;
  if (Math.random() < getCrit()) {
    dmg = Math.round(dmg * 1.8);
    isCrit = true;
  }
  return { dmg: Math.max(1, dmg), isCrit };
}

function calcEnemyDmg() {
  if (!currentEnemy) return 0;
  let d = Math.max(1, currentEnemy.atk - Math.floor(getDef() * 0.6));

  return Math.max(1, d);
}

function gainExp(amt, x, y) {
  let total = amt;
  player.exp = (player.exp || 0) + total;
  spawnFloat("+" + total + " EXP", x || cvW / 2, y || cvH * 0.5, "var(--gold)");
  
  const expDisp = document.getElementById("exp-disp");
  if (expDisp) expDisp.textContent = player.exp;

  while (player.exp >= (player.expNext || 100)) {
    player.exp -= (player.expNext || 100);
    player.lv++;
    player.expNext = Math.round(100 * Math.pow(1.15, player.lv - 1));
    player.baseAtk = (player.baseAtk || 10) + 2;
    player.baseDef = (player.baseDef || 5) + 1;
    const mhp = getMaxHp();
    player.maxHp = mhp;
    player.hp = Math.min((player.hp || 0) + 30, mhp);
    dLog(`⭐ LEVEL UP! Lv.${player.lv} — ${getPlayerClass().name}`, "log-gold");
    sfxLevelUp();
    setTimeout(() => showLU(player.lv), 400);
  }
  updateStatusPanel();
  saveAll();
}

function revive() {
  player.hp = Math.round(getMaxHp() * 0.5);
  document.getElementById('dead-ov').classList.remove('show');
  updateStatusPanel();
}

function newGame() {
  player.combo = 0;
  player.wrongStreak = 0;
  
  saveAll();
  
  document.getElementById('dead-ov').classList.remove('show');
  currentEnemy = null;
  if (typeof Dungeon !== 'undefined') Dungeon.isBossWave = false;
  
  updateStatusPanel();
  updateEnemyHud();
  updateDungeonBar();
  toast('⚔️ 重整旗鼓，再次出發！');
}

// 新增一個「徹底重置」的功能供玩家在資料面板使用
function hardReset() {
  if (!confirm("這將清除所有等級、裝備與進度，確定嗎？")) return;
  resetData(); // Call the global resetData from storage.js
  location.reload();
}

// ══════════════════════════════════════════════
// LEVEL UP OVERLAY
// ══════════════════════════════════════════════
function showLU(lv) {
  const cls = getPlayerClass();
  document.getElementById('lu-lv').textContent = 'Lv.' + lv;
  document.getElementById('lu-cls').textContent = cls.sprite + ' ' + cls.name;
  document.getElementById('lu-ov').classList.add('show');
  spawnParticles();
}

function closeLU() {
  document.getElementById('lu-ov').classList.remove('show');
}

function spawnParticles() {
  const emojis = ['⭐', '✨', '🌟', '💫', '🎉'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 220;
    p.style.cssText = `left:50vw;top:50vh;--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;animation-delay:${Math.random() * .3}s`;
    p.textContent = emojis[i % emojis.length];
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2100);
  }
}

// ══════════════════════════════════════════════
// DAMAGE FLOATS
// ══════════════════════════════════════════════
function spawnFloat(text, x, y, color = 'var(--gold)') {
  const wrap = document.querySelector('.battle-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'dmg-float';
  // 座標改為相對於 .battle-wrap，這能解決偏移問題
  el.style.cssText = `left:${x}px; top:${y}px; color:${color}; position:absolute;`;
  el.textContent = text;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

// ══════════════════════════════════════════════
// STATUS PANEL UPDATE
// ══════════════════════════════════════════════
function updateStatusPanel() {
  const cls = getPlayerClass();
  const phudName = document.getElementById('phud-name');
  if (phudName) phudName.textContent = '冒險者';
  
  const phudClass = document.getElementById('phud-class');
  if (phudClass) phudClass.textContent = cls.name;
  
  const plv = document.getElementById('plv');
  if (plv) plv.textContent = player.lv || 1;
  const plvDisp = document.getElementById('plv-disp');
  if (plvDisp) plvDisp.textContent = player.lv || 1;

  const combo = player.combo || 0;
  const pc = document.getElementById('pcombo');
  if (pc) {
    if (combo >= 3) pc.textContent = '🔥' + combo + '連';
    else pc.textContent = '';
  }

  // 經驗值顯示 (dqpf 進度條)
  const expDisp = document.getElementById('exp-disp');
  if (expDisp) expDisp.textContent = player.exp || 0;
  
  const dqpf = document.getElementById('dqpf');
  if (dqpf) {
    const expNext = player.expNext || 100;
    const expPct = clamp((player.exp || 0) / expNext * 100, 0, 100);
    dqpf.style.width = expPct + '%';
  }

  const cd = document.getElementById('combo-disp');
  if (cd) {
    if (combo >= 3) cd.innerHTML = `<span style="color:var(--gold);font-weight:700">🔥${combo}連勝</span>`;
    else cd.innerHTML = '';
  }
  
  // 更新角色資訊面板
  updateCharInfo();
}

function updateCharInfo() {
  // 更新角色資訊面板的數據
  const lv = player.lv || 1;
  const exp = player.exp || 0;
  
  // 更新基本屬性
  const charLv = document.getElementById('char-lv');
  if (charLv) charLv.textContent = lv;
  
  const charExp = document.getElementById('char-exp');
  if (charExp) charExp.textContent = exp;
  
  // 更新進度數據
  const charFloor = document.getElementById('char-floor');
  if (charFloor) charFloor.textContent = player.floor || 1;
  
  const charVocabKills = document.getElementById('char-vocab-kills');
  if (charVocabKills) charVocabKills.textContent = player.stats?.vocabKills || 0;
  
  const charGrammarKills = document.getElementById('char-grammar-kills');
  if (charGrammarKills) charGrammarKills.textContent = player.stats?.grammarKills || 0;
  
  const charBossKills = document.getElementById('char-boss-kills');
  if (charBossKills) charBossKills.textContent = player.stats?.bossKills || 0;

}

// 分頁切換功能
function switchCharTab(tabName) {
  // 更新按鈕樣式
  document.querySelectorAll('.char-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 顯示對應面板
  document.querySelectorAll('.char-tab-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`char-${tabName}-panel`).classList.remove('hidden');
}


function updateEnemyHud() {
  const ehudName = document.getElementById("ehud-name");
  const ehudClass = document.getElementById("ehud-class");
  const ehpBar = document.getElementById("ehp-bar");
  const ehpVal = document.getElementById("ehp-val");
  const eatk = document.getElementById("eatk");
  const edef = document.getElementById("edef");

  if (!currentEnemy) {
    if (ehudName) ehudName.textContent = "??";
    if (ehudClass) ehudClass.textContent = "—";
    if (ehpBar) ehpBar.style.width = "100%";
    if (ehpVal) ehpVal.textContent = "—";
    if (eatk) eatk.textContent = "—";
    if (edef) edef.textContent = "—";
    return;
  }
  
  const pct = clamp(currentEnemy.hp / currentEnemy.maxHp * 100, 0, 100);
  if (ehpBar) {
    ehpBar.style.width = pct + "%";
    if (pct < 30) ehpBar.classList.add("low");
    else ehpBar.classList.remove("low");
  }
  
  if (ehudName) ehudName.textContent = currentEnemy.name;
  if (ehudClass) ehudClass.textContent = currentEnemy.class || "";
  if (ehpVal) ehpVal.textContent = currentEnemy.hp + "/" + currentEnemy.maxHp;
  if (eatk) eatk.textContent = currentEnemy.atk;
  if (edef) edef.textContent = currentEnemy.def;
}

function updateDungeonBar() {
  if (typeof Dungeon !== 'undefined' && Dungeon.active) {
    const fl = Dungeon.wave || 1;
    const chip = document.getElementById('floor-chip');
    if (chip) chip.textContent = 'WAVE ' + fl;
    
    const trk = document.getElementById('floor-trk');
    if (trk) trk.style.width = (((fl - 1) % 10) + 1) / 10 * 100 + '%';
  } else {
    const fl = player.floor || 1;
    const chip = document.getElementById('floor-chip');
    if (chip) chip.textContent = 'B' + fl + 'F';
    
    const trk = document.getElementById('floor-trk');
    if (trk) trk.style.width = ((fl % 10) / 10 * 100) + '%';
  }
}
