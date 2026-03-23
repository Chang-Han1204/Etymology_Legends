// ══════════════════════════════════════════════
// DUNGEON SYSTEM (REWRITTEN FOR BATTLE WAVE MODE)
// ══════════════════════════════════════════════
const Dungeon = {
  active: false,
  wave: 1,
  gold: 0,
  castleHp: 100,
  maxCastleHp: 100,
  soldiers: [],
  enemies: [],
  correctCount: 0,
  isWaveActive: false,
  waveSpawnTimer: 0,
  enemiesToSpawn: 0,
  waveTimer: 0, // 波次倒數計時（秒）
  isBossWave: false // 新增 Boss 波次狀態
};

// Boss 宣告標記，防止重複執行
let bossAnnounced = false;

// 屬性定義
const ELEMENTS = {
  WATER: { id: 'Water', name: '水', color: '#40a0ff', icon: '💧', counters: 'Fire' },
  FIRE:  { id: 'Fire', name: '火', color: '#ff4040', icon: '🔥', counters: 'Earth' },
  EARTH: { id: 'Earth', name: '地', color: '#a07040', icon: '🌿', counters: 'Water' }
};

// 單位類型定義
// cost: 召喚金幣, hp: 生命值, atk: 攻擊力, speed: 移動速度, range: 攻擊距離, element: 屬性
// 階級平衡：
// Tier 1: Cost 100, HP 100, ATK 20, Range 30/150
// Tier 2: Cost 250, HP 200, ATK 45, Range 40/200
// Tier 3: Cost 450, HP 400, ATK 80, Range 50/250
// Tier 4: Cost 750, HP 850, ATK 150, Range 60/300
const UNIT_TYPES = {
  // --- Earth (地屬性) ---
  warrior:     { name: '戰士', cost: 100, hp: 100, atk: 20, speed: 0.8, sprite: 'player', range: 30, element: 'Earth', elem_strength: 1.0 },
  rock_thrower:{ name: '投石者', cost: 250, hp: 150, atk: 40, speed: 0.6, sprite: 'skeleton', range: 180, element: 'Earth', elem_strength: 1.0 },
  paladin:     { name: '聖騎士', cost: 450, hp: 500, atk: 70, speed: 0.7, sprite: 'paladin', range: 40, element: 'Earth', elem_strength: 1.0 },
  hero:        { name: '大地英雄', cost: 750, hp: 1000, atk: 150, speed: 0.9, sprite: 'hero', range: 50, element: 'Earth', elem_strength: 1.0 },

  // --- Water (水屬性) ---
  archer:      { name: '弓箭手', cost: 100, hp: 70, atk: 15, speed: 0.6, sprite: 'archer', range: 200, element: 'Water', elem_strength: 1.0 },
  assassin:    { name: '刺客', cost: 250, hp: 150, atk: 60, speed: 1.6, sprite: 'assassin', range: 25, element: 'Water', elem_strength: 1.0 },
  ghost:       { name: '幽靈刺客', cost: 450, hp: 350, atk: 90, speed: 1.4, sprite: 'ghost', range: 30, element: 'Water', elem_strength: 1.0 },
  cleric:      { name: '大主祭', cost: 750, hp: 600, atk: 120, speed: 0.7, sprite: 'cleric', range: 250, element: 'Water', elem_strength: 1.0 },

  // --- Fire (火屬性) ---
  mage:        { name: '魔法師', cost: 100, hp: 60, atk: 25, speed: 0.5, sprite: 'mage', range: 150, element: 'Fire', elem_strength: 1.0 },
  reaper:      { name: '死神', cost: 250, hp: 200, atk: 55, speed: 1.0, sprite: 'reaper', range: 40, element: 'Fire', elem_strength: 1.0 },
  knight:      { name: '烈焰騎士', cost: 450, hp: 450, atk: 85, speed: 0.9, sprite: 'boss', range: 50, element: 'Fire', elem_strength: 1.0 },
  dragonlord:  { name: '龍領主', cost: 750, hp: 900, atk: 180, speed: 1.0, sprite: 'dragon', range: 60, element: 'Fire', elem_strength: 1.0 }
};

// 敵人單位類型定義（使用 canvas.js 中現有但未被士兵使用的 sprite）
const BOSS_SPECS = {
  demon_lord: { name: '惡魔領主', baseHp: 500, baseAtk: 40, speed: 0.4, sprite: 'demon', scaleFactor: 2.0 },
  dragon_king: { name: '龍王', baseHp: 800, baseAtk: 60, speed: 0.3, sprite: 'dragon', scaleFactor: 2.5 }
};

const ENEMY_SPECS = {
  slime:     { name: '史萊姆', baseHp: 40, baseAtk: 6, speed: 0.5, sprite: 'slime' },
  skeleton:  { name: '骷髏兵', baseHp: 50, baseAtk: 8, speed: 0.6, sprite: 'skeleton' },
  ghost:     { name: '幽靈', baseHp: 30, baseAtk: 10, speed: 0.8, sprite: 'ghost' },
  spider:    { name: '蜘蛛', baseHp: 45, baseAtk: 7, speed: 0.7, sprite: 'spider' },
  demon:     { name: '惡魔', baseHp: 70, baseAtk: 12, speed: 0.6, sprite: 'demon' },
  dragon:    { name: '幼龍', baseHp: 100, baseAtk: 15, speed: 0.5, sprite: 'dragon' },
  wyvern:    { name: '飛龍', baseHp: 100, baseAtk: 15, speed: 0.9, sprite: 'wyvern' },
  fire_wisp: { name: '火焰精靈', baseHp: 30, baseAtk: 20, speed: 1.1, sprite: 'fire_wisp' },
  ice_golem: { name: '冰魔像', baseHp: 100, baseAtk: 10, speed: 0.3, sprite: 'ice_golem' },
  mimic:     { name: '寶箱怪', baseHp: 80, baseAtk: 10, speed: 0.4, sprite: 'mimic' }
};

// 您可以在此調整怪物的成長係數：
// scale: 生命值隨波次增加比例, atk 隨波次增加比例...等
function scaleEnemy(base, wave) {
  const e = JSON.parse(JSON.stringify(base));
  const scale = 1 + (wave - 1) * 0.15; // 波次難度增加
  e.hp = Math.round((e.baseHp || 40) * scale);
  e.maxHp = e.hp;
  e.atk = Math.round((e.baseAtk || 6) * (1 + (wave - 1) * 0.1));
  e.speed = (base.speed || 0.5) * (1 + (wave - 1) * 0.02);
  
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
  
  if (enemy.element === 'FIRE') {
    enemy.atk = Math.round(enemy.atk * 1.2);
  } else if (enemy.element === 'WATER') {
    enemy.hp = Math.round(enemy.hp * 1.2);
    enemy.maxHp = enemy.hp;
  } else if (enemy.element === 'EARTH') {
    enemy.speed *= 0.8;
  }
  
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

function dqStartInfo() {
  let grammarCount = 0;
  let filteredGrammar = [];
  if (dQmd === 'mixed') {
    filteredGrammar = dQlv === 'all' ? [...gQuestions] : gQuestions.filter(g => g.level === dQlv);
  } else {
    filteredGrammar = dQlv === 'all' ? gQuestions.filter(g => g.type === dQmd) : gQuestions.filter(g => g.level === dQlv && g.type === dQmd);
  }
  grammarCount = filteredGrammar.length;
  const startBtn = document.querySelector('button[onclick*="startDungeon"]');
  if (startBtn) {
    startBtn.disabled = grammarCount < 2;
  }
}

function buildPools() {
  let filteredGrammarQuestions = [];
  if (dQmd === 'mixed') {
    filteredGrammarQuestions = dQlv === 'all' ? [...gQuestions] : gQuestions.filter(g => g.level === dQlv);
  } else {
    filteredGrammarQuestions = dQlv === 'all' ? gQuestions.filter(g => g.type === dQmd) : gQuestions.filter(g => g.level === dQlv && g.type === dQmd);
  }
  gPool = shuffle(filteredGrammarQuestions);
  gIdx = 0;
}

function nextGrammarQ() {
  if (!gPool.length) return null;
  const q = gPool[gIdx % gPool.length];
  gIdx++;
  if (gIdx >= gPool.length) {
    gPool = shuffle(gPool);
    gIdx = 0;
  }
  return q;
}

function nextQItem() {
  return { type: 'grammar', data: nextGrammarQ() };
}

function startDungeon() {
  dLog(`[Dungeon] startDungeon 啟動`, "log-info");
  buildPools();
  if (gQuestions.length === 0) {
    dLog("⏳ 正在載入題庫，請稍候...", "log-info");
    setTimeout(startDungeon, 500);
    return;
  }
  if (gPool.length < 2) {
    alert("題目不足（至少需要 2 題），請先新增題目！");
    return;
  }
  Dungeon.active = true;
  Dungeon.wave = 1;
  Dungeon.gold = 200;
  Dungeon.castleHp = 200;
  Dungeon.maxCastleHp = 200;
  
  // 初始化士兵與敵人陣列，確保它們是空且可操作的
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.correctCount = 0;
  Dungeon.isWaveActive = false;
  dQTot = 0;
  dQC = 0;
  dQW = 0;
  dLog(`[Dungeon] Dungeon.active: ${Dungeon.active}, castleHp: ${Dungeon.castleHp}`, "log-info");
  beginBattle();
}

function beginBattle() {
  document.getElementById('boss-ov').classList.remove('show');
  const contBtn = document.getElementById('btn-res-continue');
  if (contBtn) contBtn.style.display = 'block';
  dqshow('dq-active');
  dLog(`⚔️ 戰鬥開始！賺取金幣來召喚士兵。`, 'log-warn');
  updateBattleUI();
  startNextWave();
  setTimeout(renderDQ, 100);
  if (!animFrame) renderBattleCanvas();
}

function startNextWave() {
  Dungeon.waveSpawnTimer = 0;
  Dungeon.enemiesToSpawn = 5 + Dungeon.wave * 2;
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
  updateBattleUI();
}

function updateBattleUI() {
  const floorChip = document.getElementById('floor-chip');
  if (floorChip) floorChip.textContent = `WAVE ${Dungeon.wave}`;
  const goldDisp = document.getElementById('exp-disp');
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
  
  // 士兵從左側建築物門口 (與封面樣式對齊)
  // 使用邏輯座標 (0-120)，門口位置 c=15
  const spawnX = 15;

  const s = {
    ...spec,
    id: type,
    hp: spec.hp + bonusHp,
    maxHp: spec.hp + bonusHp,
    atk: spec.atk + bonusAtk,
    elem_strength: (spec.elem_strength || 1.0) + bonusElem,
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
  renderGrammarQ(qItem.data);
}

function renderGrammarQ(q) {
  const labels = ['A', 'B', 'C', 'D'];
  let title = "🛡 結構邏輯診斷";
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

function selDQ(btn, type, sel, cor, evt) {
  if (dAnswered) return;
  dAnswered = true;
  dQTot++;
  const ok = String(sel) === String(cor);
  const q = gPool[(gIdx - 1 + gPool.length) % gPool.length];
  if (ok) {
    dQC++;
    player.combo = (player.combo || 0) + 1;
    if (player.combo > (player.maxCombo || 0)) player.maxCombo = player.combo;
    if (player.stats && player.combo > (player.stats.maxCombo || 0)) player.stats.maxCombo = player.combo;
    Dungeon.correctCount = (Dungeon.correctCount || 0) + 1;
    const reward = 50 + (player.lv * 5);
    Dungeon.gold += reward;
    sfxCorrect();
    spawnFloat(`+$${reward}`, cvW * 0.5, cvH * 0.5, 'var(--gold)');
    updateBattleUI();
    gStats.correct = (gStats.correct || 0) + 1;
    if (q && q.type) {
      if (!player.stats.typeStats[q.type]) player.stats.typeStats[q.type] = { c: 0, w: 0 };
      player.stats.typeStats[q.type].c++;
    }
    if (typeof gainExp === 'function') gainExp(10);
    // 答對後顯示繼續按鈕
    const nxt = document.getElementById('dqnxt');
    if (nxt) nxt.style.display = 'block';
  } else {
    dQW++;
    player.combo = 0;
    const penalty = 20 + (player.lv * 5);
    Dungeon.castleHp -= penalty;
    sfxWrong();
    spawnFloat(`-${penalty}HP`, 30, cvH * 0.5, 'var(--red)');
    updateBattleUI();
    gStats.wrong = (gStats.wrong || 0) + 1;
    if (q && q.type) {
      if (!player.stats.typeStats[q.type]) player.stats.typeStats[q.type] = { c: 0, w: 0 };
      player.stats.typeStats[q.type].w++;
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
  fb.innerHTML = (ok ? `✅ 答對！+$${50 + player.lv*5}` : `❌ 答錯！正確答案是：<strong>${['A','B','C','D'][cor]}</strong>`) +
                 `<div class="fb-explain">${explain}</div>`;
  if (q) {
    let sentenceToSpeak = "";
    if (q.type === "fill" && q.fullSentence) {
      sentenceToSpeak = q.fullSentence;
    } else if (q.type === "job_define" && q.question) {
      // Explicitly for 'job_define', speak the question
      sentenceToSpeak = q.question;
    } else if (q.question) {
      if (q.question.includes("___") && q.options && q.answer !== undefined) {
        sentenceToSpeak = q.question.replace("___", q.options[q.answer]);
      } else {
        sentenceToSpeak = q.question;
      }
      sentenceToSpeak = sentenceToSpeak.replace(/\|/g, " ");
    }
    if (sentenceToSpeak && sentenceToSpeak.trim() !== "") {
      console.log(`[語音播放] 播放內容 (job_define 修正後): "${sentenceToSpeak}"`); // Debugging log
      speak(sentenceToSpeak);
    }
  }
  const nxt = document.getElementById('dqnxt');
  if (nxt) nxt.style.display = 'block';
}

function nextDQ() {
  renderDQ();
}

function continueDungeon() {
  Dungeon.wave++;
  beginBattle();
}

function exitDungeon() {
  Dungeon.active = false;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  dqshow("dq-start");
  saveAll();
  dLog("🏃 已返回主選單。", "log-info");
}

function endGame() {
  const roundCorrect = dQC;
  const roundWrong = dQW;
  const wavesCompleted = Math.max(0, Dungeon.wave - 1);
  if (!player) return;
  // 等級獎勵倍率：每提升一級增加 10% 寶石獲取 (例如 Lv1 1.0, Lv2 1.1)
  const lvBonus = 1 + ((player.lv || 1) - 1) * 0.1;
  const rewardGems = Math.round(((wavesCompleted * 10) + (roundCorrect * 2)) * lvBonus);
  player.gems = Number(player.gems || 0) + Number(rewardGems);
  player.stats = player.stats || {};
  player.stats.totalWaves = Number(player.stats.totalWaves || 0) + Number(wavesCompleted);
  player.stats.totalCorrect = Number(player.stats.totalCorrect || 0) + Number(roundCorrect);
  player.stats.totalWrong = Number(player.stats.totalWrong || 0) + Number(roundWrong);
  player.stats.totalGemsEarned = Number(player.stats.totalGemsEarned || 0) + Number(rewardGems);
  if (player.maxCombo < (player.combo || 0)) player.maxCombo = player.combo;
  if (player.stats.maxCombo < (player.maxCombo || 0)) player.stats.maxCombo = player.maxCombo;
  dqshow("dq-result");
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
  setTimeout(updateResultUI, 100);
  const gemStat = document.getElementById("stat-gems");
  if (gemStat) gemStat.textContent = player.gems;
  if (typeof renderUpgradeMenu === 'function') renderUpgradeMenu();
  dLog(`🎮 戰鬥結束！完成 ${wavesCompleted} 波，本輪答對 ${roundCorrect} 題，獲得 ${rewardGems} 💎`, "log-gold");
  Dungeon.active = false;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.correctCount = 0;
  Dungeon.isBossWave = false;
  dQC = 0;
  dQW = 0;
  dQTot = 0;
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
  log.scrollTop = log.scrollHeight;
}

function updateDungeonBar() {
  const fl = Dungeon.wave || 1;
  const chip = document.getElementById('floor-chip');
  if (chip) chip.textContent = 'WAVE ' + fl;
  const trk = document.getElementById('floor-trk');
  if (trk) trk.style.width = (((fl - 1) % 10) + 1) / 10 * 100 + '%';
}
