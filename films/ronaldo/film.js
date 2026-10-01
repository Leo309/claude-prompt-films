// RONALDO — 979. A 90-second code-rendered film, EP02 of the 90 SECONDS series.
// Fan-made; not affiliated with Cristiano Ronaldo or any club. Every number is sourced in facts.md.
// Timing grid: 128 BPM, so a beat is 0.469 s and a bar 1.875 s. The timeline is written in bars: bar(12) = 22.5 s.
// Built to be re-rendered the day goal No. 1,000 goes in: the count lives in SEASONS / PORTUGAL below.
import {
  clamp, lerp, prog, ease, hash, text, typed, slam, scaled, glowStroke, grain, vignette, shake, flash,
  midi, makeMixer, kick, snare, clap, hat, bass808, pad, pluck, bell, riser, impact, heartbeat, crowd,
  lead, brass, piano, chip, conga, snap, oud, tremolo, strum, whistle, chant, duck, drawSprite, football,
} from "../../render/kit.js";
import { KITS, STANCE, JUMP, SPIN, SIUU, BICYCLE } from "./sprites.js";

const W = 1920, H = 1080;
const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;
const bar = (n) => n * BAR;
const DURATION = bar(48); // 90 s: the 90 SECONDS series

const C = {
  ink: "#0B0B0D", ink2: "#141416", bone: "#EFE9DE", ash: "#8C877F", graphite: "#2E2C29",
  red: "#E0202F", gold: "#E6B450", grass: "#1E3A26",
};
const DISPLAY = "Anton", MONO = '"IBM Plex Mono"';
const disp = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: DISPLAY, size: 120, color: C.bone, ...o });
const mono = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: MONO, size: 18, weight: 500, color: C.bone, tracking: 3, ...o });
const fmt = (n) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------- data (see facts.md)

// Club goals per season, all competitions (Wikipedia career statistics, match played 15 Sep 2026).
// The two 0-goal rows (Sporting B 2002–03, Juventus 2021–22) are left out.
const SEASONS = [
  ["2002–03", "sporting", 5],
  ["2003–04", "united", 6], ["2004–05", "united", 9], ["2005–06", "united", 12], ["2006–07", "united", 23], ["2007–08", "united", 42], ["2008–09", "united", 26],
  ["2009–10", "real", 33], ["2010–11", "real", 53], ["2011–12", "real", 60], ["2012–13", "real", 55], ["2013–14", "real", 51],
  ["2014–15", "real", 61], ["2015–16", "real", 51], ["2016–17", "real", 42], ["2017–18", "real", 44],
  ["2018–19", "juve", 28], ["2019–20", "juve", 37], ["2020–21", "juve", 36],
  ["2021–22", "united", 24], ["2022–23", "united", 3],
  ["2022–23", "nassr", 14], ["2023–24", "nassr", 50], ["2024–25", "nassr", 35], ["2025–26", "nassr", 30], ["2026–27", "nassr", 3],
];
const PORTUGAL = 146;
const CLUB_GOALS = SEASONS.reduce((s, r) => s + r[2], 0);
const TOTAL = CLUB_GOALS + PORTUGAL;
console.assert(CLUB_GOALS === 833 && TOTAL === 979, `club ${CLUB_GOALS}, total ${TOTAL}`);
const TO_GO = 1000 - TOTAL;

const CLUBS = {
  sporting: { name: "SPORTING CP", color: "#2FA86B", sound: "lisbon" },
  united: { name: "MANCHESTER UNITED", color: "#E2382F", sound: "manchester" },
  real: { name: "REAL MADRID", color: "#F2F0EA", sound: "madrid" },
  juve: { name: "JUVENTUS", color: "#8A857E", sound: "turin" },
  nassr: { name: "AL NASSR", color: "#F5C400", sound: "riyadh" },
  portugal: { name: "PORTUGAL", color: "#C8102E" },
};
const CALLOUTS = {
  0: "FIRST GOALS · AGE 17",
  5: "FIRST CHAMPIONS LEAGUE · FIRST BALLON D'OR",
  12: "HIS BEST SEASON",
  15: "450 FOR REAL MADRID IN 438 GAMES",
  19: "BACK IN MANCHESTER",
  22: "50 GOALS AT 39",
  25: "THIS SEASON, SO FAR",
};

// ---------------------------------------------------------------- timeline

const WALL_IN = 8, PORTUGAL_IN = 21, WALL_OUT = 24;
const seasonStart = (i) => bar(WALL_IN) + i * 2 * BEAT; // one season every two beats
const CUM = [];
{
  let s = 0;
  for (const r of SEASONS) {
    CUM.push(s);
    s += r[2];
  }
}
// When cell k (goal k) lights up, and its colour.
const CELL_T = new Float32Array(1000).fill(Infinity);
const CELL_COLOR = [];
SEASONS.forEach(([, club, goals], i) => {
  for (let g = 0; g < goals; g++) {
    CELL_T[CUM[i] + g] = seasonStart(i) + (g / goals) * 1.6 * BEAT;
    CELL_COLOR[CUM[i] + g] = club;
  }
});
for (let g = 0; g < PORTUGAL; g++) {
  CELL_T[CLUB_GOALS + g] = bar(PORTUGAL_IN) + (g / PORTUGAL) * 7.5 * BEAT;
  CELL_COLOR[CLUB_GOALS + g] = "portugal";
}

const IMPACTS = [
  { t: bar(4), shake: 18, flash: 0.9, hit: 1.1 },
  { t: bar(5), shake: 8, hit: 0.5 },
  { t: bar(6), shake: 10, flash: 0.1, color: C.red, hit: 0.7 },
  { t: bar(8), shake: 8, hit: 0.6 },
  { t: bar(PORTUGAL_IN), shake: 6, flash: 0.08, color: C.red, hit: 0.5 },
  { t: bar(23), shake: 10, hit: 0.8 },
  { t: bar(24), shake: 10, flash: 0.12, color: C.gold, hit: 0.8 },
  { t: bar(30), shake: 26, flash: 0.4, hit: 1.2 },
  { t: bar(34), shake: 10, hit: 0.6 },
  { t: bar(35), shake: 12, flash: 0.12, color: C.red, hit: 0.9 },
  { t: bar(38), shake: 8, flash: 0.1, color: C.gold, hit: 0.6 },
  { t: bar(43), shake: 32, flash: 0.45, color: C.red, hit: 1.4 },
  { t: bar(44), shake: 14, hit: 0.9 },
  { t: bar(44.5), shake: 14, flash: 0.12, color: C.red, hit: 0.9 },
  { t: bar(46), shake: 12, hit: 0.8 },
];

// ---------------------------------------------------------------- helpers

function drawFigure(ctx, rows, kit, cx, footY, px, { rot = 0, flipX = false, alpha = 1 } = {}) {
  const w = rows[0].length * px, h = rows.length * px;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, footY - h / 2);
  ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  drawSprite(ctx, rows, KITS[kit], -w / 2, -h / 2, px);
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

function scrim(ctx, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.restore();
}

// ---------------------------------------------------------------- bars 0–4 · the free-kick stance

function sceneOpen(ctx, t) {
  const cam = lerp(1, 1.15, ease.inOutCubic(prog(t, 0, bar(3.75))));
  const out = 1 - prog(t, bar(3.75), bar(3.9));
  scaled(ctx, 960, 760, cam, () => {
    // pitch: a line of turf and the penalty-box edge
    const fl = ease.outExpo(prog(t, 0.2, 1.4));
    hairline(ctx, 960 - 900 * fl, 800, 960 + 900 * fl, 800, C.bone, 0.25 * out);
    ctx.save();
    ctx.globalAlpha = 0.5 * out * prog(t, 0.4, 1.2);
    ctx.fillStyle = C.grass;
    ctx.fillRect(60, 802, 1800, 6);
    ctx.restore();
    // he appears, breathes on every beat, and stares at the goal
    if (t < bar(3.75)) {
      const breath = Math.sin(((t % BEAT) / BEAT) * Math.PI) * 4;
      drawFigure(ctx, STANCE, "white", 700, 800 - breath, 11, { alpha: prog(t, 0.6, 1.2) });
      football(ctx, 930, 800 - 22, 22, 0);
    }
  });
  // the strike: a knuckleball straight at the lens, wobbling
  if (t >= bar(3.75)) {
    const u = prog(t, bar(3.75), bar(4));
    const wob = Math.sin(u * 40) * 30 * u;
    football(ctx, lerp(930, 960, u) + wob, lerp(760, 540, ease.outCubic(u)), 22 * 60 ** ease.inCubic(u), u * 0.6);
  }
  mono(ctx, typed("MADEIRA, 1985", t, 1.0, 14), 140, 928, { size: 22, alpha: out });
  mono(ctx, typed("FREE KICK.", t, 2.0, 14), 140, 962, { size: 22, color: C.ash, alpha: out });
  const ca = prog(t, 2.6, 3.0) * out;
  mono(ctx, "CAREER GOALS", 1780, 128, { size: 14, color: C.ash, tracking: 5, align: "right", alpha: ca });
  disp(ctx, "0", 1780, 206, { size: 72, align: "right", alpha: ca });
}

// ---------------------------------------------------------------- bars 4–8 · 979

function sceneCount(ctx, t) {
  const exit = ease.inExpo(prog(t, bar(7.6), bar(8)));
  const s = slam(t, bar(4), 0.4, 1.6);
  ctx.save();
  ctx.globalAlpha = 1 - exit;
  scaled(ctx, 700, 520, s.s, () => disp(ctx, fmt(TOTAL), 140, 640, { size: 460, color: C.bone, alpha: s.a, tracking: 4 }));
  const g = slam(t, bar(5), 0.3, 1.4);
  scaled(ctx, 1230, 420, g.s, () => disp(ctx, "GOALS.", 1220, 470, { size: 150, alpha: g.a, tracking: 4 }));
  const r = slam(t, bar(6), 0.3, 1.5);
  scaled(ctx, 1230, 590, r.s, () => disp(ctx, `${TO_GO} TO GO.`, 1220, 640, { size: 150, color: C.red, alpha: r.a, tracking: 4 }));
  mono(ctx, typed("NOBODY IN HISTORY HAS SCORED 1,000.", t, bar(6.6), 40), 144, 780, { size: 26, tracking: 5 });
  ctx.restore();
}

// ---------------------------------------------------------------- bars 8–24 · the wall of 1,000

const WALL = { x0: 900, y0: 250, pitch: 22, cell: 18, cols: 40, rows: 25 };
const cellXY = (k) => {
  const row = WALL.rows - 1 - Math.floor(k / WALL.cols), col = k % WALL.cols;
  return [WALL.x0 + col * WALL.pitch, WALL.y0 + row * WALL.pitch];
};
const cellColor = (k) => {
  const club = CELL_COLOR[k];
  if (club === "juve") return k % 2 ? "#8A857E" : "#4A4743"; // stripes
  return CLUBS[club].color;
};

function drawWall(ctx, t, alpha = 1, blinkEmpty = false) {
  if (alpha <= 0) return 0;
  let filled = 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let k = 0; k < 1000; k++) {
    const [x, y] = cellXY(k);
    const ft = CELL_T[k];
    if (t >= ft) {
      filled++;
      const pop = ease.outBack(prog(t, ft, ft + 0.14));
      const s = WALL.cell * pop, o = (WALL.cell - s) / 2;
      ctx.fillStyle = cellColor(k);
      ctx.fillRect(x + o, y + o, s, s);
    } else {
      const empty = k >= TOTAL;
      const blink = empty && blinkEmpty ? 0.5 + 0.5 * Math.sin(t * 8 + k * 0.4) : 0;
      ctx.strokeStyle = empty && blinkEmpty ? C.red : "rgba(239,233,222,0.14)";
      ctx.globalAlpha = alpha * (empty && blinkEmpty ? 0.35 + 0.65 * blink : 1);
      ctx.lineWidth = empty && blinkEmpty ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, WALL.cell - 1, WALL.cell - 1);
      ctx.globalAlpha = alpha;
    }
  }
  ctx.restore();
  return filled;
}

function sceneWall(ctx, t) {
  const inA = prog(t, bar(WALL_IN) - 0.3, bar(WALL_IN) + 0.3);
  const out = 1 - prog(t, bar(WALL_OUT) - 0.3, bar(WALL_OUT));
  const filled = drawWall(ctx, t, inA * out, t >= bar(23));
  mono(ctx, "GOALS · CLUB + COUNTRY", 144, 250, { size: 15, color: C.ash, tracking: 5, alpha: inA * out });
  disp(ctx, fmt(filled), 140, 420, { size: 170, alpha: inA * out, tracking: 2, color: t >= bar(23) ? C.red : C.bone });

  // the current season (or Portugal, or the gap)
  let label, club, goals, callout, t0;
  if (t < bar(PORTUGAL_IN)) {
    const i = clamp(Math.floor((t - bar(WALL_IN)) / (2 * BEAT)), 0, SEASONS.length - 1);
    [label, club, goals] = SEASONS[i];
    callout = CALLOUTS[i];
    t0 = seasonStart(i);
  } else if (t < bar(23)) {
    [label, club, goals, callout, t0] = ["2003–2026", "portugal", PORTUGAL, "MOST EVER IN MEN'S INTERNATIONAL FOOTBALL", bar(PORTUGAL_IN)];
  } else {
    [label, club, goals, callout, t0] = ["STILL EMPTY", null, TO_GO, "THE LAST 21 SQUARES ON THE WALL", bar(23)];
  }
  const s = slam(t, t0, 0.22, 1.25);
  const a = inA * out;
  mono(ctx, label, 144, 540, { size: 22, color: C.ash, tracking: 5, alpha: a });
  if (club) scaled(ctx, 140, 600, s.s, () => disp(ctx, CLUBS[club].name, 140, 620, { size: 64, color: CLUBS[club].color, alpha: a * s.a, tracking: 2 }));
  scaled(ctx, 140, 720, s.s, () => disp(ctx, String(goals), 140, 800, { size: 150, color: club ? C.bone : C.red, alpha: a * s.a, tracking: 2 }));
  disp(ctx, club ? "GOALS" : "TO GO", 144 + String(goals).length * 78 + 20, 800, { size: 48, color: C.ash, alpha: a * s.a, tracking: 3 });
  if (callout) mono(ctx, typed(callout, t, t0 + 0.1, 60), 144, 860, { size: 18, color: C.gold, tracking: 3, alpha: a });
}

// ---------------------------------------------------------------- bars 24–28 · Mr. Champions League

function bigEars(ctx, x, y, s, lit) {
  // The trophy with the big handles: bowl, two loop handles, stem, base. Drawn, not traced.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 5;
  ctx.strokeStyle = lit ? C.gold : "rgba(239,233,222,0.25)";
  ctx.fillStyle = lit ? "rgba(230,180,80,0.18)" : "rgba(0,0,0,0)";
  ctx.beginPath();
  ctx.moveTo(-34, -60);
  ctx.quadraticCurveTo(-38, 10, -8, 30);
  ctx.lineTo(8, 30);
  ctx.quadraticCurveTo(38, 10, 34, -60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(d * 50, -24, 22, 34, d * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(0, 62);
  ctx.moveTo(-26, 70);
  ctx.lineTo(26, 70);
  ctx.stroke();
  ctx.restore();
}

function sceneUCL(ctx, t) {
  const out = 1 - prog(t, bar(27.7), bar(28));
  const h = slam(t, bar(24), 0.3, 1.4);
  scaled(ctx, 960, 170, h.s, () => disp(ctx, "MR. CHAMPIONS LEAGUE", 960, 210, { size: 110, align: "center", alpha: h.a * out, tracking: 3 }));
  const n = Math.round(140 * ease.outCubic(prog(t, bar(24.2), bar(25))));
  disp(ctx, String(n), 140, 700, { size: 400, alpha: out * prog(t, bar(24.2), bar(24.4)), tracking: 4 });
  mono(ctx, typed("GOALS · NO. 1 ALL-TIME · 183 GAMES", t, bar(25), 40), 150, 780, { size: 22, color: C.ash, tracking: 4, alpha: out });
  ["2008", "2014", "2016", "2017", "2018"].forEach((y, i) => {
    const t0 = bar(25) + i * BEAT;
    const x = 1000 + i * 170, lit = t >= t0;
    const s = slam(t, t0, 0.25, 1.3);
    scaled(ctx, x, 520, lit ? s.s : 1, () => bigEars(ctx, x, 520, 1.15, lit));
    mono(ctx, y, x, 650, { size: 20, align: "center", color: lit ? C.gold : C.ash, tracking: 3, alpha: out });
  });
  ctx.globalAlpha = 1;
  mono(ctx, typed("FIVE TITLES.", t, bar(26.5), 30), 1000 + 2 * 170, 720, { size: 26, align: "center", tracking: 6, alpha: out });
}

// ---------------------------------------------------------------- bars 28–32 · the bicycle kick in Turin

const GROUND = 860, KICK_X = 980, KICK_Y = 540, GOAL_X = 1620;
function sceneBicycle(ctx, t) {
  const out = 1 - prog(t, bar(31.7), bar(32));
  const hit = bar(30);
  // the stands: rows of fans that rise on the hit, in a wave from the centre
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 64; c++) {
      const x = 60 + c * 28 + (r % 2) * 14, y0 = 140 + r * 34;
      const wave = hit + 0.25 + Math.abs(c - 32) * 0.012 + r * 0.03;
      const up = ease.outBack(prog(t, wave, wave + 0.35));
      ctx.fillStyle = up > 0.01 ? C.bone : C.ash;
      ctx.globalAlpha = out * (0.25 + 0.55 * up) * prog(t, bar(28), bar(28.3));
      ctx.fillRect(x, y0 - up * 14, 8, 10 + up * 6);
    }
  }
  ctx.globalAlpha = 1;
  // pitch + goal (side view)
  hairline(ctx, 60, GROUND, 1860, GROUND, C.bone, 0.3 * out);
  hairline(ctx, GOAL_X, GROUND, GOAL_X, GROUND - 190, C.bone, 0.8 * out, 5);
  hairline(ctx, GOAL_X, GROUND - 190, GOAL_X + 110, GROUND - 190, C.bone, 0.6 * out, 3);
  const bulge = t >= hit + 0.3 ? Math.exp(-(t - hit - 0.3) * 4) * 30 : 0;
  for (let k = 0; k <= 6; k++) {
    const y = GROUND - 190 + k * 31;
    hairline(ctx, GOAL_X, y, GOAL_X + 110 + bulge * Math.sin((k / 6) * Math.PI), y + 10, C.bone, 0.3 * out, 1);
  }
  // the cross, the kick, the ball in the net
  let ball;
  if (t < hit) {
    const u = prog(t, bar(29), hit);
    ball = { x: lerp(160, KICK_X - 20, u), y: lerp(620, KICK_Y - 60, u) - Math.sin(u * Math.PI) * 180 };
  } else {
    const u = ease.outCubic(prog(t, hit, hit + 0.3));
    ball = { x: lerp(KICK_X - 20, GOAL_X + 40, u), y: lerp(KICK_Y - 60, GROUND - 150, u) };
  }
  if (t >= bar(29)) football(ctx, ball.x, ball.y, 16, t * 9);
  // him: rises, tips back into the overhead kick, falls
  const rise = ease.outCubic(prog(t, bar(29.5), hit)), fall = ease.inCubic(prog(t, hit + 0.1, hit + 0.6));
  const rot = lerp(0, -1.9, ease.inOutCubic(prog(t, bar(29.5), hit)));
  const footY = lerp(GROUND, KICK_Y + 140, rise) + (GROUND - (KICK_Y + 140)) * fall;
  drawFigure(ctx, BICYCLE, "white", KICK_X, footY, 10, { rot, alpha: out * prog(t, bar(28.5), bar(28.8)) });
  if (t >= hit && t < hit + 0.8) {
    const u = prog(t, hit, hit + 0.8);
    for (let k = 0; k < 14; k++) {
      const ang = hash(k, 3) * Math.PI * 2, r0 = 14 + ease.outExpo(u) * (50 + hash(k, 4) * 90);
      hairline(ctx, KICK_X - 20 + Math.cos(ang) * r0, KICK_Y - 60 + Math.sin(ang) * r0,
        KICK_X - 20 + Math.cos(ang) * (r0 + 18 * (1 - u)), KICK_Y - 60 + Math.sin(ang) * (r0 + 18 * (1 - u)), C.bone, 1 - u, 2);
    }
  }
  mono(ctx, typed("TURIN · 3 APRIL 2018 · JUVENTUS 0–3 REAL MADRID", t, bar(28.3), 50), 140, 940, { size: 20, color: C.ash, tracking: 4, alpha: out });
  const s = slam(t, hit + 0.45, 0.3, 1.3);
  scaled(ctx, 140, 1000, s.s, () => disp(ctx, "THE HOME END STOOD UP.", 140, 1030, { size: 84, alpha: s.a * out, tracking: 3 }));
}

// ---------------------------------------------------------------- bars 32–35 · Água

function bottle(ctx, x, baseY, color, clear = false) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(-28, -120);
  ctx.quadraticCurveTo(-28, -150, -12, -165);
  ctx.lineTo(-12, -195);
  ctx.lineTo(12, -195);
  ctx.lineTo(12, -165);
  ctx.quadraticCurveTo(28, -150, 28, -120);
  ctx.lineTo(28, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha *= clear ? 0.25 : 1;
  ctx.fill();
  ctx.globalAlpha /= clear ? 0.25 : 1;
  ctx.strokeStyle = clear ? "#BFE3F2" : "rgba(239,233,222,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = clear ? "#5FB7DD" : C.red;
  ctx.fillRect(-14, -205, 28, 12); // cap
  if (!clear) {
    ctx.fillStyle = C.bone;
    ctx.fillRect(-28, -80, 56, 26); // plain label band, no brand
  }
  ctx.restore();
}

function sceneAgua(ctx, t) {
  const out = 1 - prog(t, bar(34.8), bar(35));
  ctx.save();
  ctx.globalAlpha = out;
  hairline(ctx, 460, 760, 1460, 760, C.bone, 0.5, 2);
  const l = ease.inCubic(prog(t, bar(32.5), bar(32.5) + 0.4)), r = ease.inCubic(prog(t, bar(33), bar(33) + 0.4));
  bottle(ctx, lerp(760, -200, l), 760, "#2A0E0B");
  bottle(ctx, lerp(1160, 2120, r), 760, "#2A0E0B");
  const up = ease.outBack(prog(t, bar(33.5), bar(33.5) + 0.35));
  if (t >= bar(33.5)) bottle(ctx, 960, lerp(980, 760, up) - ease.outCubic(prog(t, bar(34), bar(34) + 0.3)) * 60, "#9ED8F0", true);
  ctx.restore();
  mono(ctx, typed("EURO 2020 · BUDAPEST · PRE-MATCH PRESS CONFERENCE", t, bar(32.1), 50), 960, 880, { size: 20, align: "center", color: C.ash, tracking: 4, alpha: out });
  const s = slam(t, bar(34), 0.3, 1.5);
  scaled(ctx, 960, 330, s.s, () => disp(ctx, "ÁGUA.", 960, 420, { size: 260, align: "center", alpha: s.a * out, tracking: 6 }));
}

// ---------------------------------------------------------------- bars 35–40 · Portugal, World Cups, Ballon d'Or

function scenePortugal(ctx, t) {
  if (t < bar(36.5)) {
    const out = 1 - prog(t, bar(36.3), bar(36.5));
    const s = slam(t, bar(35), 0.35, 1.5);
    scaled(ctx, 500, 520, s.s, () => disp(ctx, String(PORTUGAL), 140, 680, { size: 440, color: CLUBS.portugal.color, alpha: s.a * out, tracking: 4 }));
    mono(ctx, typed("GOALS FOR PORTUGAL. MOST EVER.", t, bar(35.3), 40), 150, 770, { size: 24, tracking: 4, alpha: out });
    ["234 CAPS · MOST EVER", "EURO 2016", "NATIONS LEAGUE 2019 · 2025"].forEach((line, i) => {
      const a = prog(t, bar(35.5) + i * BEAT, bar(35.5) + i * BEAT + 0.15) * out;
      disp(ctx, line, 1100, 440 + i * 110, { size: 72, alpha: a, tracking: 2, color: i ? C.bone : C.ash });
    });
    return;
  }
  // 36.5–38: scored in six World Cups
  const out = 1 - prog(t, bar(37.8), bar(38));
  const h = slam(t, bar(36.5), 0.3, 1.4);
  scaled(ctx, 960, 250, h.s, () => disp(ctx, "SCORED AT 6 WORLD CUPS", 960, 290, { size: 110, align: "center", alpha: h.a * out, tracking: 3 }));
  [2006, 2010, 2014, 2018, 2022, 2026].forEach((y, i) => {
    const t0 = bar(36.75) + i * BEAT * 0.5;
    const x = 960 + (i - 2.5) * 250, lit = t >= t0;
    const s = slam(t, t0, 0.2, 1.4);
    ctx.save();
    ctx.globalAlpha = out;
    scaled(ctx, x, 540, lit ? s.s : 1, () => football(ctx, x, 540, 62, i * 0.7, lit ? "#15151A" : "#6A665F"));
    ctx.restore();
    mono(ctx, String(y), x, 660, { size: 26, align: "center", color: lit ? C.bone : C.ash, tracking: 4, alpha: out });
  });
  mono(ctx, typed("THE FIRST PLAYER EVER TO DO IT.", t, bar(37.4), 40), 960, 760, { size: 24, align: "center", color: C.red, tracking: 5, alpha: out });
}

function sceneBallon(ctx, t) {
  const out = 1 - prog(t, bar(39.7), bar(40));
  const h = slam(t, bar(38), 0.3, 1.4);
  scaled(ctx, 960, 250, h.s, () => disp(ctx, "5 BALLON D'OR", 960, 290, { size: 130, align: "center", color: C.gold, alpha: h.a * out, tracking: 4 }));
  [2008, 2013, 2014, 2016, 2017].forEach((y, i) => {
    const t0 = bar(38) + (i + 1) * BEAT * 0.5;
    const x = 960 + (i - 2) * 280, lit = t >= t0;
    const s = slam(t, t0, 0.25, 1.4);
    ctx.save();
    ctx.globalAlpha = out * (lit ? 1 : 0.25);
    scaled(ctx, x, 560, lit ? s.s : 1, () => {
      const g = ctx.createRadialGradient(x - 30, 530, 8, x, 560, 90);
      g.addColorStop(0, "#FBE7A8");
      g.addColorStop(0.6, "#D8A840");
      g.addColorStop(1, "#7A5818");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, 560, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha *= 0.35;
      football(ctx, x, 560, 90, i * 0.9, "#6A4A10");
      ctx.restore();
    });
    ctx.restore();
    mono(ctx, String(y), x, 700, { size: 26, align: "center", color: lit ? C.gold : C.ash, tracking: 4, alpha: out });
  });
}

// ---------------------------------------------------------------- bars 40–44 · everything, then SIUUU

const RAPID = [
  [40, "979", "GOALS"], [40.25, "1,333", "GAMES"], [40.5, "450", "REAL MADRID"], [40.75, "140", "CHAMPIONS LEAGUE"],
  [41, "146", "PORTUGAL"], [41.125, "61", "IN ONE SEASON"], [41.25, "5", "BALLON D'OR"], [41.375, "6", "WORLD CUPS"],
  [41.5, "41", "YEARS OLD"], [41.75, "7", ""],
];

function sceneBuild(ctx, t) {
  const u = prog(t, bar(40), bar(42));
  ctx.save();
  ctx.strokeStyle = C.bone;
  ctx.lineWidth = 2;
  for (let j = 0; j < 40; j++) {
    const y = 80 + hash(j, 1) * 920, speed = 0.4 + hash(j, 2);
    const x = ((hash(j, 3) + (t - bar(40)) * speed * (0.6 + u * 2.4)) % 1) * 2300 - 200;
    ctx.globalAlpha = 0.12 + 0.2 * u;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 60 - u * 400 * speed, y);
    ctx.stroke();
  }
  ctx.restore();
  const idx = RAPID.findLastIndex(([b0]) => t >= bar(b0));
  if (idx >= 0) {
    const [b0, big, label] = RAPID[idx];
    const s = slam(t, bar(b0), 0.14, 1.3);
    const last = idx === RAPID.length - 1;
    scaled(ctx, 960, 540, lerp(1, 1.1, u) * s.s, () => {
      disp(ctx, big, 960, last ? 760 : 640, { size: last ? 640 : 330, align: "center", color: last || idx % 2 ? C.red : C.bone, alpha: s.a, tracking: 2 });
      mono(ctx, label, 960, 720, { size: 26, align: "center", tracking: 10, alpha: s.a });
    });
  }
}

function sceneSiuu(ctx, t) {
  const land = bar(43);
  const cx = 960, ground = 900, px = 16;
  // behind him: SIUUU, with rings of echoes
  if (t >= land) {
    const s = slam(t, land, 0.3, 1.8);
    for (let k = 3; k >= 1; k--) {
      const e = prog(t, land + k * 0.08, land + k * 0.08 + 1.2);
      scaled(ctx, 960, 480, 1 + e * 0.5, () => disp(ctx, "SIUUU", 960, 620, { size: 360, align: "center", color: C.red, stroke: 3, alpha: (1 - e) * 0.6, tracking: 10 }));
    }
    scaled(ctx, 960, 480, s.s, () => disp(ctx, "SIUUU", 960, 620, { size: 360, align: "center", color: C.red, alpha: s.a, tracking: 10 }));
  }
  hairline(ctx, 560, ground, 1360, ground, C.bone, 0.3);
  if (t < bar(42.5)) {
    const u = prog(t, bar(42), bar(42.5));
    drawFigure(ctx, JUMP, "white", cx, ground - ease.outCubic(u) * 260, px);
  } else if (t < land) {
    const u = prog(t, bar(42.5), land);
    const spin = Math.cos(u * Math.PI * 2); // a full turn in the air: squash the width through the turn
    ctx.save();
    ctx.translate(cx, 0);
    ctx.scale(Math.max(0.08, Math.abs(spin)), 1);
    drawFigure(ctx, u > 0.25 && u < 0.75 ? SPIN : JUMP, "white", 0, ground - 260 * (1 - ease.inCubic(u)), px);
    ctx.restore();
  } else {
    const squash = Math.exp(-(t - land) * 14) * 0.12;
    ctx.save();
    ctx.translate(cx, ground);
    ctx.scale(1 + squash, 1 - squash);
    drawFigure(ctx, SIUU, "white", 0, 0, px);
    ctx.restore();
    // dust off the landing
    const u = prog(t, land, land + 0.9);
    ctx.fillStyle = C.bone;
    for (let k = 0; k < 40; k++) {
      const dir = k % 2 ? 1 : -1, d = ease.outExpo(u) * (80 + hash(k, 6) * 260);
      ctx.globalAlpha = (1 - u) * 0.7;
      ctx.fillRect(cx + dir * (60 + d), ground - hash(k, 7) * 40 * (1 - u) - 6, 8, 8);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- bars 44–48 · the name, 21 to go

function sceneFinale(ctx, t) {
  if (t < bar(46)) {
    const ex = 1 - prog(t, bar(45.85), bar(46));
    drawWall(ctx, t, 0.16 * ex, true);
    const s1 = slam(t, bar(44), 0.3, 1.5), s2 = slam(t, bar(44.5), 0.3, 1.5);
    scaled(ctx, 960, 380, s1.s, () => disp(ctx, "CRISTIANO", 960, 500, { size: 300, align: "center", alpha: s1.a * ex, tracking: 12 }));
    scaled(ctx, 960, 700, s2.s, () => disp(ctx, "RONALDO", 960, 820, { size: 300, align: "center", color: C.red, alpha: s2.a * ex, tracking: 12 }));
    mono(ctx, typed("41 YEARS OLD. 500 GOALS SINCE TURNING 30.", t, bar(45), 45), 960, 900, { size: 22, align: "center", color: C.ash, tracking: 5, alpha: ex });
    return;
  }
  // 46–48: 21 to go, and the end card under it
  const fade = 1 - prog(t, bar(47.7), bar(48));
  const s = slam(t, bar(46), 0.3, 1.5);
  scaled(ctx, 960, 340, s.s, () => disp(ctx, `${TO_GO} TO GO.`, 960, 460, { size: 260, align: "center", color: C.red, alpha: s.a * fade, tracking: 8 }));
  mono(ctx, typed("THE WALL IS NOT FULL YET.", t, bar(46.3), 40), 960, 560, { size: 24, align: "center", tracking: 6, alpha: fade });
  const ta = prog(t, bar(46.6), bar(46.9)) * fade;
  [
    "A FAN-MADE TRIBUTE. NOT AFFILIATED WITH CRISTIANO RONALDO OR ANY CLUB.",
    `STATS AS OF SEPTEMBER 2026 · ${TOTAL} GOALS · ESPN · WIKIPEDIA`,
    "EVERY FRAME AND EVERY SOUND IN THIS FILM WAS GENERATED BY CODE.",
  ].forEach((line, i) => mono(ctx, line, 960, 760 + i * 38, { size: 15, align: "center", color: C.ash, tracking: 3, alpha: ta }));
}

// ---------------------------------------------------------------- frame

function draw(ctx, t) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, H);
  const sh = shake(t, IMPACTS);
  ctx.save();
  ctx.translate(sh.x, sh.y);
  if (t < bar(4)) sceneOpen(ctx, t);
  else if (t < bar(8)) sceneCount(ctx, t);
  else if (t < bar(24)) sceneWall(ctx, t);
  else if (t < bar(28)) sceneUCL(ctx, t);
  else if (t < bar(32)) sceneBicycle(ctx, t);
  else if (t < bar(35)) sceneAgua(ctx, t);
  else if (t < bar(38)) scenePortugal(ctx, t);
  else if (t < bar(40)) sceneBallon(ctx, t);
  else if (t < bar(42)) sceneBuild(ctx, t);
  else if (t < bar(44)) sceneSiuu(ctx, t);
  else sceneFinale(ctx, t);
  ctx.restore();
  flash(ctx, W, H, t, IMPACTS);
  vignette(ctx, W, H, 0.55);
  grain(ctx, W, H, t, 0.1);
}

// ---------------------------------------------------------------- score (synthesized, D minor, 128 BPM house)
// 1. Career melody: each club season's goals become a note, played as its squares fill the wall.
// 2. Cities: Lisbon fado tremolo · Manchester organ lead · Madrid flamenco (Andalusian cadence, strums, palmas)
//    · Turin mandolin · Riyadh oud over a darbuka maqsum, in the Hijaz scale.
// 3. The "7" motif: A → C♯ (the 7th degree, the leading tone) → home to D. It returns in every chapter.
// Plus a synthesized stadium chanting SIUUU (formant-filtered voices, not a recording).

const CH = {
  Dm: { notes: [57, 62, 65], root: 38 }, Bb: { notes: [58, 62, 65], root: 34 }, F: { notes: [57, 60, 65], root: 41 },
  C: { notes: [55, 60, 64], root: 36 }, A: { notes: [57, 61, 64], root: 33 }, D5: { notes: [50, 57, 62], root: 38 },
};
const eraOfTime = (t) => {
  if (t >= bar(WALL_IN) && t < bar(PORTUGAL_IN)) return CLUBS[SEASONS[clamp(Math.floor((t - bar(WALL_IN)) / (2 * BEAT)), 0, SEASONS.length - 1)][1]].sound;
  return null;
};
function chordAt(t) {
  const era = eraOfTime(t), n = Math.floor(t / BAR);
  if (era === "madrid") return [CH.Dm, CH.C, CH.Bb, CH.A][n % 4]; // Andalusian cadence
  if (era === "riyadh") return CH.D5; // drone
  return [CH.Dm, CH.Bb, CH.F, CH.C][n % 4];
}
const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], hijaz: [0, 1, 4, 5, 7, 8, 10] };
const scaleNote = (base, deg, scale) => base + 12 * Math.floor(deg / 7) + scale[((deg % 7) + 7) % 7];
// 3 goals → D4 … 61 goals → up about an octave and a half
const seasonNote = (goals, sound) =>
  scaleNote(62, Math.round(((goals - 3) / 58) * 9), sound === "madrid" ? SCALES.harmonic : sound === "riyadh" ? SCALES.hijaz : SCALES.minor);

// The "7" motif, in beats: A4 (dotted eighth) · C♯5 (sixteenth) · D5 (half note)
const MOTIF = [[0, 69, 0.75], [0.75, 73, 0.25], [1, 74, 2]];
const motif = (t0, play, shift = 0) => MOTIF.forEach(([b, n, d]) => play(t0 + b * BEAT, midi(n + shift), d * BEAT));

const GROOVES = [[4, 8], [8, 23], [24, 28], [30.5, 32], [35, 40], [43, 46]];

async function score(ac) {
  const m = makeMixer(ac);
  const drums = m.bus(0.9, 0.05), low = m.bus(0.7), pads = m.bus(0.3, 0.6), keys = m.bus(0.22, 0.45);
  const melody = m.bus(0.42, 0.4), perc = m.bus(0.5, 0.2), fx = m.bus(0.85, 0.3), sfx = m.bus(0.9, 0.6), crowdBus = m.bus(0.8, 0.5);
  const kicks = [];

  // ---- house groove: kick on every beat, claps on 2 and 4, open hats and bass on the off-beats
  for (const [a, b] of GROOVES) {
    for (let t0 = bar(a); t0 < bar(b) - 0.01; t0 += BEAT) {
      const beatInBar = Math.round((t0 % BAR) / BEAT) % 4;
      kick(m, drums, t0, 0.95);
      kicks.push(t0);
      if (beatInBar === 1 || beatInBar === 3) clap(m, drums, t0, 0.5);
      hat(m, drums, t0 + BEAT / 2, 0.16, true);
      hat(m, drums, t0 + BEAT / 4, 0.06);
      hat(m, drums, t0 + (3 * BEAT) / 4, 0.06);
      bass808(m, low, t0 + BEAT / 2, midi(chordAt(t0).root + 12), BEAT * 0.4, 0.6);
    }
  }

  // ---- pads, one chord per bar, pumping against the kick
  for (let n = 0; n < 48; n++) {
    const t0 = bar(n);
    if (n >= 32 && n < 35) continue; // Água: the band stops
    pad(m, pads, t0, chordAt(t0 + 0.01).notes.map(midi), BAR, n < 4 ? 0.18 : 0.3, n < 4 ? 600 : 1500);
  }
  duck(pads, kicks, 0.35, BEAT * 0.8);

  // ---- 1 + 2. the career melody, in each city's sound
  SEASONS.forEach(([, club, goals], i) => {
    const t0 = seasonStart(i), sound = CLUBS[club].sound, f = midi(seasonNote(goals, sound));
    if (sound === "lisbon") tremolo(m, melody, t0, f, 2 * BEAT, 0.22, 14);
    else if (sound === "manchester") lead(m, melody, t0, f, 1.6 * BEAT, 0.16, { type: "square", cutoff: 2200, vibrato: 10 });
    else if (sound === "madrid") {
      pluck(m, melody, t0, f, 0.32, 0.5);
      strum(m, keys, t0, chordAt(t0).notes.map((n) => midi(n + 12)), 0.18, true);
      strum(m, keys, t0 + BEAT, chordAt(t0).notes.map((n) => midi(n + 12)), 0.14, false);
    } else if (sound === "turin") tremolo(m, melody, t0, f * 2, 1.8 * BEAT, 0.14, 22);
    else if (sound === "riyadh") oud(m, melody, t0, f, 0.34, 0.8);
  });
  // city percussion: palmas in Madrid, the darbuka maqsum in Riyadh (doum · tek · – · tek · doum · – · tek · –)
  for (let t0 = bar(WALL_IN); t0 < bar(PORTUGAL_IN) - 0.01; t0 += BEAT / 2) {
    const era = eraOfTime(t0), step = Math.round((t0 % BAR) / (BEAT / 2)) % 8;
    if (era === "madrid" && [1, 3, 6].includes(step)) clap(m, perc, t0, 0.35);
    if (era === "riyadh") {
      if (step === 0 || step === 4) conga(m, perc, t0, 110, 0.5);
      if ([1, 3, 6].includes(step)) snap(m, perc, t0, 0.35);
    }
  }
  // Portugal: a fado tremolo climbing the scale while the red squares pour in
  for (let k = 0; k < 16; k++) tremolo(m, melody, bar(PORTUGAL_IN) + k * BEAT * 0.5, midi(scaleNote(62, k, SCALES.minor)), BEAT * 0.45, 0.14, 16);

  // ---- 3. the "7" motif, chapter by chapter
  motif(bar(2), (t0, f) => piano(m, keys, t0, f, 0.5, 2.2)); // the stance: solo keys
  motif(bar(4), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.26)); // 979
  motif(bar(23), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.24)); // 21 to go
  motif(bar(24), (t0, f) => bell(m, keys, t0, f, 0.4)); // Mr. Champions League
  motif(bar(30), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.24)); // the bicycle kick
  motif(bar(43), (t0, f, d) => brass(m, melody, t0, f / 2, d, 0.3)); // SIUUU
  motif(bar(44), (t0, f, d) => lead(m, melody, t0, f, d, 0.12, { cutoff: 3200, vibrato: 12 })); // CRISTIANO RONALDO
  motif(bar(46.5), (t0, f, d) => chip(m, melody, t0, f * 2, d * 0.9, 0.08)); // end card, 8-bit

  // ---- cold open: crowd murmur, heartbeat, the whistle, the strike
  crowd(m, crowdBus, 0, bar(4), 0.08);
  for (let t0 = bar(1); t0 < bar(3.5); t0 += BEAT) heartbeat(m, fx, t0, 0.4);
  whistle(m, sfx, bar(3.5), 0.45, 0.16);
  kick(m, sfx, bar(3.75), 0.7);
  snap(m, sfx, bar(3.75), 0.5);
  riser(m, fx, bar(2.5), bar(4), 0.3);

  // ---- UCL cups, World Cups, Ballon d'Or
  [62, 65, 69, 72, 74].forEach((n, i) => brass(m, melody, bar(25) + i * BEAT, midi(n), BEAT * 0.8, 0.14));
  [62, 65, 69, 72, 74, 77].forEach((n, i) => pluck(m, keys, bar(36.75) + i * BEAT * 0.5, midi(n), 0.2));
  [74, 77, 81, 84, 86].forEach((n, i) => bell(m, keys, bar(38) + (i + 1) * BEAT * 0.5, midi(n), 0.3));

  // ---- the bicycle kick: the band drops out, a riser, the hit, the home crowd on its feet
  for (let t0 = bar(28); t0 < bar(30) - 0.2; t0 += BEAT) heartbeat(m, fx, t0, 0.45);
  riser(m, fx, bar(29), bar(30), 0.4);
  kick(m, sfx, bar(30), 0.8);
  crowd(m, crowdBus, bar(30) + 0.2, bar(32), 0.3);

  // ---- Água: silence, two bottles slide, a water bottle rises, a deadpan sting
  for (const t0 of [bar(32.5), bar(33)]) {
    riser(m, sfx, t0, t0 + 0.25, 0.12);
    bell(m, sfx, t0, midi(96), 0.08);
  }
  [74, 78, 81].forEach((n, i) => pluck(m, keys, bar(33.5) + i * 0.08, midi(n), 0.18));
  lead(m, sfx, bar(34), 220, 0.5, 0.2, { type: "sine", from: 440, glide: 0.45, cutoff: 3000 }); // "bwomp"

  // ---- 40–42 build, the jump, the spin, the landing
  for (let t0 = bar(40); t0 < bar(41.75); t0 += BEAT) kick(m, drums, t0, 0.9);
  for (let t0 = bar(41); t0 < bar(41.75); t0 += BEAT / 4) snare(m, drums, t0, 0.3 + 0.35 * prog(t0, bar(41), bar(41.75)));
  riser(m, fx, bar(40), bar(41.9), 0.45);
  RAPID.forEach(([b0]) => pluck(m, keys, bar(b0), midi(chordAt(bar(b0)).notes[0] + 24), 0.18));
  riser(m, sfx, bar(42), bar(42.5), 0.2); // up
  riser(m, sfx, bar(42.5), bar(43), 0.25); // the turn
  chant(m, crowdBus, bar(43) - 0.1, 2.4, 0.55); // SIUUU
  chant(m, crowdBus, bar(46), 1.8, 0.3); // an echo under "21 TO GO"
  crowd(m, crowdBus, bar(43), bar(46), 0.12);

  // ---- end: pad, the full-time whistle
  pad(m, pads, bar(46), [50, 57, 62, 65].map(midi), bar(2), 0.22, 800);
  whistle(m, sfx, bar(47.25), 0.9, 0.14); // full time

  for (const im of IMPACTS) impact(m, fx, im.t, im.hit * 0.8);
}

export default {
  title: "Cristiano Ronaldo",
  episode: 2,
  width: W,
  height: H,
  duration: DURATION,
  fonts: ['400 100px Anton', '500 20px "IBM Plex Mono"'],
  // Cold open (render/coldopen.js): bar 1 lands the SIUUU, then rewinds to the free kick.
  coldOpen: { from: bar(43) - 0.02, length: BAR },
  vertical: { hook: ["979 GOALS.", `${TO_GO} TO GO.`], sub: "NOBODY HAS EVER SCORED 1,000" },
  chapters: [
    [0, "THE FREE KICK"], [bar(4), `${TOTAL} GOALS`], [bar(8), "THE WALL OF 1,000"], [bar(PORTUGAL_IN), "PORTUGAL · 146"],
    [bar(23), `${TO_GO} SQUARES LEFT`], [bar(24), "MR. CHAMPIONS LEAGUE"], [bar(28), "TURIN, 2018"], [bar(32), "THE PRESS CONFERENCE"],
    [bar(35), "PORTUGAL"], [bar(36.5), "6 WORLD CUPS"], [bar(38), "5 BALLON D'OR"], [bar(40), "EVERYTHING"],
    [bar(42), "…"], [bar(43), "SIUUU"], [bar(44), "CRISTIANO RONALDO"], [bar(46), `${TO_GO} TO GO`],
  ],
  // Short clips for Reels / Shorts / TikTok, each pointing back to the full film (render/render.ts cuts).
  cuts: [
    { name: "wall", from: bar(11), to: bar(24), hook: [`${TOTAL} GOALS.`, "ONE SQUARE EACH."], sub: `CRISTIANO RONALDO · ${TO_GO} TO GO` },
    { name: "agua", from: bar(24), to: bar(35), hook: ["MR. CHAMPIONS LEAGUE.", "THEN: ÁGUA."], sub: "CRISTIANO RONALDO" },
    { name: "siuuu", from: bar(38), to: bar(48), hook: ["41 YEARS OLD.", `${TO_GO} GOALS FROM 1,000.`], sub: "CRISTIANO RONALDO · SIUUU" },
  ],
  draw,
  score,
};
