import {
  ArrowLeft,
  ExternalLink,
  FileWarning,
  Info,
  Navigation,
  Pause,
  Play,
  QrCode,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConnectionsGraph } from "../components/opera/ConnectionsGraph";
import { OperaQaSection } from "../components/opera/OperaQaSection";
import { LevelDropdown } from "../components/ui/LevelDropdown";
import { useSpeechGuide } from "../hooks/useSpeechGuide";
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

  // Stop speech synthesis automatically on artwork change, level change, or unmount
  useEffect(() => {
    speech.stop();
  }, [id, code, userLevel, speech.stop]);

  // Direct 2D artwork lookup by /opera/:id or /qr/:code (zero 3D, zero intro animations)
  useEffect(() => {
    let active = true;
    setOperaLoading(true);
    setOperaError(null);
    setOpera(null);
    setNarration(null);
    setRelated([]);

    const loadOpera = async () => {
      try {
        let data: OperaDetailOut;
        if (code) {
          data = await fetchOperaByQr(code);
        } else if (id) {
          const parsedId = Number(id);
          if (!Number.isInteger(parsedId) || parsedId <= 0) {
            throw new Error("Identificativo opera non valido.");
          }
          data = await fetchOperaById(parsedId);
        } else {
          throw new Error("Opera non specificata.");
        }

        if (active) setOpera(data);
      } catch (err) {
        if (!active) return;
        setOperaError(
          isApiError(err)
            ? err.detail
            : err instanceof Error
              ? err.message
              : "Impossibile trovare l’opera richiesta.",
        );
      } finally {
        if (active) setOperaLoading(false);
      }
    };

    void loadOpera();
    return () => {
      active = false;
    };
  }, [id, code]);

  // AI Complete Description synthesized from official archive sources for userLevel
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

  // AI Historical-Cultural Connections (up to 3 related works)
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

  return (
    <div className="min-h-screen bg-panna text-ink">
      {/* Full-Width Direct 2D Header with Top-Right Level Dropdown */}
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

      <main className="w-full px-6 py-10 sm:px-10 lg:px-16 lg:py-14 xl:px-20">
        {operaLoading && (
          <div className="py-12">
            <p className="font-serif text-3xl text-ink-secondary">
              Caricamento dei dati ufficiali dell’opera…
            </p>
          </div>
        )}

        {!operaLoading && operaError && (
          <div className="max-w-2xl space-y-6 py-12">
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
          /* Full-Width 2-Column Layout: Left Main Content (Hero + Unified AI Description + Connections) + Right Sticky Q&A Sidebar */
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 xl:gap-16">
            {/* LEFT MAIN COLUMN */}
            <article className="space-y-14 lg:col-span-8">
              {/* Artwork Hero */}
              <header className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
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
                        opera.ente.lat,
                        opera.ente.lng,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-museum-primary"
                    >
                      <Navigation className="h-5 w-5" aria-hidden="true" />
                      <span>Calcola percorso su Google Maps</span>
                    </a>

                    {opera.ente.sito_web && (
                      <a
                        href={opera.ente.sito_web}
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

                <div>
                  <img
                    src={opera.immagine_url}
                    alt={opera.titolo}
                    className="max-h-[380px] w-full rounded-2xl object-cover"
                  />
                </div>
              </header>

              {/* 1. UNIFIED AI DESCRIPTION FROM OFFICIAL ARCHIVES + AUDIOGUIDE */}
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

                {/* Italian Speech Audio Guide */}
                {speech.supported && audioScriptText && !narrationLoading && (
                  <div
                    aria-label="Audioguida in italiano"
                    className="flex flex-wrap items-center gap-3 border-y border-gold-light/70 py-4"
                  >
                    <div className="mr-2 flex items-center gap-2 text-base font-semibold text-ink">
                      <Volume2
                        className="h-5 w-5 text-gold-deep"
                        aria-hidden="true"
                      />
                      <span>Audioguida italiana:</span>
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

                    {/* Concise grounded archival document citation or explicit absence note */}
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

              {/* 2. CONNESSIONI STORICO-CULTURALI (Visual Schema + Links) */}
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
            </article>

            {/* 3. RIGHT STICKY SIDEBAR: CHIEDI SULL'OPERA */}
            <div className="border-t border-gold-light/70 pt-10 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0 xl:pl-12">
              <div className="lg:sticky lg:top-28">
                <OperaQaSection operaId={opera.id} livello={userLevel} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
