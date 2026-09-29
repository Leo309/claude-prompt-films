// Pixel Messi (and friends), built with the kit's figure rig from signature traits: short hair, the beard he has
// worn since 2017, No. 30 at his debut and No. 10 after. No crests or sponsors. Kits swap by palette.
import { figure } from "../../render/kit.js";

const BASE = { h: "#2E2018", s: "#D9A77F", S: "#B9855E", k: "#0B0B0D", m: "#8A4B35", b: "#15151A" };
export const KITS = {
  kid: { ...BASE, j: "#C8102E", J: "#8E0B20", x: "#15151A", p: "#15151A", v: "#C8102E" }, // Rosario: red and black
  barca: { ...BASE, j: "#A5174F", J: "#7E1039", x: "#1D4FA0", n: "#F2C14E", p: "#1D4FA0", v: "#1D4FA0" },
  argentina: { ...BASE, j: "#75AADB", J: "#5B8FC0", x: "#F2F0EA", n: "#15151A", p: "#15151A", v: "#F2F0EA" },
  shirtless: { ...BASE, j: "#D9A77F", J: "#B9855E", p: "#1D4FA0", v: "#1D4FA0" },
  bisht: { ...BASE, j: "#75AADB", J: "#5B8FC0", x: "#F2F0EA", p: "#15151A", v: "#F2F0EA", B: "#2A2A33", g: "#D9A441" },
  // Ronaldinho: the curls, the headband, the smile (white teeth for a mouth)
  dinho: { ...BASE, h: "#111111", s: "#8B5A3C", S: "#6E4530", m: "#F2F0EA", w: "#F2F0EA", j: "#A5174F", J: "#7E1039", x: "#1D4FA0", n: "#F2C14E", p: "#1D4FA0", v: "#1D4FA0" },
  keeper: { ...BASE, h: "#3A2A1E", j: "#2F7D4A", J: "#22603A", p: "#15151A", v: "#2F7D4A" },
};

// Vertical stripes: every other `width`-pixel column of the jersey ("j") becomes colour "x".
const stripes = (rows, width = 2) => rows.map((r) => [...r].map((c, x) => (c === "j" && Math.floor(x / width) % 2 ? "x" : c)).join(""));
// Newell's-style halves: the jersey right of centre becomes colour "x".
const halves = (rows, cx = 12) => rows.map((r) => [...r].map((c, x) => (c === "j" && x > cx ? "x" : c)).join(""));

// Long curly hair down to the shoulders (drawn only where the grid is empty, so the face stays clear).
function longHair(rows, head) {
  const g = rows.map((r) => [...r]);
  const hx = head[0] - 3, hy = head[1];
  const set = (x, y) => {
    if (g[y] && g[y][x] === ".") g[y][x] = "h";
  };
  for (let x = hx; x <= hx + 5; x++) set(x, hy - 1);
  for (let y = hy - 1; y <= hy + 8; y++) {
    set(hx - 1, y);
    set(hx + 6, y);
    if (y >= hy + 2) {
      set(hx - 2, y);
      set(hx + 7, y);
    }
  }
  return g.map((r) => r.join(""));
}

// The bisht: a black robe with gold trim, open at the front over the shirt (Lusail, 18 December 2022).
function bisht(rows, pose) {
  const g = rows.map((r) => [...r]);
  const cx = pose.neck[0], top = pose.neck[1] + 1, bottom = pose.hip[1] + 6;
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < g[y].length; x++) if ("jJx".includes(g[y][x]) && Math.abs(x - cx) > 1) g[y][x] = "B"; // sleeves
  }
  for (let y = top; y <= bottom && y < g.length; y++) {
    const half = Math.round(5 + ((y - top) / (bottom - top)) * 3);
    for (let x = cx - half; x <= cx + half; x++) {
      const d = Math.abs(x - cx);
      if (d <= 1 || x < 0 || x >= g[y].length) continue;
      g[y][x] = d === 2 || y === bottom ? "g" : "B";
    }
  }
  return g.map((r) => r.join(""));
}

// Index fingers pointing up from both hands.
function fingers(rows, hands) {
  const g = rows.map((r) => [...r]);
  for (const [x, y] of hands) for (const dy of [1, 2]) if (g[y - dy]) g[y - dy][x] = "s";
  return g.map((r) => r.join(""));
}

const KID = { hair: "short" };
const YOUNG = { hair: "short", number: 30 };
const MAN = { hair: "short", beard: true };

// Poses on a 24×32 grid (feet at row 30).
// Rosario, age 10: keepy-uppies. Foot down, and foot up under the ball.
export const KID_DOWN = halves(figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [7, 13], lHand: [6, 16], rElbow: [17, 13], rHand: [18, 16],
  lKnee: [10, 24], lFoot: [9, 30], rKnee: [14, 24], rFoot: [15, 30],
}, KID));
export const KID_UP = halves(figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [7, 12], lHand: [5, 15], rElbow: [17, 12], rHand: [19, 15],
  lKnee: [11, 24], lFoot: [11, 30], rKnee: [16, 21], rFoot: [18, 24],
}, KID));

// 1 May 2005: the run, and the chip.
export const RUN_A = stripes(figure({
  head: [13, 2], neck: [13, 9], hip: [12, 18],
  lElbow: [8, 13], lHand: [6, 10], rElbow: [17, 12], rHand: [19, 15],
  lKnee: [8, 23], lFoot: [5, 27], rKnee: [16, 22], rFoot: [16, 30],
}, { ...YOUNG, number: null }));
export const RUN_B = stripes(figure({
  head: [13, 2], neck: [13, 9], hip: [12, 18],
  lElbow: [8, 12], lHand: [7, 15], rElbow: [17, 13], rHand: [20, 10],
  lKnee: [11, 24], lFoot: [11, 30], rKnee: [16, 22], rFoot: [19, 26],
}, { ...YOUNG, number: null }));
export const CHIP = stripes(figure({
  head: [11, 2], neck: [11, 9], hip: [11, 18],
  lElbow: [6, 11], lHand: [3, 13], rElbow: [16, 11], rHand: [19, 10],
  lKnee: [10, 24], lFoot: [9, 30], rKnee: [16, 21], rFoot: [20, 24],
}, { ...YOUNG, number: null }));
export const KEEPER = figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [6, 8], lHand: [4, 4], rElbow: [18, 8], rHand: [20, 4],
  lKnee: [9, 24], lFoot: [7, 30], rKnee: [15, 24], rFoot: [17, 30],
}, { hair: "short" });

// The celebration: Ronaldinho carries him on his back. The rider is drawn behind and higher, legs out to the sides,
// where Ronaldinho's hands hold them.
const DINHO_POSE = {
  head: [12, 3], neck: [12, 10], hip: [12, 19],
  lElbow: [6, 14], lHand: [4, 11], rElbow: [18, 14], rHand: [20, 11],
  lKnee: [10, 25], lFoot: [9, 30], rKnee: [14, 25], rFoot: [15, 30],
};
export const DINHO = longHair(stripes(figure(DINHO_POSE, { hair: "short", headband: true, number: 10 })), DINHO_POSE.head);
export const RIDE = stripes(figure({
  head: [12, 2], neck: [12, 9], hip: [12, 17],
  lElbow: [6, 7], lHand: [4, 2], rElbow: [18, 7], rHand: [20, 2],
  lKnee: [6, 20], lFoot: [2, 22], rKnee: [18, 20], rFoot: [22, 22],
}, YOUNG));

// 23 April 2017, the Bernabéu: shirt off, held up to the crowd by the shoulders. The shirt itself is drawn in film.js.
export const HOLD_SHIRT_HANDS = [[4, 8], [20, 8]];
export const HOLD_SHIRT = figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [6, 12], lHand: HOLD_SHIRT_HANDS[0], rElbow: [18, 12], rHand: HOLD_SHIRT_HANDS[1],
  lKnee: [10, 24], lFoot: [9, 30], rKnee: [14, 24], rFoot: [15, 30],
}, MAN);

// Lusail: the trophy over his head, in the bisht.
const LIFT_POSE = {
  head: [12, 4], neck: [12, 11], hip: [12, 20],
  lElbow: [6, 6], lHand: [10, 1], rElbow: [18, 6], rHand: [14, 1],
  lKnee: [10, 26], lFoot: [9, 31], rKnee: [14, 26], rFoot: [15, 31],
};
export const LIFT = bisht(stripes(figure(LIFT_POSE, MAN), 2), LIFT_POSE);

// Argentina, No. 10: from behind (walking out one last time), standing, and pointing to the sky.
export const BACK10 = stripes(figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18], back: true,
  lElbow: [8, 13], lHand: [7, 17], rElbow: [16, 13], rHand: [17, 17],
  lKnee: [10, 24], lFoot: [9, 30], rKnee: [14, 24], rFoot: [15, 30],
}, { ...MAN, number: 10 }), 3);
export const STAND = stripes(figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [8, 13], lHand: [7, 17], rElbow: [16, 13], rHand: [17, 17],
  lKnee: [10, 24], lFoot: [9, 30], rKnee: [14, 24], rFoot: [15, 30],
}, MAN), 3);
const POINT_POSE = {
  head: [12, 4], neck: [12, 11], hip: [12, 20],
  lElbow: [7, 8], lHand: [6, 4], rElbow: [17, 8], rHand: [18, 4],
  lKnee: [10, 26], lFoot: [9, 31], rKnee: [14, 26], rFoot: [15, 31],
};
export const POINT = fingers(stripes(figure(POINT_POSE, MAN), 3), [POINT_POSE.lHand, POINT_POSE.rHand]);

// Trophies, drawn as small pixel icons (stylised; not traced from the real ones).
// g gold · G light gold · k dark band · c team colour (set per trophy in film.js)
export const TROPHY = [
  "..gggg..",
  ".gGGGGg.",
  "gGGgGGGg",
  "gGGGGGGg",
  ".gGGGGg.",
  "..gGGg..",
  "...gg...",
  "..gGGg..",
  "..gGGg..",
  ".gGGGGg.",
  ".kkkkkk.",
  "gggggggg",
];
export const CUP = [
  "gGGGGGGGGg",
  "gGGGGGGGGg",
  ".gGGGGGGg.",
  "..gGGGGg..",
  "...gGGg...",
  "....gg....",
  "...gGGg...",
  "..cccccc..",
  "..gggggg..",
];
export const TROPHY_PAL = { g: "#D9A441", G: "#F6D77B", k: "#1F3B2A" };
