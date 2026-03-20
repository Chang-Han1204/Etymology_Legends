// ══════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════
function openInventory() {
  renderInventory();
  document.getElementById('inv-modal').classList.add('open');
}

function closeInv() {
  document.getElementById('inv-modal').classList.remove('open');
}

function renderInventory() {
  // Relics
  const rg = document.getElementById('relic-slots');
  if (rg) {
    const relics = (player.relics || []).map(id => RELICS.find(r => r.id === id)).filter(Boolean);
    if (!relics.length) {
      rg.innerHTML = '<div style="font-size:12px;color:var(--text3);grid-column:1/-1;text-align:center;padding:10px">尚未獲得遺物</div>';
    } else rg.innerHTML = relics.map(r => `<div class="relic-slot active" title="${r.desc}"><div class="r-ico">${r.icon}</div><div class="r-nm">${r.name}</div><div class="r-desc">${r.desc}</div></div>`).join('');
  }
  // Items
  const ig = document.getElementById('inv-grid');
  if (ig) {
    const inv = player.inventory || [];
    const slots = [];
    const equippedIds = Object.values(player.equip).filter(Boolean);
    for (let i = 0; i < 20; i++) {
      const invItem = inv[i];
      if (invItem && ITEMS[invItem.id]) {
        const item = ITEMS[invItem.id];
        const rc = 'rarity-' + (item.rarity || 'common');
        const isEq = equippedIds.includes(invItem.id);
        slots.push(`<div class="inv-slot ${rc}" onclick="useItem(${i})" onmouseenter="showItemTip(event,'${invItem.id}')" onmouseleave="hideItemTip()">
          ${isEq ? '<span class="equipped-badge">裝備中</span>' : ''}
          <span class="ico">${item.icon}</span>
          <span class="nm">${item.name}</span>
          ${invItem.qty > 1 ? `<span class="qty">×${invItem.qty}</span>` : ''}
        </div>`);
      } else {
        slots.push(`<div class="inv-slot empty"><span style="font-size:20px;color:var(--border)">□</span></div>`);
      }
    }
    ig.innerHTML = slots.join('');
  }
  // 更新角色屬性
  const invAtk = document.getElementById('inv-atk');
  const invDef = document.getElementById('inv-def');
  const invMhp = document.getElementById('inv-mhp');
  const invMmp = document.getElementById('inv-mmp');
  
  if (invAtk) invAtk.textContent = getAtk();
  if (invDef) invDef.textContent = getDef();
  if (invMhp) invMhp.textContent = getMaxHp();
  if (invMmp) invMmp.textContent = getMaxMp();
}

function showItemTip(e, itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  const tip = document.getElementById('item-tooltip');
  tip.style.display = 'block';
  const rarityColors = { common: 'var(--text2)', uncommon: var_green, rare: var_blue, epic: var_purple, legendary: 'var(--gold)' };
  const rc = { common: '普通', uncommon: '不普通', rare: '稀有', epic: '史詩', legendary: '傳說' }[item.rarity || 'common'];
  tip.innerHTML = `<div class="item-tip-nm">${item.icon} ${item.name}</div><div class="item-tip-desc">${item.desc}</div><div class="item-tip-type" style="color:${rarityColors[item.rarity || 'common'] || 'var(--text2)'}">${rc} · ${item.type}</div>`;
  tip.style.left = clamp(e.clientX + 12, 0, window.innerWidth - 240) + 'px';
  tip.style.top = clamp(e.clientY - 20, 0, window.innerHeight - 130) + 'px';
}

// fix: use string literals not var refs
const var_green = '#60e080', var_blue = '#80b0f0', var_purple = '#c080f0';

function hideItemTip() {
  document.getElementById('item-tooltip').style.display = 'none';
}

// ══════════════════════════════════════════════
// VOCAB/GRAMMAR LISTS
// ══════════════════════════════════════════════
// DATA MANAGEMENT
// ══════════════════════════════════════════════
function renderDataPanel() {
  const v = document.getElementById('stat-total-kills');
  if (v) v.textContent = (player.stats?.vocabKills || 0) + (player.stats?.grammarKills || 0);
  const g = document.getElementById('stat-total-bosses');
  if (g) g.textContent = player.stats?.bossKills || 0;
  const f = document.getElementById('stat-total-floors');
  if (f) f.textContent = player.totalFloors || 1;
  const gems = document.getElementById('stat-gems');
  if (gems) gems.textContent = player.gems || 0;
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
function exportData(type) {
  let data, title, fname;
  // 修改為僅針對角色資訊與進度
  data = { player, vstats: vStats, gstats: gStats };
  title = '匯出角色資訊';
  fname = 'lexicon2_player_backup.json';
  
  document.getElementById('export-ttl').textContent = title;
  document.getElementById('modal-txt').value = JSON.stringify(data, null, 2);
  modalFile = fname;
  document.getElementById('export-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('export-modal').classList.remove('open');
}

function resetAll() {
  if (!confirm('確定重置角色？所有等級、進度、道具、統計都會清空，不可復原。 (題庫不會受影響)')) return;
  
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
  renderInventory();
  
  toast('✅ 角色已重置', 'var(--gold)');
}

function copyModal() {
  const t = document.getElementById('modal-txt');
  t.select();
  document.execCommand('copy');
  toast('📋 已複製', 'var(--gold)');
}

function downloadModal() {
  const raw = document.getElementById('modal-txt').value;
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = modalFile;
  a.click();
  URL.revokeObjectURL(a.href);
}

function restoreData() {
  const raw = document.getElementById('restore-input').value.trim();
  if (!raw) {
    alert('請貼上備份資料');
    return;
  }
  try {
    const d = JSON.parse(raw);
    if (d.vocab) {
      vWords = d.vocab;
      saveJSONFile('data/vocab.json', vWords);
    }
    if (d.grammar) {
      gQuestions = d.grammar;
      saveJSONFile('data/grammar.json', gQuestions);
    }
    if (d.player) {
      player = d.player;
      ensurePlayerIntegrity();
      saveJSONFile('data/player.json', player);
    }
    if (d.items) {
      ITEMS = d.items;
      saveJSONFile('data/items.json', ITEMS);
    }
    if (d.vstats) {
      vStats = d.vstats;
      saveJSONFile('data/vstats.json', vStats);
    }
    if (d.gstats) {
      gStats = d.gstats;
      saveJSONFile('data/gstats.json', gStats);
    }
    updHeader();
    updateStatusPanel();
    renderInventory();
    renderVStats();
    renderGStats();
    renderDataPanel();
    toast('✅ 已還原', 'var(--green)');
  } catch (e) {
    alert('解析失敗：' + e.message);
  }
}

function clearStat(type) {
  if (type === 'vocab') {
    vStats = { correct: 0, wrong: 0, ws: {} };
    saveJSONFile('data/vstats.json', vStats);
    renderVStats();
  }
  if (type === 'grammar') {
    gStats = { correct: 0, wrong: 0, ws: {} };
    saveJSONFile('data/gstats.json', gStats);
    renderGStats();
  }
}

function clearAll(type) {
  if (!confirm(`確定清除所有${type === 'words' ? '單字' : type === 'grammar' ? '文法題' : type === 'items' ? '道具' : type === 'player' ? '角色資料' : '所有資料'}？`)) return;

  if (type === 'words') {
    vWords = [];
    saveJSONFile('data/vocab.json', vWords);
    updHeader();
    renderVList();
  }
  if (type === 'grammar') {
    gQuestions = [];
    saveJSONFile('data/grammar.json', gQuestions);
    updHeader();
    renderGList();
  }
  if (type === 'items') {
    ITEMS = {};
    saveJSONFile('data/items.json', ITEMS);
    renderDataPanel();
  }
  if (type === 'player') {
    player = { ...DEFAULT_PLAYER };
    ensurePlayerIntegrity();
    saveJSONFile('data/player.json', player);
    updHeader();
    updateStatusPanel();
  }
  if (type === 'all') {
    vWords = [];
    gQuestions = [];
    ITEMS = {};
    player = { ...DEFAULT_PLAYER };
    vStats = { correct: 0, wrong: 0, ws: {} };
    gStats = { correct: 0, wrong: 0, ws: {} };
    saveJSONFile('data/vocab.json', vWords);
    saveJSONFile('data/grammar.json', gQuestions);
    saveJSONFile('data/items.json', ITEMS);
    saveJSONFile('data/player.json', player);
    saveJSONFile('data/vstats.json', vStats);
    saveJSONFile('data/gstats.json', gStats);
    updHeader();
    updateStatusPanel();
    renderInventory();
    renderVStats();
    renderGStats();
    renderDataPanel();
    toast('🧹 已清除所有資料', 'var(--text2)');
  }
}

// ══════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════
function updHeader() {
  // 更新數據統計
  const hVocab = document.getElementById('h-vocab');
  const hGrammar = document.getElementById('h-grammar');
  const hItems = document.getElementById('h-items');
  const hRelics = document.getElementById('h-relics');
  const hFloor = document.getElementById('h-floor');
  const hMaxFloor = document.getElementById('h-maxfloor');
  const hBoss = document.getElementById('h-boss');
  
  if (hVocab) hVocab.textContent = '-';
  if (hGrammar) hGrammar.textContent = gQuestions.length;
  if (hItems) hItems.textContent = Object.keys(ITEMS).length;
  if (hRelics) hRelics.textContent = (player.relics || []).length;
  if (hFloor) hFloor.textContent = '第 ' + player.floor + ' 層';
  if (hMaxFloor) hMaxFloor.textContent = '最深：' + (player.totalFloors || player.floor) + ' 層';
  if (hBoss) hBoss.textContent = player.floor % 10 === 0 ? '⚠BOSS' : '';
  
  // 更新角色狀態
  const hpVal = document.getElementById('hp-val');
  const hpMax = document.getElementById('hp-max');
  const mpVal = document.getElementById('mp-val');
  const mpMax = document.getElementById('mp-max');
  const lvVal = document.getElementById('lv-val');
  const expVal = document.getElementById('exp-val');
  const expNext = document.getElementById('exp-next');
  const floorVal = document.getElementById('floor-val');
  const comboVal = document.getElementById('combo-val');
  const maxComboVal = document.getElementById('max-combo-val');
  
  if (hpVal) hpVal.textContent = player.hp;
  if (hpMax) hpMax.textContent = player.maxHp;
  if (mpVal) mpVal.textContent = player.mp;
  if (mpMax) mpMax.textContent = player.maxMp;
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
  console.log('ITEMS keys:', Object.keys(ITEMS).length);
  console.log('player.lv:', player.lv);
  console.log('player.floor:', player.floor);
  
  // 檢查前3個文法題
  console.log('前3個文法題:');
  gQuestions.slice(0, 3).forEach((q, i) => {
    console.log(`${i+1}. ${q.question} (${q.level})`);
  });
  
  alert(`詞彙: ${vWords.length} 個\n文法: ${gQuestions.length} 道\n道具: ${Object.keys(ITEMS).length} 種\n玩家等級: ${player.lv}\n樓層: ${player.floor}`);
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
  const maxmpEl = document.getElementById('char-maxmp');
  
  if (lvEl) lvEl.textContent = player.lv || 1;
  if (expEl) expEl.textContent = player.exp || 0;
  if (atkEl) atkEl.textContent = getAtk();
  if (defEl) defEl.textContent = getDef();
  if (maxhpEl) maxhpEl.textContent = getMaxHp();
  if (maxmpEl) maxmpEl.textContent = getMaxMp();
  
  // 更新裝備顯示
  const weaponId = player.equip?.weapon;
  const armorId = player.equip?.armor;
  
  const weaponSlot = document.getElementById('char-weapon');
  const armorSlot = document.getElementById('char-armor');
  
  if (weaponSlot) {
    if (weaponId && ITEMS[weaponId]) {
      const item = ITEMS[weaponId];
      weaponSlot.innerHTML = `<span style="font-size:16px">${item.icon}</span> ${item.name}`;
    } else {
      weaponSlot.textContent = '未裝備';
    }
  }
  
  if (armorSlot) {
    if (armorId && ITEMS[armorId]) {
      const item = ITEMS[armorId];
      armorSlot.innerHTML = `<span style="font-size:16px">${item.icon}</span> ${item.name}`;
    } else {
      armorSlot.textContent = '未裝備';
    }
  }
  
  // 更新進度資訊
  const floorEl = document.getElementById('char-floor');
  const maxFloorEl = document.getElementById('char-maxfloor');
  const vocabKillsEl = document.getElementById('char-vocab-kills');
  const grammarKillsEl = document.getElementById('char-grammar-kills');
  const bossKillsEl = document.getElementById('char-boss-kills');
  const relicsEl = document.getElementById('char-relics');
  
  if (floorEl) floorEl.textContent = player.floor || 1;
  if (maxFloorEl) maxFloorEl.textContent = player.totalFloors || player.floor || 1;
  if (vocabKillsEl) vocabKillsEl.textContent = player.stats?.vocabKills || 0;
  if (grammarKillsEl) grammarKillsEl.textContent = player.stats?.grammarKills || 0;
  if (bossKillsEl) bossKillsEl.textContent = player.stats?.bossKills || 0;
  if (relicsEl) relicsEl.textContent = (player.relics || []).length;
}

// ══════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════
function mainTab(id) {
  ['dungeon', 'character', 'data', 'upgrade'].forEach(k => {
    const el = document.getElementById('mod-' + k);
    if (el) el.classList.toggle('active', k === id);
  });
  document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.main-tab[onclick*="'${id}'"]`);
  if (btn) btn.classList.add('active');
  
  // 更新角色資訊
  if (id === 'character') {
    updateCharacterInfo();
  }

  if (id === 'upgrade') {
    renderUpgradeMenu();
  }
  
  // 更新資料子頁面
  if (id === 'data') {
    renderDataPanel();
  }
}

function renderUpgradeMenu() {
  const gemsDisp = document.getElementById('upgrade-gems');
  if (gemsDisp) gemsDisp.textContent = player.gems || 0;

  const list = document.getElementById('upgrade-list');
  if (!list) return;

  // 動態獲取 UNIT_TYPES 進行渲染
  const units = Object.keys(UNIT_TYPES);
  const icons = { 
    warrior: "🗡️", skeleton: "💀", paladin: "🛡️", hero: "✨",
    archer: "🏹", assassin: "🔪", ghost: "👻", cleric: "⚕️",
    mage: "🧙", reaper: "☠️", knight: "🐎", dragonlord: "🐉"
  };

  list.innerHTML = units.map(id => {
    const up = player.upgrades[id] || { atk: 0, hp: 0, elem: 0 };
    const spec = UNIT_TYPES[id];
    const icon = icons[id] || "🛡️";
    
    // 計算各項費用與當前數值 (強化增益: ATK+5, HP+20, ELEM+5%)
    const curAtk = spec.atk + (up.atk * 5);
    const curHp = spec.hp + (up.hp * 20);
    const curElem = 1.0 + (up.elem * 0.05);
    
    const costAtk = (up.atk + 1) * 20;
    const costHp = (up.hp + 1) * 20;
    const costElem = (up.elem + 1) * 30;
    
    // 取得屬性資訊
    const elKey = spec.element.toUpperCase();
    const elInfo = ELEMENTS[elKey] || { icon: '❓', color: '#fff' };

    return `
      <div class="upgrade-item" style="border-left: 4px solid ${elInfo.color}">
        <div class="upgrade-info">
          <span class="upgrade-name">${icon} ${spec.name} <small style="color:${elInfo.color}">${elInfo.icon}${elInfo.name}</small></span>
          <span style="font-size:10px; color:var(--text3)">總等級: ${up.atk + up.hp + up.elem}</span>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc">
            攻擊力: <strong style="color:var(--gold2)">${curAtk}</strong> <small>(LV.${up.atk})</small>
          </div>
          <button class="btn btn-sm btn-gold" onclick="buyUpgrade('${id}', 'atk', ${costAtk})">強化 (${costAtk}💎)</button>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc">
            生命值: <strong style="color:var(--green2)">${curHp}</strong> <small>(LV.${up.hp})</small>
          </div>
          <button class="btn btn-sm btn-gold" onclick="buyUpgrade('${id}', 'hp', ${costHp})">強化 (${costHp}💎)</button>
        </div>
        
        <div class="upgrade-row">
          <div class="upgrade-desc" title="提高剋制屬性時的傷害倍率">
            屬性強度: <strong style="color:var(--cyan2)">x${curElem.toFixed(2)}</strong> <small>(LV.${up.elem})</small>
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
