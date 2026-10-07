// EP05 · Shohei Ohtani: SHO-TIME BASEBALL ’26. The second pixel episode (PIXEL_STYLE.md).
//
// A 16-bit baseball game in which one player plays both ends: Ohtani pitches, Ohtani bats. Six innings are six
// seasons (2018, 2021, the 2023 WBC, 2024, 2025, 2026). In each, the pitcher strikes the batter out, the batter
// takes the pitcher deep, the career home-run counter climbs to 310, and the season's award slams in.
// 120 BPM, 45 bars = 90 s. Every number is in facts.md.
import { clamp, hash, midi, makeMixer } from "../../render/kit.js";
import {
  LOW, lowCanvas, blit, rect, PAL, gradient, ptext, sprite, fighterGrid, POSES, bustGrid, handAt, bat,
  stepped, bayer, pulse, triangle, noise, kick8, coin, hitSfx, BANDS, bigText, smallText, slamText, ditherFade, veil, fireworks,
} from "../../render/pixel.js";

const BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4, S16 = BEAT / 4;
const bar = (n) => n * BAR;
const W = LOW.width, H = LOW.height;

// ---------------------------------------------------------------- kits and looks

const BASE = { o: PAL.ink, s: PAL.skin, S: PAL.skinShade, h: PAL.night, H: PAL.navy, k: PAL.ink, m: PAL.brown, w: PAL.white, b: PAL.night };
const KITS = {
  ANGELS: { ...BASE, j: PAL.red, J: PAL.crimson, n: PAL.white, p: PAL.white, P: PAL.mist, v: PAL.red, q: PAL.red, c: PAL.red },
  DODGERS: { ...BASE, j: PAL.white, J: PAL.mist, n: PAL.blue, p: PAL.white, P: PAL.mist, v: PAL.blue, q: PAL.blue, c: PAL.blue },
  JAPAN: { ...BASE, j: PAL.navy, J: PAL.night, n: PAL.white, p: PAL.white, P: PAL.mist, v: PAL.navy, q: PAL.navy, c: PAL.red },
  USA: { ...BASE, h: PAL.umber, j: PAL.white, J: PAL.mist, n: PAL.red, p: PAL.white, P: PAL.mist, v: PAL.red, q: PAL.night, c: PAL.red },
};
const CROWD = { ANGELS: [PAL.red, PAL.white], DODGERS: [PAL.blue, PAL.white], JAPAN: [PAL.navy, PAL.white, PAL.red] };
const OHTANI = { hair: "short", number: 17, cap: true, pants: true };
const TROUT = { hair: "short", number: 27, cap: true, pants: true };
const CATCHER_LOOK = { hair: "short", cap: true, pants: true }; // the pitcher's catcher, no name, no number

// ---------------------------------------------------------------- the six innings (facts.md)

const SEASONS = [
  { year: 2018, kit: "ANGELS", tag: "THE TWO-WAY ROOKIE", hrBefore: 0, hr: 22, k: 63, award: ["ROOKIE OF", "THE YEAR"], note: "22 HR AND 63 K", moment: "hr" },
  { year: 2021, kit: "ANGELS", tag: "SHO-TIME", hrBefore: 47, hr: 46, k: 156, award: ["UNANIMOUS", "MVP"], note: "46 HR AND 156 K", moment: "hr" },
  { year: 2023, kit: "JAPAN", tag: "WBC FINAL: FULL COUNT", hrBefore: 127, hr: 44, k: 167, award: ["WBC", "CHAMPION"], note: "JAPAN 3-2 USA - MVP", moment: "k", wbc: true },
  { year: 2024, kit: "DODGERS", tag: "THE FIRST 50/50", hrBefore: 171, hr: 54, sb: 59, award: ["50 / 50"], note: "WORLD SERIES CHAMPS", moment: "hr" },
  { year: 2025, kit: "DODGERS", tag: "BACK ON THE MOUND", hrBefore: 225, hr: 55, k: 62, award: ["4TH MVP"], note: "ALL 4 UNANIMOUS - 2ND RING", moment: "hr" },
  { year: 2026, kit: "DODGERS", tag: "TWO-WAY AGAIN", hrBefore: 280, hr: 30, k: 95, award: ["1.79 ERA"], note: "8-2 ON THE MOUND - 30 HR", moment: "k" },
];
const C0 = 5, CLEN = 6, END = C0 + SEASONS.length * CLEN; // bars: innings from 5 to 41, the ending to 45
const CAREER_HR = 310;
const chapterAt = (t) => {
  const i = Math.floor((t - bar(C0)) / bar(CLEN));
  return i >= 0 && i < SEASONS.length ? { i, u: (t - bar(C0 + i * CLEN)) / BAR } : null;
};

// The at-bats, in bars into an inning: a strikeout, then a home run (the WBC inning is all one at-bat to Trout).
const K_AB = { windup: 0.75, release: 1.0, mitt: 1.3, swing: 1.18 };
const HR_AB = { windup: 2.0, release: 2.25, contact: 2.5, out: 2.95 };
const WBC_AB = { windup: 2.0, release: 2.25, mitt: 2.55, swing: 2.42 };
const kMoment = (s) => (s.wbc ? WBC_AB.mitt : K_AB.mitt);
const momentU = (s) => (s.moment === "k" ? kMoment(s) : HR_AB.contact);

// Counters climb over bars 1–3.5 of an inning: the career home runs and the season's strikeouts.
const climb = (u) => clamp((u - 1) / 2.5);
const careerHR = (s, u) => s.hrBefore + Math.floor(s.hr * climb(u));

// ---------------------------------------------------------------- sprites

const cache = new Map();
const memo = (key, fn) => (cache.has(key) ? cache.get(key) : (cache.set(key, fn()), cache.get(key)));
const rows = (look, pose) => memo(`${look.number ?? "c"}${pose}`, () => fighterGrid(POSES[pose], look));
const bustRows = (k) => memo(`bust${k}`, () => bustGrid({ hair: "short" }, k));

const GROUND = 250, MOUND = 244;
const BATTER = { x: 8, y: GROUND - 57 };
const PITCHER = { x: 116, y: MOUND - 57 };
const CATCHER = { x: -14, y: GROUND - 57 };

function person(g, look, kit, pose, x, y, o = {}) {
  sprite(g, rows(look, pose), KITS[kit], x, y, { flip: !!o.flip, flash: o.flash });
}

function ball(g, x, y) {
  rect(g, Math.round(x) - 1, Math.round(y) - 1, 3, 3, PAL.ink);
  rect(g, Math.round(x), Math.round(y) - 1, 1, 3, PAL.white);
  rect(g, Math.round(x) - 1, Math.round(y), 3, 1, PAL.white);
  rect(g, Math.round(x), Math.round(y), 1, 1, PAL.red);
}

function trail(g, pts) {
  pts.forEach(([x, y], k) => rect(g, Math.round(x), Math.round(y), 2 - (k > 1 ? 1 : 0), 1, [PAL.white, PAL.mist, PAL.steel][Math.min(2, k)]));
}

// ---------------------------------------------------------------- the ballpark (side view)

function crowd(g, t, colors) {
  rect(g, 0, 116, W, 66, PAL.night);
  rect(g, 0, 116, W, 2, PAL.slate);
  const onBeat = (t % BEAT) < BEAT * 0.3, beat = Math.floor(t / BEAT);
  for (let row = 0; row < 20; row++) {
    const y = 120 + row * 3;
    for (let col = 0; col < 60; col++) {
      const x = col * 3 + (row % 2), id = row * 61 + col;
      const jump = onBeat && hash(id + beat * 5, 6) < 0.3 ? 1 : 0;
      rect(g, x, y - jump, 2, 1, hash(id, 8) < 0.5 ? PAL.skin : PAL.tan);
      rect(g, x, y + 1 - jump, 2, 1, colors[Math.floor(hash(id, 4) * colors.length)]);
    }
  }
  const fr = Math.floor(t * 12);
  for (let k = 0; k < 5; k++) if (hash(k + fr * 13, 11) < 0.6) rect(g, Math.floor(hash(k + fr * 7, 12) * W), 120 + Math.floor(hash(k + fr * 3, 14) * 58), 1, 1, PAL.white);
}

function ballpark(g, t, kit = "DODGERS", dim = 0) {
  gradient(g, 0, 0, W, 120, [PAL.ink, PAL.night, PAL.navy, PAL.plum]);
  crowd(g, t, CROWD[kit] ?? CROWD.DODGERS);
  veil(g, 116, 182, dim);
  // outfield wall with the yellow line and a distance marker
  rect(g, 0, 182, W, 12, PAL.pine);
  rect(g, 0, 182, W, 1, PAL.yellow);
  ptext(g, "400", 82, 185, { color: PAL.white });
  // grass in widening stripes
  let y = 194, k = 0, h = 3;
  while (y < H) {
    rect(g, 0, y, W, h, k % 2 ? PAL.grass : PAL.pine);
    y += h;
    h += 2;
    k++;
  }
  // infield dirt around the plate, the mound, the plate and the batter's box
  for (let yy = 238; yy < 262; yy++) {
    const half = Math.round(64 * Math.sqrt(1 - ((yy - 250) / 12) ** 2));
    rect(g, 0, yy, half, 1, yy % 3 ? PAL.brown : PAL.umber);
  }
  for (let xx = 96; xx < W; xx++) {
    const hump = Math.max(0, Math.round(7 - ((xx - 136) / 40) ** 2 * 7));
    rect(g, xx, MOUND - hump + 6, 1, hump + 6, xx % 3 ? PAL.tan : PAL.brown);
  }
  rect(g, 130, MOUND - 1, 8, 1, PAL.white); // the rubber
  rect(g, 40, GROUND - 1, 8, 2, PAL.white); // home plate
  rect(g, 28, GROUND - 4, 1, 6, PAL.mist);
  rect(g, 28, GROUND - 4, 12, 1, PAL.mist);
}

// ---------------------------------------------------------------- HUD

function hud(g, t, s, u, final = false) {
  rect(g, 0, 104, W, 12, PAL.ink);
  rect(g, 0, 115, W, 1, PAL.navy);
  smallText(g, "B OHTANI", 4, 106, PAL.white, "left");
  smallText(g, "P OHTANI", 176, 106, PAL.white, "right");
  const hr = final ? CAREER_HR : s ? careerHR(s, u) : 0;
  smallText(g, s ? String(s.year) : "SHO-TIME", 90, 106, PAL.amber);
  // the career home-run counter under the batter, the season's strikeouts under the pitcher
  rect(g, 0, 116, 50, 9, PAL.ink);
  smallText(g, `HR ${String(hr).padStart(3, "0")}`, 4, 117, PAL.yellow, "left");
  if (s && s.k != null) {
    rect(g, 130, 116, 50, 9, PAL.ink);
    smallText(g, `K ${String(Math.floor(s.k * climb(u))).padStart(3, "0")}`, 176, 117, PAL.cyan, "right");
  }
}

// ---------------------------------------------------------------- an inning

function inning(g, t, i, u) {
  const s = SEASONS[i], kit = s.kit;
  ballpark(g, t, kit, u >= 0.9 ? 0.6 : 0.3);
  const su = stepped(u, 12 / BAR);
  const batterLook = s.wbc ? TROUT : OHTANI, batterKit = s.wbc ? "USA" : kit;

  // ---- poses through the inning
  let pPose = "stance0", bPose = "batStance", bx = BATTER.x;
  let pFlip = true, ballAt = null, ballTrail = [], batAngle = -2.3, batFlying = null;
  // the strikeout at-bat (or the one WBC at-bat to Trout)
  const K = s.wbc ? WBC_AB : K_AB;
  if (u >= K.windup && u < K.mitt + 0.7) {
    pPose = u < K.release ? "windup" : u < K.mitt + 0.15 ? "throw" : "win";
    if (u >= K.release && u < K.mitt) {
      const p = clamp((u - K.release) / (K.mitt - K.release));
      const [x0, y0] = handAt("throw", PITCHER.x, PITCHER.y, true, "rHand");
      const [x1, y1] = handAt("crouch", CATCHER.x, CATCHER.y, false, "lHand");
      // a sweeper: it runs away from the swing late
      const at = (q) => [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - (s.wbc ? 6 * Math.sin(Math.PI * q) * q : 3 * Math.sin(Math.PI * q))];
      ballAt = at(p);
      ballTrail = [0.06, 0.12, 0.18].map((d) => at(Math.max(0, p - d)));
    }
    if (u >= K.swing) bPose = u < K.swing + 0.3 ? "swing" : "batStance";
    if (bPose === "swing") batAngle = u < K.swing + 0.1 ? -0.4 : 0.6;
  }
  // the home run (not in the WBC inning)
  if (!s.wbc && u >= HR_AB.windup) {
    if (u < HR_AB.release) pPose = "windup";
    else if (u < HR_AB.contact + 0.1) pPose = "throw";
    else {
      pPose = "stance1";
      pFlip = false; // he turns round to watch it go
    }
    if (u >= HR_AB.release && u < HR_AB.contact) {
      const p = clamp((u - HR_AB.release) / (HR_AB.contact - HR_AB.release));
      const [x0, y0] = handAt("throw", PITCHER.x, PITCHER.y, true, "rHand");
      const x1 = 46, y1 = BATTER.y + 21;
      const at = (q) => [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q];
      ballAt = at(p);
      ballTrail = [0.08, 0.16].map((d) => at(Math.max(0, p - d)));
    }
    if (u >= HR_AB.contact - 0.08) {
      bPose = u < HR_AB.contact + 0.5 ? "swing" : "win";
      batAngle = u < HR_AB.contact ? -0.2 : 0.9;
    }
    if (u >= HR_AB.contact && u < HR_AB.out) {
      // up and over the pitcher into the right-field seats
      const p = clamp((su - HR_AB.contact) / (HR_AB.out - HR_AB.contact));
      const at = (q) => [46 + (166 - 46) * q, BATTER.y + 21 - 150 * q + 95 * q * q];
      ballAt = at(p);
      ballTrail = [0.05, 0.1, 0.15].map((d) => at(Math.max(0, p - d)));
    }
    if (bPose === "win" && u < HR_AB.contact + 1.1) {
      // the bat flip
      const q = clamp((u - HR_AB.contact - 0.5) / 0.6);
      batFlying = [30 + Math.round(q * 22), BATTER.y + 2 - Math.round(30 * Math.sin(Math.PI * q)), Math.floor(u * 24) * 0.8];
    }
    // 2024: the 50/50 inning ends with a steal: he runs for second
    if (s.sb && u >= 3.4 && u < 4.4) {
      const p = clamp((su - 3.4) / 0.8);
      bPose = Math.floor(u * 16) % 2 ? "run0" : "run1";
      bx = BATTER.x + Math.round(p * 120);
    } else if (s.sb && u >= 4.4) {
      bPose = "win";
      bx = BATTER.x + 120;
    }
  }
  if (u >= 3.4 && !(s.sb && u < 4.4)) {
    if (s.moment === "k") pPose = "win";
  }

  // ---- draw the players: catcher, batter, pitcher
  person(g, CATCHER_LOOK, kit, "crouch", CATCHER.x, CATCHER.y);
  person(g, batterLook, batterKit, bPose, bx, BATTER.y);
  if (bPose === "batStance" || bPose === "swing") bat(g, handAt(bPose, bx, BATTER.y, false, "lHand"), batAngle);
  if (batFlying) bat(g, [batFlying[0], batFlying[1]], batFlying[2], 13);
  person(g, OHTANI, kit, pPose, PITCHER.x, PITCHER.y, { flip: pFlip });
  if (ballAt) {
    trail(g, ballTrail);
    ball(g, ...ballAt);
  }

  // ---- text: the year, the tag, the counters, the call, the award
  if (u < 1) {
    slamText(g, String(s.year), 90, 128, t, bar(C0 + i * CLEN), 4, BANDS.gold);
    if (u >= 0.25) smallText(g, s.tag, 90, 160, PAL.white);
    if (u >= 0.25) smallText(g, s.wbc ? "JAPAN VS USA" : kit, 90, 170, PAL.amber);
  } else if (u < 3.5) {
    // big counters in the stands
    bigText(g, String(careerHR(s, u)), 45, 136, 3, BANDS.gold);
    smallText(g, "CAREER HR", 45, 160, PAL.mist);
    if (s.wbc) {
      bigText(g, u < WBC_AB.mitt ? "3-2" : "K", 135, 136, 3, BANDS.ice);
      smallText(g, u < WBC_AB.mitt ? "FULL COUNT" : "LAST OUT", 135, 160, PAL.mist);
      if (u >= 1.2) smallText(g, "VS TROUT", 135, 170, PAL.rose);
    } else if (s.k != null) {
      bigText(g, String(Math.floor(s.k * climb(u))), 135, 136, 3, BANDS.ice);
      smallText(g, "STRIKEOUTS", 135, 160, PAL.mist);
    } else {
      bigText(g, String(Math.floor(s.sb * climb(u))), 135, 136, 3, BANDS.ice);
      smallText(g, "STOLEN BASES", 135, 160, PAL.mist);
    }
    // the calls
    if (u >= kMoment(s) && u < kMoment(s) + 0.6) bigText(g, s.wbc ? "STRIKE 3!" : "K!", 132, 174, s.wbc ? 2 : 3, BANDS.ice);
    if (!s.wbc && u >= HR_AB.contact + 0.05 && u < 3.5) slamText(g, "HOME RUN!", 90, 172, t, bar(C0 + i * CLEN + HR_AB.contact + 0.05), 2, BANDS.fire);
  } else {
    slamText(g, s.award[0], 90, 126, t, bar(C0 + i * CLEN + 3.5), 3, BANDS.gold);
    if (s.award[1]) slamText(g, s.award[1], 90, 150, t, bar(C0 + i * CLEN + 3.6), 3, BANDS.gold);
    if (u >= 3.9) smallText(g, s.note, 90, s.award[1] ? 175 : 152, PAL.white);
    if (s.sb && u >= 3.9) smallText(g, "54 HR - 59 SB", 90, 162, PAL.yellow);
  }
  // fireworks for the home run
  if (!s.wbc && u >= HR_AB.out - 0.1) fireworks(g, 110, 124, 64, 40, (u - HR_AB.out + 0.1) * BAR, 4, i + 2);
  if (s.wbc && u >= 3.5) fireworks(g, 10, 124, 160, 40, (u - 3.5) * BAR, 5, 9);
  hud(g, t, s, u);
}

// ---------------------------------------------------------------- title, mode select, play ball, the ending

function title(g, t) {
  ballpark(g, t, "DODGERS", 0.55);
  slamText(g, "SHO-TIME", 90, 120, t, 0, 3, BANDS.gold);
  slamText(g, "BASEBALL", 90, 148, t, BEAT, 3, BANDS.royal);
  if (t >= BEAT * 2) bigText(g, "'26", 90, 174, 2, BANDS.steel);
  person(g, OHTANI, "DODGERS", "batStance", BATTER.x, BATTER.y);
  bat(g, handAt("batStance", BATTER.x, BATTER.y, false, "lHand"), -2.3);
  person(g, OHTANI, "DODGERS", "stance0", PITCHER.x, PITCHER.y, { flip: true });
  if (t >= bar(1) && Math.floor(t * (t >= bar(1.75) ? 12 : 2.5)) % 2 === 0) smallText(g, "PRESS START", 90, 200, PAL.white);
}

// Mode select: 1P picks the pitcher, 2P the batter, and both land on the same man.
function select(g, t) {
  rect(g, 0, 0, W, H, PAL.night);
  const off = Math.floor(stepped(t, 12) * 12) % 16;
  for (let y = -16; y < H; y += 8) for (let x = -16; x < W; x += 8) if (((x + y) / 8) % 2 === 0) rect(g, x + off, y + off, 8, 8, PAL.navy);
  smallText(g, "SELECT MODE", 90, 106, PAL.amber);
  const box = (x, label, color, picked) => {
    rect(g, x, 122, 70, 84, picked ? color : PAL.ink);
    rect(g, x + 2, 124, 66, 80, PAL.night);
    sprite(g, bustRows(2), KITS.DODGERS, x + 3, 128);
    bigText(g, label, x + 35, 190, 1, picked ? BANDS.gold : BANDS.steel);
  };
  const p1 = t >= bar(2.5), p2 = t >= bar(3);
  box(14, "PITCHER", PAL.cyan, p1);
  box(96, "BATTER", PAL.yellow, p2);
  if (p1) smallText(g, "1P", 49, 114, PAL.cyan);
  if (p2) smallText(g, "2P", 131, 114, PAL.yellow);
  if (t >= bar(3.25)) {
    slamText(g, "TWO-WAY MODE", 90, 216, t, bar(3.25), 2, BANDS.fire);
    smallText(g, "OHTANI VS OHTANI", 90, 236, PAL.white);
  }
}

function playBall(g, t) {
  ballpark(g, t, "ANGELS", 0.3);
  person(g, CATCHER_LOOK, "ANGELS", "crouch", CATCHER.x, CATCHER.y);
  person(g, OHTANI, "ANGELS", "batStance", BATTER.x, BATTER.y);
  bat(g, handAt("batStance", BATTER.x, BATTER.y, false, "lHand"), -2.3);
  person(g, OHTANI, "ANGELS", "stance0", PITCHER.x, PITCHER.y, { flip: true });
  slamText(g, "PLAY BALL!", 90, 136, t, bar(4), 3, BANDS.fire);
  hud(g, t, null, 0);
}

function ending(g, t) {
  const f = (t - bar(END)) / BAR;
  ballpark(g, t, "DODGERS", 0.65);
  person(g, OHTANI, "DODGERS", "win", -6, BATTER.y);
  person(g, OHTANI, "DODGERS", "win", 142, BATTER.y, { flip: true });
  smallText(g, "CAREER", 90, 122, PAL.mist);
  slamText(g, "310 HR", 90, 132, t, bar(END), 4, BANDS.gold);
  if (f >= 0.75) slamText(g, "4 MVP", 90, 164, t, bar(END + 0.75), 2, BANDS.ice);
  if (f >= 1.25) smallText(g, "ALL UNANIMOUS - 2 RINGS", 90, 182, PAL.white);
  if (f >= 2) fireworks(g, 0, 124, W, 50, ((f - 2) % 1) * BAR, 5, Math.floor(f));
  if (f >= 2.5 && Math.floor(t * 2.5) % 2 === 0) smallText(g, "CONTINUE? OCTOBER...", 90, 204, PAL.yellow);
  if (f >= 2.5) smallText(g, "FAN-MADE. NOT AFFILIATED.", 90, 218, PAL.mist);
  hud(g, t, null, 0, true);
}

// ---------------------------------------------------------------- frame

let low = null;
function draw(ctx, t) {
  low ??= lowCanvas();
  const g = low.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  rect(g, 0, 0, W, H, PAL.ink);
  if (t < bar(2)) title(g, t);
  else if (t < bar(4)) select(g, t);
  else if (t < bar(C0)) playBall(g, t);
  else if (t < bar(END)) {
    const { i, u } = chapterAt(t);
    inning(g, t, i, u);
  } else ending(g, t);
  ditherFade(g, t, bar(2), BAR / 8);
  blit(ctx, low);
}

// ---------------------------------------------------------------- score: 120 BPM, chiptune and ballpark organ in D

// D major, I–vi–IV–V; the motif is his number: 1 and 7 (D up to C#), then home.
const ROOTS = [50, 47, 43, 45]; // D, B, G, A
const TRIAD = [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7]];
const THEME = [
  [74, null, 78, 81, 83, 81, 78, 76],
  [74, null, 71, 74, 78, null, 76, 74],
  [79, null, 78, 76, 74, 76, 78, 79],
  [81, 83, 85, null, 86, null, 81, null],
];
const MOTIF = [74, 85, 86]; // D, C#, D: one and seven
const YO = [74, 76, 79, 81, 83]; // the Japanese yo scale, for the WBC inning

function score(ac) {
  const m = makeMixer(ac, { level: 0.85 });
  const lead = m.bus(0.9, 0.1), organ = m.bus(0.55, 0.15), bassBus = m.bus(1, 0), drums = m.bus(0.9, 0.02), sfx = m.bus(0.9, 0.08);
  const N = midi;
  const crash = (t, gain = 0.12) => noise(m, drums, t, 0.9, gain, 3000);
  const groove = (b0, b1, { theme = false, scale = null, full = true } = {}) => {
    for (let b = b0; b < b1; b++) {
      const k = (b - b0) % 4, root = ROOTS[k], t0 = bar(b);
      for (let e = 0; e < 8; e++) triangle(m, bassBus, t0 + e * BEAT / 2, N(root - 12 + (e % 2 ? 12 : 0)), BEAT / 2 * 0.85, 0.2);
      if (full) {
        kick8(m, drums, t0, 0.45);
        kick8(m, drums, t0 + BEAT * 2, 0.4);
        for (const s of [1, 3]) noise(m, drums, t0 + s * BEAT, 0.12, 0.08, 1600);
      }
      for (let e = 0; e < 8; e++) noise(m, drums, t0 + e * BEAT / 2, 0.03, e % 2 ? 0.02 : 0.03, 8000);
      // the organ: held chords with a wobble, like a ballpark Hammond on the beat
      for (const beat of [0, 2]) TRIAD[k].forEach((n) => pulse(m, organ, t0 + beat * BEAT, N(root + 12 + n), BEAT * 1.8, 0.02, { duty: 0.5, vibrato: 18 }));
      if (theme) THEME[k].forEach((n, e) => n && pulse(m, lead, t0 + e * BEAT / 2, N(scale ? scale[(THEME[k].indexOf(n) + e) % scale.length] : n), BEAT / 2 * 0.9, 0.055, { duty: 0.25, vibrato: 10 }));
    }
  };
  const windup = (t) => pulse(m, sfx, t, N(62), BEAT * 0.9, 0.035, { duty: 0.125, slide: 12 });
  const pop = (t) => { // the mitt
    noise(m, drums, t, 0.08, 0.14, 1200);
    kick8(m, drums, t, 0.3);
  };
  const crack = (t) => { // the bat
    noise(m, drums, t, 0.05, 0.22, 2500);
    pulse(m, sfx, t, N(98), 0.05, 0.06, { duty: 0.5 });
    crash(t + 0.02, 0.15);
  };

  // title and mode select
  [62, 66, 69, 74, 78, 81, 86].forEach((n, k) => pulse(m, lead, k * S16, N(n), S16 * 0.9, 0.06, { duty: 0.25 }));
  pulse(m, lead, 7 * S16, N(86), bar(1) - 7 * S16, 0.05, { duty: 0.25, vibrato: 20, decay: 0.6 });
  triangle(m, bassBus, 0, N(38), bar(1), 0.2);
  crash(0, 0.1);
  groove(1, 4, { full: false });
  coin(m, sfx, bar(1.75), N(86));
  coin(m, sfx, bar(2.5), N(81));
  coin(m, sfx, bar(3), N(86));
  MOTIF.forEach((n, k) => pulse(m, lead, bar(3.25) + k * BEAT / 2, N(n), k === 2 ? BEAT * 1.5 : BEAT / 2 * 0.9, 0.06, { duty: 0.25 }));
  // play ball: an organ charge into the first inning
  crash(bar(4), 0.15);
  [62, 66, 69, 74].forEach((n, k) => pulse(m, organ, bar(4) + k * S16 * 2, N(n), k === 3 ? BEAT * 2 : S16 * 1.8, 0.04, { duty: 0.5, vibrato: 20 }));
  groove(4, 5, { full: true });

  SEASONS.forEach((s, i) => {
    const b0 = C0 + i * CLEN, T = (u) => bar(b0 + u);
    crash(T(0), 0.12);
    kick8(m, drums, T(0), 0.55);
    MOTIF.forEach((n, k) => pulse(m, lead, T(0.25) + k * S16 * 2, N(n), S16 * 1.8, 0.06, { duty: 0.25 }));
    groove(b0 + 1, b0 + 5, { theme: true, scale: s.wbc ? YO : null });
    groove(b0 + 5, b0 + 6, { full: false });
    // data melody: a note every 5 career home runs, a lower one every 20 strikeouts
    for (let k = 1; k * 5 <= s.hr; k++) pulse(m, sfx, T(1 + 2.5 * (k * 5) / s.hr), N(74 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][k % 12]), 0.06, 0.035, { duty: 0.5 });
    const second = s.k ?? s.sb ?? 0, unit = s.k ? 20 : 10;
    for (let k = 1; k * unit <= second; k++) pulse(m, sfx, T(1 + 2.5 * (k * unit) / second), N(62 + [0, 4, 7, 12, 16, 19, 24, 28][k % 8]), 0.06, 0.03, { duty: 0.125 });
    // the at-bats
    const K = s.wbc ? WBC_AB : K_AB;
    windup(T(K.windup));
    pulse(m, sfx, T(K.release), N(86), (K.mitt - K.release) * BAR, 0.03, { duty: 0.125, slide: -10 });
    pop(T(K.mitt));
    [86, 85, 86].forEach((n, k) => pulse(m, lead, T(K.mitt) + k * S16, N(n), S16 * 0.9, 0.06));
    if (!s.wbc) {
      windup(T(HR_AB.windup));
      crack(T(HR_AB.contact));
      pulse(m, sfx, T(HR_AB.contact), N(74), (HR_AB.out - HR_AB.contact) * BAR, 0.05, { duty: 0.25, slide: 24 });
      for (let k = 0; k < 4; k++) noise(m, sfx, T(HR_AB.out) + k * 0.18, 0.4, 0.06, 2000 + k * 600); // fireworks
    } else {
      // the last out of the WBC: the crowd and a fanfare in the yo scale
      crash(T(WBC_AB.mitt) + 0.02, 0.2);
      YO.forEach((n, k) => pulse(m, lead, T(WBC_AB.mitt + 0.25) + k * S16, N(n + 12), S16 * 0.9, 0.05));
    }
    // the award: a stab and the motif up an octave
    crash(T(3.5), 0.12);
    [74, 78, 81].forEach((n) => pulse(m, organ, T(3.5), N(n), BEAT * 2, 0.035, { duty: 0.5, vibrato: 15 }));
    MOTIF.forEach((n, k) => pulse(m, lead, T(3.6) + k * S16 * 2, N(n + 12), k === 2 ? BEAT * 1.5 : S16 * 1.8, 0.05, { duty: 0.25 }));
    if (s.sb) for (let k = 0; k < 8; k++) pulse(m, sfx, T(3.4) + k * S16, N(74 + k * 2), S16 * 0.8, 0.03, { duty: 0.5 }); // the steal
  });

  // the ending: 310, 4 MVP, fireworks, a slow motif to close
  const E = (f) => bar(END + f);
  crash(E(0), 0.16);
  kick8(m, drums, E(0), 0.6);
  coin(m, sfx, E(0.75), N(86));
  groove(END, END + 2, { full: true });
  for (let k = 0; k < 6; k++) noise(m, sfx, E(2) + k * 0.33, 0.45, 0.05, 2000 + (k % 3) * 700);
  [74, 85, 86].forEach((n, k) => pulse(m, lead, E(2) + k * BEAT, N(n), k === 2 ? BAR * 1.5 : BEAT * 0.9, 0.055, { duty: 0.25, vibrato: k === 2 ? 18 : 0, decay: k === 2 ? 0.7 : 0 }));
  [62, 66, 69, 74].forEach((n) => pulse(m, organ, E(2.5), N(n), BAR * 1.45, 0.03, { duty: 0.5, vibrato: 15, decay: 0.8 }));
  triangle(m, bassBus, E(2.5), N(38), BAR * 1.45, 0.2);
}

// ---------------------------------------------------------------- clips: one inning each, its moment as the cold open

const inningCut = (name, i, hook, sub) => ({
  name, from: bar(C0 + i * CLEN), to: bar(C0 + i * CLEN + CLEN),
  coldOpen: { from: bar(C0 + i * CLEN + momentU(SEASONS[i])) - 0.02, length: BAR }, hook, sub,
});

export default {
  width: 1080,
  height: 1920,
  portrait: true,
  duration: 90,
  fonts: ['400 112px Anton', '500 34px "IBM Plex Mono"'],
  title: "Shohei Ohtani: SHO-TIME BASEBALL ’26",
  episode: 5,
  vertical: {
    hook: ["OHTANI VS OHTANI.", "ONLY HE CAN FACE HIMSELF."],
    sub: "SHOHEI OHTANI · 310 HR · 4 MVP",
  },
  chapters: [[0, "TITLE"], [bar(2), "MODE SELECT"], [bar(4), "PLAY BALL"], ...SEASONS.map((s, i) => [bar(C0 + i * CLEN), String(s.year)]), [bar(END), "CAREER"]],
  coldOpen: { from: bar(C0 + 3 * CLEN + HR_AB.contact) - 0.02, length: BAR },
  cuts: [
    inningCut("rookie", 0, ["PITCHER. AND HITTER.", "2018: ROOKIE OF THE YEAR."], "SHOHEI OHTANI · ANGELS · SHO-TIME BASEBALL"),
    inningCut("showtime", 1, ["46 HOME RUNS. 156 K.", "ONE SEASON. ONE MAN."], "SHOHEI OHTANI · 2021 · UNANIMOUS MVP"),
    inningCut("trout", 2, ["FULL COUNT. MIKE TROUT.", "THE LAST OUT OF THE WBC."], "SHOHEI OHTANI · JAPAN 3–2 USA · 2023"),
    inningCut("fiftyfifty", 3, ["54 HOMERS. 59 STEALS.", "THE FIRST 50/50 EVER."], "SHOHEI OHTANI · DODGERS · 2024"),
    inningCut("fiftyfive", 4, ["55 HOME RUNS.", "AND BACK ON THE MOUND."], "SHOHEI OHTANI · DODGERS · 2025"),
    inningCut("era", 5, ["1.79 ERA. 30 HOME RUNS.", "SAME MAN. SAME SEASON."], "SHOHEI OHTANI · DODGERS · 2026"),
  ],
  draw,
  score,
};
