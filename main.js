import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";

// --- Choose a canvas size that fits the device without CSS scaling ---
const TARGET_W = 900;
const TARGET_H = 1100;
const ASPECT   = TARGET_W / TARGET_H;

function computeGameSize() {
  const vw = Math.min(window.innerWidth  || 900, TARGET_W);
  const vh = Math.min(window.innerHeight || 1200, TARGET_H);

  // fit to aspect (no CSS scale)
  let w = vw, h = Math.floor(vw / ASPECT);
  if (h > vh) { h = vh; w = Math.floor(h * ASPECT); }

  // ensure minimums
  w = Math.max(360, w);
  h = Math.max(440, h);
  return { w, h };
}

const { w: GAME_W, h: GAME_H } = computeGameSize();

// Mount into the page container
kaboom({
  width: GAME_W,
  height: GAME_H,
  background: [135, 206, 235],
  font: "gf",
  root: document.getElementById("kaboomRoot"),
});

debug.inspect = false;
setGravity(1700);

// ---- ASSETS ----
loadFont("gf", "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/Super.ttf");
loadSprite("pansy",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/pansy_small.png");
loadSprite("pizza",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/pizza_small.png");
loadSprite("biscoff","https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/biscoff.png");
loadSprite("heart",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/heart2.png");
loadSpriteAtlas("https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/newsprite2.png", {
  gizmo: {
    x: 0, y: 0, width: 32 * 13, height: 96, sliceX: 13, sliceY: 3,
    anims: {
      idle:   { from: 13, to: 18, speed: 7, loop: true },
      jump:   { from: 3,  to: 12, speed: 7, loop: false },
      crouch: { from: 26, to: 37, speed: 17, loop: false },
    },
  },
});

// ---------- OUTLINED TEXT ----------
function outlinedText(
  str,
  { size = 50, fill = rgb(255,255,255), stroke = rgb(0,0,0), strokePx = 3,
    pos: p = vec2(0,0), fixedUI = false, zIndex = 10, font = "gf" } = {},
) {
  const offs = [
    vec2(-1,-1), vec2(0,-1), vec2(1,-1),
    vec2(-1, 0),             vec2(1, 0),
    vec2(-1, 1), vec2(0, 1), vec2(1, 1),
  ].map(o => o.scale(strokePx));

  const flags = fixedUI ? [fixed()] : [];

  const main = add([
    text(str, { size, font }),
    color(fill),
    pos(p),
    anchor("center"),
    z(zIndex),
    ...flags,
    {
      id: "shadowOutline",
      _shadows: [],
      add() {
        this._shadows = offs.map(off =>
          add([
            text(str, { size, font }),
            color(stroke),
            pos(this.pos.add(off)),
            anchor("center"),
            z(zIndex - 1),
            ...flags,
          ]),
        );
      },
      update() {
        for (let i = 0; i < this._shadows.length; i++) {
          const s = this._shadows[i];
          s.pos = this.pos.add(offs[i]);
          s.z = this.z - 1;
          s.text = this.text;
          s.hidden = this.hidden;
        }
      },
      destroy() { this._shadows.forEach((s) => destroy(s)); },
    },
  ]);
  return main;
}

// ---------- In-canvas button ----------
function makeButton(label, centerX, centerY, onPress, { w = 260, h = 96, zBase = 1000 } = {}) {
  const hit = add([
    rect(w, h, { radius: 12 }),
    pos(centerX - w/2, centerY - h/2),
    area({ cursor: "pointer" }),
    color(60, 60, 90),
    fixed(),
    z(zBase),
  ]);

  const lbl = outlinedText(label, {
    size: Math.min(56, Math.floor(h * 0.52)),
    pos: vec2(centerX, centerY + 4),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    zIndex: zBase + 1,
    fixedUI: true,
  });

  hit.onClick(onPress);     // mouse + touch
  hit.onTouchStart(onPress); // (Kaboom also maps touch→click, this is just extra-safe)

  return { hit, lbl };
}

/* ======================= START ======================= */
scene("start", () => {
  outlinedText("GIZMO RUN", {
    size: 96,
    pos: vec2(width() / 2, height() / 2 - 140),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 4,
    fixedUI: true,
  });

  outlinedText("Help Gizmo collect items\nwhile you dodge objects!", {
    size: 40,
    pos: vec2(width() / 2, height() / 2 - 30),
    fill: rgb(46, 221, 11),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    fixedUI: true,
  });

  makeButton("PLAY", width() / 2, height() / 2 + 80, () => go("game"));
});

/* ======================= GAME ======================= */
scene("game", () => {
  const FLOOR_Y = Math.min(780, height() - 320);

  // Ground
  add([
    rect(1400, 400),
    pos(0, FLOOR_Y),
    color(100, 100, 100),
    area({ shape: new Rect(vec2(0, 0), 1200, 40) }),
    body({ isStatic: true }),
  ]);

  // Lives
  let lives = 3;
  let heartSprites = [];
  function rebuildHearts() {
    heartSprites.forEach(h => destroy(h));
    heartSprites = [];
    const margin = 16;
    const gap = 72;
    for (let i = 0; i < lives; i++) {
      const spr = add([
        sprite("heart"),
        pos(width() - margin - i * gap - 120, 36),
        scale(0.15),
        fixed(),
        z(999),
      ]);
      heartSprites.push(spr);
    }
  }
  rebuildHearts();

  // Score + messages
  let score = 0;

  const scoreText = outlinedText("Score: 0", {
    size: 50,
    pos: vec2(180, 80),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    fixedUI: true,
  });

  const topY = 360;
  const hitMsg = outlinedText("", {
    size: 56,
    pos: vec2(width() / 2, topY - 100),
    fill: rgb(255, 0, 0),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    fixedUI: true,
  });
  const centerMsg = outlinedText("", {
    size: 56,
    pos: vec2(width() / 2, topY),
    fill: rgb(255, 0, 0),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    fixedUI: true,
  });

  let hitMsgTimer = 0;
  let centerMsgTimer = 0;
  function showHitMessage(txt = "OUCH!", seconds = 1) {
    hitMsg.text = txt;
    hitMsgTimer = seconds;
  }

  // Player
  const normalBox = { w: 17, h: 20, off: vec2(8, 10) };
  const duckBox   = { w: 17, h:  5, off: vec2(8, 25) };

  const player = add([
    sprite("gizmo", { anim: "idle" }),
    pos(40, 300),
    area({ shape: new Rect(vec2(normalBox.off), normalBox.w, normalBox.h) }),
    body(),
    scale(4),
  ]);

  const DUCK_DURATION = 0.6;
  let isDucking = false;
  let gameOver = false;

  function doJump() {
    if (gameOver) return;
    if (player.isGrounded()) {
      isDucking = false;
      player.play("jump", { loop: false });
      player.jump(530);
      player.use(area({ shape: new Rect(vec2(normalBox.off), normalBox.w, normalBox.h) }));
    }
  }
  function startDuck() {
    if (gameOver) return;
    if (player.isGrounded() && !isDucking) {
      isDucking = true;
      player.play("crouch", { loop: false });
      player.use(area({ shape: new Rect(vec2(duckBox.off), duckBox.w, duckBox.h) }));
      wait(DUCK_DURATION, () => {
        if (!gameOver) {
          isDucking = false;
          if (player.isGrounded()) player.play("idle");
          player.use(area({ shape: new Rect(vec2(normalBox.off), normalBox.w, normalBox.h) }));
        }
      });
    }
  }

  onKeyPress("up", doJump);
  onKeyPress("down", startDuck);

  player.onGround(() => {
    if (gameOver) return;
    if (player.curAnim() !== "crouch" && player.curAnim() !== "idle") {
      player.play("idle");
    }
  });

  // In-canvas mobile buttons (fixed to screen)
  makeButton("JUMP", width()/2 - 140, height() - 70, doJump, { w: 220, h: 90 });
  makeButton("DUCK", width()/2 + 140, height() - 70, startDuck, { w: 220, h: 90 });

  // Spawns (trimmed)
  let speed = 450;
  let globalCooldown = 3;
  const SINGLE_COOLDOWN  = 4;
  const TRIPLET_COOLDOWN = 4;

  let pansyTimer   = 0, pansyDelay   = 2;
  let biscoffTimer = 0, biscoffDelay = 3.8;
  let pizzaTimer   = 0, pizzaDelay   = 5;

  function addDodgeScore() { score++; scoreText.text = "Score: " + score; }

  const TARGET = "GIRLFRIEND?".split("");
  const collected = Array(TARGET.length).fill(false);
  let lettersEnabled = false;
  const LETTERS_UNLOCK_SCORE = 1;

  const letterSlotsByChar = TARGET.reduce((m, ch, i) => ((m[ch] ??= []).push(i), m), {});
  const slots = [];
  const startX = 110, gapX = 56;
  for (let i = 0; i < TARGET.length; i++) {
    const t = outlinedText("", {
      size: 56,
      pos: vec2(startX + i * gapX, topY),
      fill: rgb(46, 221, 11),
      stroke: rgb(0, 0, 0),
      strokePx: 3,
      fixedUI: true,
    });
    slots.push(t);
  }
  function hideLetterSlots(){ slots.forEach(s => s.hidden = true); }
  function showLetterSlots(){ slots.forEach(s => s.hidden = false); }
  function resetLettersProgress(){ for (let i=0;i<collected.length;i++){ collected[i]=false; slots[i].text=""; } showLetterSlots(); }

  let letterTimer = 0, letterDelay = 3.5, lettersCooldown = 0;
  let timeSinceStart = 0, lastNonLetterSpawnAt = -999;
  let nonLetterBlockUntil = 0, letterBlockUntil = 0;
  const LETTER_SAFE_WINDOW = 1.8;

  function remainingCharsPool(){
    const pool = [];
    for (let i = 0; i < TARGET.length; i++) if (!collected[i]) pool.push(TARGET[i]);
    const others = pool.filter((ch) => ch !== "?");
    return others.length > 0 ? others : pool;
  }

  function spawnLetter() {
    const pool = remainingCharsPool();
    if (pool.length === 0) return;

    const ch = pool[Math.floor(Math.random() * pool.length)];
    const lanes = [FLOOR_Y - 55, FLOOR_Y - 140];
    const y = lanes[Math.floor(Math.random() * lanes.length)];

    const o = outlinedText(ch, {
      size: 70,
      pos: vec2(width() + 40, y),
      fill: rgb(46, 221, 11),
      stroke: rgb(0, 0, 0),
      strokePx: 3,
      zIndex: 15,
    });

    o.use(area({ shape: new Rect(vec2(-10, -10), 80, 80) }));
    o.use("letter");
    o.ch = ch;

    o.onUpdate(() => {
      if (gameOver) return;
      o.move(-speed, 0);
      if (o.pos.x < -140) destroy(o);
    });

    lettersCooldown = 3.6;
    nonLetterBlockUntil = timeSinceStart + LETTER_SAFE_WINDOW;
  }

  function spawnPansy() {
    const o = add([ sprite("pansy"), pos(width()+40, FLOOR_Y-50), scale(2.4), area({ shape:new Rect(vec2(0,10),15,15) }), "pansy" ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x< -100){ destroy(o); addDodgeScore(); } });
    globalCooldown = SINGLE_COOLDOWN; lastNonLetterSpawnAt = timeSinceStart;
  }
  function spawnBiscoff() {
    const o = add([ sprite("biscoff"), pos(width()+40, FLOOR_Y-125), scale(2.4), area({ shape:new Rect(vec2(0,15),15,15) }), "biscoff" ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x< -100){ destroy(o); addDodgeScore(); } });
    globalCooldown = SINGLE_COOLDOWN; lastNonLetterSpawnAt = timeSinceStart;
  }
  function spawnPizza(high=false) {
    const yHigh = FLOOR_Y - 115, yLow = FLOOR_Y - 58;
    const o = add([ sprite("pizza"), pos(width()+40, high?yHigh:yLow), scale(2.4), area({ shape:new Rect(vec2(0,10),19,13) }), "pizza" ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x< -100){ destroy(o); addDodgeScore(); } });
  }
  function spawnPizzaTriplet() {
    const patterns = [
      ["J","J","J"], ["J","D","J"], ["D","J","D"],
      ["J","J","D"], ["D","J","J"], ["J","D","D"],
    ];
    const pat = choose(patterns);
    const desiredGapPx = 360;
    const gapTime = desiredGapPx / speed;
    letterBlockUntil = timeSinceStart + (gapTime * 2) + 0.7;

    spawnPizza(pat[0] === "D");
    let nextIndex = 1, elapsed = 0;
    const h = onUpdate(() => {
      if (gameOver){ h.cancel(); return; }
      elapsed += dt();
      while (nextIndex < pat.length && elapsed >= nextIndex*gapTime) {
        spawnPizza(pat[nextIndex] === "D");
        nextIndex++;
      }
      if (nextIndex >= pat.length) h.cancel();
    });
    globalCooldown = TRIPLET_COOLDOWN; lastNonLetterSpawnAt = timeSinceStart;
  }

  function loseLifeAndCheck(o) {
    destroy(o);
    showHitMessage("OUCH!", 1);
    lives = Math.max(0, lives - 1);
    rebuildHearts();

    if (lives <= 0) {
      resetLettersProgress();
      gameOver = true;
      centerMsg.text = "GAME OVER";
      centerMsgTimer = 4;
      speed = 0;
      wait(4, () => go("start"));
    }
  }

  player.onCollide("pansy", loseLifeAndCheck);
  player.onCollide("biscoff", loseLifeAndCheck);
  player.onCollide("pizza", loseLifeAndCheck);

  player.onCollide("letter", (o) => {
    if (gameOver) return;
    const ch = o.ch;
    const bucket = letterSlotsByChar[ch] || [];
    for (const idx of bucket) {
      if (!collected[idx]) { collected[idx] = true; slots[idx].text = TARGET[idx]; break; }
    }
    destroy(o);

    if (collected.every(Boolean)) {
      hideLetterSlots();
      gameOver = true;
      centerMsg.text = "Be My Girlfriend? :)";
      centerMsgTimer = 20;
      speed = 0;
    }
  });

  // Loop
  let speed = 450;
  let globalCooldown = 3;
  let pansyTimer = 0, biscoffTimer = 0, pizzaTimer = 0;
  let pansyDelay = 2, biscoffDelay = 3.8, pizzaDelay = 5;
  let lettersEnabled = false;
  const LETTERS_UNLOCK_SCORE = 1;
  let letterTimer = 0, lettersCooldown = 0, letterDelay = 3.5;
  let timeSinceStart = 0, lastNonLetterSpawnAt = -999;
  let nonLetterBlockUntil = 0, letterBlockUntil = 0;

  onUpdate(() => {
    if (gameOver) {
      if (hitMsgTimer    > 0){ hitMsgTimer    -= dt(); if (hitMsgTimer    <= 0) hitMsg.text = ""; }
      if (centerMsgTimer > 0){ centerMsgTimer -= dt(); if (centerMsgTimer <= 0) centerMsg.text = ""; }
      return;
    }

    timeSinceStart += dt();

    if (hitMsgTimer    > 0){ hitMsgTimer    -= dt(); if (hitMsgTimer    <= 0) hitMsg.text = ""; }
    if (centerMsgTimer > 0){ centerMsgTimer -= dt(); if (centerMsgTimer <= 0) centerMsg.text = ""; }

    if (globalCooldown > 0) globalCooldown -= dt();
    if (lettersCooldown > 0) lettersCooldown -= dt();

    pizzaTimer += dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pizzaTimer >= pizzaDelay) {
      pizzaTimer = 0; pizzaDelay = rand(5, 7); spawnPizzaTriplet();
    }

    pansyTimer += dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pansyTimer >= pansyDelay) {
      pansyTimer = 0; spawnPansy(); if (pansyDelay > 1.2) pansyDelay -= 0.02;
    }

    biscoffTimer += dt();
    if (timeSinceStart >= nonLetterBlockUntil && biscoffTimer >= biscoffDelay) {
      if (globalCooldown <= 0.5) { biscoffTimer = 0; biscoffDelay = rand(3.8, 6.0); spawnBiscoff(); }
    }

    if (!lettersEnabled && score >= LETTERS_UNLOCK_SCORE) lettersEnabled = true;
    if (lettersEnabled) {
      letterTimer += dt();
      const letterGapSinceLast = 1.25;
      const timeSinceNonLetter = timeSinceStart - lastNonLetterSpawnAt;
      if (timeSinceStart >= letterBlockUntil && letterTimer >= letterDelay && lettersCooldown <= 0 && timeSinceNonLetter >= letterGapSinceLast) {
        letterTimer = 0; letterDelay = rand(3.0, 5.0); spawnLetter();
      }
    }

    speed += dt() * 2.1;

    if (player.isGrounded() && player.curAnim() !== "crouch" && player.curAnim() !== "idle") {
      player.play("idle");
      player.use(area({ shape: new Rect(vec2(normalBox.off), normalBox.w, normalBox.h) }));
      isDucking = false;
    }
  });
});

// Boot into start screen
go("start");
