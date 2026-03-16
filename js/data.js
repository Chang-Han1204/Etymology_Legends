// ══════════════════════════════════════════════
// GAME DATA — Items, Enemies, Bosses, Classes
// ══════════════════════════════════════════════
const DEFAULT_ITEMS = {
  potion_small: { id: "potion_small", name: "小回復藥水", icon: "🧪", type: "consumable", rarity: "common", desc: "回復 20 HP", effect: { hp: 20 } },
  potion_med: { id: "potion_med", name: "中回復藥水", icon: "⚗️", type: "consumable", rarity: "uncommon", desc: "回復 50 HP", effect: { hp: 50 } },
  potion_large: { id: "potion_large", name: "大回復藥水", icon: "🫙", type: "consumable", rarity: "rare", desc: "回復 100 HP", effect: { hp: 100 } },
  elixir: { id: "elixir", name: "全復靈藥", icon: "✨", type: "consumable", rarity: "epic", desc: "完全回復 HP 與 MP", effect: { hp: 9999, mp: 9999 } },
  mp_potion: { id: "mp_potion", name: "魔力水晶", icon: "💎", type: "consumable", rarity: "uncommon", desc: "回復 30 MP", effect: { mp: 30 } },
  xp_tome: { id: "xp_tome", name: "智識典籍", icon: "📖", type: "consumable", rarity: "rare", desc: "獲得 200 EXP", effect: { exp: 200 } },
  revive: { id: "revive", name: "復活水晶", icon: "🔮", type: "consumable", rarity: "epic", desc: "戰鬥失敗時自動復活，HP 50%", effect: { revive: true } },
  bomb: { id: "bomb", name: "混亂炸彈", icon: "💣", type: "consumable", rarity: "uncommon", desc: "對目前怪物造成 50 點傷害", effect: { dmg: 50 } },
  mp_boost: { id: "mp_boost", name: "魔力強化卷軸", icon: "📜", type: "consumable", rarity: "uncommon", desc: "永久增加 10 最大 MP", effect: { maxMpUp: 10 } },
  hp_boost: { id: "hp_boost", name: "生命強化卷軸", icon: "📃", type: "consumable", rarity: "uncommon", desc: "永久增加 20 最大 HP", effect: { maxHpUp: 20 } },
  wooden_sword: { id: "wooden_sword", name: "木製長劍", icon: "🗡️", type: "weapon", rarity: "common", desc: "+5 攻擊力", effect: { atk: 5 }, slot: "weapon" },
  iron_sword: { id: "iron_sword", name: "鐵刃劍", icon: "⚔️", type: "weapon", rarity: "uncommon", desc: "+12 攻擊力", effect: { atk: 12 }, slot: "weapon" },
  magic_staff: { id: "magic_staff", name: "語法法杖", icon: "🪄", type: "weapon", rarity: "rare", desc: "+20 攻擊力，文法題傷害 +15%", effect: { atk: 20, grammarBonus: 0.15 }, slot: "weapon" },
  dragon_blade: { id: "dragon_blade", name: "龍語神劍", icon: "🔱", type: "weapon", rarity: "legendary", desc: "+35 攻擊力，暴擊率 +10%", effect: { atk: 35, crit: 0.1 }, slot: "weapon" },
  spell_tome: { id: "spell_tome", name: "咒語秘典", icon: "📕", type: "weapon", rarity: "rare", desc: "+15 攻擊，消耗 10 MP 額外攻擊", effect: { atk: 15, mpAtk: 10 }, slot: "weapon" },
  leather_armor: { id: "leather_armor", name: "皮革護甲", icon: "🛡️", type: "armor", rarity: "common", desc: "+8 防禦力", effect: { def: 8 }, slot: "armor" },
  chain_mail: { id: "chain_mail", name: "鎖子甲", icon: "🔗", type: "armor", rarity: "uncommon", desc: "+18 防禦力", effect: { def: 18 }, slot: "armor" },
  mage_robe: { id: "mage_robe", name: "語者長袍", icon: "👘", type: "armor", rarity: "rare", desc: "+12 防禦，最大HP +30", effect: { def: 12, maxHp: 30 }, slot: "armor" },
  holy_shield: { id: "holy_shield", name: "神聖盾牌", icon: "🔰", type: "armor", rarity: "epic", desc: "+30 防禦，受到傷害減少 20%", effect: { def: 30, dmgReduce: 0.2 }, slot: "armor" },
  mana_ring: { id: "mana_ring", name: "魔力戒指", icon: "💍", type: "armor", rarity: "uncommon", desc: "+25 最大MP，每題 MP+3", effect: { maxMp: 25, mpRegen: 3 }, slot: "armor" },
  treasure_map: { id: "treasure_map", name: "藏寶圖", icon: "🗺️", type: "special", rarity: "rare", desc: "使用後立即開啟一個寶箱", effect: { chest: true } },
};

const RELICS = [
  { id: "relic_phoenix", name: "鳳凰羽毛", icon: "🪶", desc: "連續答對 5 題，下次答錯不扣血", passive: "noHpLoss", rarity: "rare" },
  { id: "relic_wisdom", name: "賢者之石", icon: "🔮", desc: "每次答對額外獲得 +5 EXP", passive: "bonusExp", value: 5, rarity: "uncommon" },
  { id: "relic_thorns", name: "荊棘甲", icon: "🌵", desc: "受到傷害時反射 30% 傷害給怪物", passive: "thorns", value: 0.3, rarity: "rare" },
  { id: "relic_compass", name: "詞源羅盤", icon: "🧭", desc: "選項中永遠排除一個明顯錯誤答案", passive: "eliminateOne", rarity: "rare" },
  { id: "relic_scroll", name: "古老卷軸", icon: "📜", desc: "每次升級時完全回復 HP", passive: "levelHeal", rarity: "uncommon" },
  { id: "relic_crown", name: "知識王冠", icon: "👑", desc: "HP 低於 30% 時，攻擊力提升 50%", passive: "rageMode", rarity: "epic" },
  { id: "relic_star", name: "星辰護符", icon: "⭐", desc: "暴擊率永久 +15%", passive: "critBoost", value: 0.15, rarity: "rare" },
  { id: "relic_dragon", name: "龍魂碎片", icon: "🐉", desc: "對 Boss 造成的傷害提升 30%", passive: "bossSlayer", value: 0.3, rarity: "legendary" },
  { id: "relic_moon", name: "月之銀幣", icon: "🌙", desc: "每5層，隨機掉落一個道具", passive: "floorDrop", rarity: "uncommon" },
  { id: "relic_crystal", name: "記憶水晶", icon: "💠", desc: "連續答錯 2 題後，下一題自動顯示提示", passive: "hintOnFail", rarity: "rare" },
  { id: "relic_mirror", name: "命運之鏡", icon: "🪞", desc: "每10層地下城，自動開啟一個寶箱", passive: "autoChest", rarity: "epic" },
  { id: "relic_hourglass", name: "時之沙漏", icon: "⏳", desc: "MP 消耗技能冷卻縮短一半", passive: "mpCooldown", rarity: "uncommon" },
];

const ENEMIES_TIERS = [
  [
    { name: "文字幽靈", sprite: "👻", class: "初級", baseHp: 40, baseAtk: 6, baseDef: 2, exp: 15, drop: 0.3 },
    { name: "語法史萊姆", sprite: "🟢", class: "初級", baseHp: 50, baseAtk: 5, baseDef: 3, exp: 12, drop: 0.25 },
    { name: "拼字小鬼", sprite: "👹", class: "初級", baseHp: 35, baseAtk: 8, baseDef: 1, exp: 18, drop: 0.3 }
  ],
  [
    { name: "詞彙骷髏", sprite: "💀", class: "中級", baseHp: 80, baseAtk: 12, baseDef: 6, exp: 30, drop: 0.4 },
    { name: "語法蜘蛛", sprite: "🕷️", class: "中級", baseHp: 70, baseAtk: 15, baseDef: 4, exp: 28, drop: 0.4 },
    { name: "句型惡魔", sprite: "😈", class: "中級", baseHp: 90, baseAtk: 10, baseDef: 8, exp: 35, drop: 0.45 }
  ],
  [
    { name: "巨型文法獸", sprite: "🦖", class: "進階", baseHp: 130, baseAtk: 20, baseDef: 12, exp: 55, drop: 0.5 },
    { name: "詞根龍", sprite: "🐲", class: "進階", baseHp: 150, baseAtk: 18, baseDef: 15, exp: 65, drop: 0.5 }
  ],
  [
    { name: "語言巨人", sprite: "🧌", class: "精英", baseHp: 180, baseAtk: 28, baseDef: 18, exp: 90, drop: 0.6 },
    { name: "古代龍語者", sprite: "🐉", class: "精英", baseHp: 200, baseAtk: 25, baseDef: 20, exp: 100, drop: 0.6 }
  ],
];

const BOSSES = [
  { name: "過去式魔王", sprite: "🦹", class: "BOSS", baseHp: 200, baseAtk: 20, baseDef: 10, exp: 100, drop: 1.0, desc: "扭曲時態的黑暗存在，令人難以分辨過去與現在。" },
  { name: "假設語氣支配者", sprite: "🧿", class: "BOSS", baseHp: 260, baseAtk: 26, baseDef: 13, exp: 140, drop: 1.0, desc: "生活在「如果」世界中的神秘支配者。" },
  { name: "詞彙吞噬者", sprite: "👾", class: "BOSS", baseHp: 330, baseAtk: 32, baseDef: 16, exp: 170, drop: 1.0, desc: "吞噬一切詞彙的黑暗深淵。" },
  { name: "被動語態領主", sprite: "💀", class: "BOSS", baseHp: 400, baseAtk: 38, baseDef: 20, exp: 210, drop: 1.0, desc: "讓主動語氣消滅的無形支配者。" },
  { name: "終極語言混沌", sprite: "🌑", class: "FINAL BOSS", baseHp: 520, baseAtk: 48, baseDef: 26, exp: 320, drop: 1.0, desc: "語言世界的終極威脅，混沌的化身。" },
];

const CLASSES = [
  { lv: 1, name: "見習語言師", sprite: "🧑" },
  { lv: 3, name: "詞彙學徒", sprite: "🧙" },
  { lv: 5, name: "語法戰士", sprite: "⚔️" },
  { lv: 8, name: "語言術士", sprite: "🔮" },
  { lv: 12, name: "文法騎士", sprite: "🛡️" },
  { lv: 18, name: "詞源法師", sprite: "✨" },
  { lv: 25, name: "語言賢者", sprite: "🧝" },
  { lv: 35, name: "傳說翻譯官", sprite: "👑" },
  { lv: 50, name: "語源神聖", sprite: "🌟" },
  { lv: 99, name: "莎士比亞轉世", sprite: "📜" },
];

// Export for use in other modules
window.ENEMIES_TIERS = ENEMIES_TIERS;
window.BOSSES = BOSSES;
window.DEFAULT_ITEMS = DEFAULT_ITEMS;

// ══════════════════════════════════════════════
// CSV / JSON IMPORT (DEPRECATED UI)
// ══════════════════════════════════════════════
function openJsonModal(type) {
  document.getElementById('json-modal').classList.add('open');
  const titles = {
    vocab: '匯入單字庫 JSON',
    grammar: '匯入文法題庫 JSON',
    items: '匯入道具設定 JSON',
    player: '匯入角色進度 JSON',
    all: '匯入完整備份 JSON'
  };
  document.getElementById('json-modal-ttl').textContent = titles[type] || '匯入 JSON';
  
  const hints = {
    vocab: '貼入單字陣列 JSON，格式：[{ "word": "hello", "pos": "interjection", "def": "...", "zh": "...", "level": "beginner", "sentence": "..." }, ...]',
    grammar: '貼入文法題陣列 JSON，格式：[{ "question": "...", "options": ["...","...","...","..."], "answer": 0, "tag": "...", "explain": "...", "level": "beginner" }, ...]',
    items: '貼入道具物件 JSON，格式：{ "potion_small": { "name": "...", "icon": "...", "desc": "...", "type": "consumable", "rarity": "common", "effect": { "hp": 30 } }, ... }',
    player: '貼入角色進度 JSON，格式：{ "lv": 1, "exp": 0, "floor": 1, "hp": 100, "maxHp": 100, "mp": 50, "maxMp": 50, "atk": 10, "def": 5, "inventory": [], "equip": {}, "relics": [], "stats": {} }',
    all: '貼入完整備份 JSON，格式：{ "vocab": [...], "grammar": [...], "items": {}, "player": {}, "vstats": {}, "gstats": {} }'
  };
  document.getElementById('json-modal-hint').textContent = hints[type] || '';
  
  document.getElementById('json-modal-txt').value = '';
  document.getElementById('json-modal-result').textContent = '';
  document.getElementById('json-modal-btn').onclick = () => doJsonImport(type);
}

function closeJsonModal() {
  document.getElementById('json-modal').classList.remove('open');
}

function doJsonImport(type) {
  const raw = document.getElementById('json-modal-txt').value.trim();
  if (!raw) {
    toast('請貼上 JSON 資料', 'var(--red)');
    return;
  }
  try {
    const d = JSON.parse(raw);
    
    if (type === 'all') {
      // 完整備份匯入
      if (typeof d !== 'object') throw new Error('完整備份應為物件格式');
      if (d.vocab) {
        vWords = d.vocab;
        saveJSONFile('data/vocab.json', vWords);
      }
      if (d.grammar) {
        gQuestions = d.grammar;
        saveJSONFile('data/grammar.json', gQuestions);
      }
      if (d.items) {
        ITEMS = d.items;
        saveJSONFile('data/items.json', ITEMS);
      }
      if (d.player) {
        player = d.player;
        ensurePlayerIntegrity();
        saveJSONFile('data/player.json', player);
      }
      if (d.vstats) {
        vStats = d.vstats;
        saveJSONFile('data/vstats.json', vStats);
      }
      if (d.gstats) {
        gStats = d.gstats;
        saveJSONFile('data/gstats.json', gStats);
      }
      toast('✅ 匯入完整備份成功', 'var(--green)');
    } else if (type === 'vocab') {
      if (!Array.isArray(d)) throw new Error('單字庫應為陣列格式');
      vWords = d;
      saveJSONFile('data/vocab.json', vWords);
      toast('✅ 匯入單字庫成功', 'var(--green)');
    } else if (type === 'grammar') {
      if (!Array.isArray(d)) throw new Error('文法題庫應為陣列格式');
      gQuestions = d;
      saveJSONFile('data/grammar.json', gQuestions);
      toast('✅ 匯入文法題庫成功', 'var(--green)');
    } else if (type === 'items') {
      if (typeof d !== 'object' || Array.isArray(d)) throw new Error('道具設定應為物件格式');
      ITEMS = d;
      saveJSONFile('data/items.json', ITEMS);
      toast('✅ 匯入道具設定成功', 'var(--green)');
    } else if (type === 'player') {
      if (typeof d !== 'object' || Array.isArray(d)) throw new Error('角色進度應為物件格式');
      player = d;
      ensurePlayerIntegrity();
      saveJSONFile('data/player.json', player);
      toast('✅ 匯入角色進度成功', 'var(--green)');
    } else {
      throw new Error('未知的匯入類型');
    }
    
    updHeader();
    updateStatusPanel();
    renderInventory();
    renderVList();
    renderGList();
    renderVStats();
    renderGStats();
    renderDataPanel();
  } catch (e) {
    toast('❌ 匯入失敗：' + e.message, 'var(--red)');
  }
}

// ══════════════════════════════════════════════
// BATCH IMPORT
// ══════════════════════════════════════════════
function parseVocabRaw(raw) {
  raw = raw.trim();
  const results = [], errs = [];
  if (raw.startsWith('[')) {
    try {
      JSON.parse(raw).forEach((o, i) => {
        if (!o.word || !o.def) {
          errs.push(`第${i+1}筆缺少欄位`);
          return;
        }
        results.push(normV(o));
      });
    } catch (e) {
      errs.push('JSON 解析失敗：' + e.message);
    }
    return { results, errs };
  }
  raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).forEach((line, i) => {
    const p = line.split('|').map(x => x.trim());
    if (p.length < 3) {
      errs.push(`第${i+1}行不足`);
      return;
    }
    results.push(normV({
      word: p[0], pos: p[1], def: p[2], zh: p[3], level: p[4], sentence: p[5]
    }));
  });
  return { results, errs };
}

function normV(o) {
  return {
    id: Date.now() + Math.random() * 9999 | 0,
    word: (o.word || '').trim(),
    pos: (o.pos || '').trim(),
    def: (o.def || '').trim(),
    zh: (o.zh || '').trim(),
    sentence: (o.sentence || '').trim(),
    level: ['beginner', 'intermediate', 'advanced'].includes(o.level) ? o.level : 'intermediate'
  };
}

function importVocab() {
  const raw = document.getElementById('vimport').value;
  if (!raw.trim()) {
    alert('請先貼上資料');
    return;
  }
  const { results, errs } = parseVocabRaw(raw);
  let added = 0, skipped = 0;
  results.forEach(w => {
    if (vWords.find(x => x.word.toLowerCase() === w.word.toLowerCase())) {
      skipped++;
      return;
    }
    vWords.push(w);
    added++;
  });
  saveJSONFile('data/vocab.json', vWords);
  updHeader();
  const el = document.getElementById('vimport-result');
  el.textContent = `✓ 新增 ${added}，略過 ${skipped} 個重複${errs.length ? `，${errs.length} 筆錯誤` : ''}`;
  el.className = 'import-result ' + (added > 0 ? 'ok' : 'err');
  if (added > 0) {
    document.getElementById('vimport').value = '';
    toast('✅ 匯入 ' + added + ' 個單字！', 'var(--green)');
  }
}

function addOneVocab() {
  const w = document.getElementById('vaw').value.trim();
  const d = document.getElementById('vad').value.trim();
  if (!w || !d) {
    alert('請輸入單字與定義');
    return;
  }
  if (vWords.find(x => x.word.toLowerCase() === w.toLowerCase())) {
    toast('⚠️ 此單字已存在');
    return;
  }
  vWords.push({
    id: Date.now(),
    word: w,
    pos: document.getElementById('vap').value.trim(),
    def: d,
    zh: document.getElementById('vaz').value.trim(),
    sentence: document.getElementById('vas').value.trim(),
    level: document.getElementById('val').value
  });
  saveJSONFile('data/vocab.json', vWords);
  updHeader();
  ['vaw', 'vap', 'vad', 'vaz', 'vas'].forEach(x => document.getElementById(x).value = '');
  toast('✅ 已新增', 'var(--green)');
}

function parseGrammarRaw(raw) {
  raw = raw.trim();
  const results = [], errs = [];
  if (raw.startsWith('[')) {
    try {
      JSON.parse(raw).forEach((o, i) => {
        if (!o.question || !o.options) {
          errs.push(`第${i+1}筆錯誤`);
          return;
        }
        results.push(normG(o));
      });
    } catch (e) {
      errs.push('JSON 解析失敗：' + e.message);
    }
    return { results, errs };
  }
  raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).forEach((line, i) => {
    const p = line.split('|').map(x => x.trim());
    if (p.length < 6) {
      errs.push(`第${i+1}行不足6欄`);
      return;
    }
    const ansMap = { A: 0, B: 1, C: 2, D: 3 };
    const answer = ansMap[(p[5] || 'A').toUpperCase()] ?? 0;
    results.push(normG({
      question: p[0],
      options: [p[1], p[2], p[3], p[4]],
      answer,
      tag: p[6],
      explain: p[7],
      level: p[8]
    }));
  });
  return { results, errs };
}

function normG(o) {
  return {
    id: Date.now() + Math.random() * 9999 | 0,
    question: (o.question || '').trim(),
    options: (o.options || []).map(x => String(x).trim()),
    answer: typeof o.answer === 'number' ? o.answer : 0,
    tag: (o.tag || '').trim(),
    explain: (o.explain || '').trim(),
    level: ['beginner', 'intermediate', 'advanced'].includes(o.level) ? o.level : 'intermediate'
  };
}

function importGrammar() {
  const raw = document.getElementById('gimport').value;
  if (!raw.trim()) {
    alert('請先貼上資料');
    return;
  }
  const { results, errs } = parseGrammarRaw(raw);
  let added = 0, skipped = 0;
  results.forEach(g => {
    if (gQuestions.find(x => x.question === g.question)) {
      skipped++;
      return;
    }
    gQuestions.push(g);
    added++;
  });
  saveJSONFile('data/grammar.json', gQuestions);
  updHeader();
  const el = document.getElementById('gimport-result');
  el.textContent = `✓ 新增 ${added}，略過 ${skipped} 個重複${errs.length ? `，${errs.length} 筆錯誤` : ''}`;
  el.className = 'import-result ' + (added > 0 ? 'ok' : 'err');
  if (added > 0) {
    document.getElementById('gimport').value = '';
    toast('✅ 匯入 ' + added + ' 道題！', 'var(--green)');
  }
}

function addOneGrammar() {
  const q = document.getElementById('gaq').value.trim();
  const a = document.getElementById('gaa').value.trim();
  const b = document.getElementById('gab').value.trim();
  if (!q || !a || !b) {
    alert('請輸入題目與至少兩個選項');
    return;
  }
  if (gQuestions.find(x => x.question === q)) {
    toast('⚠️ 此題目已存在');
    return;
  }
  const c = document.getElementById('gac').value.trim();
  const d = document.getElementById('gad').value.trim();
  gQuestions.push({
    id: Date.now(),
    question: q,
    options: [a, b, c, d].filter(Boolean),
    answer: parseInt(document.getElementById('gaans').value),
    tag: document.getElementById('gatag').value.trim(),
    explain: document.getElementById('gaexp').value.trim(),
    level: document.getElementById('galv').value
  });
  saveJSONFile('data/grammar.json', gQuestions);
  updHeader();
  ['gaq', 'gaa', 'gab', 'gac', 'gad', 'gatag', 'gaexp'].forEach(x => document.getElementById(x).value = '');
  toast('✅ 已新增文法題', 'var(--green)');
}
