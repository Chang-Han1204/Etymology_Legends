// ══════════════════════════════════════════════
// CANVAS BATTLE RENDERER
// ══════════════════════════════════════════════
const cvs = document.getElementById('battle-canvas');
const ctx2 = cvs.getContext('2d');
let cvW = 0, cvH = 0;

function resizeCanvas() {
  // 若 offsetWidth 為 0（CSS 尚未套用），改取父元素寬度或預設 400
  cvW = cvs.offsetWidth || cvs.parentElement?.offsetWidth || 400;
  cvH = 260;
  cvs.width = Math.round(cvW * window.devicePixelRatio);
  cvs.height = Math.round(cvH * window.devicePixelRatio);
  ctx2.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  cvs.style.height = cvH + 'px';
}

window.addEventListener('resize', () => {
  resizeCanvas();
  // resize 後立刻重繪一幀，避免畫面空白
  if (!animFrame) renderBattleCanvas();
});

// 等 DOM 完全渲染後再取寬度
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resizeCanvas);
} else {
  resizeCanvas();
}

// Pixel art characters — drawn with ctx2 rectangles
const CHAR_SPRITES = {
  player: {
    pixels: [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 1, 4, 4, 4, 4, 1, 1, 0],
      [0, 0, 0, 4, 0, 0, 4, 0, 0, 0],
      [0, 0, 1, 4, 0, 0, 4, 1, 0, 0],
      [0, 1, 0, 4, 0, 0, 4, 0, 1, 0],
    ],
    colors: ['transparent', '#c8a060', '#f0e0a0', '#4080c0', '#c06030']
  },
  mage: {
    pixels: [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 1, 2, 3, 3, 2, 1, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 0, 3, 5, 5, 5, 5, 3, 0, 0],
      [0, 0, 0, 5, 0, 0, 5, 0, 0, 0],
      [0, 0, 3, 5, 0, 0, 5, 3, 0, 0],
      [0, 3, 0, 5, 0, 0, 5, 0, 3, 0],
    ],
    colors: ['transparent', '#a060c0', '#e0c0f0', '#6040a0', '#503080', '#8060b0']
  },
  slime: {
    pixels: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 3, 3, 2, 2, 1],
      [1, 2, 3, 2, 2, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    colors: ['transparent', '#208040', '#40c060', '#60e080', '#a0f0b0']
  },
  skeleton: {
    pixels: [
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 2, 2, 3, 3, 2, 2, 1],
      [1, 2, 3, 2, 2, 3, 2, 1],
      [0, 1, 2, 2, 2, 2, 1, 0],
      [0, 1, 2, 3, 3, 2, 1, 0],
      [1, 0, 1, 2, 2, 1, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    colors: ['transparent', '#a0a0a0', '#e0e0e0', '#c0c0c0', '#808080']
  },
  dragon: {
    pixels: [
      [0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 2, 1, 0, 1, 2, 1],
      [1, 2, 3, 2, 1, 2, 3, 2],
      [1, 2, 2, 2, 2, 2, 2, 2],
      [0, 1, 2, 4, 4, 2, 2, 1],
      [0, 0, 1, 2, 2, 2, 1, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 0, 1],
    ],
    colors: ['transparent', '#802010', '#c04020', '#e06030', '#ff8040']
  },
  boss: {
    pixels: [
      [0, 1, 0, 0, 0, 0, 0, 1, 0],
      [1, 2, 1, 0, 0, 0, 1, 2, 1],
      [1, 2, 3, 1, 0, 1, 3, 2, 1],
      [0, 1, 2, 2, 1, 2, 2, 1, 0],
      [0, 1, 4, 2, 2, 2, 4, 1, 0],
      [0, 1, 2, 3, 2, 3, 2, 1, 0],
      [0, 0, 1, 2, 2, 2, 1, 0, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0],
    ],
    colors: ['transparent', '#400060', '#8000c0', '#a020e0', '#ff40ff']
  },
};

function drawPixelChar(spec, x, y, px, flipX = false) {
  if (!spec) return;
  const { pixels, colors } = spec;
  const rows = pixels.length, cols = pixels[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = pixels[r][c];
      if (ci === 0 || !colors[ci] || colors[ci] === 'transparent') continue;
      ctx2.fillStyle = colors[ci];
      const drawC = flipX ? cols - 1 - c : c;
      ctx2.fillRect(Math.round(x + drawC * px), Math.round(y + r * px), px, px);
    }
  }
}

let battleAnim = {
  playerX: 0, playerY: 0, playerShake: 0,
  enemyX: 0, enemyY: 0, enemyShake: 0,
  flash: 0, flashColor: '#fff',
  bg: 0, particles: [],
};
let animFrame = null;

function getBattleBg(floor) {
  if (floor >= 30) return { sky: '#0d0020', ground: '#180030', accent: '#400080' };
  if (floor >= 20) return { sky: '#001020', ground: '#002040', accent: '#004080' };
  if (floor >= 10) return { sky: '#200800', ground: '#400010', accent: '#800020' };
  return { sky: '#060c18', ground: '#0c1828', accent: '#182840' };
}

function getEnemySprite(enemy) {
  if (!enemy) return null;
  if (enemy.class === 'BOSS' || enemy.class === 'FINAL BOSS') return CHAR_SPRITES.boss;
  if (enemy.name.includes('龍')) return CHAR_SPRITES.dragon;
  if (enemy.name.includes('骷髏')) return CHAR_SPRITES.skeleton;
  return CHAR_SPRITES.slime;
}

function getPlayerSprite() {
  const lv = player?.lv || 1;
  return lv >= 8 ? CHAR_SPRITES.mage : CHAR_SPRITES.player;
}

function renderBattleCanvas() {
  if (!cvs) return;
  if (cvW === 0) resizeCanvas();
  if (cvW === 0) { animFrame = requestAnimationFrame(renderBattleCanvas); return; }
  const W = cvW, H = cvH;
  const floor = player?.floor || 1;
  const bg = getBattleBg(floor);

  // Background
  ctx2.fillStyle = bg.sky;
  ctx2.fillRect(0, 0, W, H);
  
  // Ground
  ctx2.fillStyle = bg.ground;
  ctx2.fillRect(0, H * 0.7, W, H * 0.3);
  
  // Ground line
  ctx2.fillStyle = bg.accent;
  ctx2.fillRect(0, H * 0.7, W, 3);
  
  // Stars
  ctx2.fillStyle = 'rgba(255,255,255,0.6)';
  const starSeed = floor * 7;
  for (let i = 0; i < 20; i++) {
    const sx = (starSeed * 13 + i * 97) % W;
    const sy = (starSeed * 7 + i * 53) % Math.round(H * 0.55);
    ctx2.fillRect(sx, sy, 1 + (i % 2), 1 + (i % 3 === 0 ? 1 : 0));
  }

  // Animated floor tiles
  const tileY = Math.round(H * 0.6) + 2;
  ctx2.fillStyle = bg.accent + '88';
  for (let tx = 0; tx < W; tx += 20) {
    ctx2.fillRect(tx, tileY, 18, 3);
  }

  // Flash effect
  if (battleAnim.flash > 0) {
    ctx2.fillStyle = battleAnim.flashColor + '' + Math.round(battleAnim.flash * 255).toString(16).padStart(2, '0');
    ctx2.fillRect(0, 0, W, H);
    battleAnim.flash = Math.max(0, battleAnim.flash - 0.05);
  }

  // Particles
  battleAnim.particles = battleAnim.particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.04; p.vy += 0.2;
    if (p.life <= 0) return false;
    ctx2.globalAlpha = p.life;
    ctx2.fillStyle = p.color;
    ctx2.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    ctx2.globalAlpha = 1;
    return true;
  });

  // Player
  const px = 8, charH = px * 8;
  const pY = Math.round(H * 0.6) - charH + battleAnim.playerShake;
  const pX = Math.round(W * 0.15) + Math.round(Math.sin(battleAnim.bg * 0.05) * 2);
  drawPixelChar(getPlayerSprite(), pX, pY, px);
  if (battleAnim.playerShake !== 0) battleAnim.playerShake = Math.round(battleAnim.playerShake * 0.6);

  // Enemy
  if (currentEnemy) {
    const ex = px + 2;
    const eY = Math.round(H * 0.6) - ex * 8 + battleAnim.enemyShake;
    const eX = Math.round(W * 0.72) + Math.round(Math.sin(battleAnim.bg * 0.04 + 1) * 3);
    drawPixelChar(getEnemySprite(currentEnemy), eX, eY, ex, true);
    if (battleAnim.enemyShake !== 0) battleAnim.enemyShake = Math.round(battleAnim.enemyShake * 0.6);
  }

  battleAnim.bg++;
  animFrame = requestAnimationFrame(renderBattleCanvas);
}

function triggerHitEffect(target) { // target: 'player' or 'enemy'
  if (target === 'player') {
    battleAnim.playerShake = -8;
    battleAnim.flash = 0.35; battleAnim.flashColor = '#ff0000';
    // Spawn red particles
    for (let i = 0; i < 8; i++) {
      battleAnim.particles.push({
        x: cvW * 0.2, y: cvH * 0.5,
        vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4,
        life: 1, color: '#ff4040', size: 3 + Math.random() * 3
      });
    }
  } else {
    battleAnim.enemyShake = -10;
    battleAnim.flash = 0.25; battleAnim.flashColor = '#ffffff';
    for (let i = 0; i < 10; i++) {
      battleAnim.particles.push({
        x: cvW * 0.78, y: cvH * 0.45,
        vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 5,
        life: 1, color: '#ffcc40', size: 2 + Math.random() * 4
      });
    }
  }
}

function triggerCritEffect() {
  battleAnim.flash = 0.5; battleAnim.flashColor = '#ff8000';
  for (let i = 0; i < 16; i++) {
    battleAnim.particles.push({
      x: cvW * 0.75, y: cvH * 0.4,
      vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 7,
      life: 1, color: '#ff8000', size: 4 + Math.random() * 4
    });
  }
}