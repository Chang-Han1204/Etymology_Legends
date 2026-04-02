// ══════════════════════════════════════════════
// GRAMMAR LISTS
// ══════════════════════════════════════════════
// DATA MANAGEMENT
// ══════════════════════════════════════════════
function renderDataPanel() {
  // 基礎統計
  const g = document.getElementById('stat-total-bosses');
  if (g) g.textContent = player.stats?.bossKills || 0;
  const gems = document.getElementById('stat-gems');
  if (gems) gems.textContent = player.gems || 0;

  // 更新領主進度與戰鬥數據
  const dLv = document.getElementById('detail-lv');
  const dExp = document.getElementById('detail-exp');
  const dReward = document.getElementById('detail-reward');
  const dPenalty = document.getElementById('detail-penalty');
  
  if (dLv) dLv.textContent = player.lv || 1;
  
  const expBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("expGain") : 0;
  if (dExp) {
    if (expBonus > 0) {
      dExp.innerHTML = `${player.exp || 0} / ${player.expNext || 100} <small class="bonus-text">(加成: +${(expBonus * 100).toFixed(0)}%)</small>`;
    } else {
      dExp.textContent = `${player.exp || 0} / ${player.expNext || 100}`;
    }
  }

  // 整合遺器加成到賞金顯示
  const baseReward = 50 + (player.lv || 1) * 5;
  const artifactRewardBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("quizGold") : 0;
  const finalReward = baseReward + artifactRewardBonus;
  
  if (dReward) {
    if (artifactRewardBonus > 0) {
      dReward.innerHTML = `💰 ${finalReward.toFixed(0)} <small class="bonus-text">(+${artifactRewardBonus.toFixed(0)})</small>`;
    } else {
      dReward.textContent = `💰 ${finalReward.toFixed(0)}`;
    }
  }
  
  if (dPenalty) dPenalty.textContent = `💔 ${10}`;

  // 更新主堡血量顯示 (如果有的話)
  const dHp = document.getElementById('detail-hp');
  if (dHp) {
    const baseHp = (typeof CLASSES !== 'undefined' ? CLASSES.player.baseHp : 200);
    const artifactHpBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("mainCastleHp") : 0;
    const finalHp = baseHp + artifactHpBonus;
    dHp.innerHTML = `❤️ ${finalHp.toFixed(0)} <small class="bonus-text">(+${artifactHpBonus.toFixed(0)})</small>`;
  }

  // 詳細統計
  const container = document.getElementById('new-stats-container');
  if (!container) return;

  const s = player.stats || {};
  const totalAnswers = (s.totalCorrect || 0) + (s.totalWrong || 0);
  const winRate = totalAnswers > 0 ? ((s.totalCorrect / totalAnswers) * 100).toFixed(1) : 0;

  // 題型翻譯
  const typeMap = {
    'logic_grammar': '🛡️ 結構邏輯',
    'fill': '📧 文本補全測驗',
    'job_define': '💼 職場定義',
    'response_choice': '🤝 戰略回覆'
  };

  const typeHtml = Object.keys(s.typeStats || {}).map(type => {
    const ts = s.typeStats[type];
    const tTotal = ts.c + ts.w;
    const tRate = tTotal > 0 ? ((ts.c / tTotal) * 100).toFixed(0) : 0;
    return `<div class="stat-mini-box">
      <div class="stat-mini-lbl">${typeMap[type] || type}</div>
      <div class="stat-mini-val">${ts.c}/${tTotal} <small>(${tRate}%)</small></div>
    </div>`;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:14px">尚無學習數據</div>';

  const elemHtml = Object.keys(s.elementStats || {}).map(el => {
    const icons = { Water: '💧', Fire: '🔥', Earth: '🌿' };
    const colors = { Water: 'var(--blue2)', Fire: 'var(--red2)', Earth: 'var(--green2)' };
    return `<div class="stat-mini-box" style="border-left-color:${colors[el]}">
      <div class="stat-mini-lbl">${icons[el]} ${el}</div>
      <div class="stat-mini-val">${s.elementStats[el]} <small>次</small></div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="stats-group">
      <div class="stats-group-title">⚔️ 戰鬥紀錄</div>
      <div class="stats-grid-mini">
        <div class="stat-mini-box"><div class="stat-mini-lbl">完成波次</div><div class="stat-mini-val">${s.totalWaves || 0}</div></div>
        <div class="stat-mini-box"><div class="stat-mini-lbl">正確率</div><div class="stat-mini-val">${winRate}%</div></div>
        <div class="stat-mini-box"><div class="stat-mini-lbl">最高連擊</div><div class="stat-mini-val">${s.maxCombo || 0}</div></div>
        <div class="stat-mini-box"><div class="stat-mini-lbl">累積寶石</div><div class="stat-mini-val">${s.totalGemsEarned || 0}</div></div>
      </div>
    </div>
    
    <div class="stats-group">
      <div class="stats-group-title">📚 學習分佈 (答對/總數)</div>
      <div class="stats-grid-mini">${typeHtml}</div>
    </div>

    <div class="stats-group">
      <div class="stats-group-title">🛡️ 軍事動員 (召喚次數)</div>
      <div class="stats-grid-mini">${elemHtml}</div>
    </div>
  `;
}

function renderVList() {
  // Vocab 功能已併入 Grammar
}

function renderGList() {
  const el = document.getElementById('grammar-list');
  if (el) {
    el.innerHTML = gQuestions.map(q => `<div>${q.question} - ${q.options[q.answer]}</div>`).join('');
  }
}

let modalFile = '';

function closeModal() {
  const el = document.getElementById('export-modal');
  if (el) el.classList.remove('open');
}

function resetAll() {
  if (!confirm('確定重置角色？所有等級、進度、統計都會清空，不可復原。 (題庫不會受影響)')) return;
  
  // 僅重置統計與角色
  vStats = { correct: 0, wrong: 0, ws: {} };
  gStats = { correct: 0, wrong: 0, ws: {} };
  player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  ensurePlayerIntegrity();
  
  currentEnemy = null;
  if (typeof Dungeon !== 'undefined') Dungeon.isBoss = false;
  
  saveAll();
  updHeader();
  renderDataPanel();
  updateStatusPanel();
  updateCharacterInfo();
  updateEnemyHud();
  updateDungeonBar();
  
  toast('✅ 角色已重置', 'var(--gold)');
}

function copyModal() {
  const t = document.getElementById('modal-txt');
  if (t) {
    t.select();
    document.execCommand('copy');
    toast('📋 已複製', 'var(--gold)');
  }
}

// ══════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════
function updHeader() {
  // 更新數據統計
  const hVocab = document.getElementById('h-vocab');
  const hGrammar = document.getElementById('h-grammar');
  const hFloor = document.getElementById('h-floor');
  const hMaxFloor = document.getElementById('h-maxfloor');
  const hBoss = document.getElementById('h-boss');
  
  if (hVocab) hVocab.textContent = '-';
  if (hGrammar) hGrammar.textContent = gQuestions.length;
  if (hFloor) hFloor.textContent = '第 ' + player.floor + ' 層';
  if (hBoss) hBoss.textContent = player.floor % 10 === 0 ? '⚠BOSS' : '';
  
  // 更新角色狀態
  const hpVal = document.getElementById('hp-val');
  const hpMax = document.getElementById('hp-max');
  const lvVal = document.getElementById('lv-val');
  const expVal = document.getElementById('exp-val');
  const expNext = document.getElementById('exp-next');
  const floorVal = document.getElementById('floor-val');
  const comboVal = document.getElementById('combo-val');
  const maxComboVal = document.getElementById('max-combo-val');
  
  if (hpVal) hpVal.textContent = player.hp;
  if (hpMax) hpMax.textContent = player.maxHp;
  if (lvVal) lvVal.textContent = player.lv;
  if (expVal) expVal.textContent = player.exp;
  if (expNext) expNext.textContent = player.expNext;
  if (floorVal) floorVal.textContent = player.floor;
  if (comboVal) comboVal.textContent = player.combo;
  if (maxComboVal) maxComboVal.textContent = player.maxCombo;
}

// 添加調試功能
function checkData() {
  console.log('=== 數據檢查 ===');
  console.log('gQuestions.length:', gQuestions.length);
  console.log('player.lv:', player.lv);
  console.log('player.floor:', player.floor);
  
  // 檢查前3個文法題
  console.log('前3個文法題:');
  gQuestions.slice(0, 3).forEach((q, i) => {
    console.log(`${i+1}. ${q.question} (${q.level})`);
  });
  
  alert(`詞彙: ${vWords.length} 個\n文法: ${gQuestions.length} 道\n玩家等級: ${player.lv}\n樓層: ${player.floor}`);
}

// ══════════════════════════════════════════════
// CHARACTER INFO
// ══════════════════════════════════════════════
function updateCharacterInfo() {
  // 更新角色基本資料
  const lvEl = document.getElementById('char-lv');
  const expEl = document.getElementById('char-exp');
  const atkEl = document.getElementById('char-atk');
  const defEl = document.getElementById('char-def');
  const maxhpEl = document.getElementById('char-maxhp');
  
  if (lvEl) lvEl.textContent = player.lv || 1;
  if (expEl) expEl.textContent = player.exp || 0;
  if (atkEl) atkEl.textContent = typeof getAtk === 'function' ? getAtk() : 0;
  if (defEl) defEl.textContent = typeof getDef === 'function' ? getDef() : 0;
  if (maxhpEl) maxhpEl.textContent = typeof getMaxHp === 'function' ? getMaxHp() : 200;
  
  // 更新進度資訊
  const floorEl = document.getElementById('char-floor');
  const maxFloorEl = document.getElementById('char-maxfloor');
  const vocabKillsEl = document.getElementById('char-vocab-kills');
  const grammarKillsEl = document.getElementById('char-grammar-kills');
  const bossKillsEl = document.getElementById('char-boss-kills');
  
  if (floorEl) floorEl.textContent = player.floor || 1;
  if (bossKillsEl) bossKillsEl.textContent = player.stats?.bossKills || 0;
}

// ══════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════
function mainTab(id) {
  ['dungeon', 'character', 'data', 'upgrade', 'artifacts'].forEach(k => {
    const el = document.getElementById('mod-' + k);
    if (el) el.classList.toggle('active', k === id);
  });
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  
  // 嘗試透過 ID 尋找按鈕，如果沒有 ID 則透過屬性尋找 (維持向後相容)
  const btn = document.getElementById(`tab-btn-${id}`) || document.querySelector(`.main-tab[onclick*="'${id}'"]`);
  if (btn) btn.classList.add('active');
  
  // 更新角色資訊
  if (id === 'character') {
    updateCharacterInfo();
  }

  if (id === 'upgrade') {
    renderUpgradeMenu();
  }

  if (id === 'artifacts') {
    if (typeof renderArtifactList === 'function') renderArtifactList();
    const mp = document.getElementById('char-miracle-points');
    if (mp) mp.textContent = player.miraclePoints || 0;
  }
  
  // 更新資料子頁面
  if (id === 'data') {
    renderDataPanel();
  }
}

function toggleBattleTabs(inBattle) {
  const normalTabs = ['dungeon', 'upgrade', 'artifacts', 'data'];
  const battleTabs = ['quiz', 'summon'];

  normalTabs.forEach(id => {
    const el = document.getElementById(`tab-btn-${id}`);
    if (el) el.style.display = inBattle ? 'none' : 'inline-block';
  });

  battleTabs.forEach(id => {
    const el = document.getElementById(`tab-btn-${id}`);
    if (el) el.style.display = inBattle ? 'inline-block' : 'none';
  });

  if (inBattle) {
    switchBattleSubTab('quiz');
  } else {
    mainTab('dungeon');
  }
}

function switchBattleSubTab(id) {
  const quizTab = document.getElementById('battle-sub-quiz');
  const summonTab = document.getElementById('battle-sub-summon');
  
  if (quizTab) quizTab.style.display = (id === 'quiz') ? 'block' : 'none';
  if (summonTab) summonTab.style.display = (id === 'summon') ? 'block' : 'none';

  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tab-btn-${id}`);
  if (btn) btn.classList.add('active');
}

let currentUpgradeElement = 'EARTH';
function renderUpgradeMenu(filterEl) {
  if (filterEl) currentUpgradeElement = filterEl;
  
  const gemsDisp = document.getElementById('upgrade-gems');
  if (gemsDisp) gemsDisp.textContent = player.gems || 0;

  // 更新分頁按鈕狀態
  document.querySelectorAll('#mod-upgrade .lvl-btn').forEach(btn => {
    btn.classList.toggle('on', btn.id === `tab-up-${currentUpgradeElement.toLowerCase()}`);
  });

  const list = document.getElementById('upgrade-list');
  if (!list) return;

  const icons = { 
    warrior: "🗡️", rock_thrower: "🪨", paladin: "🛡️", hero: "✨",
    archer: "🏹", assassin: "🔪", ghost: "👻", cleric: "⚕️",
    mage: "🧙", reaper: "💀", knight: "🐎", dragonlord: "🐉"
  };

  if (typeof UNIT_TYPES === 'undefined') return;

  // 根據屬性過濾士兵
  const units = Object.keys(UNIT_TYPES).filter(id => UNIT_TYPES[id].element.toUpperCase() === currentUpgradeElement);

  list.innerHTML = units.map(id => {
    const up = player.upgrades[id] || { atk: 0, hp: 0, elem: 0 };
    const spec = UNIT_TYPES[id];
    const icon = icons[id] || "🛡️";
    
    const curAtk = spec.atk + (up.atk * 5);
    const curHp = spec.hp + (up.hp * 20);
    const curElem = 1.0 + (up.elem * 0.15);
    
    const costAtk = (up.atk + 1) * 20;
    const costHp = (up.hp + 1) * 20;
    const costElem = (up.elem + 1) * 30;
    
    const elKey = spec.element.toUpperCase();
    const elInfo = (typeof ELEMENTS !== 'undefined' && ELEMENTS[elKey]) || { icon: '❓', color: '#fff' };

    return `
      <div class="upgrade-item" style="border-left: 4px solid ${elInfo.color}">
        <div class="upgrade-info">
          <span class="upgrade-name">${icon} ${spec.name} <small style="color:${elInfo.color}">${elInfo.icon}${elInfo.name || elKey}</small></span>
          <span class="total-lv">總等級: ${up.atk + up.hp + up.elem}</span>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc">
            攻擊力: <strong class="val-atk">${curAtk}</strong> <small>(LV.${up.atk})</small>
          </div>
          <button class="btn btn-sm btn-gold" onclick="buyUpgrade('${id}', 'atk', ${costAtk})">強化 (${costAtk}💎)</button>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc">
            生命值: <strong class="val-hp">${curHp}</strong> <small>(LV.${up.hp})</small>
          </div>
          <button class="btn btn-sm btn-gold" onclick="buyUpgrade('${id}', 'hp', ${costHp})">強化 (${costHp}💎)</button>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc" title="提高剋制屬性時的傷害倍率">
            屬性強度: <strong class="val-elem">x${curElem.toFixed(2)}</strong> <small>(LV.${up.elem})</small>
          </div>
          <button class="btn btn-sm btn-gold" onclick="buyUpgrade('${id}', 'elem', ${costElem})">強化 (${costElem}💎)</button>
        </div>
      </div>
    `;
  }).join('');
}

function buyUpgrade(unitId, stat, cost) {
  if ((player.gems || 0) < cost) {
    toast('💎 寶石不足！', 'var(--red)');
    return;
  }
  
  player.gems -= cost;
  if (!player.upgrades[unitId]) player.upgrades[unitId] = { atk: 0, hp: 0, elem: 0 };
  
  // 為了向後相容或處理可能的 undefined
  if (player.upgrades[unitId][stat] === undefined) player.upgrades[unitId][stat] = 0;
  
  player.upgrades[unitId][stat]++;
  
  saveAll();
  renderUpgradeMenu();
  toast('✨ 強化成功！', 'var(--cyan2)');
}

function subTab(mod, s) {
  const pre = mod === 'vocab' ? 'vs' : mod === 'grammar' ? 'gs' : 'data';
  const secs = ['overview', 'import', 'manage'];
  document.querySelectorAll(`#mod-${mod} .sub-tab`).forEach((el, i) => el.classList.toggle('active', secs[i] === s));
  secs.forEach(sec => {
    const el = document.getElementById(`${pre}-${sec}`);
    if (el) el.classList.toggle('active', sec === s);
  });
  
  if (s === 'overview') {
    renderDataPanel();
  }
}
