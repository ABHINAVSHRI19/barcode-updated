/**
 * NutriScan – Local Dev Server + NVIDIA API Proxy
 *
 * Solves the CORS problem by acting as a middle-man:
 *   Browser → http://localhost:3002/api/nvidia  →  NVIDIA API
 *
 * Usage:  node server.js
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = 3002;
const STATIC_DIR = __dirname;

// ─── MIME types ───────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
};

// ─── Helper: pipe a Node IncomingMessage → response ──
function pipe(src, dest) {
  src.on('data', chunk => dest.write(chunk));
  src.on('end',  ()    => dest.end());
  src.on('error', e   => { console.error('[proxy] upstream error', e.message); dest.end(); });
}

// ─── NVIDIA Proxy handler ─────────────────────────────
function handleNvidiaProxy(req, res) {
  // Read full request body first
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const targetHostname = 'integrate.api.nvidia.com';
    const targetPath     = '/v1/chat/completions';

    // Forward the Authorization header from the browser
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';

    const options = {
      hostname: targetHostname,
      port: 443,
      path: targetPath,
      method: 'POST',
      timeout: 300000, // 300s — Kimi K2.6 with reasoning needs more time
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
        'User-Agent':    'NutriScan-Proxy/1.0',
        'Content-Length': Buffer.byteLength(body),
      }
    };

    console.log(`[proxy] → POST https://${targetHostname}${targetPath} (${Buffer.byteLength(body)} bytes)`);

    const proxyReq = https.request(options, proxyRes => {
      console.log(`[proxy] ← ${proxyRes.statusCode} (${proxyRes.headers['content-type']})`);
      // Forward the REAL content-type from NVIDIA (crucial for SSE streams!)
      res.writeHead(proxyRes.statusCode, {
        'Content-Type':                proxyRes.headers['content-type'] || 'application/json',
        'Transfer-Encoding':           proxyRes.headers['transfer-encoding'] || 'chunked',
        'Cache-Control':               'no-cache',
        'Access-Control-Allow-Origin': '*',
      });
      pipe(proxyRes, res);
    });

    // Fires when the socket-level timeout (30s) is exceeded
    proxyReq.on('timeout', () => {
      console.error('[proxy] request timed out after 300s');
      proxyReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'NVIDIA API timed out after 300 seconds.' }));
      }
    });

    proxyReq.on('error', e => {
      console.error('[proxy] request error:', e.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy upstream error: ' + e.message }));
      }
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

// ─── Static file handler ──────────────────────────────
function handleStatic(req, res) {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
  // Strip query strings
  filePath = filePath.split('?')[0];

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + req.url);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
}

// ─── Main server ──────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  // CORS preflight for the proxy endpoint
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Route: NVIDIA proxy
  if (parsedUrl.pathname === '/api/nvidia' && req.method === 'POST') {
    handleNvidiaProxy(req, res);
    return;
  }

  // Route: static files
  handleStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   NutriScan Dev Server running 🚀    ║');
  console.log(`  ║   http://localhost:${PORT}             ║`);
  console.log('  ║                                      ║');
  console.log('  ║   /api/nvidia  → NVIDIA proxy        ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
