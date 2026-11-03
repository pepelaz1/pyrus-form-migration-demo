import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(join(root, pathname === '/' ? 'index.html' : pathname.slice(1)));
  if (!file.startsWith(root + '\\') && file !== join(root, 'index.html')) { response.writeHead(403).end(); return; }
  if (!types[extname(file)]) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)], 'cache-control': 'no-store' }).end(content);
  } catch { response.writeHead(404).end('Not found'); }
});
const port = Number(process.env.PORT) || 4190;
server.listen(port, '127.0.0.1', () => console.log(`Demo: http://127.0.0.1:${port}`));
