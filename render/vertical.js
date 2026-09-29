// 9:16 wrapper: turns any 16:9 film into a phone-first frame, with no per-film layout work.
//
//   ┌──────────────┐  0     platform UI (tabs, status bar): keep empty
//   │ • haoli.ai   │  300   series tag
//   │ HOOK TITLE   │        1–2 lines of big type: why you should keep watching
//   │ sub line     │
//   │ ┌──────────┐ │  660   the 16:9 film, full width
//   │ │   film   │ │
//   │ └──────────┘ │  1268
//   │  CHAPTER     │        what's on screen now, readable on a phone
//   │              │  1500+ platform captions / buttons: keep empty
//   └──────────────┘  1920
//
// A film opts in to better copy with `vertical: { hook: [...lines], sub }` and `chapters: [[t, label], ...]`.
import { text, prog, slam, scaled } from "./kit.js";
import { SERIES, countdown } from "./brand.js";

export const PORTRAIT = { width: 1080, height: 1920 };
const VIDEO_Y = 660;
const INK = "#0B0B0D", BONE = "#EFE9DE", ASH = "#8C877F", ORANGE = "#FF5A1F";
const DISPLAY = "Anton", MONO = '"IBM Plex Mono"';

let blurCanvas = null;

// Largest font size (≤ max) at which `str` fits in `width`.
function fitSize(ctx, str, family, max, width, tracking = 0) {
  ctx.save();
  ctx.font = `400 ${max}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w > width ? Math.floor((max * width) / w) : max;
}

export function drawVertical(ctx, src, t, film, watermark) {
  const W = PORTRAIT.width, H = PORTRAIT.height;
  const videoH = (W * src.height) / src.width;

  // Background: the centre of the frame shrunk to 12×21 and stretched back up: a cheap, soft blur.
  blurCanvas ??= Object.assign(document.createElement("canvas"), { width: 12, height: 21 });
  const b = blurCanvas.getContext("2d");
  const sw = (src.height * 9) / 16;
  b.drawImage(src, (src.width - sw) / 2, 0, sw, src.height, 0, 0, 12, 21);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(blurCanvas, 0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // Series tag + hook
  const v = film.vertical ?? {};
  const hook = v.hook ?? [String(film.title ?? "").toUpperCase()];
  const tag = [watermark, SERIES, film.episode ? `EP${String(film.episode).padStart(2, "0")}` : null].filter(Boolean).join(" · ");
  if (tag) {
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(66, 270, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, tag, 84, 280, { family: MONO, weight: 500, size: 28, color: BONE, tracking: 3, alpha: 0.85 });
  }
  text(ctx, countdown(t, film.duration), 1020, 280, { family: MONO, weight: 500, size: 28, color: ORANGE, tracking: 3, align: "right" });
  // Hook lines stack down from y = 400; the sub line sits under the last one, clear of the film at 660.
  let y = 400;
  hook.slice(0, 2).forEach((line, i) => {
    const size = fitSize(ctx, line, DISPLAY, 112, 960, 2);
    if (i) y += size;
    text(ctx, line, 60, y, { family: DISPLAY, size, color: BONE, tracking: 2 });
  });
  if (v.sub) text(ctx, v.sub, 62, y + 56, { family: MONO, weight: 500, size: 26, color: ASH, tracking: 2 });

  // The film itself
  ctx.drawImage(src, 0, VIDEO_Y, W, videoH);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, VIDEO_Y + videoH, W * prog(t, 0, film.duration), 4); // progress along the bottom edge of the film

  // Current chapter, slammed in on each change
  const chapters = film.chapters ?? [];
  let current = null;
  for (const c of chapters) if (t >= c[0]) current = c;
  if (current && current[1]) {
    const [t0, label] = current;
    const size = fitSize(ctx, label, DISPLAY, 92, 860, 3);
    const s = slam(t, t0, 0.25, 1.25);
    scaled(ctx, 490, VIDEO_Y + videoH + 120, s.s, () =>
      text(ctx, label, 490, VIDEO_Y + videoH + 150, { family: DISPLAY, size, color: BONE, tracking: 3, align: "center", alpha: s.a }));
  }
}
