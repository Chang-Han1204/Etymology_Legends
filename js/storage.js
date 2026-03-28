// ══════════════════════════════════════════════
// STORAGE SYSTEM
// 題庫 (vocab/grammar) → fetch 從伺服器載入（唯讀）
// 玩家進度 (player/vstats/gstats) → localStorage
// ══════════════════════════════════════════════

// ── 全域變數宣告（必須在此處宣告，其他檔案才能存取）──
var vWords     = [];
var gQuestions = [];
var gUsedIds   = []; // 已出過的題目 ID
var vStats     = { correct: 0, wrong: 0, ws: {} };
var gStats     = { correct: 0, wrong: 0, ws: {} };
var player     = null; // 由 initStorage 初始化

// ── 預設玩家資料 ──
const DEFAULT_PLAYER = {
  lv: 1, exp: 0, expNext: 100, floor: 1, totalFloors: 1,
  hp: 100, maxHp: 100,
  baseAtk: 10, baseDef: 5, critRate: 0.05,
  combo: 0, maxCombo: 0, wrongStreak: 0,
  stats: { 
    vocabKills: 0, grammarKills: 0, bossKills: 0,
    totalWaves: 0, totalCorrect: 0, totalWrong: 0,
    maxCombo: 0, totalGemsEarned: 0,
    typeStats: {}, 
    elementStats: { Water: 0, Fire: 0, Earth: 0 }
  },
  _bonusMaxHp: 0,
  protectedByPhoenix: false,
  gems: 0,
  upgrades: {},
};

const DEFAULT_VSTATS = { correct: 0, wrong: 0, ws: {} };
const DEFAULT_GSTATS = { correct: 0, wrong: 0, ws: {} };

// ── localStorage 鍵名 ──
const LS_KEYS = {
  player: 'lc2_player',
  vstats:  'lc2_vstats',
  gstats:  'lc2_gstats',
  used_ids: 'lc2_used_ids',
};

// ── 伺服器靜態檔案路徑 ──
const FILE_PATHS = {
  grammar: 'data/grammar.csv',
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
        currentRow.push(currentField);
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
      obj[header] = (values[index] || '').trim();
    });
    result.push(obj);
  }
  return result;
}

function parseGrammarOptions(optionsStr) {
  if (!optionsStr) return [];
  return optionsStr.split("|").map(opt => opt.trim());
}

function parseGrammarAnswer(answerStr) {
  const num = parseInt(answerStr);
  return isNaN(num) ? 0 : num;
}

// ══════════════════════════════════════════════
// 從伺服器載入靜態資料（唯讀）
// ══════════════════════════════════════════════
async function fetchVocab() {
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

function saveUsedIdsToLS() {
  try { localStorage.setItem(LS_KEYS.used_ids, JSON.stringify(gUsedIds)); }
  catch (e) {}
}

function saveAll() {
  console.log('[Storage] 儲存所有資料至 localStorage...');
  savePlayerToLS();
  saveVStatsToLS();
  saveGStatsToLS();
  saveUsedIdsToLS();
}

// ══════════════════════════════════════════════
// 玩家資料完整性檢查
// ══════════════════════════════════════════════
function ensurePlayerIntegrity() {
  Object.keys(DEFAULT_PLAYER).forEach(key => {
    if (!(key in player) || player[key] === undefined || player[key] === null) {
      if (typeof DEFAULT_PLAYER[key] === 'object' && !Array.isArray(DEFAULT_PLAYER[key])) {
        if (!player[key]) player[key] = JSON.parse(JSON.stringify(DEFAULT_PLAYER[key]));
      } else if (Array.isArray(DEFAULT_PLAYER[key])) {
        if (!player[key]) player[key] = [];
      } else {
        player[key] = DEFAULT_PLAYER[key];
      }
    }
  });

  if (!player.stats) player.stats = { vocabKills: 0, grammarKills: 0, bossKills: 0 };
  if (player.stats.totalWaves === undefined) player.stats.totalWaves = 0;
  if (player.stats.totalCorrect === undefined) player.stats.totalCorrect = 0;
  if (player.stats.totalWrong === undefined) player.stats.totalWrong = 0;
  if (player.stats.maxCombo === undefined) player.stats.maxCombo = 0;
  if (player.stats.totalGemsEarned === undefined) player.stats.totalGemsEarned = 0;
  if (!player.stats.typeStats) player.stats.typeStats = {};
  if (!player.stats.elementStats) player.stats.elementStats = { Water: 0, Fire: 0, Earth: 0 };

  if (!player.expNext) player.expNext = Math.round(100 * Math.pow(1.15, (player.lv || 1) - 1));
  if (!player.baseAtk) player.baseAtk = player.atk || DEFAULT_PLAYER.baseAtk;
  if (!player.baseDef) player.baseDef = player.def || DEFAULT_PLAYER.baseDef;
}

// ══════════════════════════════════════════════
// 主要初始化函數
// ══════════════════════════════════════════════
async function initStorage() {
  console.log('[Storage] 開始載入...');

  const [vocabData, grammarData] = await Promise.all([
    fetchVocab(),
    fetchGrammar(),
  ]);

  vWords     = vocabData;
  gQuestions = grammarData;

  console.log(`[Storage] 詞彙庫: ${vWords.length} 筆`);
  console.log(`[Storage] 文法題庫: ${gQuestions.length} 筆`);

  const savedPlayer = loadPlayerFromLS();
  if (savedPlayer) {
    player = savedPlayer;
  } else {
    player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  }
  ensurePlayerIntegrity();

  try {
    const rawV = localStorage.getItem(LS_KEYS.vstats);
    vStats = rawV ? JSON.parse(rawV) : { ...DEFAULT_VSTATS };
  } catch (e) { vStats = { ...DEFAULT_VSTATS }; }

  try {
    const rawG = localStorage.getItem(LS_KEYS.gstats);
    gStats = rawG ? JSON.parse(rawG) : { ...DEFAULT_GSTATS };
  } catch (e) { gStats = { ...DEFAULT_GSTATS }; }

  try {
    const rawU = localStorage.getItem(LS_KEYS.used_ids);
    gUsedIds = rawU ? JSON.parse(rawU) : [];
  } catch (e) { gUsedIds = []; }

  setTimeout(() => {
    if (typeof toast === 'function') {
      if (gQuestions.length > 0) {
        toast(`📚 題庫載入完成：${gQuestions.length} 道題目`, 'var(--green)');
      } else {
        toast('⚠️ 題庫載入失敗', 'var(--red)');
      }
    }
  }, 300);
}

// ══════════════════════════════════════════════
// 匯出 / 重置
// ══════════════════════════════════════════════
function exportData(type) {
  let data, title, fname;
  if (type === 'words') {
    data = vWords; title = '匯出單字庫'; fname = 'lexicon2_words.json';
  } else if (type === 'grammar') {
    data = gQuestions; title = '匯出文法題庫'; fname = 'lexicon2_grammar.json';
  } else {
    data = { words: vWords, grammar: gQuestions, vstats: vStats, gstats: gStats, player, used_ids: gUsedIds };
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
  localStorage.removeItem(LS_KEYS.used_ids);
  player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  ensurePlayerIntegrity();
  vStats = { ...DEFAULT_VSTATS };
  gStats = { ...DEFAULT_GSTATS };
  gUsedIds = [];
  if (typeof updateStatusPanel  === 'function') updateStatusPanel();
  if (typeof renderDataPanel    === 'function') renderDataPanel();
  if (typeof updateDungeonBar   === 'function') updateDungeonBar();
  if (typeof updateEnemyHud     === 'function') updateEnemyHud();
  if (typeof toast === 'function') toast('✅ 已重置', 'var(--gold)');
}

function saveJSONFile(path, data) {
  if (path.includes('player')) savePlayerToLS();
  else if (path.includes('vstats')) saveVStatsToLS();
  else if (path.includes('gstats')) saveGStatsToLS();
  return Promise.resolve(true);
}

initStorage().then(() => {
  if (typeof onStorageReady === 'function') {
    onStorageReady();
  }
});
