// LEBRON — a 90-second code-rendered tribute, EP01 of the 90 SECONDS series.
// Fan-made; not affiliated with the NBA or LeBron James. Every number on screen is sourced in facts.md.
// Timing grid: 120 BPM → 1 beat = 0.5 s, 1 bar = 2 s. Cuts and hits land on beats;
// IMPACTS drives both the camera shake/flash and the hit sounds, so picture and sound can't drift apart.
import {
  clamp, lerp, prog, ease, hash, mix, track, text, typed, slam, scaled, glowStroke,
  grain, vignette, shake, flash, midi, makeMixer, kick, snare, clap, hat, bass808, pad, pluck,
  bell, riser, impact, bounceSfx, heartbeat, crowd, fmBell, lead, brass, piano, strings, chip,
  shaker, conga, anvil, snap, poof, drawSprite,
} from "../../render/kit.js";
import { PAL, PORTRAIT, PORTRAIT_BLINK, CHALK } from "./sprites.js";

const W = 1920, H = 1080, DURATION = 90; // the 90 SECONDS series
const C = {
  ink: "#0B0B0D", ink2: "#141416", bone: "#EFE9DE", ash: "#8C877F", graphite: "#2E2C29",
  orange: "#FF5A1F", ember: "#FFA24A", gold: "#E6B450",
};
const DISPLAY = "Anton";
const MONO = '"IBM Plex Mono"';
const disp = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: DISPLAY, size: 120, color: C.bone, ...o });
const mono = (ctx, s, x, y, o = {}) => text(ctx, s, x, y, { family: MONO, size: 18, weight: 500, color: C.bone, tracking: 3, ...o });
const fmt = (n) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------- data (see facts.md)

// Regular-season points per season, labelled by the year the season ended.
const SEASONS = [
  ["04", 1654], ["05", 2175], ["06", 2478], ["07", 2132], ["08", 2250], ["09", 2304], ["10", 2258],
  ["11", 2111], ["12", 1683], ["13", 2036], ["14", 2089],
  ["15", 1743], ["16", 1920], ["17", 1954], ["18", 2251],
  ["19", 1505], ["20", 1698], ["21", 1126], ["22", 1695], ["23", 1590], ["24", 1822], ["25", 1710], ["26", 1256],
];
const CUM_BEFORE = [];
{
  let sum = 0;
  for (const [, pts] of SEASONS) {
    CUM_BEFORE.push(sum);
    sum += pts;
  }
  console.assert(sum === 43440, `season table sums to ${sum}, expected 43,440`);
}
const ERAS = [
  { city: "CLEVELAND", from: 0, to: 6 }, { city: "MIAMI", from: 7, to: 10 },
  { city: "CLEVELAND", from: 11, to: 14 }, { city: "LOS ANGELES", from: 15, to: 22 },
];
const MILESTONES = [
  { pts: 10000, season: 4, label: "10,000 · YOUNGEST EVER" },
  { pts: 20000, season: 9, label: "20,000 · YOUNGEST EVER" },
  { pts: 32292, season: 15, label: "32,292 · PASSES MICHAEL JORDAN" },
  { pts: 40000, season: 20, label: "40,000 · FIRST PLAYER EVER" },
];
const KAREEM = 38387;
const SERIES = ["L", "L", "W", "L", "W", "W", "W"]; // 2016 Finals, Cleveland's view
const SERIES_T = [48.25, 48.5, 48.75, 49.0, 50.0, 50.5, 56.0]; // Game 7 resolves after the block

// ---------------------------------------------------------------- timeline

const IMPACTS = [
  { t: 8.0, shake: 16, flash: 0.85, color: C.orange, hit: 1.0 },
  { t: 8.5, shake: 6, hit: 0.45 },
  { t: 9.0, shake: 9, flash: 0.08, hit: 0.6 },
  { t: 12.0, shake: 12, flash: 0.12, hit: 0.8 },
  { t: 14.0, shake: 8, hit: 0.5 },
  { t: 32.0, shake: 26, flash: 0.35, color: C.orange, hit: 1.2 },
  { t: 42.0, shake: 5, flash: 0.1, color: C.gold, hit: 0.5 },
  { t: 44.0, shake: 10, hit: 0.7 },
  { t: 48.0, shake: 8, flash: 0.15, hit: 0.6 },
  { t: 49.0, shake: 14, hit: 0.8 },
  { t: 55.0, shake: 30, flash: 0.5, hit: 1.3 },
  { t: 63.0, shake: 8, hit: 0.6 },
  { t: 68.0, shake: 6, hit: 0.45 },
  { t: 68.5, shake: 6, hit: 0.45 },
  { t: 80.0, shake: 28, flash: 0.35, hit: 1.3 },
  { t: 82.0, shake: 14, flash: 0.12, hit: 0.9 },
  { t: 82.5, shake: 14, flash: 0.12, color: C.orange, hit: 0.9 },
];
const DRIBBLES = [1.0, 2.0, 3.0, 4.0, 5.0, 5.5, 6.0, 6.25, 6.5, 6.75, 7.0];
const RAPID = [
  [76.0, "4", "MVPs"], [76.5, "4", "CHAMPIONSHIPS"], [77.0, "10", "FINALS"], [77.5, "23", "SEASONS"],
  [78.0, "1,622", "GAMES"], [78.25, "12,095", "REBOUNDS"], [78.5, "12,016", "ASSISTS"], [78.75, "41", "YEARS OLD"],
];
// The chalk toss (79–80): he appears, claps, throws; the powder is the downbeat at 80.
const CHALK_IN = 79.0, CHALK_CLAP = 79.25, CHALK_TOSS = 79.5;

// ---------------------------------------------------------------- shared drawing

function drawBall(ctx, x, y, r, spin = 0, squash = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + squash * 0.6, 1 - squash);
  ctx.rotate(spin);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
  g.addColorStop(0, C.ember);
  g.addColorStop(0.55, C.orange);
  g.addColorStop(1, "#9E2F0C");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = "rgba(25,10,4,0.85)";
  ctx.lineWidth = Math.max(1, r * 0.055);
  const seam = (fn) => {
    ctx.beginPath();
    fn();
    ctx.stroke();
  };
  seam(() => (ctx.moveTo(-r, 0), ctx.lineTo(r, 0)));
  seam(() => (ctx.moveTo(0, -r), ctx.lineTo(0, r)));
  seam(() => ctx.arc(-r * 1.32, 0, r * 1.02, -1.2, 1.2));
  seam(() => ctx.arc(r * 1.32, 0, r * 1.02, Math.PI - 1.2, Math.PI + 1.2));
  ctx.restore();
}

const quadAt = (p0, p1, p2, u) => ({
  x: (1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0],
  y: (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1],
});
function quadPath(c, p0, p1, p2, u0, u1, steps = 90) {
  for (let i = 0; i <= steps; i++) {
    const p = quadAt(p0, p1, p2, lerp(u0, u1, i / steps));
    i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
  }
}
const polyPath = (pts) => (c) => pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));

function hairline(ctx, x1, y1, x2, y2, color, alpha, width = 1.5, dash = null) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function scrim(ctx, alpha, color = C.ink) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.restore();
}

// ---------------------------------------------------------------- 0–8 s · cold open: a ball in Akron

const FLOOR = 760, BALL_R = 22;

function openBallY(t) {
  if (t < 0.4) return null;
  if (t < DRIBBLES[0]) return lerp(-60, FLOOR - BALL_R, prog(t, 0.4, DRIBBLES[0]) ** 2);
  for (let i = 0; i < DRIBBLES.length - 1; i++) {
    const a = DRIBBLES[i], b = DRIBBLES[i + 1];
    if (t < b) {
      const dt = b - a, u = (t - a) / dt;
      return FLOOR - BALL_R - Math.min(430, 1300 * dt * dt) * 4 * u * (1 - u);
    }
  }
  return FLOOR - BALL_R;
}

function sceneOpen(ctx, t) {
  const cam = lerp(1, 1.12, ease.inOutCubic(prog(t, 0, 7)));
  const fade = 1 - prog(t, 6.9, 7.4);
  scaled(ctx, 960, 700, cam, () => {
    const fl = ease.outExpo(prog(t, 0.2, 1.6));
    hairline(ctx, 960 - 820 * fl, FLOOR, 960 + 820 * fl, FLOOR, C.bone, 0.28 * fade);
    for (const b of DRIBBLES) {
      const u = prog(t, b, b + 0.9);
      if (t < b || u >= 1) continue;
      const rx = 26 + 360 * ease.outExpo(u);
      ctx.save();
      ctx.globalAlpha = 0.75 * (1 - u) * fade;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(960, FLOOR, rx, rx * 0.09, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (t < 7) {
      const y = openBallY(t);
      if (y != null) {
        const lift = clamp((FLOOR - BALL_R - y) / 430);
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - lift);
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(960, FLOOR + 4, BALL_R * (1.3 - lift * 0.6), 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const near = Math.min(...DRIBBLES.map((b) => Math.abs(t - b)));
        drawBall(ctx, 960, y, BALL_R, t * 2.5, 0.22 * Math.exp(-near * 40));
      }
    } else {
      // The last dribble launches the ball at the camera; it fills the frame on the downbeat at 8.0.
      const u = prog(t, 7.0, 8.0);
      const y = lerp(FLOOR - BALL_R, 560, ease.outCubic(u));
      drawBall(ctx, 960, y, BALL_R * 95 ** ease.inCubic(u), 17.5 + u * 3);
    }
  });
  mono(ctx, typed("AKRON, OHIO", t, 1.2, 14), 140, 928, { size: 22, alpha: fade });
  mono(ctx, typed("DECEMBER 30, 1984", t, 2.2, 14), 140, 962, { size: 22, color: C.ash, alpha: fade });
  const ca = prog(t, 3.0, 3.5) * fade;
  mono(ctx, "CAREER POINTS", 1780, 128, { size: 14, color: C.ash, tracking: 5, align: "right", alpha: ca });
  disp(ctx, "0", 1780, 206, { size: 72, align: "right", alpha: ca });
}

// ---------------------------------------------------------------- 8–16 s · the chosen one, #1 pick

function sceneChosen(ctx, t) {
  if (t < 12) {
    // A shot arc sweeps behind the words.
    const au = ease.outCubic(prog(t, 8.0, 9.6));
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - prog(t, 11.2, 11.8));
    glowStroke(ctx, (c) => quadPath(c, [-100, 1040], [900, -360], [2020, 760], 0, au), C.orange, 2, 0.8);
    ctx.restore();

    const exit = ease.inExpo(prog(t, 11.3, 11.9));
    [["THE", 8.0, C.bone], ["CHOSEN", 8.5, C.bone], ["ONE.", 9.0, C.orange]].forEach(([w, t0, col], i) => {
      if (t < t0) return;
      const s = slam(t, t0, 0.35, 1.5);
      const y = 330 + i * 250 - exit * 1300;
      scaled(ctx, 150, y - 100, s.s, () => disp(ctx, w, 150, y, { size: 270, color: col, alpha: s.a, tracking: 2 }));
    });
    const na = 1 - prog(t, 11.3, 11.7);
    mono(ctx, typed("FEBRUARY 2002", t, 9.6, 30), 1780, 690, { align: "right", size: 15, color: C.ash, tracking: 6, alpha: na });
    mono(ctx, typed("A HIGH-SCHOOL JUNIOR, AGE 17,", t, 10.0, 40), 1780, 734, { align: "right", size: 22, alpha: na });
    mono(ctx, typed("ON THE COVER OF A NATIONAL MAGAZINE.", t, 10.5, 40), 1780, 768, { align: "right", size: 22, alpha: na });
    return;
  }

  // 12–16: a giant #1, outlined, then filled orange from the bottom up.
  const exit = ease.inExpo(prog(t, 15.4, 15.95));
  const s = slam(t, 12.0, 0.4, 1.45);
  const fillU = ease.outCubic(prog(t, 12.05, 12.7));
  const base = 900, size = 760, x = 130;
  ctx.save();
  ctx.globalAlpha = 1 - exit;
  ctx.translate(-exit * 400, 0);
  scaled(ctx, 480, 600, s.s, () => {
    disp(ctx, "#1", x, base, { size, stroke: 2.5, alpha: s.a });
    const fy = lerp(base + 10, base - size * 0.8, fillU);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, fy, W, base - fy + 40);
    ctx.clip();
    disp(ctx, "#1", x, base, { size, color: C.orange, alpha: s.a });
    ctx.restore();
  });
  ctx.restore();

  const lines = [
    ["2003 NBA DRAFT", 12.4, 16, C.ash, 6],
    ["FIRST OVERALL PICK", 12.8, 40, C.bone, 2],
    ["CLEVELAND", 13.2, 40, C.bone, 2],
    ["STRAIGHT OUT OF HIGH SCHOOL", 13.6, 40, C.bone, 2],
  ];
  lines.forEach(([str, t0, sz, color, tr], i) =>
    mono(ctx, typed(str, t, t0, 40), 1010, 380 + i * 78 + (i ? 20 : 0), { size: sz, color, tracking: tr, alpha: 1 - exit }));

  // 14.0: a rubber stamp.
  if (t >= 14.0) {
    const st = slam(t, 14.0, 0.25, 1.8);
    ctx.save();
    ctx.globalAlpha = st.a * (1 - exit);
    ctx.translate(1300, 790);
    ctx.rotate(-0.12);
    ctx.scale(st.s, st.s);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 4;
    ctx.strokeRect(-190, -60, 380, 120);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-180, -50, 360, 100);
    disp(ctx, "AGE 18", 0, 30, { size: 84, align: "center", color: C.orange, tracking: 6 });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- 16–42 s · the climb to 43,440

const CH = { x0: 180, x1: 1740, base: 880, barMax: 2500, barH: 330, top: 250, max: 44000 };
const COL_W = (CH.x1 - CH.x0) / SEASONS.length;
const colX = (i) => CH.x0 + COL_W * i;
const cumY = (c) => CH.base - (c / CH.max) * (CH.base - CH.top);
const REC = 19; // 2022-23, the season of the record
const TIE_FRAC = (KAREEM - CUM_BEFORE[REC]) / SEASONS[REC][1];

// When each season's column starts growing: one per beat, a long creep for the record season, then the rest.
const colStart = (i) => (i < REC ? 18 + 0.5 * i : i === REC ? 28 : 34 + 0.5 * (i - REC - 1));

function growth(i, t) {
  if (i !== REC) return ease.outExpo(prog(t, colStart(i), colStart(i) + 0.35));
  // The record season creeps up to exactly 38,387 (a tie), holds, then breaks through on the downbeat at 32.
  if (t < 32) return TIE_FRAC * ease.inOutCubic(prog(t, 28, 31.75));
  return lerp(TIE_FRAC, 1, ease.outExpo(prog(t, 32, 32.4)));
}

function linePoints(g) {
  const pts = [[CH.x0, CH.base]];
  for (let i = 0; i < SEASONS.length && g[i] > 0; i++) {
    pts.push([colX(i) + COL_W * g[i], cumY(CUM_BEFORE[i] + SEASONS[i][1] * g[i])]);
    if (g[i] < 1) break;
  }
  return pts;
}

function resample(pts, n) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(l);
    total += l;
  }
  const out = [];
  let i = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (i < segs.length - 1 && acc + segs[i] < target) acc += segs[i++];
    const u = segs[i] ? clamp((target - acc) / segs[i]) : 0;
    out.push([lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]);
  }
  return out;
}

function sceneClimb(ctx, t) {
  const g = SEASONS.map((_, i) => growth(i, t));
  const cum = g.reduce((s, gi, i) => s + gi * SEASONS[i][1], 0);
  const fadeOut = 1 - prog(t, 40.0, 40.6);

  // Camera: push toward the tip of the line while it chases the record, snap back when it breaks.
  const pts = linePoints(g);
  const [tipX, tipY] = pts[pts.length - 1];
  const z = t < 32 ? ease.inOutCubic(prog(t, 28.0, 31.75)) : 1 - ease.outExpo(prog(t, 32.0, 32.8));
  const zs = lerp(1, 1.7, z);
  const detail = 1 - z; // small labels fade out while the camera is pushed in, so only the line and the record remain
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zs, zs);
  ctx.translate(-lerp(W / 2, tipX, z), -lerp(H / 2, tipY, z));

  // grid + baseline
  [10000, 20000, 30000, 40000].forEach((v, k) => {
    const a = prog(t, 16.8 + k * 0.12, 17.3 + k * 0.12) * fadeOut;
    hairline(ctx, CH.x0, cumY(v), CH.x1, cumY(v), C.ash, 0.3 * a, 1, [2, 6]);
    mono(ctx, `${v / 1000}K`, CH.x0 - 18, cumY(v) + 5, { size: 13, color: C.ash, align: "right", tracking: 1, alpha: 0.8 * a * detail });
  });
  const bu = ease.outExpo(prog(t, 16.4, 17.4));
  hairline(ctx, CH.x0, CH.base, lerp(CH.x0, CH.x1, bu), CH.base, C.bone, 0.6 * fadeOut);

  // one column per season
  SEASONS.forEach(([label, p], i) => {
    const gi = g[i];
    if (gi <= 0) return;
    const drop = ease.inCubic(prog(t, 40.0 + i * 0.025, 40.45 + i * 0.025));
    const h = (p / CH.barMax) * CH.barH * gi * (1 - drop);
    const x = colX(i) + COL_W * 0.14, w = COL_W * 0.72;
    const hot = clamp(1 - (t - colStart(i)) / 0.7); // a fresh column flashes orange
    ctx.save();
    ctx.globalAlpha = fadeOut;
    ctx.fillStyle = "rgba(239,233,222,0.10)";
    ctx.fillRect(x, CH.base - h, w, h);
    ctx.fillStyle = mix(C.bone, C.orange, hot);
    ctx.fillRect(x, CH.base - h - 1, w, 3);
    ctx.restore();
    mono(ctx, `'${label}`, x + w / 2, CH.base + 28, { size: 13, color: C.ash, align: "center", tracking: 0, alpha: clamp(gi * 3) * fadeOut * detail });
    // A season's total shows only while its column grows, then gets out of the way of the milestones.
    const valueFade = 1 - prog(t, (i === REC ? 32.4 : colStart(i)) + 1.2, (i === REC ? 32.4 : colStart(i)) + 1.8);
    mono(ctx, fmt(p), x + w / 2, CH.base - h - 12, { size: 12, align: "center", tracking: 0, alpha: clamp(gi * 2 - 1) * 0.8 * valueFade * detail * fadeOut });
  });

  // eras (cities, not team names)
  ERAS.forEach(({ city, from, to }) => {
    const a = prog(t, colStart(from), colStart(from) + 0.4) * fadeOut * detail;
    if (a <= 0) return;
    const xa = colX(from) + 6, xb = colX(to + 1) - 6, y = CH.base + 52;
    ctx.save();
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = C.ash;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xa, y - 6);
    ctx.lineTo(xa, y);
    ctx.lineTo(xb, y);
    ctx.lineTo(xb, y - 6);
    ctx.stroke();
    ctx.restore();
    mono(ctx, city, (xa + xb) / 2, y + 26, { size: 13, tracking: 5, align: "center", alpha: a * 0.85 });
  });

  // Kareem's record: a dashed line the orange line has to cross.
  const ku = ease.outExpo(prog(t, 28.0, 28.9));
  const ka = (t < 32 ? 1 : 1 - prog(t, 32.6, 33.6)) * fadeOut;
  if (ku > 0 && ka > 0) {
    const y = cumY(KAREEM);
    hairline(ctx, CH.x0, y, lerp(CH.x0, CH.x1, ku), y, C.bone, 0.75 * ka, 1.5, [10, 8]);
    mono(ctx, "38,387 · KAREEM ABDUL-JABBAR · THE RECORD SINCE 1989", CH.x1, y - 22, { size: 15, align: "right", alpha: ka * prog(t, 28.4, 28.8) });
  }

  // milestones, labelled below-right of the line so they never sit on it
  MILESTONES.forEach((m) => {
    if (cum < m.pts) return;
    const a = clamp((cum - m.pts) / 500) * fadeOut;
    const x = colX(m.season) + COL_W * ((m.pts - CUM_BEFORE[m.season]) / SEASONS[m.season][1]);
    const y = cumY(m.pts);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    mono(ctx, m.label, x + 12, y + 30, { size: 13, alpha: a * detail });
  });

  // the cumulative line, with the ball riding its tip
  if (t < 40.4 && pts.length > 1) {
    glowStroke(ctx, polyPath(pts), C.orange, 3.5);
    drawBall(ctx, tipX, tipY, 11, t * 6);
  }
  ctx.restore();

  // ---- screen space
  const ca = prog(t, 16.2, 16.8) * fadeOut;
  mono(ctx, "CAREER POINTS · REGULAR SEASON", 184, 118, { size: 15, color: C.ash, tracking: 5, alpha: ca });
  disp(ctx, fmt(cum), 180, 282, { size: 170, color: t >= 32 ? C.orange : C.bone, alpha: ca, tracking: 2 });

  // the chase: a countdown to the record
  if (t >= 28.3 && t < 32.2) {
    const a = prog(t, 28.3, 28.7) * (1 - prog(t, 31.95, 32.1));
    const g2 = ctx.createLinearGradient(0, 700, 0, H);
    g2.addColorStop(0, "rgba(11,11,13,0)");
    g2.addColorStop(0.5, "rgba(11,11,13,0.85)");
    g2.addColorStop(1, "rgba(11,11,13,0.95)");
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = g2;
    ctx.fillRect(0, 700, W, H - 700);
    ctx.restore();
    mono(ctx, "POINTS TO PASS KAREEM ABDUL-JABBAR", 184, 850, { size: 16, color: C.ash, tracking: 5, alpha: a });
    disp(ctx, fmt(Math.max(1, KAREEM + 1 - cum)), 180, 1010, { size: 150, color: C.orange, alpha: a, tracking: 2 });
  }

  // 32.0: the record falls
  if (t >= 32 && t < 34.3) {
    const a = prog(t, 32.0, 32.08) * (1 - prog(t, 33.8, 34.3));
    scrim(ctx, 0.8 * a);
    const s1 = slam(t, 32.0, 0.35, 1.6), s2 = slam(t, 32.25, 0.35, 1.6);
    scaled(ctx, 960, 470, s1.s, () => disp(ctx, "ALL-TIME", 960, 560, { size: 240, align: "center", alpha: s1.a * a, tracking: 4 }));
    scaled(ctx, 960, 650, s2.s, () => disp(ctx, "SCORING LEADER", 960, 720, { size: 130, align: "center", color: C.orange, alpha: s2.a * a, tracking: 4 }));
    mono(ctx, typed("FEBRUARY 7, 2023", t, 32.6, 30), 960, 800, { size: 22, align: "center", color: C.ash, tracking: 8, alpha: a });
  }

  mono(ctx, typed("MOST POINTS IN NBA HISTORY.", t, 35.6, 40), 184, 336, { size: 24, alpha: fadeOut });
  mono(ctx, typed("+ 8,521 IN THE PLAYOFFS — ALSO NO. 1 ALL-TIME.", t, 36.6, 45), 184, 374, { size: 18, color: C.ash, alpha: fadeOut });

  if (t >= 40.4) morphToRing(ctx, t);
}

// 40.4–42: the line lifts off the chart and curls into the first championship ring.
function morphToRing(ctx, t) {
  const u = ease.inOutCubic(prog(t, 40.4, 42.0));
  const src = resample(linePoints(SEASONS.map(() => 1)), 160);
  const pts = src.map(([x, y], k) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * k) / (src.length - 1);
    return [lerp(x, ringX(0) + Math.cos(ang) * RING_R, u), lerp(y, RING_Y + Math.sin(ang) * RING_R, u)];
  });
  glowStroke(ctx, polyPath(pts), mix(C.orange, C.gold, u), lerp(3.5, 5, u));
}

// ---------------------------------------------------------------- 42–48 s · four rings

const RINGS = [["2012", "MIAMI"], ["2013", "MIAMI"], ["2016", "CLEVELAND"], ["2020", "LOS ANGELES"]];
const RING_Y = 470, RING_R = 118;
const ringX = (i) => 480 + 320 * i;

function sceneRings(ctx, t) {
  // At the end the camera dives into the 2016 ring.
  const zu = ease.inExpo(prog(t, 46.6, 48.0));
  scaled(ctx, ringX(2), RING_Y, lerp(1, 9, zu), () => {
    RINGS.forEach(([year, city], i) => {
      const t0 = 42.0 + i * 0.5;
      const d = i === 0 ? 1 : ease.outCubic(prog(t, t0, t0 + 0.4));
      if (d <= 0) return;
      glowStroke(ctx, (c) => c.arc(ringX(i), RING_Y, RING_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * d), C.gold, 5);
      const sl = slam(t, t0 + 0.1, 0.3, 1.3);
      scaled(ctx, ringX(i), RING_Y, sl.s, () => disp(ctx, year, ringX(i), RING_Y + 26, { size: 72, align: "center", alpha: sl.a }));
      mono(ctx, city, ringX(i), RING_Y + RING_R + 52, { size: 16, tracking: 5, align: "center", alpha: prog(t, t0 + 0.2, t0 + 0.5) });
      mono(ctx, "FINALS MVP", ringX(i), RING_Y + RING_R + 80, { size: 12, tracking: 4, align: "center", color: C.gold, alpha: prog(t, t0 + 0.3, t0 + 0.6) });
    });
  });
  const hf = 1 - prog(t, 46.6, 47.2);
  const hs = slam(t, 44.0, 0.35, 1.4);
  scaled(ctx, 960, 190, hs.s, () => disp(ctx, "4 CHAMPIONSHIPS", 960, 230, { size: 130, align: "center", alpha: hs.a * hf, tracking: 2 }));
  mono(ctx, typed("3 FRANCHISES  ·  4 FINALS MVPs  ·  10 FINALS APPEARANCES", t, 45.0, 50), 960, 850, { size: 18, tracking: 4, align: "center", color: C.ash, alpha: hf });
}

// ---------------------------------------------------------------- 48–60 s · 2016: down 3–1, the block

function drawTracker(ctx, t, cx, cy, s, alpha) {
  if (alpha <= 0) return;
  const box = 150, gap = 22, total = 7 * box + 6 * gap;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  for (let i = 0; i < 7; i++) {
    const x = -total / 2 + i * (box + gap), y = -box / 2;
    mono(ctx, `G${i + 1}`, x + box / 2, y - 18, { size: 16, color: C.ash, align: "center", tracking: 2 });
    ctx.strokeStyle = "rgba(239,233,222,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, box, box);
    const t0 = SERIES_T[i];
    if (t >= t0) {
      const u = ease.outBack(prog(t, t0, t0 + 0.22));
      const win = SERIES[i] === "W";
      ctx.save();
      ctx.translate(x + box / 2, 0);
      ctx.scale(u, u);
      ctx.fillStyle = win ? C.orange : C.graphite;
      ctx.fillRect(-box / 2 + 6, -box / 2 + 6, box - 12, box - 12);
      disp(ctx, SERIES[i], 0, 37, { size: 100, align: "center", color: win ? C.ink : C.ash });
      ctx.restore();
    } else if (i === 6 && t >= 50.9) {
      const blink = 0.5 + 0.5 * Math.sin((t - 50.9) * 12);
      ctx.save();
      ctx.globalAlpha *= blink;
      ctx.strokeStyle = C.orange;
      ctx.strokeRect(x, y, box, box);
      ctx.restore();
      disp(ctx, "?", x + box / 2, 37, { size: 100, align: "center", color: C.orange, alpha: blink });
    }
  }
  ctx.restore();
}

// Full court, top view, 14 px per foot (94 × 50 ft).
const FT = 14, COURT_X = (W - 94 * FT) / 2, COURT_Y = 250;
const fx = (ft) => COURT_X + ft * FT, fy = (ft) => COURT_Y + ft * FT;

function drawCourt(ctx, alpha) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = "rgba(239,233,222,0.36)";
  ctx.lineWidth = 1.5;
  const circle = (x, y, r, a0 = 0, a1 = Math.PI * 2) => {
    ctx.beginPath();
    ctx.arc(fx(x), fy(y), r * FT, a0, a1);
    ctx.stroke();
  };
  ctx.strokeRect(fx(0), fy(0), 94 * FT, 50 * FT);
  ctx.beginPath();
  ctx.moveTo(fx(47), fy(0));
  ctx.lineTo(fx(47), fy(50));
  ctx.stroke();
  circle(47, 25, 6);
  const arcA = Math.atan2(22, 8.95); // where the 3-point arc meets the corner lines
  for (const side of [0, 1]) {
    const base = side ? 94 : 0, dir = side ? -1 : 1, bx = base + dir * 5.25;
    ctx.strokeRect(fx(side ? 94 - 19 : 0), fy(17), 19 * FT, 16 * FT); // lane
    circle(base + dir * 19, 25, 6); // free-throw circle
    circle(bx, 25, 0.75); // rim
    circle(bx, 25, 4, side ? Math.PI / 2 : -Math.PI / 2, side ? Math.PI * 1.5 : Math.PI / 2); // restricted area
    ctx.save();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx(base + dir * 4), fy(22));
    ctx.lineTo(fx(base + dir * 4), fy(28));
    ctx.stroke(); // backboard
    ctx.restore();
    for (const y of [3, 47]) {
      ctx.beginPath();
      ctx.moveTo(fx(base), fy(y));
      ctx.lineTo(fx(base + dir * 14.2), fy(y));
      ctx.stroke();
    }
    if (side) circle(bx, 25, 23.75, Math.PI - arcA, Math.PI + arcA);
    else circle(bx, 25, 23.75, -arcA, arcA);
  }
  ctx.restore();
}

// Stylised Game 7 fast break (positions in feet). Two white dots, one orange dot chasing from behind.
const RUN_A = [[51.0, 40, 16], [52.2, 55, 17], [53.4, 70, 20], [54.2, 76, 22], [55.0, 79, 21], [57.0, 81, 20]];
const RUN_B = [[51.0, 44, 34], [52.2, 58, 33], [53.4, 72, 31], [54.5, 84, 27.5], [55.0, 87.0, 25.9], [55.6, 87.4, 25.6], [57.0, 87.8, 25.2]];
const CHASE = [[51.0, 24, 40], [52.2, 44, 37], [53.4, 64, 33], [54.5, 80.5, 28.2], [55.0, 86.6, 25.7], [55.8, 87.8, 24.9], [57.0, 88.4, 24.4]];
const BLOCK_PT = [87.6, 25.2];

function ballOnCourt(t) {
  const a = track(RUN_A, t), b = track(RUN_B, t);
  if (t < 53.4) return { ...a, h: 0 };
  if (t < 53.75) {
    const u = prog(t, 53.4, 53.75);
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), h: Math.sin(u * Math.PI) * 0.3 };
  }
  if (t < 54.6) return { ...b, h: 0 };
  if (t < 55.0) {
    const u = ease.outCubic(prog(t, 54.6, 55.0));
    return { x: lerp(b.x, BLOCK_PT[0], u), y: lerp(b.y, BLOCK_PT[1], u), h: u };
  }
  const u = ease.outExpo(prog(t, 55.0, 57.0)); // pinned, then knocked back up-court
  return { x: lerp(BLOCK_PT[0], 78, u), y: lerp(BLOCK_PT[1], 14, u), h: 1 - u };
}

function drawRunner(ctx, keys, t, color, r) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  for (let k = 0; k < 24; k++) {
    const t1 = t - k * 0.03, t2 = t - (k + 1) * 0.03;
    if (t2 < keys[0][0]) break;
    const p1 = track(keys, t1), p2 = track(keys, t2);
    ctx.globalAlpha = 0.45 * (1 - k / 24);
    ctx.lineWidth = r * 0.9 * (1 - k / 24);
    ctx.beginPath();
    ctx.moveTo(fx(p1.x), fy(p1.y));
    ctx.lineTo(fx(p2.x), fy(p2.y));
    ctx.stroke();
  }
  const p = track(keys, t);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(fx(p.x), fy(p.y), r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(fx(p.x), fy(p.y), r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return p;
}

function sceneFinals(ctx, t) {
  if (t < 51) {
    const s = slam(t, 48.0, 0.3, 1.4);
    scaled(ctx, 140, 190, s.s, () => disp(ctx, "2016 FINALS", 140, 230, { size: 120, alpha: s.a }));
    mono(ctx, typed("CLEVELAND VS. THE 73–9 DEFENDING CHAMPIONS", t, 48.3, 50), 144, 290, { size: 20, color: C.ash, tracking: 4 });
    drawTracker(ctx, t, 960, 560, 1, 1);
    const [tally, st] = t >= 50.5 ? ["3–3", 50.5] : t >= 50 ? ["3–2", 50] : t >= 49 ? ["DOWN 3–1", 49] : ["", 0];
    if (tally) {
      const ss = slam(t, st, 0.3, 1.5);
      scaled(ctx, 960, 820, ss.s, () =>
        disp(ctx, tally, 960, 880, { size: 150, align: "center", color: tally.startsWith("DOWN") ? C.orange : C.bone, alpha: ss.a }));
    }
    return;
  }

  // Game 7: the chase-down.
  const zu = ease.inOutCubic(prog(t, 52.0, 55.0));
  const zs = lerp(1, 1.45, zu);
  const out = 1 - prog(t, 59.4, 59.95);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zs, zs);
  ctx.translate(-lerp(W / 2, fx(88.75) - 120, zu), -lerp(H / 2, fy(25), zu));
  drawCourt(ctx, prog(t, 51.0, 51.4) * out);
  if (t >= 51.2) {
    ctx.save();
    ctx.globalAlpha = prog(t, 51.2, 51.6) * out;
    drawRunner(ctx, RUN_A, t, C.bone, 9);
    drawRunner(ctx, RUN_B, t, C.bone, 9);
    const p = drawRunner(ctx, CHASE, t, C.orange, 11);
    mono(ctx, "23", fx(p.x) + 16, fy(p.y) - 16, { size: 14, color: C.orange, tracking: 1 });
    const ball = ballOnCourt(t);
    if (t >= 53.4 && t < 53.75) {
      const a = track(RUN_A, 53.4);
      hairline(ctx, fx(a.x), fy(a.y), fx(ball.x), fy(ball.y), C.bone, 0.5, 1, [4, 5]);
    }
    drawBall(ctx, fx(ball.x), fy(ball.y), 6 * (1 + ball.h * 0.6), t * 10);
    if (t >= 55.0 && t < 56.2) {
      const u = prog(t, 55.0, 56.2);
      const bx = fx(BLOCK_PT[0]), by = fy(BLOCK_PT[1]);
      for (let k = 0; k < 16; k++) {
        const ang = hash(k, 3) * Math.PI * 2, r0 = 14 + ease.outExpo(u) * (60 + hash(k, 4) * 120), r1 = r0 + 22 * (1 - u);
        hairline(ctx, bx + Math.cos(ang) * r0, by + Math.sin(ang) * r0, bx + Math.cos(ang) * r1, by + Math.sin(ang) * r1,
          k % 3 ? C.orange : C.bone, 1 - u, 2);
      }
    }
    ctx.restore();
  }
  ctx.restore();

  const ta = 1 - prog(t, 54.9, 55.05);
  const s = slam(t, 51.0, 0.3, 1.4);
  scaled(ctx, 140, 130, s.s, () => disp(ctx, "GAME 7", 140, 170, { size: 110, alpha: s.a * ta }));
  mono(ctx, typed("TIED 89–89 · UNDER TWO MINUTES LEFT", t, 51.3, 40), 144, 212, { size: 20, color: C.ash, tracking: 4, alpha: ta });

  if (t >= 55.0) {
    const a = prog(t, 55.1, 55.3) * out;
    scrim(ctx, 0.62 * a);
    const sl = slam(t, 55.1, 0.4, 1.7);
    const split = 14 * (1 - ease.outExpo(prog(t, 55.1, 55.8)));
    scaled(ctx, 960, 470, sl.s, () => {
      disp(ctx, "THE BLOCK.", 960 - split, 560, { size: 280, align: "center", color: C.orange, alpha: sl.a * a * 0.8, tracking: 4 });
      disp(ctx, "THE BLOCK.", 960 + split * 0.5, 560, { size: 280, align: "center", alpha: sl.a * a, tracking: 4 });
    });
    drawTracker(ctx, t, 960, 730, 0.42, prog(t, 55.7, 56.0) * out);
    mono(ctx, typed("THE FIRST TEAM EVER TO COME BACK FROM 3–1 DOWN IN THE FINALS.", t, 56.5, 45), 960, 880, { size: 22, align: "center", alpha: out });
  }
}

// ---------------------------------------------------------------- 60–76 s · longevity, family, gold

function tallyMark(k) {
  const group = Math.floor(k / 5), idx = k % 5, gx = 502 + group * 210;
  if (idx === 4) return { x1: gx - 22, y1: 600, x2: gx + 3 * 38 + 22, y2: 340, strike: true };
  const x = gx + idx * 38 + (hash(k, 2) - 0.5) * 6;
  return { x1: x + (hash(k, 3) - 0.5) * 10, y1: 300, x2: x, y2: 640, strike: false };
}

function jerseyPath(ctx, x, y, w, h) {
  const P = (u, v) => [x + u * w, y + v * h];
  ctx.beginPath();
  ctx.moveTo(...P(0.3, 0));
  ctx.lineTo(...P(0.38, 0));
  ctx.quadraticCurveTo(...P(0.5, 0.2), ...P(0.62, 0));
  ctx.lineTo(...P(0.7, 0));
  ctx.quadraticCurveTo(...P(0.74, 0.3), ...P(0.98, 0.36));
  ctx.lineTo(...P(0.95, 1));
  ctx.lineTo(...P(0.05, 1));
  ctx.lineTo(...P(0.02, 0.36));
  ctx.quadraticCurveTo(...P(0.26, 0.3), ...P(0.3, 0));
  ctx.closePath();
}

function sceneLongevity(ctx, t) {
  // 60–64: 23 seasons as tally marks, one per sixteenth note.
  if (t < 64.1) {
    const ex = prog(t, 63.8, 64.1);
    ctx.save();
    ctx.globalAlpha = 1 - ex;
    ctx.translate(0, -ex * 120);
    ctx.lineCap = "round";
    for (let k = 0; k < 23; k++) {
      const t0 = 60 + 0.125 * k;
      if (t < t0) break;
      const u = ease.outCubic(prog(t, t0, t0 + 0.1));
      const m = tallyMark(k);
      ctx.strokeStyle = m.strike ? C.orange : C.bone;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(m.x1, m.y1);
      ctx.lineTo(lerp(m.x1, m.x2, u), lerp(m.y1, m.y2, u));
      ctx.stroke();
    }
    ctx.restore();
    const s = slam(t, 63.0, 0.3, 1.4);
    scaled(ctx, 960, 780, s.s, () => disp(ctx, "23 SEASONS", 960, 830, { size: 150, align: "center", alpha: s.a * (1 - ex), tracking: 3 }));
    mono(ctx, typed("THE MOST IN NBA HISTORY", t, 63.4, 40), 960, 890, { size: 20, align: "center", color: C.ash, tracking: 6, alpha: 1 - ex });
    return;
  }

  // 64–68: 1,622 games, one square each.
  if (t < 68) {
    const a = 1 - prog(t, 67.6, 68.0);
    const n = Math.floor(1622 * ease.outCubic(prog(t, 64.0, 66.0)));
    ctx.save();
    ctx.globalAlpha = 0.75 * a;
    ctx.fillStyle = C.bone;
    for (let k = 0; k < Math.min(n, 1621); k++) ctx.fillRect(160 + (k % 58) * 15, 260 + Math.floor(k / 58) * 15, 9, 9);
    if (n >= 1622) {
      const pulse = 1 + 0.5 * Math.exp(-(t - 66) * 3) * Math.abs(Math.sin((t - 66) * 8));
      ctx.globalAlpha = a;
      ctx.fillStyle = C.orange;
      const x = 160 + (1621 % 58) * 15 + 4.5, y = 260 + Math.floor(1621 / 58) * 15 + 4.5;
      ctx.fillRect(x - 4.5 * pulse, y - 4.5 * pulse, 9 * pulse, 9 * pulse);
    }
    ctx.restore();
    disp(ctx, fmt(n), 1140, 470, { size: 200, alpha: a * prog(t, 64.0, 64.2), tracking: 2 });
    disp(ctx, "GAMES", 1144, 580, { size: 96, color: C.ash, alpha: a * prog(t, 64.1, 64.3), tracking: 4 });
    mono(ctx, typed("MOST REGULAR-SEASON GAMES IN NBA HISTORY", t, 66.0, 45), 1144, 650, { size: 18, alpha: a });
    mono(ctx, typed("PASSED ROBERT PARISH IN MARCH 2026", t, 66.6, 45), 1144, 686, { size: 18, color: C.ash, alpha: a });
    return;
  }

  // 68–72: father and son, as two jersey backs.
  if (t < 72) {
    const ex = 1 - prog(t, 71.6, 72.0);
    [[600, 68.0, "23", C.bone], [1320, 68.5, "9", C.orange]].forEach(([x, t0, num, col]) => {
      if (t < t0) return;
      const s = slam(t, t0, 0.35, 1.25);
      scaled(ctx, x, 460, s.s, () => {
        ctx.save();
        ctx.globalAlpha = s.a * ex;
        jerseyPath(ctx, x - 220, 170, 440, 560);
        ctx.fillStyle = C.ink2;
        ctx.fill();
        ctx.strokeStyle = "rgba(239,233,222,0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        disp(ctx, "JAMES", x, 350, { size: 64, align: "center", tracking: 10, alpha: s.a * ex });
        disp(ctx, num, x, 640, { size: 300, align: "center", color: col, alpha: s.a * ex });
      });
    });
    const ds = slam(t, 69.3, 0.3, 1.3);
    scaled(ctx, 960, 850, ds.s, () => disp(ctx, "OCTOBER 22, 2024", 960, 868, { size: 64, align: "center", alpha: ds.a * ex, tracking: 3 }));
    mono(ctx, typed("THE FIRST FATHER AND SON TO PLAY TOGETHER IN AN NBA GAME.", t, 69.8, 45), 960, 920, { size: 20, align: "center", alpha: ex });
    return;
  }

  // 72–76: three Olympic golds swing in on their ribbons.
  const MEDALS = [["2008", "BEIJING"], ["2012", "LONDON"], ["2024", "PARIS"]];
  const R = 105;
  MEDALS.forEach(([year, city], i) => {
    const x = 600 + i * 360, t0 = 72.0 + i * 0.35;
    if (t < t0) return;
    const land = ease.outBack(prog(t, t0, t0 + 0.5));
    const fall = ease.inExpo(prog(t, 75.3 + i * 0.08, 75.9 + i * 0.08));
    const y = lerp(-300, 560, land) + fall * 900;
    const swing = 0.14 * Math.exp(-(t - t0) * 2.5) * Math.sin((t - t0) * 9);
    ctx.save();
    ctx.translate(x, y - 400);
    ctx.rotate(swing);
    ctx.translate(-x, -(y - 400));
    ctx.lineCap = "butt";
    for (const d of [-1, 1]) {
      ctx.strokeStyle = "#26252A";
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(x + d * 55, y - 420);
      ctx.lineTo(x + d * 8, y - R + 6);
      ctx.stroke();
      hairline(ctx, x + d * 55, y - 420, x + d * 8, y - R + 6, C.bone, 0.5, 2);
    }
    const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
    g.addColorStop(0, "#F6D98A");
    g.addColorStop(0.6, "#D3A23A");
    g.addColorStop(1, "#8A6420");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,60,10,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    disp(ctx, year, x, y + 21, { size: 58, align: "center", color: "#3A2A08" });
    ctx.restore();
    mono(ctx, city, x, y + R + 44, { size: 16, align: "center", tracking: 6, alpha: prog(t, t0 + 0.3, t0 + 0.6) * (1 - fall) });
  });
  const hx = 1 - prog(t, 75.4, 75.9);
  const hs = slam(t, 73.4, 0.3, 1.4);
  scaled(ctx, 960, 840, hs.s, () => disp(ctx, "3 OLYMPIC GOLDS", 960, 880, { size: 120, align: "center", alpha: hs.a * hx, tracking: 3 }));
  mono(ctx, typed("PARIS 2024 · TOURNAMENT MVP", t, 74.2, 40), 960, 930, { size: 18, align: "center", color: C.ash, tracking: 6, alpha: hx });
}

// ---------------------------------------------------------------- 76–92 s · build, drop, the name, season 24

const SHOT = [[150, 1000], [980, -330], [1790, 470]];

// ---- the chalk toss (pixel sprite, 14 px per sprite pixel)
const CPX = 14;
const CHALK_X = 960 - (CHALK[0].length * CPX) / 2, CHALK_Y = 910 - CHALK.length * CPX;

// One powder grain k at time t, in sprite pixels (column 12 is the midpoint between the hands).
function powderGrain(k, t) {
  const age = t - CHALK_TOSS - hash(k, 1) * 0.25;
  if (age < 0) return null;
  const ang = -Math.PI / 2 + (hash(k, 2) - 0.5) * 1.3;
  const d = ((18 + hash(k, 3) * 26) * (1 - Math.exp(-age * 1.6))) / 1.6; // fast out, then hangs in the air
  return { gx: 12 + (hash(k, 4) - 0.5) * 18 + Math.cos(ang) * d, gy: 1 + Math.sin(ang) * d, a: 0.5 + hash(k, 5) * 0.5 };
}

function chalkToss(ctx, t) {
  hairline(ctx, 760, CHALK_Y + CHALK.length * CPX, 1160, CHALK_Y + CHALK.length * CPX, C.bone, 0.25 * prog(t, CHALK_IN, CHALK_IN + 0.2));
  drawSprite(ctx, CHALK, PAL, CHALK_X, CHALK_Y, CPX, prog(t, CHALK_IN, CHALK_IN + 0.15), 3);
  ctx.save();
  ctx.fillStyle = PAL.w;
  // 79.25: a puff off each hand as he claps the chalk
  if (t >= CHALK_CLAP) {
    const u = prog(t, CHALK_CLAP, CHALK_CLAP + 0.5);
    for (let k = 0; k < 24; k++) {
      const hand = k % 2 ? 22.5 : 0.5;
      const ang = hash(k, 11) * Math.PI * 2, d = ease.outCubic(u) * (0.6 + hash(k, 12) * 2);
      ctx.globalAlpha = 0.8 * (1 - u);
      ctx.fillRect(Math.round(CHALK_X + (hand + Math.cos(ang) * d) * CPX), Math.round(CHALK_Y + (0.5 + Math.sin(ang) * d - u) * CPX), CPX, CPX);
    }
  }
  // 79.5: the throw
  for (let k = 0; k < 170; k++) {
    const p = powderGrain(k, t);
    if (!p) continue;
    ctx.globalAlpha = p.a;
    ctx.fillRect(Math.round(CHALK_X + Math.round(p.gx) * CPX), Math.round(CHALK_Y + Math.round(p.gy) * CPX), CPX, CPX);
  }
  ctx.restore();
}

// 80.0: every grain of the cloud flies out across the frame, and more with it.
function powderBurst(ctx, t) {
  const u = ease.outExpo(prog(t, 80.0, 80.9));
  const fade = 1 - prog(t, 80.1, 80.95);
  const cx = 960, cy = CHALK_Y - 60;
  const size = CPX * (1 + u * 0.8);
  ctx.save();
  ctx.fillStyle = PAL.w;
  for (let k = 0; k < 420; k++) {
    let x, y, a;
    const p = k < 170 ? powderGrain(k, 79.999) : null;
    if (p) {
      x = CHALK_X + Math.round(p.gx) * CPX;
      y = CHALK_Y + Math.round(p.gy) * CPX;
      a = p.a;
    } else {
      x = cx + (hash(k, 21) - 0.5) * 120;
      y = cy + (hash(k, 22) - 0.5) * 80;
      a = 0.4 + hash(k, 23) * 0.5;
    }
    const ang = Math.atan2(y - cy, x - cx) + (hash(k, 24) - 0.5) * 0.6;
    const dist = u * (250 + hash(k, 25) * 1000);
    ctx.globalAlpha = a * fade;
    ctx.fillRect(Math.round(x + Math.cos(ang) * dist), Math.round(y + Math.sin(ang) * dist), size, size);
  }
  ctx.restore();
}

function sceneFinale(ctx, t) {
  // 79–80: the chalk toss. The powder cloud is the drop.
  if (t >= CHALK_IN && t < 80) {
    chalkToss(ctx, t);
    return;
  }

  // 76–79: every number at once, faster and faster.
  if (t < 80) {
    const u = prog(t, 76, 79);
    const k = ease.inCubic(u);
    const phase = (t - 76) * 0.5 + 3 * 2.5 * u ** 4 / 4; // integral of the speed ramp: streaks never jump
    ctx.save();
    ctx.strokeStyle = C.bone;
    ctx.lineWidth = 2;
    for (let j = 0; j < 64; j++) {
      const ang = hash(j, 1) * Math.PI * 2, speed = 0.3 + hash(j, 2) * 0.7;
      const pos = (hash(j, 3) + phase * speed) % 1;
      const r0 = 180 + pos * 1100, len = 30 + k * 220 * speed;
      ctx.globalAlpha = 0.16 * (0.3 + k);
      ctx.beginPath();
      ctx.moveTo(960 + Math.cos(ang) * r0, 560 + Math.sin(ang) * r0);
      ctx.lineTo(960 + Math.cos(ang) * (r0 + len), 560 + Math.sin(ang) * (r0 + len));
      ctx.stroke();
    }
    ctx.restore();
    const idx = RAPID.findLastIndex(([t0]) => t >= t0);
    if (idx >= 0) {
      const [t0, big, label] = RAPID[idx];
      const s = slam(t, t0, 0.16, 1.3);
      scaled(ctx, 960, 540, lerp(1, 1.12, k) * s.s, () => {
        disp(ctx, big, 960, 640, { size: 330, align: "center", color: idx % 2 ? C.orange : C.bone, alpha: s.a, tracking: 2 });
        mono(ctx, label, 960, 720, { size: 26, align: "center", tracking: 10, alpha: s.a });
      });
    }
    return;
  }

  // 80–82: the powder bursts, 43,440, and the shot that goes in.
  if (t < 82) {
    if (t < 81) powderBurst(ctx, t);
    const au = ease.inOutCubic(prog(t, 80.0, 81.6));
    glowStroke(ctx, (c) => quadPath(c, ...SHOT, 0, au), C.orange, 2.5, 0.9);
    // rim and net at the end of the arc
    const [hx, hy] = SHOT[2];
    const swish = t >= 81.6 ? Math.exp(-(t - 81.6) * 5) * Math.sin((t - 81.6) * 30) : 0;
    ctx.save();
    ctx.globalAlpha = prog(t, 80.2, 80.6);
    ctx.strokeStyle = C.bone;
    ctx.lineWidth = 1.2;
    for (let j = 0; j <= 8; j++) {
      const ang = Math.PI * (j / 8);
      const x0 = hx + Math.cos(ang) * 46, y0 = hy + Math.sin(ang) * 10;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(hx + Math.cos(ang) * 24 + swish * 8 * (j % 2 ? 1 : -1), hy + 86 + swish * 10);
      ctx.stroke();
    }
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 46, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (au < 1) {
      const p = quadAt(...SHOT, au);
      drawBall(ctx, p.x, p.y, 16, t * 8);
    }
    const s = slam(t, 80.0, 0.35, 1.6);
    const split = 16 * (1 - ease.outExpo(prog(t, 80.0, 80.6)));
    scaled(ctx, 960, 520, s.s, () => {
      disp(ctx, "43,440", 960 - split, 640, { size: 330, align: "center", color: C.orange, alpha: s.a * 0.8, tracking: 4 });
      disp(ctx, "43,440", 960 + split * 0.5, 640, { size: 330, align: "center", alpha: s.a, tracking: 4 });
    });
    mono(ctx, typed("REGULAR-SEASON POINTS. THE MOST IN NBA HISTORY.", t, 80.6, 45), 960, 730, { size: 22, align: "center", tracking: 4 });
    return;
  }

  // 82–86: the name.
  if (t < 86) {
    const ex = 1 - prog(t, 85.6, 86.0);
    ctx.save();
    ctx.globalAlpha = 0.35 * ex;
    glowStroke(ctx, (c) => quadPath(c, ...SHOT, 0, 1), C.orange, 2.5, 0.6);
    ctx.restore();
    for (let j = 0; j < 50; j++) {
      const y = 1100 - (((t - 82) * (60 + hash(j, 2) * 120) + hash(j, 3) * 1100) % 1100);
      ctx.save();
      ctx.globalAlpha = ex * (0.3 + 0.5 * Math.abs(Math.sin(t * 3 + j)));
      ctx.fillStyle = j % 3 ? C.orange : C.ember;
      ctx.beginPath();
      ctx.arc(hash(j, 1) * W, y, 1.5 + hash(j, 4) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const push = lerp(1, 1.04, prog(t, 82, 86));
    const s1 = slam(t, 82.0, 0.3, 1.5), s2 = slam(t, 82.5, 0.3, 1.5);
    scaled(ctx, 960, 540, push, () => {
      scaled(ctx, 960, 360, s1.s, () => disp(ctx, "LEBRON", 960, 500, { size: 380, align: "center", alpha: s1.a * ex, tracking: 14 }));
      scaled(ctx, 960, 760, s2.s, () => disp(ctx, "JAMES", 960, 900, { size: 380, align: "center", color: C.orange, alpha: s2.a * ex, tracking: 14 }));
    });
    mono(ctx, typed("AKRON, OHIO · 1984", t, 83.0, 30), 140, 110, { size: 16, color: C.ash, tracking: 6, alpha: ex });
    mono(ctx, typed("NO. 1 ALL-TIME · 2026", t, 83.4, 30), 1780, 110, { size: 16, color: C.ash, tracking: 6, align: "right", alpha: ex });
    return;
  }

  // 86–88.5: season 24.
  const words = [[86.0, 86.5, "SEASON 24.", C.bone, 170], [86.5, 87.0, "PHILADELPHIA.", C.orange, 190], [87.0, 88.0, "NOT FINISHED.", C.bone, 170]];
  words.forEach(([a, b, w, col, size], i) => {
    if (t < a || t >= b) return;
    const s = slam(t, a, 0.25, 1.3);
    const out = i === words.length - 1 ? 1 - prog(t, 87.75, 88.0) : 1;
    scaled(ctx, 960, 560, s.s, () => disp(ctx, w, 960, 620, { size, align: "center", color: col, alpha: s.a * out, tracking: 4 }));
  });

  // 88–90: he materialises as a pixel portrait and blinks once. End card.
  if (t >= 88.0) {
    const fade = 1 - prog(t, 89.5, 90.0);
    const px = 10, blink = t >= 89.1 && t < 89.22;
    ctx.save();
    ctx.globalAlpha = fade;
    drawSprite(ctx, blink ? PORTRAIT_BLINK : PORTRAIT, PAL, 960 - 16 * px, 285, px, prog(t, 88.0, 88.5), 7);
    ctx.restore();
    const ta = prog(t, 88.3, 88.6) * fade;
    [
      "A FAN-MADE TRIBUTE. NOT AFFILIATED WITH THE NBA OR LEBRON JAMES.",
      "STATS AS OF SEPTEMBER 2026 · NBA.COM · LANDOFBASKETBALL.COM",
      "EVERY FRAME AND EVERY SOUND IN THIS FILM WAS GENERATED BY CODE.",
    ].forEach((line, i) => mono(ctx, line, 960, 650 + i * 38, { size: 15, align: "center", color: C.ash, tracking: 3, alpha: ta }));
  }
}

// ---------------------------------------------------------------- frame

function draw(ctx, t) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, H);
  const sh = shake(t, IMPACTS);
  ctx.save();
  ctx.translate(sh.x, sh.y);
  if (t < 8) sceneOpen(ctx, t);
  else if (t < 16) sceneChosen(ctx, t);
  else if (t < 42) sceneClimb(ctx, t);
  else if (t < 48) sceneRings(ctx, t);
  else if (t < 60) sceneFinals(ctx, t);
  else if (t < 76) sceneLongevity(ctx, t);
  else sceneFinale(ctx, t);
  ctx.restore();
  flash(ctx, W, H, t, IMPACTS);
  vignette(ctx, W, H, 0.55);
  grain(ctx, W, H, t, 0.1);
}

// ---------------------------------------------------------------- score (synthesized, F minor, 120 BPM)
// Three ideas make the music his, not a generic trap beat:
//   1. The career melody — each season's points become a note, played the moment its column grows.
//      Better seasons sing higher; the record season hangs on one note until the record falls.
//   2. The cities — the melody's instrument and the percussion follow the team era: Cleveland is
//      industrial (FM bells, anvil), Miami is bright (saw lead, shaker, congas), Los Angeles is a
//      G-funk whistle, and "PHILADELPHIA." gets a bar of Philly soul (four-on-the-floor + strings).
//   3. The "23" motif — scale degrees 2 and 3 (his number), 6 (his other number), then home to F.
//      It returns in every chapter: solo keys, synth lead, gold bells, full brass, and 8-bit to close.

const CHORDS = [
  { notes: [53, 56, 60], root: 41 }, // F minor
  { notes: [53, 56, 61], root: 37 }, // D♭ major
  { notes: [51, 56, 60], root: 44 }, // A♭ major
  { notes: [51, 55, 58], root: 39 }, // E♭ major
];
const chordAt = (t) => CHORDS[Math.floor(Math.max(0, t - 8) / 2) % 4];
const GROOVES = [[8, 28, "full"], [32, 42, "full"], [42, 48, "half"], [56, 60, "full"], [60, 76, "full"], [80, 86, "full"]];
const SILENCES = [[28, 32], [51, 55], [79.75, 80]]; // drums drop out (tension, then the hit)

const F_MINOR = [0, 2, 3, 5, 7, 8, 10];
const scaleNote = (base, deg) => base + 12 * Math.floor(deg / 7) + F_MINOR[((deg % 7) + 7) % 7];
// 1,100 points → F4 … 2,500 points → A♭5
const seasonNote = (pts) => scaleNote(65, Math.round(((pts - 1100) / 1400) * 9));
const eraOf = (i) => ["cle", "mia", "cle", "la"][ERAS.findIndex((e) => i >= e.from && i <= e.to)];
// When each city's percussion plays; the edges follow the column timing (colStart 7 = 21.5, 11 = 23.5, 15 = 25.5).
const ERA_WINDOWS = [[18, 21.5, "cle"], [21.5, 23.5, "mia"], [23.5, 25.5, "cle"], [25.5, 28, "la"], [32, 40, "la"]];

// [start (s), midi note, duration (s)] — G A♭ · D♭ · G A♭ C F
const MOTIF = [[0, 67, 0.25], [0.25, 68, 0.75], [1.0, 61, 1.0], [2.0, 67, 0.25], [2.25, 68, 0.5], [2.75, 72, 0.5], [3.25, 77, 0.75]];
// The same motif, stretched so its first two notes land on "LEBRON" (82.0) and "JAMES" (82.5).
const MOTIF_NAME = [[0, 67, 0.5], [0.5, 68, 1.0], [1.5, 61, 0.5], [2.0, 67, 0.25], [2.25, 68, 0.5], [2.75, 72, 0.5], [3.25, 77, 0.75]];

function motif(t0, play, { notes = MOTIF, shift = 0, stretch = 1 } = {}) {
  let prev = null;
  for (const [dt, n, dur] of notes) {
    const f = midi(n + shift);
    play(t0 + dt * stretch, f, dur * stretch, prev);
    prev = f;
  }
}

// The G-funk whistle: a high sine that glides into each note with a vibrato.
const whistle = (m, out, t0, f, dur, gain, from) =>
  lead(m, out, t0, f * 2, dur, gain, { type: "sine", from: from ? from * 2 : null, glide: 0.07, vibrato: 14, cutoff: 6000 });

async function score(ac) {
  const m = makeMixer(ac);
  const drums = m.bus(0.9, 0.05), low = m.bus(0.7), pads = m.bus(0.3, 0.6), keys = m.bus(0.2, 0.45);
  const melody = m.bus(0.42, 0.4), perc = m.bus(0.55, 0.2), fx = m.bus(0.85, 0.3), sfx = m.bus(0.9, 0.7);

  // ---- drums + 808, bar by bar
  for (const [a, b, style] of GROOVES) {
    for (let bar = a, n = 0; bar < b - 0.01; bar += 2, n++) {
      const step = (s) => bar + s * 0.125;
      if (style === "full") {
        const kicks = [0, 6, 10];
        kicks.forEach((s, k) => {
          kick(m, drums, step(s), 0.95);
          bass808(m, low, step(s), midi(chordAt(step(s)).root), ((kicks[k + 1] ?? 16) - s) * 0.125 * 0.95, 0.75);
        });
        [4, 12].forEach((s) => clap(m, drums, step(s), 0.55));
        for (let s = 0; s < 16; s += 2) hat(m, drums, step(s), s % 4 === 2 ? 0.22 : 0.14);
        if (n % 4 === 3) for (let s = 12; s < 16; s += 0.5) hat(m, drums, step(s), 0.1 + (s - 12) * 0.025); // roll into the next phrase
      } else {
        kick(m, drums, step(0), 1);
        bass808(m, low, step(0), midi(chordAt(step(0)).root), 1.4, 0.7);
        snare(m, drums, step(8), 0.7);
        for (let s = 0; s < 16; s += 2) hat(m, drums, step(s), 0.1);
      }
    }
  }

  // ---- pads, one chord per bar; darker and quieter under the tension sections
  pad(m, pads, 0.5, [midi(29), midi(41)], 7.5, 0.35, 300); // intro drone
  for (let t0 = 8; t0 < 86; t0 += 2) {
    const tense = SILENCES.some(([a, b]) => t0 >= a && t0 < b);
    const cut = SILENCES.find(([a]) => a > t0 && a < t0 + 2);
    const dur = cut && cut[0] >= 79 ? cut[0] - t0 : 2;
    pad(m, pads, t0, chordAt(t0).notes.map(midi), dur, tense ? 0.16 : 0.3, tense ? 500 : 1300);
  }

  // ---- 1. the career melody: one note per season, in the sound of that season's city
  let prev = null;
  SEASONS.forEach(([, pts], i) => {
    if (i === REC) return; // the record season is scored separately below
    const t0 = colStart(i), f = midi(seasonNote(pts)), era = eraOf(i);
    if (era === "cle") fmBell(m, melody, t0, f, 0.32, 3.5, 2.5, 0.9);
    else if (era === "mia") lead(m, melody, t0, f, 0.2, 0.22, { cutoff: 3600 });
    else whistle(m, melody, t0, f, 0.42, 0.2, prev);
    prev = f;
  });
  // The record season: its note pulses on every beat as the line creeps up to Kareem's 38,387…
  const recF = midi(seasonNote(SEASONS[REC][1]));
  for (let b = 0; b < 8; b++) whistle(m, melody, 28 + b * 0.5, recF, 0.2, 0.06 + b * 0.02, null);
  // …and on the downbeat of the record it finally resolves home to F.
  whistle(m, melody, 32.0, midi(77), 1.4, 0.26, recF);
  brass(m, melody, 32.0, midi(53), 0.9, 0.18);
  // After the record, the "23" motif sings on the whistle under "MOST POINTS IN NBA HISTORY".
  motif(36, (t0, f, dur, from) => whistle(m, melody, t0, f, dur, 0.2, from));

  // ---- 2. city percussion under the climb
  for (const [a, b, era] of ERA_WINDOWS) {
    for (let t0 = Math.ceil(a / 0.125) * 0.125; t0 < b - 0.001; t0 += 0.125) {
      const s = Math.round((t0 % 2) / 0.125) % 16;
      if (era === "cle" && s % 4 === 2) anvil(m, perc, t0, 0.13);
      if (era === "mia") {
        shaker(m, perc, t0, s % 2 ? 0.11 : 0.06);
        if ([3, 6, 11, 14].includes(s)) conga(m, perc, t0, s < 8 ? 240 : 320, 0.3);
      }
      if (era === "la" && (s === 4 || s === 12)) snap(m, perc, t0, 0.3);
    }
  }

  // ---- 3. the "23" motif, chapter by chapter
  motif(3.0, (t0, f) => piano(m, keys, t0, f, 0.55, 2.2)); // cold open: solo keys
  motif(12.0, (t0, f, dur, from) => lead(m, melody, t0, f, dur, 0.12, { from, glide: 0.05, vibrato: 10, cutoff: 2600 })); // #1 pick
  [79, 80, 73, 77].forEach((n, i) => bell(m, keys, 42 + i * 0.5, midi(n), 0.4)); // four rings: G A♭ D♭ F
  [77, 80, 84].forEach((n) => bell(m, keys, 44, midi(n), 0.22)); // "4 CHAMPIONSHIPS"
  // father and son: dad plays 2–3 in low brass, the son answers two octaves up in 8-bit
  brass(m, melody, 68.0, midi(55), 0.25, 0.2);
  brass(m, melody, 68.25, midi(56), 0.4, 0.2);
  chip(m, melody, 68.5, midi(79), 0.2, 0.1);
  chip(m, melody, 68.75, midi(80), 0.35, 0.1);
  [77, 80, 84].forEach((n, i) => bell(m, keys, 72 + i * 0.35, midi(n), 0.3)); // medals
  // LEBRON JAMES: the motif on full brass, doubled by a lead an octave up
  motif(82.0, (t0, f, dur) => brass(m, melody, t0, f, dur, 0.26), { notes: MOTIF_NAME, shift: -12 });
  motif(82.0, (t0, f, dur) => lead(m, melody, t0, f, dur, 0.08, { cutoff: 3000 }), { notes: MOTIF_NAME });

  // ---- other melodic layers
  arp(m, keys, 64, 76, 0.09);
  for (let k = 0; k < 23; k++) pluck(m, keys, 60 + 0.125 * k, midi(scaleNote(65, k % 14)), 0.16); // tally marks

  // ---- tension: heartbeat + ticking + a riser into the hit
  const tension = (a, b) => {
    for (let t0 = a; t0 < b - 0.2; t0 += 0.5) heartbeat(m, fx, t0, 0.55);
    for (let t0 = a; t0 < b - 0.1; t0 += 0.25) hat(m, drums, t0, 0.05 + 0.08 * prog(t0, a, b));
    riser(m, fx, a, b, 0.35);
  };
  tension(28, 31.75);
  tension(51, 54.85);
  riser(m, fx, 6, 8, 0.3);
  riser(m, fx, 40.6, 42, 0.18);
  riser(m, fx, 46.6, 48, 0.3);

  // ---- the 2016 series: dull thud for a loss, bright stab for a win
  SERIES.forEach((r, i) => {
    const t0 = SERIES_T[i];
    if (r === "L") kick(m, drums, t0, 0.8);
    else {
      clap(m, drums, t0, 0.6);
      pluck(m, keys, t0, midi(72), 0.25);
      pluck(m, keys, t0, midi(79), 0.2);
    }
  });

  // ---- 76–80 build, the chalk toss, one beat of silence, the drop
  for (let t0 = 76; t0 < 78; t0 += 0.5) kick(m, drums, t0, 0.9);
  for (let t0 = 78; t0 < 79; t0 += 0.25) kick(m, drums, t0, 0.9);
  for (let t0 = 78; t0 < 79; t0 += 0.125) snare(m, drums, t0, 0.3 + 0.3 * prog(t0, 78, 79));
  riser(m, fx, 76, 79.75, 0.45);
  RAPID.forEach(([t0]) => pluck(m, keys, t0, midi(chordAt(t0).notes[0] + 24), 0.18));
  [77, 80, 84, 89].forEach((n, i) => chip(m, melody, CHALK_IN + i * 0.03, midi(n), 0.05, 0.06)); // the sprite materialises
  clap(m, sfx, CHALK_CLAP, 0.9);
  poof(m, sfx, CHALK_CLAP, 0.25);
  poof(m, sfx, CHALK_TOSS, 0.5);

  // ---- PHILADELPHIA: a bar of Philly soul — four-on-the-floor, open hats, octave bass, strings
  for (let t0 = 86; t0 < 87.99; t0 += 0.5) {
    kick(m, drums, t0, 0.85);
    hat(m, drums, t0 + 0.25, 0.16, true);
  }
  for (let t0 = 86, i = 0; t0 < 87.99; t0 += 0.25, i++) {
    const root = t0 < 87.0 ? 41 : 37; // F, then D♭
    lead(m, low, t0, midi(i % 2 ? root + 12 : root), 0.18, 0.35, { cutoff: 900 });
  }
  strings(m, pads, 86.0, [65, 68, 72, 75].map(midi), 1.0, 0.3); // Fm7
  strings(m, pads, 87.0, [61, 65, 68, 72].map(midi), 1.0, 0.3); // D♭maj7
  for (let k = 0; k < 8; k++) lead(m, keys, 86.0 + k * 0.0625, midi(scaleNote(65, k)), 0.06, 0.12, { cutoff: 5000 }); // run into "PHILADELPHIA."
  for (const [t0, n] of [[86.0, 68], [86.5, 72], [87.0, 73]]) {
    brass(m, melody, t0, midi(n), 0.3, 0.2);
    brass(m, melody, t0, midi(77), 0.3, 0.12);
  }

  // ---- end card: the pixel portrait, and the motif once more in 8-bit
  pad(m, pads, 87.9, [41, 53, 56, 60].map(midi), 2.1, 0.22, 700);
  [77, 80, 84, 89].forEach((n, i) => chip(m, melody, 88.0 + i * 0.05, midi(n), 0.06, 0.07));
  motif(88.25, (t0, f, dur) => chip(m, melody, t0, f * 2, dur * 0.9, 0.08), { stretch: 0.45 });
  chip(m, sfx, 89.1, midi(96), 0.04, 0.04); // the blink

  // ---- hits, crowd, the opening dribbles
  for (const im of IMPACTS) impact(m, fx, im.t, im.hit * 0.8);
  crowd(m, fx, 55.1, 59.5, 0.18);
  crowd(m, fx, 80.1, 85.5, 0.12);
  DRIBBLES.forEach((b, i) => bounceSfx(m, sfx, b, i === DRIBBLES.length - 1 ? 1 : 0.7));
}

// 16th-note arpeggio over the current chord.
function arp(m, out, a, b, gain = 0.12) {
  for (let t0 = a, i = 0; t0 < b - 0.01; t0 += 0.125, i++) {
    const ch = chordAt(t0), deg = [0, 1, 2, 3, 2, 1][i % 6];
    pluck(m, out, t0, midi(deg < 3 ? ch.notes[deg] + 12 : ch.notes[0] + 24), gain);
  }
}

export default {
  title: "LeBron James",
  episode: 1,
  width: W,
  height: H,
  duration: DURATION,
  fonts: ['400 100px Anton', '500 20px "IBM Plex Mono"'],
  // Used by the 9:16 frame (render/vertical.js): a hook above the film, the current chapter below it.
  // Cold open (render/coldopen.js): bar 1 shows the chalk toss exploding into 43,440, then rewinds into Akron.
  coldOpen: { from: 79.98, length: 2 },
  // `wide`: chapters the 9:16 reframe keeps at full width: the ball crosses the frame in Akron, and the scoring
  // line climbs from left to right until it passes Kareem's line on the right.
  vertical: { hook: ["I ASKED AI FOR", "A LEBRON FILM."], sub: "IT TURNED HIS 23 SEASONS INTO THE MUSIC", wide: [0, 16, 28, 32] },
  chapters: [
    [0, "AKRON, 1984"], [8, "THE CHOSEN ONE"], [12, "#1 PICK"], [16, "THE CLIMB"], [28, "CHASING KAREEM"],
    [32, "ALL-TIME"], [42, "4 RINGS"], [48, "DOWN 3–1"], [55, "THE BLOCK"], [60, "23 SEASONS"],
    [64, "1,622 GAMES"], [68, "FATHER & SON"], [72, "3 OLYMPIC GOLDS"], [76, "EVERYTHING"],
    [79, "THE CHALK TOSS"], [80, "43,440"], [86, "SEASON 24"], [88, ""],
  ],
  // Short clips for Reels / Shorts / TikTok, each pointing back to the full film (render/render.ts cuts).
  // Each opens on its own best moment, then rewinds into the clip (`coldOpen`, render/coldopen.js). A clip starts
  // on a strong beat (big type, a running count: never a dark chapter opening) and ends on its payoff, not on credits
  // or the next chapter. The sub line starts with the player's name.
  cuts: [
    { name: "chosen", from: 8, to: 15.4, coldOpen: { from: 13.4, length: 2 }, hook: ["THE CHOSEN ONE.", "#1 PICK AT 18."], sub: "LEBRON JAMES · AKRON, OHIO" },
    { name: "kareem", from: 24, to: 36, coldOpen: { from: 31.98, length: 2 }, hook: ["HE CAUGHT KAREEM", "ON THE DOWNBEAT."], sub: "LEBRON JAMES · 23 SEASONS" },
    { name: "block", from: 48, to: 60, coldOpen: { from: 54.98, length: 2 }, hook: ["DOWN 3–1.", "THEN THE BLOCK."], sub: "LEBRON JAMES · 2016 FINALS" },
    { name: "father", from: 63, to: 71.55, coldOpen: { from: 69.48, length: 2 }, hook: ["FATHER AND SON.", "A FIRST IN NBA HISTORY."], sub: "LEBRON JAMES · #23 AND #9" },
    { name: "season24", from: 72, to: 88, coldOpen: { from: 79.98, length: 2 }, hook: ["43,440 POINTS.", "SEASON 24: OCT 20."], sub: "LEBRON JAMES · PHILADELPHIA" },
  ],
  draw,
  score,
};
