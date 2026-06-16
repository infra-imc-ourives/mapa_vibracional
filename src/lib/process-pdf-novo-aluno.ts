function uint8ToBase64(buffer: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function processPdfNovoAluno({
  contactEmail,
  pdfBuffer,
  fileName,
}: {
  contactEmail: string;
  pdfBuffer: Uint8Array;
  fileName: string;
}): Promise<{ pdfUrl: string } | null> {
  try {
    const res = await fetch("/api/process-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: contactEmail,
        pdfBase64: uint8ToBase64(pdfBuffer),
        fileName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
      console.error("[process-pdf-novo-aluno]", err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[process-pdf-novo-aluno]", err);
    return null;
  }
}
