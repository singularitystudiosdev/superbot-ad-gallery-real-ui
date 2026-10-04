// render.47125cad.mjs: frame-exact offline render of the ghx2 spot (adapted from
// ../every-model-one-chat-3d-phone-superbot-ab7049c5/render.ab7049c5.mjs).
//
// Contract (timeline.js): window.__AD = { CYCLE, FPS, ready, seek(t), settle() }; seek(t) is a pure function of t, so
// every 1/30 s frame can be captured in any order and gives the same pixels. The script serves the gallery worktree
// over a private 127.0.0.1 port (the page fetches its gh/*.html fragments, so file:// will not do), opens it in
// headless Chromium (Playwright, a fresh temp profile per launch), walks frames 0..N-1 with seek(n/30) + settle() +
// screenshot (resumable: a frame already on disk is skipped), then encodes them with ffmpeg:
//   H.264 High, yuv420p, 30 fps CFR, crf 16, +faststart, 1920x1080, no audio
// into ../../assets/video/niche-ghx2-model-switch-superbot-47125cad.16x9.mp4.
//
//   node render.47125cad.mjs [--frames <dir>] [--from N] [--to N] [--frames-only] [--encode-only] [--force]
//   node render.47125cad.mjs --stills 0.4,1.1,2.0 [--stills-dir <dir>]      (QA stills only, no encode)
//   node render.47125cad.mjs --qa                                           (per-frame layout checks, no capture)
//
// --from/--to render a chunk of frames (the encode needs every frame on disk). Playwright is resolved from
// PLAYWRIGHT_DIR (default: the workspace's node_modules/playwright).
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '..', '..');
const ID = 'niche-ghx2-model-switch-superbot-47125cad';
const FPS = 30, VW = 1920, VH = 1080;
const PLAYWRIGHT_DIR = process.env.PLAYWRIGHT_DIR || '/Users/adrianagne/Projects/cosmos/node_modules/playwright';

const argv = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : dflt; };
const has = (name) => process.argv.includes(`--${name}`);
const framesDir = path.resolve(argv('frames', path.join(os.tmpdir(), '47125cad-frames')));
const outPath = path.resolve(argv('out', path.join(REPO, 'assets', 'video', `${ID}.16x9.mp4`)));
const framePath = (i) => path.join(framesDir, `f${String(i).padStart(5, '0')}.png`);
const frameDone = (p) => { try { return fs.statSync(p).size > 0; } catch { return false; } };

// ---------- a private static server over the worktree ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
function serve() {
  const srv = http.createServer((req, res) => {
    let f = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(REPO)) { res.writeHead(403); res.end(); return; }
    if (f.endsWith(path.sep)) f = path.join(f, 'index.html');
    fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(buf);
    });
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function withPage(fn) {
  const require = createRequire(path.join(PLAYWRIGHT_DIR, '/'));
  const { chromium } = require(PLAYWRIGHT_DIR);
  const srv = await serve();
  const browser = await chromium.launch({ headless: true });
  const problems = [];
  try {
    const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => problems.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
    page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/animations/${ID}/?t=0`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await fn(page);
  } finally {
    await browser.close();
    srv.close();
  }
  if (problems.length) { console.warn(`[render] page reported ${problems.length} problem(s):`); problems.slice(0, 10).forEach((p) => console.warn('  ' + p)); }
  return problems;
}

async function shoot(page, t, p) {
  await page.evaluate(async (tt) => { window.__AD.seek(tt); await window.__AD.settle(); }, t);
  await page.screenshot({ path: p });
}

// ---------- modes ----------
if (has('stills')) {
  const dir = path.resolve(argv('stills-dir', path.join(HERE, '..', '..', '..', 'ghx2-729001be', 'render')));
  fs.mkdirSync(dir, { recursive: true });
  const ts = argv('stills').split(',').map(Number);
  await withPage(async (page) => {
    for (const t of ts) {
      const p = path.join(dir, `still-${t.toFixed(2)}.png`);
      await shoot(page, Math.round(t * FPS) / FPS, p);
      console.log(`[render] ${p}`);
    }
  });
  process.exit(0);
}

if (has('qa')) {
  // every frame: the framed window keeps its top and left border with >= 56 px of stage around them
  await withPage(async (page) => {
    const total = Math.round((await page.evaluate(() => window.__AD.CYCLE)) * FPS);
    const bad = await page.evaluate(async (n) => {
      const out = [];
      const st = document.getElementById('stage').getBoundingClientRect();
      const k = st.width / 1920;
      for (let i = 0; i < n; i++) {
        window.__AD.seek(i / 30);
        const sec = document.getElementById('s-gh');
        if (!sec.classList.contains('on')) continue;
        for (const w of sec.querySelectorAll('.gh-window')) {
          const r = w.getBoundingClientRect();
          const L = (r.left - st.left) / k, T = (r.top - st.top) / k, R = 1920 - (r.right - st.left) / k, B = 1080 - (r.bottom - st.top) / k;
          const ok = (L >= 55.5 && T >= 55.5) || (T >= 55.5 && R >= 55.5) || (R >= 55.5 && B >= 55.5) || (B >= 55.5 && L >= 55.5);
          if (!ok) out.push({ frame: i, id: w.id, L: +L.toFixed(1), T: +T.toFixed(1), R: +R.toFixed(1), B: +B.toFixed(1) });
        }
      }
      return out;
    }, total);
    console.log(bad.length ? `[qa] ${bad.length} frame(s) break the two-edge rule: ${JSON.stringify(bad.slice(0, 8))}` : `[qa] all ${total} frames keep >= 56 px of stage on two adjacent window edges`);
  });
  process.exit(0);
}

fs.mkdirSync(framesDir, { recursive: true });
let total = 0;
if (!has('encode-only')) {
  await withPage(async (page) => {
    const cycle = await page.evaluate(() => window.__AD.CYCLE);
    total = Math.round(cycle * FPS);
    const from = +argv('from', '0'), to = Math.min(total, +argv('to', String(total)));
    let captured = 0, skipped = 0;
    const t0 = Date.now();
    for (let i = from; i < to; i++) {
      const p = framePath(i);
      if (!has('force') && frameDone(p)) { skipped++; continue; }
      await shoot(page, i / FPS, p);
      captured++;
    }
    console.log(`[render] frames ${from}..${to - 1}: ${captured} captured, ${skipped} on disk, ${((Date.now() - t0) / Math.max(1, captured)).toFixed(0)} ms/frame -> ${framesDir}`);
  });
}
if (has('frames-only')) process.exit(0);

total = total || +argv('total', '204');
const missing = [];
for (let i = 0; i < total; i++) if (!frameDone(framePath(i))) missing.push(i);
if (missing.length) throw new Error(`${missing.length} frames missing (first ${missing.slice(0, 5).join(', ')}): render the remaining chunks first`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const ffArgs = ['-hide_banner', '-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.png'), '-frames:v', String(total),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
  '-r', String(FPS), '-fps_mode', 'cfr', '-movflags', '+faststart', '-an', outPath];
console.log(`[render] ffmpeg ${ffArgs.join(' ')}`);
const enc = spawnSync('ffmpeg', ffArgs, { stdio: ['ignore', 'ignore', 'inherit'] });
if (enc.status !== 0) throw new Error(`ffmpeg exited ${enc.status}`);
console.log(`[render] wrote ${outPath} (${(fs.statSync(outPath).size / 1048576).toFixed(2)} MB, ${(total / FPS).toFixed(3)} s, ${total} frames)`);
