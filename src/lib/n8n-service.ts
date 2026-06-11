import { FormData } from "./holo-form";

export type N8nPayload = {
  anamnese: string;
  enviadoEm: string;
};

export type N8nResponse = unknown;

/** Extrai o texto do relatório independente do formato retornado pelo n8n */
export function extractOutputText(response: N8nResponse): string | null {
  if (!response) return null;
  if (Array.isArray(response) && typeof (response[0] as { output?: unknown })?.output === "string")
    return (response[0] as { output: string }).output;
  if (typeof (response as { output?: unknown })?.output === "string")
    return (response as { output: string }).output;
  if (typeof response === "string") return response;
  return null;
}

const N8N_WEBHOOK_URL = "/n8n-proxy/webhook/mapavibracional";

/**
 * Formata todas as respostas da anamnese em um único texto estruturado
 * para envio ao webhook n8n como item único
 */
export function formatFormDataForN8n(formData: FormData): N8nPayload {
  const lines: string[] = [];

  lines.push("ANAMNESE VIBRACIONAL - MAPA VIBRACIONAL PERSONALIZADO");
  lines.push("=".repeat(55));
  lines.push("");

  lines.push("=== BLOCO 1: PERFIL VIBRACIONAL ===");
  lines.push("");
  lines.push(`Q1: Emoção dominante:`);
  lines.push(formData.emocaoDominante || "(não respondido)");
  lines.push("");
  lines.push(`Q2: Relação com o dinheiro hoje:`);
  lines.push(formData.relacaoDinheiro || "(não respondido)");
  lines.push("");
  lines.push(`Q3: Pilares da vida mais travados:`);
  lines.push(formData.pilarBloqueado.length > 0 ? formData.pilarBloqueado.join(", ") : "(não respondido)");
  lines.push("");
  lines.push(`Q4: Padrão diante de mudanças positivas:`);
  lines.push(formData.padraoBotagem || "(não respondido)");
  lines.push("");
  lines.push(`Q5: Complete: "Eu não mereço ___ porque ___":`);
  lines.push(formData.fraseNaoMereco || "(não respondido)");
  lines.push("");
  lines.push(`Q6: Histórico de terapia / autoconhecimento:`);
  lines.push(formData.historicoPessoal || "(não respondido)");
  lines.push("");
  lines.push(`Q7: Se pudesse mudar UMA coisa agora, qual seria:`);
  lines.push(formData.mudancaPrioritaria || "(não respondido)");
  lines.push("");

  lines.push("=== BLOCO 2: RAÍZES ANCESTRAIS ===");
  lines.push("");
  lines.push(`Q8: Relação dos pais com o dinheiro:`);
  lines.push(formData.relacaoPaisDinheiro || "(não respondido)");
  lines.push("");
  lines.push(`Q9: Frase sobre dinheiro/sucesso mais ouvida na infância:`);
  lines.push(formData.fraseInfancia || "(não respondido)");
  lines.push("");
  lines.push(`Q10: Como se sentiu no ambiente familiar na infância:`);
  lines.push(formData.sentimentoInfancia || "(não respondido)");
  lines.push("");
  lines.push(`Q11: Padrão que se repete também nos pais/avós:`);
  lines.push(formData.padraoRepetido || "(não respondido)");
  lines.push(`Nível de consciência sobre esse padrão: ${formData.padraoRepetidoNivel || "(não respondido)"}`);
  lines.push("");
  lines.push(`Q12: Demonstração de afeto na família de origem:`);
  lines.push(formData.demonstracaoAfeto || "(não respondido)");
  lines.push("");
  lines.push(`Q13: Passou por perda, trauma ou mudança brusca antes dos 12 anos:`);
  lines.push(formData.traumaInfancia || "(não respondido)");
  if (formData.traumaDescricao) {
    lines.push(`Descrição: ${formData.traumaDescricao}`);
  }
  lines.push("");
  lines.push(`Q14: O que seus ancestrais diriam para você agora:`);
  lines.push(formData.mensagemAncestral || "(não respondido)");
  lines.push("");

  lines.push("=== BLOCO 3: OS 5 VÍRUS EMOCIONAIS (Escala 1–5) ===");
  lines.push("");
  lines.push(`Q15: Vírus de Abandono (sentir que amados vão embora): ${formData.escoreAbandono || "?"}/5`);
  lines.push(`Q16: Vírus de Rejeição (evitar mostrar quem é de verdade): ${formData.escoreRejeicao || "?"}/5`);
  lines.push(`Q17: Vírus de Inferioridade (não merecer o que conquista): ${formData.escoreInferioridade || "?"}/5`);
  lines.push(`Q18: Vírus de Negação da Abundância (desacreditar oportunidades): ${formData.escoreNegacaoAbundancia || "?"}/5`);
  lines.push(`Q19: Vírus de Ausência Afetiva (dificuldade de receber afeto): ${formData.escoreAusenciaAfetiva || "?"}/5`);
  lines.push("");
  lines.push(`Q20: Situação recente de abandono, rejeição ou inferioridade:`);
  lines.push(formData.situacaoRecente || "(não respondido / opcional)");
  lines.push("");
  lines.push(`Q21: Padrão negativo que repete e não consegue mudar:`);
  lines.push(formData.padraoNaoConsegue || "(não respondido)");
  lines.push("");

  lines.push("=== BLOCO 4: CORPO E FREQUÊNCIA ATUAL ===");
  lines.push("");
  lines.push(`Q22: Regiões corporais com tensão ou desconforto:`);
  lines.push(formData.tensaoCorpo.length > 0 ? formData.tensaoCorpo.join(", ") : "(não respondido)");
  lines.push("");
  lines.push(`Q23: Padrão de sono:`);
  lines.push(formData.padraoDormindo || "(não respondido)");
  lines.push("");
  lines.push(`Q24: Nível de energia ao longo do dia:`);
  lines.push(formData.nivelEnergia || "(não respondido)");
  lines.push("");
  lines.push(`Q25: Condição de saúde recorrente:`);
  lines.push(formData.saudeRecorrente || "(não respondido / opcional)");
  lines.push("");
  lines.push(`Q26: Relação com comida e com o próprio corpo:`);
  lines.push(formData.relacaoComida || "(não respondido)");
  lines.push("");
  lines.push(`Q27: Corpo trava ou adoece antes de conquistar algo (1–5): ${formData.escoreBloqueioSomatico || "?"}/5`);
  lines.push("");
  lines.push(`Q28: Palavra que descreve como se sente no corpo hoje:`);
  lines.push(formData.palavraCorpo || "(não respondido)");
  lines.push("");

  lines.push("=== BLOCO 5: SONHOS E INTENÇÃO DE COCRIAÇÃO ===");
  lines.push("");
  lines.push(`Q29: O maior sonho que ainda não cocriou:`);
  lines.push(formData.maiorSonho || "(não respondido)");
  lines.push("");
  lines.push(`Q30: O que acredita que está impedindo de cocriá-lo:`);
  const bloqueios = [...formData.bloqueioSonho];
  if (formData.bloqueioSonhoOutro) bloqueios.push(`Outro: ${formData.bloqueioSonhoOutro}`);
  lines.push(bloqueios.length > 0 ? bloqueios.join(", ") : "(não respondido)");
  lines.push("");
  lines.push(`Q31: Prazo para realizar esse sonho:`);
  lines.push(formData.prazSonho || "(não respondido)");
  lines.push("");
  lines.push(`Q32: Grau de comprometimento com a mudança (1–5): ${formData.escoreComprometimento || "?"}/5`);
  lines.push("");
  lines.push(`Q33: Sinal mais claro de que o Holo está funcionando:`);
  lines.push(formData.sinalSucesso || "(não respondido)");
  lines.push("");
  lines.push(`Q34: Frente prioritária de trabalho:`);
  lines.push(formData.frenteTrabalho || "(não respondido)");
  lines.push("");
  lines.push(`Q35: O que você quer que o Holo Cocriação transforme em você:`);
  lines.push(formData.transformacao || "(não respondido)");
  lines.push("");

  return {
    anamnese: lines.join("\n"),
    enviadoEm: new Date().toISOString(),
  };
}

async function pollJobStatus(jobId: string): Promise<N8nResponse> {
  const maxAttempts = 72;
  const intervalMs = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const res = await fetch(`/n8n-proxy/job/${jobId}`);

    if (res.status === 202) {
      console.log(`[n8n] Job ${jobId} processando... tentativa ${i + 1}`);
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error((err as { error?: string }).error || `Erro HTTP ${res.status}`);
    }

    const data = (await res.json()) as N8nResponse;
    console.log("[n8n] Job concluído:", jobId);
    return data;
  }

  throw new Error(
    "Tempo limite excedido ao aguardar o relatório. Por favor, tente novamente."
  );
}

/**
 * Envia a anamnese completa como um único item para o webhook n8n
 * e aguarda o resultado via polling.
 */
export async function submitMapaVibracionalForm(
  formData: FormData
): Promise<N8nResponse> {
  const payload = formatFormDataForN8n(formData);

  let response: Response;
  try {
    response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente."
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Erro ao enviar formulário: HTTP ${response.status} - ${response.statusText}`
    );
  }

  const result = (await response.json()) as { status?: string; jobId?: string };

  if (result && typeof result === "object" && !Array.isArray(result) && result.jobId) {
    console.log("[n8n] Job iniciado:", result.jobId, "aguardando resultado...");
    return pollJobStatus(result.jobId);
  }

  console.log("[n8n] Resposta direta:", JSON.stringify(result));
  return result as N8nResponse;
}
