import { useEffect, useState } from "react";
import {
  Archive,
  BookOpen,
  Building2,
  Clock,
  Info,
  MapPin,
  MessageSquare,
  Network,
  Sparkles,
} from "lucide-react";
import { useUserLevel } from "../hooks/useUserLevel";
import { ApiError, getOperaNarration, getRelatedOpere } from "../services/apiClient";
import type {
  CorrelazioneItemOut,
  LivelloCompetenza,
  NarrazioneOut,
  OperaDetailOut,
  OperaSummaryOut,
} from "../types/api";
import { ENTITY_TYPE_LABELS } from "../utils/labels";
import { ArchiveDocumentCard } from "./ArchiveDocumentCard";
import { LevelSelectorSheet, LevelSwitcherBar } from "./LevelSelectorSheet";
import { OperaQaWidget } from "./OperaQaWidget";
import { NarrationSkeleton, RelatedSkeleton } from "./OperaSkeleton";
import { RelatedArtworksStrip } from "./RelatedArtworksStrip";
import { SpeechPlayerBar } from "./SpeechPlayerBar";

export type OperaAnalysisTab = "storia" | "archivio" | "connessioni" | "qa";

export interface OperaAnalysisContentProps {
  opera: OperaDetailOut;
  onSelectRelated: (opera: OperaSummaryOut) => void;
  compact?: boolean;
  activeTab?: OperaAnalysisTab;
  onTabChange?: (tab: OperaAnalysisTab) => void;
}

const COMPACT_TABS: readonly {
  id: OperaAnalysisTab;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: "storia", label: "Storia", icon: BookOpen },
  { id: "archivio", label: "Archivio", icon: Archive },
  { id: "connessioni", label: "Connessioni", icon: Network },
  { id: "qa", label: "Chiedi AI", icon: MessageSquare },
];

export function OperaAnalysisContent({
  opera,
  onSelectRelated,
  compact = false,
  activeTab,
  onTabChange,
}: OperaAnalysisContentProps) {
  const { level, hasSelectedLevel, setLevel } = useUserLevel();
  const [internalTab, setInternalTab] = useState<OperaAnalysisTab>("storia");
  const currentTab = activeTab ?? internalTab;

  const [narration, setNarration] = useState<NarrazioneOut | null>(null);
  const [loadingNarration, setLoadingNarration] = useState(false);
  const [narrationFallback, setNarrationFallback] = useState(false);

  const [related, setRelated] = useState<CorrelazioneItemOut[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const handleSetTab = (tab: OperaAnalysisTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoadingRelated(true);

    getRelatedOpere(opera.id, 3, controller.signal)
      .then((res) => {
        setRelated(res.correlazioni);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRelated([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingRelated(false);
        }
      });

    return () => controller.abort();
  }, [opera.id]);

  useEffect(() => {
    if (!level) {
      setNarration(null);
      setLoadingNarration(false);
      return;
    }

    const controller = new AbortController();
    setLoadingNarration(true);
    setNarrationFallback(false);

    getOperaNarration(opera.id, level, controller.signal)
      .then((res) => {
        setNarration(res);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && (err.status === 502 || err.status === 503)) {
          setNarrationFallback(true);
        } else {
          setNarrationFallback(true);
        }
        setNarration(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingNarration(false);
        }
      });

    return () => controller.abort();
  }, [opera.id, level]);

  const handleSelectLevel = (nextLevel: LivelloCompetenza) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setLevel(nextLevel);
  };

  const renderNarrationSection = () => (
    <section aria-label="Narrazione adattiva e audio" className="space-y-3">
      {!level ? (
        <div className="museum-card rounded-2xl p-4 text-sm text-neutral-300">
          Seleziona un livello di lettura per attivare la guida adattiva e la sintesi vocale.
        </div>
      ) : loadingNarration ? (
        <NarrationSkeleton />
      ) : narrationFallback || !narration ? (
        <div className="museum-card rounded-2xl p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-[#e4cc9a]">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Narrazione AI temporaneamente non disponibile — visualizzi la descrizione ufficiale verificata.
            </span>
          </div>
          <p className="text-sm text-neutral-100 leading-relaxed">
            {opera.descrizione_ufficiale}
          </p>
        </div>
      ) : (
        <div className="museum-card rounded-2xl p-4 sm:p-5 space-y-4">
          {!compact && <SpeechPlayerBar scriptAudio={narration.script_audio} />}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#e4cc9a]">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">
                Racconto Adattivo ({narration.livello})
              </h3>
            </div>
            <p className="text-sm sm:text-[15px] text-neutral-100 leading-relaxed">
              {narration.testo_lettura}
            </p>
          </div>

          {narration.curiosita && (
            <div className="rounded-xl bg-[#c9a86a]/10 border border-[#c9a86a]/30 p-3.5 text-xs sm:text-sm text-neutral-100 leading-relaxed">
              <span className="font-semibold text-[#e4cc9a] block mb-1 uppercase tracking-[0.14em] text-[10px]">
                Lo sapevi?
              </span>
              {narration.curiosita}
            </div>
          )}

          {narration.fonti_citate.length > 0 && (
            <p className="text-[11px] text-neutral-400 border-t border-white/10 pt-2.5">
              Fonti citate: {narration.fonti_citate.join(" • ")}
            </p>
          )}
        </div>
      )}
    </section>
  );

  const renderDescriptionSection = () => (
    <section
      aria-label="Descrizione ufficiale verificata"
      className="museum-card rounded-2xl p-4 sm:p-5 space-y-2"
    >
      <div className="flex items-center gap-2 text-[#e4cc9a]">
        <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">
          Descrizione Ufficiale
        </h3>
      </div>
      <p className="text-sm text-neutral-200 leading-relaxed">
        {opera.descrizione_ufficiale}
      </p>
    </section>
  );

  const renderArchiveSection = () =>
    opera.documento_archivio ? (
      <ArchiveDocumentCard documento={opera.documento_archivio} />
    ) : (
      <section
        aria-label="Stato fonte d'archivio"
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3 text-xs text-neutral-400"
      >
        <Archive className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-medium text-neutral-300">
            Nessun documento d&apos;archivio collegato
          </p>
          <p className="mt-0.5 leading-relaxed">
            Questo bene monumentale è fruibile sul territorio tramite la scheda storico-artistica e le correlazioni con gli altri poli di Cogito.
          </p>
        </div>
      </section>
    );

  const renderEntitySection = () => (
    <section
      aria-label="Ente e luogo di conservazione"
      className="museum-card rounded-2xl p-4 sm:p-5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#e4cc9a]">
          <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">
            Ente e Territorio
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
          {ENTITY_TYPE_LABELS[opera.ente.tipologia]}
        </span>
      </div>
      <p className="font-serif-display text-xl text-white">{opera.ente.nome}</p>
      <div className="space-y-1 text-xs text-neutral-300">
        <p className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#c9a86a] shrink-0" aria-hidden="true" />
          <span>
            {opera.ente.indirizzo}, {opera.ente.citta}
          </span>
        </p>
        {opera.ente.orari && (
          <p className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#c9a86a] shrink-0" aria-hidden="true" />
            <span>{opera.ente.orari}</span>
          </p>
        )}
      </div>
    </section>
  );

  const renderRelatedSection = () => (
    <section aria-label="Opere e luoghi correlati" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e4cc9a]">
          Beyond the Museum — Connessioni
        </h3>
        {!loadingRelated && (
          <span className="text-xs text-neutral-400">
            {related.length} {related.length === 1 ? "collegamento" : "collegamenti"}
          </span>
        )}
      </div>
      {loadingRelated ? (
        <RelatedSkeleton />
      ) : (
        <RelatedArtworksStrip correlazioni={related} onSelectOpera={onSelectRelated} />
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <LevelSelectorSheet isOpen={!hasSelectedLevel} onSelect={handleSelectLevel} />

      {/* Selettore livello sempre visibile e pre-selezionato da localStorage */}
      <div className="space-y-2">
        <span className="block text-[10px] uppercase tracking-[0.22em] text-[#c9a86a]">
          Livello Guida (memorizzato)
        </span>
        <LevelSwitcherBar
          currentLevel={level}
          onSelect={handleSelectLevel}
          compact={compact}
        />
      </div>

      {compact ? (
        <>
          {/* Player Audioguida fisso e compatto nella Sala Opera */}
          {narration && <SpeechPlayerBar scriptAudio={narration.script_audio} />}

          {/* Tabs ordinate per evitare sovraccarico di testo */}
          <div
            role="tablist"
            aria-label="Sezioni scheda opera"
            className="grid grid-cols-4 gap-1 rounded-xl bg-black/35 p-1 border border-white/10"
          >
            {COMPACT_TABS.map((t) => {
              const Icon = t.icon;
              const active = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSetTab(t.id)}
                  className={`rounded-lg py-2 px-1 text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-colors ${
                    active
                      ? "bg-[#c9a86a] text-[#0b0b0c]"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="space-y-4">
            {currentTab === "storia" && (
              <>
                {renderNarrationSection()}
                {renderDescriptionSection()}
              </>
            )}
            {currentTab === "archivio" && (
              <>
                {renderArchiveSection()}
                {renderEntitySection()}
              </>
            )}
            {currentTab === "connessioni" && renderRelatedSection()}
            {currentTab === "qa" && (
              <OperaQaWidget operaId={opera.id} livello={level ?? "adulto"} />
            )}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          {renderNarrationSection()}
          {renderDescriptionSection()}
          {renderArchiveSection()}
          {renderEntitySection()}
          {renderRelatedSection()}
          {level && <OperaQaWidget operaId={opera.id} livello={level} />}
        </div>
      )}
    </div>
  );
}
