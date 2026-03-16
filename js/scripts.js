// ══════════════════════════════════════════════
// GLOBAL VARIABLES
// ══════════════════════════════════════════════
function defPlayer() {
  return {
    lv: 1, exp: 0, expNext: 100, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    baseAtk: 10, baseDef: 5, critRate: 0.05, floor: 1, totalFloors: 0,
    inventory: [], equip: { weapon: null, armor: null }, relics: [],
    combo: 0, maxCombo: 0, wrongStreak: 0,
    stats: { vocabKills: 0, grammarKills: 0, bossKills: 0 },
    protectedByPhoenix: false, mpSkillCooldown: 0
  };
}

// 這些變數由 storage.js 初始化並設定為全域變數
// let ITEMS = {};
// let vWords = [];
// let gQuestions = [];
// let vStats = { correct: 0, wrong: 0, ws: {} };
// let gStats = { correct: 0, wrong: 0, ws: {} };
// let player = defPlayer(); 

// 確保 player 變數在全局範圍內可用，且能被 storage.js 覆寫。
// 在 storage.js 載入後，player 會被正確初始化。
// 如果在此處重新聲明，則會覆蓋 storage.js 載入的數據。
// 因此，此處只定義一個用於重置的 defPlayer 函數，而不進行初始化。
// 其他變數也類似處理，確保它們是單例的並且由 storage.js 負責管理。

// 如果需要在 scripts.js 中直接訪問這些變數，確保它們已被 storage.js 正確設置。
// 或者使用 window.變數名 來明確指向全局變數。

// 不再在此處重新聲明這些變數，以避免覆蓋 storage.js 載入的數據。
// initStorage 函數負責初始化這些全局變數。
// 這些變數預期在 window 範圍內被定義。

// 為了確保在 storage.js 載入完成之前，這些變數不會引起錯誤，
// 可以在此處將其設定為 null 或空物件/陣列，但不要使用 let/const 重新聲明。
// 例如：
// window.ITEMS = window.ITEMS || {};
// window.vWords = window.vWords || [];
// ...等等
// 但目前 storage.js 的初始化已經足夠。



// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
function onStorageReady() {
  // 題庫載入完成後初始化遊戲
  console.log('Storage ready, initializing game...');
  
  renderBattleCanvas();
  updHeader();
  renderDataPanel();
  dqStartInfo();
  updateStatusPanel();
  updateDungeonBar();
  updateEnemyHud();
  updateCharInfo();
  
  // MP skill button
  const mpBtn = document.createElement('button');
  mpBtn.id = 'mp-skill-btn';
  mpBtn.className = 'btn btn-purple';
  mpBtn.textContent = 'MP技能';
  mpBtn.style.display = 'none';
  mpBtn.addEventListener('click', () => {
    if (!dAnswered) {
      useMagic('burst');
    }
  });
  const skillZone = document.getElementById('skill-zone');
  if (skillZone) skillZone.appendChild(mpBtn);
  
  // MP cooldown
  setInterval(() => {
    if (player.mpSkillCooldown > 0) player.mpSkillCooldown--;
    if (player.mpSkillCooldown <= 0) {
      const btn = document.getElementById('mp-skill-btn');
      if (btn) btn.style.display = (player.mp || 0) >= 20 ? 'inline-flex' : 'none';
    }
  }, 1000);
  
  // MP regen
  setInterval(() => {
    const ar = player.equip.armor ? ITEMS[player.equip.armor] : null;
    if (ar?.effect?.mpRegen) healMp(ar.effect.mpRegen);
  }, 10000);
  
  // Auto save
  setInterval(saveAll, 15000);
  
  console.log('Game initialized successfully');
}

// 如果 storage.js 已經載入完成，直接初始化
if (typeof vWords !== 'undefined' && vWords.length > 0) {
  onStorageReady();
}
