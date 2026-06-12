import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  BorderStyle,
} from "docx";

const GOLD = "C9A84C";
const DARK = "1A1A2E";

function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last)
      runs.push(new TextRun({ text: text.slice(last, match.index), font: "Calibri" }));
    if (match[1] !== undefined)
      runs.push(new TextRun({ text: match[1], bold: true, font: "Calibri" }));
    else if (match[2] !== undefined)
      runs.push(new TextRun({ text: match[2], italics: true, font: "Calibri" }));
    last = match.index + match[0].length;
  }
  if (last < text.length)
    runs.push(new TextRun({ text: text.slice(last), font: "Calibri" }));
  return runs.length > 0 ? runs : [new TextRun({ text, font: "Calibri" })];
}

function parseBlocks(output: string, nome: string): Paragraph[] {
  const blocks = output.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const children: Paragraph[] = [];

  // Título do documento
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "MAPA VIBRACIONAL",
          bold: true,
          size: 48,
          color: GOLD,
          font: "Georgia",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Plano Personalizado de ${nome}`,
          size: 24,
          color: DARK,
          font: "Georgia",
        }),
      ],
    })
  );

  // Texto de abertura fixo
  const introParas = [
    `Perfeito ${nome}. Você foi maravilhosa por ter chego até aqui.`,
    `O primeiro passo para uma verdadeira mudança acontece quando você se permite estar "exposta".`,
    `Se descrever com honestidade, com transparência. Abrir os véus da mente, do corpo e do coração. Não ter medo de julgamentos, porque você sabe que agora encontrou um lugar seguro, onde pode ser quem você realmente é!`,
    `E eu to muito orgulhosa de receber você aqui! Orgulhosa da sua coragem. Estamos construindo um caminho de muitas vitórias. E pode ter certeza, se você seguir o que vamos alinhar daqui em diante, esse caminho não tem volta.`,
    `Só vai andar para frente, em direção ao sucesso, à prosperidade e à abundância, em todas as áreas da sua vida.`,
    `Com as informações que você me passou, agora consigo detalhar os três principais bloqueios que estão te impedindo de cocriar tudo o que desejo, por enquanto.`,
    `Vamos conferir?`,
  ];
  for (const text of introParas) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text, font: "Calibri" })],
      })
    );
  }

  for (const block of blocks) {
    // Separador markdown --- ignorado
    if (/^-{3,}$/.test(block)) continue;

    // Cabeçalho markdown ## Título
    if (block.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 120 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
          },
          children: [
            new TextRun({
              text: block.slice(3).trim(),
              bold: true,
              color: GOLD,
              font: "Georgia",
            }),
          ],
        })
      );
      continue;
    }

    // Cabeçalho de seção legado: "IDEIA X: ..." ou "SEU PRIMEIRO PASSO..."
    if (/^IDEIA \d+:/i.test(block) || /^SEU PRIMEIRO PASSO/i.test(block)) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 120 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
          },
          children: [
            new TextRun({
              text: block,
              bold: true,
              color: GOLD,
              font: "Georgia",
            }),
          ],
        })
      );
      continue;
    }

    // Sub-rótulos com conteúdo na mesma linha: "Rótulo: conteúdo"
    const subLabels = [
      "O que é e por que combina com você",
      "Como começar hoje",
      "Quanto pode gerar em",
      "De onde vêm os primeiros clientes",
    ];
    const matched = subLabels.find((l) => block.startsWith(l + ":"));
    if (matched) {
      const colon = block.indexOf(":");
      const label = block.slice(0, colon + 1);
      const content = block.slice(colon + 1).trim();
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 80 },
          children: [
            new TextRun({ text: label + " ", bold: true, font: "Calibri" }),
            new TextRun({ text: content, font: "Calibri" }),
          ],
        })
      );
      continue;
    }

    // Parágrafos normais — mantém quebras internas de linha e processa markdown inline
    const lines = block.split("\n");
    const runs: TextRun[] = [];
    lines.forEach((line, i) => {
      if (i > 0) runs.push(new TextRun({ break: 1 }));
      runs.push(...parseInlineMarkdown(line));
    });
    children.push(
      new Paragraph({ spacing: { after: 160 }, children: runs })
    );
  }

  return children;
}

export async function generateAndDownloadDocx(
  output: string,
  nome: string
): Promise<void> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { size: 22, font: "Calibri" },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
        },
        children: parseBlocks(output, nome),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Mapa-Vibracional-Personalizado.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
