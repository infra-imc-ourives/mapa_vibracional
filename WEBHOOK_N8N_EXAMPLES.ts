// Exemplo de como usar o serviço n8n no projeto HOLO RENDA
// Este arquivo é apenas referência - a implementação já está no src/routes/index.tsx

import { submitHoloRendaForm, formatFormDataForN8n } from "@/lib/n8n-service";
import { FormData } from "@/lib/holo-form";

// ============================================
// Exemplo 1: Envio básico do formulário
// ============================================

async function exampleBasicSubmit(formData: FormData) {
  try {
    const response = await submitHoloRendaForm(formData);
    console.log("Formulário enviado com sucesso!", response);
    // Aqui você pode processar a resposta do n8n
    return response;
  } catch (error) {
    console.error("Erro ao enviar formulário:", error);
    // Aqui você pode tratar o erro e exibir mensagem ao usuário
  }
}

// ============================================
// Exemplo 2: Formatação do payload
// ============================================

function exampleFormatting(formData: FormData) {
  const payload = formatFormDataForN8n(formData);
  
  console.log("Payload formatado para envio:", payload);
  
  // Exemplo de saída:
  // {
  //   nomeCompleto: "Maria Silva",
  //   cidadeEstado: "São Paulo, SP",
  //   situacaoProfissional: "Autônoma / Freelancer / Prestadora de serviços",
  //   situacaoProfissionalOutra: "",
  //   tempoDisponivel: "De 2 a 4 horas por dia",
  //   acessoInternet: "Tenho internet boa em casa e uso o celular o dia todo",
  //   habilidades: ["Cozinhar bem...", "Costurar, bordar ou fazer artesanato"],
  //   outraHabilidade: "",
  //   recursosDisponiveis: ["Celular com câmera funcionando", "Computador ou notebook"],
  //   maiorBloqueio: "Não sei o que fazer ou por onde começar",
  //   objetivoFinanceiro: "Quero conseguir pagar minha parcela com mais tranquilidade",
  //   enviadoEm: "2026-05-21T14:30:00.000Z"
  // }
}

// ============================================
// Exemplo 3: Usando com React Hooks (implementação atual)
// ============================================

import { useState } from "react";

function ExampleComponent() {
  const [data, setData] = useState<FormData>();
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [n8nResponse, setN8nResponse] = useState(null);

  const handleSubmit = async () => {
    if (!data) return;

    setSubmissionStatus("sending");
    setSubmissionError(null);

    try {
      const response = await submitHoloRendaForm(data);
      setN8nResponse(response);
      setSubmissionStatus("success");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao enviar formulário";
      setSubmissionError(errorMessage);
      setSubmissionStatus("error");
    }
  };

  return (
    <div>
      {submissionStatus === "sending" && <p>Enviando...</p>}
      {submissionStatus === "success" && <p>Enviado com sucesso!</p>}
      {submissionStatus === "error" && <p>Erro: {submissionError}</p>}
      <button onClick={handleSubmit}>Enviar</button>
    </div>
  );
}

// ============================================
// Exemplo 4: Processamento da resposta do n8n
// ============================================

import { N8nResponse } from "@/lib/n8n-service";

async function exampleProcessResponse(formData: FormData) {
  try {
    const response: N8nResponse = await submitHoloRendaForm(formData);
    
    // A resposta do n8n é um objeto genérico
    // Dependendo do que o n8n retorna, você pode fazer diferentes processamentos
    
    // Exemplo 1: Se n8n retorna um ID de processamento
    if (response.processId) {
      console.log("Sua solicitação foi recebida com ID:", response.processId);
      // Você pode usar esse ID para consultar o status posteriormente
    }
    
    // Exemplo 2: Se n8n retorna um plano gerado
    if (response.planContent) {
      console.log("Plano gerado:", response.planContent);
      // Aqui você pode transformar isso em um DOCX
    }
    
    // Exemplo 3: Se n8n retorna um status
    if (response.status) {
      console.log("Status do processamento:", response.status);
    }
    
    return response;
  } catch (error) {
    console.error("Erro:", error);
  }
}

// ============================================
// Exemplo 5: Futuro - Transformar resposta em DOCX
// ============================================

async function exampleGenerateDocx(n8nResponse: N8nResponse) {
  // IMPLEMENTAÇÃO FUTURA
  
  // Opções possíveis:
  
  // Opção 1: Se a resposta do n8n já é um DOCX em base64
  if (n8nResponse.docxBase64) {
    const binaryString = atob(n8nResponse.docxBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Plano_HOLO_RENDA.docx";
    link.click();
  }
  
  // Opção 2: Se você precisa gerar o DOCX a partir de dados
  // Use uma biblioteca como docx:
  // import { Document, Packer, Paragraph, TextRun } from "docx";
  // const doc = new Document({
  //   sections: [{
  //     children: [
  //       new Paragraph({
  //         text: `Plano HOLO RENDA para ${n8nResponse.nomeCompleto}`,
  //         bold: true,
  //       }),
  //     ],
  //   }],
  // });
  // const blob = await Packer.toBlob(doc);
  // Download similar ao acima
}

// ============================================
// Exemplo 6: Retry automático em caso de erro
// ============================================

async function exampleRetrySubmit(
  formData: FormData,
  maxRetries: number = 3
) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt} de ${maxRetries}`);
      const response = await submitHoloRendaForm(formData);
      console.log("Sucesso!", response);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tentativa ${attempt} falhou:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Aguarda alguns segundos antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  throw lastError || new Error("Falha ao enviar após múltiplas tentativas");
}

export {
  exampleBasicSubmit,
  exampleFormatting,
  ExampleComponent,
  exampleProcessResponse,
  exampleGenerateDocx,
  exampleRetrySubmit,
};
