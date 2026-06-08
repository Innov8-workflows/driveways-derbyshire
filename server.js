// Minimal static file server for previewing the site (no dependencies).
// Supports HTTP Range requests + video MIME types, and is hardened against
// the client aborting a range request mid-stream (which video players do
// constantly) so it never crashes.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 4173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v', '.ogv': 'video/ogg', '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(root, p);
  if (!fp.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.stat(fp, (err, st) => {
    if (err || st.isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    const type = types[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    const total = st.size;
    const range = req.headers.range;

    let stream = null;
    const cleanup = () => { if (stream) { stream.destroy(); stream = null; } };
    res.on('close', cleanup);   // client (e.g. a video player) disconnected → stop reading
    res.on('error', cleanup);

    const sendStream = (opts) => {
      stream = fs.createReadStream(fp, opts);
      stream.on('error', () => { try { res.destroy(); } catch (_) {} });
      stream.pipe(res);
    };

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
      if (isNaN(start)) start = 0;
      if (isNaN(end) || end >= total) end = total - 1;
      if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${total}` }); return res.end(); }
      res.writeHead(206, {
        'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store'
      });
      if (req.method === 'HEAD') return res.end();
      sendStream({ start, end });
    } else {
      res.writeHead(200, {
        'Content-Type': type, 'Content-Length': total,
        'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store, must-revalidate'
      });
      if (req.method === 'HEAD') return res.end();
      sendStream({});
    }
  });
}).listen(port, () => console.log('Serving', root, 'at http://localhost:' + port));

// Final safety net: never let a stray socket/stream error kill the server.
process.on('uncaughtException', e => console.error('[handled]', e && e.message));
