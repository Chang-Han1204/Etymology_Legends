// ══════════════════════════════════════════════
// PLAYER STATS
// ══════════════════════════════════════════════
function getAtk() {
  let a = player.baseAtk || 10;
  if (player.equip && player.equip.weapon && ITEMS[player.equip.weapon]) {
    const w = ITEMS[player.equip.weapon];
    if (w.effect && w.effect.atk) a += w.effect.atk;
  }
  if (hasRelic('relic_crown') && player.hp < getMaxHp() * 0.3) a = Math.round(a * 1.5);
  return Math.max(1, a);
}

function getDef() {
  let d = player.baseDef || 5;
  if (player.equip && player.equip.armor && ITEMS[player.equip.armor]) {
    const ar = ITEMS[player.equip.armor];
    if (ar.effect && ar.effect.def) d += ar.effect.def;
  }
  return Math.max(1, d);
}

function getMaxHp() {
  let h = 100 + ((player.lv || 1) - 1) * 15;
  if (player.equip && player.equip.armor && ITEMS[player.equip.armor]) {
    const ar = ITEMS[player.equip.armor];
    if (ar.effect && ar.effect.maxHp) h += ar.effect.maxHp;
  }
  if (player._bonusMaxHp) h += player._bonusMaxHp;
  return Math.max(1, h);
}

function getMaxMp() {
  let m = 50 + ((player.lv || 1) - 1) * 3;
  if (player.equip && player.equip.armor && ITEMS[player.equip.armor]) {
    const ar = ITEMS[player.equip.armor];
    if (ar.effect && ar.effect.maxMp) m += ar.effect.maxMp;
  }
  if (player._bonusMaxMp) m += player._bonusMaxMp;
  return Math.max(1, m);
}

function getCrit() {
  let c = player.critRate || 0.05;
  if (player.equip && player.equip.weapon && ITEMS[player.equip.weapon]) {
    const w = ITEMS[player.equip.weapon];
    if (w.effect && w.effect.crit) c += w.effect.crit;
  }
  if (hasRelic('relic_star')) c += 0.15;
  return Math.min(c, 0.5);
}

function hasRelic(id) {
  return player.relics && player.relics.includes(id);
}

function getPlayerClass() {
  let c = CLASSES[0];
  for (const ci of CLASSES) {
    if (player.lv >= ci.lv) c = ci;
  }
  return c;
}

// ══════════════════════════════════════════════
// DAMAGE CALC
// ══════════════════════════════════════════════
function calculateDamage(isGrammar = false, isBoss = false) {
  const atk = getAtk();
  const eDef = currentEnemy ? currentEnemy.def : 0;
  let dmg = Math.max(1, atk - Math.floor(eDef * 0.5));
  if (isGrammar) {
    if (player.equip && player.equip.weapon && ITEMS[player.equip.weapon]) {
      const w = ITEMS[player.equip.weapon];
      if (w.effect && w.effect.grammarBonus) dmg = Math.round(dmg * (1 + w.effect.grammarBonus));
    }
    dmg += Math.floor((gStats.correct || 0) / 10) * 2;
    // MP attack bonus (spell_tome)
    if (player.equip && player.equip.weapon && ITEMS[player.equip.weapon]) {
      const wpn = ITEMS[player.equip.weapon];
      if (wpn.effect && wpn.effect.mpAtk && player.mp >= wpn.effect.mpAtk) {
        dmg += Math.round(dmg * 0.5);
        player.mp = Math.max(0, player.mp - wpn.effect.mpAtk);
      }
    }
  }
  dmg += Math.floor((vStats.correct || 0) / 10);
  if (player.combo >= 5) dmg = Math.round(dmg * 1.3);
  let isCrit = false;
  if (Math.random() < getCrit()) {
    dmg = Math.round(dmg * 1.8);
    isCrit = true;
  }
  if (isBoss && hasRelic('relic_dragon')) dmg = Math.round(dmg * 1.3);
  return { dmg: Math.max(1, dmg), isCrit };
}

function calcEnemyDmg() {
  if (!currentEnemy) return 0;
  let d = Math.max(1, currentEnemy.atk - Math.floor(getDef() * 0.6));
  if (player.equip && player.equip.armor && ITEMS[player.equip.armor]) {
    const ar = ITEMS[player.equip.armor];
    if (ar.effect && ar.effect.dmgReduce) d = Math.round(d * (1 - ar.effect.dmgReduce));
  }
  return Math.max(1, d);
}

// ══════════════════════════════════════════════
// HP / MP / EXP
// ══════════════════════════════════════════════
function healPlayer(amt) {
  player.hp = clamp((player.hp || 0) + amt, 0, getMaxHp());
  updateStatusPanel();
  spawnFloat('+' + amt + ' HP', cvW * 0.2, cvH * 0.5, '#60e080');
}

function healMp(amt) {
  player.mp = clamp((player.mp || 0) + amt, 0, getMaxMp());
  updateStatusPanel();
}

function damagePlayer(raw) {
  // 優先檢查魔力護盾
  if (activeMagic.shield) {
    activeMagic.shield = false;
    toast('🛡️ 護盾抵消了傷害！');
    dLog('🛡️ 【語法護盾】破碎！抵消了怪物的攻擊。', 'log-blue');
    return;
  }

  if (player.protectedByPhoenix) {
    player.protectedByPhoenix = false;
    dLog('🪶 鳳凰羽毛發動！免疫一次傷害', 'log-gold');
    return;
  }
  if (hasRelic('relic_thorns') && currentEnemy) {
    const ref = Math.round(raw * 0.3);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - ref);
    updateEnemyHud();
    dLog(`🌵 荊棘反射 ${ref} 傷害！`, 'log-gold');
    // 反射傷害也顯示一下
    spawnFloat('-' + ref, cvW * 0.75, cvH * 0.4, 'var(--orange)');
  }
  player.hp = clamp((player.hp || 0) - raw, 0, getMaxHp());
  updateStatusPanel();
  triggerHitEffect('player');
  sfxHit();
  // 玩家扣血文字：顯示在左側玩家上方
  spawnFloat('-' + raw, cvW * 0.2, cvH * 0.4, '#ff4040');
  if (player.hp <= 0) triggerDeath();
}

function gainExp(amt, x, y) {
  let total = amt;
  if (hasRelic('relic_wisdom')) total += 5;
  player.exp = (player.exp || 0) + total;
  spawnFloat('+' + total + ' EXP', x || cvW / 2, y || cvH * 0.5, 'var(--gold)');
  document.getElementById('exp-disp').textContent = player.exp;
  while (player.exp >= (player.expNext || 100)) {
    player.exp -= player.expNext;
    player.lv++;
    player.expNext = Math.round(100 * Math.pow(1.15, player.lv - 1));
    player.baseAtk += 2;
    player.baseDef += 1;
    const mhp = getMaxHp();
    player.maxHp = mhp;
    if (hasRelic('relic_scroll')) player.hp = mhp;
    else player.hp = Math.min((player.hp || 0) + 30, mhp);
    player.maxMp = getMaxMp();
    dLog(`⭐ LEVEL UP! Lv.${player.lv} — ${getPlayerClass().name}`, 'log-gold');
    sfxLevelUp();
    setTimeout(() => showLU(player.lv), 400);
  }
  updateStatusPanel();
  saveAll();
}

function triggerDeath() {
  // Check revive item
  const ri = player.inventory.findIndex(i => i.id === 'revive');
  if (ri >= 0) {
    // 檢查復活水晶是否有數量
    if (player.inventory[ri].qty > 0) {
      player.inventory[ri].qty--;
      if (player.inventory[ri].qty <= 0) player.inventory.splice(ri, 1);
      player.hp = Math.round(getMaxHp() * 0.5);
      dLog('🔮 復活水晶自動發動！', 'log-gold');
      toast('🔮 復活水晶發動！');
      updateStatusPanel();
      saveAll();
      return;
    }
  }
  sfxDead();
  document.getElementById('dead-floor').textContent = `到達第 ${player.floor} 層 — 最深：${player.totalFloors} 層`;
  document.getElementById('dead-ov').classList.add('show');
  dqAnswered = true;
}

function revive() {
  player.hp = Math.round(getMaxHp() * 0.5);
  document.getElementById('dead-ov').classList.remove('show');
  updateStatusPanel();
}

function newGame() {
  // 不再重置整個 player 對象，而是只重置血量和進度
  player.hp = getMaxHp();
  player.mp = getMaxMp();
  
  // 死亡懲罰：回到當前 10 層的開頭（例如 15 層死掉回到 11 層）
  const currentFloor = player.floor || 1;
  player.floor = Math.max(1, Math.floor((currentFloor - 1) / 10) * 10 + 1);
  
  player.combo = 0;
  player.wrongStreak = 0;
  
  saveAll();
  
  document.getElementById('dead-ov').classList.remove('show');
  currentEnemy = null;
  Dungeon.isBoss = false;
  
  updateStatusPanel();
  updateEnemyHud();
  updateDungeonBar();
  renderInventory();
  dqshow('dq-start');
  toast('⚔️ 重整旗鼓，再次出發！');
}

// 新增一個「徹底重置」的功能供玩家在資料面板使用
function hardReset() {
  if (!confirm('這將清除所有等級、裝備與進度，確定嗎？')) return;
  player = defPlayer();
  saveAll();
  location.reload();
}

// 兼容性函數（為了不破壞現有代碼）
function saveAll() {
  // 由於是檔案系統，這裡只是為了相容性保留
  // 實際的儲存發生在匯入匯出時
  // 為了避免每次更新都下載檔案，這裡只做 localStorage 保存
  if (typeof saveLS === 'function') {
    saveLS('vdp_rpg', player);
  }
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
  const mhp = getMaxHp(), mmp = getMaxMp();
  player.maxHp = mhp;
  player.maxMp = mmp;
  const hpPct = clamp((player.hp || 0) / mhp * 100, 0, 100);
  const mpPct = clamp((player.mp || 0) / mmp * 100, 0, 100);
  const hpBar = document.getElementById('php-bar');
  hpBar.style.width = hpPct + '%';
  if (hpPct < 30) hpBar.classList.add('low');
  else hpBar.classList.remove('low');
  document.getElementById('php-val').textContent = (player.hp || 0) + '/' + mhp;
  document.getElementById('pmp-bar').style.width = mpPct + '%';
  document.getElementById('pmp-val').textContent = (player.mp || 0) + '/' + mmp;
  const cls = getPlayerClass();
  document.getElementById('phud-name').textContent = '冒險者';
  document.getElementById('phud-class').textContent = cls.name;
  document.getElementById('plv').textContent = player.lv || 1;
  document.getElementById('patk').textContent = getAtk();
  document.getElementById('pdef').textContent = getDef();
  const combo = player.combo || 0;
  const pc = document.getElementById('pcombo');
  if (combo >= 3) pc.textContent = '🔥' + combo + '連';
  else pc.textContent = '';
  document.getElementById('exp-disp').textContent = player.exp || 0;
  const cd = document.getElementById('combo-disp');
  if (combo >= 3) cd.innerHTML = `<span style="color:var(--gold);font-weight:700">🔥${combo}連勝</span>`;
  else cd.innerHTML = '';
  // MP skill button
  const mpBtn = document.getElementById('mp-skill-btn');
  if (mpBtn) mpBtn.style.display = (player.mp || 0) >= 20 ? 'inline-flex' : 'none';
  
  // 更新角色資訊面板
  updateCharInfo();
}

function updateCharInfo() {
  // 更新角色資訊面板的數據
  const lv = player.lv || 1;
  const exp = player.exp || 0;
  const atk = getAtk();
  const def = getDef();
  const maxhp = getMaxHp();
  const maxmp = getMaxMp();
  
  // 更新基本屬性
  const charLv = document.getElementById('char-lv');
  if (charLv) charLv.textContent = lv;
  
  const charExp = document.getElementById('char-exp');
  if (charExp) charExp.textContent = exp;
  
  const charAtk = document.getElementById('char-atk');
  if (charAtk) charAtk.textContent = atk;
  
  const charDef = document.getElementById('char-def');
  if (charDef) charDef.textContent = def;
  
  const charMaxHp = document.getElementById('char-maxhp');
  if (charMaxHp) charMaxHp.textContent = maxhp;
  
  const charMaxMp = document.getElementById('char-maxmp');
  if (charMaxMp) charMaxMp.textContent = maxmp;
  
  // 更新進度數據
  const charFloor = document.getElementById('char-floor');
  if (charFloor) charFloor.textContent = player.floor || 1;
  
  // 注意：HTML 中沒有 char-maxfloor 元素，所以跳過這一行
  // document.getElementById('char-maxfloor').textContent = player.totalFloors || player.floor || 1;
  
  const charVocabKills = document.getElementById('char-vocab-kills');
  if (charVocabKills) charVocabKills.textContent = player.stats?.vocabKills || 0;
  
  const charGrammarKills = document.getElementById('char-grammar-kills');
  if (charGrammarKills) charGrammarKills.textContent = player.stats?.grammarKills || 0;
  
  const charBossKills = document.getElementById('char-boss-kills');
  if (charBossKills) charBossKills.textContent = player.stats?.bossKills || 0;
  
  const charRelics = document.getElementById('char-relics');
  if (charRelics) charRelics.textContent = (player.relics || []).length;
  
  // 更新裝備顯示
  updateCharEquip();
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

function updateCharEquip() {
  // 更新角色資訊面板中的裝備顯示
  const weaponSlot = document.getElementById('char-weapon');
  const armorSlot = document.getElementById('char-armor');
  
  if (weaponSlot) {
    const weaponId = player.equip.weapon;
    if (weaponId && ITEMS[weaponId] !== undefined) {
      const item = ITEMS[weaponId];
      weaponSlot.innerHTML = `<span style="font-size:18px">${item.icon}</span> ${item.name}`;
      weaponSlot.style.color = 'var(--gold)';
    } else {
      weaponSlot.textContent = '未裝備';
      weaponSlot.style.color = 'var(--text2)';
    }
  }
  
  if (armorSlot) {
    const armorId = player.equip.armor;
    if (armorId && ITEMS[armorId] !== undefined) {
      const item = ITEMS[armorId];
      armorSlot.innerHTML = `<span style="font-size:18px">${item.icon}</span> ${item.name}`;
      armorSlot.style.color = 'var(--gold)';
    } else {
      armorSlot.textContent = '未裝備';
      armorSlot.style.color = 'var(--text2)';
    }
  }
}

function updateEquippedDisplay() {
  // 顯示已裝備的武器
  const weaponSlot = document.getElementById('equipped-weapon');
  if (weaponSlot) {
    const weaponId = player.equip.weapon;
    if (weaponId && ITEMS[weaponId]) {
      const item = ITEMS[weaponId];
      weaponSlot.innerHTML = `<span class="eq-icon">${item.icon}</span><span class="eq-name">${item.name}</span>`;
      weaponSlot.style.display = 'flex';
    } else {
      weaponSlot.style.display = 'none';
    }
  }
  
  // 顯示已裝備的護甲
  const armorSlot = document.getElementById('equipped-armor');
  if (armorSlot) {
    const armorId = player.equip.armor;
    if (armorId && ITEMS[armorId]) {
      const item = ITEMS[armorId];
      armorSlot.innerHTML = `<span class="eq-icon">${item.icon}</span><span class="eq-name">${item.name}</span>`;
      armorSlot.style.display = 'flex';
    } else {
      armorSlot.style.display = 'none';
    }
  }
}

function updateEnemyHud() {
  if (!currentEnemy) {
    document.getElementById('ehud-name').textContent = '??';
    document.getElementById('ehud-class').textContent = '—';
    document.getElementById('ehp-bar').style.width = '100%';
    document.getElementById('ehp-val').textContent = '—';
    document.getElementById('eatk').textContent = '—';
    document.getElementById('edef').textContent = '—';
    return;
  }
  const pct = clamp(currentEnemy.hp / currentEnemy.maxHp * 100, 0, 100);
  const bar = document.getElementById('ehp-bar');
  bar.style.width = pct + '%';
  if (pct < 30) bar.classList.add('low');
  else bar.classList.remove('low');
  document.getElementById('ehud-name').textContent = currentEnemy.name;
  document.getElementById('ehud-class').textContent = currentEnemy.class || '';
  document.getElementById('ehp-val').textContent = currentEnemy.hp + '/' + currentEnemy.maxHp;
  document.getElementById('eatk').textContent = currentEnemy.atk;
  document.getElementById('edef').textContent = currentEnemy.def;
}

function updateDungeonBar() {
  const fl = player.floor || 1;
  document.getElementById('floor-chip').textContent = 'B' + fl + 'F';
  document.getElementById('floor-disp').textContent = '第 ' + fl + ' 層';
  document.getElementById('floor-trk').style.width = ((fl % 10) / 10 * 100) + '%';
  const bw = document.getElementById('boss-warn-txt');
  bw.style.display = fl % 10 === 0 ? 'inline' : 'none';
}