export function OperaDetailSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Caricamento scheda opera"
      className="min-h-screen bg-museum-bg text-museum-ink px-4 py-8 sm:px-8"
    >
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-44 rounded-full bg-white/10" />
        <div className="h-64 sm:h-80 w-full rounded-2xl bg-white/5 border border-white/10" />
        <div className="space-y-3">
          <div className="h-4 w-52 rounded bg-[#c9a86a]/25" />
          <div className="h-10 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/10" />
        </div>
        <NarrationSkeleton />
      </div>
    </main>
  );
}

export function NarrationSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Generazione narrazione adattiva in corso"
      className="museum-card rounded-2xl p-5 space-y-3 animate-pulse"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-[#c9a86a]/25" />
        <div className="h-8 w-32 rounded-full bg-white/10" />
      </div>
      <div className="h-3.5 w-full rounded bg-white/10" />
      <div className="h-3.5 w-11/12 rounded bg-white/10" />
      <div className="h-3.5 w-4/5 rounded bg-white/10" />
    </div>
  );
}

export function RelatedSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Ricerca connessioni culturali in corso"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse"
    >
      {[0, 1].map((slot) => (
        <div
          key={slot}
          className="museum-card rounded-xl p-4 space-y-2.5"
        >
          <div className="h-3 w-24 rounded bg-[#c9a86a]/25" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
