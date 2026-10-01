// Film player. One page, three modes (?mode=...):
//   preview (default) — real-time playback with the synthesized soundtrack and keyboard controls
//   still             — render.ts asks for single frames (contact sheets, stills)
//   render            — frames and audio are streamed to render.ts over a WebSocket, straight into ffmpeg
//
// ?format=9x16 wraps the 16:9 film in a phone-first vertical frame (see vertical.js).
// ?cut=<name> frames one of the film's `cuts` as a clip: its own hook, no countdown, and a
// "full 90 seconds on my profile" card at the end (render.ts renders just that time range).
//
// A film module exports { width, height, duration, fonts, draw(ctx, t), score(ac) },
// plus optional { title, episode, vertical, chapters, cuts, coldOpen } used by the vertical frame, clips and
// the cold open (coldopen.js: the full film starts on its payoff, then rewinds into its first bar).
// draw() must be a pure function of t — that is what makes preview and export identical.
import { WATERMARK, countdown } from "./brand.js";
import { PORTRAIT, drawVertical, drawClipCard } from "./vertical.js";
import { filmTime, spliceAudio, drawRewind } from "./coldopen.js";

// The watermark is drawn into the frame itself, so a re-upload carries it and it can't be stripped from the file.
function drawWatermark(ctx, label, w, h) {
  ctx.save();
  ctx.font = '500 22px "IBM Plex Mono", monospace';
  ctx.letterSpacing = "2px";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#EFE9DE";
  ctx.fillText(label, w - 42, h - 40);
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "#FF5A1F";
  ctx.beginPath();
  ctx.arc(w - 44 - tw - 12, h - 47, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export async function run(film) {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode") ?? "preview";
  const portrait = params.get("format") === "9x16";

  // The output canvas. In portrait mode the film draws into its own 16:9 canvas, which is then composed.
  const canvas = document.createElement("canvas");
  canvas.width = portrait ? PORTRAIT.width : film.width;
  canvas.height = portrait ? PORTRAIT.height : film.height;
  document.body.append(canvas);
  // willReadFrequently keeps the canvas on the CPU, which makes the per-frame getImageData cheap.
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: mode !== "preview" });
  const filmCanvas = portrait ? Object.assign(document.createElement("canvas"), { width: film.width, height: film.height }) : canvas;
  const filmCtx = portrait ? filmCanvas.getContext("2d", { alpha: false }) : ctx;

  await Promise.all((film.fonts ?? []).map((f) => document.fonts.load(f)));
  await document.fonts.ready;

  const showLabel = params.has("label");
  const watermark = params.has("nowm") || film.watermark === false ? null : film.watermark ?? WATERMARK;
  const cut = params.has("cut") ? (film.cuts ?? []).find((c) => c.name === params.get("cut")) : null;
  if (params.has("cut") && !cut) throw new Error(`no cut named "${params.get("cut")}" in this film`);
  const reset = (c) => {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  };
  function drawFrame(t) {
    // t is output time (countdown, progress, end cards); ft.t is the film time to draw (they differ in the cold open)
    const ft = filmTime(film, t, cut);
    reset(filmCtx);
    film.draw(filmCtx, ft.t);
    if (ft.rewind) {
      reset(filmCtx);
      drawRewind(filmCtx, film.width, film.height, ft.rewind);
    }
    reset(ctx);
    if (portrait) drawVertical(ctx, filmCanvas, t, film, watermark, cut, ft); // the watermark becomes the series tag up top
    else {
      if (watermark) drawWatermark(ctx, cut ? watermark : `${watermark}  ${countdown(t, film.duration)}`, canvas.width, canvas.height);
      if (cut) drawClipCard(ctx, t, cut, canvas.width / 2, canvas.height - 200);
    }
    if (showLabel) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, 230, 64);
      ctx.fillStyle = "#fff";
      ctx.font = '500 40px "IBM Plex Mono", monospace';
      ctx.letterSpacing = "0px";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${t.toFixed(2)}s`, 14, 48);
    }
  }

  async function renderScore(sampleRate = 48000) {
    const ac = new OfflineAudioContext(2, Math.ceil(film.duration * sampleRate), sampleRate);
    await film.score(ac);
    const audio = await ac.startRendering();
    if (!film.coldOpen || cut) return audio;
    // The cold open plays the payoff's own sound, then a rewind whirr, then the film from where it resumes.
    const channels = spliceAudio([audio.getChannelData(0), audio.getChannelData(1)], audio.sampleRate, film.coldOpen);
    const spliced = new AudioBuffer({ length: audio.length, numberOfChannels: 2, sampleRate: audio.sampleRate });
    channels.forEach((data, c) => spliced.copyToChannel(data, c));
    return spliced;
  }

  async function streamRender({ from = 0, to = film.duration, fps = 60 } = {}) {
    const ws = new WebSocket(`ws://${location.host}/__ws`);
    ws.binaryType = "arraybuffer";
    await new Promise((ok, fail) => {
      ws.onopen = ok;
      ws.onerror = fail;
    });

    // Flow control: at most 2 frames in flight, so Chrome never outruns ffmpeg (or the RAM).
    let inflight = 0;
    const waiters = [];
    let finish = null;
    ws.onmessage = (e) => {
      if (e.data === "ack") {
        inflight--;
        waiters.shift()?.();
      } else finish?.(e.data);
    };
    const send = async (data) => {
      while (inflight >= 2) await new Promise((r) => waiters.push(r));
      inflight++;
      ws.send(data);
    };
    const drain = async () => {
      while (inflight > 0) await new Promise((r) => waiters.push(r));
    };

    const audio = await renderScore();
    const interleaved = new Float32Array(audio.length * 2);
    const L = audio.getChannelData(0), R = audio.getChannelData(1);
    for (let i = 0; i < audio.length; i++) {
      interleaved[i * 2] = L[i];
      interleaved[i * 2 + 1] = R[i];
    }
    ws.send(JSON.stringify({ type: "audio", sampleRate: audio.sampleRate, channels: 2 }));
    await send(interleaved.buffer);
    await drain();

    const frames = Math.round((to - from) * fps);
    ws.send(JSON.stringify({ type: "start", width: canvas.width, height: canvas.height, fps, frames, from }));
    inflight++; // the server acks "start" once ffmpeg is running
    await drain();

    for (let i = 0; i < frames; i++) {
      drawFrame(from + i / fps);
      await send(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    }
    await drain();

    const done = new Promise((r) => (finish = r));
    ws.send(JSON.stringify({ type: "done" }));
    return done;
  }

  window.__player = { canvas, film, drawFrame, renderScore, streamRender };
  if (mode === "preview") startPreview(film, drawFrame, renderScore, params);
  window.__player.ready = true;
}

// Small DOM helper: el("div", "class", ...children)
function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
}

function startPreview(film, drawFrame, renderScore, params) {
  document.body.classList.add("preview");
  const fill = el("div", "fill");
  const bar = el("div", "bar", fill);
  const time = el("span", "time");
  const keys = el("span", "keys", "space play/pause · ←/→ ±1s (shift ±5s) · ,/. frame · h hide");
  const hud = el("div", "hud", bar, el("div", "row", time, keys));
  document.body.append(hud);

  let t = Number(params.get("t") ?? 0);
  let playing = false, audioCtx = null, source = null, startedAt = 0;
  const scorePromise = renderScore(); // pre-render the soundtrack while the first frames show

  async function play() {
    audioCtx ??= new AudioContext();
    const buf = await scorePromise;
    source = audioCtx.createBufferSource();
    source.buffer = buf;
    source.connect(audioCtx.destination);
    startedAt = audioCtx.currentTime - t;
    source.start(0, t);
    playing = true;
  }
  function pause() {
    source?.stop();
    source = null;
    playing = false;
  }
  function seek(nt) {
    const was = playing;
    if (was) pause();
    t = Math.min(film.duration, Math.max(0, nt));
    if (was) play();
  }

  addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      playing ? pause() : play();
    } else if (e.key === "ArrowRight") seek(t + (e.shiftKey ? 5 : 1));
    else if (e.key === "ArrowLeft") seek(t - (e.shiftKey ? 5 : 1));
    else if (e.key === ".") seek(t + 1 / 60);
    else if (e.key === ",") seek(t - 1 / 60);
    else if (e.key === "h") hud.classList.toggle("hidden");
  });
  bar.addEventListener("click", (e) => seek((e.offsetX / bar.clientWidth) * film.duration));

  function loop() {
    if (playing) {
      t = audioCtx.currentTime - startedAt;
      if (t >= film.duration) {
        pause();
        t = film.duration;
      }
    }
    drawFrame(t);
    fill.style.width = `${(t / film.duration) * 100}%`;
    time.textContent = `${t.toFixed(2)} / ${film.duration.toFixed(2)}${playing ? "" : "  (paused)"}`;
    requestAnimationFrame(loop);
  }
  loop();
}
