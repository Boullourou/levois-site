import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(root, '../../public');
const args = process.argv.slice(2);
const value = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const host = value('--host', '127.0.0.1');
const port = Number(value('--port', '4340'));
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.md':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end('Lecture seule'); return; }
    const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const isAsset = /^\/(fonts|images|brand)\//.test(requestPath);
    const scope = isAsset ? publicRoot : root;
    const target = path.resolve(scope, '.' + requestPath);
    if (target !== scope && !target.startsWith(scope + path.sep)) { res.writeHead(403); res.end('Accès refusé'); return; }
    let file = target;
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; frame-src 'self'; form-action 'none'; base-uri 'self'",
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Cette preuve locale n’existe pas.'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, host, () => console.log(`Explorations LEVOIS : http://${host}:${port}\nSources : ${root}\nServeur indépendant, sans API ni écriture. Ctrl+C pour arrêter.`));
