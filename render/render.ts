#!/usr/bin/env bun
/**
 * Offline renderer for code-rendered films.
 *
 *   bun render/render.ts serve [--port 5173]               preview server → http://localhost:5173/films/<name>/
 *   bun render/render.ts video  films/lebron               MP4s → out/lebron/full-16x9.mp4 + out/lebron/full-9x16.mp4
 *   bun render/render.ts video  films/lebron --format 9x16  just one format (16x9 | 9x16 | all, default all)
 *   bun render/render.ts video  films/lebron --from 30 --to 40 --fps 30 --out out/draft.mp4
 *   bun render/render.ts stills films/lebron --at 3,12.5,40   PNGs → out/lebron/work/stills/
 *   bun render/render.ts sheet  films/lebron [--count 24]   contact sheet → out/lebron/work/sheet.png
 *   bun render/render.ts cuts   films/messi [--name rings] [--format 9x16|16x9|all]
 *                                                           the film's short clips → out/messi/clip-<cut>-9x16.mp4
 *   bun render/render.ts reframe films/messi                9:16 framing per chapter → films/messi/reframe.json
 *                                                           (run it after changing a film, before rendering 9:16)
 *
 * out/<film>/ holds only what gets posted (full-*, clip-*); scratch files go to out/<film>/work/.
 *   add --no-watermark to any of them to leave out the watermark (render/brand.js);
 *   stills and sheet take --format 9x16 to preview the vertical frame, and --cut <name> to preview a clip's framing
 *
 * Frames never touch the disk: headless Chrome draws each frame, sends raw RGBA
 * over a WebSocket, and we pipe it straight into ffmpeg's stdin.
 */
import { chromium, type Browser, type Page } from "playwright-core";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import type { Server, ServerWebSocket } from "bun";

const ROOT = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const mode = args[0];
const filmDir = args[1] && !args[1].startsWith("--") ? args[1].replace(/\/$/, "") : "";
const opt = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

// ---------------------------------------------------------------- static server + WebSocket

type Handler = (ws: ServerWebSocket<unknown>, msg: string | Buffer) => Promise<void> | void;
let onMessage: Handler = () => {};
let queue: Promise<void> = Promise.resolve();

function startServer(port = 0): Server {
  return Bun.serve({
    port,
    async fetch(req, server) {
      const url = new URL(req.url);
      if (url.pathname === "/__ws") {
        return server.upgrade(req) ? undefined : new Response("upgrade failed", { status: 400 });
      }
      let path = resolve(join(ROOT, decodeURIComponent(url.pathname)));
      if (!path.startsWith(ROOT)) return new Response("forbidden", { status: 403 });
      if (url.pathname.endsWith("/")) path = join(path, "index.html");
      const file = Bun.file(path);
      return (await file.exists()) ? new Response(file) : new Response("not found", { status: 404 });
    },
    websocket: {
      maxPayloadLength: 256 * 1024 * 1024,
      // Handle messages strictly in order: frames must reach ffmpeg in the order they were drawn.
      message(ws, msg) {
        queue = queue.then(() => onMessage(ws, msg as string | Buffer)).catch((e) => {
          console.error(e);
          process.exit(1);
        });
      },
    },
  });
}

async function openFilm(server: Server, query: string): Promise<{ browser: Browser; page: Page }> {
  if (!filmDir) throw new Error("Pass a film folder, e.g. films/lebron");
  const browser = await chromium.launch({
    channel: "chrome", // the Google Chrome already installed on this Mac
    headless: true,
    args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.log(`[page ${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => console.error(`[page error] ${e.message}`));
  page.on("crash", () => {
    console.error("\n✗ the page crashed");
    process.exit(3);
  });
  const wm = args.includes("--no-watermark") ? "&nowm" : "";
  const cut = opt("cut") ? `&cut=${encodeURIComponent(opt("cut")!)}` : "";
  await page.goto(`http://localhost:${server.port}/${filmDir}/?${query}${wm}${cut}`);
  await page.waitForFunction(() => (window as any).__player?.ready === true, null, { timeout: 60_000 });
  return { browser, page };
}

// ---------------------------------------------------------------- video

function writeWav(path: string, data: Buffer, sampleRate: number, channels: number) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.byteLength, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); // 3 = IEEE float samples
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * channels * 4, 28);
  h.writeUInt16LE(channels * 4, 32);
  h.writeUInt16LE(32, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.byteLength, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

function ffmpegArgs(v: { width: number; height: number; fps: number; frames: number; from: number }, wav: string, out: string) {
  return [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${v.width}x${v.height}`, "-framerate", String(v.fps), "-i", "pipe:0",
    "-ss", String(v.from), "-t", String(v.frames / v.fps), "-i", wav,
    "-map", "0:v", "-map", "1:a",
    // Convert RGB → BT.709 YUV explicitly and tag it, so players don't shift the colours.
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", opt("preset", "slow")!, "-crf", opt("crf", "18")!,
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    // A clip starts and stops mid-song: fade the sound in and out so it doesn't click.
    ...(opt("cut") ? ["-af", `afade=t=in:st=0:d=0.12,afade=t=out:st=${(v.frames / v.fps - 0.6).toFixed(3)}:d=0.6`] : []),
    "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest",
    out,
  ];
}

async function renderVideo(format: string) {
  const name = basename(filmDir);
  const fps = Number(opt("fps", "60"));
  const from = Number(opt("from", "0"));
  const to = opt("to") ? Number(opt("to")) : undefined;
  const out = resolve(opt("out", join(ROOT, "out", name, `full-${format}.mp4`))!);
  const work = join(ROOT, "out", name, "work");
  mkdirSync(work, { recursive: true });
  mkdirSync(dirname(out), { recursive: true });
  const wav = join(work, `score-${format}.wav`);

  let ff: ChildProcessWithoutNullStreams | null = null;
  let ffExit: Promise<unknown[]> | null = null;
  let ffDone = false;
  let expectAudio: { sampleRate: number; channels: number } | null = null;
  let total = 0, done = 0;
  const t0 = performance.now();
  // Watchdog: a render that stops receiving frames fails loudly instead of hanging forever.
  // Once the page says "done", ffmpeg may still be encoding a backlog of frames: that is not a stall.
  let lastMessage = performance.now();
  let finishing = false;
  const watchdog = setInterval(() => {
    if (!finishing && performance.now() - lastMessage > 90_000) {
      console.error("\n✗ render stalled: no frames for 90 s");
      process.exit(2);
    }
  }, 5000);

  onMessage = async (ws, msg) => {
    lastMessage = performance.now();
    if (typeof msg === "string") {
      const m = JSON.parse(msg);
      if (m.type === "audio") expectAudio = m;
      else if (m.type === "start") {
        total = m.frames;
        ff = spawn("ffmpeg", ffmpegArgs(m, wav, out)) as ChildProcessWithoutNullStreams;
        // Listen for exit right away: with -shortest, ffmpeg can finish before the page says "done".
        ffExit = once(ff, "exit");
        ffExit.then(() => (ffDone = true));
        ff.stdin.on("error", () => {}); // EPIPE once ffmpeg has stopped reading: expected, see below
        ff.stderr.on("data", (d) => process.stderr.write(d));
        ff.on("exit", (code) => code && console.error(`ffmpeg exited with code ${code}`));
        console.log(`Rendering ${total} frames (${(total / fps).toFixed(1)} s at ${fps} fps) → ${out}`);
        ws.send("ack");
      } else if (m.type === "done") {
        finishing = true;
        if (!ffDone) ff!.stdin.end();
        const [code] = await ffExit!;
        ws.send(code === 0 ? "finished" : "failed");
      }
      return;
    }
    if (expectAudio) {
      writeWav(wav, msg, expectAudio.sampleRate, expectAudio.channels);
      expectAudio = null;
      ws.send("ack");
      return;
    }
    // ffmpeg stops reading at 90 s (-t/-shortest) and can close its input before the last frame arrives.
    // A write into a closed pipe never drains, so wait for "drain" OR ffmpeg's exit, and skip writes after it.
    if (!ffDone && !ff!.stdin.write(msg)) await Promise.race([once(ff!.stdin, "drain"), ffExit!]);
    done++;
    if (done % 120 === 0 || done === total) {
      const sec = (performance.now() - t0) / 1000;
      const rate = done / sec;
      process.stdout.write(`\r  ${done}/${total} frames · ${rate.toFixed(1)} fps · ETA ${((total - done) / rate).toFixed(0)} s   `);
    }
    ws.send("ack");
  };

  const server = startServer();
  const { browser, page } = await openFilm(server, `mode=render&format=${format}`);
  const result = await page.evaluate((o) => (window as any).__player.streamRender(o), { from, to, fps });
  clearInterval(watchdog);
  await browser.close();
  server.stop(true);
  rmSync(wav, { force: true });
  const secs = ((performance.now() - t0) / 1000).toFixed(0);
  console.log(result === "finished" ? `\n✓ ${out} (${secs} s)` : "\n✗ render failed");
  if (result !== "finished") process.exit(1);
}

// ---------------------------------------------------------------- stills & contact sheet

async function grabStills(page: Page, times: number[], dir: string) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files: string[] = [];
  for (const [i, t] of times.entries()) {
    const dataUrl: string = await page.evaluate((t) => {
      const p = (window as any).__player;
      p.drawFrame(t);
      return p.canvas.toDataURL("image/png");
    }, t);
    const file = join(dir, `${String(i).padStart(3, "0")}_${t.toFixed(2)}s.png`);
    writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
    files.push(file);
  }
  return files;
}

async function renderStills() {
  const times = (opt("at") ?? "").split(",").filter(Boolean).map(Number);
  if (!times.length) throw new Error("Pass times with --at 3,12.5,40");
  const server = startServer();
  const { browser, page } = await openFilm(server, `mode=still&format=${opt("format", "16x9")}`);
  const dir = join(ROOT, "out", basename(filmDir), "work", "stills");
  const files = await grabStills(page, times, dir);
  await browser.close();
  server.stop(true);
  console.log(files.join("\n"));
}

async function renderSheet() {
  const count = Number(opt("count", "24"));
  const cols = Number(opt("cols", "6"));
  const server = startServer();
  const { browser, page } = await openFilm(server, `mode=still&label&format=${opt("format", "16x9")}`);
  const duration: number = await page.evaluate(() => (window as any).__player.film.duration);
  const from = Number(opt("from", "0.25")), to = Number(opt("to", String(duration - 0.25)));
  const times = Array.from({ length: count }, (_, i) => +(from + ((to - from) * i) / Math.max(1, count - 1)).toFixed(2));
  const dir = join(ROOT, "out", basename(filmDir), "work", "sheet");
  await grabStills(page, times, dir);
  await browser.close();
  server.stop(true);
  const out = join(ROOT, "out", basename(filmDir), "work", opt("name", "sheet.png")!);
  const rows = Math.ceil(count / cols);
  const ff = spawn("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-pattern_type", "glob", "-i", join(dir, "*.png"),
    "-vf", `scale=${opt("format") === "9x16" ? 270 : 480}:-1,tile=${cols}x${rows}:padding=6:margin=6:color=0x333333`, "-frames:v", "1", out,
  ]);
  const [code] = await once(ff, "exit");
  if (code !== 0) throw new Error("ffmpeg tile failed");
  console.log(out);
}

// ---------------------------------------------------------------- clips

// Render the film's `cuts` (short clips for Reels / Shorts / TikTok), one process per clip and format.
async function renderCuts() {
  const film = (await import(resolve(ROOT, filmDir, "film.js"))).default;
  const names = opt("name")?.split(",");
  const cuts = (film.cuts ?? []).filter((c: { name: string }) => !names || names.includes(c.name));
  if (!cuts.length) throw new Error(names ? `no cut named ${names.join(", ")}` : "this film has no cuts");
  const format = opt("format", "9x16")!;
  const formats = format === "all" ? ["16x9", "9x16"] : [format];
  const skip = new Set(["--name", "--format", "--from", "--to", "--out", "--cut"]);
  const rest = args.slice(2).filter((a, i, all) => !skip.has(a) && !skip.has(all[i - 1]));
  for (const c of cuts) {
    for (const f of formats) {
      const out = join(ROOT, "out", basename(filmDir), `clip-${c.name}-${f}.mp4`);
      console.log(`\n${c.name} · ${f} · ${c.from.toFixed(2)}–${c.to.toFixed(2)} s`);
      const p = Bun.spawnSync([process.execPath, import.meta.path, "video", filmDir, "--format", f,
        "--from", String(c.from), "--to", String(c.to), "--cut", c.name, "--out", out, ...rest], { stdout: "inherit", stderr: "inherit" });
      if (p.exitCode !== 0) process.exit(p.exitCode ?? 1);
    }
  }
}

// ---------------------------------------------------------------- reframe (9:16 framing per chapter)

// For each chapter, find where the film's content sits (bright pixels at three moments of the chapter) and write
// films/<slug>/reframe.json: [[chapterStart, contentCentreX, contentWidth], ...] in film pixels. vertical.js then
// zooms each chapter until that content fills the width that TikTok, Reels and Shorts all leave uncovered.
async function renderReframe() {
  const server = startServer();
  const { browser, page } = await openFilm(server, "mode=still&nowm");
  const rows: number[][] = await page.evaluate(() => {
    const p = (window as any).__player, film = p.film, cv = p.canvas as HTMLCanvasElement;
    const ctx = cv.getContext("2d")!;
    const S = 10, cols = Math.round(cv.width / S), rowsN = Math.round(cv.height / S);
    const small = Object.assign(document.createElement("canvas"), { width: cols, height: rowsN });
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    const chapters: [number, string][] = film.chapters?.length ? film.chapters : [[0, ""]];
    // Chapters a film keeps at full width (`vertical.wide`: their start times), e.g. a chart that grows across the frame
    const wide: number[] = film.vertical?.wide ?? [];
    return chapters.map(([a], i) => {
      if (wide.some((w) => Math.abs(w - a) < 0.01)) return [a, cv.width / 2, cv.width];
      const b = i + 1 < chapters.length ? chapters[i + 1][0] : film.duration;
      // Weight each column by how much of it is bright, and only count columns with real mass (big type, sprites,
      // bars): corner labels, hairlines and particles are texture and must not widen the frame.
      const mass = new Array(cols).fill(0);
      let lo = cols, hi = -1;
      // Skip the first 30% of a chapter: its opening hit flashes the whole frame.
      for (const f of [0.3, 0.55, 0.8]) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        film.draw(ctx, a + (b - a) * f); // raw film time: the cold open doesn't apply here
        sctx.drawImage(cv, 0, 0, cols, rowsN);
        const d = sctx.getImageData(0, 0, cols, rowsN).data;
        const count = new Array(cols).fill(0);
        let bright = 0;
        for (let y = 0; y < rowsN; y++)
          for (let x = 0; x < cols; x++) {
            const k = (y * cols + x) * 4;
            if (0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2] > 50) {
              count[x]++;
              bright++;
            }
          }
        if (bright > 0.6 * cols * rowsN) continue; // a flash or a bright full-frame scene says nothing about framing
        for (let x = 0; x < cols; x++) {
          if (count[x] >= 6) mass[x] += count[x];
          if (count[x] >= 2) {
            lo = Math.min(lo, x);
            hi = Math.max(hi, x);
          }
        }
      }
      const total = mass.reduce((s, m) => s + m, 0);
      if (total > 0) {
        // the columns holding the middle 98% of the mass
        let acc = 0;
        lo = -1;
        for (let x = 0; x < cols; x++) {
          acc += mass[x];
          if (lo < 0 && acc >= 0.01 * total) lo = x;
          if (acc >= 0.99 * total) {
            hi = x;
            break;
          }
        }
      }
      if (hi < lo || lo < 0) return [a, cv.width / 2, cv.width]; // nothing found: show the whole width
      const pad = 90;
      return [a, ((lo + hi + 1) / 2) * S, Math.min(cv.width, (hi - lo + 1) * S + 2 * pad)];
    });
  });
  await browser.close();
  server.stop(true);
  const out = join(ROOT, filmDir, "reframe.json");
  writeFileSync(out, JSON.stringify(rows.map((r) => r.map((n) => Math.round(n * 100) / 100))) + "\n");
  console.log(out);
  for (const [t, cx, w] of rows) console.log(`  ${t.toFixed(2).padStart(6)} s   centre ${String(Math.round(cx)).padStart(4)}   width ${Math.round(w)}`);
}

// ---------------------------------------------------------------- main

if (mode === "serve") {
  const server = startServer(Number(opt("port", "5173")));
  console.log(`Preview server: http://localhost:${server.port}/films/<name>/`);
} else if (mode === "video") {
  const format = opt("format", "all")!;
  if (format !== "all") await renderVideo(format);
  else {
    // One process per format: a fresh browser and server for each (a second render in the same process once stalled).
    const rest = args.slice(2).filter((a, i, all) => a !== "--format" && all[i - 1] !== "--format");
    for (const f of ["16x9", "9x16"]) {
      const p = Bun.spawnSync([process.execPath, import.meta.path, "video", filmDir, "--format", f, ...rest], { stdout: "inherit", stderr: "inherit" });
      if (p.exitCode !== 0) process.exit(p.exitCode ?? 1);
    }
  }
}
else if (mode === "stills") await renderStills();
else if (mode === "sheet") await renderSheet();
else if (mode === "cuts") await renderCuts();
else if (mode === "reframe") await renderReframe();
else {
  console.log("Usage: bun render/render.ts <serve|video|stills|sheet|cuts|reframe> [films/<name>] [options]");
  process.exit(1);
}
