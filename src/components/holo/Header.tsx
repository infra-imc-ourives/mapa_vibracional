export function Header() {
  return (
    <header className="flex flex-col items-center text-center">
      <img
        src="/logo-holo.svg"
        alt="Holo Cocriação"
        className="h-16 w-auto"
      />
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-medium holo-gold-text">
        MAPA VIBRACIONAL
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Diagnóstico energético personalizado · Holo Cocriação®
      </p>
    </header>
  );
}
