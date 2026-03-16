// ══════════════════════════════════════════════
// DUNGEON SYSTEM
// ══════════════════════════════════════════════
const Dungeon = { isBoss: false };
let currentEnemy = null;

function scaleEnemy(base, floor) {
  const e = JSON.parse(JSON.stringify(base));
  const scale = 1 + (floor || 1) * 0.06;
  e.hp = Math.round((e.baseHp || 40) * scale);
  e.maxHp = e.hp;
  e.atk = Math.round((e.baseAtk || 6) * (1 + (floor || 1) * 0.04));
  e.def = Math.round((e.baseDef || 2) * (1 + (floor || 1) * 0.04));
  return e;
}

function spawnEnemy(floor, isBoss) {
  if (isBoss) {
    const bi = Math.min(Math.floor((floor - 1) / 10), window.BOSSES.length - 1);
    return scaleEnemy(window.BOSSES[bi], floor);
  }
  const tier = Math.min(Math.floor((floor - 1) / 10), window.ENEMIES_TIERS.length - 1);
  const pool = window.ENEMIES_TIERS[tier];
  return scaleEnemy(pool[rnd(0, pool.length - 1)], floor);
}

// ── DROP SYSTEM ──
const DROP_POOLS = {
  common: ['potion_small', 'wooden_sword', 'leather_armor'],
  uncommon: ['potion_med', 'iron_sword', 'chain_mail', 'bomb', 'mp_potion', 'hp_boost', 'mp_boost'],
  rare: ['potion_large', 'magic_staff', 'mage_robe', 'xp_tome', 'treasure_map', 'revive', 'spell_tome'],
  epic: ['elixir', 'holy_shield', 'dragon_blade', 'revive'],
  legendary: ['dragon_blade']
};

function getDropTable(floor) {
  if (floor >= 30) return [['legendary', .03], ['epic', .12], ['rare', .3], ['uncommon', .35], ['common', .2]];
  if (floor >= 20) return [['epic', .06], ['rare', .2], ['uncommon', .4], ['common', .34]];
  if (floor >= 10) return [['rare', .1], ['uncommon', .35], ['common', .55]];
  return [['uncommon', .2], ['common', .8]];
}

function openChest(floor = 1) {
  const table = getDropTable(floor);
  let roll = Math.random(), rarity = 'common';
  for (const [r, p] of table) {
    roll -= p;
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  const pool = (DROP_POOLS[rarity] || DROP_POOLS.common).filter(id => ITEMS[id] !== undefined);
  if (!pool.length) return;
  const itemId = pool[rnd(0, pool.length - 1)];
  const item = ITEMS[itemId];
  if (item === undefined) return;
  addItem(itemId);
  document.getElementById('chest-ico').textContent = item.icon;
  const rarityColors = { common: 'var(--text)', uncommon: '#60e080', rare: '#80b0f0', epic: '#c080f0', legendary: 'var(--gold)' };
  document.getElementById('chest-nm').textContent = item.name;
  document.getElementById('chest-nm').style.color = rarityColors[rarity] || 'var(--text)';
  document.getElementById('chest-desc').textContent = item.desc;
  document.getElementById('chest-ov').classList.add('show');
  sfxChest();
  dLog(`📦 獲得 ${item.icon}${item.name}（${rarity}）`, 'log-gold');
}

function closeChest() {
  document.getElementById('chest-ov').classList.remove('show');
}

function addItem(id) {
  if (ITEMS[id] === undefined) return;
  const item = ITEMS[id];
  const inv = player.inventory;
  if (item.type === 'consumable' || item.type === 'special') {
    const ex = inv.find(i => i.id === id);
    if (ex) ex.qty = (ex.qty || 1) + 1;
    else inv.push({ id, qty: 1 });
  } else {
    // Equipment — add separately (allow multiples)
    inv.push({ id, qty: 1 });
  }
  saveAll();
}

function useItem(idx) {
  const invItem = player.inventory[idx];
  if (!invItem) return;
  const item = ITEMS[invItem.id];
  if (item === undefined) return;

  // 使用道具後隱藏詳細資訊提示
  hideItemTip();

  if (item.type === 'weapon' || item.type === 'armor') {
    // 檢查是否在地下城中
    const isDungeonActive = document.getElementById('dq-active').style.display === 'block';
    if (isDungeonActive) {
      toast('⚠️ 戰鬥中無法更換裝備，請離開地下城後再裝備。', 'var(--red)');
      return;
    }
    
    const slot = item.type;
    player.equip[slot] = invItem.id;
    // Remove from inventory
    player.inventory.splice(idx, 1);
    toast(`⚔️ 裝備：${item.icon} ${item.name}`);
    updateStatusPanel();
    saveAll();
    renderInventory();
    return;
  }

  if (item.type === 'consumable') {
    const e = item.effect || {};
    if (e.hp) healPlayer(e.hp);
    if (e.mp) healMp(e.mp);
    if (e.exp) gainExp(e.exp, cvW / 2, cvH * 0.5);
    if (e.maxHpUp) {
      player._bonusMaxHp = (player._bonusMaxHp || 0) + e.maxHpUp;
      player.maxHp = getMaxHp();
    }
    if (e.maxMpUp) {
      player._bonusMaxMp = (player._bonusMaxMp || 0) + e.maxMpUp;
      player.maxMp = getMaxMp();
    }
    if (e.dmg && currentEnemy) {
      currentEnemy.hp = Math.max(0, currentEnemy.hp - e.dmg);
      spawnFloat('-' + e.dmg, cvW * 0.7, cvH * 0.4, 'var(--orange)');
      triggerHitEffect('enemy');
      updateEnemyHud();
    }
    if (e.chest) openChest(player.floor);
    // Consume
    invItem.qty = (invItem.qty || 1) - 1;
    if (invItem.qty <= 0) player.inventory.splice(idx, 1);
    saveAll();
    renderInventory();
    toast(`🧪 使用：${item.icon} ${item.name}`);
    return;
  }
  if (item.type === 'special' && item.effect?.chest) {
    openChest(player.floor);
    invItem.qty = (invItem.qty || 1) - 1;
    if (invItem.qty <= 0) player.inventory.splice(idx, 1);
    saveAll();
    renderInventory();
  }
}

function tryRelicDrop(floor) {
  if (floor % 10 === 0) {
    const avail = RELICS.filter(r => !player.relics.includes(r.id));
    if (avail.length > 0) {
      const r = avail[rnd(0, Math.min(3, avail.length - 1))];
      player.relics.push(r.id);
      saveAll();
      dLog(`✨ 遺物：${r.icon}${r.name} — ${r.desc}`, 'log-gold');
      toast(`✨ 獲得遺物：${r.name}！`, `var(--purple)`);
    }
  }
  if (hasRelic('relic_moon') && floor % 5 === 0) openChest(floor);
}

// ── 魔力系統 ──
let activeMagic = { shield: false, burst: false };

function useMagic(type) {
  if (dAnswered) return;
  
  const costs = { shield: 20, burst: 30, heal: 40 };
  const cost = costs[type];
  
  if (player.mp < cost) {
    toast('MP 不足！', 'var(--red)');
    return;
  }
  
  player.mp -= cost;
  updateStatusPanel();
  
  if (type === 'shield') {
    activeMagic.shield = true;
    toast('🛡️ 語法護盾已啟動！', 'var(--blue)');
    dLog('🔮 施放【語法護盾】，將抵擋下次答錯受到的傷害。', 'log-info');
  } else if (type === 'burst') {
    activeMagic.burst = true;
    toast('💥 爆裂魔力充填！', 'var(--purple)');
    dLog('🔮 施放【爆裂魔力】，下次攻擊傷害大幅提升。', 'log-info');
  } else if (type === 'heal') {
    const healAmt = Math.round(getMaxHp() * 0.3);
    healPlayer(healAmt);
    toast(`💖 恢復了 ${healAmt} HP`, 'var(--green)');
    dLog(`🔮 施放【治癒術】，恢復了 ${healAmt} 點生命值。`, 'log-info');
  }
  
  sfxChest(); // 借用音效
  saveAll();
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

  document.getElementById('dq-info').textContent = `第 ${fl} 層${isBoss ? ' ⚠BOSS' : ''}  |  詞彙 ${vocabCount} 題 · 文法 ${grammarCount} 題（無限模式）`;
  
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
  const fl = player.floor || 1;
  const isBoss = fl % 10 === 0;
  buildPools();
  if (vPool.length + gPool.length < 2) {
    alert('題目不足，請先新增單字或文法題！');
    return;
  }
  dIsBoss = isBoss;
  currentEnemy = spawnEnemy(fl, isBoss);
  updateEnemyHud();
  if (isBoss) {
    document.getElementById('boss-spr').textContent = currentEnemy.sprite;
    document.getElementById('boss-nm').textContent = currentEnemy.name;
    document.getElementById('boss-desc').textContent = currentEnemy.desc || '強大的魔王出現了！';
    document.getElementById('boss-ov').classList.add('show');
    sfxBoss();
    return;
  }
  beginBattle();
}

function beginBattle() {
  document.getElementById('boss-ov').classList.remove('show');
  
  // 重置所有戰鬥相關計數器與狀態
  dQC = 0;
  dQW = 0;
  dQTot = 0;
  dAnswered = false;
  
  // 重要：強制還原「繼續」按鈕的點擊事件，防止被上一場戰鬥遺留的狀態改寫
  const nxtBtn = document.getElementById('dqnxt');
  if (nxtBtn) {
    nxtBtn.onclick = nextDQ;
    nxtBtn.textContent = '繼續 →';
    nxtBtn.style.display = 'none';
  }

  // 確保生成新怪物
  const currentFloor = player.floor || 1;
  const isBossFloor = currentFloor % 10 === 0;
  currentEnemy = spawnEnemy(currentFloor, isBossFloor);
  dIsBoss = isBossFloor;

  updateEnemyHud();
  dqshow('dq-active');
  dLog(`⚔️ ${dIsBoss ? '【BOSS戰！】' : ''}遭遇 ${currentEnemy.name}（HP:${currentEnemy.hp}）`, 'log-warn');
  renderDQ();
}

function dqshow(id) {
  ['dq-start', 'dq-active', 'dq-result'].forEach(s => document.getElementById(s).style.display = s === id ? 'block' : 'none');
}

function renderDQ() {
  dAnswered = false;
  const sz = document.getElementById('skill-zone');
  if (sz) sz.style.display = 'flex'; // 每一題開始時顯示技能區
  document.getElementById('dqpf').style.width = Math.min(100, dQTot * 5) + '%'; // rough 20q progress
  document.getElementById('dqpl').textContent = 'Q' + (dQTot + 1);
  document.getElementById('dqc').textContent = dQC;
  document.getElementById('dqw').textContent = dQW;
  document.getElementById('dqnxt').style.display = 'none';
  document.getElementById('dqfb').style.display = 'none';
  const qItem = nextQItem();
  if (!qItem || !qItem.data) {
    dLog('題目已用盡，請新增更多！', 'log-warn');
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
  if (!currentEnemy || currentEnemy.hp <= 0) return;

  dAnswered = true;
  const sz = document.getElementById('skill-zone');
  if (sz) sz.style.display = 'none'; // 作答後隱藏技能區
  
  dQTot++;
  const ok = String(sel) === String(cor);
  const q = type === 'vocab' ? vPool[(vIdx - 1 + vPool.length) % vPool.length] : gPool[(gIdx - 1 + gPool.length) % gPool.length];

  if (ok) {
    dQC++;
    player.combo = (player.combo || 0) + 1;
    if (player.combo > player.maxCombo) player.maxCombo = player.combo;
    player.wrongStreak = 0;
    if (hasRelic('relic_phoenix') && player.combo % 5 === 0) player.protectedByPhoenix = true;

    // 玩家攻擊怪物
    let { dmg, isCrit } = calculateDamage(dIsGrammar, dIsBoss);
    
    // 處理爆裂魔法效果
    if (activeMagic.burst) {
      dmg = Math.round(dmg * 2.2);
      isCrit = true; // 強制顯示爆擊特效
      activeMagic.burst = false;
      dLog('💥 【爆裂魔法】發動！造成巨大傷害！', 'log-info');
    }

    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    
    if (isCrit) {
      triggerCritEffect();
      sfxCorrect();
    } else {
      triggerHitEffect('enemy');
      sfxCorrect();
    }
    
    // 傷害文字位置修正：顯示在怪物（右側）上方
    spawnFloat((isCrit ? '暴擊! ' : '') + '-' + dmg, cvW * 0.75, cvH * 0.4, isCrit ? 'var(--orange)' : 'var(--red)');
    updateEnemyHud();

    // Stats & EXP
    if (type === 'vocab') {
      vStats.correct = (vStats.correct || 0) + 1;
      if (!vStats.ws[q?.word]) vStats.ws[q?.word] = { c: 0, w: 0 };
      vStats.ws[q.word].c++;
    } else {
      gStats.correct = (gStats.correct || 0) + 1;
      const tag = q?.tag || '其他';
      if (!gStats.ws[tag]) gStats.ws[tag] = { c: 0, w: 0 };
      gStats.ws[tag].c++;
    }

    const xp = Math.round((currentEnemy.exp || 10) * (dIsBoss ? 0.3 : 0.15) * (1 + (dQTot - 1) * 0.03));
    gainExp(xp, cvW * 0.5, cvH * 0.3); // EXP 顯示位置也修正
    
    const ar = player.equip.armor ? ITEMS[player.equip.armor] : null;
    if (ar?.effect?.mpRegen) healMp(ar.effect.mpRegen);
  } else {
    dQW++;
    player.combo = 0;
    player.wrongStreak = (player.wrongStreak || 0) + 1;
    
    // 怪物攻擊玩家
    const eDmg = calcEnemyDmg();
    damagePlayer(eDmg); // 內部已包含 spawnFloat 顯示在玩家位置

    if (type === 'vocab') {
      vStats.wrong = (vStats.wrong || 0) + 1;
      const wk = q?.word || String(cor);
      if (!vStats.ws[wk]) vStats.ws[wk] = { c: 0, w: 0 };
      vStats.ws[wk].w++;
    } else {
      gStats.wrong = (gStats.wrong || 0) + 1;
      const tag = q?.tag || '其他';
      if (!gStats.ws[tag]) gStats.ws[tag] = { c: 0, w: 0 };
      gStats.ws[tag].w++;
    }

    if (hasRelic('relic_crystal') && player.wrongStreak >= 2 && type === 'vocab' && q?.zh) {
      dLog(`💠 提示：${q.word} = ${q.zh}`, 'log-info');
    }
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
  if (type === 'vocab') {
    const cWord = ok ? q?.word : String(cor);
    const cDef = q?.def || '';
    const cZh = q?.zh || '';
    fb.innerHTML = ok
      ? `⚔️ 命中！<button class="spk" onclick="speak('${esc(cWord || '')}')">🔊</button> <strong>${esc(cWord)}</strong>${cZh ? ' (' + esc(cZh) + ')' : ''} — ${mkCW(cDef)}`
      : `💔 失敗 — 正確：<button class="spk" onclick="speak('${esc(cWord || '')}')">🔊</button> <strong>${esc(cWord)}</strong>${cZh ? ' (' + esc(cZh) + ')' : ''} — ${mkCW(cDef)}`;
    
    // 不論對錯都念正確答案的完整句子
    setTimeout(() => {
      // 詞彙題：播放填上正確答案後的完整句子
      const fullSentence = q?.sentence?.replace(/___/g, cWord) || cWord;
      speak(fullSentence);
    }, 500);
  } else {
    const labels = ['A', 'B', 'C', 'D'];
    const ci = parseInt(cor);
    let fbHtml = ok ? `⚔️ 命中！正確：<strong>${labels[ci]}. ${esc(q?.options?.[ci] || '')}</strong>`
      : `💔 失敗 — 正確：<strong>${labels[ci]}. ${esc(q?.options?.[ci] || '')}</strong>`;
    if (q?.explain) fbHtml += `<div class="fb-explain">📖 ${esc(q.explain)}</div>`;
    fb.innerHTML = fbHtml;
    
    // 不論對錯都念正確的完整語句
    setTimeout(() => {
      // 如果有提供 fullSentence 則朗讀，否則朗讀正確選項
      const textToSpeak = q?.fullSentence || q?.options?.[ci] || '';
      speak(textToSpeak);
    }, 500);
  }
  // MP cooldown tick
  if (player.mpSkillCooldown > 0) player.mpSkillCooldown--;
  
  // 確保繼續按鈕顯示
  document.getElementById('dqnxt').style.display = 'inline-flex';
  updateStatusPanel();
  saveAll();

  // 檢查怪物是否死亡，如果死亡則修改按鈕行為為「結算」
  if (currentEnemy && currentEnemy.hp <= 0) {
    const nxtBtn = document.getElementById('dqnxt');
    if (nxtBtn) {
      nxtBtn.onclick = handleEnemyDeath;
      nxtBtn.textContent = '擊敗敵人！點擊繼續 →';
    }
  } else {
    // 如果怪物還活著，確保按鈕行為是繼續下一題
    const nxtBtn = document.getElementById('dqnxt');
    if (nxtBtn) {
      nxtBtn.onclick = nextDQ;
      nxtBtn.textContent = '繼續 →';
    }
  }
}

function nextDQ() {
  if (player.hp <= 0) return;
  
  // 如果怪物已經在上一題被打死了，則進入結算流程
  if (!currentEnemy || currentEnemy.hp <= 0) {
    handleEnemyDeath();
    return;
  }
  
  // 確保按鈕事件正確（防禦性編程）
  const nxtBtn = document.getElementById('dqnxt');
  if (nxtBtn) {
    nxtBtn.onclick = nextDQ;
    nxtBtn.textContent = '繼續 →';
  }
  
  renderDQ();
}

function handleEnemyDeath() {
  if (!currentEnemy) return; // 防止重複觸發
  
  const fl = player.floor || 1;
  dLog(`✅ 擊敗 ${currentEnemy.name}！`, 'log-ok');
  
  // 記錄擊殺統計
  if (dIsBoss) {
    player.stats.bossKills = (player.stats.bossKills || 0) + 1;
  } else {
    // 區分詞彙怪和文法怪
    if (dIsGrammar) {
      player.stats.grammarKills = (player.stats.grammarKills || 0) + 1;
    } else {
      player.stats.vocabKills = (player.stats.vocabKills || 0) + 1;
    }
  }
  
  if (Math.random() < (currentEnemy.drop || 0.3)) openChest(fl);
  tryRelicDrop(fl);

  player.floor = fl + 1;
  player.totalFloors = Math.max(player.totalFloors || 0, player.floor);
  
  currentEnemy = null; // 重要：徹底移除舊對象
  Dungeon.isBoss = false;
  
  updateDungeonBar();
  updateEnemyHud();
  updateStatusPanel();
  saveAll();
  
  dqshow('dq-result');
  document.getElementById('res-ico').textContent = dIsBoss ? '🏆' : '⭐';
  document.getElementById('res-title').textContent = dIsBoss ? 'BOSS CLEARED!' : 'VICTORY!';
  document.getElementById('res-score').textContent = dQC + '/' + (dQC + dQW) + ' 答對';
  document.getElementById('res-msg').textContent = `已前進至第 ${player.floor} 層`;
  
  // 更新下一場是否為 Boss 的狀態
  dIsBoss = player.floor % 10 === 0;
}

function exitDungeon() {
  if (!confirm('確定逃跑？已獲得的 EXP 和道具保留。')) return;
  player.combo = 0;
  player.wrongStreak = 0;
  Dungeon.isBoss = false;
  currentEnemy = null;
  // 逃跑後回到當前 10 層的開頭（例如 15 層逃跑回到 11 層）
  const currentFloor = player.floor || 1;
  player.floor = Math.max(1, Math.floor((currentFloor - 1) / 10) * 10 + 1);
  // 逃跑後恢復部分血量和魔力
  const healAmt = Math.round(getMaxHp() * 0.3);
  healPlayer(healAmt);
  healMp(Math.round(getMaxMp() * 0.3));
  dqshow('dq-start');
  updateEnemyHud();
  updateDungeonBar();
  saveAll();
  dLog('🏃 逃跑了，回到第 ' + player.floor + ' 層...', 'log-warn');
}

// ══════════════════════════════════════════════
// DUNGEON LOG
// ══════════════════════════════════════════════
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