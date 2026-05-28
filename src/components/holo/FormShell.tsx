import { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  submitting?: boolean;
  error?: string | null;
};

export function FormShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  isFirst,
  isLast,
  submitting,
  error,
}: Props) {
  return (
    <div className="holo-card rounded-2xl p-5 sm:p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
      </div>

      <div className="space-y-3">{children}</div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isFirst}
          className="h-12 rounded-full px-6 text-foreground/80 hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="holo-gold-btn h-12 rounded-full px-8 text-base font-medium"
        >
          {isLast ? (
            <>
              {submitting ? "Enviando..." : "Enviar formulário"}
              {!submitting && <Send className="h-4 w-4" />}
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
