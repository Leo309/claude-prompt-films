// EP04 · Messi vs Ronaldo: GOAT FIGHT ’26. The first pixel episode (PIXEL_STYLE.md).
//
// A 16-bit fighting game, drawn at 180×320 and blitted ×6 into a native 9:16 frame:
// title → select screen → VS → six rounds, one stat each → 3–3 → FINAL ROUND → DOUBLE K.O.
// Each player wins three rounds and nobody wins the fight: the end card asks who your GOAT is.
// 128 BPM, 48 bars = 90 s. Every number is in facts.md.
import { clamp, hash, midi, makeMixer } from "../../render/kit.js";
import {
  LOW, lowCanvas, blit, rect, PAL, dither, gradient, ptext, textWidth, sprite, fighterGrid, POSES, bustGrid,
  healthBar, stepped, bayer, pulse, triangle, noise, kick8, coin, hitSfx,
} from "../../render/pixel.js";

const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4, S16 = BEAT / 4;
const bar = (n) => n * BAR;
const W = LOW.width, H = LOW.height;

// ---------------------------------------------------------------- data (facts.md)

const P = [
  { name: "MESSI", country: "ARGENTINA", number: 10, goals: 932, ballon: 8, ucl: 4, uclGoals: 129, intl: 126, trophies: 46 },
  { name: "RONALDO", country: "PORTUGAL", number: 7, goals: 979, ballon: 5, ucl: 5, uclGoals: 140, intl: 146, trophies: 36 },
];
const MESSI = 0, RONALDO = 1;

// Six rounds of six bars from bar 6. `winner` takes the round with `move`.
const ROUNDS = [
  { key: "goals", title: "CAREER GOALS", winner: RONALDO, move: "siuuu", call: "SIUUU!" },
  { key: "ballon", title: "BALLON D'OR", winner: MESSI, move: "dash", call: "LA PULGA!" },
  { key: "ucl", title: "CHAMPIONS LEAGUE", winner: RONALDO, move: "bicycle", call: "BICYCLE KICK!" },
  { key: "worldcup", title: "WORLD CUP", winner: MESSI, move: "lift", call: "CHAMPION!" },
  { key: "intl", title: "INTERNATIONAL GOALS", winner: RONALDO, move: "knuckle", call: "KNUCKLEBALL!" },
  { key: "trophies", title: "TROPHIES", winner: MESSI, move: "freekick", call: "FREE KICK!" },
];
const R0 = 6, RLEN = 6, FINAL = R0 + ROUNDS.length * RLEN; // bars
const HIT = 4.25; // bars into a round: the winning move lands
const roundAt = (t) => {
  const i = Math.floor((t - bar(R0)) / bar(RLEN));
  return i >= 0 && i < ROUNDS.length ? { i, u: (t - bar(R0 + i * RLEN)) / BAR } : null;
};
const winsBefore = (i, who) => ROUNDS.slice(0, i).filter((r) => r.winner === who).length;

// ---------------------------------------------------------------- palettes

const stripes = (w, a, b) => (x) => (Math.floor(x / w) % 2 ? b : a);
const FPAL = [
  { o: PAL.ink, s: PAL.skin, S: PAL.skinShade, h: PAL.umber, H: PAL.brown, k: PAL.ink, m: PAL.brown, w: PAL.white,
    j: stripes(2, PAL.celeste, PAL.white), J: stripes(2, PAL.sky, PAL.mist), n: PAL.ink, p: PAL.night, P: PAL.ink, v: PAL.white, b: PAL.amber, c: PAL.ink },
  { o: PAL.ink, s: PAL.tan, S: PAL.brown, h: PAL.wine, H: PAL.umber, k: PAL.ink, m: PAL.umber, w: PAL.white,
    j: PAL.red, J: PAL.crimson, n: PAL.yellow, p: PAL.grass, P: PAL.pine, v: PAL.red, b: PAL.white, c: PAL.grass },
];
const BPAL = [{ ...FPAL[0], j: stripes(5, PAL.celeste, PAL.white), J: stripes(5, PAL.sky, PAL.mist) }, FPAL[1]];
const LOOK = [{ hair: "short", beard: true, number: 10 }, { hair: "quiff", number: 7 }];

const GOLD = { o: PAL.ink, y: PAL.yellow, Y: PAL.amber, a: PAL.orange, g: PAL.grass, w: PAL.white, m: PAL.steel, k: PAL.ink };
const BALLON = ["..ooo..", ".oyyYo.", "oyaYyyo", "oyYaaYo", "oyyYayo", ".oYyyo.", "..ooo.."];
const BALL = [".ooo.", "owkwo", "okwko", "owkwo", ".ooo."];
const BIG_EARS = [
  "...ooooooo...", "oo.omwwwmo.oo", "omooowwwooomo", "om.omwwwmo.mo", "om.omwwwmo.mo", "omo.omwmo.omo",
  ".ooo.omo.ooo.", ".....omo.....", "....omwmo....", "...omwwwmo...", "...ooooooo...",
];
const WORLD_CUP = [
  "...ooooo...", "..oyYYyyo..", ".oyYyyyYyo.", ".oyyYyyyYo.", "..oyyyYyo..", "...oyyyo...", "...oyYyo...", "....oyo....",
  "....oyo....", "...oyYyo...", "...oyyyo...", "..oyyYyyo..", "..ogggggo..", "..ogggggo..", "..oyyyyyo..", "..ooooooo..",
];
const MINI_CUP = ["yyyyy", "yyyYy", ".yyy.", "..Y..", ".YYY."];

// Sprite grids, built once.
const cache = new Map();
const memo = (key, fn) => (cache.has(key) ? cache.get(key) : (cache.set(key, fn()), cache.get(key)));
const fighterRows = (who, pose) => memo(`f${who}${pose}`, () => fighterGrid(POSES[pose], LOOK[who]));
const bustRows = (who, k) => memo(`b${who}${k}`, () => bustGrid(LOOK[who], k));

// ---------------------------------------------------------------- scenery

const GROUND = 250; // feet line (internal px): the bottom of the safe zone
const FY = GROUND - 57; // fighter sprite top
const HOME = [16, 120]; // fighter sprite x at rest (Ronaldo is mirrored)
const DASH = 86; // how far Messi's dash carries him: up to Ronaldo

function sky(g, t) {
  gradient(g, 0, 0, W, 124, [PAL.ink, PAL.night, PAL.navy, PAL.plum]);
  const f = Math.floor(t * 4);
  for (let k = 0; k < 24; k++) {
    const x = Math.floor(hash(k, 3) * W), y = Math.floor(hash(k, 5) * 36);
    if (hash(k + f * 31, 9) > 0.3) rect(g, x, y, 1, 1, hash(k, 7) > 0.7 ? PAL.yellow : PAL.mist);
  }
}

// Stands from y 118 to 186: a back wall, then rows of fans in team colours that bounce on the beat.
function stands(g, t, dim = 0) {
  rect(g, 0, 116, W, 70, PAL.night);
  rect(g, 0, 116, W, 2, PAL.slate);
  const beat = Math.floor(t / BEAT);
  const onBeat = (t % BEAT) < BEAT * 0.3;
  for (let row = 0; row < 21; row++) {
    const y = 120 + row * 3;
    for (let col = 0; col < 60; col++) {
      const x = col * 3 + (row % 2);
      const id = row * 61 + col;
      const side = x < 70 ? 0 : x > 110 ? 1 : hash(id, 2) < 0.5 ? 0 : 1;
      const shirt = side === 0 ? (hash(id, 4) < 0.5 ? PAL.celeste : PAL.white) : hash(id, 4) < 0.6 ? PAL.red : PAL.grass;
      const jump = onBeat && hash(id + beat * 7, 6) < 0.35 ? 1 : 0;
      rect(g, x, y - jump, 2, 1, hash(id, 8) < 0.5 ? PAL.skin : PAL.tan);
      rect(g, x, y + 1 - jump, 2, 1, shirt);
    }
  }
  // camera flashes, a few per held frame
  const fr = Math.floor(t * 12);
  for (let k = 0; k < 5; k++) if (hash(k + fr * 13, 11) < 0.6) rect(g, Math.floor(hash(k + fr * 7, 12) * W), 120 + Math.floor(hash(k + fr * 3, 14) * 62), 1, 1, PAL.white);
  if (dim > 0) {
    g.fillStyle = PAL.ink;
    for (let y = 116; y < 186; y++) for (let x = 0; x < W; x++) if (dim > bayer(x, y)) g.fillRect(x, y, 1, 1);
  }
}

// LED boards along the touchline, scrolling the series name.
const BOARD = "GOAT FIGHT '26 * HAOLI.AI * 90 SECONDS * ";
function boards(g, t) {
  rect(g, 0, 186, W, 9, PAL.ink);
  rect(g, 0, 186, W, 1, PAL.slate);
  const off = Math.floor(stepped(t, 24) * 24) % textWidth(BOARD);
  const span = textWidth(BOARD) + 6;
  for (let x = -off; x < W; x += span) ptext(g, BOARD, x, 187, { color: PAL.amber });
}

function pitch(g) {
  let y = 195, k = 0, h = 3;
  while (y < H) {
    rect(g, 0, y, W, h, k % 2 ? PAL.grass : PAL.pine);
    y += h;
    h += 2;
    k++;
  }
  rect(g, 0, 196, W, 1, PAL.mist); // touchline
}

function stadium(g, t, dim = 0) {
  sky(g, t);
  stands(g, t, dim);
  boards(g, t);
  pitch(g);
}

// ---------------------------------------------------------------- characters and effects

function fighter(g, who, pose, x, y = FY, o = {}) {
  const rows = fighterRows(who, pose);
  if (o.shadow !== false && y > FY - 40) rect(g, Math.round(x) + 10, GROUND - 1, 24, 2, PAL.deep);
  sprite(g, rows, FPAL[who], x, y, { flip: (who === RONALDO) !== !!o.turn, flash: o.flash, reveal: o.reveal, seed: who });
}

const idlePose = (t) => (Math.floor(t / (BEAT / 2)) % 2 ? "stance1" : "stance0");

function ball(g, x, y) {
  sprite(g, BALL, GOLD, Math.round(x) - 2, Math.round(y) - 2);
}

// A fireball trail behind a moving ball: older positions fade from yellow to red.
function trail(g, pts) {
  pts.forEach(([x, y], k) => {
    const c = [PAL.yellow, PAL.amber, PAL.orange, PAL.red][Math.min(3, k)];
    const r = Math.max(1, 3 - k);
    rect(g, Math.round(x) - r, Math.round(y) - r + 1, r * 2, r * 2 - 1, c);
  });
}

// Hit spark: eight rays that grow, then thin out.
function spark(g, x, y, age) {
  if (age < 0 || age > 0.25) return;
  const len = 3 + Math.floor(age * 60);
  for (let d = 0; d < 8; d++) {
    const a = (d * Math.PI) / 4;
    for (let r = Math.max(0, len - 6); r < len; r++) rect(g, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, r % 2 ? PAL.yellow : PAL.white);
  }
}

// Text with the house style: an ink outline and colour bands.
const BANDS = {
  gold: [PAL.yellow, PAL.amber, PAL.orange],
  fire: [PAL.yellow, PAL.orange, PAL.red],
  ice: [PAL.white, PAL.celeste, PAL.sky],
  blood: [PAL.rose, PAL.red, PAL.crimson],
  steel: [PAL.white, PAL.mist, PAL.steel],
};
const big = (g, str, x, y, scale, bands = BANDS.gold, align = "center") => ptext(g, str, x, y, { scale, bands, outline: PAL.ink, align });
const small = (g, str, x, y, color = PAL.white, align = "center") => ptext(g, str, x, y, { color, shadow: PAL.ink, align });

// A slam: drawn huge for a few held frames, then settles at `scale`.
function slam(g, str, x, y, t, t0, scale, bands) {
  if (t < t0) return;
  const k = Math.floor((t - t0) * 24);
  const s = k < 3 ? scale + (3 - k) : scale;
  big(g, str, x, y - ((s - scale) * 7) / 2, s, bands);
}

// Dither fade from ink (level 1 → 0): the house transition instead of a crossfade.
function fadeIn(g, t, t0, dur = BAR / 4) {
  const level = 1 - clamp((t - t0) / dur);
  if (level <= 0) return;
  g.fillStyle = PAL.ink;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (level > bayer(x, y)) g.fillRect(x, y, 1, 1);
}

// A hit flash: half the stage pixels go white for a couple of frames. Never a solid white frame: cold opens start
// on these hits, and a blank first frame would be the thumbnail.
function whiteFlash(g, t, t0) {
  if (t < t0 || t >= t0 + 1 / 15) return;
  g.fillStyle = PAL.white;
  for (let y = 104; y < H; y++) for (let x = 0; x < W; x++) if (0.45 > bayer(x, y)) g.fillRect(x, y, 1, 1);
}

// ---------------------------------------------------------------- HUD

function hud(g, t, label, bars, pips) {
  healthBar(g, 6, 106, 72, bars[0], { color: PAL.celeste, light: PAL.white, dark: PAL.sky, trail: bars[2] });
  healthBar(g, 102, 106, 72, bars[1], { flip: true, color: PAL.red, light: PAL.rose, dark: PAL.crimson, trail: bars[3] });
  small(g, label, 90, 106, PAL.amber);
  small(g, P[0].name, 6, 115, PAL.white, "left");
  small(g, P[1].name, 174, 115, PAL.white, "right");
  for (let k = 0; k < 3; k++) {
    rect(g, 58 + k * 7, 115, 5, 5, PAL.ink);
    rect(g, 59 + k * 7, 116, 3, 3, k < pips[0] ? PAL.yellow : PAL.navy);
    rect(g, 104 + k * 7, 115, 5, 5, PAL.ink);
    rect(g, 105 + k * 7, 116, 3, 3, k < pips[1] ? PAL.yellow : PAL.navy);
  }
}

// ---------------------------------------------------------------- the rounds: what each stat shows

// Counters rise at one shared rate (the bigger number takes the full two bars), so the smaller one stops first.
const counted = (u, value, max, from = 1, len = 2) => Math.min(value, Math.floor(max * clamp((u - from) / len)));
// When item k of n appears (balls, cups), alternating players so the music answers itself.
const itemTime = (k, who, from = 1, step = 0.22) => from + k * step + who * step / 2;

// Stat meters for the HUD bars, 0..1, as the round's numbers come in.
function meters(r, u) {
  switch (r.key) {
    case "goals": return [counted(u, P[0].goals, 979) / 979, counted(u, P[1].goals, 979) / 979];
    case "ballon": return [0, 1].map((w) => Array.from({ length: P[w].ballon }, (_, k) => u >= itemTime(k, w)).filter(Boolean).length / 8);
    case "ucl": return [0, 1].map((w) => Array.from({ length: P[w].ucl }, (_, k) => u >= itemTime(k, w, 1, 0.3)).filter(Boolean).length / 5);
    case "worldcup": return [u >= 3 ? 1 : 0, 0];
    case "intl": return [counted(u, P[0].intl, 146) / 146, counted(u, P[1].intl, 146) / 146];
    case "trophies": return [counted(u, P[0].trophies, 46) / 46, counted(u, P[1].trophies, 46) / 46];
  }
  return [0, 0];
}

const SIDE = [45, 135]; // centre x of each player's half of the stat area

function stats(g, r, u) {
  switch (r.key) {
    case "goals":
    case "intl": {
      const max = r.key === "goals" ? 979 : 146;
      for (const w of [0, 1]) {
        const n = counted(u, r.key === "goals" ? P[w].goals : P[w].intl, max);
        big(g, String(n), SIDE[w], 140, 3, w ? BANDS.blood : BANDS.ice);
        if (r.key === "intl" && w === RONALDO && u >= 3) {
          rect(g, SIDE[1] - 28, 164, 56, 9, PAL.amber);
          small(g, "MOST EVER", SIDE[1], 165, PAL.ink);
        } else small(g, r.key === "goals" ? "GOALS" : `FOR ${P[w].country}`, SIDE[w], 165, PAL.mist);
      }
      break;
    }
    case "ballon":
      for (const w of [0, 1]) {
        for (let k = 0; k < P[w].ballon; k++) {
          const t0 = itemTime(k, w);
          if (u < t0) continue;
          const tx = SIDE[w] - 17 + (k % 4) * 9, ty = 140 + Math.floor(k / 4) * 9;
          const fall = clamp((stepped(u, 12 / BAR) - t0) / 0.18);
          sprite(g, BALLON, GOLD, tx, Math.round(126 + (ty - 126) * fall * fall));
        }
        const shown = Array.from({ length: P[w].ballon }, (_, k) => u >= itemTime(k, w)).filter(Boolean).length;
        if (shown) big(g, String(shown), SIDE[w], 162, 2, BANDS.gold);
      }
      break;
    case "ucl":
      for (const w of [0, 1]) {
        const n = P[w].ucl;
        for (let k = 0; k < n; k++) {
          if (u < itemTime(k, w, 1, 0.3)) continue;
          sprite(g, BIG_EARS, GOLD, SIDE[w] - (n * 14) / 2 + k * 14, 136);
        }
        const shown = Array.from({ length: n }, (_, k) => u >= itemTime(k, w, 1, 0.3)).filter(Boolean).length;
        if (shown) big(g, `${shown}`, SIDE[w], 150, 2, BANDS.steel);
        if (u >= 2.4) small(g, `${counted(u, P[w].uclGoals, 140, 2.4, 0.9)} GOALS`, SIDE[w], 168, PAL.mist);
      }
      break;
    case "worldcup": {
      // Ronaldo: the first to score at six World Cups, one tag per tournament
      small(g, "SCORED AT", SIDE[1], 136, PAL.mist);
      small(g, "6 WORLD CUPS", SIDE[1], 145, PAL.white);
      ["06", "10", "14", "18", "22", "26"].forEach((y, k) => {
        if (u < 1 + k * 0.17) return;
        const x = SIDE[1] - 21 + (k % 3) * 15, yy = 156 + Math.floor(k / 3) * 11;
        rect(g, x - 1, yy - 1, 13, 9, PAL.crimson);
        small(g, y, x + 6, yy, PAL.white);
      });
      // Messi: the trophy comes down in a beam and lands
      if (u >= 2) {
        const p = clamp((stepped(u, 12 / BAR) - 2) / 1);
        const beamLevel = 0.25 + 0.15 * (Math.floor(u * 8) % 2);
        g.fillStyle = PAL.yellow;
        for (let y = 124; y < 186; y++) for (let x = SIDE[0] - 8; x < SIDE[0] + 8; x++) if (beamLevel > bayer(x, y)) g.fillRect(x, y, 1, 1);
        sprite(g, WORLD_CUP, GOLD, SIDE[0] - 5, Math.round(112 + (138 - 112) * p));
      }
      if (u >= 3) {
        small(g, "CHAMPION", SIDE[0], 160, PAL.yellow);
        small(g, "2022", SIDE[0], 169, PAL.white);
      }
      break;
    }
    case "trophies":
      for (const w of [0, 1]) {
        const n = counted(u, P[w].trophies, 46);
        for (let k = 0; k < n; k++) {
          const col = k % 7, row = Math.floor(k / 7);
          const x0 = w === 0 ? 8 : 130;
          sprite(g, MINI_CUP, GOLD, x0 + col * 6, 181 - (row + 1) * 6);
        }
        if (n) big(g, String(n), w === 0 ? 70 : 110, 150, 2, BANDS.gold);
      }
      break;
  }
}

// ---------------------------------------------------------------- the fight: poses and moves per round

// → { draw(g), shake } for the fighters in round r at u bars in.
function fightRound(g, t, r, u) {
  const w = r.winner, l = 1 - w;
  const pos = [HOME[0], HOME[1]];
  const pose = [idlePose(t), idlePose(t)];
  const ys = [FY, FY];
  const flags = [{}, {}];
  const fx = [];
  const dir = w === MESSI ? 1 : -1; // the winner attacks towards the loser
  const su = stepped(u, 12 / BAR); // held steps at 12 fps, in bars

  if (u >= 3.5) {
    switch (r.move) {
      case "dash": {
        // run at the opponent with the ball, two afterimages behind
        const p = clamp((su - 3.5) / (HIT - 3.5));
        if (u < HIT) {
          pos[w] = HOME[w] + Math.round(p * DASH);
          pose[w] = Math.floor(u * 16) % 2 ? "run0" : "run1";
          fx.push(() => {
            for (const back of [20, 10]) sprite(g, fighterRows(w, pose[w]), FPAL[w], pos[w] - back, FY, { flash: PAL.celeste, reveal: 0.45, seed: back });
            ball(g, pos[w] + 36, GROUND - 3);
          });
        } else if (u < 4.75) {
          pos[w] = HOME[w] + DASH;
          pose[w] = "win";
        } else if (u < 5) {
          const q = clamp((su - 4.75) / 0.25);
          pos[w] = HOME[w] + Math.round(DASH * (1 - q));
          ys[w] = FY - Math.round(14 * Math.sin(Math.PI * q));
          pose[w] = "jump";
        } else pose[w] = "win";
        break;
      }
      case "siuuu": {
        // jump, spin, land: the shockwave of the landing runs along the ground
        if (u < 4.1) {
          const p = clamp((su - 3.5) / 0.6);
          ys[w] = FY - Math.round(26 * Math.sin(Math.PI * p));
          pose[w] = "jump";
          flags[w].turn = Math.floor(u * 24) % 2 === 1;
        } else pose[w] = "siuuu";
        if (u >= 4.1 && u < HIT + 0.1) {
          const p = clamp((u - 4.1) / (HIT - 4.1));
          const x = HOME[w] + 10 - Math.round(p * 80);
          fx.push(() => {
            for (let k = 0; k < 5; k++) rect(g, x - k * 3, GROUND - 2 - (k % 2), 2, 2 + (k % 2), k % 2 ? PAL.white : PAL.yellow);
          });
        }
        break;
      }
      case "bicycle": {
        const air = u < 3.8 ? clamp((su - 3.5) / 0.3) : u < 4.1 ? 1 : 1 - clamp((su - 4.1) / 0.2);
        ys[w] = FY - Math.round(20 * air);
        pose[w] = u >= 3.8 && u < 4.1 ? "bicycle" : u < 4.3 ? "jump" : "win";
        if (u >= 3.95 && u < HIT) {
          const p = clamp((u - 3.95) / (HIT - 3.95));
          const x0 = HOME[w] + 6, y0 = FY - 20 + 16, x1 = HOME[l] + 30, y1 = FY + 22;
          const at = (q) => [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - 10 * Math.sin(Math.PI * q)];
          fx.push(() => {
            trail(g, [0.04, 0.08, 0.12].map((d) => at(Math.max(0, p - d))));
            ball(g, ...at(p));
          });
        }
        if (u >= 4.5) pose[w] = "siuuu";
        break;
      }
      case "knuckle":
      case "freekick": {
        pose[w] = u < 3.9 ? "stance0" : u < 4.15 ? "kick" : u < 4.5 ? "stance1" : w === RONALDO ? "siuuu" : "win";
        if (u >= 3.95 && u < HIT) {
          const p = clamp((u - 3.95) / (HIT - 3.95));
          const x0 = w === MESSI ? HOME[w] + 40 : HOME[w] + 4, x1 = w === MESSI ? HOME[l] + 14 : HOME[l] + 30;
          const y0 = FY + 24, y1 = FY + 22;
          const at = (q) => r.move === "knuckle"
            ? [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q + Math.round(3 * Math.sin(q * 22))] // the wobble
            : [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - 28 * Math.sin(Math.PI * q)]; // the curl, up and over
          fx.push(() => {
            trail(g, [0.05, 0.1, 0.15].map((d) => at(Math.max(0, p - d))));
            ball(g, ...at(p));
          });
        }
        break;
      }
      case "lift": {
        pose[w] = u < 4.6 ? "lift" : "win";
        if (u < 4.6) fx.push(() => sprite(g, WORLD_CUP, GOLD, HOME[w] + 16, FY - 14));
        if (u >= 4.05 && u < HIT + 0.05) {
          const p = clamp((u - 4.05) / (HIT - 4.05));
          const x = HOME[w] + 30 + Math.round(p * 80);
          fx.push(() => {
            for (let y = FY + 4; y < GROUND; y += 2) rect(g, x + ((y >> 1) % 2), y, 2, 1, PAL.yellow);
          });
        }
        break;
      }
    }
  }
  // the loser takes the hit
  const age = u - HIT;
  if (age >= 0 && age < 0.5) {
    pose[l] = "hit";
    pos[l] = HOME[l] + dir * (age < 0.25 ? 6 : 3);
    if (age < 0.06) flags[l].flash = PAL.white;
  }
  // draw: winner in front after the hit
  const order = age >= 0 ? [l, w] : [w, l];
  for (const who of order) fighter(g, who, pose[who], pos[who], ys[who], flags[who]);
  fx.forEach((f) => f());
  if (age >= 0) spark(g, HOME[l] + 22 + dir * -4, FY + 18, age * BAR);
  return { shake: age >= 0 && age < 0.2 };
}

// ---------------------------------------------------------------- scenes

function title(g, t) {
  gradient(g, 0, 0, W, H, [PAL.ink, PAL.night, PAL.plum, PAL.pink]);
  sky(g, t);
  // the stadium at night: a dark bowl with floodlights
  rect(g, 0, 206, W, 114, PAL.ink);
  for (let x = 0; x < W; x++) {
    const h = 14 + Math.round(6 * Math.sin((x / W) * Math.PI));
    rect(g, x, 206 - h, 1, h, PAL.night);
  }
  for (const lx of [14, 162]) {
    rect(g, lx, 168, 2, 24, PAL.slate);
    rect(g, lx - 5, 162, 12, 6, PAL.mist);
    g.fillStyle = PAL.yellow;
    const glow = 0.35 + 0.1 * (Math.floor(t * 6) % 2);
    for (let y = 150; y < 180; y++) for (let x = lx - 14; x < lx + 16; x++) if (glow * (1 - Math.hypot(x - lx, y - 165) / 16) > bayer(x, y)) g.fillRect(x, y, 1, 1);
  }
  pitch(g);
  slam(g, "GOAT", 90, 118, t, 0, 5, BANDS.gold);
  slam(g, "FIGHT", 90, 160, t, BEAT, 4, BANDS.blood);
  if (t >= BEAT * 2) big(g, "'26", 90, 194, 2, BANDS.steel);
  if (t >= bar(1)) {
    const fast = t >= bar(1.75);
    if (Math.floor(t * (fast ? 12 : 2.5)) % 2 === 0) small(g, "PRESS START", 90, 222, PAL.white);
  }
  small(g, "MESSI VS RONALDO", 90, 236, PAL.amber);
}

// Select screen: a 3×2 grid; 1P lands on Messi, 2P hunts and lands on Ronaldo. The "?" boxes are next episodes.
const BOX = { x: [18, 72, 126], y: [124, 170], w: 36, h: 40 };
const P2_PATH = [[bar(2), 2, 1], [bar(2.375), 1, 1], [bar(2.75), 2, 0], [bar(3), 1, 0]];
function select(g, t) {
  // scrolling checkerboard
  rect(g, 0, 0, W, H, PAL.night);
  const off = Math.floor(stepped(t, 12) * 12) % 16;
  for (let y = -16; y < H; y += 8) for (let x = -16; x < W; x += 8) if (((x + y) / 8) % 2 === 0) rect(g, x + off, y + off, 8, 8, PAL.navy);
  small(g, "SELECT YOUR PLAYER", 90, 108, PAL.amber);
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 3; c++) {
      const x = BOX.x[c], y = BOX.y[r];
      rect(g, x, y, BOX.w, BOX.h, PAL.ink);
      rect(g, x + 1, y + 1, BOX.w - 2, BOX.h - 2, PAL.slate);
      rect(g, x + 2, y + 2, BOX.w - 4, BOX.h - 4, PAL.night);
      const who = r === 0 && c < 2 ? c : -1;
      if (who >= 0) sprite(g, bustRows(who, 1), BPAL[who], x + 2, y + 3);
      else {
        sprite(g, bustRows(MESSI, 1), {}, x + 2, y + 3, { flash: PAL.navy });
        small(g, "?", x + 18, y + 16, PAL.steel);
      }
    }
  const cursor = (c, r, color, tag, on) => {
    const x = BOX.x[c] - 2, y = BOX.y[r] - 2;
    if (!on) return;
    rect(g, x, y, BOX.w + 4, 2, color);
    rect(g, x, y + BOX.h + 2, BOX.w + 4, 2, color);
    rect(g, x, y, 2, BOX.h + 4, color);
    rect(g, x + BOX.w + 2, y, 2, BOX.h + 4, color);
    rect(g, x, y - 8, 13, 8, color);
    small(g, tag, x + 7, y - 8, PAL.ink);
  };
  const blink = Math.floor(t * 8) % 2 === 0;
  const p1Picked = t >= bar(2.5), p2Picked = t >= bar(3.25);
  cursor(0, 0, PAL.celeste, "1P", p1Picked || blink);
  let p2 = P2_PATH[0];
  for (const s of P2_PATH) if (t >= s[0]) p2 = s;
  cursor(p2[1], p2[2], PAL.red, "2P", p2Picked || !blink);
  if (p1Picked) {
    if (t < bar(2.5) + 0.1) rect(g, BOX.x[0], BOX.y[0], BOX.w, BOX.h, PAL.white);
    big(g, "MESSI", 6, 222, 2, BANDS.ice, "left");
  }
  if (p2Picked) {
    if (t < bar(3.25) + 0.1) rect(g, BOX.x[1], BOX.y[0], BOX.w, BOX.h, PAL.white);
    big(g, "RONALDO", 174, 222, 2, BANDS.blood, "right");
  }
  if (t >= bar(3.5) && Math.floor(t * 4) % 2 === 0) small(g, "READY?", 90, 240, PAL.yellow);
}

// VS: the two halves in national colours, the busts slide in, VS slams on the downbeat of bar 4.
function versus(g, t) {
  const t0 = bar(4);
  for (let y = 0; y < H; y++) {
    const split = 100 - Math.round((y - 104) * 0.18);
    for (let x = 0; x < split; x += 6) rect(g, x, y, Math.min(6, split - x), 1, Math.floor(x / 6) % 2 ? PAL.white : PAL.celeste);
    rect(g, split, y, W - split, 1, y > 236 ? PAL.grass : PAL.red);
  }
  // darken towards the edges a little so the busts carry
  g.fillStyle = PAL.ink;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (0.3 * Math.abs(x - 90) / 90 > bayer(x, y)) g.fillRect(x, y, 1, 1);
  const slide = clamp((stepped(t, 12) - t0) / (BAR / 4));
  sprite(g, bustRows(MESSI, 2), BPAL[0], Math.round(-66 + 72 * slide), 116);
  sprite(g, bustRows(RONALDO, 2), BPAL[1], Math.round(182 - 72 * slide), 150);
  if (t >= t0 + BAR / 4) {
    big(g, "MESSI", 6, 196, 2, BANDS.ice, "left");
    small(g, "ARGENTINA #10", 6, 212, PAL.white, "left");
    big(g, "RONALDO", 174, 228, 2, BANDS.blood, "right");
    small(g, "PORTUGAL #7", 174, 244, PAL.white, "right");
  }
  slam(g, "VS", 90, 168, t, t0, 5, BANDS.gold);
  whiteFlash(g, t, t0);
}

function round(g, t, i, u) {
  const r = ROUNDS[i];
  stadium(g, t, u >= 0.9 ? 0.65 : 0);
  const pips = [winsBefore(i, 0) + (u >= 4.5 && r.winner === 0 ? 1 : 0), winsBefore(i, 1) + (u >= 4.5 && r.winner === 1 ? 1 : 0)];
  const m = meters(r, u);
  const fight = fightRound(g, t, r, u);
  if (u < 1) {
    slam(g, `ROUND ${i + 1}`, 90, 134, t, bar(R0 + i * RLEN), 3, BANDS.steel);
    if (u >= 0.25) small(g, r.title, 90, 160, PAL.amber);
    if (u >= 0.75) slam(g, "FIGHT!", 90, 132, t, bar(R0 + i * RLEN + 0.75), 4, BANDS.fire);
  } else {
    stats(g, r, u);
    // the move's name, big, over the touchline
    if (u >= 3.6 && u < 5.2) big(g, r.call, 90, 182, 2, r.winner === MESSI ? BANDS.ice : BANDS.fire);
    if (u < 4.5) small(g, r.title, 90, 125, PAL.amber);
    else slam(g, `${P[r.winner].name} WINS!`, 90, 124, t, bar(R0 + i * RLEN + 4.5), 2, r.winner ? BANDS.blood : BANDS.ice);
  }
  hud(g, t, `R${i + 1}`, [m[0], m[1]], pips);
  return fight.shake;
}

function final(g, t) {
  const f = (t - bar(FINAL)) / BAR;
  stadium(g, t, 0.35);
  const sf = stepped(f, 12 / BAR);
  let shake = false;
  if (f < 2) {
    // 3–3, FINAL ROUND, then both charge
    const run = clamp((sf - 1) / 1);
    const pose = f < 1 ? idlePose(t) : Math.floor(f * 16) % 2 ? "run0" : "run1";
    fighter(g, MESSI, pose, HOME[0] + Math.round(run * 38), FY);
    fighter(g, RONALDO, pose, HOME[1] - Math.round(run * 38), FY);
    slam(g, "3 : 3", 90, 132, t, bar(FINAL), 4, BANDS.gold);
    if (f >= 0.5) slam(g, "FINAL ROUND", 90, 164, t, bar(FINAL + 0.5), 2, BANDS.fire);
  } else {
    // the clash: both fly back and go down
    const a = f - 2;
    const fly = clamp((stepped(a, 12 / BAR)) / 0.5);
    const down = a >= 0.5;
    for (const who of [0, 1]) {
      const dir = who === MESSI ? -1 : 1;
      const x0 = HOME[who] + (who === MESSI ? 38 : -38);
      const x = x0 + dir * Math.round(fly * 30);
      if (down) fighter(g, who, "down", x, FY + 2, { turn: true });
      else fighter(g, who, "hit", x, FY - Math.round(18 * Math.sin(Math.PI * fly)));
    }
    spark(g, 90, FY + 18, a * BAR);
    shake = a < 0.4;
    if (a >= 0.25) {
      slam(g, "DOUBLE", 90, 124, t, bar(FINAL + 2.25), 3, BANDS.steel);
      if (a >= 0.35) slam(g, "K.O.", 90, 155, t, bar(FINAL + 2.35), 6, BANDS.fire);
    }
    if (f >= 3.5) big(g, "YOU DECIDE", 90, 202, 2, BANDS.gold);
    if (f >= 4) small(g, "FAN-MADE. NOT AFFILIATED.", 90, 226, PAL.mist);
  }
  // the bars drain together on the clash
  const drain = f < 2 ? 1 : 1 - clamp((f - 2) / 0.5);
  hud(g, t, "VS", [drain, drain, f >= 2 ? 1 : drain, f >= 2 ? 1 : drain], [3, 3]);
  return shake;
}

// ---------------------------------------------------------------- frame

let low = null;
function draw(ctx, t) {
  low ??= lowCanvas();
  const g = low.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  rect(g, 0, 0, W, H, PAL.ink);
  // screen shake in whole pixels: measure first, then redraw shifted
  let shake = false;
  const scene = (gg) => {
    if (t < bar(2)) title(gg, t);
    else if (t < bar(4)) select(gg, t);
    else if (t < bar(R0)) versus(gg, t);
    else if (t < bar(FINAL)) {
      const { i, u } = roundAt(t);
      shake = round(gg, t, i, u);
    } else shake = final(gg, t);
  };
  scene(g);
  if (shake) {
    const k = Math.floor(t * 30);
    const dx = (k % 2 ? 2 : -2), dy = k % 3 === 0 ? 1 : -1;
    g.setTransform(1, 0, 0, 1, dx, dy);
    rect(g, -4, -4, W + 8, H + 8, PAL.ink);
    scene(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Title → select comes in as a dither fade from ink. Rounds and the final hard-cut on their slam instead: clips resume
  // there after the cold open, and must land on big type, not on a dark frame.
  if (t >= bar(2) && t < bar(2) + BAR / 4) fadeIn(g, t, bar(2), BAR / 6);
  blit(ctx, low);
}

// ---------------------------------------------------------------- score: 128 BPM chiptune in A minor

const ROOTS = [45, 41, 43, 40]; // A, F, G, E (i–VI–VII–V)
const TRIAD = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
// the battle theme, eighth notes over four bars (null = rest)
const THEME = [
  [69, null, 72, 76, 74, 72, 71, 72],
  [69, null, null, 65, 69, 72, 74, 72],
  [71, null, 74, 79, 77, 76, 74, 71],
  [68, 71, 76, null, 74, null, 71, null],
];
const MOTIF = [
  [76, 78, 81, 85, 88], // Messi: up through A major, light (his 10 → the tenth above)
  [69, 73, 76, 81], // Ronaldo: the A major triad, then the SIUUU slide
];

function score(ac) {
  const m = makeMixer(ac, { level: 0.85 });
  const lead = m.bus(0.9, 0.08), harm = m.bus(0.6, 0.06), bassBus = m.bus(1, 0), drums = m.bus(0.9, 0.02), sfx = m.bus(0.9, 0.08);
  const N = midi;

  const groove = (b0, b1, { theme = false, arp = true, full = true } = {}) => {
    for (let b = b0; b < b1; b++) {
      const k = (b - b0) % 4, root = ROOTS[k], t0 = bar(b);
      for (let e = 0; e < 8; e++) triangle(m, bassBus, t0 + e * BEAT / 2, N(root + (e % 2 ? 12 : 0)), BEAT / 2 * 0.85, 0.2);
      if (full) {
        kick8(m, drums, t0, 0.45);
        kick8(m, drums, t0 + BEAT * 2, 0.4);
        kick8(m, drums, t0 + BEAT * 2.5, 0.3);
        for (const s of [1, 3]) {
          noise(m, drums, t0 + s * BEAT, 0.12, 0.09, 1600);
          pulse(m, drums, t0 + s * BEAT, N(57), 0.05, 0.04, { duty: 0.5, slide: -12 });
        }
      }
      for (let e = 0; e < 8; e++) noise(m, drums, t0 + e * BEAT / 2, 0.03, e % 2 ? 0.02 : 0.03, 8000);
      if (arp) for (let s = 0; s < 16; s++) pulse(m, harm, t0 + s * S16, N(root + 12 + [0, ...TRIAD[k], 12][s % 4 === 3 ? 4 : s % 4]), S16 * 0.8, 0.025, { duty: 0.125 });
      if (theme) THEME[k].forEach((n, e) => n && pulse(m, lead, t0 + e * BEAT / 2, N(n), BEAT / 2 * 0.9, 0.06, { duty: 0.25, vibrato: 12 }));
    }
  };
  const crash = (t, gain = 0.12) => noise(m, drums, t, 0.9, gain, 3000);
  const bell = (t) => {
    pulse(m, sfx, t, N(88), 0.5, 0.06, { duty: 0.5, decay: 0.9 });
    pulse(m, sfx, t, N(81), 0.5, 0.05, { duty: 0.25, decay: 0.9 });
    triangle(m, bassBus, t, N(57), 0.4, 0.2);
  };
  const riser = (t0, dur) => {
    pulse(m, sfx, t0, N(69), dur, 0.05, { duty: 0.125, slide: 24 });
    for (let k = 0; k < 8; k++) noise(m, drums, t0 + (k * dur) / 8, dur / 8, 0.01 + k * 0.006, 5000 - k * 400);
  };

  // title: an arpeggio up to the logo, then a waiting loop
  [57, 60, 64, 69, 72, 76, 81].forEach((n, k) => pulse(m, lead, k * S16, N(n), S16 * 0.9, 0.07, { duty: 0.25 }));
  pulse(m, lead, 7 * S16, N(81), bar(1) - 7 * S16, 0.06, { duty: 0.25, vibrato: 20, decay: 0.6 });
  triangle(m, bassBus, 0, N(45), bar(1), 0.2);
  crash(0, 0.1);
  kick8(m, drums, BEAT, 0.5); // FIGHT slams on beat 2
  groove(1, 2, { arp: false, full: false });
  coin(m, sfx, bar(1.75), N(84));

  // select: light loop, cursor blips, a coin on each pick
  groove(2, 4, { full: false });
  for (const [t0] of P2_PATH.slice(1)) pulse(m, sfx, t0, N(91), 0.04, 0.05, { duty: 0.5 });
  coin(m, sfx, bar(2.5), N(81));
  coin(m, sfx, bar(3.25), N(84));

  // VS: the hit, a stab, a snare roll into round 1
  crash(bar(4), 0.18);
  kick8(m, drums, bar(4), 0.6);
  triangle(m, bassBus, bar(4), N(33), BAR, 0.3);
  [57, 60, 64, 69].forEach((n) => pulse(m, harm, bar(4), N(n), BEAT, 0.04, { duty: 0.5 }));
  pulse(m, lead, bar(4) + S16, N(76), S16, 0.07);
  pulse(m, lead, bar(4) + S16 * 2, N(81), BEAT * 1.5, 0.07, { vibrato: 25 });
  for (let b = 4; b < 6; b++) for (let e = 0; e < 8; e++) triangle(m, bassBus, bar(b) + e * BEAT / 2, N(40 + (e % 2 ? 12 : 0)), BEAT / 2 * 0.8, 0.18);
  for (let s = 0; s < 16; s++) noise(m, drums, bar(5) + s * S16, 0.06, 0.02 + s * 0.005, 1800);

  // rounds
  ROUNDS.forEach((r, i) => {
    const b0 = R0 + i * RLEN, T = (u) => bar(b0 + u);
    bell(T(0));
    crash(T(0), 0.1);
    [81, 79, 76].forEach((n, k) => pulse(m, lead, T(0.75) + k * S16, N(n), S16 * 0.9, 0.07));
    kick8(m, drums, T(0.75), 0.5);
    groove(b0 + 1, b0 + 5, { theme: true });
    groove(b0 + 5, b0 + 6, { full: false, arp: false });
    // data melody: one note per unit the stat shows, in each player's register
    const blip = (u, who, step) => pulse(m, sfx, T(u), N((who ? 69 : 81) + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24][Math.min(10, step)]), 0.07, 0.045, { duty: 0.5 });
    if (r.key === "goals" || r.key === "intl" || r.key === "trophies") {
      const max = r.key === "goals" ? 979 : r.key === "intl" ? 146 : 46, unit = r.key === "goals" ? 100 : r.key === "intl" ? 15 : 5;
      for (const w of [0, 1]) {
        const v = r.key === "goals" ? P[w].goals : r.key === "intl" ? P[w].intl : P[w].trophies;
        for (let k = 1; k * unit <= v; k++) blip(1 + (2 * k * unit) / max, w, k);
        coin(m, sfx, T(1 + (2 * v) / max), N(w ? 76 : 88), 0.06); // where each count stops
      }
    } else if (r.key === "ballon") {
      for (const w of [0, 1]) for (let k = 0; k < P[w].ballon; k++) coin(m, sfx, T(itemTime(k, w) + 0.18), N((w ? 69 : 81) + [0, 2, 4, 7, 9, 12, 14, 16][k]), 0.05);
    } else if (r.key === "ucl") {
      for (const w of [0, 1]) for (let k = 0; k < P[w].ucl; k++) coin(m, sfx, T(itemTime(k, w, 1, 0.3)), N((w ? 69 : 81) + [0, 4, 7, 12, 16][k]), 0.05);
    } else if (r.key === "worldcup") {
      for (let k = 0; k < 6; k++) blip(1 + k * 0.17, 1, k);
      for (let k = 0; k < 8; k++) pulse(m, sfx, T(2 + k / 8), N(81 + [0, 4, 7, 12][k % 4]), BAR / 8, 0.035, { duty: 0.125 });
      [69, 73, 76, 81].forEach((n) => pulse(m, harm, T(3), N(n), BAR, 0.04, { duty: 0.25, decay: 0.7 }));
    }
    // the move: a riser, the hit, the winner's motif
    riser(T(3.5), BAR * 0.7);
    hitSfx(m, sfx, T(HIT), 0.22);
    kick8(m, drums, T(HIT), 0.6);
    crash(T(HIT), 0.14);
    MOTIF[r.winner].forEach((n, k) => pulse(m, lead, T(4.5) + k * S16, N(n), S16 * (k === MOTIF[r.winner].length - 1 ? 6 : 0.9), 0.07, { duty: 0.25, vibrato: k === MOTIF[r.winner].length - 1 ? 20 : 0 }));
    if (r.winner === RONALDO) pulse(m, lead, T(4.5) + 4 * S16, N(81), BEAT * 1.5, 0.06, { duty: 0.125, slide: 12 }); // SIUUU
  });

  // final: 3–3, FINAL ROUND, the charge, the clash, DOUBLE K.O., game-over melody
  const F = (f) => bar(FINAL + f);
  [57, 60, 64].forEach((n) => pulse(m, harm, F(0), N(n), BEAT * 2, 0.045, { duty: 0.5 }));
  crash(F(0), 0.12);
  bell(F(0.5));
  for (let e = 0; e < 16; e++) triangle(m, bassBus, F(0) + e * BEAT / 2, N(40 + (e % 2 ? 12 : 0)), BEAT / 2 * 0.8, 0.2);
  for (let s = 0; s < 16; s++) noise(m, drums, F(1) + s * S16, 0.06, 0.02 + s * 0.007, 1600);
  riser(F(1), BAR);
  crash(F(2), 0.22);
  kick8(m, drums, F(2), 0.7);
  hitSfx(m, sfx, F(2), 0.3);
  triangle(m, bassBus, F(2), N(33), BAR * 1.5, 0.3);
  [76, 75, 74, 73, 72].forEach((n, k) => pulse(m, lead, F(2.25) + k * BEAT / 2, N(n), BEAT / 2 * 0.9, 0.07, { duty: 0.25 }));
  pulse(m, lead, F(2.25) + 5 * BEAT / 2, N(69), BEAT * 1.5, 0.06, { duty: 0.25, vibrato: 15, decay: 0.8 });
  [[69, 1], [72, 1], [71, 1], [67, 1], [69, 4]].reduce((at, [n, beats]) => {
    pulse(m, lead, F(3.5) + at * BEAT, N(n), beats * BEAT * 0.95, 0.055, { duty: 0.25, vibrato: beats > 1 ? 18 : 0, decay: beats > 1 ? 0.7 : 0 });
    return at + beats;
  }, 0);
  for (const b of [3.5, 4.5]) triangle(m, bassBus, F(b), N(b === 3.5 ? 41 : 45), BAR * 0.95, 0.18);
  [57, 60, 64].forEach((n) => pulse(m, harm, F(5), N(n), BAR - 0.05, 0.035, { duty: 0.5, decay: 0.9 }));
  triangle(m, bassBus, F(5), N(45), BAR - 0.05, 0.2);
}

// ---------------------------------------------------------------- clips

// Each round is a clip: it opens on ROUND n (big type) and ends on the winner's banner. Its cold open is the hit.
const roundCut = (name, i, hook, sub) => ({
  name, from: bar(R0 + i * RLEN), to: bar(R0 + i * RLEN + RLEN),
  coldOpen: { from: bar(R0 + i * RLEN + HIT) - 0.02, length: BAR }, hook, sub,
});

export default {
  width: 1080,
  height: 1920,
  portrait: true,
  duration: 90,
  fonts: ['400 112px Anton', '500 34px "IBM Plex Mono"'],
  title: "Messi vs Ronaldo: GOAT FIGHT ’26",
  episode: 4,
  vertical: {
    hook: ["MESSI VS RONALDO.", "SIX ROUNDS. ONE GOAT."],
    sub: "LIONEL MESSI · CRISTIANO RONALDO",
    cta: ["WHO’S YOUR GOAT?", "COMMENT BELOW"],
  },
  chapters: [[0, "TITLE"], [bar(2), "SELECT"], [bar(4), "VS"], ...ROUNDS.map((r, i) => [bar(R0 + i * RLEN), `ROUND ${i + 1}`]), [bar(FINAL), "FINAL ROUND"]],
  coldOpen: { from: bar(FINAL + 2) - 0.02, length: BAR },
  cuts: [
    { ...roundCut("goals", 0, ["979 VS 932 GOALS.", "ROUND 1: CAREER GOALS."], "RONALDO VS MESSI · GOAT FIGHT ’26"), from: bar(4) },
    roundCut("ballon", 1, ["8 VS 5.", "ROUND 2: BALLON D’OR."], "MESSI VS RONALDO · GOAT FIGHT ’26"),
    roundCut("ucl", 2, ["5 VS 4 TITLES.", "ROUND 3: CHAMPIONS LEAGUE."], "RONALDO VS MESSI · GOAT FIGHT ’26"),
    roundCut("worldcup", 3, ["1 WORLD CUP VS 0.", "ROUND 4: THE WORLD CUP."], "MESSI VS RONALDO · GOAT FIGHT ’26"),
    roundCut("intl", 4, ["146 VS 126.", "ROUND 5: GOALS FOR COUNTRY."], "RONALDO VS MESSI · GOAT FIGHT ’26"),
    roundCut("trophies", 5, ["46 VS 36 TROPHIES.", "ROUND 6: TROPHIES."], "MESSI VS RONALDO · GOAT FIGHT ’26"),
    {
      name: "ko", from: bar(FINAL), to: bar(FINAL + 6), coldOpen: { from: bar(FINAL + 2) - 0.02, length: BAR },
      hook: ["3 ROUNDS EACH.", "THEN: DOUBLE K.O."], sub: "MESSI VS RONALDO · GOAT FIGHT ’26",
    },
  ],
  draw,
  score,
};
