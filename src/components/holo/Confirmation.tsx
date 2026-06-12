import { CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/holo-form";
import { N8nResponse, extractOutputText } from "@/lib/n8n-service";
import { generateAndDownloadPdf } from "@/lib/generate-pdf";

export type SubmissionStatus = "idle" | "sending" | "success" | "error";

export function Confirmation({
  data,
  onRestart,
  status = "idle",
  error = null,
  n8nResponse = null,
}: {
  data: FormData;
  onRestart: () => void;
  status?: SubmissionStatus;
  error?: string | null;
  n8nResponse?: N8nResponse | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const isProcessing =
    status === "success" &&
    (n8nResponse as { status?: string } | null)?.status === "processing";

  const outputText = isProcessing ? null : extractOutputText(n8nResponse);

  const handleDownload = async () => {
    if (!outputText) return;
    setDownloading(true);
    try {
      await generateAndDownloadPdf(outputText, data.transformacao);
    } finally {
      setDownloading(false);
    }
  };

  const canDownload = status === "success" && outputText !== null;

  // Tela de carregamento
  if (status === "sending") {
    return (
      <section className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--violet)]/20" />
            <Loader2 className="h-8 w-8 animate-spin text-[var(--violet)]" />
          </div>
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl holo-gold-text mb-3">
              Gerando o seu Mapa...
            </h2>
            <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
              Nossa inteligência artificial está mapeando seus bloqueios e preparando o seu{" "}
              <span className="text-foreground">Mapa Vibracional Personalizado</span>.
              Esse processo pode levar até 1 minuto. Mantenha essa tela aberta.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Tela de erro
  if (status === "error") {
    return (
      <section className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
            Oops! Algo deu errado
          </h2>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
            {error ||
              "Não foi possível enviar sua anamnese agora. Verifique sua conexão com a internet e tente novamente."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onRestart}
            className="holo-gold-btn h-12 rounded-full px-8 text-base font-medium"
          >
            Tentar Novamente
          </Button>
        </div>
      </section>
    );
  }

  // Tela de sucesso
  return (
    <section className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.72_0.20_295_/_0.14)] text-[var(--violet)] shadow-[0_0_40px_oklch(0.72_0.20_295_/_0.3)]">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl holo-gold-text">
          Sua anamnese foi enviada com sucesso
        </h2>
        <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isProcessing ? (
            <>
              Suas respostas foram recebidas! Nossa inteligência artificial
              está gerando o seu{" "}
              <span className="text-foreground">Mapa Vibracional</span>.
              O processamento pode levar até 1 minuto. O botão de download aparecerá
              assim que estiver pronto.
            </>
          ) : (
            <>
              Nossa inteligência artificial está mapeando seus bloqueios e preparando
              o seu <span className="text-foreground">Mapa Vibracional Personalizado</span>{" "}
              com base nas suas respostas. Não saia dessa tela. Quando finalizar,
              você poderá baixar seu Mapa em PDF.
            </>
          )}
        </p>
      </div>

      <div className="holo-card rounded-2xl p-5 sm:p-6 text-left">
        <h3 className="font-serif text-lg text-[var(--violet-soft)] mb-4">
          Resumo da sua anamnese
        </h3>
        <dl className="divide-y divide-border/60">
          {[
            ["Emoção dominante", data.emocaoDominante],
            ["Pilares bloqueados", data.pilarBloqueado.join(", ")],
            ["Relação com dinheiro", data.relacaoDinheiro],
            ["Maior sonho", data.maiorSonho],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {k}
              </dt>
              <dd className="text-sm text-foreground sm:text-right sm:max-w-[60%]">
                {v || "..."}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="holo-card rounded-2xl p-5 sm:p-6 text-center">
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg text-[var(--violet-soft)] mb-2">
              Seu Mapa Vibracional Personalizado
            </h3>
            <p className="text-sm text-muted-foreground">
              Seu diagnóstico estará disponível aqui após a geração do Mapa.
            </p>
          </div>
          <Button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className={
              canDownload
                ? "holo-gold-btn h-12 rounded-full px-8 text-base font-medium"
                : "h-12 rounded-full px-8 text-base font-medium bg-muted text-muted-foreground cursor-not-allowed"
            }
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Gerando PDF..." : "Baixar Mapa Vibracional (PDF)"}
          </Button>
          {!canDownload && (
            <p className="text-xs text-muted-foreground/70">
              O botão estará disponível assim que o Mapa for gerado.
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={onRestart}
        variant="ghost"
        className="h-12 rounded-full border border-[var(--violet)]/40 px-8 text-foreground hover:bg-white/5"
      >
        Voltar para o início
      </Button>
    </section>
  );
}
