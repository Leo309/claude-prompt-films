// 9:16 wrapper: turns any 16:9 film into a phone-first frame, with no per-film layout work.
//
//   ┌──────────────┐  0     platform UI (tabs, status bar): background only
//   │ • haoli.ai   │  280   series tag
//   │ HOOK TITLE   │        1–2 lines of big type: why you should keep watching
//   │ sub line     │        who it is: the player's name first, big enough to read on a phone
//   │ [card]       │        over the last seconds the end card takes the hook's place
//   │ ┌──────────┐ │  600   the film, zoomed per chapter so its content fills the safe width (reframe.json)
//   │ │   film   │▒│        ▒ = the right-hand button column of TikTok, Reels and Shorts
//   │ └──────────┘▒│
//   │   CHAPTER   ▒│  1470  under the film, only when the chapter isn't zoomed in (there is room)
//   │              │  1500
//   │              │  1500+ captions, names, subscribe buttons: background only
//   └──────────────┘  1920
//
// One layout serves TikTok, Instagram Reels and YouTube Shorts: anything that must be read stays inside SAFE,
// which is each platform's overlay margins taken at their worst, plus a little room.
//
// A film opts in to better copy with `vertical: { hook: [...lines], sub, cta }` and `chapters: [[t, label], ...]`.
// A clip (`cuts` in the film, `?cut=<name>` here) swaps in its own hook, drops the countdown and, over its
// last seconds, points viewers to the full film. A full film ends by asking who's next (`cta`, two lines).
// Both end cards sit in the header, in place of the hook, so the film's ending (often its payoff) stays uncovered.
import { text, prog, slam, scaled, clamp, lerp, smooth } from "./kit.js";
import { SERIES, countdown } from "./brand.js";
import { clipStart } from "./coldopen.js";

export const PORTRAIT = { width: 1080, height: 1920 };
// Overlays at 1080×1920 (2026): TikTok top 108 · bottom 320 · right 120 · left 60; Reels top 210 · bottom 310 ·
// right 84; Shorts top 120 · bottom 300–360 · right 96. The button column only covers the lower half, so the
// header above y ≈ 800 can use the full width.
export const SAFE = { left: 60, right: 920, top: 240, bottom: 1500 };
const BAND = { top: 600, bottom: 1500 }; // where the film sits
const FOCUS_X = (SAFE.left + SAFE.right) / 2; // a chapter's content is centred here, left of the buttons
const REFRAME_EASE = 0.35; // seconds the camera takes to reframe at a chapter change
const INK = "#0B0B0D", BONE = "#EFE9DE", ORANGE = "#FF5A1F";
const DISPLAY = "Anton", MONO = '"IBM Plex Mono"';
export const CLIP_CARD = 2.4; // seconds at the end of a clip that point to the full film
export const CTA_CARD = 3; // seconds at the end of a full film that ask for a comment
const CTA = ["WHO’S NEXT?", "COMMENT A PLAYER"];
const CARD = { x: PORTRAIT.width / 2, y: 440 }; // end cards: in the header, where the hook was (no buttons up here)
const LABEL_Y = 1470; // chapter label baseline, just above the caption zone

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

// How big the film is drawn and which part of it is centred, at film time ft.
// `reframe` comes from `bun render/render.ts reframe` (films/<slug>/reframe.json): one [t, contentCentreX, contentWidth]
// per chapter, in film pixels. Each chapter is zoomed until its content fills the safe width, between "whole film
// width visible" and "film fills the band's height". Without it, or while the cold open rewinds, the whole width shows.
// → { zoom, cx } on screen now (eased between chapters) and `settled`, the current chapter's own zoom.
export function framing(src, reframe, ft) {
  const min = PORTRAIT.width / src.width, max = (BAND.bottom - BAND.top) / src.height;
  const wide = { zoom: min, cx: src.width / 2, settled: min };
  if (!reframe?.length || ft.rewind) return wide;
  const at = (i) => ({ zoom: clamp((SAFE.right - SAFE.left) / reframe[i][2], min, max), cx: reframe[i][1] });
  let i = -1;
  for (let k = 0; k < reframe.length; k++) if (ft.t >= reframe[k][0]) i = k;
  if (i < 0) return wide;
  const b = at(i), u = (ft.t - reframe[i][0]) / REFRAME_EASE;
  if (i === 0 || u >= 1) return { ...b, settled: b.zoom };
  const a = at(i - 1), e = smooth(clamp(u));
  return { zoom: lerp(a.zoom, b.zoom, e), cx: lerp(a.cx, b.cx, e), settled: b.zoom };
}

// t is output time; ft is the film time on screen (coldopen.js), which runs ahead of t during a cold open.
export function drawVertical(ctx, src, t, film, watermark, cut = null, ft = { t, rewind: 0, resume: 0 }, reframe = null) {
  const W = PORTRAIT.width, H = PORTRAIT.height;

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
  // A clip ends by pointing to the full film, a full film by asking who's next. The card takes the hook's place,
  // so the film below plays to its last frame uncovered: the end of a clip is usually its payoff.
  const ending = cut ? drawClipCard(ctx, t, cut, CARD.x, CARD.y) : drawCtaCard(ctx, t, film, CARD.x, CARD.y);
  if (!ending) {
    // Hook lines stack down from y = 400; the sub line sits under the last one, clear of the film band at 600.
    let y = 400;
    hook.slice(0, 2).forEach((line, i) => {
      const size = fitSize(ctx, line, DISPLAY, 112, 960, 2);
      if (i) y += size;
      text(ctx, line, 60, y, { family: DISPLAY, size, color: BONE, tracking: 2 });
    });
    // The sub line says who it is: pixel players have no faces, so a stranger needs to read the name.
    if (v.sub) text(ctx, v.sub, 62, y + 56, { family: MONO, weight: 500, size: fitSize(ctx, v.sub, MONO, 34, 960, 2), color: BONE, tracking: 2, alpha: 0.9 });
  }

  // The film, reframed per chapter and centred vertically in its band
  const f = framing(src, reframe, ft);
  const fw = src.width * f.zoom, fh = src.height * f.zoom;
  const dx = clamp(FOCUS_X - f.cx * f.zoom, W - fw, 0);
  const dy = (BAND.top + BAND.bottom) / 2 - fh / 2;
  ctx.drawImage(src, dx, dy, fw, fh);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, dy + fh - 4, W * prog(t, cut ? clipStart(cut) : 0, cut ? cut.to : film.duration), 4); // progress along the film's bottom edge

  if (ending) return; // no chapter label under the end card's moment
  if (ft.rewind) return; // no label while the cold open scrubs back: it would flicker through every chapter
  // The label sits under the film, so it only shows when the chapter's framing leaves room there. A zoomed-in
  // chapter fills the band and carries its own big type; a label over it would collide with the film's captions.
  if ((BAND.top + BAND.bottom) / 2 + (src.height * f.settled) / 2 > LABEL_Y - 90) return;

  // Current chapter at film time (so the cold open shows the payoff's label), slammed in on each change
  const chapters = film.chapters ?? [];
  let current = null;
  for (const c of chapters) if (ft.t >= c[0]) current = c;
  if (current && current[1]) {
    const [c0, label] = current;
    // When the film resumes after a cold open, its opening label slams in again
    const t0 = ft.resume && t >= ft.resume && c0 < ft.resume ? ft.resume : c0;
    const size = fitSize(ctx, label, DISPLAY, 80, SAFE.right - SAFE.left, 3);
    const s = slam(ft.t, t0, 0.25, 1.25);
    scaled(ctx, FOCUS_X, LABEL_Y - 30, s.s, () =>
      text(ctx, label, FOCUS_X, LABEL_Y, { family: DISPLAY, size, color: BONE, tracking: 3, align: "center", alpha: s.a }));
  }
}
