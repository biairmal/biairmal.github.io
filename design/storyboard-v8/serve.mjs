// Serves the repo root so the previz can load /node_modules/three and /public/experimental/v6.
// node design/storyboard-v8/serve.mjs  →  http://localhost:8008/design/storyboard-v8/previz.html
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".glb": "model/gltf-binary", ".jpg": "image/jpeg", ".png": "image/png" };

createServer(async (req, res) => {
  const p = join(root, normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!p.startsWith(root)) return res.writeHead(403).end();
  const body = await readFile(p).catch(() => null);
  if (!body) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" }).end(body);
}).listen(8008, "127.0.0.1", () => console.log("http://localhost:8008/design/storyboard-v8/previz.html"));
