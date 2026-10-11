// shot — freeze-frame the ad at chosen times. usage: node tools/shot.mjs <folderId> <ar,ar> <t,t,...> <outDir> [prefix]
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'; import { mkdirSync } from 'node:fs'; import { extname, join, normalize } from 'node:path'
const ROOT = '/Users/adrianagne/Documents/cosmos/projects/negativity-agg/.tmp/rui-feedads.7fcf1c91'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' }
const [ID, arsS, timesS, outDir, prefix = 's'] = process.argv.slice(2)
const ars = arsS.split(','), times = timesS.split(',').map(Number)
mkdirSync(outDir, { recursive: true })
const srv = createServer(async (q, r) => { try { const p = normalize(join(ROOT, decodeURIComponent(q.url.split('?')[0]))); if (!p.startsWith(ROOT)) { r.writeHead(403).end(); return } const b = await readFile(p); r.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); r.end(b) } catch { r.writeHead(404).end('nf') } })
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port
const { chromium } = await import('/Users/adrianagne/Documents/cosmos/projects/quick-chats/superbot-ad-gallery-real-ui.ea5050ae/node_modules/playwright/index.mjs')
const SIZE = { '4x5': [1080, 1350], '16x9': [1920, 1080], '4x3': [1440, 1080], '1x1': [1080, 1080] }
const br = await chromium.launch()
for (const ar of ars) {
  const [w, h] = SIZE[ar]; const pg = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e))); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await pg.goto(`http://127.0.0.1:${port}/animations/${ID}/index.html?ar=${ar}`, { waitUntil: 'load' })
  await pg.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 45000 })
  const cyc = await pg.evaluate(() => window.__AD.CYCLE); const err = await pg.evaluate(() => window.__AD.error)
  if (err) console.log('SCENE ERROR', err)
  for (const t of times) { await pg.evaluate((tt) => window.__AD.seek(tt), t); await pg.waitForTimeout(120); const o = `${outDir}/${prefix}-${ar}-t${t}.png`; await pg.screenshot({ path: o }); console.log(o) }
  console.log('cycle', cyc, 'errors', errs.slice(0, 5)); await pg.close()
}
await br.close(); srv.close()
