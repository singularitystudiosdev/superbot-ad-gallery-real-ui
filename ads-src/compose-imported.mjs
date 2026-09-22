import { chromium } from 'playwright';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
const H = 1080; // the imported art is 1920x1080 — native height, so 16:9 stays byte-identical
const ARS = { '4x5': 4/5, '16x9': 16/9, '4x3': 4/3, '1x1': 1 };
// refusing and slow moved to the HTML family (ads-src/agents-pain) so their
// type matches the ad spot; only the workspace poster is still imported art
const ADS = ['agent-workspace-poster'];
const frame = 'file://' + resolve('.tmp/compose/frame.html');
const b = await chromium.launch();
for (const id of ADS) {
  copyFileSync(`.tmp/compose/${id}.src.png`, `assets/ads/${id}.16x9.png`); // original bytes
  for (const [key, r] of Object.entries(ARS)) {
    if (key === '16x9') { console.log(id, key, '1920x1080 (original bytes)'); continue; }
    const w = Math.round(H * r);
    const p = await b.newPage({ viewport: { width: w, height: H }, deviceScaleFactor: 1 });
    await p.goto(`${frame}?src=${id}.src.png`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => { const i = document.getElementById('art'); return i.complete && i.naturalWidth > 0; });
    await p.waitForTimeout(200);
    const box = await p.locator('#art').boundingBox();
    await p.screenshot({ path: `assets/ads/${id}.${key}.png` });
    console.log(id, key, `${w}x${H}`, 'art', Math.round(box.width) + 'x' + Math.round(box.height));
    await p.close();
  }
}
await b.close();
