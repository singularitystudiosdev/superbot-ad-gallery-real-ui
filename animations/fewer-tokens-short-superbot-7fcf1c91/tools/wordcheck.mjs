// 35-clipcheck — for each t, report text in the thread feed / composer / palette that is clipped (scrollWidth > clientWidth) or leaves the viewport.
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const ROOT = '/Users/adrianagne/Documents/cosmos/projects/negativity-agg/.tmp/rui-feedads.7fcf1c91'
const FOLDER = 'fewer-tokens-short-superbot-7fcf1c91'
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
    const re = /zazen|gemini|codex cli|kiro|amazon q|cowork|muse|\/doctor|copilot|roo code|qwen|windsurf|opencode|cherry|grok|zed:|ingest|ollama|llama|mistral|phi-4|cursor|devin|alex@|stub@|tbnr|error|limit|expired|failed|outage|denied|forbidden|not_allowed|no_route|unauthor|invalid|too many|needs attention|rob@/i
    const out = []; const W = innerWidth, H = innerHeight
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let nd
    while ((nd = w.nextNode())) {
      const tx = nd.textContent; if (!re.test(tx)) continue
      const el = nd.parentElement; if (!el || el.closest('script,style,[hidden],.sr-only,dialog:not([open])')) continue
      const rg = document.createRange(); rg.selectNodeContents(nd); const r = rg.getBoundingClientRect(); if (!r.width || !r.height) continue
      const cx = r.left + Math.min(r.width, 6), cy = r.top + r.height / 2
      if (cx < 0 || cy < 0 || cx > W || cy > H) continue
      const hit = document.elementFromPoint(cx, cy)
      if (hit && (el.contains(hit) || hit.contains(el))) { const cs = getComputedStyle(el); if (cs.visibility !== 'hidden' && cs.opacity !== '0') out.push('VISIBLE: ' + tx.trim().slice(0, 60)) }
    }
    return out
  })
  n++
  for (const r of res) bad.set(r, (bad.get(r) || 0) + 1)
}
console.log(JSON.stringify({ ar, frames: n, issues: [...bad.entries()] }, null, 1))
await br.close(); srv.close()
