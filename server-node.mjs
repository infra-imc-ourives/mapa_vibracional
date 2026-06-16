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

// ── Integração Supabase + ActiveCampaign ──────────────────────────────────────

async function processPdfNovoAluno({ email, pdfBase64, fileName }) {
  const SUPABASE_URL    = process.env.SUPABASE_URL;
  const SUPABASE_KEY    = process.env.SUPABASE_ANON_KEY;
  const BUCKET          = process.env.SUPABASE_BUCKET_NAME || "pdf-novo-aluno";
  const AC_URL          = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_KEY          = process.env.ACTIVECAMPAIGN_API_KEY;
  const AC_PERSTAG      = process.env.ACTIVECAMPAIGN_FIELD_PERSTAG || "PDF_NOVO_ALUNO";

  if (!SUPABASE_URL || !SUPABASE_KEY || !AC_URL || !AC_KEY) {
    throw new Error("Variáveis de ambiente não configuradas (Supabase/ActiveCampaign).");
  }

  // 1. Upload no Supabase Storage
  const storagePath = `novo-aluno/${fileName}`;
  const pdfBuffer   = Buffer.from(pdfBase64, "base64");

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      },
      body: pdfBuffer,
    }
  );
  if (!uploadRes.ok) {
    throw new Error(`Supabase Storage upload falhou: ${await uploadRes.text()}`);
  }

  // 2. URL pública
  const pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  // 3. Buscar contato no ActiveCampaign
  const contactRes = await fetch(
    `${AC_URL}/api/3/contacts?filters[email]=${encodeURIComponent(email)}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  if (!contactRes.ok) {
    throw new Error(`ActiveCampaign contacts: HTTP ${contactRes.status}`);
  }
  const { contacts = [] } = await contactRes.json();
  if (contacts.length === 0) {
    throw new Error(`Contato não encontrado no ActiveCampaign: ${email}`);
  }
  const contactId = contacts[0].id;

  // 4. Buscar ID do campo pelo perstag
  const fieldRes = await fetch(
    `${AC_URL}/api/3/fields?filters[perstag]=${AC_PERSTAG}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  if (!fieldRes.ok) {
    throw new Error(`ActiveCampaign fields: HTTP ${fieldRes.status}`);
  }
  const { fields = [] } = await fieldRes.json();
  if (fields.length === 0) {
    throw new Error(`Campo ${AC_PERSTAG} não encontrado no ActiveCampaign`);
  }
  const fieldId = fields[0].id;

  // 5. Verificar se já existe fieldValue para esse contato+campo
  const fvRes  = await fetch(
    `${AC_URL}/api/3/fieldValues?filters[contact]=${contactId}&filters[field]=${fieldId}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  const { fieldValues = [] } = fvRes.ok ? await fvRes.json() : {};
  const existing = fieldValues.find(
    (fv) => String(fv.contact) === String(contactId) && String(fv.field) === String(fieldId)
  );

  const fvBody = JSON.stringify({
    fieldValue: { contact: contactId, field: fieldId, value: pdfUrl },
  });
  const fvHeaders = { "Api-Token": AC_KEY, "Content-Type": "application/json" };

  if (existing) {
    // 6a. Atualizar
    const upRes = await fetch(`${AC_URL}/api/3/fieldValues/${existing.id}`, {
      method: "PUT",
      headers: fvHeaders,
      body: fvBody,
    });
    if (!upRes.ok) {
      throw new Error(`ActiveCampaign fieldValue update: HTTP ${upRes.status}`);
    }
  } else {
    // 6b. Criar
    const crRes = await fetch(`${AC_URL}/api/3/fieldValues`, {
      method: "POST",
      headers: fvHeaders,
      body: fvBody,
    });
    if (!crRes.ok) {
      throw new Error(`ActiveCampaign fieldValue create: HTTP ${crRes.status}`);
    }
  }

  // 7. Log na tabela Supabase
  await fetch(`${SUPABASE_URL}/rest/v1/pdf_novo_aluno_links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      contact_email: email,
      activecampaign_contact_id: String(contactId),
      storage_bucket: BUCKET,
      storage_path: storagePath,
      pdf_url: pdfUrl,
      field_perstag: AC_PERSTAG,
    }),
  });

  return { pdfUrl, contactId };
}

async function readBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url || "/";

    // OPTIONS preflight para /api/*
    if (req.method === "OPTIONS" && url.startsWith("/api/")) {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }

    // POST /api/process-pdf — upload Supabase + ActiveCampaign
    if (url === "/api/process-pdf" && req.method === "POST") {
      const corsHeaders = {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      };
      try {
        const bodyBuf = await readBody(req);
        if (!bodyBuf) throw new Error("Body vazio.");
        const { email, pdfBase64, fileName } = JSON.parse(bodyBuf.toString());
        if (!email || !pdfBase64 || !fileName) throw new Error("Parâmetros inválidos.");
        const result = await processPdfNovoAluno({ email, pdfBase64, fileName });
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({ success: true, ...result }));
      } catch (err) {
        console.error("[process-pdf]", err.message);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

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
