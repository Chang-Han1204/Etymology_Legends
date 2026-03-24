// ══════════════════════════════════════════════
// GLOBAL VARIABLES
// ══════════════════════════════════════════════
let currentEnemy = null; // Declare currentEnemy globally

function defPlayer() {
  return {
    lv: 1, exp: 0, expNext: 100, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    baseAtk: 10, baseDef: 5, critRate: 0.05, floor: 1, totalFloors: 0,
    inventory: [], equip: { weapon: null, armor: null }, relics: [],
    combo: 0, maxCombo: 0, wrongStreak: 0,
    stats: { vocabKills: 0, grammarKills: 0, bossKills: 0 },
    protectedByPhoenix: false, mpSkillCooldown: 0,
    gems: 0, // 新增寶石數量
    upgrades: { // 新增升級屬性
      warrior: { atk: 0, hp: 0, speed: 0 },
      skeleton: { atk: 0, hp: 0, speed: 0 },
      paladin: { atk: 0, hp: 0, speed: 0 },
      hero: { atk: 0, hp: 0, speed: 0 },
      archer: { atk: 0, hp: 0, speed: 0 },
      assassin: { atk: 0, hp: 0, speed: 0 },
      ghost: { atk: 0, hp: 0, speed: 0 },
      cleric: { atk: 0, hp: 0, speed: 0 },
      mage: { atk: 0, hp: 0, speed: 0 },
      reaper: { atk: 0, hp: 0, speed: 0 },
      knight: { atk: 0, hp: 0, speed: 0 },
      dragonlord: { atk: 0, hp: 0, speed: 0 }
    }
  };
}

function onStorageReady() {
  // 題庫載入完成後初始化遊戲
  
  renderBattleCanvas();
  updHeader();
  renderDataPanel();
  updateStatusPanel();
  updateDungeonBar();
  updateEnemyHud();
  
  // Auto save
  setInterval(saveAll, 15000);
  
  console.log('Game initialized successfully');
}
