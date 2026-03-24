// ══════════════════════════════════════════════
// CANVAS BATTLE RENDERER — 獵魔村物語 Style
// ══════════════════════════════════════════════
const cvs = document.getElementById('battle-canvas');
const ctx2 = cvs.getContext('2d');
window.cvW = 0;
window.cvH = 0;

function resizeCanvas() {
  window.cvW = cvs.offsetWidth || cvs.parentElement?.offsetWidth || 400;
  window.cvH = 140;
  cvs.width = Math.round(window.cvW * window.devicePixelRatio);
  cvs.height = Math.round(window.cvH * window.devicePixelRatio);
  ctx2.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  cvs.style.height = window.cvH + 'px';
  //dLog(`[Canvas] resizeCanvas: cvW=${window.cvW}, cvH=${window.cvH}`);
}
window.addEventListener('resize', () => { resizeCanvas(); if (!animFrame) renderBattleCanvas(); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resizeCanvas);
else resizeCanvas();


const CHAR_SPRITES = {
  player: {
    pixels: [
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,2,2,2,2,2,2,0,0],
      [0,0,2,2,2,2,2,2,0,0],
      [0,0,3,3,3,3,3,3,0,0],
      [0,0,3,4,3,3,4,3,0,0],
      [0,0,3,3,3,3,3,3,0,0],
      [0,0,0,3,5,5,3,0,0,0],
      [0,0,0,5,5,5,5,0,0,0],
      [0,0,0,6,6,6,6,0,0,0],
      [0,0,6,6,6,6,6,6,0,0],
      [0,0,6,6,7,6,7,6,0,0],
      [0,0,0,8,8,0,8,8,0,0],
    ],
    colors:['transparent','#2a1a08','#1a1005','#d8c090','#1a0808','#b89060','#282018','#1a1410','#1e1810']
  },
  mage: {
    pixels: [
      [0,0,0,1,0,0,0,0,0,0],
      [0,0,1,1,1,0,0,0,0,0],
      [0,1,1,1,1,1,0,0,0,0],
      [1,1,1,1,1,1,1,0,0,0],
      [0,0,2,2,2,2,2,0,0,0],
      [0,0,2,3,2,3,2,0,0,0],
      [0,0,2,2,2,2,2,0,0,0],
      [0,4,4,4,4,4,4,4,0,0],
      [0,4,4,4,4,4,4,4,0,0],
      [0,4,4,5,4,5,4,4,0,0],
      [0,0,4,4,4,4,4,0,0,0],
      [0,0,6,6,0,6,6,0,0,0],
    ],
    colors:['transparent','#1a0838','#e8d8b0','#cc44ff','#5010a0','#ff80ff','#0a0020']
  },
  archer: {
    pixels: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,2,2,2,2,1,0,3,0],
      [1,2,2,2,2,2,2,1,3,0],
      [1,2,4,2,2,4,2,1,3,0],
      [1,2,2,2,2,2,2,1,3,0],
      [0,1,5,5,5,5,1,0,3,0],
      [0,6,6,6,6,6,6,0,3,0],
      [0,6,6,6,6,6,6,6,3,6],
      [0,6,6,7,6,6,7,6,0,0],
      [0,0,8,8,0,0,8,8,0,0],
    ],
  colors: ['transparent','#2c3e50','#d8c090','#a0522d','#1a0808','#b89060','#27ae60','#1a1410','#1e1810']
  },
  wyvern: {
    pixels: [
      [0,0,1,1,0,0,0,0,0,1,1,0],
      [0,1,2,2,1,0,0,0,1,2,2,1],
      [1,2,2,2,2,1,1,1,2,2,2,2],
      [1,2,3,3,2,2,2,2,2,3,3,2],
      [0,1,2,2,4,4,4,4,2,2,1,0],
      [0,0,1,4,5,4,5,4,1,0,0,0],
      [0,0,0,1,4,4,4,1,0,0,0,0],
      [0,0,1,0,1,1,0,1,0,0,0,0],
    ],
    colors: ['transparent','#4b0082','#8a2be2','#ff00ff','#1a1a1a','#ffffff']
  },
  paladin: {
    pixels: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,2,2,2,2,1,0,0,0],
      [1,3,2,2,2,2,3,1,0,0],
      [1,3,2,4,4,2,3,1,0,0],
      [5,5,1,2,2,1,5,5,0,0],
      [5,6,1,7,7,1,6,5,0,0],
      [5,6,6,7,7,6,6,5,0,0],
      [5,6,6,7,7,6,6,5,0,0],
      [0,1,6,6,6,6,1,0,0,0],
      [0,1,6,7,7,6,1,0,0,0],
      [0,0,8,8,0,8,8,0,0,0],
      [0,8,8,0,0,0,8,8,0,0],
    ],
    colors: ['transparent','#2c3e50','#bdc3c7','#f1c40f','#34495e','#d4af37','#95a5a6','#ecf0f1','#7f8c8d']
  },
  cleric: {
    pixels: [
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,1,2,2,2,1,0,3,0],
      [0,1,2,2,2,2,2,1,3,0],
      [0,1,2,4,2,4,2,1,5,0],
      [0,1,2,2,2,2,2,1,3,0],
      [0,0,1,6,6,6,1,0,3,0],
      [0,1,6,6,6,6,6,1,0,0],
      [0,1,7,7,7,7,7,1,0,0],
      [1,7,7,7,7,7,7,7,1,0],
      [1,7,7,7,7,7,7,7,1,0],
      [0,1,8,8,1,8,8,1,0,0],
    ],
    colors: ['transparent','#2980b9','#d8c090','#f1c40f','#1a0808','#ffffff','#3498db','#ecf0f1','#2c3e50']
  },
  reaper: {
    pixels: [
      [0,0,1,1,1,1,0,2,2,2],
      [0,1,3,3,3,3,1,2,0,0],
      [1,3,4,3,3,4,3,1,0,0],
      [1,3,3,3,3,3,3,1,0,0],
      [1,3,3,1,1,3,3,1,0,0],
      [0,1,5,5,5,5,1,0,0,0],
      [0,5,5,5,5,5,5,0,0,0],
      [0,5,5,5,5,5,5,0,0,0],
      [0,5,5,5,5,5,5,0,0,0],
      [0,5,5,5,5,5,5,0,0,0],
      [0,1,0,0,0,0,1,0,0,0],
    ],
    colors: ['transparent','#000000','#95a5a6','#2c3e50','#ff0000','#1a1a1a']
  },
  mimic: {
    pixels: [
      [0,1,1,1,1,1,1,1,1,0],
      [1,2,2,2,2,2,2,2,2,1],
      [1,3,4,3,4,3,4,3,2,1],
      [1,5,5,5,5,5,5,5,2,1],
      [0,1,1,1,6,6,1,1,1,0],
      [1,7,7,7,6,6,7,7,7,1],
      [1,7,8,7,7,7,7,8,7,1],
      [1,7,7,7,7,7,7,7,7,1],
      [1,2,2,2,2,2,2,2,2,1],
      [0,1,1,1,1,1,1,1,1,0],
    ],
    colors: ['transparent','#2a1a08','#5d4037','#ffffff','#f44336','#ffeb3b','#d32f2f','#3e2723','#6d4c41']
  },
  hero: {
    pixels: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,2,2,2,2,1,0,0,0], // 金髮
      [0,1,3,4,3,4,1,0,0,0], 
      [0,1,3,3,3,3,1,0,0,0],
      [5,5,1,6,6,1,0,7,0,0], // 5 是紅披風, 7 是劍
      [5,5,1,6,6,1,0,7,0,0],
      [5,5,1,6,6,1,1,7,1,0],
      [0,0,1,6,6,1,0,7,0,0],
      [0,0,1,6,6,1,0,7,0,0],
      [0,1,1,8,8,1,1,0,0,0],
      [0,1,8,0,0,8,1,0,0,0],
    ],
    colors: ['transparent', '#1a1410', '#f1c40f', '#ffe0bd', '#333333', '#e74c3c', '#2980b9', '#bdc3c7', '#5d4037']
  },
  assassin: {
    pixels: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,2,2,2,2,1,0,0,0], // 蒙面頭部
      [0,1,2,3,2,3,1,0,0,0], // 眼睛露出
      [0,1,1,1,1,1,1,0,0,0],
      [4,0,1,5,5,1,0,4,0,0], // 4 是匕首
      [1,4,1,5,5,1,4,1,0,0],
      [0,1,1,5,5,1,1,0,0,0],
      [0,0,1,5,5,1,0,0,0,0],
      [0,0,1,5,5,1,0,0,0,0],
      [0,1,1,0,0,1,1,0,0,0],
      [1,1,0,0,0,0,1,1,0,0],
    ],
    colors: ['transparent', '#000000', '#2c3e50', '#ff0000', '#bdc3c7', '#1a1a1a']
    // 3: 紅色殺氣眼神, 4: 銀色匕首
  },
  fire_wisp: {
    pixels: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,3,2,1,0],
      [1,2,3,4,4,3,2,1], // 4 是最熱的中心(白)
      [1,2,3,4,4,3,2,1],
      [0,1,2,3,3,2,1,0],
      [0,0,1,2,2,1,0,0],
      [0,1,0,1,1,0,1,0], // 底部火花
    ],
    colors: ['transparent', '#900c3f', '#c70039', '#ff5733', '#ffffff']
  },
  ice_golem: {
    pixels: [
      [0,1,1,1,1,1,1,0],
      [1,2,2,2,2,2,2,1],
      [1,2,3,3,3,3,2,1],
      [1,2,3,4,4,3,2,1], // 4 是冰晶閃光
      [1,2,3,3,3,3,2,1],
      [1,2,2,2,2,2,2,1],
      [1,1,2,2,2,2,1,1],
      [0,1,5,5,5,5,1,0], // 5 是厚實的底部
      [0,1,5,0,0,5,1,0],
    ],
    colors: ['transparent', '#2e86c1', '#85c1e9', '#aed6f1', '#ffffff', '#1b4f72']
  },
  hydra: {
    pixels: [
      [1,1,0,0,1,1,0,0,1,1], // 三個頭的頂部
      [1,2,1,0,1,2,1,0,1,2,1],
      [1,3,1,1,1,3,1,1,1,3,1], // 眼睛
      [0,1,4,4,1,4,4,1,4,4,1], // 脖子
      [0,0,1,4,4,1,4,4,1,0],
      [0,0,1,5,5,5,5,5,1,0], // 身體匯合
      [0,1,5,5,5,5,5,5,5,1],
      [1,5,5,6,6,6,6,6,5,5,1], // 腹部紋路
      [1,5,5,5,5,5,5,5,5,5,1],
      [0,1,1,1,1,1,1,1,1,1,0],
    ],
    colors: ['transparent', '#145a32', '#229954', '#ff0000', '#27ae60', '#1d8348', '#f1c40f']
    // 3: 紅眼, 6: 黃色腹部
  },
  slime: {
    pixels: [
      [0,0,0,1,1,1,1,0,0],
      [0,0,1,2,2,2,2,1,0],
      [0,1,2,2,2,2,2,2,1],
      [1,2,2,3,2,2,3,2,2],
      [1,2,2,2,2,2,2,2,2],
      [1,2,4,2,2,2,4,2,2],
      [0,1,2,2,2,2,2,1,0],
      [0,0,1,1,4,1,1,0,0],
      [0,0,0,0,4,0,0,0,0],
    ],
    colors:['transparent','#0c2208','#208020','#ffffff','#104010']
  },
  skeleton: {
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [0,1,2,3,2,3,2,1],
      [0,1,2,2,2,2,2,1],
      [0,0,1,4,4,4,1,0],
      [0,0,5,5,5,5,5,0],
      [0,0,5,6,5,6,5,0],
      [0,0,5,5,5,5,5,0],
      [0,0,7,0,0,0,7,0],
      [0,0,7,0,0,0,7,0],
      [0,7,0,0,0,0,0,7],
    ],
    colors:['transparent','#1a1008','#d0c080','#1a0808','#e8dca0','#a09060','#806840','#604828']
  },
  ghost: {
    pixels: [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,2,3,2,3,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,1,2,1,2,1,2],
      [0,1,0,1,0,1,0,1],
    ],
    colors:['transparent','rgba(140,120,200,0.45)','rgba(200,180,255,0.55)','#e0c0ff']
  },
  spider: {
    pixels: [
      [1,0,0,2,2,0,0,1],
      [0,1,2,2,2,2,1,0],
      [1,2,2,3,3,2,2,1],
      [2,2,3,4,4,3,2,2],
      [1,2,2,3,3,2,2,1],
      [0,1,2,2,2,2,1,0],
      [1,0,1,0,0,1,0,1],
      [0,0,1,0,0,1,0,0],
    ],
    colors:['transparent','#1a0808','#501008','#cc2020','#ff4040']
  },
  demon: {
    pixels: [
      [0,1,0,0,0,0,1,0],
      [0,1,2,2,2,2,1,0],
      [1,2,2,3,2,3,2,1],
      [1,2,2,2,2,2,2,1],
      [0,1,2,4,2,4,2,1],
      [0,0,5,5,5,5,0,0],
      [0,5,5,5,5,5,5,0],
      [0,5,5,6,5,6,5,0],
      [0,0,5,5,0,5,5,0],
      [0,0,1,0,0,0,1,0],
    ],
    colors:['transparent','#800010','#c02020','#ff4040','#ffe060','#601018','#802028']
  },
  dragon: {
    pixels: [
      [1,0,0,0,0,0,0,0,1,0],
      [1,2,0,0,0,0,0,2,1,0],
      [1,2,2,0,0,0,2,2,1,0],
      [0,1,2,2,3,3,2,2,1,0],
      [0,0,1,3,4,4,3,1,0,0],
      [0,0,1,3,5,3,5,3,1,0],
      [0,0,0,1,6,6,6,1,0,0],
      [0,0,1,0,1,1,0,1,0,0],
      [0,1,0,0,0,0,0,0,1,0],
    ],
    colors:['transparent','#601010','#982018','#c03020','#e05030','#ff8040','#ff2000']
  },
  boss: {
    pixels: [
      [0,1,0,0,2,2,0,0,1,0],
      [0,1,2,3,3,3,3,2,1,0],
      [1,2,3,3,3,3,3,3,2,1],
      [1,2,3,4,3,3,4,3,2,1],
      [1,2,3,3,5,3,5,3,2,1],
      [0,1,2,3,3,3,3,2,1,0],
      [0,6,6,6,6,6,6,6,6,0],
      [6,6,6,7,6,6,7,6,6,6],
      [6,6,6,6,6,6,6,6,6,6],
      [0,6,6,6,6,6,6,6,6,0],
      [0,0,8,8,0,0,8,8,0,0],
    ],
    colors:["transparent","#2a0850","#5010a0","#200030","#9030f0","#ff10ff","#180028","#8020cc","#d8c890"]
  },
  assassin: { // 新增刺客外觀
    pixels: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,2,3,2,2,1,0],
      [1,2,3,4,2,3,2,1],
      [1,2,3,3,3,3,2,1],
      [0,1,3,5,5,3,1,0],
      [0,0,1,5,5,1,0,0],
      [0,0,0,6,6,0,0,0],
      [0,6,6,0,0,6,6,0],
    ],
    colors:["transparent","#1a1a1a","#3a3a3a","#7f8c8d","#bdc3c7","#c0392b","#1a1410"]
  }
};

function drawPixelChar(spec, x, y, px, flipX = false, element = null) {
  if (!spec) return;
  const { pixels, colors } = spec;
  const rows = pixels.length, cols = pixels[0].length;
  
  // 屬性濾鏡效果
  if (element && ELEMENTS[element.toUpperCase()]) {
    ctx2.save();
    // 使用簡單的疊加色來區分屬性，而不是複雜的色相旋轉，以保持效能
    // 或者我們可以在繪製後套用 globalCompositeOperation
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = pixels[r][c];
      if (ci === 0 || !colors[ci] || colors[ci] === 'transparent') continue;
      
      let color = colors[ci];
      // 如果有屬性，對非透明色進行微調（排除皮膚色或白色等）
      if (element) {
        const elCfg = ELEMENTS[element.toUpperCase()];
        if (elCfg && ci > 1) { // 假設 0 是透明，1 是輪廓，>1 是填色
           // 這裡可以根據屬性稍微混合顏色，但為了簡單，我們直接在角色下方畫個光環或改變特定顏色
        }
      }

      ctx2.fillStyle = color;
      const dc = flipX ? cols - 1 - c : c;
      // 使用 Math.ceil(px) 稍微擴大像素塊，消除子像素渲染產生的黑線間隙
      ctx2.fillRect(Math.round(x + dc * px), Math.round(y + r * px), Math.ceil(px), Math.ceil(px));
    }
  }
  
  // 在角色腳下畫屬性光環
  if (element) {
    const elCfg = ELEMENTS[element.toUpperCase()];
    ctx2.globalAlpha = 0.3;
    ctx2.fillStyle = elCfg.color;
    ctx2.beginPath();
    ctx2.ellipse(x + (cols * px) / 2, y + rows * px, (cols * px) / 1.5, 4, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.globalAlpha = 1.0;
    
    // 畫屬性圖示
    ctx2.font = "10px Arial";
    ctx2.fillText(elCfg.icon, x - 5, y + 5);
  }
}

function getEnemySprite(enemy) {
  if (!enemy) return null;
  const n = enemy.name || "";
  const cls = enemy.class || "";
  if (cls === 'FINAL BOSS' || cls === 'BOSS') return CHAR_SPRITES.boss;
  // 新增的敵人外觀判斷
  if (enemy.sprite && CHAR_SPRITES[enemy.sprite]) return CHAR_SPRITES[enemy.sprite];

  if (n.includes("龍") || n.includes("古代") || n.includes("語言巨人") || n.includes("吞噬")) return CHAR_SPRITES.dragon;
  if (n.includes("骷髏") || n.includes("詞彙骷髏")) return CHAR_SPRITES.skeleton;
  if (n.includes("幽靈") || n.includes("文字幽靈")) return CHAR_SPRITES.ghost;
  if (n.includes("蜘蛛") || n.includes("語法蜘蛛")) return CHAR_SPRITES.spider;
  if (n.includes("惡魔") || n.includes("句型") || n.includes("被動") || n.includes("假設") || n.includes("支配")) return CHAR_SPRITES.demon;
  if (n.includes("巨型") || n.includes("詞根")) return CHAR_SPRITES.dragon;
  if (cls === '精英') return CHAR_SPRITES.demon;
  if (cls === '進階') return CHAR_SPRITES.dragon;
  if (cls === '中級') return CHAR_SPRITES.skeleton;
  return CHAR_SPRITES.slime;
}

function getPlayerSprite() {
  const lv = (typeof player !== 'undefined' && player?.lv) || 1;
  return lv >= 8 ? CHAR_SPRITES.mage : CHAR_SPRITES.player;
}

// 根據士兵 ID 取得對應外觀
function getSoldierSprite(s) {
  if (s.sprite && CHAR_SPRITES[s.sprite]) return CHAR_SPRITES[s.sprite];
  return CHAR_SPRITES.player; // 戰士使用預設外觀
}

let battleAnim = { playerShake:0, enemyShake:0, flash:0, flashColor:'#fff', bg:0, particles:[], torchT:0 };
let animFrame = null;

function drawCastleHpBar(x, y, px) {
  const pct = (Dungeon.castleHp || 0) / (Dungeon.maxCastleHp || 100);
  // 縮短寬度，從 30*px 降至 15*px，使其更貼合單個塔樓的寬度
  const w = px * 20; // 再次調整寬度，使其更貼近邊緣
  const h = px * 1.5; // 維持較短高度
  
  // 背景/邊框
  ctx2.fillStyle = 'rgba(0,0,0,0.8)';
  ctx2.fillRect(x - w/2, y, w, h);
  
  // 血量條
  const barColor = pct > 0.6 ? '#4cbc4c' : (pct > 0.3 ? '#eab830' : '#f03040');
  ctx2.fillStyle = barColor;
  const fillW = Math.max(0, (w - 2) * pct);
  ctx2.fillRect(x - w + 15, y + 1, fillW, h - 2);
}

function renderBattleCanvas() {
  if (!cvs) return;
  if (cvW === 0) resizeCanvas();
  if (cvW === 0) { animFrame = requestAnimationFrame(renderBattleCanvas); return; }
  
  const W = cvW, H = cvH;
  const t = Date.now() * 0.001;

  // 1. 更新邏輯 (僅在戰鬥中)
  if (typeof Dungeon !== "undefined" && Dungeon.active) {
    updateBattleLogic();
  }

  ctx2.clearRect(0, 0, W, H);

  // 2. 渲染背景 (使用標題畫面的背景系統)
  const spec = ETYMOLOGY_LEGENDS_TITLE;
  const rows = spec.pixels.length;
  const cols = spec.pixels[0].length;
  
  // 背景漸層：極致深邃的夜空
  const skyGrad = ctx2.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#050505');
  skyGrad.addColorStop(1, '#101015');
  ctx2.fillStyle = skyGrad;
  ctx2.fillRect(0, 0, W, H);

  // 同步比例計算
  const px = Math.min(W / cols, H / rows);
  const startX = (W - cols * px) / 2;
  const startY = (H - rows * px) / 2;
  const groundRow = 20; 
  // 修復 currentGY 計算，確保角色站在正確的地面高度
  const currentGY = startY + (groundRow * px);

  // 繪製像素場景 (建築物等)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = spec.pixels[r][c];
      if (ci === 0) continue;
      
      ctx2.globalAlpha = 1.0;
      if (ci === 11) ctx2.globalAlpha = 0.4 + Math.abs(Math.sin(t * 4)) * 0.6;
      else if (ci === 12 || ci === 8) ctx2.globalAlpha = 0.8 + Math.random() * 0.2;

      ctx2.fillStyle = spec.colors[ci];
      ctx2.fillRect(startX + c * px, startY + r * px, Math.ceil(px), Math.ceil(px));
    }
  }
  ctx2.globalAlpha = 1.0;

  // 3. 根據狀態渲染內容
  if (typeof Dungeon !== "undefined" && Dungeon.active) {
    // 戰鬥畫面：渲染單位
    
    // 繪製城堡血條 (精確定位在左側城堡塔樓的正上方)
    // 根據 ETYMOLOGY_LEGENDS_TITLE 的像素定義，左側主塔約在 x=10 附近
    drawCastleHpBar(startX + 17.5 * px, startY + 6 * px, px); // 將血條位置調整為更低，並向右微調以適應新寬度

    // 渲染士兵
    Dungeon.soldiers.forEach(s => {
      const sprite = getSoldierSprite(s);
      const sRows = sprite.pixels.length;
      const pxS = (H / 5) / sRows; // 基礎大小佔畫面 1/5 高度
      const sH = sRows * pxS;
      
      // 將邏輯座標 (0-120) 轉換為實際畫布像素座標
      let drawX = startX + s.x * px; 
      
      // 視覺補償：閒置時增加微小擺動（僅限渲染偏移，不影響邏輯座標）
      if (s.state === "idle") {
        drawX += Math.sin(s.idleTimer || 0) * 1.5; 
      }

      drawPixelChar(sprite, drawX, currentGY - sH, pxS, false, s.element);
      drawUnitHp(drawX, currentGY - sH - 4 * px, s.hp, s.maxHp, "#4cbc4c");
    });

    // 渲染敵人
    Dungeon.enemies.forEach(e => {
      const sprite = getEnemySprite(e) || CHAR_SPRITES.slime;
      const eRows = sprite.pixels.length;
      const pxE = (H / 5) / eRows; // 基礎大小佔畫面 1/5 高度
      const eH = eRows * pxE;
      // 將邏輯座標 (0-120) 轉換為實際畫布像素座標
      const drawX = startX + e.x * px;
      drawPixelChar(sprite, drawX, currentGY - eH, pxE, true, e.element);
      drawUnitHp(drawX, currentGY - eH - 4 * px, e.hp, e.maxHp, "#f03040");
    });
  } else {
    // 標題畫面：渲染文字
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    const centerX = W / 2;
    const centerY = H / 2;

    // 標題發光背景
    const titleGlow = ctx2.createRadialGradient(centerX, centerY, 0, centerX, centerY, px * 40);
    titleGlow.addColorStop(0, 'rgba(241, 196, 15, 0.15)');
    titleGlow.addColorStop(1, 'transparent');
    ctx2.fillStyle = titleGlow;
    ctx2.fillRect(0, 0, W, H);

    // 主標題
    ctx2.font = `italic bold ${px * 10}px "Georgia", serif`;
    ctx2.shadowColor = 'black';
    ctx2.shadowBlur = 10;
    const textGrad = ctx2.createLinearGradient(centerX - px * 20, 0, centerX + px * 20, 0);
    textGrad.addColorStop(0, '#5dade2'); 
    textGrad.addColorStop(1, '#ec7063');
    ctx2.fillStyle = textGrad;
    ctx2.fillText('Etymology Legends', centerX, centerY - px * 2);

    // 副標題
    ctx2.shadowBlur = 0;
    ctx2.font = `bold ${px * 3.5}px monospace`;
    ctx2.fillStyle = '#f1c40f';
    ctx2.fillText('🛡️ DEFEND THE ROOT ⚔️', centerX, centerY + px * 6);
  }

  // 粒子與特效
  battleAnim.particles = battleAnim.particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.038; p.vy += 0.2;
    if (p.life <= 0) return false;
    ctx2.globalAlpha = Math.max(0, p.life); ctx2.fillStyle = p.color;
    ctx2.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    ctx2.globalAlpha = 1; return true;
  });

  battleAnim.bg++;
  animFrame = requestAnimationFrame(renderBattleCanvas);
}

function drawUnitHp(x, y, hp, max, color) {
  const w = 24;
  ctx2.fillStyle = 'rgba(0,0,0,0.6)';
  ctx2.fillRect(x, y, w, 4);
  const hpW = Math.max(0, (w - 2) * (hp / max));
  ctx2.fillStyle = color;
  ctx2.fillRect(x + 1, y + 1, hpW, 2);
}

function updateBattleLogic() {
  // dLog(`[Canvas] updateBattleLogic: soldiers=${Dungeon.soldiers.length}, enemies=${Dungeon.enemies.length}, castleHp=${Dungeon.castleHp}`);
  
  // 使用背景像素比例進行邏輯判定 (背景寬 120 像素)
  const logicalW = 120; 

  // 為了 spawnFloat 統一座標計算
  const W = cvW, H = cvH;
  const spec = ETYMOLOGY_LEGENDS_TITLE;
  const cols = spec.pixels[0].length;
  const rows = spec.pixels.length;
  const px = Math.min(W / cols, H / rows);
  const startX = (W - cols * px) / 2;
  const startY = (H - rows * px) / 2;
  const groundRow = 18; // 更新 groundRow 為 18
  const gY = startY + groundRow * px; 
  
  // 更新波次倒數計時
  if (Dungeon.isWaveActive) {
    Dungeon.waveTimer -= 1/60; // 假設 60 FPS
    if (Dungeon.waveTimer <= 0) {
      Dungeon.waveTimer = 0;
      // 時間到，如果不生怪了且沒敵人，就進下一波
      if (Dungeon.enemiesToSpawn === 0 && Dungeon.enemies.length === 0) {
        // 交給後面的波次結束邏輯處理
      } else if (Dungeon.enemiesToSpawn > 0) {
        // 時間到強制生完剩餘敵人
        while(Dungeon.enemiesToSpawn > 0) {
          spawnWaveEnemy();
          Dungeon.enemiesToSpawn--;
        }
      }
    }
    if (Math.floor(Dungeon.waveTimer * 60) % 60 === 0) updateBattleUI();
  }

  // 生成敵人
  if (Dungeon.isWaveActive && Dungeon.enemiesToSpawn > 0) {
    Dungeon.waveSpawnTimer++;
    if (Dungeon.waveSpawnTimer > 120) { // 每 2 秒生一隻
      spawnWaveEnemy();
      Dungeon.enemiesToSpawn--;
      Dungeon.waveSpawnTimer = 0;
      updateBattleUI();
    }
  }

  // 士兵移動與戰鬥
  Dungeon.soldiers.forEach((s) => {
    let nearestEnemy = null;
    let attackRange = s.range || 30; // 使用單位自定義的攻擊距離
    let minDist = attackRange;
    
    Dungeon.enemies.forEach(e => {
      const dist = Math.abs(e.x - s.x); // 使用絕對距離
      if (dist < minDist) {
        nearestEnemy = e;
        minDist = dist;
      }
    });

    if (nearestEnemy) {
      s.state = 'atk';
      s.atkTimer = (s.atkTimer || 0) + 1;
      // 根據職業調整攻擊速度 (弓箭手較快)
      const atkSpeed = s.id === 'archer' ? 40 : 60;
      if (s.atkTimer > atkSpeed) {
        // 屬性計算
        let finalAtk = s.atk;
        let effectMsg = "";
        let effectColor = "#fff";

        if (s.element && nearestEnemy.element) {
          const sEl = ELEMENTS[s.element.toUpperCase()];
          const eEl = ELEMENTS[nearestEnemy.element.toUpperCase()];
          
          if (sEl.counters === nearestEnemy.element) {
            // 屬性強度影響克制倍率: 基礎 2.0x，每 0.05 強度增加額外倍率
            const multiplier = 1.0 + (s.elem_strength || 1.0);
            finalAtk *= multiplier;
            effectMsg = multiplier >= 2.5 ? "ELEMENT BURST!" : "CRITICAL!";
            effectColor = "#ffeb3b";
          } else if (eEl.counters === s.element) {
            finalAtk *= 0.5;
            effectMsg = "WEAK...";
            effectColor = "#aaa";
          }
        }
        
        nearestEnemy.hp -= finalAtk;
        
        // 浮動文字位置需轉換為畫布座標
        const currentW = cvW, currentH = cvH;
        const currentSpec = ETYMOLOGY_LEGENDS_TITLE;
        const currentPx = Math.min(currentW / 120, currentH / currentSpec.pixels.length);
        const currentStartX = (currentW - 120 * currentPx) / 2;
        const currentGroundRow = 18; // 使用正確的 groundRow
        const currentGY = (currentH - currentSpec.pixels.length * currentPx) / 2 + currentGroundRow * currentPx; 

        if (effectMsg) spawnFloat(effectMsg, currentStartX + nearestEnemy.x * currentPx, currentGY - 60, effectColor);

        if (s.id === "archer") {
          // 弓箭手特效：從士兵飛向敵人
          spawnFloat(`🎯`, currentStartX + s.x * currentPx + 20, currentGY - 50, "#60e080");
          spawnFloat(`-${Math.round(finalAtk)}`, currentStartX + nearestEnemy.x * currentPx, currentGY - 40, effectColor);
        } else {
          spawnFloat(`-${Math.round(finalAtk)}`, currentStartX + nearestEnemy.x * currentPx, currentGY - 40, effectColor);
        }
        
        const hitColor = s.element ? ELEMENTS[s.element.toUpperCase()].color : "#ffffff";
        triggerHitEffect("enemy", currentStartX + nearestEnemy.x * currentPx, hitColor);
        s.atkTimer = 0;
      }
    } else {
      s.state = "move";
      // 士兵原地待命邏輯：根據 range 決定待命位置，加大偏移量
      const baseIdleX = logicalW * 0.45;
      // 加大偏移：近戰(range=30)在 54, 遠程(range=150)在 54 - (120/2) = -6 (會被限制在 20)
      const rangeOffset = Math.max(0, (s.range - 30) * 0.5); 
      const targetIdleX = Math.max(12, baseIdleX - rangeOffset);

      if (s.x < targetIdleX - 2) { // 稍微留一點緩衝區
        s.x += s.speed;
      } else if (s.x > targetIdleX + 2) {
        s.x -= s.speed;
      } else {
        s.state = "idle";
        s.x = targetIdleX; // 鎖定邏輯座標，避免漂移
        s.idleTimer = (s.idleTimer || 0) + 0.03; // 僅更新計時器
      }
    }
  });

  // 敵人移動與戰鬥
  Dungeon.enemies.forEach((e) => {
    let nearestSoldier = null;
    let minDist = 6; // 攻擊距離 (邏輯像素單位)
    
    Dungeon.soldiers.forEach(s => {
      const dist = e.x - s.x;
      if (dist > -2 && dist < minDist) {
        nearestSoldier = s;
        minDist = dist;
      }
    });

    if (nearestSoldier) {
      e.atkTimer = (e.atkTimer || 0) + 1;
      if (e.atkTimer > 70) {
        nearestSoldier.hp -= e.atk; 
        
        // 浮動文字位置需轉換為畫布座標
        const currentW = cvW, currentH = cvH;
        const currentSpec = ETYMOLOGY_LEGENDS_TITLE;
        const currentPx = Math.min(currentW / 120, currentH / currentSpec.pixels.length);
        const currentStartX = (currentW - 120 * currentPx) / 2;
        const drawX = currentStartX + nearestSoldier.x * currentPx; // 將邏輯座標轉換為渲染座標

        spawnFloat(`-${e.atk}`, drawX, currentH * 0.5, "#f00");
        triggerHitEffect("player", drawX);
        e.atkTimer = 0;
      }
    } else if (e.x > 10) { // 城堡門口微調為邏輯座標 10，確保視覺與邏輯平衡
      e.x -= e.speed;
    } else {
      // 撞擊主堡
      Dungeon.castleHp -= e.atk * 2;
      
      const currentW = cvW, currentH = cvH;
      const currentSpec = ETYMOLOGY_LEGENDS_TITLE;
      const currentPx = Math.min(currentW / 120, currentH / currentSpec.pixels.length);
      const currentStartX = (currentW - 120 * currentPx) / 2;

      spawnFloat(`-${Math.round(e.atk*2)}`, currentStartX + 10 * currentPx, currentH * 0.5, "#f00"); // 修正城堡門口的渲染座標
      e.hp = 0; 
      updateBattleUI();
      if (Dungeon.castleHp <= 0) endGame();
    }
  });

  // 清除死亡單位
  Dungeon.soldiers = Dungeon.soldiers.filter(s => s.hp > 0);
  Dungeon.enemies = Dungeon.enemies.filter(e => e.hp > 0);

  // 檢查波次結束：當所有敵人都已生成且場上敵人清空時，自動進入下一波
  if (Dungeon.isWaveActive && Dungeon.enemiesToSpawn === 0 && Dungeon.enemies.length === 0) {
    Dungeon.isWaveActive = false;
    Dungeon.wave++;
    dLog(`✅ 波次完成！進入第 ${Dungeon.wave} 波。`, "log-ok");
    // 自動進入下一波，無需用戶互動
    setTimeout(startNextWave, 3000); // 延遲 3 秒後開始下一波
  }

  // 檢查遊戲是否結束（主堡血量歸零）
  if (Dungeon.castleHp <= 0 && Dungeon.active) {
    if (Dungeon.isWaveActive) Dungeon.isWaveActive = false;
    endGame();
  }
}

// 此 endGame() 已被 js/dungeon.js 中的同名函數取代，故在此移除以避免衝突

function triggerHitEffect(target, x, color){
  if(target==="player"){
    battleAnim.flash=0.1; battleAnim.flashColor="#ff0000";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:"#ff4040",size:2+Math.random()*2});
  } else {
    battleAnim.flash=0.1; battleAnim.flashColor = color || "#ffffff";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color: color || ["#ffcc40","#ff8020","#ffffff"][i%3],size:2+Math.random()*2});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor="#ff8800";
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:["#ff8000","#ffcc00","#ffffff","#ff4000"][i%4],size:3+Math.random()*5});
}

// renderTitleScreen 邏輯已整合至 renderBattleCanvas

// 此 endGame() 已被 js/dungeon.js 中的同名函數取代，故在此移除以避免衝突

function triggerHitEffect(target, x, color){
  if(target==="player"){
    battleAnim.flash=0.1; battleAnim.flashColor="#ff0000";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:"#ff4040",size:2+Math.random()*2});
  } else {
    battleAnim.flash=0.1; battleAnim.flashColor = color || "#ffffff";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color: color || ["#ffcc40","#ff8020","#ffffff"][i%3],size:2+Math.random()*2});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor="#ff8800";
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:["#ff8000","#ffcc00","#ffffff","#ff4000"][i%4],size:3+Math.random()*5});
}

// renderTitleScreen 邏輯已整合至 renderBattleCanvas




// 此 endGame() 已被 js/dungeon.js 中的同名函數取代，故在此移除以避免衝突

function triggerHitEffect(target, x, color){
  if(target==="player"){
    battleAnim.flash=0.1; battleAnim.flashColor="#ff0000";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:"#ff4040",size:2+Math.random()*2});
  } else {
    battleAnim.flash=0.1; battleAnim.flashColor = color || "#ffffff";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color: color || ["#ffcc40","#ff8020","#ffffff"][i%3],size:2+Math.random()*2});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor="#ff8800";
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:["#ff8000","#ffcc00","#ffffff","#ff4000"][i%4],size:3+Math.random()*5});
}

// renderTitleScreen 邏輯已整合至 renderBattleCanvas

// ══════════════════════════════════════════════
// 補齊遺漏的 ETYMOLOGY_LEGENDS_TITLE 定義 (如果 js/data.js 沒有載入或順序問題)
// ══════════════════════════════════════════════
// 為了避免 ReferenceError，在 canvas.js 中也提供一個備用定義
// 如果 js/data.js 先載入，則使用 js/data.js 中的定義
// 否則，使用這個最小化的定義，以確保 renderBattleCanvas 不會崩潰
if (typeof ETYMOLOGY_LEGENDS_TITLE === "undefined") {
  const ETYMOLOGY_LEGENDS_TITLE = {
    pixels: [
      ...Array(30).fill(Array(120).fill(0)), // 簡化為 30 行，避免過長
      [...Array(60).fill(3), ...Array(60).fill(4)], // 30 (原 35)
    ],
    colors: [
      'transparent',
      '#ffffff',
      '#ffffff',
      '#1b3022',
      '#2d1616'
    ]
  };
}

// 解決 renderBattleCanvas is not defined 的問題
// 確保 renderBattleCanvas 函數被正確調用
if (typeof renderBattleCanvas !== 'function') {
  window.renderBattleCanvas = renderBattleCanvas; // 將其暴露為全局函數
}




// 此 endGame() 已被 js/dungeon.js 中的同名函數取代，故在此移除以避免衝突

function triggerHitEffect(target, x, color){
  if(target==="player"){
    battleAnim.flash=0.1; battleAnim.flashColor="#ff0000";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:"#ff4040",size:2+Math.random()*2});
  } else {
    battleAnim.flash=0.1; battleAnim.flashColor = color || "#ffffff";
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color: color || ["#ffcc40","#ff8020","#ffffff"][i%3],size:2+Math.random()*2});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor="#ff8800";
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:["#ff8000","#ffcc00","#ffffff","#ff4000"][i%4],size:3+Math.random()*5});
}

// renderTitleScreen 邏輯已整合至 renderBattleCanvas
