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
    colors:['transparent','#2a0850','#5010a0','#200030','#9030f0','#ff10ff','#180028','#8020cc','#d8c890']
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
      const dc = flipX ? cols - 1 - c : c;
      ctx2.fillRect(Math.round(x + dc * px), Math.round(y + r * px), px, px);
    }
  }
}

function getEnemySprite(enemy) {
  if (!enemy) return null;
  const n = enemy.name || '';
  const cls = enemy.class || '';
  if (cls === 'FINAL BOSS' || cls === 'BOSS') return CHAR_SPRITES.boss;
  if (n.includes('龍') || n.includes('古代') || n.includes('語言巨人') || n.includes('吞噬')) return CHAR_SPRITES.dragon;
  if (n.includes('骷髏') || n.includes('詞彙骷髏')) return CHAR_SPRITES.skeleton;
  if (n.includes('幽靈') || n.includes('文字幽靈')) return CHAR_SPRITES.ghost;
  if (n.includes('蜘蛛') || n.includes('語法蜘蛛')) return CHAR_SPRITES.spider;
  if (n.includes('惡魔') || n.includes('句型') || n.includes('被動') || n.includes('假設') || n.includes('支配')) return CHAR_SPRITES.demon;
  if (n.includes('巨型') || n.includes('詞根')) return CHAR_SPRITES.dragon;
  if (cls === '精英') return CHAR_SPRITES.demon;
  if (cls === '進階') return CHAR_SPRITES.dragon;
  if (cls === '中級') return CHAR_SPRITES.skeleton;
  return CHAR_SPRITES.slime;
}

function getPlayerSprite() {
  const lv = (typeof player !== 'undefined' && player?.lv) || 1;
  return lv >= 8 ? CHAR_SPRITES.mage : CHAR_SPRITES.player;
}

let battleAnim = { playerShake:0, enemyShake:0, flash:0, flashColor:'#fff', bg:0, particles:[], torchT:0 };
let animFrame = null;

function getBattleBg(floor) {
  if (floor >= 40) return { sky:'#040010', wall:'#09001e', ground:'#0e0026', stone:'#160038' };
  if (floor >= 30) return { sky:'#070008', wall:'#0f0010', ground:'#160015', stone:'#220020' };
  if (floor >= 20) return { sky:'#060008', wall:'#0e000e', ground:'#130012', stone:'#1e0018' };
  if (floor >= 10) return { sky:'#080500', wall:'#100900', ground:'#160d00', stone:'#201408' };
  return               { sky:'#07080e', wall:'#0d0d18', ground:'#111120', stone:'#181830' };
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

function renderBattleCanvas() {
  if (!cvs) return;
  if (cvW===0) resizeCanvas();
  if (cvW===0) { animFrame=requestAnimationFrame(renderBattleCanvas); return; }
  const W=cvW, H=cvH;
  const floor=(typeof player!=='undefined'&&player?.floor)||1;
  const bg=getBattleBg(floor);
  ctx2.fillStyle=bg.sky; ctx2.fillRect(0,0,W,H);
  drawStoneWall(0,0,W,Math.round(H*0.16),bg.wall,bg.stone);
  const ww=Math.round(W*0.065);
  drawStoneWall(0,0,ww,H,bg.wall,bg.stone);
  drawStoneWall(W-ww,0,ww,H,bg.wall,bg.stone);
  const gY=Math.round(H*0.76);
  drawStoneWall(0,gY,W,H-gY,bg.ground,bg.stone);
  const fog=ctx2.createLinearGradient(0,0,W,0);
  fog.addColorStop(0,'rgba(0,0,0,0.28)'); fog.addColorStop(0.14,'transparent');
  fog.addColorStop(0.86,'transparent'); fog.addColorStop(1,'rgba(0,0,0,0.28)');
  ctx2.fillStyle=fog; ctx2.fillRect(0,0,W,H);
  battleAnim.torchT++;
  drawTorch(Math.round(W*0.22),Math.round(H*0.16),battleAnim.torchT);
  drawTorch(Math.round(W*0.73),Math.round(H*0.16),battleAnim.torchT+41);
  ctx2.fillStyle='rgba(0,0,0,0.38)';
  ctx2.beginPath(); ctx2.ellipse(W*0.20,gY+4,16,4,0,0,Math.PI*2); ctx2.fill();
  if (typeof currentEnemy!=='undefined'&&currentEnemy) {
    ctx2.beginPath(); ctx2.ellipse(W*0.78,gY+4,18,5,0,0,Math.PI*2); ctx2.fill();
  }
  if (battleAnim.flash>0) {
    ctx2.fillStyle=battleAnim.flashColor+Math.round(battleAnim.flash*200).toString(16).padStart(2,'0');
    ctx2.fillRect(0,0,W,H);
    battleAnim.flash=Math.max(0,battleAnim.flash-0.055);
  }
  battleAnim.particles=battleAnim.particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.life-=0.038; p.vy+=0.2;
    if(p.life<=0) return false;
    ctx2.globalAlpha=Math.max(0,p.life); ctx2.fillStyle=p.color;
    ctx2.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);
    ctx2.globalAlpha=1; return true;
  });
  const ps=getPlayerSprite(), ppx=7;
  const pH=ps.pixels.length*ppx;
  const pX=Math.round(W*0.15)+Math.round(Math.sin(battleAnim.bg*0.038)*1.5);
  drawPixelChar(ps, pX, gY-pH+battleAnim.playerShake, ppx);
  if(battleAnim.playerShake!==0) battleAnim.playerShake=Math.round(battleAnim.playerShake*0.55);
  if(typeof currentEnemy!=='undefined'&&currentEnemy){
    const es=getEnemySprite(currentEnemy);
    const isBig=currentEnemy.class==='BOSS'||currentEnemy.class==='FINAL BOSS'||currentEnemy.class==='精英';
    const epx=isBig?10:8;
    const eH=(es?es.pixels.length:8)*epx;
    const eX=Math.round(W*0.66)+Math.round(Math.sin(battleAnim.bg*0.033+1.8)*2);
    drawPixelChar(es, eX, gY-eH+battleAnim.enemyShake, epx, true);
    if(battleAnim.enemyShake!==0) battleAnim.enemyShake=Math.round(battleAnim.enemyShake*0.55);
  }
  battleAnim.bg++;
  animFrame=requestAnimationFrame(renderBattleCanvas);
}

function triggerHitEffect(target){
  if(target==='player'){
    battleAnim.playerShake=-8; battleAnim.flash=0.28; battleAnim.flashColor='#ff0000';
    for(let i=0;i<9;i++) battleAnim.particles.push({x:cvW*0.18,y:cvH*0.5,vx:(Math.random()-.5)*5,vy:-Math.random()*5,life:1,color:'#ff4040',size:2+Math.random()*3});
  } else {
    battleAnim.enemyShake=-10; battleAnim.flash=0.18; battleAnim.flashColor='#ffffff';
    for(let i=0;i<12;i++) battleAnim.particles.push({x:cvW*0.76,y:cvH*0.44,vx:(Math.random()-.5)*6,vy:-Math.random()*6,life:1,color:['#ffcc40','#ff8020','#ffffff'][i%3],size:2+Math.random()*4});
  }
}
function triggerCritEffect(){
  battleAnim.flash=0.42; battleAnim.flashColor='#ff8800';
  for(let i=0;i<20;i++) battleAnim.particles.push({x:cvW*0.74,y:cvH*0.4,vx:(Math.random()-.5)*9,vy:-Math.random()*9,life:1,color:['#ff8000','#ffcc00','#ffffff','#ff4000'][i%4],size:3+Math.random()*5});
}
