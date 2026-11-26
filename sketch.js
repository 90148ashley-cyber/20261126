// --- 背景變數 ---
let bgImg;
let bgX = 0;

// --- 角色 1 變數（請依你原本的角色 1 圖片與邏輯替換）---
let char1X;
let char1Y;
let char1Facing = 1; // 1 向右, -1 向左
let char1Speed = 5;

// --- 角色 2 精靈圖變數（第一段設定：stop 10張 885*191 / action 12張 1627*171）---
let char2StopSheet, char2ActionSheet;
let char2StopFrames = [];
let char2ActionFrames = [];

const CHAR2_STOP_COUNT = 10;
const CHAR2_STOP_W = 885;
const CHAR2_STOP_H = 191;

const CHAR2_ACTION_COUNT = 12;
const CHAR2_ACTION_W = 1627;
const CHAR2_ACTION_H = 171;

let char2FrameIndex = 0;
let triggerDistance = 220; // 角色 1 與角色 2 接近觸發距離

// --- 數學加法選擇題與按鈕變數 ---
let isQuizOpen = false;
let currentQuestion = null;
let optionButtons = [];
let feedbackMessage = '';
let answeredCurrentApproach = false;

// --- 特效變數（各持續 3 秒 = 3000 毫秒）---
const EFFECT_DURATION = 3000;
let fireworkEndTime = 0;
let lightningEndTime = 0;
let particles = [];
let lightningBolts = [];

function preload() {
  // 背景圖採用 bg/3.png
  bgImg = loadImage('bg/3.png');

  // 角色 2 精靈圖
  char2StopSheet = loadImage('2/stop/stop.png');
  char2ActionSheet = loadImage('2/action/action.png');

  // TODO: 若角色 1 有自己的精靈圖，請在這裡載入
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);

  // 切割 2/stop/stop.png（10 張，全寬 885，高 191）
  let singleStopW = CHAR2_STOP_W / CHAR2_STOP_COUNT;
  for (let i = 0; i < CHAR2_STOP_COUNT; i++) {
    char2StopFrames.push(
      char2StopSheet.get(i * singleStopW, 0, singleStopW, CHAR2_STOP_H)
    );
  }

  // 切割 2/action/action.png（12 張，全寬 1627，高 171）
  let singleActionW = CHAR2_ACTION_W / CHAR2_ACTION_COUNT;
  for (let i = 0; i < CHAR2_ACTION_COUNT; i++) {
    char2ActionFrames.push(
      char2ActionSheet.get(i * singleActionW, 0, singleActionW, CHAR2_ACTION_H)
    );
  }

  char1X = width / 2;
  char1Y = height * 0.75;

  generateAdditionQuestion();
}

function draw() {
  background(220);

  // 1. 處理角色移動與背景捲動
  handleMovement();

  // 2. 繪製左右各複製一張、共三張並排的 bg/3.png 背景
  let leftBgCenterX = width / 2 + bgX - width;
  let midBgCenterX = width / 2 + bgX;
  let rightBgCenterX = width / 2 + bgX + width;

  image(bgImg, leftBgCenterX, height / 2, width, height);
  image(bgImg, midBgCenterX, height / 2, width, height);
  image(bgImg, rightBgCenterX, height / 2, width, height);

  // 3. 角色 2 顯示在最左邊背景圖的中間（位於角色 1 左側）
  let char2X = leftBgCenterX;
  let char2Y = char1Y;
  let distance = dist(char1X, char1Y, char2X, char2Y);
  let isNear = distance < triggerDistance;

  drawCharacter2(char2X, char2Y, isNear);

  // 4. 繪製角色 1
  drawCharacter1();

  // 5. 處理接近觸發的黃色加法選擇題方框與 4 個選項按鈕
  handleQuizBox(isNear);

  // 6. 繪製 3 秒放煙火或 3 秒閃電特效
  drawEffects();
}

function handleMovement() {
  if (keyIsDown(LEFT_ARROW)) {
    char1Facing = -1;
    bgX += char1Speed;
    if (bgX > width) {
      bgX = width;
    }
  } else if (keyIsDown(RIGHT_ARROW)) {
    char1Facing = 1;
    bgX -= char1Speed;
    if (bgX < -width) {
      bgX = -width;
    }
  }
}

function drawCharacter2(x, y, isNear) {
  if (frameCount % 6 === 0) {
    char2FrameIndex++;
  }

  let frameImg;
  if (isNear) {
    frameImg = char2ActionFrames[char2FrameIndex % CHAR2_ACTION_COUNT];
  } else {
    frameImg = char2StopFrames[char2FrameIndex % CHAR2_STOP_COUNT];
  }

  push();
  translate(x, y);

  // 角色 1 在角色 2 左邊（char1X < x）時，角色 2 轉向朝左
  if (char1X < x) {
    scale(-1, 1);
  } else {
    scale(1, 1);
  }

  image(frameImg, 0, 0);
  pop();
}

function drawCharacter1() {
  push();
  translate(char1X, char1Y);
  scale(char1Facing, 1);

  // TODO: 請將這裡替換成你原本的角色 1 精靈圖繪製程式碼
  fill(70, 130, 220);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, 60, 110, 8);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('角色1', 0, 0);

  pop();
}

// --- 黃色加法選擇題方框與按鈕 ---
function handleQuizBox(isNear) {
  if (isNear && !answeredCurrentApproach) {
    if (!isQuizOpen) {
      openQuiz();
    }
  } else if (!isNear) {
    if (isQuizOpen) {
      closeQuiz();
    }
    answeredCurrentApproach = false;
    feedbackMessage = '';
  }

  if (!isQuizOpen || !currentQuestion) return;

  // 方框尺寸：高為畫布高 1/2，寬為畫布寬 1/3；上方靠近畫布上方，中間對準畫布中間
  let boxW = width / 3;
  let boxH = height / 2;
  let boxLeft = width / 2 - boxW / 2;
  let boxTop = 12;

  push();
  rectMode(CORNER);
  fill(255, 225, 0, 90); // 透明度為 90 的黃色方框
  stroke(180, 140, 0, 180);
  strokeWeight(2);
  rect(boxLeft, boxTop, boxW, boxH, 12);

  fill(20);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(min(26, boxW * 0.075));
  text(
    `加法挑戰：${currentQuestion.a} + ${currentQuestion.b} = ?`,
    boxLeft + boxW / 2,
    boxTop + boxH * 0.14
  );

  if (feedbackMessage) {
    textSize(min(18, boxW * 0.05));
    fill(30);
    text(feedbackMessage, boxLeft + boxW / 2, boxTop + boxH * 0.78);
  }
  pop();

  layoutOptionButtons(boxLeft, boxTop, boxW, boxH);
}

function generateAdditionQuestion() {
  let a = floor(random(1, 21));
  let b = floor(random(1, 21));
  let answer = a + b;

  let choices = new Set([answer]);
  while (choices.size < 4) {
    let offset = floor(random(-6, 7));
    let candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer) {
      choices.add(candidate);
    }
  }

  let shuffled = Array.from(choices);
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  currentQuestion = {
    a,
    b,
    answer,
    options: shuffled
  };
}

function openQuiz() {
  generateAdditionQuestion();
  feedbackMessage = '';
  isQuizOpen = true;

  clearOptionButtons();
  for (let i = 0; i < 4; i++) {
    let val = currentQuestion.options[i];
    let btn = createButton(`${val}`);
    btn.mousePressed(() => checkAnswer(val));
    btn.style('font-size', '18px');
    btn.style('font-weight', 'bold');
    btn.style('border-radius', '8px');
    btn.style('border', '1px solid #888');
    btn.style('background-color', 'rgba(255, 255, 255, 0.92)');
    btn.style('cursor', 'pointer');
    optionButtons.push(btn);
  }
}

function layoutOptionButtons(boxLeft, boxTop, boxW, boxH) {
  let cols = 2;
  let rows = 2;
  let gapX = boxW * 0.06;
  let gapY = boxH * 0.05;
  let btnW = (boxW - gapX * 3) / cols;
  let btnH = min(46, (boxH * 0.36 - gapY) / rows);
  let startX = boxLeft + gapX;
  let startY = boxTop + boxH * 0.34;

  for (let i = 0; i < optionButtons.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = startX + col * (btnW + gapX);
    let y = startY + row * (btnH + gapY);
    optionButtons[i].position(x, y);
    optionButtons[i].size(btnW, btnH);
  }
}

function checkAnswer(selectedValue) {
  if (!currentQuestion) return;

  answeredCurrentApproach = true;
  if (selectedValue === currentQuestion.answer) {
    feedbackMessage = '答對了！放煙火慶祝！';
    startFireworks(EFFECT_DURATION);
  } else {
    feedbackMessage = `答錯囉！正確答案是 ${currentQuestion.answer}`;
    startLightning(EFFECT_DURATION);
  }

  setTimeout(() => {
    closeQuiz();
  }, 600);
}

function closeQuiz() {
  isQuizOpen = false;
  clearOptionButtons();
}

function clearOptionButtons() {
  for (let btn of optionButtons) {
    btn.remove();
  }
  optionButtons = [];
}

// --- 3 秒放煙火特效 ---
function startFireworks(durationMs) {
  fireworkEndTime = millis() + durationMs;
  particles = [];
  spawnFireworkBurst();
}

function spawnFireworkBurst() {
  let bursts = 3;
  for (let b = 0; b < bursts; b++) {
    let cx = random(width * 0.2, width * 0.8);
    let cy = random(height * 0.2, height * 0.6);
    let palette = [
      color(255, 80, 80),
      color(255, 210, 60),
      color(80, 220, 255),
      color(160, 255, 110),
      color(255, 130, 230)
    ];
    let baseCol = random(palette);

    for (let i = 0; i < 45; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 8);
      particles.push({
        x: cx,
        y: cy,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        col: baseCol,
        size: random(4, 8)
      });
    }
  }
}

// --- 3 秒閃電特效 ---
function startLightning(durationMs) {
  lightningEndTime = millis() + durationMs;
  lightningBolts = [];
  createLightningBolt();
}

function createLightningBolt() {
  let points = [];
  let x = random(width * 0.2, width * 0.8);
  let y = 0;
  points.push({ x, y });

  while (y < height * 0.85) {
    x += random(-45, 45);
    y += random(25, 55);
    points.push({ x, y });
  }
  lightningBolts = points;
}

function drawEffects() {
  let now = millis();

  if (now < fireworkEndTime) {
    if (frameCount % 25 === 0) {
      spawnFireworkBurst();
    }

    push();
    noStroke();
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.985;
      p.alpha -= 4;

      fill(red(p.col), green(p.col), blue(p.col), max(0, p.alpha));
      ellipse(p.x, p.y, p.size, p.size);

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }
    pop();
  } else {
    particles = [];
  }

  if (now < lightningEndTime) {
    if (frameCount % 8 === 0) {
      createLightningBolt();
    }

    push();
    if (frameCount % 6 < 2) {
      fill(255, 255, 220, 65);
      noStroke();
      rect(0, 0, width, height);
    }

    if (lightningBolts.length > 1) {
      stroke(255, 250, 120, 230);
      strokeWeight(9);
      noFill();
      beginShape();
      for (let pt of lightningBolts) {
        vertex(pt.x, pt.y);
      }
      endShape();

      stroke(255);
      strokeWeight(3);
      beginShape();
      for (let pt of lightningBolts) {
        vertex(pt.x, pt.y);
      }
      endShape();
    }
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  char1Y = height * 0.75;
}