// ══════════════════════════════════════════════
// ARTIFACTS DATA - 遺器數據
// ══════════════════════════════════════════════

const ARTIFACTS = {
  "artifact_hp_boost": {
    name: "生命聖杯",
    description: "大幅提升主堡生命值",
    baseEffect: 100, // 初始提升100點HP
    scaling: 1.2, // 每級提升1.2倍
    effectType: "mainCastleHp",
    pixelArt: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ] // 簡單的杯子形狀
  },
  "artifact_start_gold": {
    name: "黃金號角",
    description: "戰鬥開始時獲得額外金錢",
    baseEffect: 50, // 初始額外50金錢
    scaling: 1.5, // 每級提升1.5倍
    effectType: "startingGold",
    pixelArt: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 1]
    ] // 號角形狀
  },
  "artifact_quiz_gold": {
    name: "智慧錢幣",
    description: "答題獲得的金錢數量增加",
    baseEffect: 10, // 初始額外10金錢
    scaling: 1.3, // 每級提升1.3倍
    effectType: "quizGold",
    pixelArt: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ] // 錢幣形狀
  },
  "artifact_soldier_atk_spd": {
    name: "迅捷羽翼",
    description: "提升士兵的攻擊速度",
    baseEffect: 0.05, // 初始提升5%攻擊速度
    scaling: 1.1, // 每級提升1.1倍
    effectType: "soldierAttackSpeed",
    pixelArt: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ] // 翅膀形狀
  },
  "artifact_gem_gain": {
    name: "璀璨晶石",
    description: "增加寶石的獲取數量",
    baseEffect: 1, // 初始額外獲得1顆寶石
    scaling: 1.1, // 每級提升1.1倍
    effectType: "gemGain",
    pixelArt: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ] // 寶石形狀
  },
  "artifact_exp_gain": {
    name: "智慧捲軸",
    description: "增加經驗值的獲取數量",
    baseEffect: 0.10, // 初始提升10%經驗值獲取
    scaling: 1.1, // 每級提升1.1倍
    effectType: "expGain",
    pixelArt: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ] // 捲軸形狀，可調整
  },
  "artifact_turn_hp_recover": {
    name: "生命源泉",
    description: "每回合回復更多主堡生命值",
    baseEffect: 2, // 初始每回合額外回復2點HP
    scaling: 1.1, // 每級提升1.1倍
    effectType: "turnHpRecover",
    pixelArt: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ] // 水滴形狀
  }
  // 可以繼續擴展更多遺器
};

function renderArtifactList() {
  const list = document.getElementById('artifact-list');
  if (!list || typeof ARTIFACTS === 'undefined') return;

  if (!player.artifacts || Object.keys(player.artifacts).length === 0) {
    list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:14px;padding:20px">尚未擁有遺器</div>';
    return;
  }

  list.innerHTML = Object.keys(player.artifacts).map(key => {
    const artifact = ARTIFACTS[key];
    const pArtifact = player.artifacts[key];
    if (!artifact) return '';

    const level = pArtifact.level || 1;
    const currentEffect = getArtifactCurrentEffect(artifact, level);
    const nextEffect = getArtifactCurrentEffect(artifact, level + 1);
    const effectDescription = getArtifactEffectDescription(artifact, currentEffect);
    const nextEffectDescription = getArtifactEffectDescription(artifact, nextEffect);
    
    // 獲取像素圖渲染 (簡單版本，直接顯示 Emoji 或符號代表)
    const icon = getArtifactIcon(key);

    return `
      <div class="artifact-item card" style="padding:12px; position:relative; overflow:hidden">
        <div style="display:flex; align-items:center; margin-bottom:8px">
          <div style="font-size:28px; margin-right:12px">${icon}</div>
          <div style="flex:1">
            <div class="artifact-name" style="color:var(--gold); font-weight:bold">${artifact.name}</div>
            <div class="artifact-level">等級 ${level}</div>
          </div>
        </div>
        <div class="artifact-description">${artifact.description}</div>
        <div class="artifact-effect">
          <div class="current">當前: ${effectDescription}</div>
          <div class="next">下一級: ${nextEffectDescription}</div>
        </div>
      </div>
    `;
  }).join("");
}

function getArtifactIcon(key) {
  const icons = {
    "artifact_hp_boost": "🏆",
    "artifact_start_gold": "📯",
    "artifact_quiz_gold": "🪙",
    "artifact_soldier_atk_spd": "🪽",
    "artifact_gem_gain": "💎",
    "artifact_exp_gain": "📜",
    "artifact_turn_hp_recover": "💧"
  };
  return icons[key] || "✨";
}

// Helper function to calculate current effect value
function getArtifactCurrentEffect(artifact, level) {
  return artifact.baseEffect * Math.pow(artifact.scaling, level - 1);
}

// Helper function to get descriptive text for artifact effect
function getArtifactEffectDescription(artifact, value) {
  switch (artifact.effectType) {
    case "mainCastleHp":
      return `主堡生命值: +${value.toFixed(0)}`;
    case "startingGold":
      return `起始金錢: +${value.toFixed(0)}`;
    case "quizGold":
      return `答題金錢: +${value.toFixed(0)}`;
    case "soldierAttackSpeed":
      return `士兵攻速: +${(value * 100).toFixed(0)}%`;
    case "gemGain":
      return `寶石獲取: +${value.toFixed(0)}`;
    case "expGain":
      return `經驗獲取: +${(value * 100).toFixed(0)}%`;
    case "turnHpRecover":
      return `每回合回復: +${value.toFixed(0)}`;
    default:
      return `效果: ${value.toFixed(1)}`;
  }
}
