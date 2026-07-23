// Minimal static file server for previewing the portal prototypes.
// No redirects, no clean-URL rewrites — serves files exactly as requested so
// query strings (?mode=save&app=…) survive. Node core only.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 8777;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(ROOT, pathname);
  // stay inside ROOT
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  // Resolve extensionless requests (e.g. a cached clean-URL 301) to their .html
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404: ' + pathname); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => console.log('Portals preview on http://localhost:' + PORT));
