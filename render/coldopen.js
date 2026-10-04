// Cold open: a film or a clip starts on its payoff, then rewinds into its own beginning.
//
// Feeds decide in the first second or two, and every film builds up from something quiet (a ball in the dark,
// a pixel kid by a height chart). So the first bar shows the best moment instead, with its sound, and the last
// half second of that bar scrubs backwards through the film like a rewinding tape. The film then plays from the
// end of its first bar: the length stays exactly 90 s, and only the quiet opening bar is replaced.
//
// A film opts in with `coldOpen: { from, length }` in seconds: show [from, from + length), resume at `length`
// (one bar of the film's tempo, so the film comes back in on a downbeat).
// A clip (one of the film's `cuts`, `?cut=`) never uses the film's cold open, but can have its own, usually the
// clip's best moment. It plays in the bar before the clip, so the clip runs one bar longer and stays whole; a clip
// that starts with the film has no bar before it, so there the cold open replaces its first bar, as in the film.
//
// Everything here is a pure function of time, so preview, stills and export stay identical.

export const REWIND = 0.5; // seconds of rewind at the end of the cold open
const REWIND_FPS = 12; // distinct rewind frames per second: each is held, so it reads as a scrub, not a strobe
const FADE_IN = 0.01; // seconds: the cold open starts mid-song, so ease in instead of clicking
const RESUME_FADE = 0.015; // seconds: the same where the film comes back in
const WHIRR_GAIN = 0.4; // the rewind sound, at its loudest: loud enough that the rewind isn't a dip in the sound

// Where a clip starts in output time: one bar early when it has a cold open, but never before the film.
export function clipStart(cut) {
  return cut.coldOpen ? Math.max(0, cut.from - cut.coldOpen.length) : cut.from;
}

// The cold open in play, with `at`: where it starts in output time (0 for a full film).
export function coldOpenFor(film, cut = null) {
  const co = cut ? cut.coldOpen : film.coldOpen;
  return co ? { ...co, at: cut ? clipStart(cut) : 0 } : null;
}

// Which film time to draw at output time t.
// → { t: film time, rewind: 0, or the rewind's progress in (0, 1], resume: where the film resumes (0 = no cold open) }
export function filmTime(film, t, cut = null) {
  const co = coldOpenFor(film, cut);
  if (!co) return { t, rewind: 0, resume: 0 };
  const resume = co.at + co.length;
  if (t >= resume || t < co.at) return { t, rewind: 0, resume };
  const r0 = resume - REWIND;
  if (t < r0) return { t: co.from + (t - co.at), rewind: 0, resume };
  // Rewind: from where the payoff stopped back towards where the film resumes, in held steps.
  const r = (t - r0) / REWIND;
  const step = Math.floor(r * REWIND * REWIND_FPS) / (REWIND * REWIND_FPS);
  const start = co.from + (r0 - co.at);
  return { t: start + (resume - start) * step, rewind: Math.max(r, 1e-6), resume };
}

// A tape-rewind whirr: a rising chirp with flutter and a little hiss. `tau` is seconds into the rewind.
function whirr(tau, channel, noise) {
  const f0 = 700, f1 = 2200; // the tape speeds up
  const phase = 2 * Math.PI * (f0 * tau + ((f1 - f0) * tau * tau) / (2 * REWIND)) + channel * 0.9;
  const flutter = 0.6 + 0.4 * Math.sin(2 * Math.PI * 34 * tau + channel);
  return 0.75 * Math.sin(phase) * flutter + 0.25 * noise;
}

// Rebuild the soundtrack for a cold open. Works on plain Float32Arrays (one per channel), so it can be
// tested without Web Audio; the player converts to and from an AudioBuffer. `co.at` (default 0) is where it starts.
//   [at, at + length)  the payoff's own sound, fading out under the whirr over the last REWIND seconds
//   [at + length, …)   the film's soundtrack from that point on, unchanged after a short fade-in
//   [0, at)            unchanged (a clip's output starts at `at`, so this part is never heard)
// Bounded: in the rewind the payoff fades by (1 − x) while the whirr grows by x, so peaks never rise.
export function spliceAudio(channels, sampleRate, co) {
  const n = channels[0].length;
  const at = Math.round((co.at ?? 0) * sampleRate);
  const len = Math.round(co.length * sampleRate);
  const src = Math.round(co.from * sampleRate);
  const rw = Math.round(REWIND * sampleRate);
  const fadeIn = Math.max(1, Math.round(FADE_IN * sampleRate));
  const resumeFade = Math.max(1, Math.round(RESUME_FADE * sampleRate));
  let seed = 12345; // deterministic hiss (32-bit LCG): same render, same samples
  const hiss = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2147483648 - 1;
  return channels.map((ch, c) => {
    const out = Float32Array.from(ch);
    for (let i = 0; i < len; i++) {
      let g = Math.min(1, i / fadeIn);
      const x = i < len - rw ? 0 : (i - (len - rw)) / rw; // rewind progress, 0 → 1
      g *= 1 - x;
      // the whirr also fades over its last few ms, so the cut back to the film doesn't click
      const tail = Math.min(1, (len - i) / resumeFade);
      out[at + i] = (ch[src + i] ?? 0) * g + (x > 0 ? WHIRR_GAIN * x * tail * whirr((i - (len - rw)) / sampleRate, c, hiss()) : 0);
    }
    for (let i = at + len; i < Math.min(n, at + len + resumeFade); i++) out[i] = ch[i] * ((i - at - len) / resumeFade);
    return out;
  });
}

// Over a rewinding frame: drained of colour and a little darker, so it reads as "going back" without going dark
// (the rewind lands in the second or two in which viewers decide to stay),
// a VHS tracking band rolling down, and a ◀◀ in the corner like a VCR's on-screen display.
export function drawRewind(ctx, w, h, r) {
  ctx.save();
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#0B0B0D";
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  const y = ((r * 1.6) % 1) * h;
  const band = ctx.createLinearGradient(0, y - 70, 0, y + 70);
  band.addColorStop(0, "rgba(239,233,222,0)");
  band.addColorStop(0.5, "rgba(239,233,222,0.12)");
  band.addColorStop(1, "rgba(239,233,222,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, y - 70, w, 140);
  ctx.fillStyle = "rgba(239,233,222,0.07)";
  for (let k = 0; k < 7; k++) ctx.fillRect(0, (y + (k * h) / 7 + 41 * k) % h, w, 2);

  const s = h * 0.05, x0 = w * 0.055, y0 = h * 0.13;
  ctx.fillStyle = "#EFE9DE";
  ctx.globalAlpha = 0.92;
  for (let k = 0; k < 2; k++) {
    ctx.beginPath();
    ctx.moveTo(x0 + k * s, y0);
    ctx.lineTo(x0 + k * s + s, y0 - s * 0.62);
    ctx.lineTo(x0 + k * s + s, y0 + s * 0.62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
