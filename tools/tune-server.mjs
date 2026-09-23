#!/usr/bin/env node
// Local preview + live layout tuner for the hub-real ads.
// Serves this repo with caching off, injects tools/hub-tune.js into every page that loads
// assets/hub-real.css, and writes the tuner's Save into a marked block at the end of that
// stylesheet (the block is stripped when served here, so the tuner's live rules are the only copy).
//   node tools/tune-server.mjs            -> http://localhost:8481/__tune/
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_FILE = path.join(ROOT, 'assets/hub-real.css');
const PORT = Number(process.env.PORT || 8481);
const START = '/* tune:start';
const END = '/* tune:end */';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
};

function splitBlock(text) {
  const a = text.indexOf(START);
  if (a < 0) return { head: text, block: '', tail: '' };
  const b = text.indexOf(END, a);
  if (b < 0) throw new Error(`${CSS_FILE}: "${START}" without "${END}"`);
  return { head: text.slice(0, a), block: text.slice(a, b + END.length), tail: text.slice(b + END.length) };
}

function stateFrom(block) {
  const m = block.match(/\/\* tune-state:(\{.*?\}) \*\//s);
  return m ? JSON.parse(m[1]) : null;
}

async function saveTune({ state, css }) {
  if (typeof css !== 'string' || css.includes('/* tune:') || css.length > 100_000) throw new Error('bad css payload');
  const stateJson = JSON.stringify(state).replaceAll('*/', '*\\/');
  const { head, tail } = splitBlock(await fs.readFile(CSS_FILE, 'utf8'));
  const block = css.trim()
    ? `${START} (written by tools/tune-server.mjs; the tuner reads the state line back) */\n/* tune-state:${stateJson} */\n${css.trim()}\n${END}`
    : '';
  const next = head.replace(/\s*$/, '\n') + (block ? `\n${block}\n` : '') + tail.replace(/^\s*/, '');
  await fs.writeFile(CSS_FILE, next);
}

async function hubAds() {
  const dir = path.join(ROOT, 'animations');
  const out = [];
  for (const slug of (await fs.readdir(dir)).sort()) {
    const html = await fs.readFile(path.join(dir, slug, 'index.html'), 'utf8').catch(() => '');
    if (html.includes('hub-real.css')) out.push(slug);
  }
  return out;
}

function send(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 400_000) throw new Error('body too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/__tune/state') {
    const { block } = splitBlock(await fs.readFile(CSS_FILE, 'utf8'));
    return send(res, 200, JSON.stringify(stateFrom(block)), 'application/json');
  }
  if (url.pathname === '/__tune/save' && req.method === 'POST') {
    await saveTune(JSON.parse(await readBody(req)));
    return send(res, 200, '{"ok":true}', 'application/json');
  }
  if (url.pathname === '/__tune/' || url.pathname === '/__tune') {
    const links = (await hubAds()).map((s) => `<li><a href="/animations/${s}/index.html">${s}</a></li>`).join('');
    return send(res, 200, `<!doctype html><meta charset=utf-8><title>hub-real tuner</title><body style="font:14px -apple-system,sans-serif;background:#111;color:#ddd;padding:24px"><h3>Ads using assets/hub-real.css</h3><ul>${links}</ul><p><a href="/">Gallery</a></p>`, TYPES['.html']);
  }

  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) return send(res, 403, 'forbidden');
  const stat = await fs.stat(file).catch(() => null);
  if (stat?.isDirectory()) file = path.join(file, 'index.html');
  const buf = await fs.readFile(file).catch(() => null);
  if (!buf) return send(res, 404, 'not found');
  const ext = path.extname(file).toLowerCase();
  if (file === CSS_FILE) {
    const { head, tail } = splitBlock(buf.toString('utf8'));
    return send(res, 200, head + tail, TYPES['.css']);
  }
  if (ext === '.html') {
    const html = buf.toString('utf8');
    if (html.includes('hub-real.css')) {
      const tag = '<script src="/tools/hub-tune.js" defer></script>';
      return send(res, 200, html.includes('</body>') ? html.replace('</body>', `${tag}</body>`) : html + tag, TYPES['.html']);
    }
  }
  return send(res, 200, buf, TYPES[ext] || 'application/octet-stream');
}

http
  .createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err.stack || err);
      send(res, 500, String(err.message || err));
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`hub-real tuner: http://localhost:${PORT}/__tune/`));
