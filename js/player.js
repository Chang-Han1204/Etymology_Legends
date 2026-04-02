// ══════════════════════════════════════════════
// PLAYER STATS
// ══════════════════════════════════════════════

function gainExp(amt, x, y) {
  let total = amt;
  const expGainArtifactEffect = getArtifactEffect("expGain");
  total = Math.round(total * (1 + expGainArtifactEffect)); // 應用經驗值獲取遺器效果
  player.exp = (player.exp || 0) + total;
  spawnFloat("+" + total + " EXP", x || cvW / 2, y || cvH * 0.55, "var(--gold)", "exp-gain"); // 下移經驗值顯示
  
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
  // 應用遺器效果
  player.mainCastleHp = (typeof CLASSES !== 'undefined' ? CLASSES.player.baseHp : 100) + getArtifactEffect("mainCastleHp");
  player.gold = getArtifactEffect("startingGold");

  saveAll();
  
  document.getElementById("dead-ov").classList.remove("show");
  currentEnemy = null;
  if (typeof Dungeon !== "undefined") Dungeon.isBossWave = false;
  
  updateStatusPanel();
  updateEnemyHud();
  updateDungeonBar();
  toast("⚔️ 重整旗鼓，再次出發！");
}

// 新增一個「徹底重置」的功能供玩家在資料面板使用
function hardReset() {
  if (!confirm("這將清除所有等級、裝備與進度，確定嗎？")) return;
  resetData(); // Call the global resetData from storage.js
  location.reload();
}

// 獻祭功能：重置等級並獲得奇蹟點數
function sacrifice() {
  if (player.lv < 10) { // 假設至少10級才能獻祭
    toast("等級不足，無法獻祭！至少需要達到Lv.10");
    return;
  }
  let confirmationMessage = `獻祭將重置您的等級至Lv.1，並根據您的冒險者等級 (Lv.${player.lv}) 和士兵總強化等級獲得奇蹟點數。確定嗎？`;
  if (!confirm(confirmationMessage)) return;

  let miraclePointsGained = Math.floor(player.lv / 2); // 基礎點數：每2級獲得1點

  // 計算士兵總強化等級
  let totalUpgradeLevels = 0;
  for (const unitId in player.upgrades) {
    const upgrade = player.upgrades[unitId];
    totalUpgradeLevels += (upgrade.atk || 0) + (upgrade.hp || 0) + (upgrade.elem || 0);
  }
  miraclePointsGained += Math.floor(totalUpgradeLevels / 10); // 每10點士兵強化等級獲得1點奇蹟點數

  player.miraclePoints = (player.miraclePoints || 0) + miraclePointsGained;
  player.totalSacrifices = (player.totalSacrifices || 0) + 1;

  // 重置玩家等級和經驗
  player.lv = 1;
  player.exp = 0;
  player.expNext = 100;

  // 重置其他相關進度 (例如：關卡進度)
  player.floor = 1; 
  // 這裡可以根據遊戲設計，重置其他需要重置的狀態，例如金錢、士兵等

  dLog(`🎉 獻祭成功！獲得 ${miraclePointsGained} 點奇蹟點數！`, "log-gold");
  toast(`獲得 ${miraclePointsGained} 點奇蹟點數！`);
  updateStatusPanel();
  saveAll();
  if (typeof renderArtifactList === 'function') {
    renderArtifactList();
  }
  if (typeof renderDataPanel === 'function') { // Add this line
    renderDataPanel(); // Add this line
  } // Add this line
  const mp = document.getElementById("char-miracle-points");
  if (mp) mp.textContent = player.miraclePoints || 0;
}

// 抽取遺器
function drawArtifact() {
  if (typeof ARTIFACTS === 'undefined') return;
  
  // 消耗奇蹟點數 (固定消耗1點)
  const pointsCost = 1;
  if ((player.miraclePoints || 0) < pointsCost) {
    toast(`奇蹟點數不足，需要 ${pointsCost} 點來抽取。`);
    return;
  }

  // 隨機抽取遺器邏輯
  const artifactKeys = Object.keys(ARTIFACTS);
  const randomArtifactKey = artifactKeys[Math.floor(Math.random() * artifactKeys.length)];
  
  player.miraclePoints -= pointsCost;
  player.artifactsDrawnCount = (player.artifactsDrawnCount || 0) + 1;

  // 如果是在介面中，更新顯示
  if (typeof renderArtifactList === 'function') {
    setTimeout(renderArtifactList, 100);
  }

  // 檢查是否已擁有該遺器
  if (!player.artifacts) player.artifacts = {};
  if (player.artifacts[randomArtifactKey]) {
    player.artifacts[randomArtifactKey].level = (player.artifacts[randomArtifactKey].level || 1) + 1;
    dLog(`✨ ${ARTIFACTS[randomArtifactKey].name} 等級提升至 Lv.${player.artifacts[randomArtifactKey].level}！`, "log-gold");
    toast(`${ARTIFACTS[randomArtifactKey].name} 升級！`);
  } else {
    player.artifacts[randomArtifactKey] = { level: 1 };
    dLog(`✨ 獲得新遺器：${ARTIFACTS[randomArtifactKey].name}！`, "log-gold");
    toast(`獲得新遺器：${ARTIFACTS[randomArtifactKey].name}！`);
  }

  updateStatusPanel();
  saveAll();
  
  // 更新介面
  if (typeof renderArtifactList === 'function') {
    renderArtifactList();
  }
  if (typeof renderDataPanel === 'function') { // Add this line
    renderDataPanel(); // Add this line
  } // Add this line
  const mp = document.getElementById("char-miracle-points");
  if (mp) mp.textContent = player.miraclePoints || 0;
}

// 計算遺器效果
function getArtifactEffect(effectType) {
  let totalEffect = 0;
  if (!player.artifacts || typeof ARTIFACTS === 'undefined') return totalEffect;

  for (const key in player.artifacts) {
    const artifact = ARTIFACTS[key];
    if (artifact && artifact.effectType === effectType) {
      const level = player.artifacts[key].level || 1;
      totalEffect += artifact.baseEffect * Math.pow(artifact.scaling, level - 1);
    }
  }
  return totalEffect;
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
  if (typeof battleAnim !== 'undefined' && battleAnim.floats) {
    battleAnim.floats.push({
      text: text,
      x: x,
      y: y,
      color: color.startsWith('var') ? '#f1c40f' : color, 
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

  // 經驗值顯示
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
  
  updateCharInfo();
}

function updateCharInfo() {
  const lv = player.lv || 1;
  const exp = player.exp || 0;
  
  const charLv = document.getElementById("char-lv");
  if (charLv) charLv.textContent = lv;
  
  const charExp = document.getElementById("char-exp");
  if (charExp) charExp.textContent = exp;

  const miraclePoints = player.miraclePoints || 0;
  const charMiraclePoints = document.getElementById("char-miracle-points");
  if (charMiraclePoints) charMiraclePoints.textContent = miraclePoints;
  
  const charFloor = document.getElementById("char-floor");
  if (charFloor) charFloor.textContent = player.floor || 1;
  
  const charVocabKills = document.getElementById("char-vocab-kills");
  if (charVocabKills) charVocabKills.textContent = player.stats?.vocabKills || 0;
  
  const charGrammarKills = document.getElementById("char-grammar-kills");
  if (charGrammarKills) charGrammarKills.textContent = player.stats?.grammarKills || 0;
  
  const charBossKills = document.getElementById("char-boss-kills");
  if (charBossKills) charBossKills.textContent = player.stats?.bossKills || 0;
}

function switchCharTab(tabName) {
  document.querySelectorAll('.char-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  
  document.querySelectorAll('.char-tab-panel').forEach(panel => panel.classList.add('hidden'));
  const targetPanel = document.getElementById(`char-${tabName}-panel`);
  if (targetPanel) targetPanel.classList.remove('hidden');
}

function updateEnemyHud() {}

function updateDungeonBar() {
  if (typeof Dungeon !== "undefined" && Dungeon.active) {
    const fl = Dungeon.wave || 1;
    const chip = document.getElementById("floor-chip");
    if (chip) chip.textContent = "WAVE " + fl;
    
    const trk = document.getElementById("floor-trk");
    if (trk) trk.style.width = (((fl - 1) % 10) + 1) / 10 * 100 + "%";
  } else {
    const fl = player.floor || 1;
    const chip = document.getElementById("floor-chip");
    if (chip) chip.textContent = "B" + fl + "F";
    
    const trk = document.getElementById("floor-trk");
    if (trk) trk.style.width = ((fl % 10) / 10 * 100) + "%";
  }
}

// 載入遺器數據
function loadArtifacts() {
  if (!player) return; // 確保 player 已初始化
  player.miraclePoints = player.miraclePoints || 0;
  player.artifacts = player.artifacts || {};
  player.artifactsDrawnCount = player.artifactsDrawnCount || 0;
}

// 監聽存儲就緒事件
if (typeof onStorageReady === 'undefined') {
  window.onStorageReady = loadArtifacts;
} else {
  const oldOnStorageReady = onStorageReady;
  window.onStorageReady = function() {
    oldOnStorageReady();
    loadArtifacts();
  };
}
