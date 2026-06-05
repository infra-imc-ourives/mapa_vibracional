import type { jsPDF } from "jspdf";

const VIOLET = [114, 60, 180] as const;
const WHITE = [255, 255, 255] as const;
const GRAY = [190, 185, 200] as const;
const DARK = [20, 15, 35] as const;
const BLACK = [20, 20, 20] as const;

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  margin: number = 20
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  const pageH = doc.internal.pageSize.getHeight();
  for (const line of lines) {
    if (y > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function checkNewPage(doc: jsPDF, y: number, margin: number, neededHeight: number = 0): number {
  if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

export async function generateAndDownloadPdf(output: string, intencao: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const lineH = 6;

  // Fundo escuro no cabeçalho
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 44, "F");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...VIOLET);
  doc.text("MAPA VIBRACIONAL", pageW / 2, 16, { align: "center" });

  // Sub-título
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Holo Cocriação®", pageW / 2, 24, { align: "center" });

  // Intenção de cocriação
  if (intencao) {
    doc.setFontSize(9);
    doc.setTextColor(220, 210, 235);
    const intencaoLines = doc.splitTextToSize(`"${intencao}"`, contentW - 10);
    doc.text(intencaoLines, pageW / 2, 32, { align: "center" });
  }

  // Linha violeta separadora
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageW - margin, 40);

  let y = 52;

  const blocks = output.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    y = checkNewPage(doc, y, margin);

    // Cabeçalho de seção com ===
    if (/^===/.test(block)) {
      y += 4;
      const sectionText = block.replace(/===/g, "").trim();
      const lines = doc.splitTextToSize(sectionText, contentW);
      const boxH = lines.length * lineH + 4;
      y = checkNewPage(doc, y, margin, boxH);

      doc.setFillColor(35, 25, 55);
      doc.rect(margin - 2, y - 5, contentW + 4, boxH, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...VIOLET);
      y = addWrappedText(doc, sectionText, margin, y, contentW, lineH, margin);
      y += 3;
      continue;
    }

    // Linha de pergunta Q1 a Q35
    if (/^Q\d+:/.test(block)) {
      y += 2;
      const qLines = doc.splitTextToSize(block, contentW);
      y = checkNewPage(doc, y, margin, qLines.length * lineH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(80, 40, 120);
      y = addWrappedText(doc, block, margin, y, contentW, lineH, margin);
      y += 2;
      continue;
    }

    // Parágrafo normal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BLACK);
    y = addWrappedText(doc, block, margin, y, contentW, lineH, margin);
    y += 3;
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...VIOLET);
    doc.setLineWidth(0.3);
    const pageH = doc.internal.pageSize.getHeight();
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("MAPA VIBRACIONAL · Holo Cocriação® · Diagnóstico Energético Personalizado", pageW / 2, pageH - 7, { align: "center" });
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`Mapa-Vibracional-Personalizado.pdf`);
}
