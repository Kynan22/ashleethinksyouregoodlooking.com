// src/main.js
import kaboom from "kaboom";

console.log("Simple CYOA (Continue button) loaded");

const WIDTH = 900;
const HEIGHT = 600;
const CX = Math.floor(WIDTH / 2);
const CY = Math.floor(HEIGHT / 2);

// Solid background color set here (no checker)
const K = kaboom({
	background: [70, 180, 0],
  width: WIDTH,
  height: HEIGHT,
  clearColor: [0.96, 0.96, 0.96, 1], // solid light background
  debug: true,
});

const { add, text, rect, pos, color, rgb, vec2, wait, go, scene } = K;

// ----- State -----
let chosen = [];       // [flowerIndex, noteIndex, finalIndex]
let inventory = [];    // strings
let perks = {};        // e.g. { bragging_rights: true }
let activeButtons = [];

// ----- UI helpers -----
function clearButtons(){
  for(const b of activeButtons){
    try{ if (b.rect && b.rect.destroy) b.rect.destroy(); }catch(e){}
    try{ if (b.text && b.text.destroy) b.text.destroy(); }catch(e){}
  }
  activeButtons = [];
}

// Add centered text (keeps entity around)
function addCenteredText(txt, size=20, y=100){
  const ent = add([ text(txt, { size, width: WIDTH - 120 }), pos(CX, y) ]);
  wait(0, () => {
    if (ent.width !== undefined) ent.pos.x = CX - ent.width / 2;
    else ent.pos.x = 60;
  });
  return ent;
}

// Standard clickable button (added to activeButtons)
function createButton(label, cx, cy, w, h, onClick){
  const r = add([ rect(w, h), pos(cx - w/2, cy - h/2), color(0.86,0.86,0.86) ]);
  const t = add([ text(label, { size: 18, width: w - 20 }), pos(cx, cy) ]);
  wait(0, () => {
    if (t.width !== undefined) t.pos.x = cx - t.width/2;
    if (t.height !== undefined) t.pos.y = cy - t.height/2;
  });
  const btn = { x: cx - w/2, y: cy - h/2, w, h, rect: r, text: t, callback: onClick };
  activeButtons.push(btn);
  return btn;
}

// A single Continue button placed at bottom; keeps things simple
function createContinueButton(nextFn){
  // remove any option buttons first so they can't be clicked
  // (selection text remains because it's not in activeButtons)
  clearButtons();
  return createButton("Continue", CX, HEIGHT - 80, 300, 64, nextFn);
}

function pointerToGamePos(evt){
  const canvas = document.querySelector("canvas");
  if (!canvas) return vec2(0,0);
  const r = canvas.getBoundingClientRect();
  const sx = WIDTH / r.width;
  const sy = HEIGHT / r.height;
  const x = (evt.clientX - r.left) * sx;
  const y = (evt.clientY - r.top) * sy;
  return vec2(x,y);
}

// global pointer handler uses activeButtons
if (!window.__SIMPLE_CYOA_POINTER) {
  window.__SIMPLE_CYOA_POINTER = true;
  window.addEventListener("pointerdown", (evt) => {
    const p = pointerToGamePos(evt);
    for (let i = activeButtons.length - 1; i >= 0; i--){
      const b = activeButtons[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h){
        // flash visual
        try { b.rect.color = rgb(0.7, 0.95, 0.7); } catch(e) {}
        wait(0.08, () => { try { b.rect.color = color(0.86,0.86,0.86); } catch(e){} });
        try { b.callback(); } catch(err) { console.error("btn cb err", err); }
        evt.preventDefault();
        return;
      }
    }
  });
}

// small HUD
function showHUD(){
  try { if (window.__hud) window.__hud.destroy(); } catch(e){}
  const inv = inventory.length ? `Inventory: ${inventory.join(", ")}` : "Inventory: -";
  window.__hud = add([ text(`${inv}\n${perks.bragging_rights ? "Perk: Bragging Rights" : ""}`, { size: 14 }), pos(12,12) ]);
}

// toast helper
function toast(msg, y = HEIGHT - 60){
  const t = add([ text(msg, { size: 18 }), pos(CX, y) ]);
  wait(2.2, () => { try { t.destroy(); } catch(e){} });
}

// ----- Scenes (simple, asset-free) -----
scene("start", () => {
  clearButtons();
  addCenteredText("A Little Date Story (simple demo)", 28, 80);
  addCenteredText("Click Start to begin", 18, 140);
  createButton("Start", CX, 240, 360, 70, () => go("garden"));
});

scene("garden", () => {
  clearButtons();
  addCenteredText("You're on your way to a date and come across a pretty garden!\nWhich flower are you taking?", 18, 60);

  createButton("Pansy", CX-260, 200, 300, 70, () => {
    chosen[0] = 0;
    addCenteredText("You pick the pansy.", 18, 340);
    // show continue button
    createContinueButton(() => go("date_note"));
  });

  createButton("Sunflower", CX, 200, 300, 70, () => {
    chosen[0] = 1;
    addCenteredText("You pick flower 2.", 18, 340);
    createContinueButton(() => go("date_note"));
  });

  createButton("Daffodil", CX+260, 200, 300, 70, () => {
    chosen[0] = 2;
    addCenteredText("You pick flower 3.", 18, 340);
    createContinueButton(() => go("date_note"));
  });
});

scene("date_note", () => {
  clearButtons();
  addCenteredText("You start the date and it's going amazingly! Along the way he slips you a note...", 18, 40);

  createButton("Read note", CX-240, 220, 300, 70, () => {
    chosen[1] = 0;
    inventory.push("congrats_note");
    perks.bragging_rights = true;
    showHUD();
    addCenteredText("CONGRATULATIONS HOME OWNER!\nIM VERY IMPRESSED :)", 18, 360);
    toast("New perk unlocked — Bragging Rights");
    createContinueButton(() => go("date_end"));
  });

  createButton("Ignore note", CX, 220, 300, 70, () => {
    chosen[1] = 1;
    addCenteredText("You slip the note into your pocket.", 18, 360);
    createContinueButton(() => go("date_end"));
  });

  createButton("Throw it away", CX+240, 220, 300, 70, () => {
    chosen[1] = 2;
    addCenteredText("You toss the note away.", 18, 360);
    createContinueButton(() => go("date_end"));
  });

  showHUD();
});

scene("date_end", () => {
  clearButtons();
  addCenteredText("The date is about to end! How sad :( Do you:", 18, 60);

  createButton("Small kiss", CX-260, 200, 300, 70, () => {
    chosen[2] = 0;
    addCenteredText("You share a small kiss — what a night.", 18, 360);
    createContinueButton(() => go("ending_regular"));
  });

  createButton("High five", CX, 200, 300, 70, () => {
    chosen[2] = 1;
    addCenteredText("A goofy high five — memorable.", 18, 360);
    createContinueButton(() => go("ending_regular"));
  });

  createButton("Listen to his question", CX+260, 200, 300, 70, () => {
    chosen[2] = 2;
    const secret = (chosen[0] === 0 && chosen[1] === 0 && chosen[2] === 2);
    if (secret) {
      addCenteredText("You listen carefully... (press Continue)", 18, 360);
      createContinueButton(() => go("secretAsk"));
    } else {
      addCenteredText("You listen carefully as he asks something important...", 18, 360);
      createContinueButton(() => go("ending_regular"));
    }
  });

  showHUD();
});

scene("ending_regular", () => {
  clearButtons();
  addCenteredText("The night winds down. You both had a lovely time.", 22, 80);
  const f = ["Pansy","Flower2","Flower3"][chosen[0]] || "-";
  const n = ["Read note","Ignore","Throw"][chosen[1]] || "-";
  const e = ["Kiss","High five","Listen"][chosen[2]] || "-";
  addCenteredText(`You picked: ${f}, ${n}, ${e}`, 16, 150);
  createButton("Play Again", CX-140, 420, 240, 60, () => { chosen = []; inventory = []; perks = {}; go("garden"); });
  createButton("Main Menu", CX+140, 420, 240, 60, () => { chosen = []; inventory = []; perks = {}; go("start"); });
});

scene("secretAsk", () => {
  clearButtons();
  addCenteredText("He leans in and whispers:", 20, 320);
  addCenteredText(`"Will you be my girlfriend?"`, 28, 360);
  createButton("Yes", CX-120, 440, 220, 64, () => {
    addCenteredText("Very cool :)", 30, 520);
    createContinueButton(() => go("start"));
  });
  createButton("perhaps soon :o", CX+120, 440, 220, 64, () => {
    addCenteredText(":o", 20, 520);
    createContinueButton(() => go("start"));
  });
});

// start
go("start");
