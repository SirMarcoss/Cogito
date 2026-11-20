import { useEffect } from "react";
import { Archive, ArrowRight, BookOpen, Sparkles, X } from "lucide-react";
import type { NarrazioneOut, OperaDetailOut } from "../types/api";

export type ArchiveVerticalPanelKey = "descrizione" | "archivio" | "narrazione";

export interface ArchivePanel2DModalProps {
  panelKey: ArchiveVerticalPanelKey | null;
  opera: OperaDetailOut | null;
  narration: NarrazioneOut | null;
  onOpenBook: () => void;
  onEnterRoom4: (operaId: number) => void;
  onClose: () => void;
}

const PANEL_META: Record<
  ArchiveVerticalPanelKey,
  { badge: string; title: string; icon: typeof BookOpen }
> = {
  descrizione: {
    badge: "Stele I • Scheda Storica",
    title: "Descrizione Ufficiale Verificata",
    icon: BookOpen,
  },
  archivio: {
    badge: "Stele II • Fonte Primaria",
    title: "Documento d'Archivio Collegato",
    icon: Archive,
  },
  narrazione: {
    badge: "Stele III • Lettura e Curiosità",
    title: "Narrazione Adattiva",
    icon: Sparkles,
  },
};

export function ArchivePanel2DModal({
  panelKey,
  opera,
  narration,
  onOpenBook,
  onEnterRoom4,
  onClose,
}: ArchivePanel2DModalProps) {
  useEffect(() => {
    if (!panelKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelKey, onClose]);

  if (!panelKey) return null;

  const meta = PANEL_META[panelKey];
  const Icon = meta.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-panel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
    >
      <div className="museum-glass w-full max-w-2xl max-h-[86vh] rounded-2xl border border-[#c9a86a]/45 flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9a86a]/15 border border-[#c9a86a]/45 flex items-center justify-center text-[#e4cc9a] shrink-0">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a86a]">
                {meta.badge}
              </p>
              <h2
                id="archive-panel-modal-title"
                className="font-serif-display text-2xl text-white leading-tight"
              >
                {meta.title}
              </h2>
              {opera && (
                <p className="text-xs text-neutral-300 mt-0.5">
                  {opera.titolo} — {opera.ente.nome}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi pannello di lettura"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scroll flex-1 space-y-4">
          {!opera ? (
            <div className="space-y-4 py-2">
              <p className="font-serif-display text-2xl text-[#e4cc9a] leading-snug">
                Consulta il Registro d&apos;Archivio per interrogare le fonti storiche e ricostruire i legami tra le opere.
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Nessun bene è stato ancora selezionato lungo questo percorso. Apri il Libro d&apos;Archivio al centro della Sala Archivi per scegliere un&apos;opera, un reperto o un documento da esaminare sulle stele verticali.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBook();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] font-semibold text-xs px-5 py-2.5 transition-colors"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Apri il Libro d&apos;Archivio</span>
              </button>
            </div>
          ) : panelKey === "descrizione" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#c9a86a]">
                {opera.autore} • {opera.anno}
              </p>
              <p className="text-sm sm:text-base text-neutral-100 leading-relaxed">
                {opera.descrizione_ufficiale}
              </p>
            </div>
          ) : panelKey === "archivio" ? (
            opera.documento_archivio ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#c9a86a]/20 border border-[#c9a86a]/45 px-3 py-1 text-xs font-mono text-[#e4cc9a]">
                    {opera.documento_archivio.segnatura}
                  </span>
                  <span className="text-xs text-neutral-300">
                    {opera.documento_archivio.datazione}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif-display text-xl text-white">
                    {opera.documento_archivio.titolo}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {opera.documento_archivio.fondo} • {opera.documento_archivio.ente_conservazione}
                  </p>
                </div>
                <blockquote className="border-l-2 border-[#c9a86a] pl-4 py-1 font-serif-display italic text-lg text-neutral-100 leading-relaxed">
                  &ldquo;{opera.documento_archivio.estratto_verificato}&rdquo;
                </blockquote>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
                <p className="font-serif-display text-xl text-neutral-200">
                  Nessun documento d&apos;archivio collegato
                </p>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Per &ldquo;{opera.titolo}&rdquo; non risulta associato un fascicolo archivistico diretto. La postazione rimane presente nel percorso curatoriale con faretto attenuato.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-neutral-100 leading-relaxed">
                {narration?.testo_lettura ?? opera.breve_sintesi}
              </p>
              {narration?.curiosita && (
                <div className="rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/30 p-4 text-sm text-neutral-100">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-[#e4cc9a] font-semibold mb-1">
                    Approfondimento
                  </span>
                  {narration.curiosita}
                </div>
              )}
            </div>
          )}
        </div>

        {opera && (
          <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEnterRoom4(opera.id);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] font-semibold text-xs px-4 py-2 transition-colors"
            >
              <span>Apri nella Sala Opera</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
