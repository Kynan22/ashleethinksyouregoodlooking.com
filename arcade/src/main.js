import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";

// Make a kaboom context and use it everywhere
const k = kaboom({
  width: 900,
  height: 1100,
  background: [135, 206, 235],
  font: "gf",
  root: document.getElementById("game"),
});

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyvaiqmHYLOm1W0PvML1n41oaPpqzAISqjBsy74t6QzF5nBeiZKoTJVvoFe-Ewj7cqy/exec";

let globalHighScore = {
  name: "Anonymous",
  score: 0,
};

const PLAYER_NAME_KEY = "gizmo_player_name";
const HIGH_SCORE_CACHE_KEY = "gizmo_highscore_cache_v1";

// ---------- Highscore cache (for instant display on start) ----------
function loadHighScoreCache() {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_CACHE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (typeof obj.name === "string" && Number.isFinite(obj.score)) {
      globalHighScore = { name: obj.name, score: obj.score };
    }
  } catch (e) {
    console.warn("Failed to load highscore cache", e);
  }
}

function saveHighScoreCache(hs) {
  try {
    localStorage.setItem(HIGH_SCORE_CACHE_KEY, JSON.stringify(hs));
  } catch (e) {
    console.warn("Failed to save highscore cache", e);
  }
}

// load cache once on startup
loadHighScoreCache();

// GET shared highscore from Google Sheet
async function loadHighScoreFromSheet() {
  try {
    const res = await fetch(SHEET_API_URL);
    const data = await res.json();
    globalHighScore = {
      name: data.name || "Anonymous",
      score: Number(data.score || 0),
    };
    saveHighScoreCache(globalHighScore);
    return globalHighScore;
  } catch (err) {
    console.error("Failed to fetch highscore from sheet", err);
    return globalHighScore;
  }
}

// POST new highscore to Google Sheet
async function submitHighScoreToSheet(name, score) {
  try {
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",          // fire-and-forget
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, score }),
    });
  } catch (err) {
    console.error("Failed to submit highscore to sheet", err);
  }
}

// Called when a player beats the global highscore (on death only)
function checkAndSubmitHighScore(score) {
  if (score <= globalHighScore.score) return;

  if (typeof window.openHighScoreModal === "function") {
    window.openHighScoreModal(score, (name) => {
      globalHighScore = { name, score };
      localStorage.setItem(PLAYER_NAME_KEY, name);
      saveHighScoreCache(globalHighScore);
      submitHighScoreToSheet(name, score);
    });
  } else {
    const defaultName = localStorage.getItem(PLAYER_NAME_KEY) || "";
    const entered = window.prompt("New HIGH SCORE! Enter your name:", defaultName);
    const name = (entered && entered.trim()) || defaultName || "Anonymous";
    localStorage.setItem(PLAYER_NAME_KEY, name);
    globalHighScore = { name, score };
    saveHighScoreCache(globalHighScore);
    submitHighScoreToSheet(name, score);
  }
}

k.debug.inspect = false;
k.setGravity(1700);

// ---- ASSETS (FIXED URLs: use /main/, not /refs/heads/main) ----
const RAW = "https://raw.githubusercontent.com/Kynan22/ashleethinksyouregoodlooking.com/main";
k.loadFont("gf",    `${RAW}/Super.ttf`);
k.loadSprite("pansy",   `${RAW}/pansy_small.png`);
k.loadSprite("pizza",   `${RAW}/pizza_small.png`);
k.loadSprite("biscoff", `${RAW}/biscoff.png`);
k.loadSprite("heart",   `${RAW}/heart2.png`);
k.loadSpriteAtlas(`${RAW}/newsprite2.png`, {
  gizmo: {
    x: 0, y: 0, width: 32 * 13, height: 96, sliceX: 13, sliceY: 3,
    anims: {
      idle:   { from: 13, to: 18, speed: 7, loop: true },
      jump:   { from: 3,  to: 12, speed: 7, loop: false },
      crouch: { from: 26, to: 37, speed: 17, loop: false },
    },
  },
});

// ---------- Utilities ----------
function outlinedText(
  str,
  { size = 50, fill = k.rgb(255,255,255), stroke = k.rgb(0,0,0), strokePx = 3,
    pos: p = k.vec2(0,0), fixedUI = false, zIndex = 10, font = "gf" } = {},
) {
  const offs = [
    k.vec2(-1,-1), k.vec2(0,-1), k.vec2(1,-1),
    k.vec2(-1, 0),                 k.vec2(1, 0),
    k.vec2(-1, 1), k.vec2(0, 1), k.vec2(1, 1),
  ].map(o => o.scale(strokePx));
  const flags = fixedUI ? [k.fixed()] : [];
  const main = k.add([
    k.text(str, { size, font }),
    k.color(fill),
    k.pos(p),
    k.anchor("center"),
    k.z(zIndex),
    ...flags,
    {
      id: "shadowOutline",
      _shadows: [],
      add() {
        this._shadows = offs.map(off =>
          k.add([
            k.text(str, { size, font }),
            k.color(stroke),
            k.pos(this.pos.add(off)),
            k.anchor("center"),
            k.z(zIndex - 1),
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
          s.hidden = this.hidden;
        }
      },
      destroy() { this._shadows.forEach((s) => k.destroy(s)); },
    },
  ]);
  return main;
}

function notifyScene(name) {
  window.dispatchEvent(new CustomEvent("kb:scene", { detail: { name } }));
}

// ======================= START SCENE =======================
k.scene("start", () => {

  notifyScene("start");
  const hudPlay = document.getElementById("hudPlay");
  if (hudPlay) hudPlay.style.display = "block";

  outlinedText("GIZMO RUN", {
    size: 120,
    pos: k.vec2(k.width() / 2, k.height() / 2 - 200),
    fill: k.rgb(255, 255, 255),
    stroke: k.rgb(0, 0, 0),
    strokePx: 4,
    zIndex: 5,
    fixedUI: true,
  });

  outlinedText("Help Gizmo collect items\nwhile you dodge objects!", {
    size: 48,
    pos: k.vec2(k.width() / 2, k.height() / 2 - 70),
    fill: k.rgb(46, 221, 11),
    stroke: k.rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 5,
    fixedUI: true,
  });

  const highScoreText = outlinedText(
    `HIGHSCORE: ${globalHighScore.name || "Anonymous"} ${globalHighScore.score}`,
    {
      size: 55,
      pos: k.vec2(k.width() / 2, k.height() / 2 + 20),
      fill: k.rgb(255, 255, 255),
      stroke: k.rgb(0,0,0),
      strokePx: 4,
      zIndex: 5,
      fixedUI: true,
    }
  );

  // Then refresh from Sheets and update when ready
  loadHighScoreFromSheet().then(({ name, score }) => {
    highScoreText.text = `HIGHSCORE: ${name || "Anonymous"} ${score}`;
  });

  window.__kbStart = () => {
    if (hudPlay) hudPlay.style.display = "none";
    k.go("game");
  };
});

// ======================= GAME SCENE =======================
k.scene("game", () => {
  notifyScene("game");

  const FLOOR_Y = 780;

  k.add([
    k.rect(1400, 400),
    k.pos(0, FLOOR_Y),
    k.color(100, 100, 100),
    k.area({ shape: new k.Rect(k.vec2(0, 0), 1200, 40) }),
    k.body({ isStatic: true }),
  ]);

  // --- LIVES (hearts) ---
  let lives = 3;
  let heartSprites = [];
  function rebuildHearts() {
    heartSprites.forEach(h => k.destroy(h));
    heartSprites = [];
    const margin = 20;
    const gap = 85;
    for (let i = 0; i < lives; i++) {
      const spr = k.add([
        k.sprite("heart"),
        k.pos(k.width() - margin - i * gap - 140, 40),
        k.scale(0.15),
        k.fixed(),
        k.z(999),
      ]);
      heartSprites.push(spr);
    }
  }
  rebuildHearts();

  // --- SCORE / MESSAGES ---
  let score = 0;

  const scoreText = outlinedText("Score: 0", {
    size: 70,
    pos: k.vec2(200, 95),
    fill: k.rgb(255, 255, 255),
    stroke: k.rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 20,
    fixedUI: true,
  });

  const topY = 400;
  const hitMsg = outlinedText("", {
    size: 65,
    pos: k.vec2(k.width() / 2, topY - 120),
    fill: k.rgb(255, 0, 0),
    stroke: k.rgb(0, 0, 0),
    strokePx: 3,
    zIndex: 20,
    fixedUI: true,
  });
  const centerMsg = outlinedText("", {
    size: 65,
    pos: k.vec2(k.width() / 2, topY),
    fill: k.rgb(255, 0, 0),
    stroke: k.rgb(0, 0, 0),
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
  const normalBox = { w: 17, h: 20, off: k.vec2(8, 10) };
  const duckBox   = { w: 17, h:  5, off: k.vec2(8, 25) };

  const player = k.add([
    k.sprite("gizmo", { anim: "idle" }),
    k.pos(40, 300),
    k.area({ shape: new k.Rect(k.vec2(normalBox.off), normalBox.w, normalBox.h) }),
    k.body(),
    k.scale(4),
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
      player.use(k.area({ shape: new k.Rect(k.vec2(normalBox.off), normalBox.w, normalBox.h) }));
    }
  }
  function startDuck() {
    if (gameOver) return;
    if (player.isGrounded() && !isDucking) {
      isDucking = true;
      player.play("crouch", { loop: false });
      player.use(k.area({ shape: new k.Rect(k.vec2(duckBox.off), duckBox.w, duckBox.h) }));
      k.wait(DUCK_DURATION, () => {
        if (!gameOver) {
          isDucking = false;
          if (player.isGrounded()) player.play("idle");
          player.use(k.area({ shape: new k.Rect(k.vec2(normalBox.off), normalBox.w, normalBox.h) }));
        }
      });
    }
  }

  // Expose for DOM HUD
  window.__kbJump = () => doJump();
  window.__kbDuck = () => startDuck();

  k.onKeyPress("up", doJump);
  k.onKeyPress("down", startDuck);

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

  function addDodgeScore() { score++; scoreText.text = "Score: " + score; }

  // LETTERS
  function makeTarget(phrase) {
    return Array.from(phrase).filter((ch) => {
      const code = ch.codePointAt(0);
      // Filter out just the variation selector (used in emoji like ❤️)
      return code !== 0xfe0f;
    });
  }

  const TARGET = makeTarget("I LOVE YOU ❤️");
  const collected = Array(TARGET.length).fill(false);

  let lettersEnabled = false;
  const LETTERS_UNLOCK_SCORE = 1;

  const letterSlotsByChar = TARGET.reduce((map, ch, idx) => {
    if (!map[ch]) map[ch] = [];
    map[ch].push(idx);
    return map;
  }, {});

  const slots = [];
  const startX = 130, gapX = 60;
  for (let i = 0; i < TARGET.length; i++) {
    const t = outlinedText("", {
      size: 65,
      pos: k.vec2(startX + i * gapX, 400),
      fill: k.rgb(46, 221, 11),
      stroke: k.rgb(0, 0, 0),
      strokePx: 3,
      zIndex: 10,
      fixedUI: true,
    });
    slots.push(t);
  }
  function hideLetterSlots() { slots.forEach(s => s.hidden = true); }
  function showLetterSlots() { slots.forEach(s => s.hidden = false); }
  function resetLettersProgress() {
    for (let i = 0; i < collected.length; i++) {
      collected[i] = false;
      slots[i].text = "";
    }
    lettersEnabled = false;
    showLetterSlots();
  }

  let letterTimer = 0, letterDelay = 3.5, lettersCooldown = 0;
  let timeSinceStart = 0, lastNonLetterSpawnAt = -999;

  let nonLetterBlockUntil = 0;
  let letterBlockUntil    = 0;
  const LETTER_SAFE_WINDOW = 1.8;

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
      pos: k.vec2(k.width() + 40, y),
      fill: k.rgb(46, 221, 11),
      stroke: k.rgb(0, 0, 0),
      strokePx: 3,
      zIndex: 15,
    });

    o.use(k.area({ shape: new k.Rect(k.vec2(-10, -10), 80, 80) }));
    o.use("letter");
    o.ch = ch;

    o.onUpdate(() => {
      if (gameOver) return;
      o.move(-speed, 0);
      if (o.pos.x < -140) k.destroy(o);
    });

    lettersCooldown = 3.6;
    nonLetterBlockUntil = timeSinceStart + LETTER_SAFE_WINDOW;
  }

  function spawnPansy() {
    const o = k.add([
      k.sprite("pansy"),
      k.pos(k.width() + 40, FLOOR_Y - 50),
      k.scale(2.4),
      k.area({ shape: new k.Rect(k.vec2(0, 10), 15, 15) }),
      "pansy",
    ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x < -100) { k.destroy(o); addDodgeScore(); }});
    globalCooldown = SINGLE_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  function spawnBiscoff() {
    const o = k.add([
      k.sprite("biscoff"),
      k.pos(k.width() + 40, FLOOR_Y - 125),
      k.scale(2.4),
      k.area({ shape: new k.Rect(k.vec2(0, 15), 15, 15) }),
      "biscoff",
    ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x < -100) { k.destroy(o); addDodgeScore(); }});
    globalCooldown = SINGLE_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  function spawnPizza(high = false) {
    const yHigh = FLOOR_Y - 115;
    const yLow  = FLOOR_Y - 58;
    const o = k.add([
      k.sprite("pizza"),
      k.pos(k.width() + 40, high ? yHigh : yLow),
      k.scale(2.4),
      k.area({ shape: new k.Rect(k.vec2(0, 10), 19, 13) }),
      "pizza",
    ]);
    o.onUpdate(() => { o.move(-speed, 0); if (o.pos.x < -100) { k.destroy(o); addDodgeScore(); }});
  }

  function spawnPizzaTriplet() {
    const patterns = [
      ["J","J","J"], ["J","D","J"], ["D","J","D"],
      ["J","J","D"], ["D","J","J"], ["J","D","D"],
    ];
    const pat = k.choose(patterns);

    const desiredGapPx = 360;
    const gapTime = desiredGapPx / speed;

    letterBlockUntil = timeSinceStart + (gapTime * 2) + 0.7;

    spawnPizza(pat[0] === "D");

    let nextIndex = 1, elapsed = 0;
    const handle = k.onUpdate(() => {
      if (gameOver) { handle.cancel(); return; }
      elapsed += k.dt();
      while (nextIndex < pat.length && elapsed >= nextIndex * gapTime) {
        spawnPizza(pat[nextIndex] === "D");
        nextIndex++;
      }
      if (nextIndex >= pat.length) handle.cancel();
    });

    globalCooldown = TRIPLET_COOLDOWN;
    lastNonLetterSpawnAt = timeSinceStart;
  }

  function loseLifeAndCheck(o) {
    k.destroy(o);
    showHitMessage("OUCH!", 1);

    lives = Math.max(0, lives - 1);
    rebuildHearts();

    if (lives <= 0) {
      // 🔹 Check shared highscore
      checkAndSubmitHighScore(score);

      resetLettersProgress();
      gameOver = true;
      centerMsg.text = "GAME OVER";
      centerMsgTimer = 4;
      speed = 0;

      k.wait(4, () => k.go("start"));
    }
  }

  player.onCollide("pansy",   loseLifeAndCheck);
  player.onCollide("biscoff", loseLifeAndCheck);
  player.onCollide("pizza",   loseLifeAndCheck);

  // ==== LETTER COLLISION: show love message, keep game running ====
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
    k.destroy(o);

    // When all letters are collected, show message and keep playing
    if (collected.every(Boolean)) {
      hideLetterSlots();
      lettersEnabled = false;           // stop new letters from spawning
      centerMsg.text = "I really do love you ❤️";
      centerMsgTimer = -1;             // never auto-clear; overwritten on GAME OVER
    }
  });

  k.onUpdate(() => {
    if (gameOver) {
      if (hitMsgTimer > 0) {
        hitMsgTimer -= k.dt();
        if (hitMsgTimer <= 0) hitMsg.text = "";
      }
      if (centerMsgTimer > 0) {
        centerMsgTimer -= k.dt();
        if (centerMsgTimer <= 0) centerMsg.text = "";
      }
      return;
    }

    timeSinceStart += k.dt();

    if (hitMsgTimer > 0) {
      hitMsgTimer -= k.dt();
      if (hitMsgTimer <= 0) hitMsg.text = "";
    }
    if (centerMsgTimer > 0) {
      centerMsgTimer -= k.dt();
      if (centerMsgTimer <= 0) centerMsg.text = "";
    }

    if (globalCooldown > 0) globalCooldown -= k.dt();
    if (lettersCooldown > 0) lettersCooldown -= k.dt();

    pizzaTimer += k.dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pizzaTimer >= pizzaDelay) {
      pizzaTimer = 0; pizzaDelay = k.rand(5, 7); spawnPizzaTriplet();
    }

    pansyTimer += k.dt();
    if (globalCooldown <= 0 && timeSinceStart >= nonLetterBlockUntil && pansyDelay >= 0 && pansyTimer >= pansyDelay) {
      pansyTimer = 0; spawnPansy(); if (pansyDelay > 1.2) pansyDelay -= 0.02;
    }

    biscoffTimer += k.dt();
    if (timeSinceStart >= nonLetterBlockUntil && biscoffTimer >= biscoffDelay) {
      if (globalCooldown <= 0.5) { biscoffTimer = 0; biscoffDelay = k.rand(3.8, 6.0); spawnBiscoff(); }
    }

    if (!lettersEnabled && score >= LETTERS_UNLOCK_SCORE) {
      lettersEnabled = true;
    }

    if (lettersEnabled) {
      letterTimer += k.dt();
      const letterGapSinceLast = 1.25;
      const timeSinceNonLetter = timeSinceStart - lastNonLetterSpawnAt;
      if (timeSinceStart >= letterBlockUntil && letterTimer >= letterDelay && lettersCooldown <= 0 && timeSinceNonLetter >= letterGapSinceLast) {
        letterTimer = 0; letterDelay = k.rand(3.0, 5.0); spawnLetter();
      }
    }

    speed += k.dt() * 2.1;

    if (player.isGrounded() && player.curAnim() !== "crouch" && player.curAnim() !== "idle") {
      player.play("idle");
      player.use(k.area({ shape: new k.Rect(k.vec2(normalBox.off), normalBox.w, normalBox.h) }));
      isDucking = false;
    }
  });
});

// ==== Start immediately (don’t wait for onLoad, which stalls on 404 assets) ====
k.go("start");
