#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.E2E_PORT || 4173);
const PREFIX = '/Vitals.AI';
const ROOT = path.join(process.cwd(), 'out');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function resolveFile(urlPath) {
  let relative = urlPath;
  if (relative === PREFIX || relative === `${PREFIX}/`) {
    relative = '/index.html';
  } else if (relative.startsWith(`${PREFIX}/`)) {
    relative = relative.slice(PREFIX.length);
  } else {
    return null;
  }

  const decoded = decodeURIComponent(relative.split('?')[0]);
  let filePath = path.join(ROOT, decoded);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  } else if (!path.extname(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
    filePath = path.join(filePath, 'index.html');
  }

  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(ROOT))) return null;
  return resolved;
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('Missing out/index.html. Run `npm run build:pages` first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url || '/');
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, 'Not found');
    return;
  }

  const ext = path.extname(filePath);
  const type = MIME[ext] || 'application/octet-stream';
  send(res, 200, fs.readFileSync(filePath), { 'Content-Type': type });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}${PREFIX}/`);
});
