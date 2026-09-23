// static server with HTTP Range (video seeking), for headless verification only
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2], port = +process.argv[3];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(root, p); if (p.endsWith('/')) f = path.join(f, 'index.html');
  fs.stat(f, (err, st) => {
    if (err) { res.writeHead(404); return res.end(); }
    const type = types[path.extname(f)] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1 });
      fs.createReadStream(f, { start: a, end: b }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      fs.createReadStream(f).pipe(res);
    }
  });
}).listen(port, '127.0.0.1', () => console.log('serving', root, port));
