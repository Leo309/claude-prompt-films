// Pixel Ronaldo, built with the kit's figure rig from signature traits: the quiff, clean-shaven, #7.
// No crest or sponsor on the shirt. Kits swap by palette (white, Portugal red, Al Nassr yellow).
import { figure } from "../../render/kit.js";

const BASE = {
  h: "#1A1410", // hair
  s: "#C68B5E", // skin
  S: "#A06A43", // skin shadow
  k: "#0B0B0D", // eyes
  m: "#7A3B2A", // mouth
  v: "#F2F0EA", // socks
  b: "#15151A", // boots
};
export const KITS = {
  white: { ...BASE, j: "#F2F0EA", J: "#CFCBC2", n: "#1D2A4A", p: "#F2F0EA" },
  red: { ...BASE, j: "#C8102E", J: "#9A0C23", n: "#F2F0EA", p: "#0E5A2B", v: "#C8102E" },
  yellow: { ...BASE, j: "#F5C400", J: "#C99F00", n: "#1D2A4A", p: "#1D2A4A", v: "#F5C400" },
};

const LOOK = { hair: "quiff", number: 7 };

// Poses on a 24×32 grid (feet at row 30).
export const STANCE = figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [7, 13], lHand: [6, 17], rElbow: [17, 13], rHand: [18, 17],
  lKnee: [8, 24], lFoot: [6, 30], rKnee: [16, 24], rFoot: [18, 30],
}, { ...LOOK, number: null });

export const JUMP = figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18],
  lElbow: [6, 8], lHand: [3, 5], rElbow: [18, 8], rHand: [21, 5],
  lKnee: [9, 22], lFoot: [8, 27], rKnee: [15, 22], rFoot: [16, 27],
}, { ...LOOK, number: null });

export const SPIN = figure({
  head: [12, 2], neck: [12, 9], hip: [12, 18], back: true,
  lElbow: [6, 8], lHand: [3, 5], rElbow: [18, 8], rHand: [21, 5],
  lKnee: [9, 22], lFoot: [8, 27], rKnee: [15, 22], rFoot: [16, 27],
}, LOOK);

// The landing: legs wide, arms driven down and out, chest to the crowd.
export const SIUU = figure({
  head: [12, 3], neck: [12, 10], hip: [12, 19],
  lElbow: [7, 14], lHand: [3, 19], rElbow: [17, 14], rHand: [21, 19],
  lKnee: [7, 25], lFoot: [4, 30], rKnee: [17, 25], rFoot: [20, 30],
}, { ...LOOK, number: null });

// Upright version of the overhead kick (kicking foot above the head); the film tilts it back.
export const BICYCLE = figure({
  head: [12, 10], neck: [12, 16], hip: [12, 23],
  lElbow: [7, 18], lHand: [3, 21], rElbow: [17, 18], rHand: [21, 21],
  lKnee: [9, 27], lFoot: [8, 31], rKnee: [15, 16], rFoot: [17, 3],
}, { ...LOOK, number: null });
