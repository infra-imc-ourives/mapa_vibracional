import type { jsPDF } from "jspdf";

const GOLD = [201, 168, 76] as const;
const DARK = [26, 26, 46] as const;
const BLACK = [20, 20, 20] as const;
const GRAY = [190, 185, 200] as const;

type Segment = { text: string; bold: boolean; italic: boolean };

function parseInline(text: string): Segment[] {
  const segs: Segment[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last)
      segs.push({ text: text.slice(last, m.index), bold: false, italic: false });
    if (m[1] !== undefined)
      segs.push({ text: m[1], bold: true, italic: false });
    else
      segs.push({ text: m[2], bold: false, italic: true });
    last = m.index + m[0].length;
  }
  if (last < text.length)
    segs.push({ text: text.slice(last), bold: false, italic: false });
  return segs.length ? segs : [{ text, bold: false, italic: false }];
}

function addInlineText(
  doc: jsPDF,
  segs: Segment[],
  x: number,
  y: number,
  maxWidth: number,
  lineH: number,
  fontSize: number,
  color: readonly [number, number, number],
  margin: number
): number {
  const pageH = doc.internal.pageSize.getHeight();

  type Token = { text: string; bold: boolean; italic: boolean };
  const tokens: Token[] = [];
  for (const seg of segs) {
    const parts = seg.text.match(/\S+\s*/g) ?? (seg.text ? [seg.text] : []);
    for (const p of parts) tokens.push({ text: p, bold: seg.bold, italic: seg.italic });
  }

  let lineTokens: { tok: Token; w: number }[] = [];
  let lineWidth = 0;

  const flush = () => {
    if (!lineTokens.length) return;
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    let lx = x;
    for (const { tok, w } of lineTokens) {
      doc.setFont("helvetica", tok.bold ? "bold" : tok.italic ? "italic" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(tok.text, lx, y);
      lx += w;
    }
    y += lineH;
    lineTokens = [];
    lineWidth = 0;
  };

  for (const tok of tokens) {
    doc.setFont("helvetica", tok.bold ? "bold" : tok.italic ? "italic" : "normal");
    doc.setFontSize(fontSize);
    const w = doc.getTextWidth(tok.text);
    if (lineWidth + w > maxWidth && lineTokens.length > 0) flush();
    lineTokens.push({ tok, w });
    lineWidth += w;
  }
  flush();
  doc.setFont("helvetica", "normal");
  return y;
}

function checkPage(doc: jsPDF, y: number, margin: number, needed = 0): number {
  if (y + needed > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

function addSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
  contentW: number,
  lineH: number,
  pageW: number
): number {
  y = checkPage(doc, y, margin, lineH + 10);
  y += 4;

  doc.setFillColor(35, 25, 55);
  const titleLines = doc.splitTextToSize(title, contentW);
  const boxH = titleLines.length * lineH + 6;
  doc.rect(margin - 2, y - 5, contentW + 4, boxH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  for (const line of titleLines as string[]) {
    if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    doc.text(line, margin, y);
    y += lineH;
  }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  return y;
}

export async function generateAndDownloadPdf(
  output: string,
  nome: string,
  intencao: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const lineH = 6;

  // ── Cabeçalho ────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 44, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GOLD);
  doc.text("MAPA VIBRACIONAL", pageW / 2, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("Holo Cocriação®", pageW / 2, 24, { align: "center" });

  if (intencao) {
    doc.setFontSize(9);
    doc.setTextColor(220, 210, 235);
    const intLines = doc.splitTextToSize(`"${intencao}"`, contentW - 10);
    doc.text(intLines, pageW / 2, 32, { align: "center" });
  }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageW - margin, 40);

  let y = 52;

  // ── Texto de abertura ─────────────────────────────────────
  const intro = [
    `Perfeito ${nome}. Você foi maravilhosa por ter chego até aqui.`,
    `O primeiro passo para uma verdadeira mudança acontece quando você se permite estar "exposta".`,
    `Se descrever com honestidade, com transparência. Abrir os véus da mente, do corpo e do coração. Não ter medo de julgamentos, porque você sabe que agora encontrou um lugar seguro, onde pode ser quem você realmente é!`,
    `E eu to muito orgulhosa de receber você aqui! Orgulhosa da sua coragem. Estamos construindo um caminho de muitas vitórias. E pode ter certeza, se você seguir o que vamos alinhar daqui em diante, esse caminho não tem volta.`,
    `Só vai andar para frente, em direção ao sucesso, à prosperidade e à abundância, em todas as áreas da sua vida.`,
    `Com as informações que você me passou, agora consigo detalhar os três principais bloqueios que estão te impedindo de cocriar tudo o que desejo, por enquanto.`,
    `Vamos conferir?`,
  ];
  for (const para of intro) {
    y = checkPage(doc, y, margin);
    y = addInlineText(doc, [{ text: para, bold: false, italic: false }], margin, y, contentW, lineH, 10, BLACK, margin);
    y += 2;
  }
  y += 4;

  // ── Conteúdo da IA ────────────────────────────────────────
  const blocks = output.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    if (/^-{3,}$/.test(block)) continue;

    y = checkPage(doc, y, margin);

    if (block.startsWith("## ")) {
      y = addSectionHeader(doc, block.slice(3).trim(), y, margin, contentW, lineH, pageW);
      continue;
    }

    if (/^IDEIA \d+:/i.test(block) || /^SEU PRIMEIRO PASSO/i.test(block)) {
      y = addSectionHeader(doc, block, y, margin, contentW, lineH, pageW);
      continue;
    }

    const lines = block.split("\n");
    for (const line of lines) {
      y = addInlineText(doc, parseInline(line), margin, y, contentW, lineH, 10, BLACK, margin);
    }
    y += 3;
  }

  // ── Rodapé em todas as páginas ────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "MAPA VIBRACIONAL · Holo Cocriação® · Diagnóstico Energético Personalizado",
      pageW / 2, pageH - 7, { align: "center" }
    );
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`Mapa-Vibracional-Personalizado.pdf`);
}
