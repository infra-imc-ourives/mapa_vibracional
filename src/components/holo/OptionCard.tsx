import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
};

export function OptionCard({ label, selected, onClick, multi }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm sm:text-base transition-all",
        "min-h-[56px] cursor-pointer",
        selected
          ? "border-[var(--gold)] bg-[oklch(0.82_0.13_86_/_0.10)] text-foreground shadow-[0_0_0_1px_var(--gold)_inset]"
          : "border-border bg-card/60 text-foreground/90 hover:border-[var(--gold)]/60 hover:bg-card",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center transition-colors",
          multi ? "rounded-md" : "rounded-full",
          selected
            ? "bg-[var(--gold)] text-[var(--primary-foreground)]"
            : "border border-border bg-background/40",
        )}
      >
        {selected && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span className="flex-1 leading-snug">{label}</span>
    </button>
  );
}
