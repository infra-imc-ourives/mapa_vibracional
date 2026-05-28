import { Eye, Sparkles, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: Clock, label: "12 a 18 minutos de preenchimento" },
  { icon: Eye, label: "Diagnóstico dos seus 3 bloqueios centrais" },
  { icon: Sparkles, label: "Relatório gerado por inteligência artificial" },
  { icon: Heart, label: "Caminho exato de cura na metodologia Holo" },
];

export function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="space-y-8 text-center">
      <div className="space-y-4">
        <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-foreground">
          Aqui você vai receber seu{" "}
          <span className="holo-gold-text">Mapa Vibracional Personalizado</span>
        </h2>
        <div className="mx-auto max-w-xl space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <p>
            Um relatório diagnóstico individual gerado por IA a partir das suas
            respostas, identificando seus bloqueios inconscientes, a origem de cada um
            e prescrevendo o caminho exato dentro da metodologia Holo para resolvê-los.
          </p>
          <p>
            Dedique de 12 a 18 minutos para responder o formulário de anamnese vibracional
            abaixo. Suas respostas serão processadas pelo nosso sistema de inteligência
            artificial, entregando em minutos um diagnóstico energético completo:{" "}
            <span className="text-[var(--violet-soft)] font-medium">módulo por módulo,
            técnica por técnica, com decretos quânticos personalizados para você.</span>
          </p>
          <p>
            Uma sessão de diagnóstico individual no mercado de desenvolvimento pessoal
            custa entre R$800 e R$2.000. Seu Mapa entrega isso de forma personalizada,
            automática e exclusiva para você.
          </p>
          <p className="font-semibold text-foreground tracking-wide">
            O SEU MAPA É ÚNICO. A SUA CURA COMEÇA AGORA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {highlights.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="holo-card flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.72_0.20_295_/_0.12)] text-[var(--violet)]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs sm:text-sm text-foreground/90 leading-snug">
              {label}
            </span>
          </div>
        ))}
      </div>

      <Button
        onClick={onStart}
        size="lg"
        className="holo-gold-btn h-12 w-full rounded-full text-base font-medium sm:w-auto sm:px-10"
      >
        Iniciar minha anamnese
      </Button>
    </section>
  );
}
