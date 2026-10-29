import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { handleScanReceipt, handleSpendingInsights } from './server/geminiHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file safely
try {
  if (typeof process.loadEnvFile === 'function') {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  } else {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
} catch {
  // Ignore env loading errors
}

const PORT = parseInt(process.env.PORT || '3000', 10);
// Bind to loopback by default for security
const HOST = process.env.HOST || '127.0.0.1';
const DIST_DIR = path.join(__dirname, 'dist');

const ALLOWED_ORIGINS = new Set([
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : [])
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      // Hard payload ceiling: 15MB
      if (data.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function serveStaticFile(req, res, filePath, contentType, cacheControl = 'no-cache') {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', cacheControl);

  if (req.method === 'HEAD') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // index.html is tiny (~1KB) and served directly without compression for rock-solid browser compatibility
  if (filePath.endsWith('index.html')) {
    res.statusCode = 200;
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.end());
    stream.pipe(res);
    return;
  }

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const isCompressible = contentType.includes('javascript') || contentType.includes('css');

  if (isCompressible && acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    res.statusCode = 200;
    const raw = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    raw.on('error', () => res.end());
    gzip.on('error', () => res.end());
    raw.pipe(gzip).pipe(res);
  } else {
    res.statusCode = 200;
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.end());
    stream.pipe(res);
  }
}

const server = http.createServer(async (req, res) => {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Health and Status Check
  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      app: 'AI EXPENSE TRACKING',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
  }

  // AI Receipt Scanner
  if (pathname === '/api/scan-receipt' && req.method === 'POST') {
    try {
      const raw = await readRequestBody(req);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Malformed JSON payload.' });
      }

      const { base64Image, mimeType } = parsed || {};
      if (!base64Image) {
        return sendJson(res, 400, { success: false, error: 'Missing base64Image in request body.' });
      }

      const data = await handleScanReceipt(base64Image, mimeType);
      return sendJson(res, 200, { success: true, data });
    } catch (err) {
      return sendJson(res, err.status || 500, { success: false, error: err.message || 'Failed to scan receipt' });
    }
  }

  // Spending Insights
  if (pathname === '/api/spending-insights' && req.method === 'POST') {
    try {
      const raw = await readRequestBody(req);
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { success: false, error: 'Malformed JSON payload.' });
      }

      const { transactions } = parsed || {};
      const insights = await handleSpendingInsights(transactions);
      return sendJson(res, 200, { success: true, insights });
    } catch (err) {
      return sendJson(res, err.status || 500, { success: false, error: err.message || 'Failed to generate insights' });
    }
  }

  // Static File Serving with Gzip Compression & Cache Optimization
  if (req.method === 'GET' || req.method === 'HEAD') {
    let filePath = path.join(DIST_DIR, pathname);
    
    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Cache-Control: Hashed assets get long-lived immutable cache; root assets get no-store so updates take effect immediately
      const cacheControl = pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : ext === '.png' || ext === '.ico'
        ? 'public, max-age=86400'
        : 'no-cache, no-store, must-revalidate';

      serveStaticFile(req, res, filePath, contentType, cacheControl);
      return;
    }

    // SPA fallback to dist/index.html (always no-cache so users immediately get updates)
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveStaticFile(req, res, indexPath, 'text/html; charset=utf-8', 'no-cache');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Please run "npm run build" to generate the application bundle.');
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.listen(PORT, HOST, () => {
  console.log(`AI EXPENSE TRACKING server running at http://${HOST}:${PORT}`);
  console.log(`Gemini API configured: ${Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY)}`);
});
