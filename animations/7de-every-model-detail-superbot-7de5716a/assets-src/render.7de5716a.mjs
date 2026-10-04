// Frame-exact 16:9 render: seek the spot through window.__AD.seek(t) one frame at a time in headless Chrome at
// 1920x1080 and pipe the PNGs into ffmpeg (H.264, yuv420p, faststart). Writes <out>.render.json beside the MP4.
// usage: node render.7de5716a.mjs <url> <out.mp4> [fps=60]
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const [url, out, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg) || 60;
const exe = `${os.homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.body.classList.add('freeze'));
const cycle = await page.evaluate(() => window.__V7.CYCLE);
const frames = Math.round(cycle * fps);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.__AD.seek(t), i / fps);
  const png = await page.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 120 === 0) console.log(`frame ${i}/${frames} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await done;
await browser.close();
writeFileSync(`${out}.render.json`, JSON.stringify({ source: url, method: `frame-exact:${fps}fps+__AD.seek`, fps, frames, duration: cycle, size: '1920x1080', rendered: new Date().toISOString() }, null, 2));
console.log('done', out, frames, 'frames', ((Date.now() - t0) / 1000).toFixed(0), 's');
