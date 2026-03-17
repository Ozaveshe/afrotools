const http = require('http');
const fs = require('fs');
const path = require('path');
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.xml':'text/xml'};
const root = __dirname;
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  let fp = path.join(root, u);
  if (!fs.existsSync(fp) && !path.extname(fp)) {
    if (fs.existsSync(fp + '.html')) fp += '.html';
    else fp += '/index.html';
  }
  if (!fs.existsSync(fp)) { fp = path.join(root, 'index.html'); }
  const ext = path.extname(fp);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(fp);
    res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache, no-store'});
    res.end(data);
  } catch(e) {
    res.writeHead(404); res.end('Not found');
  }
}).listen(process.env.PORT || 3000, () => console.log('Serving on http://localhost:' + (process.env.PORT || 3000)));
