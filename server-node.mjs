import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);
const N8N_HOST = "n8n-ia-webhook.elainneourives.com.br";

const MIME = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".json": "application/json",
};

// In-memory job store: jobId -> { status, data?, error?, createdAt }
const pendingJobs = new Map();

// Clean up jobs older than 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, job] of pendingJobs) {
    if (job.createdAt < cutoff) pendingJobs.delete(id);
  }
}, 5 * 60 * 1000);

const { default: worker } = await import("./dist/server/index.js");

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url || "/";

    // Polling endpoint: GET /n8n-proxy/job/:jobId
    if (url.startsWith("/n8n-proxy/job/")) {
      const jobId = url.slice("/n8n-proxy/job/".length);
      const job = pendingJobs.get(jobId);
      const corsHeaders = {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      };

      if (!job) {
        res.writeHead(404, corsHeaders);
        res.end(JSON.stringify({ error: "Job não encontrado" }));
        return;
      }

      if (job.status === "processing") {
        res.writeHead(202, corsHeaders);
        res.end(JSON.stringify({ status: "processing" }));
        return;
      }

      if (job.status === "error") {
        pendingJobs.delete(jobId);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: job.error }));
        return;
      }

      // done — return result and clean up
      const data = job.data;
      pendingJobs.delete(jobId);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(data));
      return;
    }

    // Proxy para o webhook n8n — fire-and-forget com jobId
    if (url.startsWith("/n8n-proxy/")) {
      const targetPath = url.slice("/n8n-proxy".length);
      const body = await readBody(req);
      const requestHeaders = { ...req.headers, host: N8N_HOST };
      delete requestHeaders["accept-encoding"];

      const jobId = randomBytes(8).toString("hex");
      pendingJobs.set(jobId, { status: "processing", createdAt: Date.now() });

      // Inicia requisição ao n8n em background sem bloquear a resposta ao cliente
      (async () => {
        try {
          const proxyRes = await fetch(`https://${N8N_HOST}${targetPath}`, {
            method: req.method,
            headers: requestHeaders,
            body,
          });

          if (!proxyRes.ok) {
            pendingJobs.set(jobId, {
              status: "error",
              error: `HTTP ${proxyRes.status} - ${proxyRes.statusText}`,
              createdAt: Date.now(),
            });
            return;
          }

          const data = await proxyRes.json();
          pendingJobs.set(jobId, { status: "done", data, createdAt: Date.now() });
        } catch (err) {
          pendingJobs.set(jobId, {
            status: "error",
            error: err.message || "Erro ao contatar o servidor",
            createdAt: Date.now(),
          });
        }
      })();

      // Responde imediatamente com o jobId para o cliente iniciar o polling
      res.writeHead(202, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      });
      res.end(JSON.stringify({ status: "processing", jobId }));
      return;
    }

    // Servir assets estáticos de dist/client
    const staticPath = join(__dirname, "dist", "client", url.split("?")[0]);
    try {
      const s = await stat(staticPath);
      if (s.isFile()) {
        const data = await readFile(staticPath);
        const mime = MIME[extname(staticPath)] || "application/octet-stream";
        res.writeHead(200, {
          "content-type": mime,
          "cache-control": "public, max-age=31536000, immutable",
        });
        res.end(data);
        return;
      }
    } catch {
      // não é estático, passa para o Worker
    }

    // SSR via Worker
    const body = await readBody(req);
    const fullUrl = `http://localhost:${PORT}${url}`;
    const request = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      body,
    });
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
    const response = await worker.fetch(request, {}, ctx);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`HOLO RENDA rodando na porta ${PORT}`);
});
