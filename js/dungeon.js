// ══════════════════════════════════════════════
// DUNGEON SYSTEM (REWRITTEN FOR BATTLE WAVE MODE)
// ══════════════════════════════════════════════
const Dungeon = {
  active: false,
  wave: 1,
  gold: 0,
  castleHp: 200,
  maxCastleHp: 200,
  soldiers: [],
  enemies: [],
  correctCount: 0,
  isWaveActive: false,
  waveSpawnTimer: 0,
  enemiesToSpawn: 0,
  waveTimer: 0, // 波次倒數計時（秒）
  isBossWave: false, // 新增 Boss 波次狀態
  wrongQueue: [], // 答錯的題目佇列 { question, waitCount }
  currentQ: null // 當前正在回答的題目
};

// Boss 宣告標記，防止重複執行
let bossAnnounced = false;

// 屬性定義
const ELEMENTS = {
  WATER: { id: 'Water', name: '水', color: '#40a0ff', icon: '💧', counters: 'Fire' },
  FIRE:  { id: 'Fire', name: '火', color: '#ff4040', icon: '🔥', counters: 'Earth' },
  EARTH: { id: 'Earth', name: '地', color: '#a07040', icon: '🌿', counters: 'Water' }
};

const UNIT_TYPES = {
  // --- Earth (地屬性) ---
  warrior:     { name: '戰士', cost: 100, hp: 100, atk: 20, speed: 0.15, sprite: 'player', range: 10, element: 'Earth', elem_strength: 1.0 },
  rock_thrower:{ name: '投石者', cost: 250, hp: 200, atk: 50, speed: 0.1, sprite: 'skeleton', range: 30, element: 'Earth', elem_strength: 1.0 }, // 提升 HP, ATK, Range
  paladin:     { name: '聖騎士', cost: 450, hp: 600, atk: 80, speed: 0.15, sprite: 'paladin', range: 15, element: 'Earth', elem_strength: 1.0, blockChance: 0.3, blockReduction: 0.5 }, // 提升 HP, ATK, Range, 增加格擋能力
  hero:        { name: '大地英雄', cost: 750, hp: 1200, atk: 180, speed: 0.2, sprite: 'hero', range: 20, element: 'Earth', elem_strength: 1.0, stunChance: 0.2, stunDuration: 60 }, // 提升 HP, ATK, Range, 增加暈眩能力

  // --- Water (水屬性) ---
  archer:      { name: '弓箭手', cost: 100, hp: 70, atk: 18, speed: 0.1, sprite: 'archer', range: 25, element: 'Water', elem_strength: 1.0 }, // 微幅提升 ATK, Range
  assassin:    { name: '刺客', cost: 250, hp: 180, atk: 70, speed: 0.3, sprite: 'assassin', range: 12, element: 'Water', elem_strength: 1.0 }, // 提升 HP, ATK, Speed
  ghost:       { name: '幽靈刺客', cost: 450, hp: 400, atk: 100, speed: 0.3, sprite: 'ghost', range: 18, element: 'Water', elem_strength: 1.0 }, // 提升 HP, ATK, Speed, Range
  cleric:      { name: '大主祭', cost: 750, hp: 700, atk: 140, speed: 0.1, sprite: 'cleric', range: 28, element: 'Water', elem_strength: 1.0, healRange: 50, healAmount: 20, healCooldown: 120 }, // 提升 HP, ATK, Range, 增加治療能力

  // --- Fire (火屬性) ---
  mage:        { name: '魔法師', cost: 100, hp: 60, atk: 28, speed: 0.1, sprite: 'mage', range: 28, element: 'Fire', elem_strength: 1.0 }, // 提升 ATK, Range
  reaper:      { name: '死神', cost: 250, hp: 250, atk: 65, speed: 0.2, sprite: 'reaper', range: 10, element: 'Fire', elem_strength: 1.0 }, // 提升 HP, ATK
  knight:      { name: '烈焰騎士', cost: 450, hp: 550, atk: 95, speed: 0.2, sprite: 'boss', range: 15, element: 'Fire', elem_strength: 1.0, blockChance: 0.3, blockReduction: 0.5 }, // 提升 HP, ATK, Range, 增加格擋能力
  dragonlord:  { name: '龍領主', cost: 750, hp: 1100, atk: 200, speed: 0.2, sprite: 'dragon', range: 20, element: 'Fire', elem_strength: 1.0, splashRange: 15, splashDamage: 0.5 }  // 提升 HP, ATK, Range, 增加濺射傷害
};

// 敵人單位類型定義（使用 canvas.js 中現有但未被士兵使用的 sprite）
const BOSS_SPECS = {
  demon_lord: { name: '惡魔領主', baseHp: 400, baseAtk: 35, speed: 0.25, sprite: 'demon', scaleFactor: 1.2 },
  dragon_king: { name: '龍王', baseHp: 450, baseAtk: 40, speed: 0.3, sprite: 'dragon', scaleFactor: 1.4 }
};

const ENEMY_SPECS = {
  slime:     { name: '史萊姆', baseHp: 40, baseAtk: 6, speed: 0.15, sprite: 'slime' },
  skeleton:  { name: '骷髏兵', baseHp: 50, baseAtk: 8, speed: 0.15, sprite: 'skeleton' },
  ghost:     { name: '幽靈', baseHp: 30, baseAtk: 10, speed: 0.2, sprite: 'ghost' },
  spider:    { name: '蜘蛛', baseHp: 45, baseAtk: 7, speed: 0.2, sprite: 'spider' },
  demon:     { name: '惡魔', baseHp: 70, baseAtk: 12, speed: 0.15, sprite: 'demon' },
  dragon:    { name: '幼龍', baseHp: 100, baseAtk: 15, speed: 0.15, sprite: 'dragon' },
  wyvern:    { name: '飛龍', baseHp: 100, baseAtk: 15, speed: 0.2, sprite: 'wyvern' },
  fire_wisp: { name: '火焰精靈', baseHp: 30, baseAtk: 20, speed: 0.2, sprite: 'fire_wisp' },
  ice_golem: { name: '冰魔像', baseHp: 100, baseAtk: 10, speed: 0.2, sprite: 'ice_golem' },
  mimic:     { name: '寶箱怪', baseHp: 80, baseAtk: 10, speed: 0.2, sprite: 'mimic' }
};

// 您可以在此調整怪物的成長係數：
// scale: 生命值隨波次增加比例, atk 隨波次增加比例...等
function scaleEnemy(base, wave) {
  const e = JSON.parse(JSON.stringify(base));
  const hpScale = 1 + (wave - 1) * 0.25; // 大幅提升 HP 成長
  const atkScale = 1 + (wave - 1) * 0.2;  // 大幅提升 ATK 成長
  e.hp = Math.round((e.baseHp || 40) * hpScale);
  e.maxHp = e.hp;
  e.atk = Math.round((e.baseAtk || 6) * atkScale);
  e.speed = (base.speed || 0.5) * (1 + (wave - 1) * 0.02); // 速度維持不變或微幅增加
  
  // 怪物從右側建築物內部 (與封面樣式對齊)
  // 使用邏輯座標 (0-120)，樣式中怪物產點約在 c=105
  e.x = 105; 
  
  e.targetX = 30; // 目標是左側建築物門口
  return e;
}

function spawnWaveEnemy() {
  let baseEnemy;
  let enemy;
  
  if (Dungeon.isBossWave) {
    const bossTypes = Object.keys(BOSS_SPECS);
    const chosenBossType = randomChoice(bossTypes);
    baseEnemy = BOSS_SPECS[chosenBossType];
    enemy = scaleEnemy(baseEnemy, Dungeon.wave);
    enemy.hp = Math.round(enemy.hp * baseEnemy.scaleFactor);
    enemy.maxHp = enemy.hp;
    enemy.atk = Math.round(enemy.atk * baseEnemy.scaleFactor);
    enemy.isBoss = true;
    dLog(`😈 強大的 ${enemy.name} 出現了！`, 'log-red');
  } else {
    const enemyTypes = Object.keys(ENEMY_SPECS);
    let chosenEnemyType = 'slime';

    if (Dungeon.wave > 3) chosenEnemyType = randomChoice(['slime', 'skeleton', 'spider']);
    if (Dungeon.wave > 6) chosenEnemyType = randomChoice(['skeleton', 'ghost', 'demon']);
    if (Dungeon.wave > 10) chosenEnemyType = randomChoice(['demon', 'dragon', 'wyvern']);
    if (Dungeon.wave > 15) chosenEnemyType = randomChoice(['dragon', 'wyvern', 'fire_wisp', 'ice_golem']);
    if (Dungeon.wave > 20) chosenEnemyType = randomChoice(['wyvern', 'fire_wisp', 'ice_golem', 'mimic']);

    baseEnemy = ENEMY_SPECS[chosenEnemyType];
    enemy = scaleEnemy(baseEnemy, Dungeon.wave);
  }
  
  const elKeys = Object.keys(ELEMENTS);
  enemy.element = elKeys[Math.floor(Math.random() * elKeys.length)];
  
  Dungeon.enemies.push(enemy);
}

// ══════════════════════════════════════════════
// DUNGEON QUIZ
// ══════════════════════════════════════════════
let dQlv = 'all', dQmd = 'mixed', dAnswered = false, dIsGrammar = true;
let gPool = [], gIdx = 0;
let dQC = 0, dQW = 0, dQTot = 0;

function dqlv(btn, l) {
  dQlv = l;
  document.querySelectorAll('#dql .lvl-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  dqStartInfo();
}

function dqmd(btn, m) {
  dQmd = m;
  document.querySelectorAll('#dqm .lvl-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  dqStartInfo();
}

function getFilteredGrammar() {
  if (dQmd === 'mixed') {
    return dQlv === 'all' ? [...gQuestions] : gQuestions.filter(g => g.level === dQlv);
  }
  return dQlv === 'all' ? gQuestions.filter(g => g.type === dQmd) : gQuestions.filter(g => g.level === dQlv && g.type === dQmd);
}

function dqStartInfo() {
  const filtered = getFilteredGrammar();
  const startBtn = document.querySelector('button[onclick*="startDungeon"]');
  if (startBtn) startBtn.disabled = filtered.length < 2;
}

function buildPools() {
  const filtered = getFilteredGrammar();
  if (filtered.length === 0) {
    gPool = [];
    gIdx = 0;
    return;
  }

  // 將題目分為「未看過」和「已看過」
  let unused = filtered.filter(q => !gUsedIds.includes(q.id));
  
  // 如果所有篩選出的題目都看過了，就針對這些篩選後的題目重置「已看過」狀態
  if (unused.length === 0) {
    const filteredIds = filtered.map(q => q.id);
    gUsedIds = gUsedIds.filter(id => !filteredIds.includes(id));
    unused = shuffle([...filtered]); // Add a shuffle here
    saveUsedIdsToLS();
    console.log('[Dungeon] 篩選池已全部看過，重置該池的已看過狀態並重新洗牌');
  }

  gPool = shuffle(unused);
  gIdx = 0;
  console.log(`[Dungeon] 建立題目池，優先使用未看過題目，剩餘：${unused.length} 題`);
}

function nextGrammarQ() {
  // 優先從錯誤佇列中檢查
  if (Dungeon.wrongQueue && Dungeon.wrongQueue.length > 0) {
    // 檢查是否有題目已經等待足夠次數 (waitCount <= 0)
    const reviewIdx = Dungeon.wrongQueue.findIndex(item => item.waitCount <= 0);
    if (reviewIdx !== -1) {
      const reviewItem = Dungeon.wrongQueue.splice(reviewIdx, 1)[0];
      console.log(`[Dungeon] 重新出現複習題目: ${reviewItem.question.id}`);
      // 標記為複習題，可以在 UI 上做特殊顯示
      const q = { ...reviewItem.question, isReview: true };
      
      // 同時減少佇列中其他題目的等待計數
      Dungeon.wrongQueue.forEach(item => item.waitCount--);
      return q;
    }
  }

  if (!gPool.length) {
    buildPools(); // 嘗試重新建立
    if (!gPool.length) return null;
  }

  // 減少錯誤佇列中題目的等待計數
  if (Dungeon.wrongQueue) {
    Dungeon.wrongQueue.forEach(item => item.waitCount--);
  }

  const q = gPool[gIdx];
  
  // 記錄已使用
  if (q && q.id) {
    if (!gUsedIds.includes(q.id)) {
      gUsedIds.push(q.id);
      saveUsedIdsToLS(); // 持久化儲存
    }
  }

  gIdx++;
  
  // 如果這一輪（未看過的）用完了，重新洗牌下一批
  if (gIdx >= gPool.length) {
    buildPools();
  }
  
  return q;
}

function nextQItem() {
  return { type: 'grammar', data: nextGrammarQ() };
}

function resetDungeonState() {
  Dungeon.active = false;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.correctCount = 0;
  Dungeon.isWaveActive = false;
  Dungeon.isBossWave = false;
  Dungeon.wrongQueue = [];
  Dungeon.currentQ = null;
  dQTot = 0;
  dQC = 0;
  dQW = 0;
  if (typeof battleAnim !== 'undefined') {
    battleAnim.particles = [];
    battleAnim.floats = [];
  }
}

function startDungeon() {
  buildPools();
  if (gQuestions.length === 0) {
    setTimeout(startDungeon, 500);
    return;
  }
  if (gPool.length < 2) {
    alert("題目不足（至少需要 2 題），請先新增題目！");
    return;
  }
  resetDungeonState();
  Dungeon.active = true;
  Dungeon.wave = 1;

  // 應用遺器起始金錢加成
  const artifactStartingGold = typeof getArtifactEffect === 'function' ? getArtifactEffect("startingGold") : 0;
  Dungeon.gold = 200 + Math.round(artifactStartingGold);

  // 應用遺器主堡生命值加成
  const baseCastleHp = 200;
  const artifactHpBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("mainCastleHp") : 0;
  Dungeon.maxCastleHp = baseCastleHp + Math.round(artifactHpBonus);
  Dungeon.castleHp = Dungeon.maxCastleHp;
  
  beginBattle();
}

function beginBattle() {
  document.getElementById('boss-ov').classList.remove('show');
  const contBtn = document.getElementById('btn-res-continue');
  if (contBtn) contBtn.style.display = 'block';
  dqshow('dq-active');
  
  // 切換到戰鬥專用分頁
  if (typeof toggleBattleTabs === 'function') toggleBattleTabs(true);

  dLog(`⚔️ 戰鬥開始！賺取金幣來召喚士兵。`, 'log-warn');
  updateBattleUI();
  startNextWave();
  setTimeout(renderDQ, 100);
  if (!animFrame) renderBattleCanvas();
}

function startNextWave() {
  Dungeon.waveSpawnTimer = 0;
  Dungeon.enemiesToSpawn = 7; // 固定每波敵人數量為 7
  Dungeon.isWaveActive = true;
  Dungeon.waveTimer = 30 + Dungeon.wave * 5;
  Dungeon.isBossWave = false;
  bossAnnounced = false;

  if (Dungeon.wave % 10 === 0) {
    Dungeon.isBossWave = true;
    dLog(`🚨 BOSS 波次 #${Dungeon.wave / 10} 正在靠近！`, 'log-red');
  toast(`🚨 BOSS 波次 #${Dungeon.wave / 10}！`, 'var(--red)');
    // Boss 警告效果，3秒後自動消失
    const bossOv = document.getElementById('boss-ov');
    if (bossOv) {
      bossOv.innerHTML = `<div class="boss-box"><div class="boss-title">WARNING: BOSS WAVE</div><div class="boss-sprite">👹</div><div id="boss-nm">第 ${Dungeon.wave / 10} 區守護者</div></div>`;
      bossOv.classList.add('show');
      setTimeout(() => bossOv.classList.remove('show'), 3000);
    }
    Dungeon.enemiesToSpawn = 1;
    Dungeon.waveTimer = 45 + Dungeon.wave * 5;
  } else {
    dLog(`🌊 第 ${Dungeon.wave} 波敵人正在靠近...`, 'log-info');
    const bossOv = document.getElementById('boss-ov');
    if (bossOv) bossOv.classList.remove('show');
  }

  // 每回合回復主堡生命值
  const hpRecoverAmount = 5; // 基礎回復量
  const artifactHpRecoverBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("turnHpRecover") : 0;
  const finalHpRecover = hpRecoverAmount + Math.round(artifactHpRecoverBonus);
  const actualRecover = Math.min(finalHpRecover, Dungeon.maxCastleHp - Dungeon.castleHp);
  
  if (actualRecover > 0) {
    Dungeon.castleHp += actualRecover;
    dLog(`主堡回復了 ${actualRecover} 點生命。`, 'log-info');
    spawnFloat(`+${actualRecover}HP`, 30, cvH * 0.5, 'var(--green)');
  }
  
  updateBattleUI();
}

function updateBattleUI() {
  const floorChip = document.getElementById('floor-chip');
  if (floorChip) floorChip.textContent = `WAVE ${Dungeon.wave}`;
  const goldDisp = document.getElementById('gold-disp');
  if (goldDisp) goldDisp.textContent = Dungeon.gold;
  const timerDisp = document.getElementById('wave-timer');
  if (timerDisp) {
    const mins = Math.floor(Dungeon.waveTimer / 60);
    const secs = Math.floor(Dungeon.waveTimer % 60);
    timerDisp.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  const phpBar = document.getElementById('php-bar');
  const phpVal = document.getElementById('php-val');
  if (phpBar && phpVal) {
    const pct = Math.max(0, (Dungeon.castleHp / Dungeon.maxCastleHp) * 100);
    phpBar.style.width = pct + '%';
    phpVal.textContent = `${Math.max(0, Math.round(Dungeon.castleHp))}/${Dungeon.maxCastleHp}`;
    phpBar.classList.toggle('low', pct < 30);
  }
  const ehudName = document.getElementById('ehud-name');
  if (ehudName) ehudName.textContent = `剩餘敵人: ${Dungeon.enemiesToSpawn + Dungeon.enemies.length}`;
  updateDungeonBar();
}

function summonSoldier(type) {
  const spec = UNIT_TYPES[type];
  if (!spec) return;
  if (Dungeon.gold < spec.cost) {
    toast("金幣不足！", "var(--red)");
    return;
  }
  Dungeon.gold -= spec.cost;
  if (player.stats && player.stats.elementStats && spec.element) {
    player.stats.elementStats[spec.element] = (player.stats.elementStats[spec.element] || 0) + 1;
  }
  const up = player.upgrades?.[type] || { atk: 0, hp: 0, elem: 0 };
  const bonusAtk = (up.atk || 0) * 5;
  const bonusHp = (up.hp || 0) * 20;
  const bonusElem = (up.elem || 0) * 0.05;
  
  // 應用遺器效果：攻速
  const artifactAtkSpdBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("soldierAttackSpeed") : 0;
  const finalSpeedMultiplier = 1 + artifactAtkSpdBonus;

  // 士兵從左側建築物門口 (與封面樣式對齊)
  // 使用邏輯座標 (0-120)，門口位置修正為較左側的 c=8
  const spawnX = 8;

  const s = {
    ...spec,
    id: type,
    hp: spec.hp + bonusHp,
    maxHp: spec.hp + bonusHp,
    atk: spec.atk + bonusAtk,
    elem_strength: (spec.elem_strength || 1.0) + bonusElem,
    speed: spec.speed * finalSpeedMultiplier, // 提升移動速度
    atkSpeedMultiplier: finalSpeedMultiplier, // 用於戰鬥邏輯
    x: spawnX,
    targetX: 75, // 目標是畫面中央 (c=75 附近)
    state: "move",
    atkTimer: 0,
    element: spec.element
  };
  Dungeon.soldiers.push(s);
    updateBattleUI();
  dLog(`🛡️ 召喚了${spec.name} (LV.${(up.atk||0)+(up.hp||0)+(up.elem||0)})！`, "log-info");
}

function dqshow(id) {
  ['dq-start', 'dq-active', 'dq-result'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
}

function renderDQ() {
  dAnswered = false;
  const sz = document.getElementById('skill-zone');
  if (sz) sz.style.display = 'flex';
  const dqpl = document.getElementById('dqpl');
  if (dqpl) dqpl.textContent = 'Q' + (dQTot + 1);
  const dqc = document.getElementById('dqc');
  if (dqc) dqc.textContent = dQC;
  const dqw = document.getElementById('dqw');
  if (dqw) dqw.textContent = dQW;
  const dqnxt = document.getElementById('dqnxt');
  if (dqnxt) dqnxt.style.display = 'none';
  const dqfb = document.getElementById('dqfb');
  if (dqfb) dqfb.style.display = 'none';
  const qItem = nextQItem();
  if (!qItem || !qItem.data) {
    dLog('⚠️ 無法取得題目，請確認題庫是否有足夠內容。', 'log-warn');
    document.getElementById('dqcard').innerHTML = `<div class="card" style="text-align:center;color:var(--red2)">題庫載入失敗或內容不足，請返回主選單確認。</div>`;
    return;
  }
  Dungeon.currentQ = qItem.data; // 儲存當前題目，避免詳解錯亂
  renderGrammarQ(qItem.data);
}

function renderGrammarQ(q) {
  const labels = ['A', 'B', 'C', 'D'];
  let title = q.isReview ? "🔄 弱點強化複習" : "🛡️ 結構邏輯診斷";
  let contentHtml = "";
  switch (q.type) {
    case 'fill':
      title = "📧 文本補全測驗";
      contentHtml = `<div class="q-text email-box" style="font-size:14px; text-align:left; background:rgba(255,255,255,0.05); padding:10px; border-radius:5px; border-left:3px solid var(--blue);">${mkCW(q.question)}</div>`;
      break;
    case 'job_define':
      title = "💼 職場定義匹配";
      contentHtml = `<div class="q-text define-box" style="font-size:15px; font-style:italic; color:var(--gold);">${mkCW(q.question)}</div>`;
      break;
    case 'response_choice':
      title = "🤝 戰略回覆選擇";
      const dialogue = q.question.split('|');
      contentHtml = `<div class="q-text dialogue-box">
        <div class="chat-msg">A: ${mkCW(dialogue[0])}</div>
        <div class="chat-msg prompt">B: (Select the best response)</div>
      </div>`;
      break;
    case 'logic_grammar':
    default:
      title = "🛡 結構邏輯診斷";
      contentHtml = `<div class="q-text" style="font-size:15px; font-weight:normal">${mkCW(q.question)}</div>`;
      break;
  }
  const originalOptions = q.options.map((text, index) => ({ text, isCorrect: index === q.answer }));
  const shuffledOptions = shuffle([...originalOptions]);
  const newAnswerIdx = shuffledOptions.findIndex(o => o.isCorrect);
  let html = `<div class="q-head">${title} ${q.tag ? `<span class="badge bp" style="font-size:9px">${esc(q.tag)}</span>` : ''}</div>
  ${contentHtml}`;
  html += shuffledOptions.map((o, i) => 
    `<button class="opt-btn" data-idx="${i}" onclick="selDQ(this,'grammar',${i},${newAnswerIdx},event)"><strong style="color:var(--cyan)">${labels[i]}.</strong> ${mkCW(o.text)}</button>`
  ).join('');
  document.getElementById('dqcard').innerHTML = html;
}

function getDungeonReward() {
  const baseReward = 50 + (player.lv * 5);
  const artifactBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("quizGold") : 0;
  return Math.round(baseReward + artifactBonus);
}

function selDQ(btn, type, sel, cor, evt) {
  if (dAnswered) return;
  dAnswered = true;
  dQTot++;
  const ok = String(sel) === String(cor);
  const q = Dungeon.currentQ; // 改從 Dungeon.currentQ 獲取正確的題目資訊
  const reward = getDungeonReward();

  if (ok) {
    dQC++;
    player.combo = (player.combo || 0) + 1;
    player.maxCombo = Math.max(player.maxCombo || 0, player.combo);
    if (player.stats) player.stats.maxCombo = Math.max(player.stats.maxCombo || 0, player.combo);
    
    Dungeon.correctCount = (Dungeon.correctCount || 0) + 1;
    Dungeon.gold += reward;
    sfxCorrect();
    spawnFloat(`+$${reward}`, cvW * 0.5, cvH * 0.45, 'var(--gold)'); // 上移金錢顯示
    updateBattleUI();
    gStats.correct = (gStats.correct || 0) + 1;
    if (q && q.type) {
      if (!player.stats.typeStats[q.type]) player.stats.typeStats[q.type] = { c: 0, w: 0 };
      player.stats.typeStats[q.type].c++;
    }
    if (typeof gainExp === 'function') gainExp(10);
  } else {
    dQW++;
    player.combo = 0;
    const penalty = 10; // 固定答錯扣血為 10 點
    Dungeon.castleHp -= penalty;
    sfxWrong();
    spawnFloat(`-${penalty}HP`, 30, cvH * 0.5, 'var(--red)');
    updateBattleUI();
    gStats.wrong = (gStats.wrong || 0) + 1;
    if (q && q.type) {
      if (!player.stats.typeStats[q.type]) player.stats.typeStats[q.type] = { c: 0, w: 0 };
      player.stats.typeStats[q.type].w++;
    }

    // 加入錯誤佇列，設定在 3 題之後重新出現
    if (q && !q.isReview) { // 如果已經是複習題又錯了，可以考慮是否要繼續排隊，這裡先設定非複習題才加入
        Dungeon.wrongQueue.push({
            question: q,
            waitCount: 3 // 等待 3 題
        });
        console.log(`[Dungeon] 題目 ${q.id} 加入錯誤佇列，將在 3 題後出現`);
    } else if (q && q.isReview) {
        // 如果複習題又錯，再次加入佇列，縮短間隔
        Dungeon.wrongQueue.push({
            question: q,
            waitCount: 2 
        });
    }
  }

  document.querySelectorAll('#dq-active .opt-btn').forEach(b => {
    b.disabled = true;
    const idx = parseInt(b.dataset.idx);
    if (idx === parseInt(cor)) b.classList.add('correct');
    else if (idx === parseInt(sel) && !ok) b.classList.add('wrong');
  });

  const fb = document.getElementById('dqfb');
  fb.style.display = 'block';
  fb.className = 'fb ' + (ok ? 'ok' : 'no');
  let explain = q?.explain || '無詳細解釋。';
  fb.innerHTML = (ok ? `✅ 答對！+$${reward}` : `❌ 答錯！正確答案是：<strong>${['A','B','C','D'][cor]}</strong>`) +
                 `<div class="fb-explain">${explain}</div>`;

  const nxt = document.getElementById('dqnxt');
  if (nxt) nxt.style.display = 'block';
  if (q) {
    let sentenceToSpeak = "";
    if (q.type === "fill" && q.fullSentence) {
      sentenceToSpeak = q.fullSentence;
    } else if (q.type === "job_define" && q.question) {
      // Explicitly for 'job_define', speak the question
      sentenceToSpeak = q.question;
    } else if (q.type === "response_choice" && q.question) {
      // 將 A: [question] 與 B: [correct answer] 結合播放
      const dialogueParts = q.question.split('|');
      const partA = dialogueParts[0].trim();
      const partB = q.options[q.answer].trim();
      sentenceToSpeak = `${partA}. ${partB}`;
    } else if (q.question) {
      if (q.question.includes("___") && q.options && q.answer !== undefined) {
        sentenceToSpeak = q.question.replace("___", q.options[q.answer]);
      } else {
        sentenceToSpeak = q.question;
      }
      sentenceToSpeak = sentenceToSpeak.replace(/\|/g, " ");
    }
    if (sentenceToSpeak && sentenceToSpeak.trim() !== "") {
      console.log(`[語音播放] 播放內容: "${sentenceToSpeak}"`);
      speak(sentenceToSpeak);
    }
  }
}

function nextDQ() {
  renderDQ();
}

function continueDungeon() {
  Dungeon.wave++;
  beginBattle();
}

function exitDungeon() {
  resetDungeonState();
  dqshow("dq-start");
  
  // 恢復正常分頁
  if (typeof toggleBattleTabs === 'function') toggleBattleTabs(false);

  saveAll();
  dLog("🏃 已返回主選單。", "log-info");
}

function endGame() {
  const roundCorrect = dQC;
  const roundWrong = dQW;
  const wavesCompleted = Math.max(0, Dungeon.wave - 1);
  if (!player) return;

  const lvBonus = 1 + ((player.lv || 1) - 1) * 0.1;

  // 應用遺器效果：寶石獲取
  const artifactGemBonus = typeof getArtifactEffect === 'function' ? getArtifactEffect("gemGain") : 0;
  
  const rewardGems = Math.round(((wavesCompleted * 10) + (roundCorrect * 2)) * lvBonus + artifactGemBonus);
  
  player.gems = (player.gems || 0) + rewardGems;
  player.stats = player.stats || {};
  player.stats.totalWaves = (player.stats.totalWaves || 0) + wavesCompleted;
  player.stats.totalCorrect = (player.stats.totalCorrect || 0) + roundCorrect;
  player.stats.totalWrong = (player.stats.totalWrong || 0) + roundWrong;
  player.stats.totalGemsEarned = (player.stats.totalGemsEarned || 0) + rewardGems;
  player.stats.maxCombo = Math.max(player.stats.maxCombo || 0, player.maxCombo || 0, player.combo || 0);

  dqshow("dq-result");
  
  // 恢復正常分頁
  if (typeof toggleBattleTabs === 'function') toggleBattleTabs(false);

  const updateResultUI = () => {
    const resIco = document.getElementById("res-ico");
    if (resIco) resIco.textContent = "";
    const resTitle = document.getElementById("res-title");
    if (resTitle) resTitle.textContent = "戰鬥總結";
    const resScore = document.getElementById("res-score");
    if (resScore) resScore.textContent = `完成 ${wavesCompleted} 波`;
    const resMsg = document.getElementById("res-msg");
    if (resMsg) resMsg.textContent = `本輪答對 ${roundCorrect} 題，獲得 ${rewardGems} 💎`;
    const contBtn = document.getElementById("btn-res-continue");
    if (contBtn) contBtn.style.display = "none";
  };
  updateResultUI();

  const gemStat = document.getElementById("stat-gems");
  if (gemStat) gemStat.textContent = player.gems;
  if (typeof renderUpgradeMenu === 'function') renderUpgradeMenu();
  
  dLog(`🎮 戰鬥結束！完成 ${wavesCompleted} 波，本輪答對 ${roundCorrect} 題，獲得 ${rewardGems} 💎`, "log-gold");
  
  resetDungeonState();
  player.combo = 0;
  saveAll();
}

function dLog(msg, cls = 'log-info') {
  const log = document.getElementById('dungeon-log');
  if (!log) return;
  const now = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = `[${now}] ${msg}`;
  log.appendChild(d);
  
  // 限制 Log 數量，防止 DOM 節點過多導致卡頓 (最多保留 50 條)
  if (log.childNodes.length > 50) {
    log.removeChild(log.firstChild);
  }
  
  log.scrollTop = log.scrollHeight;
}

function updateDungeonBar() {
  const fl = Dungeon.wave || 1;
  const chip = document.getElementById('floor-chip');
  if (chip) chip.textContent = 'WAVE ' + fl;
  const trk = document.getElementById('floor-trk');
  if (trk) trk.style.width = (((fl - 1) % 10) + 1) / 10 * 100 + '%';
}