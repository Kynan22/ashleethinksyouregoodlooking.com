import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";
kaboom({
  width: 900,
  height: 1100,
  background: [135, 206, 235],
  font: "gf",
  root: document.getElementById("game"), // ensures canvas is inside game container
});

debug.inspect = false;
setGravity(1700);

// ---- ASSETS ----
loadFont(
  "gf",
  "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/Super.ttf"
);

loadSprite("pansy",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/pansy_small.png");
loadSprite("pizza",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/pizza_small.png");
loadSprite("biscoff","https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/biscoff.png");
loadSprite("heart",   "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/heart2.png");

loadSpriteAtlas(
  "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/refs/heads/main/newsprite2.png",
  {
    gizmo: {
      x: 0, y: 0, width: 32 * 13, height: 96, sliceX: 13, sliceY: 3,
      anims: {
        idle:   { from: 13, to: 18, speed: 7, loop: true },
        jump:   { from: 3,  to: 12, speed: 7, loop: false },
        crouch: { from: 26, to: 37, speed: 17, loop: false },
      },
    },
  }
);

// ---------- OUTLINED TEXT (center-anchored & symmetric) ----------
function outlinedText(
  str,
  {
    size = 50,
    fill = rgb(255, 255, 255),
    stroke = rgb(0, 0, 0),
    strokePx = 3,
    pos: p = vec2(0, 0),
    fixedUI = false,
    zIndex = 10,
    font = "gf",
  } = {}
) {
  const offs = [
    vec2(-1, -1), vec2(0, -1), vec2(1, -1),
    vec2(-1,  0),               vec2(1,  0),
    vec2(-1,  1), vec2(0,  1), vec2(1,  1),
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
          ])
        );
      },
      update() {
        for (let i = 0; i < this._shadows.length; i++) {
          const s = this._shadows[i];
          s.pos = this.pos.add(offs[i]);
          s.z = this.z - 1;
          s.text = this.text;
          // NEW: keep hidden state in sync so outlines vanish too
          s.hidden = this.hidden;
        }
      },
      destroy() {
        this._shadows.forEach((s) => destroy(s));
      },
    },
  ]);
  return main;
}

// ---------- SHARED UI BUTTON ----------
function makeButton(label, centerX, centerY, onPress, { w = 380, h = 300, zBase = 1000 } = {}) {
  const btn = add([
    rect(w, h, { radius: 12 }),
    pos(centerX - w / 2, centerY - h / 2),
    area(),
    color(60, 60, 90),
    fixed(),
    z(zBase),
  ]);

  const lbl = outlinedText(label, {
    size: Math.min(120, Math.floor(h * 0.4)),
    pos: vec2(centerX, centerY + 6),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 4,
    zIndex: zBase + 1,
    fixedUI: true,
  });

  btn.onClick(onPress);
  return { btn, lbl };
}

// ======================= START SCENE =======================
scene("start", () => {
  outlinedText("GIZMO RUN", {
    size: 120,
    pos: vec2(width() / 2, height() / 2 - 200),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 4,
    zIndex: 5,
    fixedUI: true,
  });

  outlinedText("Help Gizmo collect items\nwhile you dodge objects!", {
    size: 48,
    pos: vec2(width() / 2, height() / 2 - 70),
    fill: rgb(46, 221, 11),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 5,
    fixedUI: true,
  });

  makeButton("PLAY", width() / 2, height() / 2 + 100, () => go("game"), {
    w: 420, h: 160, zBase: 1000,
  });
});

// ======================= GAME SCENE =======================
scene("game", () => {
  const FLOOR_Y = 780;

  // Ground
  add([
    rect(1400, 400),
    pos(0, FLOOR_Y),
    color(100, 100, 100),
    area({ shape: new Rect(vec2(0, 0), 1200, 40) }),
    body({ isStatic: true }),
  ]);

  // --- LIVES (hearts) ---
  let lives = 3;
  let heartSprites = [];
  function rebuildHearts() {
    heartSprites.forEach(h => destroy(h));
    heartSprites = [];
    const margin = 20;
    const gap = 85;
    for (let i = 0; i < lives; i++) {
      const spr = add([
        sprite("heart"),
        pos(width() - margin - i * gap - 140, 40),
        scale(0.15),
        fixed(),
        z(999),
      ]);
      heartSprites.push(spr);
    }
  }
  rebuildHearts();

  // --- SCORE / MESSAGES ---
  let score = 0;

  const scoreText = outlinedText("Score: 0", {
    size: 70,
    pos: vec2(200, 95),
    fill: rgb(255, 255, 255),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 20,
    fixedUI: true,
  });

  // NEW: split messages
  const topY = 400; // (used again below; keep consistent with slots)
  const hitMsg = outlinedText("", {
    size: 65,
    pos: vec2(width() / 2, topY - 120), // OUCH above collected letters
    fill: rgb(255, 0, 0),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 20,
    fixedUI: true,
  });
  const centerMsg = outlinedText("", {
    size: 65,
    pos: vec2(width() / 2, topY), // exactly where collected letters sit
    fill: rgb(255, 0, 0),
    stroke: rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 20,
    fixedUI: true,
  });

  let hitMsgTimer = 0;
  let centerMsgTimer = 0;
  function showHitMessage(txt = "OUCH!", seconds = 1) {
    hitMsg.text = txt;
    hitMsgTimer = seconds;
  }

  // --- PLAYER ---
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

  // --- SPAWN / DIFFICULTY ---
  let speed = 450;
  let globalCooldown = 3;
  const SINGLE_COOLDOWN  = 4;
  const TRIPLET_COOLDOWN = 4;

  let pansyTimer   = 0, pansyDelay   = 2;
  let biscoffTimer = 0, biscoffDelay = 3.8;
  let pizzaTimer   = 0, pizzaDelay   = 5;

  // --- SCORE HELPERS ---
  function addDodgeScore() {
    score++;
    scoreText.text = "Score: " + score;
  }

  // =======================
  // LETTERS: GIRLFRIEND?
  // =======================
  const TARGET = "GIRLFRIEND?".split("");
  const collected = Array(TARGET.length).fill(false);

  let lettersEnabled = false;
  const LETTERS_UNLOCK_SCORE = 1;

  const letterSlotsByChar = TARGET.reduce((map, ch, idx) => {
    if (!map[ch]) map[ch] = [];
    map[ch].push(idx);
    return map;
  }, {});

  // UI slots (white)
  const slots = [];
  const startX = 130, gapX = 60;
  for (let i = 0; i < TARGET.length; i++) {
    const t = outlinedText("", {
      size: 65,
      pos: vec2(startX + i * gapX, topY),
      fill: rgb(46, 221, 11),
      stroke: rgb(0, 0, 0),
      strokePx: 3,
      zIndex: 10,
      fixedUI: true,
    });
    slots.push(t);
  }

  function hideLetterSlots() {
    slots.forEach(s => s.hidden = true);
  }
  function showLetterSlots() {
    slots.forEach(s => s.hidden = false);
  }
  function resetLettersProgress() {
    for (let i = 0; i < collected.length; i++) {
      collected[i] = false;
      slots[i].text = "";
    }
    showLetterSlots();
  }

  // letter spawn timing & spacing
  let letterTimer = 0;
  let letterDelay = 3.5;
  let lettersCooldown = 0;
  let timeSinceStart = 0;
  let lastNonLetterSpawnAt = -999;

  // Blocks for spacing logic
  let nonLetterBlockUntil = 0;  // after letters, block obstacles briefly
  let letterBlockUntil    = 0;  // during pizza trio, block letters

  const LETTER_SAFE_WINDOW = 1.8; // seconds of safety after a letter spawns (slightly bigger)

  function remainingCharsPool() {
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
      size: 85,
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
    // Block incoming obstacles for a bit so this letter is safe to reach
    nonLetterBlockUntil = timeSinceStart + LETTER_SAFE_WINDOW;
  }

  // --- SPAWNERS ---
  function spawnPansy() {
    const o = add([
      sprite("pansy"),
      pos(width() + 40, FLOOR_Y - 50),
      scale(2.4),
      area({ shape: new Rect(vec2(0, 10), 15, 15) }),
      "pansy",
    ]);
    o.onUpdate(() => {
      o.move(-speed, 0);
      if (o.pos.x < -100) { destroy(o); addDodgeScore(); }
    });
    globalCooldown = SINGLE_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  function spawnBiscoff() {
    const o = add([
      sprite("biscoff"),
      pos(width() + 40, FLOOR_Y - 125),
      scale(2.4),
      area({ shape: new Rect(vec2(0, 15), 15, 15) }),
      "biscoff",
    ]);
    o.onUpdate(() => {
      o.move(-speed, 0);
      if (o.pos.x < -100) { destroy(o); addDodgeScore(); }
    });
    globalCooldown = SINGLE_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  function spawnPizza(high = false) {
    const yHigh = FLOOR_Y - 115;
    const yLow  = FLOOR_Y - 58;
    const o = add([
      sprite("pizza"),
      pos(width() + 40, high ? yHigh : yLow),
      scale(2.4),
      area({ shape: new Rect(vec2(0, 10), 19, 13) }),
      "pizza",
    ]);
    o.onUpdate(() => {
      o.move(-speed, 0);
      if (o.pos.x < -100) { destroy(o); addDodgeScore(); }
    });
  }

  function spawnPizzaTriplet() {
    const patterns = [
      ["J","J","J"], ["J","D","J"], ["D","J","D"],
      ["J","J","D"], ["D","J","J"], ["J","D","D"],
    ];
    const pat = choose(patterns);

    const desiredGapPx = 360;
    const gapTime = desiredGapPx / speed;

    // When a trio starts, block letters long enough to cover the next 2 spawns + padding
    letterBlockUntil = timeSinceStart + (gapTime * 2) + 0.7; // <-- bigger buffer for 2nd & 3rd pizza

    spawnPizza(pat[0] === "D");

    let nextIndex = 1;
    let elapsed = 0;

    const handle = onUpdate(() => {
      if (gameOver) { handle.cancel(); return; }
      elapsed += dt();
      while (nextIndex < pat.length && elapsed >= nextIndex * gapTime) {
        spawnPizza(pat[nextIndex] === "D");
        nextIndex++;
      }
      if (nextIndex >= pat.length) handle.cancel();
    });

    globalCooldown = TRIPLET_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  // --- HITS & LIVES ---
  function loseLifeAndCheck(o) {
    destroy(o);
    showHitMessage("OUCH!", 1);

    lives = Math.max(0, lives - 1);
    rebuildHearts();

    if (lives <= 0) {
      // On true game over, wipe letter progress
      resetLettersProgress();

      gameOver = true;
      centerMsg.text = "GAME OVER";
      centerMsgTimer = 4;
      speed = 0;
      wait(4, () => go("start"));
    }
  }

  player.onCollide("pansy",   loseLifeAndCheck);
  player.onCollide("biscoff", loseLifeAndCheck);
  player.onCollide("pizza",   loseLifeAndCheck);

  player.onCollide("letter", (o) => {
    if (gameOver) return;
    const ch = o.ch;

    const bucket = letterSlotsByChar[ch] || [];
    for (const idx of bucket) {
      if (!collected[idx]) {
        collected[idx] = true;
        slots[idx].text = TARGET[idx];
        break;
      }
    }
    destroy(o);

    // Completed phrase -> hide white progress & show proposal at the same Y
    if (collected.every(Boolean)) {
      hideLetterSlots();
      gameOver = true;
      centerMsg.text = "Be My Girlfriend? :)"; // same vertical as slots
      centerMsgTimer = 20.0;
      speed = 0;
    }
  });

  // --- LOOP ---
  onUpdate(() => {
    if (gameOver) {
      if (hitMsgTimer > 0)   { hitMsgTimer   -= dt(); if (hitMsgTimer   <= 0) hitMsg.text = ""; }
      if (centerMsgTimer > 0){ centerMsgTimer-= dt(); if (centerMsgTimer<= 0) centerMsg.text = ""; }
      return;
    }

    timeSinceStart += dt();

    if (hitMsgTimer > 0)    { hitMsgTimer    -= dt(); if (hitMsgTimer    <= 0) hitMsg.text = ""; }
    if (centerMsgTimer > 0) { centerMsgTimer -= dt(); if (centerMsgTimer <= 0) centerMsg.text = ""; }

    if (globalCooldown > 0) globalCooldown -= dt();
    if (lettersCooldown > 0) lettersCooldown -= dt();

    // PIZZA TRIO (only if we're not inside the letter safe window)
    pizzaTimer += dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pizzaTimer >= pizzaDelay) {
      pizzaTimer = 0;
      pizzaDelay = rand(5, 7);
      spawnPizzaTriplet();
    }

    // PANSY
    pansyTimer += dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pansyTimer >= pansyDelay) {
      pansyTimer = 0;
      spawnPansy();
      if (pansyDelay > 1.2) pansyDelay -= 0.02;
    }

    // BISCOFF
    biscoffTimer += dt();
    if (timeSinceStart >= nonLetterBlockUntil && biscoffTimer >= biscoffDelay) {
      if (globalCooldown <= 0.5) {
        biscoffTimer = 0;
        biscoffDelay = rand(3.8, 6.0);
        spawnBiscoff();
      }
    }

    // LETTERS (now also respect letterBlockUntil so they don't spawn during a trio)
    if (!lettersEnabled && score >= LETTERS_UNLOCK_SCORE) lettersEnabled = true;
    if (lettersEnabled) {
      letterTimer += dt();

      const letterGapSinceLast = 1.25;
      const timeSinceNonLetter = timeSinceStart - lastNonLetterSpawnAt;

      if (
        timeSinceStart >= letterBlockUntil &&         // NEW: don't spawn letters during pizza trios
        letterTimer >= letterDelay &&
        lettersCooldown <= 0 &&
        timeSinceNonLetter >= letterGapSinceLast
      ) {
        letterTimer = 0;
        letterDelay = rand(3.0, 5.0);
        spawnLetter();
      }
    }

    // speed ramp
    speed += dt() * 2.1;

    // keep idle after landing
    if (player.isGrounded() && player.curAnim() !== "crouch" && player.curAnim() !== "idle") {
      player.play("idle");
      player.use(area({ shape: new Rect(vec2(normalBox.off), normalBox.w, normalBox.h) }));
      isDucking = false;
    }
  });

  // --- MOBILE BUTTONS (bottom) ---
  makeButton("JUMP", 225, 945, () => doJump(),  { w: 430, h: 280 });
  makeButton("DUCK", 670, 945, () => startDuck(), { w: 430, h: 280 });
});

// Boot into start screen
go("start");
