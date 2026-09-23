// Renders mascot-layer.html to a transparent PNG sequence (headless Chromium, omitBackground).
// usage: node render-mascot.mjs <outDir>   (playwright-core from PW_DIR, default /private/tmp/claude-501/pw)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(path.join(process.env.PW_DIR || '/private/tmp/claude-501/pw', 'index.js'));
const { chromium } = require('playwright-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--single-process', '--no-zygote'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'mascot-layer.html')).href);
const n = await page.evaluate(() => window.N);
for (let f = 0; f < n; f++) {
  await page.evaluate((i) => window.renderFrame(i), f);
  await page.screenshot({ path: path.join(out, `m${String(f).padStart(4, '0')}.png`), omitBackground: true });
}
// frame 74's pose, for index.html's HOP_FROM (the live mascot takes over from it on the clean frame 75)
const hand = await page.evaluate(() => window.handoff());
writeFileSync(path.join(out, 'handoff.json'), JSON.stringify(hand, null, 1));
await browser.close();
console.log('rendered', n, JSON.stringify(hand));
