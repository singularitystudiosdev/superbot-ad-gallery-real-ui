// Rasterise every meme in memes.7de5716a.html into ../img/<name>.png.
// usage: node shoot-memes.7de5716a.mjs <baseUrl-of-memes.html> [name,name]
import { chromium } from 'playwright-core';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [base, only] = process.argv.slice(2);
const exe = `${os.homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const browser = await chromium.launch({ executablePath: exe, headless: true });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(base, { waitUntil: 'load' });
const names = only ? only.split(',') : await page.evaluate(() => window.MEME_NAMES);
for (const n of names) {
  await page.goto(`${base}?m=${n}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.MEME_READY);
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(here, '..', 'img', `${n}.png`);
  await page.locator('#m').screenshot({ path: out });
  console.log(out);
}
await browser.close();
