import {
  ArrowRight,
  MapPin,
  Navigation,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeritageMap } from "../components/explore/HeritageMap";
import { QrScanIllustration } from "../components/qr/QrScanIllustration";
import { ArchiveBook3D } from "../components/three/ArchiveBook3D";
import { MuseumLanding3D } from "../components/three/MuseumLanding3D";
import { LevelDropdown } from "../components/ui/LevelDropdown";
import { LevelWelcomeModal } from "../components/ui/LevelWelcomeModal";
import { RevealOnScroll } from "../components/ui/RevealOnScroll";
import { fetchNearbyOpere } from "../services/apiClient";
import type {
  CategoriaOpera,
  LivelloCompetenza,
  NearbyResponse,
} from "../types/api";
import {
  buildGoogleMapsDirectionsUrl,
  CATEGORIA_LABELS,
  extractQrCodeFromInput,
  formatDistanceKm,
  LEVEL_LABELS,
} from "../utils/format";

const CATANIA_CENTER = { lat: 37.5079, lng: 15.083 };

const NEARBY_CATEGORIES: Array<{ id: CategoriaOpera | null; label: string }> = [
  { id: null, label: "Tutti" },
  { id: "opera", label: "Opera" },
  { id: "reperto", label: "Reperto" },
  { id: "documento", label: "Documento" },
  { id: "monumento", label: "Monumento" },
];

const SAMPLE_QR_CODES = ["COG-001", "COG-002", "COG-004"];

const FOOTER_COLUMNS = [
  {
    title: "Esplora",
    items: [
      "Collezioni permanenti",
      "Archivi storici digitali",
      "Percorsi sul territorio",
      "Audioguide tematiche",
    ],
  },
  {
    title: "Aiuto & Supporto",
    items: [
      "Aiuto e guida alla visita",
      "Domande frequenti (FAQ)",
      "Accessibilità museale",
      "Segnalazioni e supporto",
    ],
  },
  {
    title: "Contatti & Istituzione",
    items: [
      "Contatti",
      "Ufficio stampa",
      "Collabora con Cogito",
      "Privacy e note legali",
    ],
  },
];

interface MainPageProps {
  onOpenQrScanner: () => void;
  userLevel: LivelloCompetenza;
  hasSavedLevel: boolean;
  onChangeUserLevel: (next: LivelloCompetenza) => void;
}

export function MainPage({
  onOpenQrScanner,
  userLevel,
  hasSavedLevel,
  onChangeUserLevel,
}: MainPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const skipIntroFromNav = Boolean(
    (location.state as { skipIntro?: boolean } | null)?.skipIntro,
  );

  const [hasEnteredMuseum, setHasEnteredMuseum] = useState(skipIntroFromNav);

  // Manual QR entry state
  const [manualQr, setManualQr] = useState("");
  const [manualQrError, setManualQrError] = useState<string | null>(null);

  // Geolocation & nearby heritage state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "gps" | "fallback">(
    "detecting",
  );
  const [nearbyCategory, setNearbyCategory] = useState<CategoriaOpera | null>(
    null,
  );
  const [nearbyData, setNearbyData] = useState<NearbyResponse | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const detectPosition = useCallback(() => {
    setGpsStatus("detecting");

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setCoords(CATANIA_CENTER);
      setGpsStatus("fallback");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsStatus("gps");
      },
      () => {
        setCoords(CATANIA_CENTER);
        setGpsStatus("fallback");
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (hasEnteredMuseum && !coords) {
      detectPosition();
    }
  }, [hasEnteredMuseum, coords, detectPosition]);

  useEffect(() => {
    if (!hasEnteredMuseum || !coords) return;
    let active = true;
    setNearbyLoading(true);
    setNearbyError(null);

    fetchNearbyOpere({
      lat: coords.lat,
      lng: coords.lng,
      radius_km: 25,
      categoria: nearbyCategory,
    })
      .then((res) => {
        if (!active) return;
        setNearbyData(res);
      })
      .catch(() => {
        if (!active) return;
        setNearbyError(
          "Impossibile caricare i beni culturali nelle vicinanze in questo momento.",
        );
      })
      .finally(() => {
        if (active) setNearbyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasEnteredMuseum, coords, nearbyCategory]);

  const handleManualQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = extractQrCodeFromInput(manualQr);
    if (!normalized) {
      setManualQrError("Inserisci un codice opera valido (esempio: COG-001).");
      return;
    }
    setManualQrError(null);
    navigate(`/qr/${encodeURIComponent(normalized)}`);
  };

  // Show the 3D Museum landing outside until the visitor enters inside & opens the entrance book
  if (!hasEnteredMuseum) {
    return <MuseumLanding3D onEnter={() => setHasEnteredMuseum(true)} />;
  }

  const nearbyItems = nearbyData?.items ?? [];
  const topFourNearby = nearbyItems.slice(0, 4);
  const isRemoteFallback = Boolean(nearbyData?.fallback_used);
  const mapCenterLat = isRemoteFallback
    ? CATANIA_CENTER.lat
    : (nearbyData?.user_lat ?? coords?.lat ?? CATANIA_CENTER.lat);
  const mapCenterLng = isRemoteFallback
    ? CATANIA_CENTER.lng
    : (nearbyData?.user_lng ?? coords?.lng ?? CATANIA_CENTER.lng);

  return (
    <div className="min-h-screen bg-panna text-ink">
      {/* First-entry knowledge level prompt shown immediately upon entering the 2D museum */}
      <LevelWelcomeModal open={!hasSavedLevel} onSelect={onChangeUserLevel} />

      {/* Full-Width Minimal Museum Header with Top-Right Level Dropdown Button */}
      <header className="sticky top-0 z-[1050] border-b border-gold-light/70 bg-panna/95 backdrop-blur-md">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16 xl:px-20">
          <div className="flex flex-wrap items-center gap-6 sm:gap-12">
            <a
              href="#home"
              className="font-serif text-3xl font-bold tracking-[0.12em] text-ink transition hover:text-gold-deep"
            >
              COGITO
            </a>

            <nav
              aria-label="Navigazione principale"
              className="flex flex-wrap items-center gap-6 text-lg font-medium sm:gap-8"
            >
              <a
                href="#home"
                className="text-ink-secondary transition hover:text-gold-deep"
              >
                Home
              </a>
              <a
                href="#scopri"
                className="text-ink-secondary transition hover:text-gold-deep"
              >
                Scopri
              </a>
              <a
                href="#archivio"
                className="text-ink-secondary transition hover:text-gold-deep"
              >
                Esplora archivio
              </a>
            </nav>
          </div>

          <LevelDropdown value={userLevel} onChange={onChangeUserLevel} />
        </div>
      </header>

      <main className="w-full px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* BLOCK 1 — Inquadra l'opera / Codice QR */}
        <section id="home" className="scroll-mt-24 py-16 sm:py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.22fr_0.78fr] lg:items-center lg:gap-16 xl:gap-20">
            {/* Left Column: Title + Side-by-Side Explanatory Text & Animated QR Illustration + CTA */}
            <RevealOnScroll immediate delayMs={40}>
              <div className="space-y-8">
                <h1 className="font-serif text-5xl font-semibold leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
                  Inquadra l’opera per scoprirne la storia
                </h1>

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-xl space-y-6">
                    <p className="text-xl leading-relaxed text-ink-secondary sm:text-2xl">
                      Punta la fotocamera sul codice QR vicino al bene culturale:
                      la descrizione AI completa dagli archivi ufficiali e
                      l’audioguida si adatteranno al tuo livello (
                      <strong className="font-semibold text-ink">
                        {LEVEL_LABELS[userLevel]}
                      </strong>
                      ).
                    </p>

                    <div>
                      <button
                        type="button"
                        onClick={onOpenQrScanner}
                        className="btn-museum-primary px-10 text-xl"
                      >
                        <QrCode className="h-6 w-6" aria-hidden="true" />
                        <span>Inquadra QR Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Animated QR Scan Illustration */}
                  <QrScanIllustration />
                </div>
              </div>
            </RevealOnScroll>

            {/* Right Column: Manual Entry & Sample Codes */}
            <RevealOnScroll immediate delayMs={180}>
              <div className="space-y-6 lg:border-l lg:border-gold-light/70 lg:pl-12 xl:pl-14">
                <div className="space-y-2">
                  <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                    Oppure inserisci manualmente
                  </h2>
                  <p className="text-lg text-ink-secondary">
                    Digita il codice stampato accanto all’opera per aprire subito
                    la scheda dedicata.
                  </p>
                </div>

                <form
                  onSubmit={handleManualQrSubmit}
                  className="flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <label htmlFor="home-manual-qr" className="sr-only">
                      Codice identificativo manuale
                    </label>
                    <input
                      id="home-manual-qr"
                      type="text"
                      value={manualQr}
                      onChange={(e) => {
                        setManualQr(e.target.value);
                        if (manualQrError) setManualQrError(null);
                      }}
                      placeholder="Es. COG-001"
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="min-h-[58px] w-full border-b-2 border-gold-deep/55 bg-transparent px-1 text-2xl font-semibold uppercase tracking-wider text-ink placeholder:text-ink-muted/60 focus:border-gold-deep focus:outline-none"
                    />
                  </div>

                  <button type="submit" className="btn-museum-secondary shrink-0">
                    <span>Apri scheda</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </form>

                {manualQrError && (
                  <p className="text-base font-medium text-[#8A3727]">
                    {manualQrError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2 text-base text-ink-muted">
                  <span>Codici rapidi di prova:</span>
                  {SAMPLE_QR_CODES.map((code) => (
                    <Link
                      key={code}
                      to={`/qr/${code}`}
                      className="rounded-full border border-gold-light px-4 py-1.5 font-semibold text-gold-deep transition hover:border-gold-deep hover:bg-panna-soft"
                    >
                      {code}
                    </Link>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* BLOCK 2 — Scopri i beni culturali vicino a te (Scroll-triggered Block Appear) */}
        <section
          id="scopri"
          className="museum-rule scroll-mt-24 space-y-10 py-16 sm:py-24"
        >
          <RevealOnScroll>
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
                    Scopri i beni culturali vicino a te
                  </h2>

                  <p className="text-lg text-ink-secondary">
                    {gpsStatus === "detecting" &&
                      "Rilevamento della tua posizione in corso…"}
                    {gpsStatus === "gps" &&
                      (isRemoteFallback && nearbyData?.fallback_message
                        ? nearbyData.fallback_message
                        : "Posizione attuale rilevata: ecco i beni culturali più vicini a te.")}
                    {gpsStatus === "fallback" &&
                      (nearbyData?.fallback_message ||
                        "Posizione GPS non disponibile: mappa centrata automaticamente sul centro di Catania.")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={detectPosition}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-light px-5 text-base font-semibold text-ink-secondary transition hover:border-gold-deep hover:text-ink"
                >
                  <RefreshCw
                    className="h-4 w-4 text-gold-deep"
                    aria-hidden="true"
                  />
                  <span>Aggiorna posizione</span>
                </button>
              </div>

              {/* Category Filters */}
              <div
                role="group"
                aria-label="Filtra i beni sulla mappa per categoria"
                className="flex flex-wrap items-center gap-3"
              >
                {NEARBY_CATEGORIES.map((cat) => {
                  const active = nearbyCategory === cat.id;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setNearbyCategory(cat.id)}
                      className={`inline-flex min-h-[48px] items-center rounded-full px-6 text-base font-semibold transition ${
                        active
                          ? "bg-gold-deep text-panna-card"
                          : "border border-gold-light text-ink-secondary hover:border-gold-deep hover:text-ink"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </RevealOnScroll>

          {/* Map glides in smoothly as user scrolls */}
          <RevealOnScroll delayMs={120}>
            <HeritageMap
              centerLat={mapCenterLat}
              centerLng={mapCenterLng}
              items={nearbyItems}
              onSelectOpera={(id) => navigate(`/opera/${id}`)}
            />
          </RevealOnScroll>

          {/* Top 4 Nearby Assets appear smoothly below map */}
          <RevealOnScroll delayMs={160}>
            <div className="space-y-4 pt-4">
              <h3 className="font-serif text-3xl font-semibold text-ink">
                {nearbyLoading
                  ? "Ricerca dei beni sul territorio…"
                  : `I ${topFourNearby.length} beni culturali più vicini`}
              </h3>

              {nearbyError && (
                <p className="text-lg font-medium text-[#8A3727]">
                  {nearbyError}
                </p>
              )}

              {!nearbyLoading &&
                !nearbyError &&
                topFourNearby.length === 0 && (
                  <p className="text-lg text-ink-secondary">
                    Nessun bene culturale trovato in questa categoria nelle
                    vicinanze.
                  </p>
                )}

              <ul className="grid gap-x-14 gap-y-2 lg:grid-cols-2">
                {topFourNearby.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col justify-between gap-5 border-t border-gold-light/60 py-7"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold-deep">
                        <span>{CATEGORIA_LABELS[item.categoria]}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          {formatDistanceKm(item.distance_km)}
                        </span>
                      </div>

                      <h4 className="font-serif text-3xl font-semibold text-ink">
                        {item.titolo}
                      </h4>

                      <p className="text-base font-medium text-ink-secondary">
                        {item.ente_nome} · {item.citta}
                      </p>

                      <p className="text-lg text-ink-muted">
                        {item.breve_sintesi}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Link
                        to={`/opera/${item.id}`}
                        className="btn-museum-primary"
                      >
                        <span>Apri scheda</span>
                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                      </Link>

                      <a
                        href={buildGoogleMapsDirectionsUrl(item.lat, item.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-museum-secondary"
                      >
                        <Navigation
                          className="h-5 w-5 text-gold-deep"
                          aria-hidden="true"
                        />
                        <span>Calcola percorso</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </RevealOnScroll>
        </section>

        {/* BLOCK 3 — Ricerca negli Archivi Certificati (Scroll-triggered Block Appear) */}
        <section
          id="archivio"
          className="museum-rule scroll-mt-24 space-y-10 py-16 sm:py-24"
        >
          <RevealOnScroll>
            <div className="mx-auto max-w-4xl space-y-4 text-center">
              <h2 className="font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
                Effettua una ricerca tra i nostri archivi certificati
              </h2>

              <p className="text-xl text-ink-secondary">
                Apri il volume d’archivio per consultare le opere, i reperti, i
                documenti storici e i monumenti censiti dalla rete museale.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={150}>
            <ArchiveBook3D />
          </RevealOnScroll>
        </section>
      </main>

      {/* Professional Full-Width Demonstrative Footer */}
      <RevealOnScroll>
        <footer
          aria-label="Footer dimostrativo"
          className="museum-rule mt-10 bg-panna-soft/75 py-16"
        >
          <div className="w-full space-y-12 px-6 sm:px-10 lg:px-16 xl:px-20">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4">
                <p className="font-serif text-4xl font-bold tracking-[0.14em] text-ink">
                  COGITO
                </p>
                <p className="text-base leading-relaxed text-ink-secondary">
                  Piattaforma culturale dedicata alla scoperta accessibile del
                  patrimonio museale, archeologico e archivistico del territorio
                  catanese.
                </p>
                <p className="text-sm font-medium text-gold-deep">
                  Catania · Rete Museale e Archivistica
                </p>
              </div>

              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title} className="space-y-4 select-none">
                  <h3 className="font-serif text-2xl font-semibold text-ink">
                    {col.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.items.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          aria-disabled="true"
                          tabIndex={-1}
                          className="pointer-events-none cursor-default text-left text-base font-medium text-ink-muted"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-gold-light/70 pt-7 text-sm text-ink-muted sm:flex-row sm:items-center">
              <p>
                © {new Date().getFullYear()} Cogito — Oltre il Museo. Tutti i
                diritti riservati.
              </p>
              <p className="italic">
                Footer dimostrativo: i pulsanti di navigazione secondaria sono
                esemplificativi e non premibili.
              </p>
            </div>
          </div>
        </footer>
      </RevealOnScroll>
    </div>
  );
}
