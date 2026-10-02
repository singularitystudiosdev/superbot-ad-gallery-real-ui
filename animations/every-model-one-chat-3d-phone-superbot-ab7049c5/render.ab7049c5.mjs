// render.ab7049c5.mjs — frame-exact offline render of the 3D-phone ad spot.
//
// Contract (see stage.js): window.__AD = { CYCLE, ready, seek(t) }, and seek(t) is a pure
// function of t, so every 1/60s frame can be captured in any order and gives the same pixels.
// This script walks the whole cycle at 60fps, screenshots each frame into a scratch dir
// (resumable — a frame already on disk is skipped), then ffmpeg-encodes the sequence into
//   assets/video/every-model-one-chat-3d-phone-superbot-ab7049c5.<ar>.mp4
// next to its sibling .render.json.
//
//   node render.ab7049c5.mjs [--ar 4x5] [--url <page url>] [--frames <scratch dir>]
//                            [--out <mp4 path>] [--frames-only] [--force] [--limit N]
//
// --limit N stops after the first N frames of the cycle (a partial preview, not the shipped cut).
//
// Playwright lives in an out-of-tree tools dir (the brief's), so it is required by absolute
// path with createRequire rather than as a bare specifier.

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '..', '..');            // .tmp/real-ui
const ID = 'every-model-one-chat-3d-phone-superbot-ab7049c5';
const PLAYWRIGHT_TOOLS = '/tmp/ab7049c5-tools';
const FPS = 60;
const SIZES = { '16x9': [1920, 1080], '4x3': [1440, 1080], '1x1': [1080, 1080], '4x5': [864, 1080] };

function argv(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}
const has = (name) => process.argv.includes(`--${name}`);

const ar = argv('ar', '4x5');
if (!SIZES[ar]) throw new Error(`unknown --ar ${ar} (one of ${Object.keys(SIZES).join(', ')})`);
const [vw, vh] = SIZES[ar];
const url = argv('url', `http://127.0.0.1:8633/animations/${ID}/`);
const framesDir = path.resolve(argv('frames', path.join(os.tmpdir(), `ab7049c5-render-${ar}`)));
const outPath = path.resolve(argv('out', path.join(REPO, 'assets', 'video', `${ID}.${ar}.mp4`)));
const renderJson = `${outPath}.render.json`;

const require = createRequire(path.join(PLAYWRIGHT_TOOLS, '/'));
const { chromium } = require('playwright');

const ffmpegBin = argv('ffmpeg', 'ffmpeg');
if (!has('frames-only')) {
  const probe = spawnSync('command', ['-v', ffmpegBin], { shell: true, encoding: 'utf8' });
  if (probe.status !== 0) throw new Error(`${ffmpegBin} not on PATH — install it (brew install ffmpeg) before rendering`);
}

const framePath = (i) => path.join(framesDir, `f${String(i).padStart(5, '0')}.png`);
const frameDone = (p) => { try { return fs.statSync(p).size > 0; } catch { return false; } };

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const sep = url.includes('?') ? '&' : '?';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });

await page.goto(`${url}${sep}ar=${ar}&t=0`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 40000 });
await page.evaluate(() => document.fonts && document.fonts.ready);
// the source spot inside the phone comes up a beat after the stage's own ready flag
await page.waitForTimeout(1500);

const cycle = await page.evaluate(() => window.__AD.CYCLE);
if (!(cycle > 0)) throw new Error(`bad __AD.CYCLE: ${cycle}`);
const limit = +(argv('limit', '0') || 0);
const total = limit > 0 ? Math.min(limit, Math.round(cycle * FPS)) : Math.round(cycle * FPS);
if (limit > 0) console.log(`[render] --limit ${limit}: a PARTIAL preview (${total} of ${Math.round(cycle * FPS)} frames), do not ship it`);

// --- capture ---
let captured = 0, skipped = 0;
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const p = framePath(i);
  if (!has('force') && frameDone(p)) { skipped++; continue; }
  await page.evaluate((tt) => { window.__AD.seek(tt); }, +(i / FPS).toFixed(6));
  await page.waitForTimeout(40);
  await page.screenshot({ path: p });
  captured++;
  if (captured % 120 === 0) {
    const done = captured + skipped;
    const rate = (Date.now() - t0) / Math.max(1, captured);
    console.log(`[render] ${done}/${total} frames (${rate.toFixed(0)}ms/frame, ~${((total - done) * rate / 60000).toFixed(1)}min left)`);
  }
}
await browser.close();
console.log(`[render] frames ${captured} captured, ${skipped} resumed from disk — ${framesDir}`);

const missing = [];
for (let i = 0; i < total; i++) if (!frameDone(framePath(i))) missing.push(i);
if (missing.length) throw new Error(`${missing.length} frames missing after capture (first ${missing.slice(0, 5).join(', ')}) — re-run to resume`);
if (problems.length) console.warn(`[render] page reported ${problems.length} error(s); first: ${problems[0]}`);

if (has('frames-only')) {
  console.log('[render] --frames-only: skipping the encode');
  process.exit(0);
}

// --- encode ---
const ffArgs = [
  '-hide_banner', '-y',
  '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.png'),
  '-frames:v', String(total),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2',
  '-movflags', '+faststart',
  '-an',
  outPath,
];
console.log(`[render] ffmpeg ${ffArgs.join(' ')}`);
const enc = spawnSync(ffmpegBin, ffArgs, { stdio: 'inherit' });
if (enc.status !== 0) throw new Error(`ffmpeg exited ${enc.status}`);

const bytes = fs.statSync(outPath).size;
const duration = total / FPS;
const meta = {
  contract: 'frame-exact-v6:60fps+freeze+css-birth+per-clip-grid+midframe-seek+single-seek-authority',
  fps: FPS,
  id: ID,
  folder: ID,
  v: null,
  cut: null,
  at: new Date().toISOString(),
  ar,
  width: vw,
  height: vh,
  frames: total,
  cycle: +cycle.toFixed(4),
  duration: +duration.toFixed(4),
  encoder: `libx264 crf18 yuv420p +faststart (ffmpeg ${spawnSync(ffmpegBin, ['-version'], { encoding: 'utf8' }).stdout.split('\n')[0].replace('ffmpeg version ', '').split(' ')[0]})`,
  bytes,
};
fs.writeFileSync(renderJson, JSON.stringify(meta, null, 2) + '\n');
console.log(`[render] wrote ${outPath} (${(bytes / 1048576).toFixed(2)} MB, ${duration.toFixed(3)}s, ${total} frames)`);
console.log(`[render] wrote ${renderJson}`);