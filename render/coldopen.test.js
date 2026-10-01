// bun test render/coldopen.test.js
import { describe, expect, test } from "bun:test";
import { REWIND, filmTime, spliceAudio } from "./coldopen.js";

const film = { duration: 90, coldOpen: { from: 80, length: 2 } };

describe("filmTime", () => {
  test("a film without a cold open plays as is", () => {
    expect(filmTime({ duration: 90 }, 5).t).toBe(5);
  });

  test("clips ignore the cold open", () => {
    expect(filmTime(film, 1, { name: "kareem" }).t).toBe(1);
  });

  test("the cold open shows the payoff, then the film resumes where it left its first bar", () => {
    expect(filmTime(film, 0).t).toBe(80);
    expect(filmTime(film, 0.25).t).toBe(80.25);
    expect(filmTime(film, 0.25).rewind).toBe(0);
    expect(filmTime(film, 2).t).toBe(2);
    expect(filmTime(film, 45).t).toBe(45);
    expect(filmTime(film, 45).resume).toBe(2);
  });

  test("the rewind steps backwards through the film, holding each frame", () => {
    const start = 2 - REWIND;
    const times = [];
    for (let t = start; t < 2; t += 1 / 60) times.push(filmTime(film, t));
    expect(times.every((f) => f.rewind > 0)).toBe(true);
    // never forwards, and always between where the film resumes and where the payoff stopped
    for (let i = 1; i < times.length; i++) expect(times[i].t).toBeLessThanOrEqual(times[i - 1].t);
    expect(times.every((f) => f.t > 2 && f.t <= 80 + start)).toBe(true);
    // held frames: a 60 fps render shows only a handful of distinct rewind frames (no strobing)
    expect(new Set(times.map((f) => f.t)).size).toBeLessThanOrEqual(Math.ceil(REWIND * 12));
  });
});

describe("spliceAudio", () => {
  const rate = 1000; // a low sample rate keeps the test fast; the maths doesn't care
  const n = 4 * rate;
  const sine = (phase) => Float32Array.from({ length: n }, (_, i) => 0.9 * Math.sin(i * 0.37 + phase));
  const co = { from: 3, length: 0.8 };

  test("keeps the length and the channel count", () => {
    const out = spliceAudio([sine(0), sine(1)], rate, co);
    expect(out.length).toBe(2);
    expect(out[0].length).toBe(n);
  });

  test("the first bar plays the payoff, and the film is untouched after the splice", () => {
    const L = sine(0);
    const [out] = spliceAudio([L, sine(1)], rate, co);
    const len = co.length * rate, from = co.from * rate, rewind = REWIND * rate;
    for (let i = 20; i < len - rewind; i++) expect(out[i]).toBeCloseTo(L[from + i], 6);
    for (let i = len + 20; i < n; i++) expect(out[i]).toBeCloseTo(L[i], 6);
  });

  test("never clips", () => {
    const out = spliceAudio([sine(0), sine(1)], rate, co);
    for (const ch of out) expect(Math.max(...ch.map(Math.abs))).toBeLessThanOrEqual(0.9 + 1e-6);
  });
});
