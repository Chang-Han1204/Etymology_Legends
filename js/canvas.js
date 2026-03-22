// ══════════════════════════════════════════════
// CANVAS BATTLE RENDERER — 獵魔村物語 Style
// ══════════════════════════════════════════════
const cvs = document.getElementById('battle-canvas');
const ctx2 = cvs.getContext('2d');
let cvW = 0, cvH = 0;

function resizeCanvas() {
  cvW = cvs.offsetWidth || cvs.parentElement?.offsetWidth || 400;
  cvH = 140;
  cvs.width = Math.round(cvW * window.devicePixelRatio);
  cvs.height = Math.round(cvH * window.devicePixelRatio);
  ctx2.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  cvs.style.height = cvH + 'px';
}
window.addEventListener('resize', () => { resizeCanvas(); if (!animFrame) renderBattleCanvas(); });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resizeCanvas);
else resizeCanvas();

const ETYMOLOGY_LEGENDS_TITLE = {
  pixels: [
    // 上方空白區
    ...Array(5).fill(Array(120).fill(0)),
    // 0-10: 頂部結構 (尖塔與旗幟)
    [7,7,0,0,0,0,0,0, ...Array(104).fill(0), 0,0,0,10,10,10,0,0], 
    [6,7,7,0,0,0,0,0, ...Array(104).fill(0), 0,0,10,10,11,10,10,0],
    [6,6,6,0,0,0,0,0, ...Array(104).fill(0), 0,0,0,9,11,9,0,0,0],
    [0,6,0,0,0,0,0,0, ...Array(104).fill(0), 0,0,0,9,9,9,0,0,0],
    
    // 11-20: 中段 (城垛與窗戶)
    [6,6,6,6,6,0,0,0, ...Array(104).fill(0), 0,0,9,9,9,9,9,0],
    [6,8,6,8,6,0,0,0, ...Array(104).fill(0), 0,0,9,11,9,11,9,0],
    [6,6,6,6,6,0,0,0, ...Array(104).fill(0), 0,0,9,9,9,9,9,0],
    [6,6,6,6,6,0,0,0, ...Array(104).fill(0), 0,0,9,9,11,9,9,0],
    
    // 21-34: 基座 (最寬處，1/7 寬度約 17-18px)
    [6,6,6,6,6,6,6,6,0, ...Array(102).fill(0), 0,9,9,9,9,9,9,9,9],
    [6,8,6,8,6,8,6,8,0, ...Array(102).fill(0), 0,9,11,11,11,11,11,9,9],
    [6,6,6,6,6,6,6,6,0, ...Array(102).fill(0), 0,9,9,11,11,11,9,9,9],
    [6,6,6,12,12,6,6,6,0, ...Array(102).fill(0), 0,9,9,9,11,9,9,9,9],
    [6,6,6,12,12,6,6,6,0, ...Array(102).fill(0), 0,9,9,9,9,9,9,9,9],
    [6,6,6,6,6,6,6,6,6,0, ...Array(101).fill(0), 9,9,9,9,9,9,9,9,9,9],
    [6,6,6,6,6,6,6,6,6,0, ...Array(101).fill(0), 9,9,9,9,9,9,9,9,9,9],
    
    // 35-40: 壓低的地平線與分割領土
    [...Array(60).fill(3), ...Array(60).fill(4)], // 35 
  ],
  colors: [
    'transparent', // 0
    '#ffffff', 
    '#ffffff', 
    '#1b3022',     // 3: 深橄欖綠 (秩序領土 - 更有戰爭質感)
    '#2d1616',     // 4: 焦紅黑 (混亂領土)
    '#0d1a11',     // 5: 秩序深土
    '#717d7e',     // 6: 城堡舊化石磚 (灰)
    '#2471a3',     // 7: 藍色軍旗
    '#aed6f1',     // 8: 藍色魔力窗
    '#1c1c1c',     // 9: 怪物點黑曜石
    '#943126',     // 10: 邪惡骨刺
    '#ff0000',     // 11: 誕生點核心紅
    '#f4d03f',     // 12: 城堡主門燈火
    '#ffffff', 
    '#140a0a'      // 14: 混亂深土
  ]
};

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
      ctx2.fillRect(Math.round(x + dc * px), Math.round(y + r * px), px, px);
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

function getBattleBg(floor) {
  if (floor >= 40) return { sky:'#040010', wall:'#09001e', ground:'#0e0026', stone:'#160038', accent: '#4b0082' };
  if (floor >= 30) return { sky:'#070008', wall:'#0f0010', ground:'#160015', stone:'#220020', accent: '#8b0000' };
  if (floor >= 20) return { sky:'#060008', wall:'#0e000e', ground:'#130012', stone:'#1e0018', accent: '#483d8b' };
  if (floor >= 10) return { sky:'#080500', wall:'#100900', ground:'#160d00', stone:'#201408', accent: '#8b4513' };
  return               { sky:'#07080e', wall:'#0d0d18', ground:'#111120', stone:'#181830', accent: '#2f4f4f' };
}

function drawStoneWall(x, y, w, h, col, mortar) {
  ctx2.fillStyle = col; ctx2.fillRect(x, y, w, h);
  ctx2.fillStyle = mortar;
  const th=14, tw=22; let off=0;
  for (let ty=y; ty<y+h; ty+=th) ctx2.fillRect(x,ty,w,1);
  for (let ty=y; ty<y+h; ty+=th) {
    for (let tx=x+off; tx<x+w; tx+=tw) ctx2.fillRect(tx,ty,1,th);
    off = off===0 ? tw/2 : 0;
  }
}

function drawTorch(x, y, t) {
  const f = 0.72 + Math.sin(t*0.13)*0.18 + Math.sin(t*0.07)*0.1;
  ctx2.fillStyle='#302010'; ctx2.fillRect(x,y+8,6,10);
  ctx2.fillStyle='#601808'; ctx2.fillRect(x+1,y+4,4,8);
  ctx2.globalAlpha=f*0.5; ctx2.fillStyle='#ff6000'; ctx2.fillRect(x-3,y-8,12,10);
  ctx2.globalAlpha=f*0.72; ctx2.fillStyle='#ffaa00'; ctx2.fillRect(x-1,y-10,8,8);
  ctx2.globalAlpha=f; ctx2.fillStyle='#ffee88'; ctx2.fillRect(x+1,y-10,4,6);
  ctx2.globalAlpha=1;
  const g=ctx2.createRadialGradient(x+3,y-2,2,x+3,y-2,40);
  g.addColorStop(0,`rgba(255,140,30,${f*0.22})`); g.addColorStop(1,'transparent');
  ctx2.fillStyle=g; ctx2.fillRect(x-37,y-32,80,58);
}

function drawCastle(ctx, x, y) {
  const t = Date.now() * 0.002;
  const flicker = Math.sin(t * 2) * 0.1 + 0.9;
  
  // 縮小比例以適應 H=140 的畫面
  const s = 0.7; 
  
  // 1. 城堡主體 (深灰色與陰影)
  ctx.fillStyle = '#2c2c3e'; // 牆壁
  ctx.fillRect(x, y - 70 * s, 70 * s, 70 * s);
  ctx.fillStyle = '#1a1a2e'; // 陰影
  ctx.fillRect(x + 50 * s, y - 70 * s, 20 * s, 70 * s);
  
  // 2. 塔樓 (左右兩側)
  ctx.fillStyle = '#3d3d5c';
  ctx.fillRect(x - 10 * s, y - 90 * s, 25 * s, 90 * s); // 左塔
  ctx.fillRect(x + 55 * s, y - 90 * s, 25 * s, 90 * s); // 右塔
  
  // 3. 塔頂 (藍紫色)
  ctx.fillStyle = '#483d8b';
  ctx.beginPath();
  ctx.moveTo(x - 15 * s, y - 90 * s); ctx.lineTo(x + 2.5 * s, y - 120 * s); ctx.lineTo(x + 20 * s, y - 90 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 50 * s, y - 90 * s); ctx.lineTo(x + 67.5 * s, y - 120 * s); ctx.lineTo(x + 85 * s, y - 90 * s);
  ctx.fill();

  // 4. 城牆鋸齒 (Battlement)
  ctx.fillStyle = '#1a1a2e';
  for(let i=0; i<5; i++) {
    ctx.fillRect(x + (i*14 + 2) * s, y - 75 * s, 8 * s, 8 * s);
  }

  // 5. 大門 (帶有金屬質感)
  ctx.fillStyle = '#4a2c2a'; // 木頭
  ctx.fillRect(x + 20 * s, y - 35 * s, 30 * s, 35 * s);
  ctx.strokeStyle = '#c89820'; // 金邊
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 22 * s, y - 33 * s, 26 * s, 33 * s);
  
  // 6. 魔法核心/窗戶 (發光效果)
  ctx.globalAlpha = flicker;
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(x + 2 * s, y - 85 * s, 10 * s, 10 * s); // 左塔窗
  ctx.fillRect(x + 68 * s, y - 85 * s, 10 * s, 10 * s); // 右塔窗
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#00ffff';
  ctx.fillRect(x + 30 * s, y - 55 * s, 10 * s, 12 * s); // 主城核心
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;

  // 7. 旗幟 (隨風飄動感)
  const wave = Math.sin(t * 3) * 3;
  ctx.fillStyle = '#f03040';
  ctx.beginPath();
  ctx.moveTo(x + 2.5 * s, y - 120 * s); ctx.lineTo(x + (2.5 + 15) * s + wave, y - 110 * s); ctx.lineTo(x + 2.5 * s, y - 105 * s);
  ctx.fill();

  // 8. 城堡血條 (位置調低，確保在畫布內)
  const pct = Dungeon.castleHp / Dungeon.maxCastleHp;
  const barY = y - 130 * s; // H=140, gY=106. 106 - 130*0.7 = 106 - 91 = 15.
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 5 * s, barY, 80 * s, 8 * s);
  ctx.strokeStyle = '#c89820';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 6 * s, barY - 1, 82 * s, 10 * s);
  
  const barColor = pct > 0.6 ? '#4cbc4c' : (pct > 0.3 ? '#eab830' : '#f03040');
  ctx.fillStyle = barColor;
  ctx.fillRect(x - 3 * s, barY + 2, 76 * s * pct, 4 * s);
}

function renderBattleCanvas() {
  if (!cvs) return;
  if (cvW === 0) resizeCanvas();
  if (cvW === 0) { animFrame = requestAnimationFrame(renderBattleCanvas); return; }
  
  const W = cvW, H = cvH;
  const gY = Math.round(H * 0.76);
  const floor = (typeof player !== 'undefined' && player?.floor) || 1;
  const bg = getBattleBg(floor);
  const t = Date.now() * 0.001;

  // 1. 更新邏輯
  if (typeof Dungeon !== 'undefined' && Dungeon.active) {
    updateBattleLogic();
  }

  // 2. 渲染背景
  ctx2.fillStyle = bg.sky; ctx2.fillRect(0, 0, W, H);

  // --- 如果不是戰鬥中，顯示封面畫面 ---
  if (typeof Dungeon !== 'undefined' && !Dungeon.active) {
    renderTitleScreen(ctx2, W, H, t);
    battleAnim.bg++;
    animFrame = requestAnimationFrame(renderBattleCanvas);
    return;
  }
  
  // 遠景：星星與雲朵
  ctx2.fillStyle = '#fff';
  for(let i=0; i<15; i++) {
    const sX = (Math.sin(i * 123.45) * 0.5 + 0.5) * W;
    const sY = (Math.cos(i * 678.90) * 0.5 + 0.5) * (H * 0.4);
    const alpha = Math.sin(t + i) * 0.3 + 0.7;
    ctx2.globalAlpha = alpha;
    ctx2.fillRect(sX, sY, 1, 1);
  }
  ctx2.globalAlpha = 0.1;
  ctx2.fillStyle = bg.accent;
  for(let i=0; i<3; i++) {
    const cX = ((t * (10 + i * 5)) + i * 200) % (W + 200) - 100;
    ctx2.fillRect(cX, 20 + i * 15, 80, 20);
  }
  ctx2.globalAlpha = 1.0;

  // 城牆與地面
  drawStoneWall(0, 0, W, Math.round(H * 0.16), bg.wall, bg.stone);
  const ww = Math.round(W * 0.065);
  drawStoneWall(0, 0, ww, H, bg.wall, bg.stone);
  drawStoneWall(W - ww, 0, ww, H, bg.wall, bg.stone);
  drawStoneWall(0, gY, W, H - gY, bg.ground, bg.stone);

  // 地面細節 (裂縫、碎石)
  ctx2.fillStyle = bg.stone;
  for(let i=0; i<10; i++) {
    const dX = (Math.sin(i * 555) * 0.5 + 0.5) * W;
    const dY = gY + (Math.cos(i * 999) * 0.5 + 0.5) * (H - gY - 5);
    ctx2.fillRect(dX, dY, 4, 1);
  }

  // 繪製城堡 (移動到背景牆之後，確保不被擋住)
  drawCastle(ctx2, 10 + ww, gY);

  // 3. 渲染單位
  if (typeof Dungeon !== 'undefined' && Dungeon.active) {
    // 渲染士兵
    Dungeon.soldiers.forEach(s => {
      const sprite = getSoldierSprite(s);
      let px = 4;
      if (s.id === 'knight') px = 5; // 騎士大一點
      const sH = sprite.pixels.length * px;
      drawPixelChar(sprite, s.x, gY - sH, px, false, s.element);
      // 血條
      drawUnitHp(s.x, gY - sH - 8, s.hp, s.maxHp, '#4cbc4c');
    });

    // 渲染敵人
    Dungeon.enemies.forEach(e => {
      const sprite = getEnemySprite(e) || CHAR_SPRITES.slime;
      const px = 5;
      const eH = sprite.pixels.length * px;
      drawPixelChar(sprite, e.x, gY - eH, px, true, e.element);
      // 血條
      drawUnitHp(e.x, gY - eH - 8, e.hp, e.maxHp, '#f03040');
    });
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
  const gY = Math.round(cvH * 0.76);
  
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
        
        if (effectMsg) spawnFloat(effectMsg, nearestEnemy.x, gY - 60, effectColor);

        if (s.id === 'archer') {
          // 弓箭手特效：從士兵飛向敵人
          spawnFloat(`🎯`, s.x + 20, gY - 50, '#60e080');
          spawnFloat(`-${Math.round(finalAtk)}`, nearestEnemy.x, gY - 40, effectColor);
        } else {
          spawnFloat(`-${Math.round(finalAtk)}`, nearestEnemy.x, gY - 40, effectColor);
        }
        
        const hitColor = s.element ? ELEMENTS[s.element.toUpperCase()].color : '#ffffff';
        triggerHitEffect('enemy', nearestEnemy.x, hitColor);
        s.atkTimer = 0;
      }
    } else {
      s.state = 'move';
      // 士兵原地待命邏輯：如果前方無敵人，且已經走過畫面 3/4，則停止移動
      if (s.x < cvW * 0.75) {
        s.x += s.speed;
      } else {
        s.state = 'idle';
      }
    }
  });

  // 敵人移動與戰鬥
  Dungeon.enemies.forEach((e) => {
    let nearestSoldier = null;
    let minDist = 30; // 攻擊距離
    
    Dungeon.soldiers.forEach(s => {
      const dist = e.x - s.x;
      if (dist > -10 && dist < minDist) {
        nearestSoldier = s;
        minDist = dist;
      }
    });

    if (nearestSoldier) {
      e.atkTimer = (e.atkTimer || 0) + 1;
      if (e.atkTimer > 70) {
        nearestSoldier.hp -= e.atk; // 恢復扣血邏輯
        
        spawnFloat(`-${e.atk}`, nearestSoldier.x, gY - 40, '#f00');
        triggerHitEffect('player', nearestSoldier.x);
        e.atkTimer = 0;
      }
    } else if (e.x > 50) {
      e.x -= e.speed;
    } else {
      // 撞擊主堡
      Dungeon.castleHp -= e.atk * 2;
      spawnFloat(`-${Math.round(e.atk*2)}`, 30, gY - 40, '#f00');
      e.hp = 0; // 撞擊後消失
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
  if(target==='player'){
    battleAnim.flash=0.1; battleAnim.flashColor='#ff0000';
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:'#ff4040',size:2+Math.random()*2});
  } else {
    battleAnim.flash=0.1; battleAnim.flashColor = color || '#ffffff';
    for(let i=0;i<6;i++) battleAnim.particles.push({x:x,y:cvH*0.5,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color: color || ['#ffcc40','#ff8020','#ffffff'][i%3],size:2+Math.random()*2});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor='#ff8800';
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:['#ff8000','#ffcc00','#ffffff','#ff4000'][i%4],size:3+Math.random()*5});
}

function renderTitleScreen(ctx, W, H, t) {
  const spec = ETYMOLOGY_LEGENDS_TITLE;
  const rows = spec.pixels.length;
  const cols = spec.pixels[0].length;
  
  ctx.clearRect(0, 0, W, H);

  // 背景：極致深邃的夜空
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#050505');
  skyGrad.addColorStop(1, '#101015');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  const px = Math.min(W / cols, H / rows);
  const startX = (W - cols * px) / 2;
  const startY = (H - rows * px) / 2;

  // 1. 繪製所有像素 (建築與地板)
  for (let r = 0; r < rows; r++) {
    const rowData = spec.pixels[r];
    if (!rowData) continue; // 安全檢查
    
    for (let c = 0; c < cols; c++) {
      const ci = rowData[c];
      if (ci === 0 || ci === undefined) continue;
      
      ctx.globalAlpha = 1.0;
      
      // 動態特效
      if (ci === 11) { // 怪物核心脈動
        ctx.globalAlpha = 0.4 + Math.abs(Math.sin(t * 4)) * 0.6;
      } else if (ci === 12 || ci === 8) { // 城堡燈光微閃
        ctx.globalAlpha = 0.8 + Math.random() * 0.2;
      }

      ctx.fillStyle = spec.colors[ci];
      ctx.fillRect(startX + c * px, startY + r * px, Math.ceil(px), Math.ceil(px));
    }
  }

  // 2. 繪製標題文字 (置中)
  ctx.globalAlpha = 1.0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = W / 2;
  const centerY = H / 2;

  // 標題發光背景
  const titleGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, px * 40);
  titleGlow.addColorStop(0, 'rgba(241, 196, 15, 0.1)');
  titleGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = titleGlow;
  ctx.fillRect(0, 0, W, H);

  // 主標題：強化質感的雙色
  ctx.font = `italic bold ${px * 10}px "Georgia", serif`;
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 10;
  
  const textGrad = ctx.createLinearGradient(centerX - px * 20, 0, centerX + px * 20, 0);
  textGrad.addColorStop(0, '#5dade2'); 
  textGrad.addColorStop(1, '#ec7063');
  
  ctx.fillStyle = textGrad;
  ctx.fillText('Etymology Legends', centerX, centerY - px * 2);

  // 副標題
  ctx.shadowBlur = 0;
  ctx.font = `bold ${px * 3.5}px monospace`;
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('🛡️ DEFEND THE ROOT ⚔️', centerX, centerY + px * 6);
}