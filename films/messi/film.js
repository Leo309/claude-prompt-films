// MESSI — TOO SMALL. A 90-second code-rendered film, EP03 of the 90 SECONDS series.
// Fan-made; not affiliated with Lionel Messi, the AFA or any club. Every number is sourced in facts.md.
// Timing grid: 112 BPM electrotango, so a beat is 0.536 s and a bar 2.143 s. The timeline is written in bars: bar(21) = 45 s.
// The spine is growth. A height chart opens and closes the film; in between, his goals grow like the rings of a tree,
// one ring per season (ring area ∝ goals), wrapped in a bark of 125 for Argentina.
import {
  clamp, lerp, prog, ease, hash, mix, text, typed, slam, scaled, grain, vignette, shake, flash,
  midi, makeMixer, kick, snare, clap, hat, bass808, pad, pluck, bell, riser, impact, crowd,
  lead, brass, piano, strings, chip, conga, snap, poof, chant, duck, drawSprite, football,
  bandoneon, marimba, bombo, chicharra, scribble,
} from "../../render/kit.js";
import {
  KITS, KID_UP, KID_DOWN, RUN_A, RUN_B, CHIP, KEEPER, DINHO, RIDE, HOLD_SHIRT, HOLD_SHIRT_HANDS, LIFT,
  BACK10, STAND, POINT, TROPHY, CUP, TROPHY_PAL,
} from "./sprites.js";

const W = 1920, H = 1080;
const BPM = 112, BEAT = 60 / BPM, BAR = BEAT * 4;
const bar = (n) => n * BAR;
const DURATION = bar(42); // 90 s: the 90 SECONDS series

const C = {
  ink: "#0B0B0D", ink2: "#141416", bone: "#EFE9DE", ash: "#8C877F", graphite: "#2E2C29",
  celeste: "#75AADB", gold: "#E6B450", garnet: "#A5174F", blau: "#1D4FA0", navy: "#2B4591", pink: "#F29AC0",
  pen: "#2A45A8",
};
const DISPLAY = "Anton", MONO = '"IBM Plex Mono"';
const disp = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: DISPLAY, size: 120, color: C.bone, ...o });
const mono = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: MONO, size: 18, weight: 500, color: C.bone, tracking: 3, ...o });
const fmt = (n) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------- data (see facts.md)

// Club goals per season, all competitions (Wikipedia career statistics, match played 27 Sep 2026).
const SEASONS = [
  ["2004–05", "barca", 1], ["2005–06", "barca", 8], ["2006–07", "barca", 17], ["2007–08", "barca", 16],
  ["2008–09", "barca", 38], ["2009–10", "barca", 47], ["2010–11", "barca", 53], ["2011–12", "barca", 73],
  ["2012–13", "barca", 60], ["2013–14", "barca", 41], ["2014–15", "barca", 58], ["2015–16", "barca", 41],
  ["2016–17", "barca", 54], ["2017–18", "barca", 45], ["2018–19", "barca", 51], ["2019–20", "barca", 31],
  ["2020–21", "barca", 38],
  ["2021–22", "psg", 11], ["2022–23", "psg", 21],
  ["2023", "miami", 11], ["2024", "miami", 23], ["2025", "miami", 43], ["2026", "miami", 25],
];
const ARGENTINA = 125;
const CLUB_GOALS = SEASONS.reduce((s, r) => s + r[2], 0);
const TOTAL = CLUB_GOALS + ARGENTINA;
console.assert(CLUB_GOALS === 806 && TOTAL === 931, `club ${CLUB_GOALS}, total ${TOTAL}`);
const CUM = [];
{
  let s = 0;
  for (const r of SEASONS) {
    CUM.push(s);
    s += r[2];
  }
}

const CLUBS = {
  barca: { name: "FC BARCELONA", color: "#D0386E", first: 0 },
  psg: { name: "PARIS SAINT-GERMAIN", color: "#7D9BF0", first: 17 },
  miami: { name: "INTER MIAMI", color: C.pink, first: 19 },
};
const CALLOUTS = {
  0: "GOAL NO. 1 · AGE 17",
  4: "THE NO. 10 SHIRT · FIRST TREBLE",
  5: "FIRST BALLON D'OR",
  7: "A EUROPEAN RECORD",
  8: "91 IN 2012 · MOST IN A CALENDAR YEAR",
  10: "MSN · A SECOND TREBLE",
  12: "GOAL NO. 500 · AT THE BERNABÉU",
  16: "672 · THE MOST EVER FOR ONE CLUB",
  17: "AFTER 17 SEASONS AT BARÇA",
  18: "TWO LIGUE 1 TITLES",
  19: "LEAGUES CUP · MIAMI'S FIRST TROPHY",
  20: "MLS MVP",
  21: "MLS CUP · MVP AGAIN",
  22: "THIS SEASON, SO FAR",
};

// The 46 team trophies, stacked by team (Barcelona 34, PSG 3, Miami 3, Argentina 6 with the World Cup on top).
const TROPHIES = [...Array(34).fill("barca"), ...Array(3).fill("psg"), ...Array(3).fill("miami"), ...Array(6).fill("argentina")];
const TEAM = {
  barca: { color: C.garnet, label: "FC BARCELONA", count: 34 },
  psg: { color: C.navy, label: "PARIS SAINT-GERMAIN", count: 3 },
  miami: { color: C.pink, label: "INTER MIAMI", count: 3 },
  argentina: { color: C.celeste, label: "ARGENTINA", count: 6 },
};

const NAPKIN = [
  "En Barcelona, a 14 de diciembre del 2000",
  "[...] Carles Rexach, secretario técnico",
  "del FC Barcelona, se compromete bajo su",
  "responsabilidad y a pesar de algunas",
  "opiniones en contra a fichar al jugador",
  "Lionel Messi [...]",
];

// ---------------------------------------------------------------- timeline

// Rings: Barcelona one every 1.5 beats, then Paris and Miami one every 2 beats; the Argentina bark at bar 19.
const RING_T = SEASONS.map((_, i) => (i < 17 ? bar(9) + i * 1.5 * BEAT : i < 19 ? bar(15.75) + (i - 17) * 2 * BEAT : bar(16.75) + (i - 19) * 2 * BEAT));
const RING_DUR = SEASONS.map((_, i) => (i < 17 ? 1.2 : 1.6) * BEAT);
const BARK_T = bar(19), BARK_END = bar(19.5), TOTAL_T = bar(19.5);
const ringIndex = (t) => {
  let i = 0;
  while (i + 1 < SEASONS.length && t >= RING_T[i + 1]) i++;
  return i;
};

const NAP_T0 = bar(4) + 0.5, NAP_CPS = 80;
const NAP_END = NAP_T0 + NAPKIN.reduce((s, l) => s + l.length, 0) / NAP_CPS;

const FINALS = [
  [22, "2014", "WORLD CUP FINAL", "LOST 1–0, AFTER EXTRA TIME", "wc"],
  [22.75, "2015", "COPA AMÉRICA FINAL", "LOST ON PENALTIES", "copa"],
  [23.5, "2016", "COPA AMÉRICA FINAL", "LOST ON PENALTIES", "copa"],
];

const RAPID = [
  [34, "931", "GOALS"], [34.25, "420+", "ASSISTS · THE MOST EVER"], [34.5, "46", "TROPHIES · THE MOST EVER"],
  [34.75, "8", "BALLON D'OR"], [35, "672", "FOR BARCELONA"], [35.125, "474", "IN LA LIGA"], [35.25, "91", "IN ONE YEAR"],
  [35.375, "73", "IN ONE SEASON"], [35.5, "125", "FOR ARGENTINA"], [35.625, "21", "AT WORLD CUPS"], [35.75, "10", ""],
];

const DROP0 = bar(36.4), DROP1 = bar(38.2);
const cupT = (k) => DROP0 + (DROP1 - DROP0) * Math.pow(k / TROPHIES.length, 0.85);

const IMPACTS = [
  { t: bar(3), shake: 14, flash: 0.2, color: C.celeste, hit: 1.0 },
  { t: bar(4), shake: 6, hit: 0.4 },
  { t: bar(5.5), shake: 8, hit: 0.5 },
  { t: bar(6.25), shake: 8, flash: 0.08, color: C.gold, hit: 0.5 },
  { t: bar(8), shake: 16, flash: 0.3, hit: 1.1 },
  { t: bar(9), shake: 6, hit: 0.5 },
  { t: RING_T[16], shake: 8, flash: 0.08, color: C.garnet, hit: 0.6 },
  { t: bar(19), shake: 8, hit: 0.6 },
  { t: TOTAL_T, shake: 14, flash: 0.15, color: C.celeste, hit: 1.0 },
  { t: bar(20.5), shake: 18, flash: 0.2, hit: 1.1 },
  { t: bar(21.25), shake: 8, hit: 0.6 },
  { t: bar(22), shake: 5, hit: 0.35 },
  { t: bar(22.75), shake: 5, hit: 0.35 },
  { t: bar(23.5), shake: 5, hit: 0.35 },
  { t: bar(24.5), shake: 10, flash: 0.12, color: C.celeste, hit: 0.8 },
  { t: bar(25), shake: 12, hit: 0.8 },
  { t: bar(26), shake: 14, hit: 0.8 },
  { t: bar(26.5), shake: 10, hit: 0.6 },
  { t: bar(28), shake: 26, flash: 0.4, color: C.gold, hit: 1.3 },
  { t: bar(30), shake: 10, hit: 0.7 },
  { t: bar(31.75), shake: 6, hit: 0.4 },
  { t: bar(33.25), shake: 10, flash: 0.1, color: C.celeste, hit: 0.8 },
  { t: bar(34), shake: 10, hit: 0.7 },
  { t: bar(36), shake: 8, hit: 0.6 },
  { t: bar(38.5), shake: 22, flash: 0.3, color: C.gold, hit: 1.2 },
  { t: bar(39), shake: 14, hit: 0.9 },
  { t: bar(39.5), shake: 18, flash: 0.3, color: C.celeste, hit: 1.3 },
];

// ---------------------------------------------------------------- helpers

// Top-left corner of grid cell (gx, gy) of a 24×32 figure drawn at (cx, footY) with pixel size px.
const cell = (cx, footY, px, gx, gy) => [cx - 12 * px + gx * px, footY - 32 * px + gy * px];

function drawFigure(ctx, rows, kit, cx, footY, px, { rot = 0, flipX = false, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  const w = rows[0].length * px, h = rows.length * px;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, footY - h / 2);
  ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  drawSprite(ctx, rows, KITS[kit], -w / 2, -h / 2, px);
  ctx.restore();
}

function icon(ctx, rows, pal, x, y, px, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  drawSprite(ctx, rows, pal, x, y, px);
  ctx.restore();
}

function hairline(ctx, x1, y1, x2, y2, color, alpha, width = 1.5) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function star(ctx, x, y, r, color, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.42 : r;
    k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Outline of a trophy: "wc" (a globe held up on a twisting stem) or "copa" (a cup with two handles). Stylised.
function trophyOutline(ctx, x, y, s, kind, color, alpha = 1, crack = 0, fill = false) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  if (kind === "wc") {
    ctx.moveTo(34, -70);
    ctx.arc(0, -70, 34, 0, Math.PI * 2);
    ctx.moveTo(-24, -46);
    ctx.bezierCurveTo(-44, -10, -8, 10, -22, 40);
    ctx.moveTo(24, -46);
    ctx.bezierCurveTo(44, -10, 8, 10, 22, 40);
    ctx.moveTo(-30, 40);
    ctx.lineTo(30, 40);
    ctx.lineTo(26, 64);
    ctx.lineTo(-26, 64);
    ctx.closePath();
  } else {
    ctx.moveTo(-40, -84);
    ctx.quadraticCurveTo(-44, -14, -10, 8);
    ctx.lineTo(10, 8);
    ctx.quadraticCurveTo(44, -14, 40, -84);
    ctx.closePath();
    ctx.moveTo(-42, -64);
    ctx.bezierCurveTo(-80, -64, -72, -12, -28, -8);
    ctx.moveTo(42, -64);
    ctx.bezierCurveTo(80, -64, 72, -12, 28, -8);
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 30);
    ctx.moveTo(-30, 30);
    ctx.lineTo(30, 30);
    ctx.lineTo(34, 64);
    ctx.lineTo(-34, 64);
    ctx.closePath();
  }
  if (fill) {
    ctx.fillStyle = "rgba(230,180,80,0.2)";
    ctx.fill();
  }
  ctx.stroke();
  if (crack > 0) {
    const pts = [[4, -110], [-10, -82], [12, -58], [-8, -30], [10, -4], [-6, 22], [6, 50], [-4, 66]];
    const n = Math.max(2, Math.ceil(pts.length * crack));
    ctx.beginPath();
    pts.slice(0, n).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the height chart (first and last scene)

const FLOOR = 900, PX_M = 205; // pixels per metre: the kid (px 9) stands 1.27 m, the man (px 12) 1.70 m
const CHART_X = 600;

function heightChart(ctx, x, alpha, top = 90) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = "#35271C";
  ctx.fillRect(x - 46, top, 46, FLOOR - top);
  ctx.fillStyle = "#46331F";
  ctx.fillRect(x - 46, top, 7, FLOOR - top);
  ctx.fillStyle = C.bone;
  for (let cm = 10; ; cm += 10) {
    const y = FLOOR - (cm / 100) * PX_M;
    if (y < top + 6) break;
    const long = cm % 50 === 0;
    ctx.globalAlpha = alpha * (long ? 0.65 : 0.3);
    ctx.fillRect(x - 46, y - 1, long ? 26 : 14, 2);
  }
  ctx.restore();
}

function pencilMark(ctx, x, y, u, label, alpha = 1) {
  if (u <= 0 || alpha <= 0) return;
  hairline(ctx, x - 56, y, x - 56 + 112 * ease.outCubic(u), y, C.bone, 0.95 * alpha, 3);
  if (label) mono(ctx, label, x - 70, y + 7, { size: 20, align: "right", alpha: alpha * clamp(u * 3 - 2) });
}

// ---------------------------------------------------------------- bars 0–4 · Rosario, age 10

function sceneOpen(ctx, t) {
  const out = 1 - prog(t, bar(3.85), bar(4));
  const cam = lerp(1, 1.05, ease.inOutCubic(prog(t, 0, bar(4))));
  scaled(ctx, 700, 760, cam, () => {
    const a = prog(t, 0, 0.4) * out;
    hairline(ctx, 380, FLOOR, 1000, FLOOR, C.bone, 0.3 * a, 2);
    heightChart(ctx, CHART_X, a);
    // keepy-uppies: the ball leaves his foot on every beat
    const px = 9, cx = 790;
    const ph = ((((t - 0.2) / BEAT) % 1) + 1) % 1;
    const up = t > 0.2 && (ph < 0.2 || ph > 0.92);
    drawFigure(ctx, up ? KID_UP : KID_DOWN, "kid", cx, FLOOR + px, px, { alpha: a });
    football(ctx, cx + 6 * px, FLOOR - 7 * px - Math.sin(Math.PI * ph) * 150, 14, t * 6);
    pencilMark(ctx, CHART_X, FLOOR - 29 * px, prog(t, bar(1), bar(1.3)), "AGE 10", out);
  });
  mono(ctx, typed("ROSARIO, ARGENTINA", t, 0.15, 30), 1060, 300, { size: 22, color: C.ash, tracking: 6, alpha: out });
  const s = slam(t, bar(0.75), 0.3, 1.4);
  scaled(ctx, 1060, 420, s.s, () => disp(ctx, "AGE 10.", 1056, 460, { size: 150, alpha: s.a * out, tracking: 3 }));
  mono(ctx, "DIAGNOSIS", 1064, 540, { size: 16, color: C.ash, tracking: 6, alpha: prog(t, bar(1.5), bar(1.6)) * out });
  mono(ctx, typed("GROWTH HORMONE DEFICIENCY.", t, bar(1.55), 32), 1064, 582, { size: 28, tracking: 3, alpha: out });
  mono(ctx, typed("THE TREATMENT: 1,000 PESOS A MONTH.", t, bar(2.2), 36), 1064, 628, { size: 20, color: C.ash, alpha: out });
  const z = slam(t, bar(3), 0.35, 1.6);
  scaled(ctx, 1060, 780, z.s, () => disp(ctx, "TOO SMALL.", 1054, 850, { size: 170, color: C.celeste, alpha: z.a * out, tracking: 4 }));
}

// ---------------------------------------------------------------- bars 4–7 · the napkin

function signature(ctx, x0, y0, w, seed, u) {
  const N = 48, n = Math.floor(N * u);
  if (n < 2) return;
  ctx.beginPath();
  for (let k = 0; k <= n; k++) {
    const p = k / N;
    const x = x0 + p * w + Math.sin(p * 22 + seed) * 10;
    const y = y0 + Math.sin(p * 13 + seed * 2) * 18 * (0.4 + hash(k >> 3, seed) * 0.8) - p * 14;
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = C.pen;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function napkin(ctx, t, alpha) {
  if (alpha <= 0) return;
  const u = ease.outCubic(prog(t, bar(4), bar(4) + 0.5));
  const S = 690;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(760, lerp(1320, 540, u));
  ctx.rotate(lerp(0.2, -0.035, u));
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-S / 2 + 16, -S / 2 + 20, S, S);
  const g = ctx.createLinearGradient(-S / 2, -S / 2, S / 2, S / 2);
  g.addColorStop(0, "#F7F4EC");
  g.addColorStop(1, "#E4DECF");
  ctx.fillStyle = g;
  ctx.fillRect(-S / 2, -S / 2, S, S);
  // the embossed border, and the fold
  ctx.fillStyle = "rgba(110,100,85,0.22)";
  const inset = S / 2 - 30;
  for (let k = 0; k <= 44; k++) {
    const v = -inset + (k / 44) * inset * 2;
    for (const [x, y] of [[v, -inset], [v, inset], [-inset, v], [inset, v]]) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(110,100,85,0.10)";
  ctx.fillRect(-1, -S / 2, 2, S);
  // blue ballpoint, line by line
  ctx.font = 'italic 500 23px "IBM Plex Mono"';
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.pen;
  let left = Math.max(0, Math.floor((t - NAP_T0) * NAP_CPS));
  NAPKIN.forEach((line, i) => {
    const shown = line.slice(0, left);
    left = Math.max(0, left - line.length);
    if (!shown) return;
    ctx.save();
    ctx.translate(-S / 2 + 56, -S / 2 + 120 + i * 56);
    ctx.rotate(-0.012 + hash(i, 4) * 0.02);
    ctx.fillText(shown, 0, 0);
    if (i === NAPKIN.length - 1 && t > NAP_END) {
      const w = ctx.measureText("Lionel Messi").width;
      const uu = ease.outCubic(prog(t, NAP_END, NAP_END + 0.3));
      ctx.strokeStyle = C.pen;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(w * uu, 6);
      ctx.stroke();
    }
    ctx.restore();
  });
  [[-270, 0], [-50, 1], [170, 2]].forEach(([x, k]) => signature(ctx, x, S / 2 - 110, 150, 3 + k * 2.3, prog(t, NAP_END + 0.15 + k * 0.25, NAP_END + 0.45 + k * 0.25)));
  ctx.restore();
}

function sceneNapkin(ctx, t) {
  const out = 1 - prog(t, bar(6.85), bar(7));
  napkin(ctx, t, out);
  mono(ctx, typed("BARCELONA · 14 DECEMBER 2000", t, bar(4.3), 30), 1250, 290, { size: 20, tracking: 4, alpha: out });
  mono(ctx, typed("A CONTRACT, WRITTEN ON A PAPER NAPKIN.", t, bar(4.7), 36), 1250, 326, { size: 18, color: C.ash, alpha: out });
  const s = slam(t, bar(5.5), 0.3, 1.4);
  scaled(ctx, 1250, 470, s.s, () => disp(ctx, "AGE 13.", 1246, 520, { size: 150, alpha: s.a * out, tracking: 3 }));
  mono(ctx, "SOLD AT AUCTION IN 2024 FOR", 1252, 620, { size: 18, color: C.ash, tracking: 4, alpha: prog(t, bar(6.1), bar(6.2)) * out });
  const g = slam(t, bar(6.25), 0.3, 1.4);
  scaled(ctx, 1250, 690, g.s, () => disp(ctx, "£762,400", 1246, 740, { size: 110, color: C.gold, alpha: g.a * out, tracking: 3 }));
}

// ---------------------------------------------------------------- bars 7–9 · goal no. 1, and a ride

const GROUND = 840, GOAL_X = 1690;
function sceneFirstGoal(ctx, t) {
  if (t < bar(8.25)) {
    const out = 1 - prog(t, bar(8.1), bar(8.25));
    const a = prog(t, bar(7), bar(7) + 0.2) * out;
    ctx.fillStyle = C.bone;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 70; c++) {
        const hit = t >= bar(8) ? ease.outBack(prog(t, bar(8) + 0.05 + Math.abs(c - 35) * 0.01, bar(8) + 0.35 + Math.abs(c - 35) * 0.01)) : 0;
        ctx.fillStyle = [C.bone, C.garnet, C.blau][(r * 70 + c) % 3];
        ctx.globalAlpha = a * (0.16 + 0.3 * hit) * (0.55 + 0.45 * hash(r * 70 + c, 9));
        ctx.fillRect(40 + c * 27 + (r % 2) * 13, 120 + r * 30 - hit * 10, 8, 12);
      }
    }
    ctx.globalAlpha = 1;
    hairline(ctx, 60, GROUND, 1860, GROUND, C.bone, 0.3 * a, 2);
    // the goal, side on: post, crossbar, net
    const bulge = t >= bar(8) ? Math.exp(-(t - bar(8)) * 5) * 26 : 0;
    hairline(ctx, GOAL_X, GROUND, GOAL_X, GROUND - 200, C.bone, 0.85 * a, 6);
    hairline(ctx, GOAL_X, GROUND - 200, GOAL_X + 120, GROUND - 200, C.bone, 0.6 * a, 4);
    for (let k = 0; k <= 7; k++) {
      const y = GROUND - 200 + k * 28;
      hairline(ctx, GOAL_X, y, GOAL_X + 120 + bulge * Math.sin((k / 7) * Math.PI), y + 12, C.bone, 0.28 * a, 1);
    }
    // the keeper comes off his line, then jumps too late
    const kx = lerp(1560, 1450, ease.outCubic(prog(t, bar(7.3), bar(7.8))));
    const kj = Math.sin(clamp((t - bar(7.85)) / 0.5) * Math.PI) * 60;
    drawFigure(ctx, KEEPER, "keeper", kx, GROUND + 8 - kj, 8, { alpha: a, flipX: true });
    // he runs onto Ronaldinho's pass, then chips it
    const mx = lerp(640, 1180, prog(t, bar(7), bar(7.8)));
    const stride = Math.floor(t / (BEAT / 4)) % 2;
    drawFigure(ctx, t < bar(7.8) ? (stride ? RUN_A : RUN_B) : CHIP, "barca", mx, GROUND + 8, 8, { alpha: a });
    let bx, by;
    if (t < bar(7.8)) {
      const u = prog(t, bar(7.2), bar(7.8));
      bx = lerp(-80, 1200, u);
      by = lerp(520, GROUND - 14, u) - Math.sin(u * Math.PI) * 240;
    } else {
      const u = prog(t, bar(7.8), bar(8));
      bx = lerp(1200, GOAL_X + 50, u);
      by = lerp(GROUND - 14, GROUND - 60, u) - Math.sin(u * Math.PI) * 330;
    }
    if (t >= bar(7.2)) football(ctx, bx, by, 13, t * 10);
    mono(ctx, typed("1 MAY 2005 · CAMP NOU · 91ST MINUTE", t, bar(7.05), 40), 140, 940, { size: 22, tracking: 5, alpha: out });
    mono(ctx, typed("THE PASS: RONALDINHO.", t, bar(7.4), 40), 140, 978, { size: 20, color: C.ash, tracking: 4, alpha: out });
    const s = slam(t, bar(8), 0.3, 1.5);
    scaled(ctx, 140, 250, s.s, () => disp(ctx, "GOAL NO. 1.", 136, 300, { size: 150, alpha: s.a * out, tracking: 3 }));
    return;
  }
  // Ronaldinho carries him off on his back
  const a = prog(t, bar(8.25), bar(8.4)) * (1 - prog(t, bar(8.85), bar(9)));
  const bob = Math.abs(Math.sin((t - bar(8.25)) * 7)) * 10;
  const cx = 1340, foot = 1000 - bob;
  drawFigure(ctx, RIDE, "barca", cx + 12, foot - 96, 12, { alpha: a });
  drawFigure(ctx, DINHO, "dinho", cx, foot, 12, { alpha: a });
  const s = slam(t, bar(8.25), 0.3, 1.4);
  scaled(ctx, 140, 300, s.s, () => disp(ctx, "ASSIST:", 136, 340, { size: 110, color: C.ash, alpha: s.a * a, tracking: 3 }));
  scaled(ctx, 140, 440, s.s, () => disp(ctx, "RONALDINHO.", 136, 480, { size: 130, alpha: s.a * a, tracking: 3 }));
  mono(ctx, typed("AGE 17. THE FIRST OF 931.", t, bar(8.45), 40), 142, 560, { size: 24, color: C.celeste, tracking: 5, alpha: a });
}

// ---------------------------------------------------------------- bars 9–20 · 931 goals, ring by ring

const RC = { x: 1270, y: 545 };
const R0 = 14, R1 = 400;
const rOf = (g) => Math.sqrt(R0 * R0 + ((R1 * R1 - R0 * R0) * g) / TOTAL); // ring area ∝ goals
// Every ring shares the same gentle wobble, so no two boundaries ever cross, like real growth rings.
const wob = (a) => 1 + 0.018 * Math.sin(3 * a + 0.7) + 0.011 * Math.sin(5 * a + 2.1) + 0.006 * Math.sin(11 * a + 0.4);

function ringPath(ctx, r, spin, reverse = false) {
  const N = 150;
  for (let k = 0; k <= N; k++) {
    const i = reverse ? N - k : k;
    const a = (i / N) * Math.PI * 2;
    const rr = r * wob(a - spin);
    k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

function ringColor(i) {
  const club = SEASONS[i][1], k = i - CLUBS[club].first;
  if (club === "barca") return k % 2 ? C.garnet : C.blau;
  if (club === "psg") return k % 2 ? "#1F3470" : C.navy;
  return k % 2 ? "#2A2A30" : C.pink;
}

// Returns how many goals are on the disk at time t.
function drawRings(ctx, t, cx, cy, { scale = 1, alpha = 1, spin = 0, all = false } = {}) {
  if (alpha <= 0) return 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  let grown = 0, edge = 0;
  const bounds = [];
  SEASONS.forEach(([, , goals], i) => {
    if (!all && t < RING_T[i]) return;
    const u = all ? 1 : ease.outCubic(prog(t, RING_T[i], RING_T[i] + RING_DUR[i]));
    const r0 = rOf(CUM[i]), r1 = lerp(r0, rOf(CUM[i] + goals), u);
    ctx.beginPath();
    ringPath(ctx, r1, spin);
    ringPath(ctx, r0, spin, true);
    ctx.fillStyle = ringColor(i);
    ctx.fill();
    if (r1 - r0 > 3) {
      // latewood: the darker outer band of each growth ring
      ctx.beginPath();
      ringPath(ctx, r1, spin);
      ringPath(ctx, r1 - (r1 - r0) * 0.3, spin, true);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fill();
    }
    grown += goals * u;
    bounds.push(r1);
    edge = u < 1 ? r1 : 0;
  });
  if (all || t >= BARK_T) {
    // the bark: Argentina's stripes wrapped around the trunk
    const u = all ? 1 : ease.outCubic(prog(t, BARK_T, BARK_END));
    const r0 = rOf(CLUB_GOALS), r1 = lerp(r0, rOf(TOTAL), u);
    ctx.save();
    ctx.beginPath();
    ringPath(ctx, r1, spin);
    ringPath(ctx, r0, spin, true);
    ctx.clip();
    for (let k = 0; k < 44; k++) {
      const a0 = (k / 44) * Math.PI * 2 + spin, a1 = ((k + 1) / 44) * Math.PI * 2 + spin;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R1 * 1.2, a0, a1);
      ctx.closePath();
      ctx.fillStyle = k % 2 ? C.celeste : C.bone;
      ctx.fill();
    }
    ctx.restore();
    grown += ARGENTINA * u;
    bounds.push(r1);
    if (u < 1) edge = r1;
  }
  // growth lines between the rings, and the pith at the centre (Rosario)
  ctx.strokeStyle = "rgba(11,11,13,0.6)";
  ctx.lineWidth = 1.6 / scale;
  for (const r of bounds) {
    ctx.beginPath();
    ringPath(ctx, r, spin);
    ctx.stroke();
  }
  ctx.fillStyle = C.bone;
  ctx.beginPath();
  ctx.arc(0, 0, R0, 0, Math.PI * 2);
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = C.bone;
    ctx.lineWidth = 3 / scale;
    ctx.beginPath();
    ringPath(ctx, edge, spin);
    ctx.stroke();
  }
  ctx.restore();
  return grown;
}

function sceneRings(ctx, t) {
  const inA = prog(t, bar(9) - 0.2, bar(9) + 0.3);
  const out = 1 - prog(t, bar(19.85), bar(20));
  const a = inA * out;
  const spin = (t - bar(9)) * 0.04;
  const grown = drawRings(ctx, t, RC.x, RC.y, { alpha: a, spin });
  const done = t >= TOTAL_T;
  mono(ctx, "GOALS · CLUB + COUNTRY", 144, 230, { size: 15, color: C.ash, tracking: 5, alpha: a });
  const ts = slam(t, TOTAL_T, 0.3, 1.4);
  scaled(ctx, 140, 340, done ? ts.s : 1, () => disp(ctx, fmt(grown), 140, 400, { size: 170, alpha: a, tracking: 2, color: done ? C.celeste : C.bone }));

  // the current season (or Argentina, or the total)
  let label, name, color, goals, callout, t0, r;
  if (t < BARK_T) {
    const i = ringIndex(t), club = SEASONS[i][1];
    [label, , goals] = SEASONS[i];
    [name, color, callout, t0] = [CLUBS[club].name, CLUBS[club].color, CALLOUTS[i], RING_T[i]];
    r = (rOf(CUM[i]) + rOf(CUM[i] + goals)) / 2;
  } else if (!done) {
    [label, name, color, goals, callout, t0] = ["2005–2026", "ARGENTINA", C.celeste, ARGENTINA, "HIS COUNTRY'S ALL-TIME TOP SCORER", BARK_T];
    r = (rOf(CLUB_GOALS) + rOf(TOTAL)) / 2;
  } else {
    [label, name, color, goals, callout, t0] = ["CAREER", null, C.bone, null, "AND 420+ ASSISTS: THE MOST IN HISTORY", TOTAL_T];
  }
  const s = slam(t, t0, 0.22, 1.25);
  mono(ctx, label, 144, 540, { size: 22, color: C.ash, tracking: 5, alpha: a });
  if (name) scaled(ctx, 140, 600, s.s, () => disp(ctx, name, 140, 620, { size: 64, color, alpha: a * s.a, tracking: 2 }));
  if (goals != null) {
    scaled(ctx, 140, 720, s.s, () => disp(ctx, String(goals), 140, 800, { size: 150, alpha: a * s.a, tracking: 2 }));
    disp(ctx, "GOALS", 144 + String(goals).length * 74 + 20, 800, { size: 48, color: C.ash, alpha: a * s.a, tracking: 3 });
  }
  if (callout) mono(ctx, typed(callout, t, t0 + 0.1, 60), 144, 860, { size: 18, color: C.gold, tracking: 3, alpha: a });
  // a leader line from the label to its ring
  if (r) {
    const x2 = RC.x - r * wob(Math.PI - spin);
    hairline(ctx, 560, 770, x2 - 14, RC.y, C.bone, 0.45 * a, 1.5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = C.bone;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x2, RC.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- bars 20–22 · the Bernabéu, 2017

function heldShirt(ctx, cx, foot, px, alpha) {
  const [x0, y0] = cell(cx, foot, px, 3, 9);
  const w = 19 * px, h = 13 * px;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = k % 2 ? C.blau : C.garnet;
    ctx.fillRect(x0 + (k * w) / 6, y0, w / 6 + 1, h);
  }
  text(ctx, "MESSI", x0 + w / 2, y0 + 3 * px, { family: DISPLAY, size: 2.4 * px, color: "#F2C14E", align: "center", tracking: 3 });
  text(ctx, "10", x0 + w / 2, y0 + 11 * px, { family: DISPLAY, size: 7.5 * px, color: "#F2C14E", align: "center" });
  ctx.fillStyle = KITS.shirtless.s;
  for (const [hx, hy] of HOLD_SHIRT_HANDS) {
    const [x, y] = cell(cx, foot, px, hx, hy);
    ctx.fillRect(x - px * 0.5, y - px * 0.5, px * 2, px * 2);
  }
  ctx.restore();
}

function sceneBernabeu(ctx, t) {
  const out = 1 - prog(t, bar(21.85), bar(22));
  const goal = bar(20.5);
  // the home end: a wall of white, then very quiet
  const sa = prog(t, bar(20), bar(20.2)) * out;
  ctx.fillStyle = C.bone;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 70; c++) {
      ctx.globalAlpha = sa * 0.26 * (0.55 + 0.45 * hash(r * 70 + c, 8)) * (t >= goal ? 0.6 : 1);
      ctx.fillRect(40 + c * 27 + (r % 2) * 13, 90 + r * 30, 8, 12);
    }
  }
  ctx.globalAlpha = 1;
  hairline(ctx, 60, 930, 1860, 930, C.bone, 0.3 * out, 2);
  mono(ctx, typed("23 APRIL 2017 · SANTIAGO BERNABÉU", t, bar(20.05), 40), 140, 400, { size: 22, tracking: 5, alpha: out });
  const sc = slam(t, goal, 0.3, 1.4);
  scaled(ctx, 140, 520, t >= goal ? sc.s : 1, () => disp(ctx, t < goal ? "2–2" : "2–3", 136, 600, { size: 200, alpha: out * prog(t, bar(20.1), bar(20.2)), tracking: 4 }));
  mono(ctx, "REAL MADRID – BARCELONA · 92'", 144, 650, { size: 20, color: C.ash, tracking: 4, alpha: out * prog(t, bar(20.1), bar(20.2)) });
  mono(ctx, typed("HIS 500TH GOAL FOR BARCELONA.", t, goal + 0.1, 40), 144, 700, { size: 22, color: C.gold, tracking: 4, alpha: out });
  if (t >= goal + 0.2) {
    const u = ease.outBack(prog(t, goal + 0.2, goal + 0.6));
    const cx = 1330, foot = 930 + 12 + (1 - u) * 420;
    drawFigure(ctx, HOLD_SHIRT, "shirtless", cx, foot, 12, { alpha: out });
    heldShirt(ctx, cx, foot, 12, out);
  }
  const s = slam(t, bar(21.25), 0.3, 1.5);
  scaled(ctx, 140, 820, s.s, () => disp(ctx, "THE SHIRT.", 136, 870, { size: 130, color: C.gold, alpha: s.a * out, tracking: 3 }));
}

// ---------------------------------------------------------------- bars 22–25 · three finals, lost

function sceneFinals(ctx, t) {
  if (t < bar(24)) {
    const out = 1 - prog(t, bar(23.9), bar(24));
    mono(ctx, typed("ARGENTINA · THREE FINALS IN THREE YEARS", t, bar(22) + 0.05, 45), 960, 190, { size: 22, align: "center", tracking: 6, color: C.ash, alpha: out });
    FINALS.forEach(([b, year, what, result, kind], i) => {
      const t0 = bar(b);
      if (t < t0) return;
      const x = 480 + i * 480;
      const s = slam(t, t0, 0.25, 1.3);
      const broken = prog(t, t0 + 0.45, t0 + 0.75);
      scaled(ctx, x, 470, s.s, () => trophyOutline(ctx, x, 470, 1.5, kind, mix(C.gold, C.graphite, broken), s.a * out, broken));
      disp(ctx, year, x, 700, { size: 96, align: "center", alpha: s.a * out, color: broken > 0.5 ? C.ash : C.bone });
      mono(ctx, what, x, 750, { size: 18, align: "center", color: C.ash, alpha: s.a * out });
      mono(ctx, typed(result, t, t0 + 0.3, 40), x, 790, { size: 18, align: "center", alpha: out });
    });
    return;
  }
  // he quit; he came back
  const back = t >= bar(24.5);
  const fade = 1 - prog(t, bar(24.9), bar(25));
  FINALS.forEach(([, , , , kind], i) => trophyOutline(ctx, 480 + i * 480, 470, 1.5, kind, C.graphite, 0.35 * fade, 1));
  if (!back) {
    const s = slam(t, bar(24), 0.3, 1.2);
    scaled(ctx, 960, 560, s.s, () => disp(ctx, "HE QUIT.", 960, 640, { size: 260, align: "center", color: C.ash, alpha: s.a, tracking: 8 }));
    mono(ctx, typed("JUNE 2016. AGE 29.", t, bar(24.1), 30), 960, 730, { size: 22, align: "center", tracking: 6, color: C.ash });
  } else {
    const s = slam(t, bar(24.5), 0.3, 1.5);
    scaled(ctx, 960, 560, s.s, () => disp(ctx, "HE CAME BACK.", 960, 640, { size: 230, align: "center", color: C.celeste, alpha: s.a * fade, tracking: 8 }));
  }
}

// ---------------------------------------------------------------- bars 25–27 · 2021, and "¿qué mirás, bobo?"

function sceneCopa21(ctx, t) {
  const out = 1 - prog(t, bar(25.9), bar(26));
  const s = slam(t, bar(25), 0.3, 1.5);
  scaled(ctx, 140, 440, s.s, () => disp(ctx, "2021", 136, 560, { size: 300, color: C.celeste, alpha: s.a * out, tracking: 4 }));
  mono(ctx, typed("COPA AMÉRICA · MARACANÃ · ARGENTINA 1–0 BRAZIL", t, bar(25.15), 50), 146, 640, { size: 22, tracking: 4, alpha: out });
  mono(ctx, typed("28 YEARS WITHOUT A TROPHY. OVER.", t, bar(25.5), 40), 146, 690, { size: 22, color: C.gold, tracking: 4, alpha: out });
  const c = slam(t, bar(25.25), 0.3, 1.4);
  scaled(ctx, 1420, 520, c.s, () => trophyOutline(ctx, 1420, 520, 2.2, "copa", C.gold, c.a * out, 0, true));
}

function sceneBobo(ctx, t) {
  const out = 1 - prog(t, bar(26.9), bar(27));
  const la = prog(t, bar(26), bar(26.1)) * out;
  // a TV interview: the lower third, and a microphone
  ctx.fillStyle = C.celeste;
  ctx.globalAlpha = la;
  ctx.fillRect(140, 830, 1640 * ease.outCubic(prog(t, bar(26), bar(26.3))), 5);
  ctx.globalAlpha = 1;
  mono(ctx, "QATAR 2022 · QUARTER-FINAL · POST-MATCH INTERVIEW", 140, 880, { size: 20, color: C.ash, tracking: 4, alpha: la });
  ctx.save();
  ctx.globalAlpha = la;
  ctx.fillStyle = C.bone;
  ctx.beginPath();
  ctx.arc(1730, 240, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(1722, 270, 16, 110);
  ctx.restore();
  const a = slam(t, bar(26), 0.25, 1.6);
  scaled(ctx, 960, 400, a.s, () => disp(ctx, "¿QUÉ MIRÁS, BOBO?", 960, 470, { size: 180, align: "center", alpha: a.a * out, tracking: 3 }));
  const b = slam(t, bar(26.5), 0.25, 1.6);
  scaled(ctx, 960, 620, b.s, () => disp(ctx, "ANDÁ PA' ALLÁ.", 960, 690, { size: 140, align: "center", color: C.celeste, alpha: b.a * out, tracking: 3 }));
}

// ---------------------------------------------------------------- bars 27–31 · Lusail, and 2024

function rays(ctx, x, y, t, t0, alpha) {
  const u = prog(t, t0, t0 + 0.6);
  if (u <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.12);
  ctx.fillStyle = C.gold;
  for (let k = 0; k < 16; k++) {
    ctx.rotate(Math.PI / 8);
    ctx.globalAlpha = 0.07 * u * alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1500, -70);
    ctx.lineTo(1500, 70);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function confetti(ctx, t, t0, alpha) {
  if (t < t0 || alpha <= 0) return;
  const dt = t - t0;
  const cols = [C.celeste, C.bone, C.gold];
  for (let k = 0; k < 150; k++) {
    const x = hash(k, 1) * 1920 + Math.sin(dt * 2 + k) * 30;
    const y = -40 - hash(k, 3) * 700 + dt * (220 + hash(k, 2) * 260);
    if (y < -20 || y > 1100) continue;
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = cols[k % 3];
    ctx.fillRect(x, y, 9, 9);
  }
  ctx.globalAlpha = 1;
}

function sceneLusail(ctx, t) {
  const out = 1 - prog(t, bar(29.9), bar(30));
  const rise = ease.outCubic(prog(t, bar(27.25), bar(28)));
  const cx = 1330, px = 12, foot = 1000 + (1 - rise) * 560;
  const [, handY] = cell(cx, foot, px, 12, 1);
  rays(ctx, cx, handY - 70, t, bar(28), out);
  drawFigure(ctx, LIFT, "bisht", cx, foot, px, { alpha: out });
  icon(ctx, TROPHY, TROPHY_PAL, cx - 4 * px, handY - 11 * px, px, out);
  [28.5, 28.75, 29].forEach((b, i) => {
    const s = slam(t, bar(b), 0.25, 1.8);
    scaled(ctx, cx - 110 + i * 110, 150, s.s, () => star(ctx, cx - 110 + i * 110, 150, 36, C.gold, s.a * out));
  });
  confetti(ctx, t, bar(28), out);
  mono(ctx, typed("18 DECEMBER 2022 · LUSAIL", t, bar(27.05), 40), 140, 300, { size: 22, tracking: 5, alpha: out });
  mono(ctx, typed("3–3 AFTER EXTRA TIME. 4–2 ON PENALTIES.", t, bar(27.4), 45), 140, 340, { size: 20, color: C.ash, tracking: 3, alpha: out });
  const w = slam(t, bar(28), 0.3, 1.5), c = slam(t, bar(28.25), 0.3, 1.5);
  scaled(ctx, 140, 480, w.s, () => disp(ctx, "WORLD", 136, 560, { size: 170, alpha: w.a * out, tracking: 4 }));
  scaled(ctx, 140, 660, c.s, () => disp(ctx, "CHAMPION.", 136, 740, { size: 170, color: C.celeste, alpha: c.a * out, tracking: 4 }));
  mono(ctx, typed("GOLDEN BALL, AGAIN: THE FIRST PLAYER TO WIN IT TWICE.", t, bar(29.25), 50), 144, 810, { size: 18, color: C.gold, tracking: 3, alpha: out });
}

function sceneCopa24(ctx, t) {
  const out = 1 - prog(t, bar(30.9), bar(31));
  const s = slam(t, bar(30), 0.3, 1.5);
  scaled(ctx, 140, 440, s.s, () => disp(ctx, "2024", 136, 560, { size: 300, color: C.celeste, alpha: s.a * out, tracking: 4 }));
  mono(ctx, typed("COPA AMÉRICA. AGAIN.", t, bar(30.15), 40), 146, 640, { size: 24, tracking: 5, alpha: out });
  mono(ctx, typed("HIS THIRD MAJOR TITLE WITH ARGENTINA.", t, bar(30.4), 45), 146, 690, { size: 20, color: C.gold, tracking: 3, alpha: out });
  [["copa", "2021"], ["wc", "2022"], ["copa", "2024"]].forEach(([kind, y], i) => {
    const c = slam(t, bar(30) + i * BEAT * 0.5, 0.25, 1.4);
    const x = 1180 + i * 250;
    scaled(ctx, x, 520, c.s, () => trophyOutline(ctx, x, 520, 1.3, kind, C.gold, c.a * out, 0, true));
    mono(ctx, y, x, 680, { size: 22, align: "center", color: C.gold, tracking: 4, alpha: c.a * out });
  });
}

// ---------------------------------------------------------------- bars 31–34 · 2026, and goodbye

function sceneGoodbye(ctx, t) {
  const out = 1 - prog(t, bar(33.85), bar(34));
  // a spotlight on a small figure, No. 10, seen from behind
  const la = prog(t, bar(31), bar(31.5)) * out;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 980);
  g.addColorStop(0, "rgba(117,170,219,0)");
  g.addColorStop(1, "rgba(239,233,222,0.12)");
  ctx.globalAlpha = la;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(900, -20);
  ctx.lineTo(1020, -20);
  ctx.lineTo(1170, 985);
  ctx.lineTo(750, 985);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  hairline(ctx, 600, 985, 1320, 985, C.bone, 0.3 * la, 2);
  drawFigure(ctx, BACK10, "argentina", 960, 985 + 10, 10, { alpha: la });
  if (t < bar(32.5)) {
    const a = 1 - prog(t, bar(32.4), bar(32.5));
    const s = slam(t, bar(31), 0.3, 1.3);
    scaled(ctx, 960, 200, s.s, () => disp(ctx, "2026", 960, 250, { size: 170, align: "center", color: C.ash, alpha: s.a * a, tracking: 6 }));
    mono(ctx, typed("AGE 39 · 8 GOALS · 4 ASSISTS · SILVER BALL", t, bar(31.2), 45), 960, 310, { size: 20, align: "center", tracking: 4, alpha: a });
    const f = slam(t, bar(31.75), 0.3, 1.4);
    scaled(ctx, 960, 400, f.s, () => disp(ctx, "ONE MORE FINAL.", 960, 450, { size: 120, align: "center", color: C.celeste, alpha: f.a * a, tracking: 4 }));
    mono(ctx, typed("SPAIN 1–0, AFTER EXTRA TIME.", t, bar(32.1), 40), 960, 510, { size: 20, align: "center", color: C.ash, tracking: 4, alpha: a });
  } else if (t < bar(33.25)) {
    const a = 1 - prog(t, bar(33.15), bar(33.25));
    mono(ctx, typed("31 AUGUST 2026", t, bar(32.5), 30), 960, 280, { size: 22, align: "center", tracking: 6, color: C.ash, alpha: a });
    const s = slam(t, bar(32.6), 0.35, 1.2);
    scaled(ctx, 960, 380, s.s, () => disp(ctx, "HE SAID GOODBYE.", 960, 440, { size: 140, align: "center", alpha: s.a * a, tracking: 4 }));
  } else {
    mono(ctx, typed("6 OCTOBER 2026 · ESTADIO MONUMENTAL", t, bar(33.25), 40), 960, 280, { size: 22, align: "center", tracking: 6, color: C.ash, alpha: out });
    const s = slam(t, bar(33.3), 0.3, 1.5);
    scaled(ctx, 960, 380, s.s, () => disp(ctx, "ONE LAST TIME.", 960, 450, { size: 170, align: "center", color: C.celeste, alpha: s.a * out, tracking: 4 }));
  }
}

// ---------------------------------------------------------------- bars 34–36 · everything

function sceneEverything(ctx, t) {
  const u = prog(t, bar(34), bar(36));
  drawRings(ctx, t, 960, 540, { alpha: 0.16, spin: t * 0.5, all: true, scale: 1.3 });
  // speed lines, streaming out from the centre
  ctx.save();
  ctx.strokeStyle = C.bone;
  ctx.lineWidth = 2;
  for (let j = 0; j < 48; j++) {
    const ang = hash(j, 1) * Math.PI * 2, sp = 0.5 + hash(j, 2);
    const d = ((hash(j, 3) + (t - bar(34)) * sp * (0.5 + u * 2)) % 1) * 1300;
    ctx.globalAlpha = 0.1 + 0.2 * u;
    ctx.beginPath();
    ctx.moveTo(960 + Math.cos(ang) * d, 540 + Math.sin(ang) * d);
    ctx.lineTo(960 + Math.cos(ang) * (d + 40 + u * 220), 540 + Math.sin(ang) * (d + 40 + u * 220));
    ctx.stroke();
  }
  ctx.restore();
  const idx = RAPID.findLastIndex(([b0]) => t >= bar(b0));
  if (idx < 0) return;
  const [b0, big, label] = RAPID[idx];
  const s = slam(t, bar(b0), 0.14, 1.3);
  const last = idx === RAPID.length - 1;
  scaled(ctx, 960, 540, lerp(1, 1.08, u) * s.s, () => {
    disp(ctx, big, 960, last ? 800 : 650, { size: last ? 680 : 340, align: "center", color: last || idx % 2 ? C.celeste : C.bone, alpha: s.a, tracking: 2 });
    mono(ctx, label, 960, 730, { size: 26, align: "center", tracking: 10, alpha: s.a });
  });
}

// ---------------------------------------------------------------- bars 36–39 · 46 trophies. Too small?

const CUP_PX = 6, CUP_H = 9 * CUP_PX + 2, CUP_W = 10 * CUP_PX + 6; // two cups per row
function sceneTower(ctx, t) {
  const out = 1 - prog(t, bar(38.9), bar(39));
  // how many cups are up (fractional, so the camera glides instead of stepping)
  let nf = 0;
  TROPHIES.forEach((_, k) => (nf += ease.outCubic(prog(t, cupT(k), cupT(k) + 0.16))));
  const topY = FLOOR - CUP_H * (nf / 2);
  const z = Math.min(1, 720 / (975 - topY));
  const n = Math.round(nf);
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(960, 975);
  ctx.scale(z, z);
  ctx.translate(-960, -975);
  hairline(ctx, 400, FLOOR, 1500, FLOOR, C.bone, 0.3, 2 / z);
  heightChart(ctx, 760, 1, FLOOR - 470);
  pencilMark(ctx, 760, FLOOR - 1.7 * PX_M, prog(t, bar(36.05), bar(36.3)), "1.70 M");
  drawFigure(ctx, STAND, "argentina", 900, FLOOR + 12, 12);
  TROPHIES.forEach((team, k) => {
    const t0 = cupT(k);
    if (t < t0) return;
    const land = FLOOR - CUP_H * (Math.floor(k / 2) + 1);
    const y = lerp(land - 520, land, ease.outCubic(prog(t, t0, t0 + 0.16)));
    const wobX = (hash(k, 12) - 0.5) * 8;
    drawSprite(ctx, CUP, { ...TROPHY_PAL, c: TEAM[team].color }, 1030 + (k % 2) * CUP_W + wobX, y, CUP_PX);
  });
  ctx.restore();
  // labels: the running count and the team it came from
  const cur = n > 0 ? TROPHIES[Math.min(n, TROPHIES.length) - 1] : null;
  mono(ctx, "TEAM TROPHIES", 1440, 330, { size: 16, color: C.ash, tracking: 6, alpha: out * prog(t, bar(36.3), bar(36.4)) });
  disp(ctx, String(n), 1436, 560, { size: 240, alpha: out * prog(t, bar(36.3), bar(36.4)), tracking: 2, color: n === TROPHIES.length ? C.gold : C.bone });
  if (cur) mono(ctx, TEAM[cur].label, 1444, 610, { size: 20, color: TEAM[cur].color, tracking: 4, alpha: out });
  mono(ctx, typed("THE MOST IN THE HISTORY OF THE GAME.", t, bar(38.25), 45), 1444, 650, { size: 16, color: C.gold, tracking: 3, alpha: out });
  const s = slam(t, bar(38.5), 0.3, 1.7);
  scaled(ctx, 140, 230, s.s, () => disp(ctx, "TOO SMALL?", 136, 300, { size: 170, color: C.celeste, alpha: s.a * out, tracking: 4 }));
}

// ---------------------------------------------------------------- bars 39–42 · the name, and the sky

function sceneFinale(ctx, t) {
  const fade = 1 - prog(t, bar(41.7), bar(42));
  const end = prog(t, bar(40.75), bar(41));
  const nameA = (1 - 0.8 * end) * fade;
  const s1 = slam(t, bar(39), 0.3, 1.5), s2 = slam(t, bar(39.5), 0.3, 1.5);
  scaled(ctx, 820, 320, s1.s, () => disp(ctx, "LIONEL", 820, 400, { size: 220, align: "center", alpha: s1.a * nameA, tracking: 14 }));
  scaled(ctx, 820, 590, s2.s, () => disp(ctx, "MESSI", 820, 690, { size: 290, align: "center", color: C.celeste, alpha: s2.a * nameA, tracking: 14 }));
  // him, pointing to the sky, in a beam of light
  const pa = prog(t, bar(39.75), bar(40)) * fade;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 990);
  g.addColorStop(0, "rgba(239,233,222,0.16)");
  g.addColorStop(1, "rgba(117,170,219,0.02)");
  ctx.globalAlpha = pa;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(1550, -10);
  ctx.lineTo(1610, -10);
  ctx.lineTo(1720, 990);
  ctx.lineTo(1440, 990);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawFigure(ctx, POINT, "argentina", 1580, 990, 11, { alpha: pa });
  mono(ctx, typed("EVERY GOAL, HE POINTS TO THE SKY: FOR HIS GRANDMOTHER, CELIA.", t, bar(40), 55), 820, 790, { size: 18, align: "center", color: C.ash, tracking: 3, alpha: fade * (1 - end) });
  const ta = end * fade;
  [
    "A FAN-MADE TRIBUTE. NOT AFFILIATED WITH LIONEL MESSI, THE AFA OR ANY CLUB.",
    `STATS AS OF 28 SEPTEMBER 2026 · ${TOTAL} GOALS · WIKIPEDIA · ESPN`,
    "EVERY FRAME AND EVERY SOUND IN THIS FILM WAS GENERATED BY CODE.",
  ].forEach((line, i) => mono(ctx, line, 820, 790 + i * 38, { size: 15, align: "center", color: C.ash, tracking: 3, alpha: ta }));
}

// ---------------------------------------------------------------- frame

function draw(ctx, t) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, H);
  const sh = shake(t, IMPACTS);
  ctx.save();
  ctx.translate(sh.x, sh.y);
  if (t < bar(4)) sceneOpen(ctx, t);
  else if (t < bar(7)) sceneNapkin(ctx, t);
  else if (t < bar(9)) sceneFirstGoal(ctx, t);
  else if (t < bar(20)) sceneRings(ctx, t);
  else if (t < bar(22)) sceneBernabeu(ctx, t);
  else if (t < bar(25)) sceneFinals(ctx, t);
  else if (t < bar(26)) sceneCopa21(ctx, t);
  else if (t < bar(27)) sceneBobo(ctx, t);
  else if (t < bar(30)) sceneLusail(ctx, t);
  else if (t < bar(31)) sceneCopa24(ctx, t);
  else if (t < bar(34)) sceneGoodbye(ctx, t);
  else if (t < bar(36)) sceneEverything(ctx, t);
  else if (t < bar(39)) sceneTower(ctx, t);
  else sceneFinale(ctx, t);
  ctx.restore();
  flash(ctx, W, H, t, IMPACTS);
  vignette(ctx, W, H, 0.55);
  grain(ctx, W, H, t, 0.1);
}

// ---------------------------------------------------------------- score (synthesized, A minor, 112 BPM electrotango)
// 1. Career melody: each season's goals become a note, played the moment its ring grows, in the sound of that city:
//    a Catalan flabiol (pipe) over a tamborí in Barcelona, a musette accordion in Paris, a marimba over a dembow in Miami.
// 2. Argentina is the bandoneón: the napkin, the lament for three lost finals, the goodbye. The bark of 125 is a bandoneón run.
// 3. The "10" motif: A3, then a leap to the tenth (C5), then home an octave higher (B4 → A4). He grew. It returns in every chapter.
// Under it a tango groove: tresillo kick and bass (3+3+2), marcato piano, a chicharra scratch. Plus Argentine bombos and a
// synthesized crowd chanting "ME-SSI" (formant-filtered voices, not a recording).

const CH = {
  Am: { notes: [57, 60, 64], root: 45 }, Dm: { notes: [57, 62, 65], root: 50 }, E7: { notes: [56, 59, 62, 64], root: 40 },
  F: { notes: [57, 60, 65], root: 41 },
};
const PROG = [CH.Am, CH.Dm, CH.E7, CH.Am, CH.F, CH.Dm, CH.E7, CH.Am];
const chordAt = (t) => PROG[Math.floor(t / BAR + 1e-6) % PROG.length];
const HARM = [0, 2, 3, 5, 7, 8, 11]; // A harmonic minor
const scaleNote = (base, deg) => base + 12 * Math.floor(deg / 7) + HARM[((deg % 7) + 7) % 7];
// 1 goal → A4 … 73 goals → up an octave and a half
const seasonNote = (goals) => scaleNote(69, Math.round(((goals - 1) / 72) * 10));
const MOTIF = [[0, 57, 1], [1, 72, 0.75], [1.75, 71, 0.25], [2, 69, 2]];
const motif = (t0, play, shift = 0) => MOTIF.forEach(([b, n, d]) => play(t0 + b * BEAT, midi(n + shift), d * BEAT));

async function score(ac) {
  const m = makeMixer(ac, { level: 0.8 }); // −1.9 dB: bombos, chants and 27 impacts make this score run hot
  const drums = m.bus(0.9, 0.05), low = m.bus(0.7), pads = m.bus(0.26, 0.6), keys = m.bus(0.26, 0.4);
  const melody = m.bus(0.42, 0.4), perc = m.bus(0.55, 0.2), fx = m.bus(0.85, 0.3), sfx = m.bus(0.9, 0.5), crowdBus = m.bus(0.8, 0.5);
  const kicks = [];
  const e8 = BEAT / 2, s16 = BEAT / 4;

  // one bar of electrotango: tresillo kick + bass (eighths 0, 3, 6), claps on 2 and 4, marcato chords on every beat
  const tangoBar = (n, { kickOn = true, marcato = true } = {}) => {
    const t0 = bar(n), ch = chordAt(t0 + 0.01);
    for (const k of [0, 3, 6]) {
      if (kickOn) {
        kick(m, drums, t0 + k * e8, 0.9);
        kicks.push(t0 + k * e8);
      }
      bass808(m, low, t0 + k * e8, midi(ch.root), e8 * (k === 6 ? 1.6 : 2.4), 0.55);
    }
    if (kickOn) {
      clap(m, drums, t0 + BEAT, 0.42);
      clap(m, drums, t0 + 3 * BEAT, 0.42);
      for (let k = 0; k < 8; k++) hat(m, drums, t0 + k * e8, k % 2 ? 0.045 : 0.08);
      if (n % 2 === 1) chicharra(m, perc, t0 + 7 * e8, 0.16, 0.1);
    }
    if (marcato) for (let b = 0; b < 4; b++) ch.notes.forEach((nn) => piano(m, keys, t0 + b * BEAT, midi(nn), b % 2 ? 0.06 : 0.1, 0.22));
  };
  // Miami: a dembow (kick on every beat, snares on the 3-3-2 of the sixteenths)
  const dembowBar = (n) => {
    const t0 = bar(n), ch = chordAt(t0 + 0.01);
    for (let b = 0; b < 4; b++) {
      kick(m, drums, t0 + b * BEAT, 0.9);
      kicks.push(t0 + b * BEAT);
    }
    for (const k of [3, 6, 11, 14]) snare(m, drums, t0 + k * s16, 0.3);
    for (let k = 0; k < 16; k += 2) hat(m, drums, t0 + k * s16, 0.05);
    for (const k of [0, 3, 6]) bass808(m, low, t0 + k * e8, midi(ch.root), e8 * 2, 0.6);
  };
  // the stands: bombos on the tresillo, platillos in between
  const murgaBar = (n, gain = 0.6) => {
    const t0 = bar(n);
    for (const k of [0, 3, 6]) bombo(m, perc, t0 + k * e8, gain);
    for (const k of [1, 2, 5, 7]) hat(m, perc, t0 + k * e8, 0.1, true);
  };
  // "ME-SSI": two formant chants, "eh" then "ssi"
  const chantMessi = (t0, gain = 0.4) => {
    chant(m, crowdBus, t0, 0.24, gain, { root: 147, from: [560, 1800], to: [540, 1850], hiss: 0 });
    chant(m, crowdBus, t0 + e8, 0.5, gain, { root: 175, from: [300, 2300], to: [290, 2350], hiss: 0.12 });
  };

  // ---- pads, one chord per bar (not under the silences)
  for (let n = 0; n < 42; n++) {
    if ((n >= 20 && n < 22) || n === 24 || n >= 41) continue;
    pad(m, pads, bar(n), chordAt(bar(n) + 0.01).notes.map(midi), BAR, n < 4 ? 0.14 : 0.26, n < 4 ? 700 : 1500);
  }

  // ---- 0–4 Rosario: keepy-uppies, a music-box motif, TOO SMALL
  for (let t0 = 0.2; t0 < bar(3); t0 += BEAT) {
    kick(m, sfx, t0, 0.18);
    snap(m, sfx, t0, 0.05);
  }
  motif(bar(0.5), (t0, f) => {
    piano(m, keys, t0, f * 2, 0.34, 2.4);
    bell(m, keys, t0, f * 4, 0.05);
  });
  scribble(m, sfx, bar(1), bar(1.3), 0.12, 2600, 14); // the pencil mark
  riser(m, fx, bar(2.25), bar(3), 0.3);
  // the bellows open into bar 4 (the tango's "arrastre")
  bandoneon(m, melody, bar(3.2), midi(64), bar(0.8), 0.14, { attack: bar(0.75), bellows: 0.2 });
  bandoneon(m, melody, bar(3.2), midi(56), bar(0.8), 0.1, { attack: bar(0.75) });

  // ---- 4–7 the napkin: paper, pen, and the tango starts
  scribble(m, sfx, bar(4), bar(4) + 0.45, 0.22, 1600, 22); // the napkin slides in
  scribble(m, sfx, NAP_T0, NAP_END, 0.1); // handwriting
  scribble(m, sfx, NAP_END + 0.15, NAP_END + 0.95, 0.12, 3600, 12); // signatures
  for (let n = 4; n < 7; n++) tangoBar(n, { kickOn: n >= 5 });
  motif(bar(4.5), (t0, f, d) => bandoneon(m, melody, t0, f, d, 0.2, { bellows: 0.15 }));
  motif(bar(6), (t0, f, d) => bandoneon(m, melody, t0, f, d, 0.16, { bellows: 0.15 }), 7);

  // ---- 7–9 goal no. 1
  tangoBar(7);
  riser(m, fx, bar(7.3), bar(8), 0.35);
  snap(m, sfx, bar(7.8), 0.4); // the chip
  poof(m, sfx, bar(8), 0.5); // the net
  crowd(m, crowdBus, bar(8), bar(9.3), 0.28);
  tangoBar(8, { kickOn: false });
  motif(bar(8.25), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.24));

  // ---- 9–19 the rings: the tango under the career melody; Miami switches to a dembow
  for (let n = 9; n < 17; n++) tangoBar(n);
  for (let n = 17; n < 19; n++) dembowBar(n);
  SEASONS.forEach(([, club, goals], i) => {
    const t0 = RING_T[i], f = midi(seasonNote(goals));
    if (club === "barca") {
      lead(m, melody, t0, f * 2, 1.1 * BEAT, 0.12, { type: "triangle", cutoff: 6000, vibrato: 12, attack: 0.015 });
      conga(m, perc, t0, 520, 0.2); // tamborí
      conga(m, perc, t0 + s16, 520, 0.12);
    } else if (club === "psg") bandoneon(m, melody, t0, f, 1.8 * BEAT, 0.17, { wet: true, bellows: 0.25 });
    else {
      marimba(m, melody, t0, f * 2, 0.34);
      marimba(m, melody, t0 + e8 * 1.5, f * 2, 0.18);
    }
  });
  // the bark: a bandoneón run up the scale and the bombos come in
  for (let k = 0; k < 8; k++) bandoneon(m, melody, BARK_T + k * s16, midi(scaleNote(57, k * 2)), s16 * 0.9, 0.16);
  for (let k = 0; k < 4; k++) bombo(m, perc, BARK_T + k * e8, 0.6, k % 2 === 1);
  tangoBar(19);
  motif(TOTAL_T, (t0, f) => bell(m, keys, t0, f * 2, 0.35));

  // ---- 20–22 the Bernabéu: the band stops, the home crowd, the goal, the shirt
  crowd(m, crowdBus, bar(20), bar(20.6), 0.2);
  crowd(m, crowdBus, bar(20.6), bar(22), 0.05);
  brass(m, melody, bar(21.25), midi(45), BEAT * 2, 0.24);
  brass(m, melody, bar(21.25), midi(52), BEAT * 2, 0.2);
  bell(m, keys, bar(21.25), midi(81), 0.25);

  // ---- 22–25 three finals: a bandoneón lament; a low A and a crack for each
  [[22, 76, 1], [22.25, 74, 1], [22.5, 72, 1], [22.75, 71, 1], [23, 69, 1], [23.25, 68, 1], [23.5, 69, 1], [23.75, 64, 1]].forEach(([b, n, d]) =>
    bandoneon(m, melody, bar(b), midi(n), d * BEAT * 0.95, 0.17, { bellows: 0.3 }));
  FINALS.forEach(([b]) => {
    piano(m, keys, bar(b), midi(33), 0.45, 3);
    snap(m, sfx, bar(b) + 0.45, 0.35);
  });
  bandoneon(m, melody, bar(24), midi(45), BEAT * 1.8, 0.12); // he quit: one low reed
  bombo(m, perc, bar(24.5), 0.8, true); // he came back
  motif(bar(24.5), (t0, f, d) => bandoneon(m, melody, t0, f, d * 0.95, 0.2, { bellows: 0.2 }));
  strings(m, pads, bar(24.5), [57, 60, 64].map(midi), BAR * 0.45, 0.24);

  // ---- 25–27 2021, and "¿qué mirás, bobo?": the stands come alive
  tangoBar(25);
  murgaBar(25);
  chantMessi(bar(25.5));
  chicharra(m, perc, bar(26), 0.3, 0.3);
  chicharra(m, perc, bar(26.5), 0.3, 0.3);
  bass808(m, low, bar(26), midi(40), BEAT * 1.5, 0.7);
  bass808(m, low, bar(26.5), midi(45), BEAT * 1.5, 0.7);

  // ---- 27–31 Lusail, 2024
  tangoBar(27, { kickOn: false });
  riser(m, fx, bar(27.25), bar(28), 0.4);
  for (let n = 28; n < 30; n++) {
    tangoBar(n);
    murgaBar(n, 0.7);
  }
  crowd(m, crowdBus, bar(28), bar(30.5), 0.3);
  motif(bar(28), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.28));
  [28.5, 28.75, 29].forEach((b, i) => bell(m, keys, bar(b), midi(81 + [0, 3, 7][i]), 0.4)); // three stars
  chantMessi(bar(29));
  chantMessi(bar(29.5));
  tangoBar(30);
  murgaBar(30);
  [0, 0.5, 1].forEach((k) => brass(m, melody, bar(30) + k * BEAT, midi(57 + [0, 3, 7][k * 2]), BEAT * 0.45, 0.2));

  // ---- 31–34 2026, goodbye: down to a bandoneón and strings
  strings(m, pads, bar(31), [57, 60, 64].map(midi), bar(1.4), 0.2);
  strings(m, pads, bar(32.5), [53, 57, 60].map(midi), bar(0.7), 0.2);
  strings(m, pads, bar(33.25), [56, 59, 62, 64].map(midi), bar(0.7), 0.2);
  [31, 31.5, 31.75, 32].forEach((b, i) => piano(m, keys, bar(b), midi([57, 60, 64, 62][i]), 0.26, 2));
  motif(bar(32.5), (t0, f, d) => bandoneon(m, melody, t0, f, d * 1.1, 0.2, { bellows: 0.35 }));
  bombo(m, perc, bar(33.25), 0.7, true);
  crowd(m, crowdBus, bar(33.25), bar(34.3), 0.16);

  // ---- 34–36 everything: the build
  tangoBar(34);
  murgaBar(34, 0.5);
  tangoBar(35, { marcato: false });
  for (let t0 = bar(35); t0 < bar(35.75) - 0.01; t0 += s16) snare(m, drums, t0, 0.25 + 0.3 * prog(t0, bar(35), bar(35.75)));
  riser(m, fx, bar(34), bar(35.95), 0.4);
  RAPID.forEach(([b0]) => pluck(m, keys, bar(b0), midi(chordAt(bar(b0)).notes[0] + 24), 0.18));

  // ---- 36–39 the tower: every trophy lands with a clink
  for (let n = 36; n < 39; n++) {
    tangoBar(n);
    if (n >= 37) murgaBar(n, 0.5);
  }
  TROPHIES.forEach((_, k) => bell(m, sfx, cupT(k) + 0.15, midi(scaleNote(72, Math.floor(k / 4))), 0.07));
  chantMessi(bar(38.5), 0.45);

  // ---- 39–42 the name, the sky, the end
  tangoBar(39);
  murgaBar(39, 0.7);
  tangoBar(40, { kickOn: false });
  motif(bar(39), (t0, f, d) => {
    brass(m, melody, t0, f / 2, d, 0.3);
    bandoneon(m, melody, t0, f, d, 0.15);
  });
  chantMessi(bar(39.5), 0.45);
  chantMessi(bar(40), 0.4);
  [81, 84, 88].forEach((n, i) => bell(m, keys, bar(40) + i * 0.09, midi(n), 0.2)); // pointing to the sky
  motif(bar(40.75), (t0, f, d) => chip(m, melody, t0, f * 2, d * 0.9, 0.08)); // end card, 8-bit
  bandoneon(m, melody, bar(41), midi(57), bar(0.85), 0.13, { bellows: 0.2 });
  bandoneon(m, melody, bar(41), midi(64), bar(0.85), 0.1);
  pad(m, pads, bar(40.75), [45, 52, 57, 60].map(midi), bar(1.2), 0.22, 800);

  duck(pads, kicks, 0.4, BEAT * 0.8);
  for (const im of IMPACTS) impact(m, fx, im.t, im.hit * 0.8);
}

export default {
  title: "Lionel Messi",
  episode: 3,
  width: W,
  height: H,
  duration: DURATION,
  fonts: ['400 100px Anton', '500 20px "IBM Plex Mono"', 'italic 500 20px "IBM Plex Mono"'],
  // Cold open (render/coldopen.js): bar 1 is Lusail, WORLD CHAMPION and the stars, then it rewinds to Rosario.
  coldOpen: { from: bar(28) - 0.02, length: BAR },
  vertical: { hook: ["TOO SMALL AT 10.", "931 GOALS LATER."], sub: "LIONEL MESSI · 6 OCT: HIS LAST GAME FOR ARGENTINA" },
  chapters: [
    [0, "ROSARIO, AGE 10"], [bar(3), "TOO SMALL"], [bar(4), "THE NAPKIN"], [bar(7), "GOAL NO. 1"],
    [bar(9), "931 GOALS, RING BY RING"], [RING_T[17], "PARIS"], [RING_T[19], "MIAMI"], [BARK_T, "ARGENTINA · 125"],
    [bar(20), "THE BERNABÉU, 2017"], [bar(22), "THREE FINALS LOST"], [bar(24), "HE QUIT"], [bar(24.5), "HE CAME BACK"],
    [bar(25), "2021"], [bar(26), "¿QUÉ MIRÁS, BOBO?"], [bar(27), "LUSAIL, 2022"], [bar(30), "2024"], [bar(31), "2026"],
    [bar(32.5), "GOODBYE"], [bar(34), "EVERYTHING"], [bar(36), "46 TROPHIES"], [bar(39), "LIONEL MESSI"],
  ],
  // Short clips for Reels / Shorts / TikTok, each pointing back to the full film (render/render.ts cuts).
  cuts: [
    { name: "napkin", from: 0, to: bar(9), hook: ["TOO SMALL AT 10.", "SIGNED ON A NAPKIN."], sub: "HOW LIONEL MESSI STARTED" },
    { name: "rings", from: bar(9), to: bar(20), hook: ["931 GOALS.", "ONE RING PER SEASON."], sub: "LIONEL MESSI · 2004–2026" },
    { name: "comeback", from: bar(22), to: bar(31), hook: ["HE QUIT IN 2016.", "THEN HE WON IT ALL."], sub: "LIONEL MESSI & ARGENTINA" },
    { name: "goodbye", from: bar(31), to: bar(42), hook: ["HIS LAST GAME FOR", "ARGENTINA: OCT 6."], sub: "46 TROPHIES LATER" },
  ],
  draw,
  score,
};
