const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Parse path and strip traversal attempts
  let safeUrl = req.url.split('?')[0].replace(/\.\./g, '');
  if (safeUrl === '/' || safeUrl === '') {
    safeUrl = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safeUrl);
  let ext = path.extname(filePath).toLowerCase();

  // Simple SPA routing - if no extension, or if it isn't an asset, serve index.html
  if (!ext || (ext !== '.js' && ext !== '.css' && ext !== '.html' && ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.svg' && ext !== '.woff2' && ext !== '.ico')) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
    ext = '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback explicitly to index.html for SPA if file missing
      filePath = path.join(PUBLIC_DIR, 'index.html');
      ext = '.html';
    }

    fs.readFile(filePath, (fileErr, content) => {
      if (fileErr) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Windows POS Web Server running at http://127.0.0.1:${PORT}`);
});
