// Shared toolkit for code-rendered films: timing, easing, drawing and synth helpers.
//
// Golden rule: everything here is a pure function of time (or of a fixed seed).
// That is what makes the browser preview and the offline render frame-identical,
// and lets the renderer jump to any frame without playing the ones before it.

// ---------------------------------------------------------------- math & timing

export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, u) => a + (b - a) * u;
// 0 → 1 as t goes from a to b (clamped). Most animations are ease.x(prog(t, start, end)).
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => x * x * (3 - 2 * x);

export const ease = {
  outCubic: (x) => 1 - (1 - x) ** 3,
  inCubic: (x) => x ** 3,
  inOutCubic: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  outQuart: (x) => 1 - (1 - x) ** 4,
  outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
  outBack: (x) => {
    const c = 1.70158;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
};

// Seeded PRNG (mulberry32): the same seed gives the same sequence on every run.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless integer hash → [0, 1). Item i always gets the same value, whatever the draw order.
export function hash(i, seed = 0) {
  let x = Math.imul((i | 0) ^ Math.imul(seed | 0, 0x9e3779b1), 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// Smooth 1D value noise in [0, 1).
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  return lerp(hash(i, seed), hash(i + 1, seed), smooth(x - i));
}

// Blend two #rrggbb colours.
export function mix(a, b, u) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, k) => Math.round(lerp(v, pb[k], clamp(u))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// Position along keyframes [[t, x, y], ...] with a Catmull-Rom curve, so paths bend smoothly.
export function track(keys, t) {
  const n = keys.length;
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  if (t >= keys[n - 1][0]) return { x: keys[n - 1][1], y: keys[n - 1][2] };
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const cr = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return { x: cr(p0[1], p1[1], p2[1], p3[1]), y: cr(p0[2], p1[2], p2[2], p3[2]) };
}

// ---------------------------------------------------------------- typography

// Draw text with tracking (letter spacing). Returns nothing; alpha <= 0 draws nothing.
export function text(ctx, str, x, y, o = {}) {
  const {
    family = "sans-serif", size = 48, weight = 400, color = "#fff",
    align = "left", baseline = "alphabetic", tracking = 0, alpha = 1, stroke = 0,
  } = o;
  if (alpha <= 0.001 || !str) return;
  ctx.save();
  ctx.globalAlpha *= clamp(alpha);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  // Canvas also adds tracking after the last glyph; shift so centred/right text stays optically aligned.
  const dx = align === "center" ? tracking / 2 : align === "right" ? tracking : 0;
  if (stroke > 0) {
    ctx.lineWidth = stroke;
    ctx.strokeStyle = color;
    ctx.strokeText(str, x + dx, y);
  } else {
    ctx.fillStyle = color;
    ctx.fillText(str, x + dx, y);
  }
  ctx.restore();
}

export function measure(ctx, str, family, size, tracking = 0, weight = 400) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
  const w = ctx.measureText(str).width - tracking;
  ctx.restore();
  return w;
}

// Typewriter: the part of `str` visible at time t when typing starts at t0.
export const typed = (str, t, t0, cps = 40) => str.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

// Slam-in: scale drops from `from` to 1 with a hard ease-out — the standard "hit" entrance.
export function slam(t, t0, dur = 0.3, from = 1.35) {
  const u = prog(t, t0, t0 + dur);
  return { s: lerp(from, 1, ease.outExpo(u)), a: t < t0 ? 0 : clamp(u * 5) };
}

// Run fn with a uniform scale around (cx, cy).
export function scaled(ctx, cx, cy, s, fn) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

// ---------------------------------------------------------------- light & texture

// Glowing stroke: the same path wide+faint, then thin+bright. Cheaper than shadowBlur.
export function glowStroke(ctx, pathFn, color, width = 3, glow = 1) {
  const base = ctx.globalAlpha;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [w, a] of [[width * 7, 0.05 * glow], [width * 3, 0.14 * glow], [width, 1]]) {
    ctx.globalAlpha = base * a;
    ctx.lineWidth = w;
    ctx.beginPath();
    pathFn(ctx);
    ctx.stroke();
  }
  ctx.restore();
}

// Film grain: a few pre-baked noise tiles, swapped 24 times a second like real film.
const grainCache = new WeakMap();
export function grain(ctx, w, h, t, amount = 0.08) {
  let pats = grainCache.get(ctx);
  if (!pats) {
    pats = [];
    for (let k = 0; k < 6; k++) {
      const c = new OffscreenCanvas(256, 256);
      const g = c.getContext("2d");
      const img = g.createImageData(256, 256);
      const r = rng(1000 + k);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      pats.push(ctx.createPattern(c, "repeat"));
    }
    grainCache.set(ctx, pats);
  }
  const f = Math.floor(t * 24);
  const ox = Math.floor(hash(f, 5) * 256), oy = Math.floor(hash(f, 9) * 256);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = amount;
  ctx.translate(-ox, -oy);
  ctx.fillStyle = pats[((f % pats.length) + pats.length) % pats.length];
  ctx.fillRect(0, 0, w + 256, h + 256);
  ctx.restore();
}

export function vignette(ctx, w, h, strength = 0.5) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.98);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Camera shake from impacts [{t, shake}]: decaying noise, summed over recent hits.
export function shake(t, impacts, seed = 3) {
  let x = 0, y = 0;
  for (const im of impacts) {
    const dt = t - im.t;
    if (!im.shake || dt < 0 || dt > 0.7) continue;
    const a = im.shake * Math.exp(-dt * 8);
    x += (noise1(dt * 45, seed + im.t * 10) - 0.5) * 2 * a;
    y += (noise1(dt * 45, seed + 99 + im.t * 10) - 0.5) * 2 * a;
  }
  return { x, y };
}

// Full-frame flash after impacts [{t, flash, color}]. Keep these isolated (< 3 per second) for photosensitive viewers.
export function flash(ctx, w, h, t, impacts) {
  for (const im of impacts) {
    const dt = t - im.t;
    if (!im.flash || dt < 0 || dt > 0.6) continue;
    ctx.save();
    ctx.globalAlpha = im.flash * Math.exp(-dt * 9);
    ctx.fillStyle = im.color || "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- audio (Web Audio, rendered offline)
// Every instrument below schedules nodes on an OfflineAudioContext at an absolute time.
// Noise comes from a seeded buffer, so the soundtrack is identical on every render.

export const midi = (n) => 440 * 2 ** ((n - 69) / 12);

export function noiseBuffer(ac, seconds = 4, seed = 99) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  const r = rng(seed);
  for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  return buf;
}

function impulseResponse(ac, seconds, decay, seed) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    const r = rng(seed + ch);
    for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

// Master chain: buses → reverb send → glue compressor → limiter → master trim → speakers.
// `level` trims the final output after the limiter (1 = unchanged), for a busy score that runs hot.
export function makeMixer(ac, { level = 1 } = {}) {
  const out = ac.createGain();
  out.gain.value = 0.8;
  const glue = ac.createDynamicsCompressor();
  glue.threshold.value = -16;
  glue.knee.value = 8;
  glue.ratio.value = 4;
  glue.attack.value = 0.005;
  glue.release.value = 0.2;
  const limit = ac.createDynamicsCompressor();
  limit.threshold.value = -3;
  limit.knee.value = 0;
  limit.ratio.value = 20;
  limit.attack.value = 0.001;
  limit.release.value = 0.08;
  const master = ac.createGain();
  master.gain.value = level;
  out.connect(glue).connect(limit).connect(master).connect(ac.destination);

  const verb = ac.createConvolver();
  verb.buffer = impulseResponse(ac, 2.8, 2.2, 21);
  const verbOut = ac.createGain();
  verbOut.gain.value = 0.5;
  verb.connect(verbOut).connect(out);

  const bus = (gain = 1, send = 0) => {
    const g = ac.createGain();
    g.gain.value = gain;
    g.connect(out);
    if (send) {
      const s = ac.createGain();
      s.gain.value = send;
      g.connect(s).connect(verb);
    }
    return g;
  };
  return { ac, out, verb, noise: noiseBuffer(ac), bus };
}

// Exponential attack/decay envelope (exponential ramps can't reach 0, hence 0.0001).
function env(ac, t, { a = 0.002, peak = 1, hold = 0, d = 0.2 }) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  if (hold) g.gain.setValueAtTime(Math.max(peak, 0.0002), t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
  return g;
}

function noiseSrc(m, t, dur, loop = false, salt = 0) {
  const src = m.ac.createBufferSource();
  src.buffer = m.noise;
  src.loop = loop;
  // Start each hit at a different (but deterministic) spot in the noise buffer.
  const off = hash(Math.round(t * 1000) + salt, 17) * (m.noise.duration - Math.min(dur, 3) - 0.1);
  if (loop) src.start(t, off);
  else src.start(t, off, dur + 0.05);
  return src;
}

function filter(ac, type, freq, q = 0.7) {
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function osc(ac, type, t, dur) {
  const o = ac.createOscillator();
  o.type = type;
  o.start(t);
  o.stop(t + dur);
  return o;
}

export function kick(m, out, t, gain = 1) {
  const { ac } = m;
  const o = osc(ac, "sine", t, 0.5);
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  o.connect(env(ac, t, { a: 0.003, peak: gain, d: 0.42 })).connect(out);
  noiseSrc(m, t, 0.02).connect(filter(ac, "highpass", 3000)).connect(env(ac, t, { a: 0.001, peak: 0.25 * gain, d: 0.015 })).connect(out);
}

export function snare(m, out, t, gain = 1) {
  const { ac } = m;
  noiseSrc(m, t, 0.2).connect(filter(ac, "bandpass", 1900, 0.7)).connect(env(ac, t, { peak: 0.8 * gain, d: 0.18 })).connect(out);
  const o = osc(ac, "triangle", t, 0.15);
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.1);
  o.connect(env(ac, t, { peak: 0.4 * gain, d: 0.1 })).connect(out);
}

export function clap(m, out, t, gain = 1) {
  const { ac } = m;
  for (const dt of [0, 0.011, 0.022]) {
    noiseSrc(m, t + dt, 0.03).connect(filter(ac, "bandpass", 1300, 1.2)).connect(env(ac, t + dt, { peak: 0.7 * gain, d: 0.02 })).connect(out);
  }
  noiseSrc(m, t + 0.03, 0.25).connect(filter(ac, "bandpass", 1300, 1)).connect(env(ac, t + 0.03, { peak: 0.5 * gain, d: 0.22 })).connect(out);
}

export function hat(m, out, t, gain = 0.3, open = false) {
  const { ac } = m;
  const d = open ? 0.22 : 0.035;
  noiseSrc(m, t, d + 0.02).connect(filter(ac, "highpass", 7000)).connect(env(ac, t, { a: 0.001, peak: gain, d })).connect(out);
}

// 808-style bass: sine with a short downward glide, softly saturated so it reads on small speakers.
export function bass808(m, out, t, freq, dur = 0.5, gain = 0.8) {
  const { ac } = m;
  const o = osc(ac, "sine", t, dur + 0.1);
  o.frequency.setValueAtTime(freq * 1.8, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.04);
  const shaper = ac.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 2.5);
  shaper.curve = curve;
  o.connect(env(ac, t, { a: 0.005, peak: gain, hold: dur * 0.5, d: dur * 0.5 })).connect(shaper).connect(out);
}

// Warm pad: detuned saws through a low-pass, slow swell in and out.
export function pad(m, out, t, freqs, dur, gain = 0.3, cutoff = 1200) {
  const { ac } = m;
  const lp = filter(ac, "lowpass", cutoff, 0.5);
  const g = ac.createGain();
  const a = Math.min(0.5, dur / 3), r = Math.min(0.9, dur / 2);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain / freqs.length, t + a);
  g.gain.setValueAtTime(gain / freqs.length, t + dur - r);
  g.gain.linearRampToValueAtTime(0, t + dur);
  lp.connect(g).connect(out);
  for (const f of freqs) {
    for (const cents of [-8, 8]) {
      const o = osc(ac, "sawtooth", t, dur + 0.05);
      o.frequency.value = f;
      o.detune.value = cents;
      o.connect(lp);
    }
  }
}

export function pluck(m, out, t, freq, gain = 0.3, dur = 0.28) {
  const { ac } = m;
  const o = osc(ac, "square", t, dur + 0.05);
  o.frequency.value = freq;
  const lp = filter(ac, "lowpass", 5000, 2);
  lp.frequency.setValueAtTime(5000, t);
  lp.frequency.exponentialRampToValueAtTime(500, t + dur);
  o.connect(lp).connect(env(ac, t, { peak: gain, d: dur })).connect(out);
}

// Bell: inharmonic sine partials, the "gold" sound.
export function bell(m, out, t, freq, gain = 0.3) {
  const { ac } = m;
  [[1, 1, 1.8], [2.76, 0.4, 1.0], [5.4, 0.2, 0.5]].forEach(([ratio, amp, d]) => {
    const o = osc(ac, "sine", t, d + 0.1);
    o.frequency.value = freq * ratio;
    o.connect(env(ac, t, { a: 0.002, peak: gain * amp, d })).connect(out);
  });
}

// Noise sweep that builds tension into a hit at t1.
export function riser(m, out, t0, t1, gain = 0.4) {
  const { ac } = m;
  const bp = filter(ac, "bandpass", 250, 2);
  bp.frequency.setValueAtTime(250, t0);
  bp.frequency.exponentialRampToValueAtTime(7000, t1);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t1);
  g.gain.linearRampToValueAtTime(0, t1 + 0.02);
  const n = noiseSrc(m, t0, t1 - t0, true);
  n.stop(t1 + 0.05);
  n.connect(bp).connect(g).connect(out);
  const o = osc(ac, "sine", t0, t1 - t0 + 0.02);
  o.frequency.setValueAtTime(110, t0);
  o.frequency.exponentialRampToValueAtTime(880, t1);
  const og = ac.createGain();
  og.gain.setValueAtTime(0.0001, t0);
  og.gain.exponentialRampToValueAtTime(gain * 0.25, t1);
  o.connect(og).connect(out);
}

// Cinematic hit: kick + long sub boom + a burst of filtered noise.
export function impact(m, out, t, gain = 1) {
  const { ac } = m;
  kick(m, out, t, gain);
  const o = osc(ac, "sine", t, 1.8);
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(28, t + 1.4);
  o.connect(env(ac, t, { a: 0.005, peak: gain * 0.9, d: 1.6 })).connect(out);
  const lp = filter(ac, "lowpass", 1400);
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(150, t + 0.9);
  noiseSrc(m, t, 1).connect(lp).connect(env(ac, t, { a: 0.002, peak: gain * 0.6, d: 0.9 })).connect(out);
}

// A basketball hitting hardwood: short pitched thump + rubbery slap.
export function bounceSfx(m, out, t, gain = 0.8) {
  const { ac } = m;
  const o = osc(ac, "sine", t, 0.25);
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
  o.connect(env(ac, t, { a: 0.002, peak: gain, d: 0.16 })).connect(out);
  noiseSrc(m, t, 0.05).connect(filter(ac, "bandpass", 1000, 1.5)).connect(env(ac, t, { a: 0.001, peak: gain * 0.5, d: 0.03 })).connect(out);
}

export function heartbeat(m, out, t, gain = 0.7) {
  const { ac } = m;
  for (const [dt, g] of [[0, 1], [0.2, 0.7]]) {
    const o = osc(ac, "sine", t + dt, 0.35);
    o.frequency.setValueAtTime(75, t + dt);
    o.frequency.exponentialRampToValueAtTime(40, t + dt + 0.15);
    o.connect(env(ac, t + dt, { a: 0.004, peak: gain * g, d: 0.25 })).connect(out);
  }
}

// Stadium roar: two bands of noise swelling in and out.
export function crowd(m, out, t0, t1, gain = 0.2) {
  const { ac } = m;
  for (const [f, q, k, salt] of [[900, 0.6, 1, 1], [2400, 0.9, 0.5, 2]]) {
    const n = noiseSrc(m, t0, t1 - t0, true, salt);
    n.stop(t1 + 0.1);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain * k, t0 + 0.6);
    g.gain.setValueAtTime(gain * k, t1 - 1.2);
    g.gain.linearRampToValueAtTime(0, t1);
    n.connect(filter(ac, "bandpass", f, q)).connect(g).connect(out);
  }
}

// ---------------------------------------------------------------- more instruments (melodic + world percussion)

// FM bell: a sine whose pitch is wobbled by another sine at a non-integer ratio — metallic, industrial.
export function fmBell(m, out, t, freq, gain = 0.3, ratio = 3.5, index = 3, decay = 1.2) {
  const { ac } = m;
  const car = osc(ac, "sine", t, decay + 0.1);
  car.frequency.value = freq;
  const mod = osc(ac, "sine", t, decay + 0.1);
  mod.frequency.value = freq * ratio;
  const depth = ac.createGain();
  depth.gain.setValueAtTime(freq * index, t);
  depth.gain.exponentialRampToValueAtTime(freq * 0.05, t + decay);
  mod.connect(depth).connect(car.frequency);
  car.connect(env(ac, t, { a: 0.002, peak: gain, d: decay })).connect(out);
}

// Mono lead with optional portamento (`from`: glide in from the previous note) and a vibrato that
// fades in like a singer's. A high sine with glide + vibrato is the West-Coast G-funk "whistle".
export function lead(m, out, t, freq, dur, gain = 0.25, o = {}) {
  const { type = "sawtooth", cutoff = 2400, from = null, glide = 0.08, vibrato = 0, attack = 0.01, release = 0.12 } = o;
  const { ac } = m;
  const v = osc(ac, type, t, dur + release + 0.05);
  v.frequency.setValueAtTime(from ?? freq, t);
  if (from) v.frequency.exponentialRampToValueAtTime(freq, t + glide);
  if (vibrato) {
    const lfo = osc(ac, "sine", t, dur + release + 0.05);
    lfo.frequency.value = 5.5;
    const depth = ac.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(vibrato, t + Math.min(0.3, dur));
    lfo.connect(depth).connect(v.detune);
  }
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + release);
  v.connect(filter(ac, "lowpass", cutoff, 0.8)).connect(g).connect(out);
}

// Brass section: detuned saws + a fifth + a sub octave, with the filter "blat" at the front.
export function brass(m, out, t, freq, dur, gain = 0.3) {
  const { ac } = m;
  const lp = filter(ac, "lowpass", 600, 1);
  lp.frequency.setValueAtTime(600, t);
  lp.frequency.exponentialRampToValueAtTime(3400, t + 0.07);
  lp.frequency.exponentialRampToValueAtTime(1700, t + 0.45);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.03);
  g.gain.linearRampToValueAtTime(gain * 0.75, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + 0.15);
  lp.connect(g).connect(out);
  for (const [ratio, cents] of [[1, -9], [1, 9], [1.5, 0], [0.5, 0]]) {
    const o = osc(ac, "sawtooth", t, dur + 0.25);
    o.frequency.value = freq * ratio;
    o.detune.value = cents;
    o.connect(lp);
  }
}

// Electric-piano-ish: triangle fundamental + two soft sine harmonics + a tiny hammer click.
export function piano(m, out, t, freq, gain = 0.3, decay = 2.4) {
  const { ac } = m;
  [[1, 1], [2, 0.35], [3, 0.12]].forEach(([h, a], k) => {
    const o = osc(ac, k ? "sine" : "triangle", t, decay + 0.1);
    o.frequency.value = freq * h;
    o.detune.value = k === 1 ? 3 : 0;
    o.connect(env(ac, t, { a: 0.004, peak: gain * a, d: decay / (1 + k) })).connect(out);
  });
  noiseSrc(m, t, 0.02).connect(filter(ac, "bandpass", 2500, 1)).connect(env(ac, t, { a: 0.001, peak: gain * 0.08, d: 0.02 })).connect(out);
}

// String section: three detuned saws per note with a shared vibrato — the Philly-soul sweetening.
export function strings(m, out, t, freqs, dur, gain = 0.25) {
  const { ac } = m;
  const lp = filter(ac, "lowpass", 3500, 0.5);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain / freqs.length, t + Math.min(0.35, dur / 3));
  g.gain.setValueAtTime(gain / freqs.length, t + Math.max(0.35, dur - 0.3));
  g.gain.linearRampToValueAtTime(0, t + dur + 0.4);
  lp.connect(g).connect(out);
  const lfo = osc(ac, "sine", t, dur + 0.5);
  lfo.frequency.value = 5;
  const depth = ac.createGain();
  depth.gain.value = 10;
  lfo.connect(depth);
  for (const f of freqs) {
    for (const cents of [-12, 0, 12]) {
      const o = osc(ac, "sawtooth", t, dur + 0.5);
      o.frequency.value = f;
      o.detune.value = cents;
      depth.connect(o.detune);
      o.connect(lp);
    }
  }
}

// 8-bit square blip, straight on/off like an old console.
export function chip(m, out, t, freq, dur = 0.12, gain = 0.12) {
  const { ac } = m;
  const o = osc(ac, "square", t, dur + 0.02);
  o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.setValueAtTime(gain, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(out);
}

export function shaker(m, out, t, gain = 0.1) {
  const { ac } = m;
  noiseSrc(m, t, 0.08).connect(filter(ac, "highpass", 5500)).connect(env(ac, t, { a: 0.012, peak: gain, d: 0.05 })).connect(out);
}

export function conga(m, out, t, freq = 240, gain = 0.35) {
  const { ac } = m;
  const o = osc(ac, "sine", t, 0.25);
  o.frequency.setValueAtTime(freq * 1.35, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
  o.connect(env(ac, t, { a: 0.002, peak: gain, d: 0.18 })).connect(out);
  noiseSrc(m, t, 0.02).connect(filter(ac, "bandpass", 1800, 1)).connect(env(ac, t, { a: 0.001, peak: gain * 0.3, d: 0.015 })).connect(out);
}

// Anvil / factory clank: resonant noise plus two inharmonic partials.
export function anvil(m, out, t, gain = 0.15) {
  const { ac } = m;
  noiseSrc(m, t, 0.1).connect(filter(ac, "bandpass", 2800, 14)).connect(env(ac, t, { a: 0.001, peak: gain * 3, d: 0.08 })).connect(out);
  for (const [f, a] of [[1370, 1], [2930, 0.6]]) {
    const o = osc(ac, "sine", t, 0.15);
    o.frequency.value = f;
    o.connect(env(ac, t, { a: 0.001, peak: gain * a, d: 0.12 })).connect(out);
  }
}

export function snap(m, out, t, gain = 0.3) {
  const { ac } = m;
  noiseSrc(m, t, 0.06).connect(filter(ac, "highpass", 2200)).connect(env(ac, t, { a: 0.001, peak: gain, d: 0.045 })).connect(out);
}

// A soft cloud of powder: filtered noise that opens then closes.
export function poof(m, out, t, gain = 0.4) {
  const { ac } = m;
  const lp = filter(ac, "lowpass", 400, 0.7);
  lp.frequency.setValueAtTime(400, t);
  lp.frequency.exponentialRampToValueAtTime(2600, t + 0.08);
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.6);
  noiseSrc(m, t, 0.7).connect(lp).connect(env(ac, t, { a: 0.03, peak: gain, d: 0.6 })).connect(out);
}

// ---------------------------------------------------------------- pixel sprites

// Draw a sprite from rows of characters (one char per pixel, "." or unknown = transparent).
// reveal < 1 shows only part of the pixels, in a fixed pseudo-random order: a "materialize" effect.
export function drawSprite(ctx, rows, palette, x, y, px, reveal = 1, seed = 0) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const c = palette[row[i]];
      if (!c || (reveal < 1 && hash(j * 131 + i, seed) >= reveal)) continue;
      ctx.fillStyle = c;
      // +1 px overlap so no hairline seams show when the sprite is scaled or rotated
      ctx.fillRect(Math.round(x + i * px), Math.round(y + j * px), Math.ceil(px) + 1, Math.ceil(px) + 1);
    }
  }
}

// ---------------------------------------------------------------- pixel figures (a tiny rig)
// Describe a pose with joints on a small grid and a "look", get sprite rows back for drawSprite.
// Every athlete in the series reuses this: change the look (hair, beard, kit colours, number) and the pose.

const DIGITS = {
  0: ["nnn", "n.n", "n.n", "n.n", "nnn"], 1: [".n.", "nn.", ".n.", ".n.", "nnn"], 2: ["nnn", "..n", "nnn", "n..", "nnn"],
  3: ["nnn", "..n", "nnn", "..n", "nnn"], 4: ["n.n", "n.n", "nnn", "..n", "..n"], 5: ["nnn", "n..", "nnn", "..n", "nnn"],
  6: ["nnn", "n..", "nnn", "n.n", "nnn"], 7: ["nnn", "..n", ".n.", ".n.", ".n."], 8: ["nnn", "n.n", "nnn", "n.n", "nnn"],
  9: ["nnn", "n.n", "nnn", "..n", "nnn"],
};

// pose: { head:[x,y], neck, hip, lElbow, lHand, rElbow, rHand, lKnee, lFoot, rKnee, rFoot, back? }  (grid coords)
// look: { hair: "short"|"quiff"|"bald", beard, headband, number }  — colours come from the palette keys below.
// Palette keys used: h hair · s skin · S skin shadow · k eyes · m mouth · w headband · j jersey · J jersey shade
//                    n number · p shorts · v socks · b boots
export function figure(pose, look = {}, w = 24, h = 32) {
  const g = Array.from({ length: h }, () => Array(w).fill("."));
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c;
  };
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c);
  };
  // Thick line between two joints; colour can change along the limb (fn of 0..1).
  const limb = (a, b, color, thick = 2) => {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1) * 2;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
      for (let dx = 0; dx < thick; dx++) set(x + dx - (thick - 1) / 2, y, typeof color === "function" ? color(u) : color);
    }
  };
  const { head, neck, hip } = pose;
  const back = !!pose.back;
  // legs: shorts → skin → socks, boots at the foot
  for (const [knee, foot, side] of [[pose.lKnee, pose.lFoot, -1], [pose.rKnee, pose.rFoot, 1]]) {
    const top = [hip[0] + side * 2, hip[1] + 1];
    limb(top, knee, (u) => (u < 0.5 ? "p" : "s"), 3);
    limb(knee, foot, (u) => (u < 0.35 ? "s" : "v"), 2);
    rect(Math.round(foot[0]) - 1, Math.round(foot[1]), Math.round(foot[0]) + 1, Math.round(foot[1]), "b");
  }
  rect(hip[0] - 3, hip[1] - 1, hip[0] + 3, hip[1] + 2, "p"); // shorts
  // torso: shoulders 9 wide tapering to 7 at the waist, shaded on one side
  for (let y = neck[1] + 1; y <= hip[1] - 1; y++) {
    const u = (y - neck[1]) / Math.max(1, hip[1] - neck[1]);
    const half = Math.round(4.5 - u * 1.2);
    const cx = Math.round(neck[0] + (hip[0] - neck[0]) * u);
    rect(cx - half, y, cx + half, y, "j");
    set(cx + half, y, "J");
  }
  // number (big on the back, small-ish on the front)
  if (look.number != null) {
    const digits = String(look.number).split("");
    const cx = Math.round((neck[0] + hip[0]) / 2), top = neck[1] + (back ? 3 : 3);
    const width = digits.length * 4 - 1;
    digits.forEach((d, k) => DIGITS[d].forEach((row, j) => [...row].forEach((c, i) => c === "n" && set(cx - Math.floor(width / 2) + k * 4 + i, top + j, "n"))));
  }
  // arms: sleeve → skin
  for (const [elbow, hand, side] of [[pose.lElbow, pose.lHand, -1], [pose.rElbow, pose.rHand, 1]]) {
    const shoulder = [neck[0] + side * 4, neck[1] + 2];
    limb(shoulder, elbow, (u) => (u < 0.4 ? "j" : "s"), 2);
    limb(elbow, hand, "s", 2);
  }
  // head: 6×7 block
  const hx = Math.round(head[0]) - 3, hy = Math.round(head[1]);
  rect(hx, hy, hx + 5, hy + 6, "s");
  rect(neck[0] - 1, hy + 7, neck[0] + 1, neck[1], "S");
  if (back) rect(hx, hy, hx + 5, hy + 5, "h");
  else {
    if (look.hair !== "bald") rect(hx, hy, hx + 5, hy + 1, "h");
    if (look.hair === "quiff") rect(hx + 1, hy - 1, hx + 4, hy - 1, "h");
    set(hx + 1, hy + 3, "k");
    set(hx + 4, hy + 3, "k");
    set(hx + 5, hy + 2, "S");
    set(hx + 5, hy + 3, "S");
    if (look.beard) rect(hx, hy + 4, hx + 5, hy + 6, "h");
    set(hx + 2, hy + 5, "m");
    set(hx + 3, hy + 5, "m");
  }
  if (look.headband) rect(hx, hy + 1, hx + 5, hy + 1, "w");
  return g.map((r) => r.join(""));
}

// A football: white ball, dark pentagon patches that turn with `spin`.
export function football(ctx, x, y, r, spin = 0, ink = "#15151A") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, "#FFFFFF");
  g.addColorStop(1, "#BDB8AE");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = ink;
  const pent = (cx, cy, s, rot) => {
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = rot + (k * Math.PI * 2) / 5 - Math.PI / 2;
      k ? ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s) : ctx.moveTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    }
    ctx.closePath();
    ctx.fill();
  };
  pent(0, 0, r * 0.32, 0);
  for (let k = 0; k < 5; k++) {
    const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
    pent(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.3, Math.PI + a);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- more instruments (football night)

// Referee's whistle: a pea-whistle trill around 2.9 kHz.
export function whistle(m, out, t, dur = 0.6, gain = 0.2) {
  const { ac } = m;
  const o = osc(ac, "sine", t, dur + 0.05);
  o.frequency.value = 2900;
  const lfo = osc(ac, "square", t, dur + 0.05);
  lfo.frequency.value = 28;
  const d = ac.createGain();
  d.gain.value = 180;
  lfo.connect(d).connect(o.frequency);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.setValueAtTime(gain, t + dur - 0.05);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(out);
}

// A stadium chanting a vowel: many detuned voices through two formant filters that glide
// from one vowel to another ("ee" → "oo" = SIUUU). Synthesised — no recorded voice.
export function chant(m, out, t, dur, gain = 0.3, { root = 147, from = [300, 2300], to = [320, 800], hiss = 0.12 } = {}) {
  const { ac } = m;
  if (hiss) noiseSrc(m, t, hiss + 0.05).connect(filter(ac, "highpass", 4500)).connect(env(ac, t, { a: 0.02, peak: gain * 0.8, d: hiss })).connect(out);
  const t0 = t + hiss * 0.8;
  const f1 = filter(ac, "bandpass", from[0], 4), f2 = filter(ac, "bandpass", from[1], 6);
  f1.frequency.setValueAtTime(from[0], t0 + 0.1);
  f1.frequency.linearRampToValueAtTime(to[0], t0 + dur * 0.5);
  f2.frequency.setValueAtTime(from[1], t0 + 0.1);
  f2.frequency.exponentialRampToValueAtTime(to[1], t0 + dur * 0.5);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.08);
  g.gain.setValueAtTime(gain, t0 + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  f1.connect(g);
  f2.connect(g);
  g.connect(out);
  for (let k = 0; k < 14; k++) {
    const o = osc(ac, "sawtooth", t0, dur + 0.1);
    const f = root * [1, 1, 2, 1.5, 2, 1, 0.5][k % 7] * (1 + (hash(k, 71) - 0.5) * 0.03);
    o.frequency.setValueAtTime(f, t0);
    o.frequency.linearRampToValueAtTime(f * 0.97, t0 + dur); // crowds sag a little at the end
    o.connect(f1);
    o.connect(f2);
  }
  noiseSrc(m, t0, dur, true, 5).connect(filter(ac, "bandpass", 1200, 0.8)).connect(env(ac, t0, { a: 0.1, peak: gain * 0.25, hold: dur * 0.5, d: dur * 0.4 })).connect(out);
}

// Oud-like pluck: bright triangle with a tiny downward bend at the attack.
export function oud(m, out, t, freq, gain = 0.3, dur = 0.5) {
  const { ac } = m;
  const o = osc(ac, "triangle", t, dur + 0.05);
  o.frequency.setValueAtTime(freq * 1.03, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
  const o2 = osc(ac, "sawtooth", t, dur + 0.05);
  o2.frequency.value = freq;
  const lp = filter(ac, "lowpass", 2600, 3);
  lp.frequency.setValueAtTime(3200, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + dur);
  const g = env(ac, t, { a: 0.002, peak: gain, d: dur });
  o.connect(g);
  o2.connect(lp).connect(g);
  g.connect(out);
}

// Mandolin / fado-guitar tremolo: the same note picked fast.
export function tremolo(m, out, t, freq, dur = 0.45, gain = 0.2, rate = 16) {
  for (let k = 0; k * (1 / rate) < dur; k++) pluck(m, out, t + k / rate, freq, gain * (k ? 0.7 : 1), 0.12);
}

// Flamenco-style strum: chord tones picked a few milliseconds apart, plus a percussive "rasgueado" tick.
export function strum(m, out, t, freqs, gain = 0.2, down = true) {
  (down ? freqs : [...freqs].reverse()).forEach((f, k) => pluck(m, out, t + k * 0.012, f, gain, 0.35));
  snap(m, out, t, gain * 0.6);
}

// Sidechain-style ducking: dip a bus on every hit time and let it swell back (the EDM "pump").
export function duck(bus, times, depth = 0.35, release = 0.3) {
  const p = bus.gain, base = p.value;
  for (const t of times) {
    p.setValueAtTime(base * depth, t);
    p.linearRampToValueAtTime(base, t + release);
  }
}

// ---------------------------------------------------------------- more instruments (tango night)

// Bandoneón: reedy and a little nasal, with the octave-down reed it sounds in unison. `wet` swaps in three
// reeds detuned against each other instead (the Paris musette accordion). `bellows` shakes the air (tremolo).
export function bandoneon(m, out, t, freq, dur, gain = 0.2, o = {}) {
  const { wet = false, attack = 0.04, release = 0.15, bellows = 0, cutoff = wet ? 4200 : 2600 } = o;
  const { ac } = m;
  const lp = filter(ac, "lowpass", cutoff, 1.4);
  const g = ac.createGain();
  const hold = Math.max(attack, dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + hold);
  g.gain.linearRampToValueAtTime(0, t + hold + release);
  if (bellows) {
    const lfo = osc(ac, "sine", t, hold + release + 0.05);
    lfo.frequency.value = 5.5;
    const depth = ac.createGain();
    depth.gain.value = gain * bellows;
    lfo.connect(depth).connect(g.gain);
  }
  lp.connect(g).connect(out);
  const voices = wet
    ? [[1, -14, "sawtooth", 0.4], [1, 0, "sawtooth", 0.4], [1, 15, "sawtooth", 0.4]]
    : [[1, -4, "square", 0.45], [1, 5, "sawtooth", 0.4], [0.5, 0, "square", 0.3]];
  for (const [ratio, cents, type, level] of voices) {
    const v = osc(ac, type, t, hold + release + 0.05);
    v.frequency.value = freq * ratio;
    v.detune.value = cents;
    const vg = ac.createGain();
    vg.gain.value = level;
    v.connect(vg).connect(lp);
  }
}

// Marimba: a wooden bar, a sine with the bar's 4th and ~10th overtones that die fast.
export function marimba(m, out, t, freq, gain = 0.3) {
  const { ac } = m;
  [[1, 1, 0.7], [4, 0.28, 0.16], [9.9, 0.08, 0.06]].forEach(([ratio, amp, d]) => {
    const o = osc(ac, "sine", t, d + 0.1);
    o.frequency.value = freq * ratio;
    o.connect(env(ac, t, { a: 0.002, peak: gain * amp, d })).connect(out);
  });
}

// Bombo con platillo: the deep, loose Argentine stadium drum, with a cymbal mounted on top.
export function bombo(m, out, t, gain = 0.8, platillo = false) {
  const { ac } = m;
  const o = osc(ac, "sine", t, 0.7);
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
  o.connect(env(ac, t, { a: 0.003, peak: gain, d: 0.55 })).connect(out);
  noiseSrc(m, t, 0.08).connect(filter(ac, "bandpass", 420, 1.2)).connect(env(ac, t, { a: 0.001, peak: gain * 0.45, d: 0.07 })).connect(out);
  if (platillo) noiseSrc(m, t, 0.5, false, 3).connect(filter(ac, "highpass", 5200)).connect(env(ac, t, { a: 0.002, peak: gain * 0.35, d: 0.42 })).connect(out);
}

// Chicharra: the tango violinist's "cicada", bowing behind the bridge. Band-passed noise chopped by a square wave.
export function chicharra(m, out, t, dur = 0.2, gain = 0.2) {
  const { ac } = m;
  const chop = ac.createGain();
  chop.gain.value = gain * 0.5;
  const lfo = osc(ac, "square", t, dur + 0.05);
  lfo.frequency.value = 48;
  const depth = ac.createGain();
  depth.gain.value = gain * 0.5; // 0.5 ± 0.5: the noise switches fully on and off
  lfo.connect(depth).connect(chop.gain);
  noiseSrc(m, t, dur).connect(filter(ac, "bandpass", 1700, 2.5)).connect(chop).connect(env(ac, t, { a: 0.01, peak: 1, hold: dur * 0.6, d: dur * 0.4 })).connect(out);
}

// Ballpoint on paper (or, higher and faster, a rustle): noise whose loudness wobbles with the stroke.
export function scribble(m, out, t0, t1, gain = 0.1, freq = 3200, rate = 9) {
  const { ac } = m;
  const n = noiseSrc(m, t0, t1 - t0, true, 11);
  n.stop(t1 + 0.05);
  const wob = ac.createGain();
  wob.gain.value = gain * 0.5;
  const lfo = osc(ac, "triangle", t0, t1 - t0 + 0.05);
  lfo.frequency.value = rate;
  const depth = ac.createGain();
  depth.gain.value = gain * 0.5;
  lfo.connect(depth).connect(wob.gain);
  const fade = ac.createGain();
  fade.gain.setValueAtTime(0, t0);
  fade.gain.linearRampToValueAtTime(1, t0 + 0.04);
  fade.gain.setValueAtTime(1, Math.max(t0 + 0.04, t1 - 0.05));
  fade.gain.linearRampToValueAtTime(0, t1);
  n.connect(filter(ac, "bandpass", freq, 1.6)).connect(wob).connect(fade).connect(out);
}
