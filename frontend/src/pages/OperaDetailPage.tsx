import {
  ArrowLeft,
  ExternalLink,
  FileWarning,
  Info,
  Loader2,
  Navigation,
  Pause,
  Play,
  QrCode,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AskAiIllustration } from "../components/opera/AskAiIllustration";
import { ConnectionsGraph } from "../components/opera/ConnectionsGraph";
import { OperaQaSection } from "../components/opera/OperaQaSection";
import { LevelDropdown } from "../components/ui/LevelDropdown";
import { RevealOnScroll } from "../components/ui/RevealOnScroll";
import { VoicePickerDropdown } from "../components/ui/VoicePickerDropdown";
import { formatAudioTime, useSpeechGuide } from "../hooks/useSpeechGuide";
import {
  fetchOperaById,
  fetchOperaByQr,
  fetchOperaNarration,
  fetchOperaRelated,
  isApiError,
} from "../services/apiClient";
import type {
  CorrelazioneItemOut,
  LivelloCompetenza,
  NarrazioneOut,
  OperaDetailOut,
} from "../types/api";
import {
  buildGoogleMapsDirectionsUrl,
  CATEGORIA_LABELS,
  LEVEL_LABELS,
  TIPOLOGIA_ENTE_LABELS,
  toSafeHttpUrl,
} from "../utils/format";

interface OperaDetailPageProps {
  onOpenQrScanner: () => void;
  userLevel: LivelloCompetenza;
  onChangeUserLevel: (next: LivelloCompetenza) => void;
}

export function OperaDetailPage({
  onOpenQrScanner,
  userLevel,
  onChangeUserLevel,
}: OperaDetailPageProps) {
  const { id, code } = useParams<{ id?: string; code?: string }>();
  const speech = useSpeechGuide();

  const [opera, setOpera] = useState<OperaDetailOut | null>(null);
  const [operaLoading, setOperaLoading] = useState(true);
  const [operaError, setOperaError] = useState<string | null>(null);

  const [narration, setNarration] = useState<NarrazioneOut | null>(null);
  const [narrationLoading, setNarrationLoading] = useState(false);
  const [narrationFallback, setNarrationFallback] = useState(false);

  const [related, setRelated] = useState<CorrelazioneItemOut[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const aiTriggerRef = useRef<HTMLButtonElement | null>(null);
  const aiCloseRef = useRef<HTMLButtonElement | null>(null);

  // Stop speech and close AI drawer automatically on artwork change or unmount
  useEffect(() => {
    setAiSidebarOpen(false);
  }, [id, code]);

  useEffect(() => {
    speech.stop();
  }, [id, code, userLevel, speech.stop]);

  useEffect(() => {
    if (!aiSidebarOpen) return;
    const focusTimer = window.setTimeout(() => {
      aiCloseRef.current?.focus({ preventScroll: true });
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAiSidebarOpen(false);
        aiTriggerRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiSidebarOpen]);

  useEffect(() => {
    const controller = new AbortController();
    setOperaLoading(true);
    setOperaError(null);
    setOpera(null);
    setNarration(null);
    setNarrationFallback(false);
    setNarrationLoading(false);
    setRelated([]);
    setRelatedError(null);
    setRelatedLoading(false);

    const loadOpera = async () => {
      try {
        let data: OperaDetailOut;
        if (code) {
          data = await fetchOperaByQr(code, controller.signal);
        } else if (id) {
          const parsedId = Number(id);
          if (!Number.isInteger(parsedId) || parsedId <= 0) {
            throw new Error("Identificativo opera non valido.");
          }
          data = await fetchOperaById(parsedId, controller.signal);
        } else {
          throw new Error("Opera non specificata.");
        }

        if (!controller.signal.aborted) {
          setNarrationLoading(true);
          setRelatedLoading(true);
          setOpera(data);
        }
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setOperaError(
          isApiError(err)
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Impossibile trovare l’opera richiesta.",
        );
      } finally {
        if (!controller.signal.aborted) setOperaLoading(false);
      }
    };

    void loadOpera();
    return () => {
      controller.abort();
    };
  }, [id, code]);

  useEffect(() => {
    if (!opera) return;
    const controller = new AbortController();
    setNarrationLoading(true);
    setNarrationFallback(false);

    fetchOperaNarration(opera.id, userLevel, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setNarration(res);
          setNarrationFallback(false);
        }
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setNarration(null);
        setNarrationFallback(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setNarrationLoading(false);
        }
      });

    return () => controller.abort();
  }, [opera?.id, userLevel]);

  useEffect(() => {
    if (!opera) return;
    const controller = new AbortController();
    setRelatedLoading(true);
    setRelatedError(null);

    fetchOperaRelated(opera.id, 3, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setRelated(res.correlazioni.slice(0, 3));
        }
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        setRelatedError("Servizio correlazioni momentaneamente non disponibile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRelatedLoading(false);
        }
      });

    return () => controller.abort();
  }, [opera?.id]);

  const audioScriptText = narration
    ? narration.script_audio || narration.testo_lettura
    : opera?.descrizione_ufficiale || "";

  useEffect(() => {
    const prevTitle = document.title;
    if (opera) {
      document.title = `${opera.titolo} — Cogito`;
    }
    return () => {
      document.title = prevTitle;
    };
  }, [opera]);

  useEffect(() => {
    if (!operaLoading && opera && !narrationLoading && audioScriptText) {
      speech.preloadAllVoices(audioScriptText);
    } else {
      speech.preloadAllVoices("");
    }
  }, [
    operaLoading,
    opera?.id,
    narrationLoading,
    audioScriptText,
    speech.preloadAllVoices,
  ]);

  return (
    <div className="min-h-screen bg-panna text-ink">
      <header className="sticky top-0 z-[1050] border-b border-gold-light/70 bg-panna/95 backdrop-blur-md">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/"
              state={{ skipIntro: true }}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-light px-5 text-base font-semibold text-ink transition hover:border-gold-deep hover:bg-panna-soft"
            >
              <ArrowLeft className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <span>Torna alla Home</span>
            </Link>

            {opera && (
              <span className="text-base font-semibold uppercase tracking-[0.16em] text-gold-deep">
                {opera.qr_code}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-deep/45 px-5 text-base font-semibold text-ink transition hover:border-gold-deep hover:bg-panna-soft"
            >
              <QrCode className="h-5 w-5 text-gold-deep" aria-hidden="true" />
              <span>Scansiona QR</span>
            </button>

            <LevelDropdown value={userLevel} onChange={onChangeUserLevel} />
          </div>
        </div>
      </header>

      <main
        className={`w-full px-6 transition-[padding] duration-500 sm:px-10 ${
          aiSidebarOpen
            ? "lg:pl-12 lg:pr-0 xl:pl-16 xl:pr-0"
            : "lg:px-12 xl:px-16"
        }`}
      >
        {operaLoading && (
          <div className="py-20 lg:py-24">
            <p className="font-serif text-3xl text-ink-secondary">
              Caricamento dei dati ufficiali dell’opera…
            </p>
          </div>
        )}

        {!operaLoading && operaError && (
          <div className="max-w-2xl space-y-6 py-20 lg:py-24">
            <h1 className="font-serif text-4xl font-semibold text-ink sm:text-5xl">
              Opera non trovata
            </h1>
            <p className="text-xl text-ink-secondary">{operaError}</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/"
                state={{ skipIntro: true }}
                className="btn-museum-primary"
              >
                Torna alla pagina principale
              </Link>
              <button
                type="button"
                onClick={onOpenQrScanner}
                className="btn-museum-secondary"
              >
                Riprova scansione QR
              </button>
            </div>
          </div>
        )}

        {!operaLoading && opera && (
          <div
            key={opera.id}
            className="flex min-h-[calc(100vh-81px)] flex-col lg:flex-row lg:items-stretch"
          >
            {/* LEFT 3/4 EDITORIAL ARTWORK SHEET (Full-width when AI panel is closed) */}
            <article
              className={`min-w-0 flex-1 space-y-14 py-10 pb-28 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:pb-24 lg:pt-14 lg:pb-32 ${
                aiSidebarOpen
                  ? "lg:max-w-none lg:pr-8 xl:pr-10"
                  : "mx-auto w-full max-w-6xl"
              }`}
            >
              <header className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <RevealOnScroll immediate delayMs={40}>
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                      {CATEGORIA_LABELS[opera.categoria]} · {opera.qr_code}
                    </p>

                    <h1 className="font-serif text-5xl font-semibold leading-[1.06] text-ink sm:text-6xl">
                      {opera.titolo}
                    </h1>

                    <p className="text-2xl font-medium text-ink-secondary">
                      {opera.autore} · {opera.anno}
                    </p>

                    <div className="space-y-1 text-lg text-ink-muted">
                      <p>
                        <strong className="font-semibold text-ink">
                          {opera.ente.nome}
                        </strong>{" "}
                        ({TIPOLOGIA_ENTE_LABELS[opera.ente.tipologia]})
                        {opera.sala ? ` — ${opera.sala}` : ""}
                      </p>
                      <p className="text-base">
                        {opera.ente.indirizzo}, {opera.ente.citta}
                        {opera.ente.orari ? ` · ${opera.ente.orari}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <a
                        href={buildGoogleMapsDirectionsUrl(
                          opera.lat,
                          opera.lng,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-museum-primary"
                      >
                        <Navigation className="h-5 w-5" aria-hidden="true" />
                        <span>Calcola percorso su Google Maps</span>
                      </a>

                      {toSafeHttpUrl(opera.ente.sito_web) && (
                        <a
                          href={toSafeHttpUrl(opera.ente.sito_web)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] items-center gap-1.5 text-base font-semibold text-gold-deep underline underline-offset-4 hover:text-gold-dark"
                        >
                          <span>Sito dell’ente</span>
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll immediate delayMs={160}>
                  <div>
                    <img
                      src={opera.immagine_url}
                      alt={opera.titolo}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.endsWith("/images/castello-ursino.svg")) {
                          img.src = "/images/castello-ursino.svg";
                        }
                      }}
                      className="max-h-[380px] w-full rounded-2xl object-cover"
                    />
                  </div>
                </RevealOnScroll>
              </header>

              {/* 1. UNIFIED AI DESCRIPTION + NEURAL ITALIAN AUDIO GUIDE */}
              <RevealOnScroll delayMs={80}>
                <section
                  aria-labelledby="ai-description-heading"
                  className="museum-rule space-y-7 pt-10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                      <span>
                        Elaborazione AI dagli archivi ufficiali · Livello{" "}
                        {LEVEL_LABELS[userLevel]}
                      </span>
                    </div>
                    <h2
                      id="ai-description-heading"
                      className="font-serif text-4xl font-semibold text-ink sm:text-5xl"
                    >
                      Descrizione completa dell’opera
                    </h2>
                  </div>

                  {speech.supported && audioScriptText && !narrationLoading && (
                    <div
                      aria-label="Audioguida in italiano"
                      className="space-y-4 border-y border-gold-light/70 py-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="mr-1 flex items-center gap-2 text-base font-semibold text-ink">
                            <Volume2
                              className="h-5 w-5 text-gold-deep"
                              aria-hidden="true"
                            />
                            <span>Audioguida italiana</span>
                            {speech.status === "playing" && (
                              <span
                                aria-hidden="true"
                                className="ml-1 inline-flex h-4 items-end gap-0.5"
                              >
                                <span className="audio-eq-bar h-3.5 w-1 rounded-full bg-gold-deep" />
                                <span
                                  className="audio-eq-bar h-4 w-1 rounded-full bg-gold-deep"
                                  style={{ animationDelay: "180ms" }}
                                />
                                <span
                                  className="audio-eq-bar h-2.5 w-1 rounded-full bg-gold-deep"
                                  style={{ animationDelay: "340ms" }}
                                />
                              </span>
                            )}
                          </div>

                          {speech.status === "idle" && (
                            <button
                              type="button"
                              onClick={() => speech.play(audioScriptText)}
                              className="btn-museum-primary"
                            >
                              <Play className="h-5 w-5" aria-hidden="true" />
                              <span>Ascolta</span>
                            </button>
                          )}

                          {speech.status === "loading" && (
                            <button
                              type="button"
                              disabled
                              className="btn-museum-primary"
                            >
                              <Loader2
                                className="h-5 w-5 animate-spin"
                                aria-hidden="true"
                              />
                              <span>Preparazione voce…</span>
                            </button>
                          )}

                          {speech.status === "playing" && (
                            <button
                              type="button"
                              onClick={speech.pause}
                              className="btn-museum-primary"
                            >
                              <Pause className="h-5 w-5" aria-hidden="true" />
                              <span>Pausa</span>
                            </button>
                          )}

                          {speech.status === "paused" && (
                            <button
                              type="button"
                              onClick={speech.resume}
                              className="btn-museum-primary"
                            >
                              <Play className="h-5 w-5" aria-hidden="true" />
                              <span>Riprendi</span>
                            </button>
                          )}

                          {speech.status !== "idle" && (
                            <button
                              type="button"
                              onClick={speech.stop}
                              className="btn-museum-secondary"
                            >
                              <Square className="h-4 w-4" aria-hidden="true" />
                              <span>Ferma</span>
                            </button>
                          )}
                        </div>

                        {/* Refined Voice Selector */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <VoicePickerDropdown
                            voices={speech.voices}
                            value={speech.selectedVoiceId}
                            onChange={(nextVoice) => {
                              if (nextVoice === speech.selectedVoiceId) return;
                              speech.selectVoice(nextVoice);
                              if (
                                speech.status === "playing" ||
                                speech.status === "loading"
                              ) {
                                speech.play(audioScriptText, nextVoice);
                              } else if (speech.status === "paused") {
                                speech.stop();
                              }
                            }}
                          />
                        </div>
                      </div>

                      {speech.status !== "idle" && (
                        <div className="space-y-1.5">
                          <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={speech.progress}
                            aria-label={`Avanzamento lettura: ${speech.progress}%`}
                            className="h-1.5 w-full overflow-hidden rounded-full bg-gold-light/45"
                          >
                            <div
                              className="h-full rounded-full bg-gold-deep transition-all duration-200"
                              style={{ width: `${Math.max(3, speech.progress)}%` }}
                            />
                          </div>
                          {speech.engineMode === "neural" && speech.durationSec > 0 && (
                            <div className="flex justify-between text-xs font-medium text-ink-muted">
                              <span>{formatAudioTime(speech.currentTimeSec)}</span>
                              <span>{formatAudioTime(speech.durationSec)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {narrationLoading && (
                    <p className="text-xl text-ink-secondary">
                      Elaborazione AI delle informazioni ufficiali d’archivio per
                      il livello <strong>{LEVEL_LABELS[userLevel]}</strong> in
                      corso…
                    </p>
                  )}

                  {!narrationLoading && narrationFallback && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 text-base font-medium text-gold-deep">
                        <Info
                          className="mt-0.5 h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          Servizio AI temporaneamente non disponibile: mostriamo
                          direttamente la descrizione ufficiale certificata
                          dell’archivio.
                        </span>
                      </div>
                      <p className="text-xl leading-[1.8] text-ink">
                        {opera.descrizione_ufficiale}
                      </p>
                    </div>
                  )}

                  {!narrationLoading && narration && (
                    <div className="space-y-6">
                      <div className="space-y-5 text-xl leading-[1.8] text-ink">
                        {narration.testo_lettura.split("\n\n").map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>

                      {narration.curiosita && (
                        <div className="border-l-4 border-gold-deep pl-6">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-deep">
                            Curiosità dagli archivi
                          </p>
                          <p className="mt-1.5 text-lg leading-relaxed text-ink-secondary">
                            {narration.curiosita}
                          </p>
                        </div>
                      )}

                      {opera.documento_archivio ? (
                        <div className="space-y-2 border-t border-gold-light/60 pt-5 text-base text-ink-secondary">
                          <p>
                            <strong className="font-semibold text-gold-deep">
                              Documento d’archivio di riferimento:{" "}
                            </strong>
                            {opera.documento_archivio.titolo} (
                            {opera.documento_archivio.datazione}) —{" "}
                            {opera.documento_archivio.fondo},{" "}
                            <span className="font-medium text-ink">
                              {opera.documento_archivio.segnatura}
                            </span>{" "}
                            ({opera.documento_archivio.ente_conservazione})
                          </p>
                          <blockquote className="font-serif text-xl italic text-ink">
                            “{opera.documento_archivio.estratto_verificato}”
                          </blockquote>
                        </div>
                      ) : (
                        <p className="flex items-start gap-2.5 border-t border-gold-light/60 pt-5 text-base text-ink-muted">
                          <FileWarning
                            className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                            aria-hidden="true"
                          />
                          <span>
                            Nota d’archivio: questo bene culturale non possiede un
                            documento cartaceo collegato; le informazioni si
                            basano sul catalogo ufficiale verificato.
                          </span>
                        </p>
                      )}

                      {narration.fonti_citate.length > 0 && (
                        <p className="text-sm text-ink-muted">
                          <span className="font-semibold text-gold-deep">
                            Fonti citate dall’AI:{" "}
                          </span>
                          {narration.fonti_citate.join(" · ")}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              </RevealOnScroll>

              {/* 2. CONNESSIONI STORICO-CULTURALI */}
              <RevealOnScroll delayMs={100}>
                <section
                  aria-labelledby="connections-heading"
                  className="museum-rule space-y-7 pt-10"
                >
                  <div className="space-y-2">
                    <h2
                      id="connections-heading"
                      className="font-serif text-4xl font-semibold text-ink sm:text-5xl"
                    >
                      Connessioni storico-culturali
                    </h2>
                    <p className="text-lg text-ink-secondary">
                      Esplora lo schema visivo dei legami storici, tematici e
                      territoriali individuati dall’AI fino a tre opere correlate.
                    </p>
                  </div>

                  {relatedLoading && (
                    <p className="text-xl text-ink-secondary">
                      Elaborazione dello schema delle connessioni in corso…
                    </p>
                  )}

                  {!relatedLoading && relatedError && (
                    <p className="text-lg font-medium text-[#8A3727]">
                      {relatedError}
                    </p>
                  )}

                  {!relatedLoading && !relatedError && (
                    <ConnectionsGraph
                      sourceOpera={opera}
                      connections={related}
                    />
                  )}
                </section>
              </RevealOnScroll>
            </article>

            {/* Mobile-only overlay backdrop (desktop stays bright and split 3/4 + 1/4) */}
            {aiSidebarOpen && (
              <div
                aria-hidden="true"
                onClick={() => {
                  setAiSidebarOpen(false);
                  aiTriggerRef.current?.focus({ preventScroll: true });
                }}
                className="fixed inset-0 z-[1140] bg-ink/30 backdrop-blur-[2px] lg:hidden"
              />
            )}

            {/* RIGHT DOCKED AI PANEL (> 1/4 desktop viewport, flush right; mobile slide-in drawer) */}
            <div
              id="ai-assistant-sidebar"
              role={aiSidebarOpen ? "region" : undefined}
              aria-label="Cogito AI — Esplora il Patrimonio"
              className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                aiSidebarOpen
                  ? "ai-drawer-enter fixed inset-y-0 right-0 z-[1150] flex w-full max-w-lg flex-col border-l border-gold-light bg-panna shadow-2xl lg:static lg:inset-auto lg:z-auto lg:flex lg:w-[30vw] lg:min-w-[340px] lg:max-w-[580px] lg:shrink-0 lg:self-stretch lg:overflow-visible lg:border-l lg:border-gold-light/90 lg:bg-panna-soft/55 lg:px-6 lg:shadow-none lg:opacity-100 lg:translate-x-0 xl:w-[30vw] xl:min-w-[410px] xl:px-8"
                  : "hidden lg:pointer-events-none lg:block lg:w-0 lg:min-w-0 lg:translate-x-6 lg:overflow-hidden lg:border-l-0 lg:px-0 lg:opacity-0"
              }`}
            >
              {aiSidebarOpen && (
                <div className="ai-panel-dock-enter flex h-full flex-col lg:sticky lg:top-[81px] lg:h-[calc(100vh-81px)] lg:pb-5 lg:pt-6">
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gold-light/70 px-6 py-4 lg:px-0 lg:pb-3.5 lg:pt-0">
                    <div className="flex items-center gap-2.5">
                      <AskAiIllustration className="h-10 w-10 shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
                          Esplora il Patrimonio
                        </p>
                        <p className="font-serif text-xl font-semibold text-ink xl:text-2xl">
                          Cogito AI
                        </p>
                      </div>
                    </div>

                    <button
                      ref={aiCloseRef}
                      type="button"
                      aria-label="Chiudi Cogito AI"
                      onClick={() => {
                        setAiSidebarOpen(false);
                        aiTriggerRef.current?.focus({ preventScroll: true });
                      }}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-gold-light text-ink transition hover:border-gold-deep hover:bg-panna-soft"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4 lg:px-0 lg:py-0">
                    <OperaQaSection operaId={opera.id} livello={userLevel} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating animated "Chiedi all'AI" trigger button */}
      {!operaLoading && opera && !aiSidebarOpen && (
        <button
          ref={aiTriggerRef}
          type="button"
          aria-expanded={aiSidebarOpen}
          aria-controls="ai-assistant-sidebar"
          onClick={() => setAiSidebarOpen(true)}
          className="fixed bottom-5 right-5 z-[1040] flex items-center gap-3.5 rounded-3xl border-2 border-gold-deep/65 bg-panna/95 py-2.5 pl-3 pr-5 text-left shadow-2xl backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-deep hover:bg-panna-soft sm:bottom-7 sm:right-7 sm:pr-6"
        >
          <AskAiIllustration className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
          <div className="leading-tight">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">
              Scopri di più
            </span>
            <span className="font-serif text-2xl font-semibold text-ink sm:text-[26px]">
              Chiedi all’AI
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
