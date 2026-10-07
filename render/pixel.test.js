import { test, expect } from "bun:test";
import { bayer, textWidth, textPixels, glyph, nearest, rgb, stepped, toLow, outlineGrid, flipRows, fighterGrid, FIGHTER, POSES, slamScale, PAL } from "./pixel.js";

test("bayer thresholds cover 16 distinct levels in every 4×4 tile", () => {
  const seen = new Set();
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) seen.add(bayer(x, y));
  expect(seen.size).toBe(16);
  for (const v of seen) expect(v > 0 && v < 1).toBe(true);
  expect(bayer(5, 9)).toBe(bayer(1, 1)); // tiles repeat
  expect(bayer(-3, -2)).toBe(bayer(1, 2)); // negative coordinates wrap too
});

test("text width counts 5 px glyphs and 1 px gaps, times the scale", () => {
  expect(textWidth("A")).toBe(5);
  expect(textWidth("979")).toBe(17);
  expect(textWidth("979", 3)).toBe(51);
  expect(textWidth("")).toBe(0);
});

test("text pixels sit inside each glyph cell", () => {
  const px = textPixels("VS");
  expect(px.length).toBeGreaterThan(10);
  for (const [x, y] of px) {
    expect(y >= 0 && y < 7).toBe(true);
    expect(x % 6 < 5).toBe(true); // never in the 1 px gap
  }
});

test("typographic characters fall back to plain glyphs", () => {
  expect(glyph("’")).toEqual(glyph("'"));
  expect(glyph("–")).toEqual(glyph("-"));
  expect(glyph("é")).toEqual(glyph("E"));
  expect(glyph("~")).toEqual(glyph("?")); // unknown → "?"
});

test("nearest palette colour", () => {
  expect(rgb("#ff0044")).toEqual([255, 0, 68]);
  expect(nearest("#fe0045")).toBe(PAL.hot);
  expect(nearest("#000000")).toBe(PAL.ink);
});

test("stepped time holds frames", () => {
  expect(stepped(0.09, 12)).toBe(1 / 12);
  expect(stepped(0.083, 12)).toBe(0);
  expect(stepped(1, 12)).toBe(1);
});

test("output pixels map onto the 6 px grid", () => {
  expect(toLow(240)).toBe(40);
  expect(toLow(1500)).toBe(250);
  expect(toLow(920)).toBe(153);
});

test("outline wraps filled pixels and leaves the rest", () => {
  expect(outlineGrid(["...", ".x.", "..."], "o")).toEqual([".o.", "oxo", ".o."]);
  expect(flipRows(["ab.", "c.."])).toEqual([".ba", "..c"]);
});

test("every pose builds a full-size fighter with an outline and a head", () => {
  for (const [name, pose] of Object.entries(POSES)) {
    const rows = fighterGrid(pose, { number: 10, beard: true });
    expect(rows.length).toBe(FIGHTER.h);
    for (const r of rows) expect(r.length).toBe(FIGHTER.w);
    const all = rows.join("");
    expect(all.includes("o")).toBe(true);
    expect(all.includes("s")).toBe(true);
    expect(all.includes("j")).toBe(true);
    if (!["bicycle", "down"].includes(name)) expect(all.includes("n")).toBe(true); // the number shows when upright
  }
});

test("slam scale steps down to 1 and stays", () => {
  expect(slamScale(0.9, 1)).toBe(0);
  expect(slamScale(1, 1, 3)).toBe(3);
  expect(slamScale(1.05, 1, 3)).toBe(2);
  expect(slamScale(2, 1, 3)).toBe(1);
});
