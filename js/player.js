// ══════════════════════════════════════════════
// PLAYER STATS
// ══════════════════════════════════════════════



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
    dLog(`⭐ LEVEL UP! Lv.${player.lv}`, "log-gold");
    sfxLevelUp();
    setTimeout(() => showLU(player.lv), 400);
  }
  updateStatusPanel();
  saveAll();
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
  document.getElementById('lu-lv').textContent = 'Lv.' + lv;
  const luCls = document.getElementById('lu-cls');
  if (luCls) luCls.textContent = '冒險等級提升！';
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
// DAMAGE FLOATS (REWRITTEN FOR CANVAS)
// ══════════════════════════════════════════════
function spawnFloat(text, x, y, color = 'var(--gold)') {
  // 為了減少 DOM 操作提升效能，改為將數據推送到 battleAnim.floats 由 Canvas 渲染
  if (typeof battleAnim !== 'undefined' && battleAnim.floats) {
    battleAnim.floats.push({
      text: text,
      x: x,
      y: y,
      color: color.startsWith('var') ? '#f1c40f' : color, // 簡單處理 CSS 變數
      life: 1.0,
      size: text.includes('+') ? 14 : 12
    });
  }
}

// ══════════════════════════════════════════════
// STATUS PANEL UPDATE
// ══════════════════════════════════════════════
function updateStatusPanel() {
  const phudName = document.getElementById('phud-name');
  if (phudName) phudName.textContent = '冒險者';
  
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
  // 目前僅顯示剩餘敵方波次資訊，不再顯示單體敵人詳細數值
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
