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

const spriteCache = {};

function createCachedSprite(spec, px, flipX = false, element = null) {
  const key = `${spec.name || 'unknown'}-${px}-${flipX}-${element || 'none'}`;
  if (spriteCache[key]) return spriteCache[key];

  const { pixels, colors } = spec;
  const rows = pixels.length, cols = pixels[0].length;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cols * px);
  canvas.height = Math.round(rows * px);
  const ctx = canvas.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = pixels[r][c];
      if (ci === 0 || !colors[ci] || colors[ci] === 'transparent') continue;
      
      let color = colors[ci];
      // 如果有屬性，對非透明色進行微調
      if (element) {
        const elCfg = ELEMENTS[element.toUpperCase()];
        if (elCfg && ci > 1) { 
           // 可以在這裡應用更複雜的顏色混合，但目前保持簡單以提升效能
        }
      }

      ctx.fillStyle = color;
      const dc = flipX ? cols - 1 - c : c;
      ctx.fillRect(Math.round(dc * px), Math.round(r * px), Math.ceil(px), Math.ceil(px));
    }
  }

  // 在角色腳下畫屬性光環 (在快取中繪製)
  if (element) {
    const elCfg = ELEMENTS[element.toUpperCase()];
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = elCfg.color;
    ctx.beginPath();
    ctx.ellipse((cols * px) / 2, rows * px, (cols * px) / 1.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 畫屬性圖示 (在快取中繪製)
    ctx.font = "10px Arial";
    ctx.fillText(elCfg.icon, -5, 5); // 相對於 sprite canvas 的座標
  }

  spriteCache[key] = canvas;
  return canvas;
}

function drawPixelChar(spec, x, y, px, flipX = false, element = null) {
  if (!spec) return;

  const cachedSprite = createCachedSprite(spec, px, flipX, element);
  if (cachedSprite) {
    ctx2.drawImage(cachedSprite, x, y);
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

let battleAnim = { playerShake:0, enemyShake:0, flash:0, flashColor:'#fff', bg:0, particles:[], floats:[], torchT:0 };
let animFrame = null;

function drawCastleHpBar(x, y, px) {
  const pct = (Dungeon.castleHp || 0) / (Dungeon.maxCastleHp || 100);
  // 縮短寬度，從 30*px 降至 15*px，使其更貼合單個塔樓的寬度
  const w = px * 15; // 再次調整寬度，使其更貼近邊緣
  const h = px * 1.5; // 維持較短高度
  
  // 背景/邊框
  ctx2.fillStyle = 'rgba(0,0,0,0.8)';
  ctx2.fillRect(x - w/2, y, w, h);
  
  // 血量條
  const barColor = pct > 0.6 ? '#4cbc4c' : (pct > 0.3 ? '#eab830' : '#f03040');
  ctx2.fillStyle = barColor;
  const fillW = Math.max(0, (w - 2) * pct);
  ctx2.fillRect(x - w - 12, y - 20, fillW, h - 2);
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

  // 粒子與特效 (限制最大數量以提升效能)
  if (battleAnim.particles.length > 100) battleAnim.particles.splice(0, battleAnim.particles.length - 100);
  battleAnim.particles = battleAnim.particles.filter(p => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.038; p.vy += 0.15;
    if (p.life <= 0) return false;
    ctx2.globalAlpha = Math.max(0, p.life); ctx2.fillStyle = p.color;
    ctx2.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    ctx2.globalAlpha = 1; return true;
  });

  // 渲染浮動文字 (替代 DOM spawnFloat)
  battleAnim.floats = battleAnim.floats.filter(f => {
    f.y -= 0.5; f.life -= 0.015; // 稍微減慢消失速度，讓玩家看得更清楚
    if (f.life <= 0) return false;
    ctx2.save(); // 使用 save/restore 確保狀態不污染
    ctx2.globalAlpha = Math.min(1, f.life * 2);
    ctx2.fillStyle = f.color;
    ctx2.font = `bold ${f.size || 12}px "Silkscreen", "Press Start 2P", monospace`;
    ctx2.textAlign = 'center';
    // 加上文字描邊，增加可讀性
    ctx2.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx2.lineWidth = 2;
    ctx2.strokeText(f.text, f.x, f.y);
    ctx2.fillText(f.text, f.x, f.y);
    ctx2.restore();
    return true;
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