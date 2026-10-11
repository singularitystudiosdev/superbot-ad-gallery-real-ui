// static server over this directory: node serve.mjs [port]   (prints the url; ./ is the stage root)
import { createServer } from 'node:http'; import { readFile } from 'node:fs/promises'; import { extname, join, normalize } from 'node:path'; import { fileURLToPath } from 'node:url'
const ROOT = fileURLToPath(new URL('.', import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const srv = createServer(async (q, r) => {
  try { const u = decodeURIComponent(q.url.split('?')[0]); const p = normalize(join(ROOT, u.endsWith('/') ? u + 'index.html' : u)); if (!p.startsWith(ROOT)) { r.writeHead(403).end(); return } const b = await readFile(p); r.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(b) } catch { r.writeHead(404).end('nf') }
}).listen(Number(process.argv[2] || 0), '127.0.0.1', () => console.log(`stage http://127.0.0.1:${srv.address().port}/`))
