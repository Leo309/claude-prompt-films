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
// A film opts in to better copy with `vertical: { hook: [...lines], sub, cta }` and `chapters: [[t, label], ...]`.
// A clip (`cuts` in the film, `?cut=<name>` here) swaps in its own hook, drops the countdown and, over its
// last seconds, points viewers to the full film. A full film ends by asking who's next (`cta`, two lines).
import { text, prog, slam, scaled } from "./kit.js";
import { SERIES, countdown } from "./brand.js";

export const PORTRAIT = { width: 1080, height: 1920 };
const VIDEO_Y = 660;
const INK = "#0B0B0D", BONE = "#EFE9DE", ASH = "#8C877F", ORANGE = "#FF5A1F";
const DISPLAY = "Anton", MONO = '"IBM Plex Mono"';
export const CLIP_CARD = 2.4; // seconds at the end of a clip that point to the full film
export const CTA_CARD = 3; // seconds at the end of a full film that ask for a comment
const CTA = ["WHO’S NEXT?", "COMMENT A PLAYER"];

// Two lines on an orange plate, slammed in at t0: the clip card and the CTA share it.
function drawPlate(ctx, t, t0, [big, small], cx, cy) {
  const s = slam(t, t0, 0.3, 1.3);
  const size = fitSize(ctx, big, DISPLAY, 96, 780, 3);
  scaled(ctx, cx, cy, s.s, () => {
    ctx.save();
    ctx.globalAlpha = s.a;
    ctx.fillStyle = ORANGE;
    ctx.fillRect(cx - 420, cy - 120, 840, 200);
    ctx.restore();
    text(ctx, big, cx, cy, { family: DISPLAY, size, color: INK, align: "center", tracking: 3, alpha: s.a });
    text(ctx, small, cx, cy + 56, { family: MONO, weight: 500, size: 30, color: INK, align: "center", tracking: 8, alpha: s.a });
  });
}

// "FULL 90 SECONDS / ON MY PROFILE", slammed in over the last seconds of a clip. Returns true while it is showing.
export function drawClipCard(ctx, t, cut, cx, cy) {
  const t0 = cut.to - CLIP_CARD;
  if (t < t0) return false;
  drawPlate(ctx, t, t0, ["FULL 90 SECONDS", "ON MY PROFILE"], cx, cy);
  return true;
}

// "WHO'S NEXT? / COMMENT A PLAYER" over the last seconds of a full film: comments are what the feeds count,
// and the answers are the next episodes. Returns true while it is showing.
function drawCtaCard(ctx, t, film, cx, cy) {
  const t0 = film.duration - CTA_CARD;
  if (t < t0) return false;
  drawPlate(ctx, t, t0, film.vertical?.cta ?? CTA, cx, cy);
  return true;
}

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

// t is output time; ft is the film time on screen (coldopen.js), which runs ahead of t during a cold open.
export function drawVertical(ctx, src, t, film, watermark, cut = null, ft = { t, rewind: 0, resume: 0 }) {
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

  // Series tag + hook (a clip brings its own hook and has no countdown)
  const v = cut ?? film.vertical ?? {};
  const hook = v.hook ?? [String(film.title ?? "").toUpperCase()];
  // No episode number on screen: feeds are shuffled, and "EP07" makes a standalone film look like it needs EP01–06.
  // `episode` stays in the film metadata, the repo and the playlists.
  const tag = [watermark, SERIES].filter(Boolean).join(" · ");
  if (tag) {
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(66, 270, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, tag, 84, 280, { family: MONO, weight: 500, size: 28, color: BONE, tracking: 3, alpha: 0.85 });
  }
  if (!cut) text(ctx, countdown(t, film.duration), 1020, 280, { family: MONO, weight: 500, size: 28, color: ORANGE, tracking: 3, align: "right" });
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
  ctx.fillRect(0, VIDEO_Y + videoH, W * prog(t, cut ? cut.from : 0, cut ? cut.to : film.duration), 4); // progress along the bottom edge

  // A clip ends by pointing to the full film, a full film by asking who's next: both in place of the chapter.
  // The plate's bottom edge stays above y = 1500, where TikTok and Reels lay the caption over the video.
  const cardY = VIDEO_Y + videoH + 140;
  if (cut ? drawClipCard(ctx, t, cut, W / 2, cardY) : drawCtaCard(ctx, t, film, W / 2, cardY)) return;
  if (ft.rewind) return; // no label while the cold open scrubs back: it would flicker through every chapter

  // Current chapter at film time (so the cold open shows the payoff's label), slammed in on each change
  const chapters = film.chapters ?? [];
  let current = null;
  for (const c of chapters) if (ft.t >= c[0]) current = c;
  if (current && current[1]) {
    const [c0, label] = current;
    // When the film resumes after a cold open, its opening label slams in again
    const t0 = ft.resume && t >= ft.resume && c0 < ft.resume ? ft.resume : c0;
    const size = fitSize(ctx, label, DISPLAY, 92, 860, 3);
    const s = slam(ft.t, t0, 0.25, 1.25);
    scaled(ctx, 490, VIDEO_Y + videoH + 120, s.s, () =>
      text(ctx, label, 490, VIDEO_Y + videoH + 150, { family: DISPLAY, size, color: BONE, tracking: 3, align: "center", alpha: s.a }));
  }
}
