// 35-clipcheck — for each t, report text in the thread feed / composer / palette that is clipped (scrollWidth > clientWidth) or leaves the viewport.
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const ROOT = '/Users/adrianagne/Documents/cosmos/projects/negativity-agg/.tmp/rui-feedads.7fcf1c91'
const FOLDER = 'live-limits-short-superbot-7fcf1c91'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' }
const [ar, step = '0.5'] = process.argv.slice(2)
const srv = createServer(async (q, r) => { try { const p = normalize(join(ROOT, decodeURIComponent(q.url.split('?')[0]))); const b = await readFile(p); r.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); r.end(b) } catch { r.writeHead(404).end('nf') } })
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port
const { chromium } = await import('/Users/adrianagne/Documents/cosmos/projects/quick-chats/superbot-ad-gallery-real-ui.ea5050ae/node_modules/playwright/index.mjs')
const SIZE = { '4x5': [1080, 1350], '16x9': [1920, 1080], '4x3': [1440, 1080], '1x1': [1080, 1080] }[ar]
const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: SIZE[0], height: SIZE[1] }, deviceScaleFactor: 1 })
await pg.goto(`http://127.0.0.1:${port}/animations/${FOLDER}/index.html?ar=${ar}`, { waitUntil: 'load' })
await pg.waitForFunction(() => window.__AD && window.__AD.ready, null, { timeout: 45000 })
const fr = pg.frames().find((f) => f.url().includes('frame.html'))
const cyc = await pg.evaluate(() => window.__AD.CYCLE)
const bad = new Map(); let n = 0
for (let t = 0; t <= cyc - 0.01; t += Number(step)) {
  await pg.evaluate((tt) => window.__AD.seek(tt), t)
  const res = await fr.evaluate(() => {
    const out = []; const W = innerWidth, H = innerHeight
    const roots = ['[data-testid="feed"]', '[data-testid="composer"]', 'dialog[data-testid="command-palette"]', '.sb-platpop', '[data-sb-endcard]', '[data-testid="settings-overlay"]']
    for (const rs of roots) for (const root of document.querySelectorAll(rs)) {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let nd; while ((nd = w.nextNode())) {
        if (!/\S/.test(nd.textContent)) continue
        const el = nd.parentElement; if (!el || el.closest('[data-slot="code-block-body"],[data-slot="diff-body"],script,style,[hidden],.sr-only')) continue
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue
        const rg = document.createRange(); rg.selectNodeContents(nd); const r = rg.getBoundingClientRect(); if (!r.width) continue
        if (r.right > W + 0.5 || r.left < -0.5) out.push('offscreen-x: ' + nd.textContent.trim().slice(0, 40))
        const trunc = el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible' && el.clientWidth > 0
        if (trunc && !el.closest('.sb-tool-diff-toggle')) out.push('clipped: ' + el.className.toString().slice(0, 30) + ' | ' + nd.textContent.trim().slice(0, 40))
      }
    }
    return out
  })
  n++
  for (const r of res) bad.set(r, (bad.get(r) || 0) + 1)
}
console.log(JSON.stringify({ ar, frames: n, issues: [...bad.entries()] }, null, 1))
await br.close(); srv.close()
