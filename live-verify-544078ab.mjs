import { chromium } from '/Users/adrianagne/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const fails = []; p.on('requestfailed', r => fails.push(r.url()));
await p.goto('https://singularitystudiosdev.github.io/superbot-ad-gallery/animations/icons-chaos-slam-superbot-544078ab/?t=4.45', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const r = await p.evaluate(() => {
  const doc = document.querySelector('.app.doc svg').getBoundingClientRect();
  const app = document.querySelector('.app:not(.doc) svg');
  return { docBox: [Math.round(doc.width), Math.round(doc.height)], appFill: getComputedStyle(app).fill };
});
console.log(JSON.stringify(r), 'reqfailed:', fails.length ? fails : 'none');
await p.screenshot({ path: 'live-fixed-4.45.png' });
await b.close();
