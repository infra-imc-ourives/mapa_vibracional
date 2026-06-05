import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Header } from "@/components/holo/Header";
import { Intro } from "@/components/holo/Intro";
import { ProgressBar } from "@/components/holo/ProgressBar";
import { FormShell } from "@/components/holo/FormShell";
import { OptionCard } from "@/components/holo/OptionCard";
import { Confirmation } from "@/components/holo/Confirmation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FormData,
  initialFormData,
  emocaoDominanteOpts,
  relacaoDinheiroOpts,
  pilarBloqueadoOpts,
  padraoBotaoOpts,
  historicoPessoalOpts,
  relacaoPaisDinheiroOpts,
  sentimentoInfanciaOpts,
  padraoRepetidoNivelOpts,
  demonstracaoAfetoOpts,
  traumaInfanciaOpts,
  tensaoCorpoOpts,
  padraoDormindoOpts,
  nivelEnergiaOpts,
  relacaoComidaOpts,
  bloqueioSonhoOpts,
  prazSonhoOpts,
  frenteTrabalhoOpts,
  TOTAL_STEPS,
} from "@/lib/holo-form";
import {
  submitMapaVibracionalForm,
  type N8nResponse,
} from "@/lib/n8n-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAPA VIBRACIONAL · Holo Cocriação®" },
      {
        name: "description",
        content:
          "Receba seu Mapa Vibracional Personalizado com diagnóstico individual gerado por inteligência artificial.",
      },
      {
        property: "og:title",
        content: "MAPA VIBRACIONAL · Holo Cocriação®",
      },
      {
        property: "og:description",
        content:
          "Diagnóstico vibracional individual. Descubra seus 3 principais bloqueios e o caminho exato para resolvê-los.",
      },
    ],
  }),
  component: Index,
});

type MultiField = "pilarBloqueado" | "tensaoCorpo" | "bloqueioSonho";

function ScaleSelector({
  value,
  onChange,
  labelMin,
  labelMax,
}: {
  value: string;
  onChange: (v: string) => void;
  labelMin?: string;
  labelMax?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {["1", "2", "3", "4", "5"].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              "flex-1 h-11 rounded-xl border text-base font-medium transition-all duration-150",
              value === n
                ? "border-[var(--violet)] bg-[oklch(0.72_0.20_295_/_0.20)] text-[var(--violet-soft)] shadow-[0_0_12px_oklch(0.72_0.20_295_/_0.35)]"
                : "border-[var(--border)] bg-card/50 text-muted-foreground hover:border-[var(--violet)]/50 hover:text-foreground",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>
      {(labelMin || labelMax) && (
        <div className="flex justify-between text-[10px] text-muted-foreground/70 uppercase tracking-wider px-1">
          <span>{labelMin}</span>
          <span>{labelMax}</span>
        </div>
      )}
    </div>
  );
}

function BlockLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--violet-soft)]/70 font-medium">
      {children}
    </p>
  );
}

function Index() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [n8nResponse, setN8nResponse] = useState<N8nResponse | null>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const toggleMulti = (key: MultiField, value: string) => {
    setData((d) => {
      const arr = d[key] as string[];
      return {
        ...d,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
    setError(null);
  };

  const togglePilar = (value: string) => {
    setData((d) => {
      const arr = d.pilarBloqueado;
      if (arr.includes(value)) return { ...d, pilarBloqueado: arr.filter((v) => v !== value) };
      if (arr.length >= 2) return { ...d, pilarBloqueado: [...arr.slice(1), value] };
      return { ...d, pilarBloqueado: [...arr, value] };
    });
    setError(null);
  };

  const toggleBloqueioSonho = (value: string) => {
    setData((d) => {
      const arr = d.bloqueioSonho;
      if (arr.includes(value)) return { ...d, bloqueioSonho: arr.filter((v) => v !== value) };
      if (arr.length >= 2) return { ...d, bloqueioSonho: [...arr.slice(1), value] };
      return { ...d, bloqueioSonho: [...arr, value] };
    });
    setError(null);
  };

  const validate = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!data.emocaoDominante) return "Selecione sua emoção dominante.";
        if (!data.relacaoDinheiro) return "Selecione sua relação com o dinheiro.";
        return null;
      case 2:
        if (data.pilarBloqueado.length === 0) return "Escolha ao menos 1 pilar (máximo 2).";
        if (!data.padraoBotagem) return "Escolha uma opção para continuar.";
        return null;
      case 3:
        if (!data.fraseNaoMereco.trim()) return "Complete a frase para continuar.";
        if (!data.historicoPessoal) return "Escolha uma opção para continuar.";
        if (!data.mudancaPrioritaria.trim()) return "Conte qual mudança você mais deseja.";
        return null;
      case 4:
        if (!data.relacaoPaisDinheiro) return "Escolha uma opção para continuar.";
        if (!data.fraseInfancia.trim()) return "Conte a frase que mais ouviu na infância.";
        if (!data.sentimentoInfancia) return "Escolha como se sentiu na infância.";
        return null;
      case 5:
        if (!data.padraoRepetidoNivel) return "Escolha o nível de consciência sobre o padrão.";
        if (!data.demonstracaoAfeto) return "Escolha como era a demonstração de afeto.";
        if (!data.traumaInfancia) return "Responda sobre trauma na infância.";
        if (!data.mensagemAncestral.trim()) return "Escreva a mensagem ancestral para continuar.";
        return null;
      case 6:
        if (!data.escoreAbandono) return "Avalie seu Vírus de Abandono (Q15).";
        if (!data.escoreRejeicao) return "Avalie seu Vírus de Rejeição (Q16).";
        if (!data.escoreInferioridade) return "Avalie seu Vírus de Inferioridade (Q17).";
        if (!data.escoreNegacaoAbundancia) return "Avalie seu Vírus de Negação da Abundância (Q18).";
        if (!data.escoreAusenciaAfetiva) return "Avalie seu Vírus de Ausência Afetiva (Q19).";
        return null;
      case 7:
        if (!data.padraoNaoConsegue.trim()) return "Descreva o padrão que você repete e não consegue mudar.";
        return null;
      case 8:
        if (data.tensaoCorpo.length === 0) return "Selecione ao menos uma região do corpo.";
        if (!data.padraoDormindo) return "Escolha seu padrão de sono.";
        if (!data.nivelEnergia) return "Escolha seu nível de energia.";
        return null;
      case 9:
        if (!data.relacaoComida) return "Escolha sua relação com comida e corpo.";
        if (!data.escoreBloqueioSomatico) return "Avalie o bloqueio somático (Q27).";
        if (!data.palavraCorpo.trim()) return "Escreva uma palavra para descrever seu corpo.";
        return null;
      case 10:
        if (!data.maiorSonho.trim()) return "Conte seu maior sonho para continuar.";
        if (data.bloqueioSonho.length === 0) return "Escolha ao menos 1 bloqueio (máximo 2).";
        if (!data.prazSonho) return "Escolha o prazo para realizar seu sonho.";
        return null;
      case 11:
        if (!data.escoreComprometimento) return "Avalie seu nível de comprometimento.";
        if (!data.sinalSucesso.trim()) return "Descreva o sinal de que a Holo está funcionando.";
        if (!data.frenteTrabalho) return "Escolha sua frente prioritária de trabalho.";
        if (!data.transformacao.trim()) return "Escreva o que você quer transformar.";
        return null;
      default:
        return null;
    }
  };

  const next = useCallback(async () => {
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    if (step === TOTAL_STEPS) {
      setSubmitting(true);
      setSubmissionStatus("sending");
      setSubmissionError(null);
      setStep(TOTAL_STEPS + 1);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      try {
        await new Promise((r) => setTimeout(r, 900));
        const response = await submitMapaVibracionalForm(data);
        setN8nResponse(response);
        setSubmissionStatus("success");
        setSubmitting(false);
        return;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Não foi possível enviar seu formulário agora. Verifique sua conexão e tente novamente.";
        setSubmissionError(errorMessage);
        setSubmissionStatus("error");
        setSubmitting(false);
        return;
      }
    }
    setStep((s) => s + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, data]);

  const back = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const restart = () => {
    setData(initialFormData);
    setStep(0);
    setError(null);
    setSubmissionStatus("idle");
    setSubmissionError(null);
    setN8nResponse(null);
  };

  const stepContent = (() => {
    // ─── Etapa 1: Q1 + Q2 ───────────────────────────────────
    if (step === 1)
      return (
        <FormShell
          title="Qual é o seu estado vibracional agora?"
          subtitle="Responda com honestidade, não existe resposta certa ou errada."
          onBack={back}
          onNext={next}
          isFirst
          error={error}
        >
          <BlockLabel>Bloco 1 · Perfil Vibracional</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q1: Qual emoção você sente com mais frequência no dia a dia?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {emocaoDominanteOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={data.emocaoDominante === opt}
                  onClick={() => update("emocaoDominante", opt)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q2: Como você descreveria sua relação com o dinheiro hoje?
            </Label>
            {relacaoDinheiroOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.relacaoDinheiro === opt}
                onClick={() => update("relacaoDinheiro", opt)}
              />
            ))}
          </div>
        </FormShell>
      );

    // ─── Etapa 2: Q3 + Q4 ───────────────────────────────────
    if (step === 2)
      return (
        <FormShell
          title="Onde sua energia está mais travada?"
          subtitle="Marque até 2 pilares e escolha o padrão que mais se repete em você."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 1 · Perfil Vibracional</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q3: Qual pilar da sua vida está mais travado agora? (até 2)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {pilarBloqueadoOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  multi
                  selected={data.pilarBloqueado.includes(opt)}
                  onClick={() => togglePilar(opt)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q4: Quando você está na iminência de uma mudança positiva, o que normalmente acontece?
            </Label>
            {padraoBotaoOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.padraoBotagem === opt}
                onClick={() => update("padraoBotagem", opt)}
              />
            ))}
          </div>
        </FormShell>
      );

    // ─── Etapa 3: Q5 + Q6 + Q7 ──────────────────────────────
    if (step === 3)
      return (
        <FormShell
          title="As frases que revelam você"
          subtitle="Responda com a primeira coisa que vier à mente. Sem censura."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 1 · Perfil Vibracional</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q5: Complete a frase: "Eu não mereço _____ porque _____."
            </Label>
            <Textarea
              value={data.fraseNaoMereco}
              onChange={(e) => update("fraseNaoMereco", e.target.value)}
              placeholder='Ex.: "Eu não mereço amor porque nunca sou suficiente."'
              className="min-h-[90px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q6: Você já fez terapia, curso de autoconhecimento ou tratamento espiritual?
            </Label>
            {historicoPessoalOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.historicoPessoal === opt}
                onClick={() => update("historicoPessoal", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q7: Se você pudesse mudar UMA coisa na sua vida agora, o que seria?
            </Label>
            <Textarea
              value={data.mudancaPrioritaria}
              onChange={(e) => update("mudancaPrioritaria", e.target.value)}
              placeholder="Descreva essa mudança com suas próprias palavras..."
              className="min-h-[90px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
        </FormShell>
      );

    // ─── Etapa 4: Q8 + Q9 + Q10 ─────────────────────────────
    if (step === 4)
      return (
        <FormShell
          title="As raízes do que você carrega"
          subtitle="O que foi vivido na infância molda o que se repete hoje."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 2 · Raízes Ancestrais</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q8: Como era a relação dos seus pais com o dinheiro?
            </Label>
            {relacaoPaisDinheiroOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.relacaoPaisDinheiro === opt}
                onClick={() => update("relacaoPaisDinheiro", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q9: Qual frase sobre dinheiro, sucesso ou vida você mais ouviu na infância?
            </Label>
            <Textarea
              value={data.fraseInfancia}
              onChange={(e) => update("fraseInfancia", e.target.value)}
              placeholder='Ex.: "Dinheiro é difícil", "Rico é ladrão", "Quem trabalha muito ganha pouco"...'
              className="min-h-[90px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q10: Como você se sentiu no ambiente familiar durante a infância?
            </Label>
            {sentimentoInfanciaOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.sentimentoInfancia === opt}
                onClick={() => update("sentimentoInfancia", opt)}
              />
            ))}
          </div>
        </FormShell>
      );

    // ─── Etapa 5: Q11 + Q12 + Q13 + Q14 ────────────────────
    if (step === 5)
      return (
        <FormShell
          title="Padrões, afeto e herança vibracional"
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 2 · Raízes Ancestrais</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q11: Existe algum padrão que você repete e que também existia nos seus pais ou avós?
            </Label>
            <Textarea
              value={data.padraoRepetido}
              onChange={(e) => update("padraoRepetido", e.target.value)}
              placeholder="Descreva o padrão que percebe (opcional)..."
              className="min-h-[80px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
            <div className="space-y-1 pt-1">
              {padraoRepetidoNivelOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={data.padraoRepetidoNivel === opt}
                  onClick={() => update("padraoRepetidoNivel", opt)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q12: Como era a demonstração de afeto na sua família de origem?
            </Label>
            {demonstracaoAfetoOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.demonstracaoAfeto === opt}
                onClick={() => update("demonstracaoAfeto", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q13: Você passou por alguma perda, trauma ou mudança brusca antes dos 12 anos?
            </Label>
            <div className="flex gap-2">
              {traumaInfanciaOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  selected={data.traumaInfancia === opt}
                  onClick={() => update("traumaInfancia", opt)}
                />
              ))}
            </div>
            {data.traumaInfancia === "Sim" && (
              <Textarea
                value={data.traumaDescricao}
                onChange={(e) => update("traumaDescricao", e.target.value)}
                placeholder="Se quiser, descreva brevemente o que aconteceu (opcional)..."
                className="min-h-[70px] rounded-xl bg-card/60 text-base leading-relaxed"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q14: Se seus ancestrais pudessem te dizer algo agora, o que você acha que seria?
            </Label>
            <Textarea
              value={data.mensagemAncestral}
              onChange={(e) => update("mensagemAncestral", e.target.value)}
              placeholder="Escreva a mensagem que sente que eles te dariam..."
              className="min-h-[80px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
        </FormShell>
      );

    // ─── Etapa 6: Q15–Q19 ────────────────────────────────────
    if (step === 6)
      return (
        <FormShell
          title="Os 5 Vírus Emocionais"
          subtitle="Avalie de 1 a 5 a intensidade de cada padrão na sua vida. 1 = raramente · 5 = quase sempre."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 3 · Os 5 Vírus Emocionais</BlockLabel>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground/90 text-sm leading-relaxed">
                Q15: Com que frequência você sente que as pessoas que ama vão embora ou te deixam?
              </Label>
              <ScaleSelector
                value={data.escoreAbandono}
                onChange={(v) => update("escoreAbandono", v)}
                labelMin="Raramente"
                labelMax="Quase sempre"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90 text-sm leading-relaxed">
                Q16: Você evita mostrar quem você é de verdade por medo de não ser aceito(a)?
              </Label>
              <ScaleSelector
                value={data.escoreRejeicao}
                onChange={(v) => update("escoreRejeicao", v)}
                labelMin="Nunca"
                labelMax="Sempre"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90 text-sm leading-relaxed">
                Q17: Quando algo bom acontece, você sente que não merece ou que foi sorte?
              </Label>
              <ScaleSelector
                value={data.escoreInferioridade}
                onChange={(v) => update("escoreInferioridade", v)}
                labelMin="Nunca"
                labelMax="Sempre"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90 text-sm leading-relaxed">
                Q18: Quando uma oportunidade de prosperidade aparece, algo em você desacredita ou sabota?
              </Label>
              <ScaleSelector
                value={data.escoreNegacaoAbundancia}
                onChange={(v) => update("escoreNegacaoAbundancia", v)}
                labelMin="Nunca"
                labelMax="Sempre"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/90 text-sm leading-relaxed">
                Q19: Você tem dificuldade de receber afeto, elogios, presentes ou ajuda dos outros?
              </Label>
              <ScaleSelector
                value={data.escoreAusenciaAfetiva}
                onChange={(v) => update("escoreAusenciaAfetiva", v)}
                labelMin="Nenhuma dificuldade"
                labelMax="Muita dificuldade"
              />
            </div>
          </div>
        </FormShell>
      );

    // ─── Etapa 7: Q20 + Q21 ──────────────────────────────────
    if (step === 7)
      return (
        <FormShell
          title="Situação real e padrão central"
          subtitle="Quanto mais você se abrir aqui, mais preciso será o seu Mapa."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 3 · Os 5 Vírus Emocionais</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q20: Descreva uma situação recente em que você se sentiu abandonado(a), rejeitado(a) ou inferior.{" "}
              <span className="text-muted-foreground/60">(opcional)</span>
            </Label>
            <Textarea
              value={data.situacaoRecente}
              onChange={(e) => update("situacaoRecente", e.target.value)}
              placeholder="Descreva com seus próprios termos..."
              className="min-h-[100px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q21: Qual padrão negativo você mais repete, e que já tentou mudar mas não conseguiu?
            </Label>
            <Textarea
              value={data.padraoNaoConsegue}
              onChange={(e) => update("padraoNaoConsegue", e.target.value)}
              placeholder="Ex.: Sempre que estou bem financeiramente, algo me faz perder tudo novamente..."
              className="min-h-[100px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
        </FormShell>
      );

    // ─── Etapa 8: Q22 + Q23 + Q24 ────────────────────────────
    if (step === 8)
      return (
        <FormShell
          title="O corpo não mente"
          subtitle="O corpo registra tudo o que a mente tenta ignorar. Responda com atenção ao que você sente."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 4 · Corpo e Frequência Atual</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q22: Onde você sente tensão ou desconforto no corpo com mais frequência?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {tensaoCorpoOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  multi
                  selected={data.tensaoCorpo.includes(opt)}
                  onClick={() => toggleMulti("tensaoCorpo", opt)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q23: Como é o seu padrão de sono?
            </Label>
            {padraoDormindoOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.padraoDormindo === opt}
                onClick={() => update("padraoDormindo", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q24: Sua energia ao longo do dia é:
            </Label>
            {nivelEnergiaOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.nivelEnergia === opt}
                onClick={() => update("nivelEnergia", opt)}
              />
            ))}
          </div>
        </FormShell>
      );

    // ─── Etapa 9: Q25 + Q26 + Q27 + Q28 ─────────────────────
    if (step === 9)
      return (
        <FormShell
          title="Saúde, corpo e frequência somática"
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 4 · Corpo e Frequência Atual</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q25: Você tem alguma condição de saúde recorrente ou que se repete há anos?{" "}
              <span className="text-muted-foreground/60">(opcional)</span>
            </Label>
            <Textarea
              value={data.saudeRecorrente}
              onChange={(e) => update("saudeRecorrente", e.target.value)}
              placeholder="Ex.: Enxaqueca frequente, dor nas costas, problemas digestivos..."
              className="min-h-[80px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q26: Como é sua relação com comida e com seu corpo hoje?
            </Label>
            {relacaoComidaOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.relacaoComida === opt}
                onClick={() => update("relacaoComida", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm leading-relaxed">
              Q27: Você sente que seu corpo "trava" ou adoece quando está prestes a conquistar algo?
            </Label>
            <ScaleSelector
              value={data.escoreBloqueioSomatico}
              onChange={(v) => update("escoreBloqueioSomatico", v)}
              labelMin="Nunca"
              labelMax="Sempre"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q28: Uma palavra que descreve como você se sente no corpo hoje:
            </Label>
            <Textarea
              value={data.palavraCorpo}
              onChange={(e) => update("palavraCorpo", e.target.value)}
              placeholder="Ex.: Pesada, Tensa, Inquieta, Adormecida, Leve..."
              className="min-h-[60px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
        </FormShell>
      );

    // ─── Etapa 10: Q29 + Q30 + Q31 ───────────────────────────
    if (step === 10)
      return (
        <FormShell
          title="O sonho que ainda espera por você"
          subtitle="Estamos chegando ao coração do seu Mapa. Responda com profundidade."
          onBack={back}
          onNext={next}
          error={error}
        >
          <BlockLabel>Bloco 5 · Sonhos e Intenção de Cocriação</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q29: Qual é o maior sonho que você ainda não cocriou?
            </Label>
            <Textarea
              value={data.maiorSonho}
              onChange={(e) => update("maiorSonho", e.target.value)}
              placeholder="Descreva esse sonho com riqueza de detalhes..."
              className="min-h-[100px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q30: O que você acredita que está te impedindo de cocriá-lo? (até 2 opções)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {bloqueioSonhoOpts.map((opt) => (
                <OptionCard
                  key={opt}
                  label={opt}
                  multi
                  selected={data.bloqueioSonho.includes(opt)}
                  onClick={() => toggleBloqueioSonho(opt)}
                />
              ))}
            </div>
            {data.bloqueioSonho.includes("Outro") && (
              <Textarea
                value={data.bloqueioSonhoOutro}
                onChange={(e) => update("bloqueioSonhoOutro", e.target.value)}
                placeholder="Descreva o seu bloqueio específico..."
                className="min-h-[70px] rounded-xl bg-card/60 text-base leading-relaxed"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q31: Em quanto tempo você quer realizar esse sonho?
            </Label>
            {prazSonhoOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.prazSonho === opt}
                onClick={() => update("prazSonho", opt)}
              />
            ))}
          </div>
        </FormShell>
      );

    // ─── Etapa 11: Q32 + Q33 + Q34 + Q35 ────────────────────
    if (step === 11)
      return (
        <FormShell
          title="Sua intenção de cocriação"
          subtitle="Esta é a etapa final. O que você escrever aqui aparecerá no fechamento do seu Mapa."
          onBack={back}
          onNext={next}
          isLast
          submitting={submitting}
          error={error}
        >
          <BlockLabel>Bloco 5 · Sonhos e Intenção de Cocriação</BlockLabel>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q32: Em uma escala de 1 a 5, qual é o seu grau de comprometimento com a mudança?
            </Label>
            <ScaleSelector
              value={data.escoreComprometimento}
              onChange={(v) => update("escoreComprometimento", v)}
              labelMin="Curiosa, com reservas"
              labelMax="Completamente comprometida"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q33: Qual seria o sinal mais claro de que a Holo está funcionando para você?
            </Label>
            <Textarea
              value={data.sinalSucesso}
              onChange={(e) => update("sinalSucesso", e.target.value)}
              placeholder="Descreva esse sinal com suas palavras..."
              className="min-h-[80px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q34: Você prefere trabalhar mais em qual frente?
            </Label>
            {frenteTrabalhoOpts.map((opt) => (
              <OptionCard
                key={opt}
                label={opt}
                selected={data.frenteTrabalho === opt}
                onClick={() => update("frenteTrabalho", opt)}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/90 text-sm">
              Q35: O que você quer que a Holo Cocriação® transforme em você?
            </Label>
            <Textarea
              value={data.transformacao}
              onChange={(e) => update("transformacao", e.target.value)}
              placeholder="Esta é a resposta mais importante do formulário. Escreva com o coração..."
              className="min-h-[110px] rounded-xl bg-card/60 text-base leading-relaxed"
            />
          </div>
        </FormShell>
      );

    return null;
  })();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <Header />

      {step === 0 && <Intro onStart={() => setStep(1)} />}

      {step >= 1 && step <= TOTAL_STEPS && (
        <div className="space-y-6">
          <ProgressBar step={step} />
          {stepContent}
        </div>
      )}

      {step === TOTAL_STEPS + 1 && (
        <Confirmation
          data={data}
          onRestart={restart}
          status={submissionStatus}
          error={submissionError}
          n8nResponse={n8nResponse}
        />
      )}

      <footer className="mt-auto pt-8 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
        MAPA VIBRACIONAL · HOLO COCRIAÇÃO®
      </footer>

    </main>
  );
}
