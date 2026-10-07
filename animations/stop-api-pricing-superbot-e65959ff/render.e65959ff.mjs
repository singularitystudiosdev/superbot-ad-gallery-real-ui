// render.e65959ff.mjs: frame-exact offline render of one stop-api-pricing variant (the ab7049c5 renderer's contract).
//
// window.__AD = { CYCLE, ready, seek(t) } and seek(t) is a pure function of t, so every 1/60 s frame can be captured
// in any order and gives the same pixels. Walks the whole cycle at 60 fps, screenshots each frame into a scratch
// dir (resumable: a frame already on disk is skipped), then encodes
//   assets/video/stop-api-pricing-superbot-e65959ff-<v>.16x9.mp4  (+ .render.json beside it)
//
//   node render.e65959ff.mjs --v a|b|c [--url <page url>] [--frames <dir>] [--out <mp4>] [--pw <dir holding node_modules/playwright>] [--force]
//
// Playwright is not a dependency of this repo; --pw points at any checkout that already has it installed.

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '..', '..');
const FOLDER = 'stop-api-pricing-superbot-e65959ff';
const FPS = 60, W = 1920, H = 1080;

const argv = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : dflt; };
const has = (name) => process.argv.includes(`--${name}`);

const v = argv('v', 'a');
if (!['a', 'b', 'c'].includes(v)) throw new Error(`unknown --v ${v} (a, b or c)`);
const ID = `${FOLDER}-${v}`;
const url = argv('url', `http://127.0.0.1:8691/animations/${FOLDER}/`);
const framesDir = path.resolve(argv('frames', path.join(os.tmpdir(), `e65959ff-render-${v}`)));
const outPath = path.resolve(argv('out', path.join(REPO, 'assets', 'video', `${ID}.16x9.mp4`)));
const require = createRequire(path.join(path.resolve(argv('pw', process.cwd())), 'node_modules', '/'));
const { chromium } = require('playwright');

const framePath = (i) => path.join(framesDir, `f${String(i).padStart(5, '0')}.png`);
const frameDone = (p) => { try { return fs.statSync(p).size > 0; } catch { return false; } };
fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const problems = [];
page.on('pageerror', (e) => problems.push(String(e.stack || e)));
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
await page.goto(`${url}?v=${v}&t=0`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 30000 });
const cycle = await page.evaluate(() => window.__AD.CYCLE);
if (!(cycle > 0)) throw new Error(`bad __AD.CYCLE: ${cycle}`);
const total = Math.round(cycle * FPS);

let captured = 0, skipped = 0;
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const p = framePath(i);
  if (!has('force') && frameDone(p)) { skipped++; continue; }
  await page.evaluate((tt) => window.__AD.seek(tt), +(i / FPS).toFixed(6));
  await page.screenshot({ path: p });
  if (++captured % 120 === 0) console.log(`[render ${v}] ${captured + skipped}/${total} frames (${((Date.now() - t0) / captured).toFixed(0)} ms/frame)`);
}
await browser.close();
if (problems.length) throw new Error(`page reported ${problems.length} error(s); first: ${problems[0]}`);
const missing = [];
for (let i = 0; i < total; i++) if (!frameDone(framePath(i))) missing.push(i);
if (missing.length) throw new Error(`${missing.length} frames missing (first ${missing.slice(0, 5).join(', ')}): re-run to resume`);
console.log(`[render ${v}] frames: ${captured} captured, ${skipped} resumed (${framesDir})`);

const enc = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.png'),
  '-frames:v', String(total), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart', '-an', outPath], { stdio: 'inherit' });
if (enc.status !== 0) throw new Error(`ffmpeg exited ${enc.status}`);

const meta = {
  contract: 'frame-exact-v6:60fps+freeze+css-birth+per-clip-grid+midframe-seek+single-seek-authority',
  fps: FPS, id: ID, folder: FOLDER, v, cut: null, query: `v=${v}`, at: new Date().toISOString(),
  ar: '16x9', width: W, height: H, frames: total, cycle: +cycle.toFixed(4), duration: +(total / FPS).toFixed(4),
  encoder: 'libx264 crf18 yuv420p +faststart', bytes: fs.statSync(outPath).size,
};
fs.writeFileSync(`${outPath}.render.json`, JSON.stringify(meta, null, 2) + '\n');
console.log(`[render ${v}] wrote ${outPath} (${(meta.bytes / 1048576).toFixed(2)} MB, ${meta.duration}s, ${total} frames)`);
