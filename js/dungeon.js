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
  waveTimer: 0 // 波次倒數計時（秒）
};

// 屬性定義
const ELEMENTS = {
  WATER: { id: 'Water', name: '水', color: '#40a0ff', icon: '💧', counters: 'Fire' },
  FIRE:  { id: 'Fire', name: '火', color: '#ff4040', icon: '🔥', counters: 'Earth' },
  EARTH: { id: 'Earth', name: '地', color: '#a07040', icon: '🌿', counters: 'Water' }
};

// 單位類型定義
// cost: 召喚金幣, hp: 生命值, atk: 攻擊力, speed: 移動速度, range: 攻擊距離, element: 屬性
const UNIT_TYPES = {
  warrior:  { name: '戰士', cost: 100, hp: 100, atk: 20, speed: 0.8, sprite: 'player', range: 30, element: 'Earth', elem_strength: 1.0 },
  skeleton: { name: '骨骸戰士', cost: 150, hp: 120, atk: 25, speed: 0.7, sprite: 'skeleton', range: 35, element: 'Earth', elem_strength: 1.0 },
  paladin:  { name: '聖騎士', cost: 100, hp: 350, atk: 30, speed: 0.9, sprite: 'paladin', range: 40, element: 'Earth', elem_strength: 1.0 },
  hero:     { name: '英雄', cost: 100, hp: 500, atk: 60, speed: 1.1, sprite: 'hero', range: 50, element: 'Earth', elem_strength: 1.0 },

  archer:   { name: '弓箭手', cost: 100, hp: 60, atk: 15, speed: 0.6, sprite: 'archer', range: 200, element: 'Water', elem_strength: 1.0 },
  assassin: { name: '刺客', cost: 250, hp: 70, atk: 40, speed: 1.8, sprite: 'assassin', range: 25, element: 'Water', elem_strength: 1.0 },
  ghost:    { name: '幽靈刺客', cost: 400, hp: 80, atk: 50, speed: 1.5, sprite: 'ghost', range: 30, element: 'Water', elem_strength: 1.0 },
  cleric:   { name: '牧師', cost: 100, hp: 100, atk: 30, speed: 0.7, sprite: 'cleric', range: 180, element: 'Water', elem_strength: 1.0 },

  mage:     { name: '魔法師', cost: 100, hp: 50, atk: 25, speed: 0.5, sprite: 'mage', range: 150, element: 'Fire', elem_strength: 1.0 },
  reaper:   { name: '死神', cost: 350, hp: 150, atk: 65, speed: 1.0, sprite: 'reaper', range: 40, element: 'Fire', elem_strength: 1.0 },
  knight:   { name: '騎士', cost: 100, hp: 300, atk: 35, speed: 1.0, sprite: 'boss', range: 50, element: 'Fire', elem_strength: 1.0 },
  dragonlord: { name: '龍領主', cost: 100, hp: 800, atk: 80, speed: 1.0, sprite: 'dragon', range: 60, element: 'Fire', elem_strength: 1.0 }
};

// 敵人單位類型定義（使用 canvas.js 中現有但未被士兵使用的 sprite）
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
  e.x = cvW || 600; // 從右側出現
  e.targetX = 80; // 目標是左側主堡
  return e;
}

function spawnWaveEnemy() {
  // 根據波次難度，從 ENEMY_SPECS 中選擇敵人
  const enemyTypes = Object.keys(ENEMY_SPECS);
  let chosenEnemyType = 'slime'; // 預設為史萊姆

  // 隨著波次增加，出現更強的敵人
  if (Dungeon.wave > 3) chosenEnemyType = randomChoice(['slime', 'skeleton', 'spider']);
  if (Dungeon.wave > 6) chosenEnemyType = randomChoice(['skeleton', 'ghost', 'demon']);
  if (Dungeon.wave > 10) chosenEnemyType = randomChoice(['demon', 'dragon', 'wyvern']);
  if (Dungeon.wave > 15) chosenEnemyType = randomChoice(['dragon', 'wyvern', 'fire_wisp', 'ice_golem']);
  if (Dungeon.wave > 20) chosenEnemyType = randomChoice(['wyvern', 'fire_wisp', 'ice_golem', 'mimic']);

  const baseEnemy = ENEMY_SPECS[chosenEnemyType];
  const enemy = scaleEnemy(baseEnemy, Dungeon.wave);
  
  // 隨機分配屬性
  const elKeys = Object.keys(ELEMENTS);
  enemy.element = elKeys[Math.floor(Math.random() * elKeys.length)];
  
  // 根據屬性調整敵人能力或外觀（可選）
  if (enemy.element === 'FIRE') {
    enemy.atk = Math.round(enemy.atk * 1.2); // 火屬性攻擊較高
  } else if (enemy.element === 'WATER') {
    enemy.hp = Math.round(enemy.hp * 1.2); // 水屬性生命較高
    enemy.maxHp = enemy.hp;
  } else if (enemy.element === 'EARTH') {
    enemy.speed *= 0.8; // 地屬性速度較慢但可能防禦較高（目前沒防禦屬性，先降速）
  }
  
  Dungeon.enemies.push(enemy);
}

// ══════════════════════════════════════════════
// DUNGEON QUIZ
// ══════════════════════════════════════════════
let dQlv = 'all', dQmd = 'vocab', dAnswered = false, dIsBoss = false, dIsGrammar = false;
// Infinite queue — two pools that get shuffled and cycled
let vPool = [], gPool = [], vIdx = 0, gIdx = 0;
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
  dqStartInfo(); // 更新資訊
}

function dqStartInfo() {
  const fl = player.floor || 1;
  const isBoss = fl % 10 === 0;
  
  let vocabCount = 0;
  let grammarCount = 0;
  let totalCount = 0;

  const filteredVocab = dQlv === 'all'
    ? vWords.filter(w => w.sentence && w.sentence.includes('___'))
    : vWords.filter(w => w.level === dQlv && w.sentence && w.sentence.includes('___'));
  vocabCount = filteredVocab.length;

  let filteredGrammar = [];
  if (dQmd === 'vocab') {
    // do nothing, only vocab
  } else if (dQmd === 'mixed') {
    filteredGrammar = dQlv === 'all'
      ? [...gQuestions]
      : gQuestions.filter(g => g.level === dQlv);
  } else {
    // Specific grammar type
    filteredGrammar = dQlv === 'all'
      ? gQuestions.filter(g => g.type === dQmd)
      : gQuestions.filter(g => g.level === dQlv && g.type === dQmd);
  }
  grammarCount = filteredGrammar.length;

  if (dQmd === 'vocab') {
    totalCount = vocabCount;
  } else if (dQmd === 'mixed') {
    totalCount = vocabCount + grammarCount;
  } else { // specific grammar type
    totalCount = grammarCount;
  }
  
  // 檢查是否存在「進入地下城」按鈕並禁用它
  const startBtn = document.querySelector('button[onclick*="startDungeon"]');
  if (startBtn) {
    startBtn.disabled = totalCount < 2;
  }
}

function buildPools() {
  // 詞彙題庫篩選
  vPool = shuffle(dQlv === 'all' 
    ? vWords.filter(w => w.sentence && w.sentence.includes('___')) 
    : vWords.filter(w => w.level === dQlv && w.sentence && w.sentence.includes('___')));
  vIdx = 0;

  // 文法題庫篩選，根據 dQmd 決定題型
  let filteredGrammarQuestions = [];
  if (dQmd === 'mixed' || dQmd === 'vocab') { // Mixed mode or just vocab won't filter grammar by type yet
    filteredGrammarQuestions = dQlv === 'all' 
      ? [...gQuestions] 
      : gQuestions.filter(g => g.level === dQlv);
  } else { // Specific grammar type selected
    filteredGrammarQuestions = dQlv === 'all' 
      ? gQuestions.filter(g => g.type === dQmd) 
      : gQuestions.filter(g => g.level === dQlv && g.type === dQmd);
  }
  gPool = shuffle(filteredGrammarQuestions);
  gIdx = 0;
}

function nextVocabQ() {
  if (!vPool.length) return null;
  const q = vPool[vIdx % vPool.length];
  vIdx++;
  if (vIdx >= vPool.length) {
    vPool = shuffle(vPool);
    vIdx = 0;
  }
  return q;
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
  if (dQmd === 'vocab') return { type: 'vocab', data: nextVocabQ() };
  
  // If a specific grammar type is selected, only draw from gPool
  if (dQmd === 'email_fill' || dQmd === 'job_define' || dQmd === 'logic_grammar' || dQmd === 'response_choice') {
    return { type: 'grammar', data: nextGrammarQ() };
  }

  // Mixed mode: alternate or random between vocab and all grammar types in gPool
  if (dQmd === 'mixed') {
    const hasVocab = vPool.length > 0;
    const hasGrammar = gPool.length > 0;

    if (hasVocab && (!hasGrammar || Math.random() < 0.5)) {
      return { type: 'vocab', data: nextVocabQ() };
    } else if (hasGrammar) {
      return { type: 'grammar', data: nextGrammarQ() };
    }
  }
  
  // Fallback if nothing else matches (e.g., if gQmd was 'grammar' but no specific type was chosen)
  return { type: 'grammar', data: nextGrammarQ() };
}

function startDungeon() {
  buildPools();
  
  // 如果題庫還沒載入，嘗試等待一下再開始
  if (vWords.length === 0 && gQuestions.length === 0) {
    dLog('⏳ 正在載入題庫，請稍候...', 'log-info');
    setTimeout(startDungeon, 500);
    return;
  }

  if (vPool.length + gPool.length < 2) {
    alert('題目不足（至少需要 2 題），請先新增單字或文法題！');
    return;
  }
  
  // 初始化戰鬥狀態
  Dungeon.active = true;
  Dungeon.wave = 1;
  Dungeon.gold = 200; // 初始金幣多一點
  Dungeon.castleHp = 200;
  Dungeon.maxCastleHp = 200;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.correctCount = 0;
  Dungeon.isWaveActive = false;
  
  // 重要：重置題目計數
  dQTot = 0;
  dQC = 0;
  dQW = 0;
  
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
  
  // 確保題目立即顯示
  setTimeout(renderDQ, 100);
  
  if (!animFrame) renderBattleCanvas();
}

function startNextWave() {
  Dungeon.waveSpawnTimer = 0;
  Dungeon.enemiesToSpawn = 5 + Dungeon.wave * 2;
  Dungeon.isWaveActive = true;
  Dungeon.waveTimer = 30 + Dungeon.wave * 5; // 每波基礎 30 秒 + 增量
  dLog(`🌊 第 ${Dungeon.wave} 波敵人正在靠近...`, 'log-info');
  updateBattleUI();
}

function updateBattleUI() {
  const floorChip = document.getElementById('floor-chip');
  if (floorChip) floorChip.textContent = `WAVE ${Dungeon.wave}`;
  
  const goldDisp = document.getElementById('exp-disp');
  if (goldDisp) goldDisp.textContent = Dungeon.gold;

  // 更新倒數計時
  const timerDisp = document.getElementById('wave-timer');
  if (timerDisp) {
    const mins = Math.floor(Dungeon.waveTimer / 60);
    const secs = Math.floor(Dungeon.waveTimer % 60);
    timerDisp.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // 更新主堡血量顯示 (重要：確保同步)
  const phpBar = document.getElementById('php-bar');
  const phpVal = document.getElementById('php-val');
  if (phpBar && phpVal) {
    const pct = Math.max(0, (Dungeon.castleHp / Dungeon.maxCastleHp) * 100);
    phpBar.style.width = pct + '%';
    phpVal.textContent = `${Math.max(0, Math.round(Dungeon.castleHp))}/${Dungeon.maxCastleHp}`;
    phpBar.classList.toggle('low', pct < 30);
  }
  
  // 更新敵方 HUD (顯示剩餘敵人數)
  const ehudName = document.getElementById('ehud-name');
  if (ehudName) ehudName.textContent = `剩餘敵人: ${Dungeon.enemiesToSpawn + Dungeon.enemies.length}`;
  
  // 檢查波次是否完成，敵人是否清空且時間到期
  // 此處不處理遊戲結束邏輯，由遊戲主循環判斷

  // 這裡只更新 UI，判斷遊戲勝負的邏輯應在遊戲主循環中
}

function updateSummonButtons() {
  // 這部分稍後在 HTML 增加按鈕後實作
}

function summonSoldier(type) {
  const spec = UNIT_TYPES[type];
  if (!spec) return;
  if (Dungeon.gold < spec.cost) {
    toast("金幣不足！", "var(--red)");
    return;
  }
  
  Dungeon.gold -= spec.cost;

  // 應用強化加成
  const up = player.upgrades?.[type] || { atk: 0, hp: 0, elem: 0 };
  const bonusAtk = (up.atk || 0) * 5;
  const bonusHp = (up.hp || 0) * 20;
  const bonusElem = (up.elem || 0) * 0.05;

  const s = {
    ...spec,
    id: type,
    hp: spec.hp + bonusHp,
    maxHp: spec.hp + bonusHp,
    atk: spec.atk + bonusAtk,
    elem_strength: (spec.elem_strength || 1.0) + bonusElem,
    x: 75, // 從左側主堡出發
    targetX: cvW - 100,
    state: "move",
    atkTimer: 0,
    element: spec.element // 確保屬性被正確賦予
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
  if (sz) sz.style.display = 'flex'; // 每一題開始時顯示技能區
  
  // 檢查 DOM 元素是否存在
  const dqpf = document.getElementById('dqpf');
  if (dqpf) dqpf.style.width = Math.min(100, dQTot * 5) + '%';
  
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
    // 如果在戰鬥中但沒題目，顯示提示
    document.getElementById('dqcard').innerHTML = `<div class="card" style="text-align:center;color:var(--red2)">題庫載入失敗或內容不足，請返回主選單確認。</div>`;
    return;
  }
  dIsGrammar = qItem.type === 'grammar';
  if (dIsGrammar) renderGrammarQ(qItem.data);
  else renderVocabQ(qItem.data);
}

function renderVocabQ(q) {
  const others = shuffle(vWords.filter(w => w.id !== q.id && w.word !== q.word)).slice(0, 3);
  const opts = shuffle([q, ...others]);
  const safe = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const lvBadge = {
    advanced: `<span class="badge by" style="font-size:9px">進階</span>`,
    intermediate: `<span class="badge bb" style="font-size:9px">中級</span>`,
    beginner: `<span class="badge bg" style="font-size:9px">初級</span>`
  };
  // Build blank sentence safely
  const parts = q.sentence.split('___');
  const sentHtml = parts.map((p, i) => esc(p) + (i < parts.length - 1 ? `<span class="q-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>` : '')).join('');
  let html = `<div class="q-head">⚔ 詞彙解密 ${lvBadge[q.level] || ''}</div>
  <div class="q-text">${sentHtml}</div>`;
  if (hasRelic('relic_compass')) {
    let done = false;
    opts.forEach(o => {
      if (o.id !== q.id && !done) {
        done = true;
        return;
      }
      html += `<button class="opt-btn" data-word="${esc(o.word)}" data-correct="${o.id === q.id ? '1' : '0'}" onclick="selDQ(this,'vocab','${safe(o.word)}','${safe(q.word)}',event)">${esc(o.word)}${o.pos ? ` <span style="color:var(--text2);font-size:12px">[${esc(o.pos)}]</span>` : ''}</button>`;
    });
  } else {
    html += opts.map(o => `<button class="opt-btn" data-word="${esc(o.word)}" data-correct="${o.id === q.id ? '1' : '0'}" onclick="selDQ(this,'vocab','${safe(o.word)}','${safe(q.word)}',event)">${esc(o.word)}${o.pos ? ` <span style="color:var(--text2);font-size:12px">[${esc(o.pos)}]</span>` : ''}</button>`).join('');
  }
  document.getElementById('dqcard').innerHTML = html;
}

function renderGrammarQ(q) {
  const labels = ['A', 'B', 'C', 'D'];
  let title = "🛡 語法重組";
  let contentHtml = "";

  // 根據多益題型調整顯示
  switch (q.type) {
    case 'email_fill':
      title = "📧 Email 填空";
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
      contentHtml = `<div class="q-text" style="font-size:15px; font-weight:600">${mkCW(q.question)}</div>`;
      break;
  }

  let html = `<div class="q-head">${title} ${q.tag ? `<span class="badge bp" style="font-size:9px">${esc(q.tag)}</span>` : ''}</div>
  ${contentHtml}`;
  
  html += q.options.map((o, i) => `<button class="opt-btn" data-idx="${i}" onclick="selDQ(this,'grammar',${i},${q.answer},event)"><strong style="color:var(--cyan)">${labels[i]}.</strong> ${mkCW(o)}</button>`).join('');
  document.getElementById('dqcard').innerHTML = html;
}

function selDQ(btn, type, sel, cor, evt) {
  if (dAnswered) return;
  dAnswered = true;
  dQTot++; // 增加總題數
  
  const ok = String(sel) === String(cor);
  const q = type === 'vocab' ? vPool[(vIdx - 1 + vPool.length) % vPool.length] : gPool[(gIdx - 1 + gPool.length) % gPool.length];

  if (ok) {
    dQC++;
    Dungeon.correctCount = (Dungeon.correctCount || 0) + 1;
    console.log("[Dungeon] Correct! Current count:", Dungeon.correctCount);
    const reward = 50 + (player.lv * 5); // 提高獎勵
    Dungeon.gold += reward;
    sfxCorrect();
    spawnFloat(`+$${reward}`, cvW * 0.5, cvH * 0.5, 'var(--gold)');
    updateBattleUI();
    
    if (type === 'vocab') vStats.correct = (vStats.correct || 0) + 1;
    else gStats.correct = (gStats.correct || 0) + 1;
  } else {
    dQW++;
    // 答錯懲罰：主堡生命減少
    const penalty = 20 + (player.lv * 5);
    Dungeon.castleHp -= penalty;
    sfxWrong(); // 播放錯誤音效
    spawnFloat(`-${penalty}HP`, 30, cvH * 0.5, 'var(--red)'); // 在主堡位置顯示扣血
    updateBattleUI(); // 更新 UI 顯示
    
    if (type === 'vocab') vStats.wrong = (vStats.wrong || 0) + 1;
    else gStats.wrong = (gStats.wrong || 0) + 1;
  }

  // Highlight options
  document.querySelectorAll('#dq-active .opt-btn').forEach(b => {
    b.disabled = true;
    if (type === 'vocab') {
      if (b.dataset.correct === '1') b.classList.add('correct');
      else if (b.dataset.word === String(sel) && !ok) b.classList.add('wrong');
    } else {
      const idx = parseInt(b.dataset.idx);
      if (idx === parseInt(cor)) b.classList.add('correct');
      else if (idx === parseInt(sel) && !ok) b.classList.add('wrong');
    }
  });

  // Feedback
  const fb = document.getElementById('dqfb');
  fb.style.display = 'block';
  fb.className = 'fb ' + (ok ? 'ok' : 'no');
  
  let explain = '';
  if (type === 'vocab') {
    explain = q?.zh || q?.def || '無詳細解釋。';
  } else { // grammar
    explain = q?.explain || '無詳細解釋。';
  }
  
  if (type === 'vocab') {
    const cWord = q?.word || '';
    fb.innerHTML = (ok ? `✅ 答對！+$${50 + player.lv*5}` : `❌ 答錯！正確答案是：<strong>${cWord}</strong>`) +
                   `<div class="fb-explain">${explain}</div>`;
    if (q?.sentence) speak(q.sentence.replace(/___/g, cWord));
  } else {
    fb.innerHTML = (ok ? `✅ 答對！+$${50 + player.lv*5}` : `❌ 答錯！正確答案是：<strong>${['A','B','C','D'][cor]}</strong>`) +
                   `<div class="fb-explain">${explain}</div>`;
  }

  // 顯示「繼續下一題」按鈕
  const nxt = document.getElementById('dqnxt');
  if (nxt) nxt.style.display = 'block';
}

function nextDQ() {
  // 在戰鬥模式中，單純渲染下一題
  renderDQ();
}

function continueDungeon() {
  // 戰鬥模式中的「繼續下一波」
  Dungeon.wave++;
  beginBattle();
}

function exitDungeon() {
  // 清理戰鬥狀態
  Dungeon.active = false;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  
  dqshow("dq-start");
  saveAll();
  dLog("🏃 已返回主選單。", "log-info");
}

// ══════════════════════════════════════════════
// DUNGEON LOG
// ══════════════════════════════════════════════
function endGame() {
  console.log("[Dungeon] endGame() called. Dungeon.correctCount:", Dungeon.correctCount);
  
  // 確保 player 物件存在且有必要的屬性
  if (!player) {
    console.error("Player data not found during endGame");
    return;
  }
  
  // 遊戲結束時的結算，無論是主堡血量歸零還是提早結束
  const wavesCompleted = Math.max(0, Dungeon.wave - 1);
  
  // 獎勵計算：每個完成波次 10 寶石，本輪每答對 1 題獎勵 2 寶石
  const rewardGems = (wavesCompleted * 10) + (Dungeon.correctCount * 2);
  
  // 增加寶石
  player.gems = Number(player.gems || 0) + Number(rewardGems);
  
  // 更新統計數據
  player.stats = player.stats || {};
  player.stats.totalWaves = Number(player.stats.totalWaves || 0) + Number(wavesCompleted);
  player.stats.totalCorrect = Number(player.stats.totalCorrect || 0) + Number(Dungeon.correctCount);
  
  console.log(`[EndGame] Reward: ${rewardGems} gems. Total: ${player.gems}`);
  
  // 更新 UI 顯示
  dqshow("dq-result");
  
  // 這裡需要確保在 DOM 更新後再設置文字
  const updateResultUI = () => {
    const resIco = document.getElementById("res-ico");
    if (resIco) resIco.textContent = "";
    
    const resTitle = document.getElementById("res-title");
    if (resTitle) resTitle.textContent = "戰鬥總結";
    
    const resScore = document.getElementById("res-score");
    if (resScore) resScore.textContent = `完成 ${wavesCompleted} 波`;
    
    const resMsg = document.getElementById("res-msg");
    if (resMsg) resMsg.textContent = `本輪答對 ${Dungeon.correctCount} 題，獲得 ${rewardGems} 💎`;
    
    // 隱藏繼續按鈕
    const contBtn = document.getElementById("btn-res-continue");
    if (contBtn) contBtn.style.display = "none";
  };
  
  updateResultUI();
  // 雙重保險：如果 UI 還沒出現，等一下再跑一次
  setTimeout(updateResultUI, 100);

  // 同步更新其他面板 UI
  const gemStat = document.getElementById("stat-gems");
  if (gemStat) gemStat.textContent = player.gems;
  
  if (typeof renderUpgradeMenu === 'function') renderUpgradeMenu();

  // 記錄日誌
  dLog(`🎮 戰鬥結束！完成 ${wavesCompleted} 波，本輪答對 ${Dungeon.correctCount} 題，獲得 ${rewardGems} 💎`, "log-gold");

  // 清理狀態
  Dungeon.active = false;
  Dungeon.soldiers = [];
  Dungeon.enemies = [];
  Dungeon.correctCount = 0; // 重置本輪答對數
  
  // 強制儲存
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
