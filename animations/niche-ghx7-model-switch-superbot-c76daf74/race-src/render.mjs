// Render beat D (race.html) frame by frame in headless Chromium and encode the clip.
//   node render.mjs                 156 frames (30 fps, 5.20 s) -> ../video/race-16x9.mp4 (H.264 yuv420p CRF 16),
//                                   ../video/race-16x9.webm (VP9, same frames), ../video/race-poster.png (t = 4.6 s),
//                                   and the review contact sheet (every 0.25 s) in SCRATCH/motion/contact.png
//   node render.mjs --shots 1.2,4.6 just those stills, to SCRATCH/motion/shot-<t>.png (review only)
// Headless only (Playwright's chrome-headless-shell); never drives a user browser. Each frame is window.seek(f / 30)
// on a page frozen with ?t=0, so a frame is a pure function of its index.
import { chromium } from '/Users/adrianagne/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO = path.resolve(HERE, '../video');
const SCRATCH = '/Users/adrianagne/Documents/cosmos/projects/niche-superbot-uploader/.tmp/ghx7-c76daf74/motion';
const FRAMES = path.join(SCRATCH, 'frames');
const FPS = 30, N = 156; // 5.20 s exactly
const POSTER_T = 4.6;

const args = process.argv.slice(2);
const shotsArg = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;

mkdirSync(SCRATCH, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`));
await page.goto(pathToFileURL(path.join(HERE, 'race.html')).href + '?t=0', { waitUntil: 'load' });
await page.evaluate(() => window.__ready);
const fb = await page.evaluate(() => [...document.querySelectorAll('.av.fb')].map((e) => e.dataset.src));
if (fb.length) logs.push(`[fallback avatars] ${fb.join(', ')}`);

async function shoot(t, file) {
  await page.evaluate((tt) => window.seek(tt), t);
  await page.screenshot({ path: file, type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

if (shotsArg) {
  for (const s of shotsArg.split(',')) await shoot(parseFloat(s), path.join(SCRATCH, `shot-${s}.png`));
  await browser.close();
  console.log(logs.join('\n') || 'no console output');
  process.exit(0);
}

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(VIDEO, { recursive: true });
for (let f = 0; f < N; f++) await shoot(f / FPS, path.join(FRAMES, `f${String(f).padStart(3, '0')}.png`));
await browser.close();

const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const IN = ['-framerate', String(FPS), '-i', path.join(FRAMES, 'f%03d.png')];
ff([...IN, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-frames:v', String(N),
  '-movflags', '+faststart', '-an', path.join(VIDEO, 'race-16x9.mp4')]);
ff([...IN, '-c:v', 'libvpx-vp9', '-crf', '22', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-frames:v', String(N), '-an', path.join(VIDEO, 'race-16x9.webm')]);
copyFileSync(path.join(FRAMES, `f${String(Math.round(POSTER_T * FPS)).padStart(3, '0')}.png`), path.join(VIDEO, 'race-poster.png'));

// contact sheet: every 0.25 s (t = 0, 0.25, ... 5.00, plus the last frame), 5 columns, 640x360 tiles
const picks = [];
for (let k = 0; k * 0.25 <= 5.0 + 1e-9; k++) picks.push(Math.floor(k * 0.25 * FPS + 1e-9));
picks.push(N - 1);
const inputs = picks.flatMap((f) => ['-i', path.join(FRAMES, `f${String(f).padStart(3, '0')}.png`)]);
const cols = 4, rows = Math.ceil(picks.length / cols);
// row-major, unlabelled (this ffmpeg build has no drawtext): tile k is t = k * 0.25 s, the last tile is frame 155
const chains = picks.map((f, i) => `[${i}:v]scale=640:360[v${i}]`);
const layout = picks.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
ff([...inputs, '-filter_complex', `${chains.join(';')};${picks.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${picks.length}:layout=${layout}:fill=black[out]`,
  '-map', '[out]', '-frames:v', '1', path.join(SCRATCH, 'contact.png')]);
console.log(logs.join('\n') || 'no console output');
console.log('frames', N, 'poster', existsSync(path.join(VIDEO, 'race-poster.png')));
