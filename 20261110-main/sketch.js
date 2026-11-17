let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let bgImg; // 儲存背景圖片
let bgX = 0; // 記錄背景目前的水平位移

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入角色圖片與背景
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
  bgImg = loadImage("0.png"); // 載入背景圖片（修改為根目錄下的 0.png）
} // 結束圖片載入函式

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓角色座標代表影格的中心點
  characterX = (width * 2) / 3; // 將角色初始位置設在畫布寬度的三分之二處
  frameRate(60); // 將動畫更新速率設定為每秒六十格
} // 結束初始化函式

function draw() { // 每個畫面更新一次背景與角色
  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切換狀態
  
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算移動速度

  // 計算背景圖片在畫布上的寬度（等比例縮放填滿畫布高度）
  let bgDrawWidth = width;
  let bgDrawHeight = height;
  if (bgImg) {
    bgDrawWidth = (bgImg.width / bgImg.height) * height;
  }

  // 設定背景滾動的極限範圍（因為有三張串接，總寬度為 bgDrawWidth * 3）
  let maxBgX = bgDrawWidth; 
  let minBgX = -bgDrawWidth;

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    // 檢查背景是否還沒到最右邊（也就是 bgX 大於最小極限）
    if (bgX > minBgX) {
      bgX -= movementStep; // 背景往左移動
    } else {
      // 背景到底了，角色往右移動
      const characterHeight = height / 3;
      const characterScale = characterHeight / frameHeight;
      const characterWidth = frameWidth * characterScale;
      characterX += movementStep;
      characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    // 檢查背景是否還沒到最左邊（也就是 bgX 小於最大極限）
    if (bgX < maxBgX) {
      bgX += movementStep; // 背景往右移動
    } else {
      // 背景到底了，角色往左移動
      const characterHeight = height / 3;
      const characterScale = characterHeight / frameHeight;
      const characterWidth = frameWidth * characterScale;
      characterX -= movementStep;
      characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);
    }
  }

  // --- 繪製三張串接的背景 ---
  imageMode(CORNER);
  if (bgImg) {
    image(bgImg, bgX - bgDrawWidth, 0, bgDrawWidth, height);
    image(bgImg, bgX, 0, bgDrawWidth, height);
    image(bgImg, bgX + bgDrawWidth, 0, bgDrawWidth, height);
  }
  imageMode(CENTER); // 恢復為角色使用的 CENTER 模式

  // --- 計算角色尺寸與位置 ---
  const characterHeight = height / 3; // 角色高度為畫布高度的 1/3
  const characterScale = characterHeight / frameHeight; // 依原本圖片高度計算等比例縮放倍率
  const characterWidth = frameWidth * characterScale; // 依比例計算角色寬度

  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) { // 檢查施法動畫是否已完整播放一次
    isCasting = false; // 結束施法動畫並恢復一般角色動作
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection }); // 在角色前方建立朝施法方向飛行的特效
  } // 結束施法動畫完成判斷

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite; // 根據角色狀態選擇精靈圖
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite; 
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth; 
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight; 
  const elapsedMagicFrames = frameCount - magicStartFrame; 
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount; 
  const sourceX = frameIndex * activeFrameWidth; 
  const activeWidth = activeFrameWidth * characterScale; 
  const activeHeight = activeFrameHeight * characterScale; 
  const characterY = height - activeHeight / 2; // 將角色底部對齊畫布底部

  push(); 
  translate(characterX, characterY); 
  scale(isCasting ? magicDirection : facingDirection, 1); 
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight); 
  pop(); 

  // --- 處理魔法特效 ---
  const effectScale = characterScale; 
  const effectWidth = effectFrameWidth * effectScale; 
  const effectHeight = effectFrameHeight * effectScale; 
  const effectSpeed = max(6, width * 0.008); 
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) { 
    const effect = activeEffects[effectIndex]; 
    effect.x += effect.direction * effectSpeed; 
    if (effect.x > width || effect.x < 0) { 
      activeEffects.splice(effectIndex, 1); 
      continue; 
    } 
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount; 
    push(); 
    translate(effect.x, effect.y); 
    scale(effect.direction, 1); 
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight); 
    pop(); 
  } 
} // 結束繪圖函式

function keyPressed() { // 按下方向鍵時切換角色狀態與朝向
  if (keyCode === RIGHT_ARROW) { 
    isWalking = true; 
    facingDirection = 1; 
    return false; 
  } 
  if (keyCode === LEFT_ARROW) { 
    isWalking = true; 
    facingDirection = -1; 
    return false; 
  } 
  if (keyCode === 32) { // 空白鍵施法
    if (!spaceIsDown && !isCasting) { 
      isCasting = true; 
      magicStartFrame = frameCount; 
      magicDirection = facingDirection; 
    } 
    spaceIsDown = true; 
    return false; 
  } 
} 

function keyReleased() { 
  if (keyCode === 32) { 
    spaceIsDown = false; 
  } 
} 

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
}