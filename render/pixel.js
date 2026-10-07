// Pixel toolkit for the 16-bit style (PIXEL_STYLE.md).
//
// A pixel film draws every frame into a small canvas (180×320 for 9:16) and blits it ×6 with nearest-neighbour,
// so every pixel on screen is a 6×6 block and nothing is ever smoothed. Positions are whole internal pixels.
// The pure helpers (font layout, dither, palette, sprite grids, stepped time) are unit-tested in pixel.test.js;
// the drawing helpers take a 2D context.
import { hash, clamp } from "./kit.js";

export const LOW = { width: 180, height: 320, scale: 6 };

// ---------------------------------------------------------------- canvas

export function lowCanvas(w = LOW.width, h = LOW.height) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Copy the low-res canvas onto the output canvas, every pixel a hard-edged block.
export function blit(ctx, low) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, low.width * LOW.scale, low.height * LOW.scale);
  ctx.restore();
}

// Output pixels → internal pixels (the safe zone and the header are specified in output pixels).
export const toLow = (px) => Math.round(px / LOW.scale);

// Hold animation on a fixed frame rate: sprites step like an old console instead of easing.
export const stepped = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// Integer rectangle (the only primitive the style needs).
export function rect(ctx, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ---------------------------------------------------------------- palette

// Endesga 32 (lospec.com/palette-list/endesga-32), plus the team colours the films need.
export const PAL = {
  ink: "#181425", night: "#262b44", navy: "#3a4466", slate: "#5a6988", steel: "#8b9bb4", mist: "#c0cbdc", white: "#ffffff",
  red: "#e43b44", crimson: "#a22633", wine: "#3e2731", rust: "#be4a2f", orange: "#f77622", amber: "#feae34", yellow: "#fee761",
  green: "#63c74d", grass: "#3e8948", pine: "#265c42", deep: "#193c3e", blue: "#124e89", sky: "#0099db", cyan: "#2ce8f5",
  skin: "#e8b796", skinShade: "#c28569", tan: "#e4a672", brown: "#b86f50", umber: "#733e39", plum: "#68386c", pink: "#b55088",
  rose: "#f6757a", sand: "#ead4aa", hot: "#ff0044",
  celeste: "#6cace4", // Argentina
};

// "#rrggbb" → [r, g, b]
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// The palette colour nearest to an arbitrary one (squared RGB distance).
export function nearest(hex, palette = Object.values(PAL)) {
  const [r, g, b] = rgb(hex);
  let best = palette[0], bd = Infinity;
  for (const c of palette) {
    const [r2, g2, b2] = rgb(c);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bd) [best, bd] = [c, d];
  }
  return best;
}

// ---------------------------------------------------------------- dithering

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Ordered-dither threshold in [0, 1) for a pixel: a pixel is "on" when level > bayer(x, y).
export const bayer = (x, y) => (BAYER4[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)] + 0.5) / 16;

// Fill a rectangle with b over a, mixed at `level` (0 = all a, 1 = all b) in a 4×4 ordered pattern.
export function dither(ctx, x0, y0, w, h, a, b, level) {
  rect(ctx, x0, y0, w, h, a);
  if (level <= 0) return;
  if (level >= 1) return rect(ctx, x0, y0, w, h, b);
  ctx.fillStyle = b;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (level > bayer(x, y)) ctx.fillRect(x, y, 1, 1);
}

// Vertical gradient through a list of colours, dithered between neighbours (no smooth gradients in this style).
export function gradient(ctx, x0, y0, w, h, colors) {
  const n = colors.length - 1;
  for (let y = y0; y < y0 + h; y++) {
    const u = (h <= 1 ? 0 : (y - y0) / (h - 1)) * n;
    const i = Math.min(n - 1, Math.floor(u));
    const f = u - i;
    rect(ctx, x0, y, w, 1, colors[i]);
    ctx.fillStyle = colors[i + 1];
    for (let x = x0; x < x0 + w; x++) if (f > bayer(x, y)) ctx.fillRect(x, y, 1, 1);
  }
}

// ---------------------------------------------------------------- bitmap font (5×7 glyphs in a 6×8 cell)

const GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "#..#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", "..#..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "#": [".#.#.", "#####", ".#.#.", ".#.#.", ".#.#.", "#####", ".#.#."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "*": [".....", "#.#.#", ".###.", "#####", ".###.", "#.#.#", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};
// Typographic characters the copy uses, mapped onto the glyphs above.
const ALIAS = { "’": "'", "‘": "'", "–": "-", "—": "-", "·": "-", "É": "E", "Á": "A", "Ó": "O", "Í": "I", "Ú": "U", "Ñ": "N" };
export const CELL = { w: 6, h: 8 }; // 5×7 glyph + 1 px spacing

export const glyph = (ch) => {
  const u = ch.toUpperCase();
  return GLYPHS[ALIAS[u] ?? u] ?? GLYPHS["?"];
};

// Width in internal pixels of a string at `scale` (no trailing space).
export const textWidth = (str, scale = 1, spacing = 1) => Math.max(0, str.length * (5 + spacing) - spacing) * scale;

// Lit pixels of a string as [x, y] (unscaled, relative to its top-left): the shared core of every text style.
export function textPixels(str, spacing = 1) {
  const out = [];
  [...str].forEach((ch, k) => {
    glyph(ch).forEach((row, j) => {
      for (let i = 0; i < 5; i++) if (row[i] === "#") out.push([k * (5 + spacing) + i, j]);
    });
  });
  return out;
}

// Draw text. o: { scale, color, align: left|center|right, shadow (colour, drawn 1 px down-right ×scale),
// outline (colour, 1 px all round ×scale), bands: [top, mid, bottom] colours by glyph row (a chrome look), spacing }
export function ptext(ctx, str, x, y, o = {}) {
  const s = o.scale ?? 1, spacing = o.spacing ?? 1;
  const w = textWidth(str, s, spacing);
  const x0 = Math.round(o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x), y0 = Math.round(y);
  const px = textPixels(str, spacing);
  if (o.outline) {
    ctx.fillStyle = o.outline;
    for (const [i, j] of px) ctx.fillRect(x0 + (i - 1) * s, y0 + (j - 1) * s, 3 * s, 3 * s);
  }
  if (o.shadow) {
    ctx.fillStyle = o.shadow;
    for (const [i, j] of px) ctx.fillRect(x0 + i * s + s, y0 + j * s + s, s, s);
  }
  for (const [i, j] of px) {
    ctx.fillStyle = o.bands ? o.bands[j < 2 ? 0 : j < 5 ? 1 : 2] : o.color ?? PAL.white;
    ctx.fillRect(x0 + i * s, y0 + j * s, s, s);
  }
  return w;
}

// ---------------------------------------------------------------- sprite grids

// A sprite is an array of strings, one character per pixel ("." = transparent), coloured through a palette
// object. Grids are built in code (figures below) or written by hand.
export function blankGrid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill("."));
}
export const gridRows = (g) => g.map((r) => r.join(""));

// Surround every filled pixel with `key` where it touches transparency (4-neighbour): the dark outline that makes
// 16-bit sprites read against any background.
export function outlineGrid(rows, key = "o") {
  const h = rows.length, w = rows[0].length;
  const g = rows.map((r) => [...r]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (rows[y][x] !== ".") continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => rows[y + dy]?.[x + dx] && rows[y + dy][x + dx] !== ".");
      if (n) g[y][x] = key;
    }
  return gridRows(g);
}

export const flipRows = (rows) => rows.map((r) => [...r].reverse().join(""));

// Draw sprite rows at integer (x, y). palette values may be a colour or fn(x, y) → colour (stripes, patterns).
// o: { flip, flash (draw every pixel in this colour), reveal (0..1, pixels appear in a fixed random order), seed }
export function sprite(ctx, rows, palette, x, y, o = {}) {
  const r = o.flip ? flipRows(rows) : rows;
  const x0 = Math.round(x), y0 = Math.round(y);
  for (let j = 0; j < r.length; j++)
    for (let i = 0; i < r[j].length; i++) {
      const k = r[j][i];
      if (k === ".") continue;
      if (o.reveal != null && o.reveal < 1 && hash(j * 131 + i, o.seed ?? 0) >= o.reveal) continue;
      let c = o.flash ?? palette[k];
      if (typeof c === "function") c = c(i, j);
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x0 + i, y0 + j, 1, 1);
    }
}

// ---------------------------------------------------------------- fighter rig
// A ~50 px tall footballer built from joints, so one rig gives every pose (stance, kick, jump, fall).
// Palette keys: o outline · s skin · S skin shade · h hair · H hair light · k eye/brow · j jersey · J jersey shade ·
// n number · p shorts/pants · P their shade · v socks · b boots · q cap
// look: { hair: "short"|"quiff", beard, number, cap (a baseball cap, visor forward), pants (baseball pants to mid-shin) }

export const FIGHTER = { w: 44, h: 60 };

// Poses face right. Joints are [x, y] on the 44×60 grid; `head` is the top-left of the 8×9 head block.
export const POSES = {
  stance0: { head: [18, 4], neck: [21, 13], hip: [21, 29], lElbow: [26, 20], lHand: [29, 15], rElbow: [16, 20], rHand: [19, 15], lKnee: [26, 40], lFoot: [29, 54], rKnee: [16, 40], rFoot: [13, 54] },
  stance1: { head: [18, 5], neck: [21, 14], hip: [21, 30], lElbow: [26, 21], lHand: [29, 16], rElbow: [16, 21], rHand: [19, 16], lKnee: [27, 41], lFoot: [29, 54], rKnee: [15, 41], rFoot: [13, 54] },
  run0: { head: [22, 5], neck: [24, 14], hip: [22, 30], lElbow: [29, 20], lHand: [31, 25], rElbow: [17, 19], rHand: [14, 23], lKnee: [30, 38], lFoot: [28, 50], rKnee: [16, 41], rFoot: [9, 46] },
  run1: { head: [22, 4], neck: [24, 13], hip: [22, 29], lElbow: [18, 20], lHand: [15, 25], rElbow: [28, 20], rHand: [31, 24], lKnee: [16, 40], lFoot: [11, 50], rKnee: [28, 39], rFoot: [33, 46] },
  kick: { head: [12, 6], neck: [15, 15], hip: [18, 31], lElbow: [10, 21], lHand: [6, 18], rElbow: [21, 20], rHand: [25, 16], lKnee: [28, 28], lFoot: [39, 22], rKnee: [17, 42], rFoot: [16, 54] },
  hit: { head: [11, 7], neck: [15, 15], hip: [19, 30], lElbow: [10, 15], lHand: [7, 10], rElbow: [23, 15], rHand: [27, 10], lKnee: [25, 40], lFoot: [28, 54], rKnee: [17, 41], rFoot: [12, 54] },
  win: { head: [18, 6], neck: [21, 15], hip: [21, 31], lElbow: [27, 9], lHand: [29, 1], rElbow: [15, 9], rHand: [13, 1], lKnee: [24, 42], lFoot: [26, 54], rKnee: [18, 42], rFoot: [16, 54] },
  siuuu: { head: [18, 7], neck: [21, 16], hip: [21, 31], lElbow: [30, 22], lHand: [37, 27], rElbow: [12, 22], rHand: [5, 27], lKnee: [28, 42], lFoot: [33, 54], rKnee: [14, 42], rFoot: [9, 54] },
  jump: { head: [18, 2], neck: [21, 11], hip: [21, 27], lElbow: [27, 6], lHand: [30, 1], rElbow: [15, 6], rHand: [12, 1], lKnee: [26, 35], lFoot: [24, 46], rKnee: [16, 36], rFoot: [18, 47] },
  bicycle: { head: [8, 36], neck: [13, 36], hip: [25, 34], lElbow: [10, 44], lHand: [5, 48], rElbow: [16, 44], rHand: [14, 50], lKnee: [31, 25], lFoot: [37, 14], rKnee: [30, 38], rFoot: [38, 34] },
  down: { head: [2, 47], neck: [11, 50], hip: [26, 51], lElbow: [15, 46], lHand: [19, 44], rElbow: [14, 55], rHand: [19, 57], lKnee: [33, 47], lFoot: [41, 51], rKnee: [33, 54], rFoot: [41, 55] },
  lift: { head: [18, 6], neck: [21, 15], hip: [21, 31], lElbow: [25, 9], lHand: [24, 2], rElbow: [17, 9], rHand: [18, 2], lKnee: [24, 42], lFoot: [26, 54], rKnee: [18, 42], rFoot: [16, 54] },
  // baseball: a batter loaded and through the swing, a pitcher's leg kick and release, a catcher's crouch
  batStance: { head: [16, 5], neck: [19, 14], hip: [19, 30], lElbow: [16, 19], lHand: [13, 14], rElbow: [12, 20], rHand: [13, 15], lKnee: [24, 41], lFoot: [26, 54], rKnee: [14, 41], rFoot: [11, 54] },
  swing: { head: [18, 5], neck: [20, 14], hip: [19, 30], lElbow: [26, 19], lHand: [31, 19], rElbow: [24, 21], rHand: [30, 20], lKnee: [26, 41], lFoot: [29, 54], rKnee: [15, 41], rFoot: [12, 53] },
  windup: { head: [18, 4], neck: [20, 13], hip: [20, 29], lElbow: [17, 19], lHand: [20, 17], rElbow: [23, 19], rHand: [21, 17], lKnee: [27, 26], lFoot: [26, 38], rKnee: [20, 41], rFoot: [20, 54] },
  throw: { head: [25, 9], neck: [24, 17], hip: [19, 31], lElbow: [17, 21], lHand: [12, 25], rElbow: [30, 20], rHand: [35, 24], lKnee: [29, 41], lFoot: [33, 54], rKnee: [13, 40], rFoot: [6, 47] },
  crouch: { head: [14, 22], neck: [16, 30], hip: [14, 42], lElbow: [22, 36], lHand: [26, 32], rElbow: [18, 38], rHand: [22, 40], lKnee: [24, 46], lFoot: [20, 54], rKnee: [8, 46], rFoot: [10, 54] },
};

// Where a pose's hands are on screen, for props (a bat, a ball, a trophy): sprite position + joint, mirrored if flipped.
export function handAt(pose, x, y, flip = false, which = "lHand") {
  const [hx, hy] = POSES[pose][which];
  return [x + (flip ? FIGHTER.w - 1 - hx : hx), y + hy];
}

// A bat: a 2 px line from the hands, `len` long at `angle` radians (0 = pointing right, screen y grows down).
export function bat(ctx, [x, y], angle, len = 15) {
  for (let i = 0; i < len; i++) {
    const px = Math.round(x + Math.cos(angle) * i), py = Math.round(y + Math.sin(angle) * i);
    rect(ctx, px, py, 1, 1, i < 4 ? PAL.umber : PAL.tan);
    rect(ctx, px, py + 1, 1, 1, i < 4 ? PAL.wine : PAL.brown);
  }
}

export function fighterGrid(pose, look = {}) {
  const { w, h } = FIGHTER;
  const g = blankGrid(w, h);
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c;
  };
  const fill = (x0, y0, x1, y1, c) => {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(x0); x <= Math.round(x1); x++) set(x, y, c);
  };
  // A limb: a run of discs along a segment; colour may change along it (fn of 0..1).
  const limb = (a, b, color, r = 1.6) => {
    const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2));
    for (let i = 0; i <= n; i++) {
      const u = i / n, cx = a[0] + (b[0] - a[0]) * u, cy = a[1] + (b[1] - a[1]) * u;
      const c = typeof color === "function" ? color(u) : color;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, c);
    }
  };
  const P = pose;
  const horizontal = Math.abs(P.hip[1] - P.neck[1]) < Math.abs(P.hip[0] - P.neck[0]); // lying or flying
  // back leg and arm first (shaded), front ones last
  const legs = [[P.rKnee, P.rFoot, true], [P.lKnee, P.lFoot, false]];
  const arms = [[P.rElbow, P.rHand, true], [P.lElbow, P.lHand, false]];
  const legDraw = ([knee, foot, back]) => {
    const top = [P.hip[0] + (back ? -2 : 2) * (horizontal ? 0 : 1), P.hip[1] + (horizontal ? (back ? 2 : -2) : 1)];
    if (look.pants) {
      limb(top, knee, back ? "P" : "p", 2.1);
      limb(knee, foot, (u) => (u < 0.45 ? (back ? "P" : "p") : "v"), 1.8);
    } else {
      limb(top, knee, (u) => (u < 0.45 ? (back ? "P" : "p") : back ? "S" : "s"), 2.1);
      limb(knee, foot, (u) => (u < 0.3 ? (back ? "S" : "s") : "v"), 1.7);
    }
    limb(foot, [foot[0] + (horizontal ? 0 : 2), foot[1] + (horizontal ? -2 : 0)], "b", 1.4);
  };
  const armDraw = ([elbow, hand, back]) => {
    const shoulder = horizontal ? [P.neck[0] + 3, P.neck[1] + (back ? 2 : -2)] : [P.neck[0] + (back ? -5 : 5), P.neck[1] + 3];
    limb(shoulder, elbow, (u) => (u < 0.5 ? (back ? "J" : "j") : back ? "S" : "s"), 1.7);
    limb(elbow, hand, back ? "S" : "s", 1.5);
  };
  legDraw(legs[0]);
  armDraw(arms[0]);
  // torso: a tapered block from the shoulders to the hips, along the spine
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const cx = P.neck[0] + (P.hip[0] - P.neck[0]) * u, cy = P.neck[1] + 1 + (P.hip[1] - P.neck[1]) * u;
    const half = 5.6 - u * 1.3;
    if (horizontal) fill(cx, cy - half, cx, cy + half, "j");
    else {
      fill(cx - half, cy, cx + half, cy, "j");
      set(cx + half, cy, "J");
      set(cx - half, cy, "J");
    }
  }
  // shorts
  if (horizontal) fill(P.hip[0] - 2, P.hip[1] - 4, P.hip[0] + 3, P.hip[1] + 4, "p");
  else fill(P.hip[0] - 5, P.hip[1] - 1, P.hip[0] + 5, P.hip[1] + 4, "p");
  // number on the chest (3×5 digits), upright poses only
  if (look.number != null && !horizontal) {
    const digits = String(look.number);
    const width = digits.length * 4 - 1;
    const x0 = Math.round(P.neck[0] - width / 2 + 1), y0 = Math.round(P.neck[1] + 4);
    [...digits].forEach((d, k) => DIGITS3[d].forEach((row, j) => [...row].forEach((c, i) => c === "#" && set(x0 + k * 4 + i, y0 + j, "n"))));
  }
  armDraw(arms[1]);
  legDraw(legs[1]);
  // neck and head (8×9), hair on top, a beard if any; eye and brow face right
  const [hx, hy] = P.head.map(Math.round);
  if (!horizontal) fill(P.neck[0] - 1, hy + 8, P.neck[0] + 1, P.neck[1] + 1, "S");
  fill(hx + 1, hy, hx + 6, hy + 8, "s");
  fill(hx, hy + 1, hx + 7, hy + 7, "s");
  fill(hx, hy + 3, hx, hy + 6, "S"); // back of the head in shade
  // hair
  fill(hx, hy, hx + 7, hy + 1, "h");
  fill(hx, hy + 2, hx + 1, hy + 4, "h");
  if (look.cap) {
    fill(hx, hy - 2, hx + 7, hy + 1, "q");
    fill(hx + 1, hy - 3, hx + 6, hy - 3, "q");
    fill(hx + 6, hy + 2, hx + 10, hy + 2, "q"); // the visor, forward
  } else if (look.hair === "quiff") {
    fill(hx + 2, hy - 2, hx + 7, hy - 1, "h");
    fill(hx + 4, hy - 3, hx + 8, hy - 3, "h");
    set(hx + 6, hy - 2, "H");
    set(hx + 5, hy - 1, "H");
  } else {
    set(hx + 3, hy, "H");
    set(hx + 4, hy, "H");
    set(hx + 8, hy + 1, "h");
  }
  set(hx + 5, hy + 3, "k"); // brow
  set(hx + 6, hy + 3, "k");
  set(hx + 6, hy + 4, "k"); // eye
  set(hx + 7, hy + 6, "S"); // jaw shade
  if (look.beard) {
    fill(hx + 2, hy + 6, hx + 7, hy + 8, "h");
    set(hx + 6, hy + 6, "s");
    set(hx + 7, hy + 6, "s");
    set(hx + 6, hy + 7, "m");
  } else set(hx + 6, hy + 7, "m");
  set(hx + 2, hy + 4, "S"); // ear
  return outlineGrid(gridRows(g), "o");
}

// ---------------------------------------------------------------- bust (select and VS screens)
// A front-facing head and shoulders, defined as shapes in a 32×36 unit space and rasterised at k× (k = 1 for the
// select grid, 2 for the VS screen), so the big version gets real detail instead of fat pixels.
// Palette keys: as the fighter, plus w eye white, c collar trim. look: { hair: "short"|"quiff", beard, stripes }
export const BUST = { w: 32, h: 36 };

export function bustGrid(look = {}, k = 1) {
  const W = BUST.w * k, H = BUST.h * k;
  const ell = (cx, cy, rx, ry) => (u, v) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
  const box = (u0, v0, u1, v1) => (u, v) => u >= u0 && u <= u1 && v >= v0 && v <= v1;
  const head = ell(16, 13.6, 7.3, 9.4);
  const quiff = look.hair === "quiff";
  const layers = [
    // shoulders and shirt: widening from the collar down, shaded on the right
    ["j", (u, v) => v >= 26.5 && Math.abs(u - 16) <= 8.5 + (v - 26.5) * 1.1],
    ["J", (u, v) => v >= 26.5 && u - 16 > 6.2 + (v - 26.5) * 1.1 && u - 16 <= 8.5 + (v - 26.5) * 1.1],
    ["s", box(12.6, 20, 19.4, 28.4)], // neck
    ["S", (u, v) => box(12.6, 20, 19.4, 28.4)(u, v) && (u > 18.2 || v < 23)],
    ["c", (u, v) => v >= 26.5 && v <= 31 && Math.abs(u - 16) <= 4.6 - (v - 26.5) * 0.9 && Math.abs(u - 16) >= 3.3 - (v - 26.5) * 0.9],
    ["s", ell(8.7, 14.6, 1.4, 2.2)], // ears
    ["S", ell(23.3, 14.6, 1.4, 2.2)],
    ["s", head],
    ["S", (u, v) => head(u, v) && (u > 21 || v > 21.6)], // the right side and under the jaw in shade
    // hair
    ["h", quiff ? (u, v) => head(u, v) && v < 7.6 : (u, v) => head(u, v) && v < 8.6 + (u < 16 ? 0.9 : 0)],
    ["h", quiff ? ell(17, 4.6, 6.8, 3.6) : ell(16, 6.2, 7.6, 3.4)],
    ["H", quiff ? ell(18.4, 3.4, 3.2, 1.1) : ell(13.5, 5.2, 2.6, 0.9)],
    ["h", box(8.4, 7.5, 9.8, quiff ? 11 : 13.5)], // sideburns
    ["h", box(22.2, 7.5, 23.6, quiff ? 11 : 13.5)],
    ...(quiff ? [["H", box(8.4, 7.5, 9.4, 10.5)], ["H", box(22.6, 7.5, 23.6, 10.5)]] : []), // faded sides
    // brows, eyes, nose
    ["h", quiff ? (u, v) => box(10.2, 10, 14.2, 11.1)(u, v) && v > 10 + (14.2 - u) * 0.12 : box(10.4, 10.3, 14, 11.1)],
    ["h", quiff ? (u, v) => box(17.8, 10, 21.8, 11.1)(u, v) && v > 10 + (u - 17.8) * 0.12 : box(18, 10.3, 21.6, 11.1)],
    ["w", box(10.9, 12.1, 13.9, 13.4)],
    ["w", box(18.1, 12.1, 21.1, 13.4)],
    ["k", box(12.3, 12.1, 13.6, 13.4)],
    ["k", box(18.4, 12.1, 19.7, 13.4)],
    ["S", box(15.4, 13.6, 16.8, 17.1)],
    ["S", box(14.4, 16.6, 17.8, 17.7)],
    // beard and moustache, then the mouth on top
    ...(look.beard
      ? [["h", (u, v) => head(u, v) && (v > 18.2 || (Math.abs(u - 16) > 5.4 && v > 14.2))], ["H", (u, v) => head(u, v) && v > 21.6 && Math.abs(u - 16) < 3]]
      : []),
    ["m", box(13.2, 19.7, 18.8, 20.7)],
    ...(look.beard ? [] : [["m", box(12.4, 19.1, 13.2, 19.8)], ["m", box(18.8, 19.1, 19.6, 19.8)]]), // a grin
  ];
  const g = blankGrid(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / k, v = (y + 0.5) / k;
      for (const [key, inside] of layers) if (inside(u, v)) g[y][x] = key;
    }
  return outlineGrid(gridRows(g), "o");
}

const DIGITS3 = {
  0: ["###", "#.#", "#.#", "#.#", "###"], 1: [".#.", "##.", ".#.", ".#.", "###"], 2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"], 4: ["#.#", "#.#", "###", "..#", "..#"], 5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"], 7: ["###", "..#", ".#.", ".#.", ".#."], 8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
};

// ---------------------------------------------------------------- game UI

// A bar that fills from the outside in (P1 from the left, P2 mirrored), with a trailing "damage" segment.
// value and trail in 0..1.
export function healthBar(ctx, x, y, w, value, o = {}) {
  const h = o.h ?? 6;
  rect(ctx, x - 1, y - 1, w + 2, h + 2, PAL.ink);
  rect(ctx, x, y, w, h, PAL.wine);
  const fillW = Math.round(w * clamp(value)), trailW = Math.round(w * clamp(o.trail ?? value));
  const at = (len) => (o.flip ? x + w - len : x);
  if (trailW > fillW) rect(ctx, at(trailW), y, trailW, h, PAL.white);
  rect(ctx, at(fillW), y, fillW, h, o.color ?? PAL.amber);
  rect(ctx, at(fillW), y, fillW, 1, o.light ?? PAL.yellow);
  rect(ctx, at(fillW), y + h - 1, fillW, 1, o.dark ?? PAL.orange);
}

// A framed window (RPG/menu box): dark fill, light border, a darker inner border.
export function frame(ctx, x, y, w, h, o = {}) {
  rect(ctx, x, y, w, h, o.border ?? PAL.mist);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, o.inner ?? PAL.navy);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, o.fill ?? PAL.ink);
}

// Scale for a slam-in title in held steps: big → overshoot → 1 (integer-friendly).
export function slamScale(t, t0, from = 3) {
  const k = Math.floor((t - t0) * 24);
  if (k < 0) return 0;
  return [from, Math.max(1, from - 1), 1, 1][Math.min(3, k)];
}

// ---------------------------------------------------------------- chiptune voices (Web Audio)
// Pulse waves at the classic duty cycles, a triangle bass and a noise channel, like a 2A03.

const waves = new WeakMap();
function pulseWave(ac, duty) {
  let m = waves.get(ac);
  if (!m) waves.set(ac, (m = new Map()));
  if (!m.has(duty)) {
    const N = 48, real = new Float32Array(N), imag = new Float32Array(N);
    for (let k = 1; k < N; k++) real[k] = ((2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty));
    m.set(duty, ac.createPeriodicWave(real, imag));
  }
  return m.get(duty);
}

function gate(ac, t, dur, gain, release = 0.01) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.002);
  g.gain.setValueAtTime(gain, t + Math.max(0.003, dur - release));
  g.gain.linearRampToValueAtTime(0, t + dur);
  return g;
}

// Pulse lead/harmony. o: { duty (0.125 | 0.25 | 0.5), vibrato (cents), slide (semitones over the note), decay (0..1 drop) }
export function pulse(m, out, t, freq, dur, gain = 0.1, o = {}) {
  const { ac } = m;
  const osc = ac.createOscillator();
  osc.setPeriodicWave(pulseWave(ac, o.duty ?? 0.25));
  osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.linearRampToValueAtTime(freq * 2 ** (o.slide / 12), t + dur);
  if (o.vibrato) {
    const lfo = ac.createOscillator(), depth = ac.createGain();
    lfo.frequency.value = 6;
    depth.gain.value = freq * (2 ** (o.vibrato / 1200) - 1);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t + Math.min(0.12, dur / 2));
    lfo.stop(t + dur);
  }
  const g = gate(ac, t, dur, gain);
  if (o.decay) g.gain.linearRampToValueAtTime(gain * (1 - o.decay), t + dur * 0.9);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function triangle(m, out, t, freq, dur, gain = 0.25) {
  const { ac } = m;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, t);
  osc.connect(gate(ac, t, dur, gain)).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Noise channel: short = hat, long = snare/crash. `tone` is the high-pass cutoff in Hz.
export function noise(m, out, t, dur, gain = 0.1, tone = 4000) {
  const { ac } = m;
  const src = ac.createBufferSource();
  src.buffer = m.noise;
  const off = hash(Math.round(t * 1000), 23) * (m.noise.duration - dur - 0.1);
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = tone;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  src.connect(hp).connect(g).connect(out);
  src.start(t, off, dur + 0.02);
}

// 8-bit kick: a triangle that drops in pitch fast.
export function kick8(m, out, t, gain = 0.5) {
  const { ac } = m;
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.18);
}

// Coin pickup: two quick pulse notes, the second a fourth up.
export function coin(m, out, t, freq = 988, gain = 0.07) {
  pulse(m, out, t, freq, 0.06, gain, { duty: 0.5 });
  pulse(m, out, t + 0.06, freq * 4 / 3, 0.16, gain, { duty: 0.5, decay: 0.8 });
}

// A hit: noise burst plus a falling pulse.
export function hitSfx(m, out, t, gain = 0.2) {
  noise(m, out, t, 0.18, gain, 700);
  pulse(m, out, t, 330, 0.18, gain * 0.6, { duty: 0.125, slide: -14 });
}

// ---------------------------------------------------------------- house text styles and transitions
// Shared by every pixel film: outlined text in colour bands, a slam-in, and the dither fade from ink.

export const BANDS = {
  gold: [PAL.yellow, PAL.amber, PAL.orange],
  fire: [PAL.yellow, PAL.orange, PAL.red],
  ice: [PAL.white, PAL.celeste, PAL.sky],
  blood: [PAL.rose, PAL.red, PAL.crimson],
  steel: [PAL.white, PAL.mist, PAL.steel],
  royal: [PAL.white, PAL.sky, PAL.blue],
};

// Outlined text in colour bands.
export const bigText = (ctx, str, x, y, scale, bands = BANDS.gold, align = "center") => ptext(ctx, str, x, y, { scale, bands, outline: PAL.ink, align });
// 1× text with a drop shadow.
export const smallText = (ctx, str, x, y, color = PAL.white, align = "center") => ptext(ctx, str, x, y, { color, shadow: PAL.ink, align });

// Slam: drawn three sizes too big for three held frames (24 fps), then settles at `scale`.
export function slamText(ctx, str, x, y, t, t0, scale, bands) {
  if (t < t0) return;
  const k = Math.floor((t - t0) * 24);
  const s = k < 3 ? scale + (3 - k) : scale;
  bigText(ctx, str, x, y - ((s - scale) * 7) / 2, s, bands);
}

// Dither fade from ink over `dur` seconds from t0: the house transition instead of a crossfade.
export function ditherFade(ctx, t, t0, dur, w = LOW.width, h = LOW.height) {
  const level = 1 - clamp((t - t0) / dur);
  if (level <= 0 || t < t0) return;
  ctx.fillStyle = PAL.ink;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (level > bayer(x, y)) ctx.fillRect(x, y, 1, 1);
}

// Darken a band of rows with an ordered-dither veil (level 0..1): the crowd behind the numbers.
export function veil(ctx, y0, y1, level, w = LOW.width) {
  if (level <= 0) return;
  ctx.fillStyle = PAL.ink;
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) if (level > bayer(x, y)) ctx.fillRect(x, y, 1, 1);
}

// Fireworks: `n` bursts that bloom and fall, seeded, in the box [x0, x0 + w) × [y0, y0 + h). age in seconds.
export function fireworks(ctx, x0, y0, w, h, age, n = 3, seed = 1) {
  const cols = [PAL.yellow, PAL.white, PAL.rose, PAL.cyan, PAL.amber];
  for (let b = 0; b < n; b++) {
    const a = age - b * 0.18;
    if (a < 0 || a > 0.9) continue;
    const cx = x0 + Math.floor(hash(b, seed) * w), cy = y0 + Math.floor(hash(b, seed + 1) * h);
    const r = Math.min(12, Math.floor(a * 40)), fall = Math.floor(a * a * 12);
    const c = cols[(b + seed) % cols.length];
    for (let d = 0; d < 12; d++) {
      const ang = (d * Math.PI) / 6;
      rect(ctx, Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r + fall), 1, 1, a > 0.6 && d % 2 ? PAL.slate : c);
    }
  }
}
