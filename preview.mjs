import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A loopback-only static server with byte ranges for synchronized WAV seeking.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.DEMO_PORT || 8765);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.wav':'audio/wav', '.pdf':'application/pdf', '.svg':'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, {Allow:'GET, HEAD'}).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache'};
    let start = 0, end = info.size - 1, code = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${info.size}`}).end(); return; }
      start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
      if (start > end || start >= info.size) { res.writeHead(416, {'Content-Range':`bytes */${info.size}`}).end(); return; }
      code = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(file, {start,end}).on('error',()=>res.destroy()).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Demo preview: http://127.0.0.1:${port}`));
