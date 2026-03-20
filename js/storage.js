// ══════════════════════════════════════════════
// STORAGE SYSTEM
// 題庫 (vocab/grammar/items) → fetch 從伺服器載入（唯讀）
// 玩家進度 (player/vstats/gstats) → localStorage
// ══════════════════════════════════════════════

// ── 全域變數宣告（必須在此處宣告，其他檔案才能存取）──
var vWords     = [];
var gQuestions = [];
var ITEMS      = {};
var vStats     = { correct: 0, wrong: 0, ws: {} };
var gStats     = { correct: 0, wrong: 0, ws: {} };
var player     = null; // 由 initStorage 初始化

// ── 預設玩家資料 ──
const DEFAULT_PLAYER = {
  lv: 1, exp: 0, expNext: 100, floor: 1, totalFloors: 1,
  hp: 100, maxHp: 100, mp: 50, maxMp: 50,
  baseAtk: 10, baseDef: 5, critRate: 0.05,
  combo: 0, maxCombo: 0, wrongStreak: 0,
  inventory: [], equip: { weapon: null, armor: null },
  relics: [], stats: { vocabKills: 0, grammarKills: 0, bossKills: 0 },
  _bonusMaxHp: 0, _bonusMaxMp: 0,
  protectedByPhoenix: false, mpSkillCooldown: 0,
  gems: 0,
  upgrades: {
    // 儲存每個士兵種類的強化等級
    // 屬性改為 atk, hp, elem (屬性強度)
  },
};

const DEFAULT_VSTATS = { correct: 0, wrong: 0, ws: {} };
const DEFAULT_GSTATS = { correct: 0, wrong: 0, ws: {} };

// ── localStorage 鍵名 ──
const LS_KEYS = {
  player: 'lc2_player',
  vstats:  'lc2_vstats',
  gstats:  'lc2_gstats',
};

// ── 伺服器靜態檔案路徑 ──
const FILE_PATHS = {
  grammar: 'data/grammar.csv',
  items:   'data/items.json',
};

// ══════════════════════════════════════════════
// CSV 解析
// ══════════════════════════════════════════════
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentField); // Keep raw content including spaces
        currentField = '';
        i++;
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim() !== '')) rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r') i += 2;
        else i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim() !== '')) rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const result = [];
  for (let j = 1; j < rows.length; j++) {
    const values = rows[j];
    if (values.length < headers.length) continue;
    const obj = {};
    headers.forEach((header, index) => {
      // Trim only for certain columns, or globally if preferred.
      // Here we trim values as CSV standard often ignores leading/trailing spaces outside quotes.
      obj[header] = (values[index] || '').trim();
    });
    result.push(obj);
  }
  return result;
}

// Keep only one definition for parseGrammarOptions
function parseGrammarOptions(optionsStr) {
  if (!optionsStr) return [];
  return optionsStr.split("|").map(opt => opt.trim());
}

function parseGrammarAnswer(answerStr) {
  const num = parseInt(answerStr);
  return isNaN(num) ? 0 : num;
}

function parseEffect(effectStr) {
  if (!effectStr) return {};
  const cleanStr = effectStr.replace(/"/g, '');
  const effects = {};
  cleanStr.split('|').forEach(effect => {
    const [key, value] = effect.split(':');
    if (key && value !== undefined) {
      const numValue = parseFloat(value.trim());
      effects[key.trim()] = isNaN(numValue) ? value.trim() : numValue;
    }
  });
  return effects;
}

// ══════════════════════════════════════════════
// 從伺服器載入靜態資料（唯讀）
// ══════════════════════════════════════════════
async function fetchVocab() {
  // Vocab 功能已併入 Grammar
  return [];
}

async function fetchGrammar() {
  try {
    const res = await fetch(FILE_PATHS.grammar);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = parseCSV(text);
    return data.map(item => ({
      id: item.id || String(Date.now() + Math.random()),
      type: item.type || 'logic_grammar',
      question: item.question || '',
      options: parseGrammarOptions(item.options),
      answer: parseGrammarAnswer(item.answer),
      tag: item.tag || '',
      explain: item.explain || '',
      level: item.level || 'beginner',
      fullSentence: item.fullSentence || '',
    })).filter(item => item.question);
  } catch (e) {
    console.error('[Storage] fetchGrammar failed:', e);
    return [];
  }
}

async function fetchItems() {
  try {
    const res = await fetch(FILE_PATHS.items);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('[Storage] fetchItems failed, using DEFAULT_ITEMS:', e);
    return (typeof DEFAULT_ITEMS !== 'undefined') ? DEFAULT_ITEMS : {};
  }
}

// ══════════════════════════════════════════════
// 玩家進度：讀寫 localStorage
// ══════════════════════════════════════════════
function loadPlayerFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEYS.player);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('[Storage] loadPlayerFromLS failed:', e); }
  return null;
}

function savePlayerToLS() {
  try { localStorage.setItem(LS_KEYS.player, JSON.stringify(player)); }
  catch (e) { console.error('[Storage] savePlayerToLS failed:', e); }
}

function saveVStatsToLS() {
  try { localStorage.setItem(LS_KEYS.vstats, JSON.stringify(vStats)); }
  catch (e) {}
}

function saveGStatsToLS() {
  try { localStorage.setItem(LS_KEYS.gstats, JSON.stringify(gStats)); }
  catch (e) {}
}

// saveAll：統一儲存介面（全專案呼叫此函數）
function saveAll() {
  console.log('[Storage] 儲存所有資料至 localStorage...');
  savePlayerToLS();
  saveVStatsToLS();
  saveGStatsToLS();
}

// ══════════════════════════════════════════════
// 玩家資料完整性檢查
// ══════════════════════════════════════════════
function ensurePlayerIntegrity() {
  Object.keys(DEFAULT_PLAYER).forEach(key => {
    if (!(key in player) || player[key] === undefined || player[key] === null) {
      // 跳過 equip 這種物件型態，避免覆蓋
      if (typeof DEFAULT_PLAYER[key] === 'object' && !Array.isArray(DEFAULT_PLAYER[key])) {
        if (!player[key]) player[key] = JSON.parse(JSON.stringify(DEFAULT_PLAYER[key]));
      } else if (Array.isArray(DEFAULT_PLAYER[key])) {
        if (!player[key]) player[key] = [];
      } else {
        player[key] = DEFAULT_PLAYER[key];
      }
    }
  });
  // 確保關鍵欄位存在
  if (!player.inventory) player.inventory = [];
  if (!player.equip) player.equip = { weapon: null, armor: null };
  if (player.equip.weapon === undefined) player.equip.weapon = null;
  if (player.equip.armor === undefined) player.equip.armor = null;
  if (!player.relics) player.relics = [];
  if (!player.stats) player.stats = { vocabKills: 0, grammarKills: 0, bossKills: 0 };
  if (!player.expNext) player.expNext = Math.round(100 * Math.pow(1.15, (player.lv || 1) - 1));
  // baseAtk / baseDef：兼容舊存檔（舊版用 atk/def）
  if (!player.baseAtk) player.baseAtk = player.atk || DEFAULT_PLAYER.baseAtk;
  if (!player.baseDef) player.baseDef = player.def || DEFAULT_PLAYER.baseDef;
}

// ══════════════════════════════════════════════
// 主要初始化函數
// ══════════════════════════════════════════════
async function initStorage() {
  console.log('[Storage] 開始載入...');

  // 平行載入題庫與道具（加速啟動）
  const [vocabData, grammarData, itemsData] = await Promise.all([
    fetchVocab(),
    fetchGrammar(),
    fetchItems(),
  ]);

  vWords     = vocabData;
  gQuestions = grammarData;
  ITEMS      = itemsData;

  console.log(`[Storage] 詞彙庫: ${vWords.length} 筆`);
  console.log(`[Storage] 文法題庫: ${gQuestions.length} 筆`);
  console.log(`[Storage] 道具: ${Object.keys(ITEMS).length} 種`);

  // 從 localStorage 載入玩家進度
  const savedPlayer = loadPlayerFromLS();
  if (savedPlayer) {
    player = savedPlayer;
    console.log(`[Storage] 玩家存檔：Lv.${player.lv}，第 ${player.floor} 層`);
  } else {
    player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
    console.log('[Storage] 無存檔，使用新玩家');
  }
  ensurePlayerIntegrity();

  // 從 localStorage 載入統計
  try {
    const rawV = localStorage.getItem(LS_KEYS.vstats);
    vStats = rawV ? JSON.parse(rawV) : { ...DEFAULT_VSTATS };
  } catch (e) { vStats = { ...DEFAULT_VSTATS }; }

  try {
    const rawG = localStorage.getItem(LS_KEYS.gstats);
    gStats = rawG ? JSON.parse(rawG) : { ...DEFAULT_GSTATS };
  } catch (e) { gStats = { ...DEFAULT_GSTATS }; }

  // 載入完成提示
  setTimeout(() => {
    if (typeof toast === 'function') {
      if (gQuestions.length > 0) {
        toast(`📚 題庫載入完成：${gQuestions.length} 道題目`, 'var(--green)');
      } else {
        toast('⚠️ 題庫載入失敗，請確認 data/ 資料夾與 CSV 檔案存在', 'var(--red)');
      }
    }
  }, 300);
}

// ══════════════════════════════════════════════
// 匯出 / 重置（供 interface.js 使用）
// ══════════════════════════════════════════════
function exportData(type) {
  let data, title, fname;
  if (type === 'words') {
    data = vWords; title = '匯出單字庫'; fname = 'lexicon2_words.json';
  } else if (type === 'grammar') {
    data = gQuestions; title = '匯出文法題庫'; fname = 'lexicon2_grammar.json';
  } else if (type === 'items') {
    data = ITEMS; title = '匯出道具設定'; fname = 'lexicon2_items.json';
  } else {
    data = { words: vWords, grammar: gQuestions, vstats: vStats, gstats: gStats, player, items: ITEMS };
    title = '完整備份'; fname = 'lexicon2_backup.json';
  }
  const exportTtl = document.getElementById('export-ttl');
  const modalTxt  = document.getElementById('modal-txt');
  if (exportTtl) exportTtl.textContent = title;
  if (modalTxt)  modalTxt.value = JSON.stringify(data, null, 2);
  window._modalFile = fname;
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.add('open');
}

function resetData() {
  if (!confirm('確定完全重置？所有進度都會清空，不可復原。')) return;
  localStorage.removeItem(LS_KEYS.player);
  localStorage.removeItem(LS_KEYS.vstats);
  localStorage.removeItem(LS_KEYS.gstats);
  player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  ensurePlayerIntegrity();
  vStats = { ...DEFAULT_VSTATS };
  gStats = { ...DEFAULT_GSTATS };
  if (typeof updateStatusPanel  === 'function') updateStatusPanel();
  if (typeof renderInventory    === 'function') renderInventory();
  if (typeof renderDataPanel    === 'function') renderDataPanel();
  if (typeof updateDungeonBar   === 'function') updateDungeonBar();
  if (typeof updateEnemyHud     === 'function') updateEnemyHud();
  if (typeof toast === 'function') toast('✅ 已重置', 'var(--gold)');
}

// ══════════════════════════════════════════════
// 兼容性函數（避免其他模組呼叫時出錯）
// ══════════════════════════════════════════════

// saveJSONFile：舊程式碼呼叫時不再觸發下載，改為 localStorage
function saveJSONFile(path, data) {
  if (path.includes('player')) savePlayerToLS();
  else if (path.includes('vstats')) saveVStatsToLS();
  else if (path.includes('gstats')) saveGStatsToLS();
  // vocab / grammar / items 是唯讀題庫，不需要儲存
  return Promise.resolve(true);
}

// loadLS / saveLS（utils.js 也有定義，以 utils.js 為主；此處備用）
if (typeof loadLS === 'undefined') {
  function loadLS(key, def) {
    try {
      const r = localStorage.getItem(key);
      if (r) return JSON.parse(r);
    } catch (e) {}
    return typeof def === 'function' ? def() : (def !== undefined ? JSON.parse(JSON.stringify(def)) : null);
  }
}
if (typeof saveLS === 'undefined') {
  function saveLS(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }
}

// ── 啟動 ──
initStorage().then(() => {
  if (typeof onStorageReady === 'function') {
    onStorageReady();
  }
});
