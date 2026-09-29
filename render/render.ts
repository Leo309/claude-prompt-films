#!/usr/bin/env bun
/**
 * Offline renderer for code-rendered films.
 *
 *   bun render/render.ts serve [--port 5173]               preview server → http://localhost:5173/films/<name>/
 *   bun render/render.ts video  films/lebron               MP4s → out/lebron-16x9.mp4 + out/lebron-9x16.mp4
 *   bun render/render.ts video  films/lebron --format 9x16  just one format (16x9 | 9x16 | all, default all)
 *   bun render/render.ts video  films/lebron --from 30 --to 40 --fps 30 --out out/draft.mp4
 *   bun render/render.ts stills films/lebron --at 3,12.5,40   PNGs → out/lebron/stills/
 *   bun render/render.ts sheet  films/lebron [--count 24]   contact sheet → out/lebron/sheet.png
 *   add --no-watermark to any of them to leave out the watermark (render/brand.js);
 *   stills and sheet take --format 9x16 to preview the vertical frame
 *
 * Frames never touch the disk: headless Chrome draws each frame, sends raw RGBA
 * over a WebSocket, and we pipe it straight into ffmpeg's stdin.
 */
import { chromium, type Browser, type Page } from "playwright-core";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
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
  await page.goto(`http://localhost:${server.port}/${filmDir}/?${query}${wm}`);
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
    "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest",
    out,
  ];
}

async function renderVideo(format: string) {
  const name = basename(filmDir);
  const fps = Number(opt("fps", "60"));
  const from = Number(opt("from", "0"));
  const to = opt("to") ? Number(opt("to")) : undefined;
  const out = resolve(opt("out", join(ROOT, "out", `${name}-${format}.mp4`))!);
  const work = join(ROOT, "out", name);
  mkdirSync(work, { recursive: true });
  const wav = join(work, `score-${format}.wav`);

  let ff: ChildProcessWithoutNullStreams | null = null;
  let expectAudio: { sampleRate: number; channels: number } | null = null;
  let total = 0, done = 0;
  const t0 = performance.now();
  // Watchdog: a render that stops receiving frames fails loudly instead of hanging forever.
  let lastMessage = performance.now();
  const watchdog = setInterval(() => {
    if (performance.now() - lastMessage > 90_000) {
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
        ff.stderr.on("data", (d) => process.stderr.write(d));
        ff.on("exit", (code) => code && console.error(`ffmpeg exited with code ${code}`));
        console.log(`Rendering ${total} frames (${(total / fps).toFixed(1)} s at ${fps} fps) → ${out}`);
        ws.send("ack");
      } else if (m.type === "done") {
        ff!.stdin.end();
        const [code] = await once(ff!, "exit");
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
    if (!ff!.stdin.write(msg)) await once(ff!.stdin, "drain");
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
  const dir = join(ROOT, "out", basename(filmDir), "stills");
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
  const dir = join(ROOT, "out", basename(filmDir), "sheet");
  await grabStills(page, times, dir);
  await browser.close();
  server.stop(true);
  const out = join(ROOT, "out", basename(filmDir), opt("name", "sheet.png")!);
  const rows = Math.ceil(count / cols);
  const ff = spawn("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-pattern_type", "glob", "-i", join(dir, "*.png"),
    "-vf", `scale=${opt("format") === "9x16" ? 270 : 480}:-1,tile=${cols}x${rows}:padding=6:margin=6:color=0x333333`, "-frames:v", "1", out,
  ]);
  const [code] = await once(ff, "exit");
  if (code !== 0) throw new Error("ffmpeg tile failed");
  console.log(out);
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
else {
  console.log("Usage: bun render/render.ts <serve|video|stills|sheet> [films/<name>] [options]");
  process.exit(1);
}
