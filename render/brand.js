// Burned into every frame of every film, bottom-right.
// Change it here for all films, set `watermark` in a film module to override, or render with --no-watermark.
export const WATERMARK = "haoli.ai";
// The series every film belongs to. Films are exactly 90 s; a countdown to 00:00 runs in the corner.
export const SERIES = "90 SECONDS";

// "00:47": time left in the film, for the corner countdown.
export const countdown = (t, duration) => {
  const s = Math.max(0, Math.ceil(duration - t - 1e-6));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
