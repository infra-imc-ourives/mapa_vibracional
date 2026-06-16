#!/usr/bin/env node
/**
 * Teste isolado da integração Supabase + ActiveCampaign.
 * Uso: node test-process-pdf.mjs email@exemplo.com
 */

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

// ── Carrega .env manualmente ──────────────────────────────────────────────────
try {
  const content = readFileSync(".env", "utf-8");
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // sem .env — usa variáveis de ambiente do sistema
}

const TEST_EMAIL = process.argv[2];
if (!TEST_EMAIL) {
  console.error("❌  Uso: node test-process-pdf.mjs email@exemplo.com");
  process.exit(1);
}

// ── PDF mínimo válido para teste ──────────────────────────────────────────────
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
  "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\n" +
  "xref\n0 4\n0000000000 65535 f \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n9\n%%EOF\n"
);

// ── Lógica de integração (espelho de server-node.mjs) ─────────────────────────
async function processPdfNovoAluno({ email, pdfBase64, fileName }) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const BUCKET       = process.env.SUPABASE_BUCKET_NAME || "pdf-novo-aluno";
  const AC_URL       = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_KEY       = process.env.ACTIVECAMPAIGN_API_KEY;
  const AC_PERSTAG   = process.env.ACTIVECAMPAIGN_FIELD_PERSTAG || "PDF_NOVO_ALUNO";

  if (!SUPABASE_URL || !SUPABASE_KEY || !AC_URL || !AC_KEY) {
    throw new Error("Variáveis de ambiente faltando. Verifique o .env.");
  }

  const storagePath = `novo-aluno/${fileName}`;
  const pdfBuffer   = Buffer.from(pdfBase64, "base64");

  // 1. Upload Supabase Storage
  console.log("1/7  Fazendo upload no Supabase Storage...");
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
    throw new Error(`Upload falhou (${uploadRes.status}): ${await uploadRes.text()}`);
  }
  console.log("     ✅  Upload OK");

  // 2. URL pública
  const pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  console.log(`2/7  URL pública: ${pdfUrl}`);

  // 3. Buscar contato no ActiveCampaign; criar se não existir
  console.log("3/7  Buscando contato no ActiveCampaign...");
  const contactRes = await fetch(
    `${AC_URL}/api/3/contacts?filters[email]=${encodeURIComponent(email)}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  if (!contactRes.ok) throw new Error(`contacts: HTTP ${contactRes.status}`);
  const { contacts = [] } = await contactRes.json();

  let contactId;
  if (contacts.length > 0) {
    contactId = contacts[0].id;
    console.log(`     ✅  Contato encontrado — ID: ${contactId}`);
  } else {
    console.log("     ℹ️   Contato não encontrado, criando...");
    const createRes = await fetch(`${AC_URL}/api/3/contacts`, {
      method: "POST",
      headers: { "Api-Token": AC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contact: { email } }),
    });
    if (!createRes.ok) throw new Error(`criar contato: HTTP ${createRes.status} — ${await createRes.text()}`);
    const { contact } = await createRes.json();
    contactId = contact.id;
    console.log(`     ✅  Contato criado — ID: ${contactId}`);
  }

  // 4. Buscar campo pelo perstag
  console.log(`4/7  Buscando campo ${AC_PERSTAG}...`);
  const fieldRes = await fetch(
    `${AC_URL}/api/3/fields?filters[perstag]=${AC_PERSTAG}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  if (!fieldRes.ok) throw new Error(`fields: HTTP ${fieldRes.status}`);
  const { fields = [] } = await fieldRes.json();
  if (fields.length === 0) throw new Error(`Campo ${AC_PERSTAG} não encontrado`);
  const fieldId = fields[0].id;
  console.log(`     ✅  Campo ID: ${fieldId}`);

  // 5. Verificar fieldValue existente
  console.log("5/7  Verificando fieldValue existente...");
  const fvRes = await fetch(
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
    console.log(`6/7  Atualizando fieldValue (ID: ${existing.id})...`);
    const upRes = await fetch(`${AC_URL}/api/3/fieldValues/${existing.id}`, {
      method: "PUT", headers: fvHeaders, body: fvBody,
    });
    if (!upRes.ok) throw new Error(`fieldValue update: HTTP ${upRes.status}`);
  } else {
    console.log("6/7  Criando novo fieldValue...");
    const crRes = await fetch(`${AC_URL}/api/3/fieldValues`, {
      method: "POST", headers: fvHeaders, body: fvBody,
    });
    if (!crRes.ok) throw new Error(`fieldValue create: HTTP ${crRes.status}`);
  }
  console.log("     ✅  Campo PDF_NOVO_ALUNO atualizado no ActiveCampaign");

  // 6. Adicionar tag para disparar automação
  const AC_TAG = process.env.ACTIVECAMPAIGN_TAG || "MAPA_VIBRACIONAL_GERADO";
  console.log(`7/8  Adicionando tag "${AC_TAG}" ao contato...`);
  const tagSearchRes = await fetch(
    `${AC_URL}/api/3/tags?filters[tag]=${encodeURIComponent(AC_TAG)}`,
    { headers: { "Api-Token": AC_KEY } }
  );
  const { tags = [] } = tagSearchRes.ok ? await tagSearchRes.json() : {};
  let tagId = tags[0]?.id;
  if (!tagId) {
    console.log("     ℹ️   Tag não encontrada, criando...");
    const createTagRes = await fetch(`${AC_URL}/api/3/tags`, {
      method: "POST",
      headers: { "Api-Token": AC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ tag: { tag: AC_TAG, tagType: "contact", description: "" } }),
    });
    if (createTagRes.ok) tagId = (await createTagRes.json()).tag?.id;
  }
  if (tagId) {
    const ctRes = await fetch(`${AC_URL}/api/3/contactTags`, {
      method: "POST",
      headers: { "Api-Token": AC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } }),
    });
    if (ctRes.ok) {
      console.log(`     ✅  Tag "${AC_TAG}" adicionada (tag ID: ${tagId})`);
    } else {
      console.warn(`     ⚠️   contactTags: HTTP ${ctRes.status}`);
    }
  } else {
    console.warn("     ⚠️   Não foi possível obter o ID da tag");
  }

  // 7. Log na tabela Supabase
  console.log("8/8  Salvando log na tabela pdf_novo_aluno_links...");
  const logRes = await fetch(`${SUPABASE_URL}/rest/v1/pdf_novo_aluno_links`, {
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
  if (!logRes.ok) {
    console.warn(`     ⚠️   Log falhou (${logRes.status}): ${await logRes.text()}`);
  } else {
    console.log("     ✅  Log salvo");
  }

  return { pdfUrl, contactId, tagId };
}

// ── Execução ──────────────────────────────────────────────────────────────────
const fileName  = `test-${randomUUID()}.pdf`;
const pdfBase64 = MINIMAL_PDF.toString("base64");

console.log("─".repeat(55));
console.log("  TESTE: Supabase Storage + ActiveCampaign");
console.log("─".repeat(55));
console.log(`  Email:   ${TEST_EMAIL}`);
console.log(`  Arquivo: ${fileName}`);
console.log("─".repeat(55));
console.log();

processPdfNovoAluno({ email: TEST_EMAIL, pdfBase64, fileName })
  .then(({ pdfUrl, contactId, tagId }) => {
    console.log();
    console.log("─".repeat(55));
    console.log("  ✅  SUCESSO");
    console.log(`  Contact ID:  ${contactId}`);
    console.log(`  Tag ID:      ${tagId}`);
    console.log(`  PDF URL:     ${pdfUrl}`);
    console.log("─".repeat(55));
  })
  .catch((err) => {
    console.error();
    console.error("─".repeat(55));
    console.error(`  ❌  ERRO: ${err.message}`);
    console.error("─".repeat(55));
    process.exit(1);
  });
