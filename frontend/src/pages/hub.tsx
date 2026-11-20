import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Archive,
  Armchair,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Network,
  Palette,
  QrCode,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { ArchiveBookOverlay } from "../components/ArchiveBookOverlay";
import {
  ArchivePanel2DModal,
  type ArchiveVerticalPanelKey,
} from "../components/ArchivePanel2DModal";
import { MuseumFloorplanModal } from "../components/MuseumFloorplanModal";
import {
  OperaAnalysisContent,
  type OperaAnalysisTab,
} from "../components/OperaAnalysisContent";
import { TreasureMapGraph } from "../components/TreasureMapGraph";
import {
  MuseumSceneController,
  type HallStage,
  type HubZoneId,
  type Sala3Stage,
  type Sala4ExhibitFocus,
  type SceneHitTarget,
} from "../components/hub3d/MuseumSceneController";
import { CATANIA_POLE_COORDS } from "../data/mockDataset";
import { useSpeechNarration } from "../hooks/useSpeechNarration";
import { useUserLevel } from "../hooks/useUserLevel";
import {
  ApiError,
  getNearbyOpere,
  getOperaById,
  getOperaNarration,
  getRelatedOpere,
  IS_MOCK_MODE,
  resolveQrCode,
} from "../services/apiClient";
import type {
  CorrelazioneItemOut,
  NarrazioneOut,
  NearbyResponse,
  OperaDetailOut,
  OperaNearbyOut,
  OperaSummaryOut,
} from "../types/api";
import { CATEGORY_LABELS } from "../utils/labels";

const ZONE_LABELS: Record<HubZoneId, { badge: string; title: string }> = {
  exterior: { badge: "Esterno", title: "Notte Lunare & Fontana" },
  room1: { badge: "Hall Principale", title: "Androne & Accoglienza" },
  room2: { badge: "Sala Territorio", title: "Opere Vicine & Mappa" },
  room3: { badge: "Sala Archivi", title: "Leggio, Fonti & Connessioni" },
  room4: { badge: "Sala Opera", title: "Esposizione Singola" },
};

function parseInitialZone(roomParam: string | null): HubZoneId {
  if (roomParam === "1" || roomParam === "hall") return "room1";
  if (roomParam === "2" || roomParam === "territorio") return "room2";
  if (roomParam === "3" || roomParam === "archivi") return "room3";
  if (roomParam === "4" || roomParam === "opera") return "room4";
  return "exterior";
}

function parseOperaIdParam(raw: string | null): number | null {
  if (!raw) return null;
  const num = Number(raw);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function Hub3DPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { level } = useUserLevel();

  const initialZoneRef = useRef<HubZoneId>(parseInitialZone(searchParams.get("room")));
  const initialOperaIdRef = useRef<number | null>(
    parseOperaIdParam(searchParams.get("operaId")),
  );

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<MuseumSceneController | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const [activeZone, setActiveZone] = useState<HubZoneId>(initialZoneRef.current);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [visitorPos, setVisitorPos] = useState<{ x: number; z: number }>({
    x: 0,
    z: 58,
  });

  // Modale Planimetria & Mappa Territoriale (in-page)
  const [floorplanModal, setFloorplanModal] = useState<{
    open: boolean;
    tab: "floorplan" | "territory";
    highlightId: number | null;
  }>({ open: false, tab: "floorplan", highlightId: null });

  // Hall Principale — Totem QR & stato scroll avanti
  const [hallStage, setHallStage] = useState<HallStage>("overview");
  const [isQrPopoverOpen, setIsQrPopoverOpen] = useState(false);
  const [qrInput, setQrInput] = useState("COG-001");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Sala Territorio — Opere Vicine
  const [nearbyData, setNearbyData] = useState<NearbyResponse | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [usingFallbackCoords, setUsingFallbackCoords] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [nearestArtwork, setNearestArtwork] = useState<OperaNearbyOut | null>(null);
  const [selectedTerritoryOpera, setSelectedTerritoryOpera] =
    useState<OperaNearbyOut | null>(null);

  // Sala Archivi — Leggio, Stele & Grafo Relazionale
  const [archiveOpera, setArchiveOpera] = useState<OperaDetailOut | null>(null);
  const [archiveNarration, setArchiveNarration] = useState<NarrazioneOut | null>(null);
  const [archiveCorrelations, setArchiveCorrelations] = useState<CorrelazioneItemOut[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [sala3Stage, setSala3Stage] = useState<Sala3Stage>("entry");
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [activeSteleModal, setActiveSteleModal] =
    useState<ArchiveVerticalPanelKey | null>(null);
  const [isRelationalGraphOpen, setIsRelationalGraphOpen] = useState(false);

  // Sala Opera — Esposizione Singola, Porte Persistenti, Scroll & Tab Pulite
  const [room4Opera, setRoom4Opera] = useState<OperaDetailOut | null>(null);
  const [room4Narration, setRoom4Narration] = useState<NarrazioneOut | null>(null);
  const [room4Loading, setRoom4Loading] = useState(false);
  const [room4Error, setRoom4Error] = useState<string | null>(null);
  const [room4Focus, setRoom4Focus] = useState<Sala4ExhibitFocus>("overview");
  const [room4DrawerOpen, setRoom4DrawerOpen] = useState(true);
  const [room4Tab, setRoom4Tab] = useState<OperaAnalysisTab>("storia");

  const room4Speech = useSpeechNarration(room4Narration?.script_audio);

  const syncUrlParams = useCallback(
    (zone: HubZoneId, operaId: number | null) => {
      const next = new URLSearchParams();
      if (zone === "room1") next.set("room", "1");
      else if (zone === "room2") next.set("room", "2");
      else if (zone === "room3") next.set("room", "3");
      else if (zone === "room4") next.set("room", "4");

      if (operaId && (zone === "room3" || zone === "room4")) {
        next.set("operaId", String(operaId));
      }
      setSearchParams(next, { replace: true });
    },
    [setSearchParams],
  );

  // Caricamento Sala Territorio
  const fetchNearbyWithCoords = useCallback(
    (lat: number, lng: number, signal?: AbortSignal) => {
      setNearbyLoading(true);
      setNearbyError(null);
      getNearbyOpere(
        {
          lat,
          lng,
          radius_km: CATANIA_POLE_COORDS.radiusKm,
        },
        signal,
      )
        .then((res) => {
          setNearbyData(res);
          controllerRef.current?.updateTerritoryArtworks(res.items);
        })
        .catch((err: unknown) => {
          if (signal?.aborted) return;
          setNearbyError(
            err instanceof Error ? err.message : "Impossibile caricare i beni vicini.",
          );
        })
        .finally(() => {
          if (!signal?.aborted) setNearbyLoading(false);
        });
    },
    [],
  );

  const requestTerritoryGeo = useCallback(
    (signal?: AbortSignal) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setUsingFallbackCoords(true);
        fetchNearbyWithCoords(CATANIA_POLE_COORDS.lat, CATANIA_POLE_COORDS.lng, signal);
        return;
      }

      setNearbyLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUsingFallbackCoords(false);
          fetchNearbyWithCoords(pos.coords.latitude, pos.coords.longitude, signal);
        },
        () => {
          setUsingFallbackCoords(true);
          fetchNearbyWithCoords(CATANIA_POLE_COORDS.lat, CATANIA_POLE_COORDS.lng, signal);
        },
        { timeout: 5000 },
      );
    },
    [fetchNearbyWithCoords],
  );

  useEffect(() => {
    if (activeZone !== "room2" || nearbyData) return;
    const controller = new AbortController();
    requestTerritoryGeo(controller.signal);
    return () => controller.abort();
  }, [activeZone, nearbyData, requestTerritoryGeo]);

  // Caricamento Sala Archivi
  const loadArchiveOperaData = useCallback(
    (operaId: number, signal?: AbortSignal) => {
      setArchiveLoading(true);
      Promise.all([
        getOperaById(operaId, signal),
        getRelatedOpere(operaId, 3, signal),
        level ? getOperaNarration(operaId, level, signal).catch(() => null) : Promise.resolve(null),
      ])
        .then(([detail, relRes, narr]) => {
          setArchiveOpera(detail);
          setArchiveCorrelations(relRes.correlazioni);
          setArchiveNarration(narr);
        })
        .catch(() => {
          // Mantiene stato corrente se interrotto
        })
        .finally(() => {
          if (!signal?.aborted) setArchiveLoading(false);
        });
    },
    [level],
  );

  useEffect(() => {
    controllerRef.current?.updateArchiveCorridor({
      opera: archiveOpera,
      narration: archiveNarration,
      correlazioni: archiveCorrelations,
    });
  }, [archiveOpera, archiveNarration, archiveCorrelations]);

  // Caricamento dati Sala Opera
  const fetchRoom4Bundle = useCallback(
    async (operaOrId: number | OperaDetailOut, signal?: AbortSignal) => {
      setRoom4Loading(true);
      setRoom4Error(null);
      try {
        const detail =
          typeof operaOrId === "number"
            ? await getOperaById(operaOrId, signal)
            : operaOrId;
        const [relRes, narr] = await Promise.all([
          getRelatedOpere(detail.id, 3, signal).catch(() => ({
            opera_sorgente_id: detail.id,
            from_cache: false,
            correlazioni: [],
          })),
          level
            ? getOperaNarration(detail.id, level, signal).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (signal?.aborted) return null;
        setRoom4Opera(detail);
        setRoom4Narration(narr);
        return { detail, correlazioni: relRes.correlazioni };
      } catch (err: unknown) {
        if (signal?.aborted) return null;
        if (err instanceof ApiError && err.status === 404) {
          setRoom4Error("Opera non trovata.");
        } else {
          setRoom4Error(
            err instanceof Error ? err.message : "Errore di caricamento opera.",
          );
        }
        setRoom4Opera(null);
        return null;
      } finally {
        if (!signal?.aborted) setRoom4Loading(false);
      }
    },
    [level],
  );

  // Aggiorna narrazione in Sala Opera se cambia livello salvato
  useEffect(() => {
    if (!room4Opera || !level) {
      setRoom4Narration(null);
      return;
    }
    const controller = new AbortController();
    getOperaNarration(room4Opera.id, level, controller.signal)
      .then(setRoom4Narration)
      .catch(() => {
        if (!controller.signal.aborted) setRoom4Narration(null);
      });
    return () => controller.abort();
  }, [room4Opera, level]);

  useEffect(() => {
    if (activeZone !== "room4") {
      room4Speech.stop();
    }
  }, [activeZone, room4Speech]);

  useEffect(() => {
    controllerRef.current?.setRoom4DrawerOpen(room4DrawerOpen);
  }, [room4DrawerOpen]);

  const navigateToZone = useCallback(
    async (zone: HubZoneId, operaOrId?: number | OperaDetailOut) => {
      setIsQrPopoverOpen(false);
      setSelectedTerritoryOpera(null);
      setHoverState(null);

      if (zone === "room4") {
        const targetOpera = operaOrId ?? room4Opera ?? 1;
        const bundle = await fetchRoom4Bundle(targetOpera);
        if (bundle) {
          setRoom4Focus("overview");
          setRoom4Tab("storia");
          if (controllerRef.current) {
            await controllerRef.current.enterSalaOpera(
              bundle.detail,
              bundle.correlazioni,
            );
          }
          setActiveZone("room4");
          syncUrlParams("room4", bundle.detail.id);
        }
        return;
      }

      setActiveZone(zone);
      if (controllerRef.current) {
        await controllerRef.current.transitionToZone(zone);
      }
      syncUrlParams(zone, zone === "room3" ? archiveOpera?.id ?? null : null);
    },
    [archiveOpera?.id, fetchRoom4Bundle, room4Opera, syncUrlParams],
  );

  const handleSelectSceneTarget = useCallback(
    (target: SceneHitTarget) => {
      if (target.kind === "portal") {
        if (target.room === 4) {
          if (room4Opera) {
            void navigateToZone("room4", room4Opera.id);
          } else {
            setIsQrPopoverOpen(true);
            window.setTimeout(() => qrInputRef.current?.focus(), 60);
          }
        } else {
          void navigateToZone(target.room === 2 ? "room2" : "room3");
        }
      } else if (target.kind === "qr-station") {
        setIsQrPopoverOpen(true);
        window.setTimeout(() => qrInputRef.current?.focus(), 60);
      } else if (target.kind === "territory-artwork") {
        setSelectedTerritoryOpera(target.opera);
      } else if (target.kind === "open-map") {
        setFloorplanModal({
          open: true,
          tab: "territory",
          highlightId: nearestArtwork?.id ?? null,
        });
      } else if (target.kind === "archive-book") {
        setIsBookOpen(true);
      } else if (target.kind === "archive-panel") {
        setActiveSteleModal(target.panelKey);
      } else if (target.kind === "relational-graph") {
        setIsRelationalGraphOpen(true);
      } else if (target.kind === "sala4-exhibit") {
        setRoom4Focus(target.exhibit);
        controllerRef.current?.focusSala4Exhibit(target.exhibit);
        if (target.exhibit === "audio") {
          if (room4Speech.isSpeaking) room4Speech.stop();
          else if (room4Narration?.script_audio) room4Speech.speak();
          else setRoom4DrawerOpen(true);
        } else if (target.exhibit === "archive") {
          setRoom4Tab("archivio");
          setRoom4DrawerOpen(true);
        } else if (target.exhibit === "connections") {
          setRoom4Tab("connessioni");
          setRoom4DrawerOpen(true);
        } else if (target.exhibit === "author" || target.exhibit === "artwork") {
          setRoom4Tab("storia");
        }
      }
    },
    [navigateToZone, nearestArtwork?.id, room4Narration?.script_audio, room4Speech],
  );

  const callbacksRef = useRef({
    onSelect: handleSelectSceneTarget,
    onZone: (zone: HubZoneId) => {
      setActiveZone(zone);
      syncUrlParams(zone, zone === "room4" ? room4Opera?.id ?? null : null);
    },
  });
  callbacksRef.current.onSelect = handleSelectSceneTarget;
  callbacksRef.current.onZone = (zone: HubZoneId) => {
    setActiveZone(zone);
    syncUrlParams(zone, zone === "room4" ? room4Opera?.id ?? null : null);
  };

  // Setup scena 3D continua
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    try {
      const controller = new MuseumSceneController(host, {
        onHoverTarget: (target, x, y) => {
          setHoverState(target ? { label: target.label, x, y } : null);
        },
        onSelectTarget: (target) => {
          callbacksRef.current.onSelect(target);
        },
        onZoneChange: (zone) => {
          if (zone !== "room1") setHallStage("overview");
          callbacksRef.current.onZone(zone);
        },
        onHallStageChange: (stage) => {
          setHallStage(stage);
        },
        onScrollChange: (progress) => {
          setScrollProgress(progress);
        },
        onNearestTerritoryArtwork: (opera) => {
          setNearestArtwork(opera);
        },
        onSala3StageChange: (stage) => {
          setSala3Stage(stage);
        },
        onSala4FocusChange: (focus) => {
          setRoom4Focus(focus);
        },
        onVisitorPositionChange: (pos) => {
          setVisitorPos(pos);
        },
      });
      controllerRef.current = controller;
      setWebglError(null);

      const startZone = initialZoneRef.current;
      const startOperaId = initialOperaIdRef.current;
      controller.jumpImmediatelyToZone(startZone);
      if (startZone === "room4") {
        void fetchRoom4Bundle(startOperaId ?? 1).then((bundle) => {
          if (bundle) {
            controller.updateSingleOpera(bundle.detail, bundle.correlazioni);
          }
        });
      } else if (startZone === "room3" && startOperaId) {
        loadArchiveOperaData(startOperaId);
      }

      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    } catch {
      setWebglError(
        "Rendering WebGL non disponibile: usa la Mappa Sale per navigare in tutte le sezioni.",
      );
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolveQrInHub = async (codeOverride?: string) => {
    const code = (codeOverride ?? qrInput).trim();
    if (!code || qrLoading) return;

    setQrInput(code);
    setQrLoading(true);
    setQrError(null);

    try {
      const resolved = await resolveQrCode(code);
      await navigateToZone("room4", resolved);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setQrError(`Codice QR "${code}" non trovato nel catalogo.`);
      } else {
        setQrError(
          err instanceof Error ? err.message : "Errore durante la lettura del QR code.",
        );
      }
    } finally {
      setQrLoading(false);
    }
  };

  const stepCorridorScroll = (delta: number) => {
    const next = Math.max(0, Math.min(1, scrollProgress + delta));
    setScrollProgress(next);
    controllerRef.current?.setCorridorProgress(next);
  };

  const handleBookSelectOpera = (item: OperaSummaryOut) => {
    loadArchiveOperaData(item.id);
    setScrollProgress(0.42);
    controllerRef.current?.setCorridorProgress(0.42);
  };

  const handleFocusSala4 = (exhibit: Sala4ExhibitFocus) => {
    setRoom4Focus(exhibit);
    controllerRef.current?.focusSala4Exhibit(exhibit);
    if (exhibit === "audio") {
      if (room4Speech.isSpeaking) room4Speech.stop();
      else if (room4Narration?.script_audio) room4Speech.speak();
      else setRoom4DrawerOpen(true);
    } else if (exhibit === "archive") {
      setRoom4Tab("archivio");
    } else if (exhibit === "connections") {
      setRoom4Tab("connessioni");
    } else if (exhibit === "author" || exhibit === "artwork") {
      setRoom4Tab("storia");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0b0e16] text-museum-ink select-none">
      {/* Canvas Three.js Unico Connesso */}
      <div
        ref={canvasHostRef}
        className="fixed inset-0 z-0"
        aria-label="Museo Neoclassico Interattivo 3D Cogito"
      />

      {/* Grande titolo editoriale sull'esterno notturno (ispirato a cogito.html) */}
      <div
        aria-hidden={activeZone !== "exterior"}
        style={{
          opacity:
            activeZone === "exterior" ? Math.max(0, 1 - scrollProgress * 2.1) : 0,
        }}
        className="fixed top-[7vh] sm:top-[8.5vh] left-0 right-0 z-10 text-center pointer-events-none transition-opacity duration-300 px-4"
      >
        <h1 className="font-serif-display font-normal tracking-[0.14em] text-[clamp(44px,8.5vw,118px)] leading-none text-[#fff7e0] drop-shadow-[0_6px_32px_rgba(0,0,0,0.85)]">
          COGITO
        </h1>
        <p className="mt-2 sm:mt-3 text-[11px] sm:text-sm uppercase tracking-[0.52em] text-[#f3dfa2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          Beyond the Museum
        </p>
      </div>

      {webglError && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#e9decb] text-[#221a12] text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-[#7a5b28] mb-2">
            Modalità Accessibile
          </p>
          <p className="max-w-md text-sm text-[#4f4134]">{webglError}</p>
        </div>
      )}

      {/* Tooltip Hover */}
      {hoverState && (
        <div
          style={{ left: hoverState.x, top: hoverState.y }}
          className="fixed z-30 pointer-events-none -translate-x-1/2 -translate-y-[130%] museum-glass px-3.5 py-2 rounded-xl border border-[#c9a86a]/55 shadow-2xl max-w-xs"
        >
          <p className="text-xs font-medium text-[#e4cc9a] truncate">{hoverState.label}</p>
          <p className="text-[10px] text-neutral-300">Clicca per interagire</p>
        </div>
      )}

      {/* ===================================================================
          HUD SUPERIORE (Nomi naturali delle sale + Mappa Sale)
         =================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-20 p-3 sm:p-5 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto museum-glass rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <button
            type="button"
            onClick={() => void navigateToZone("exterior")}
            title="Torna alla vista esterna notturna"
            className="w-8 h-8 rounded-lg bg-[#c9a86a]/25 border border-[#c9a86a]/60 flex items-center justify-center hover:bg-[#c9a86a]/40 transition-colors"
          >
            <span className="font-serif-display text-lg font-bold text-[#e4cc9a]">C</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-lg tracking-[0.12em] uppercase text-white font-medium">
                Cogito
              </span>
              {IS_MOCK_MODE && (
                <span className="rounded-full bg-[#c9a86a]/20 border border-[#c9a86a]/45 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#e4cc9a]">
                  Demo
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-200">
              <span className="text-[#e4cc9a] font-semibold uppercase tracking-[0.14em] mr-1.5">
                {ZONE_LABELS[activeZone].badge}
              </span>
              {ZONE_LABELS[activeZone].title}
            </p>
          </div>
        </div>

        <nav
          aria-label="Navigazione tra gli ambienti del museo"
          className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2"
        >
          {(
            [
              { id: "exterior" as const, label: "Esterno" },
              { id: "room1" as const, label: "Hall Principale" },
              { id: "room2" as const, label: "Sala Territorio" },
              { id: "room3" as const, label: "Sala Archivi" },
            ] as const
          ).map((z) => {
            const isCurrent = activeZone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => void navigateToZone(z.id)}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors border ${
                  isCurrent
                    ? "bg-[#c9a86a] text-[#0b0b0c] border-[#e4cc9a]"
                    : "museum-glass text-neutral-100 border-white/15 hover:border-[#c9a86a]/65"
                }`}
              >
                {z.label}
              </button>
            );
          })}

          {(room4Opera || activeZone === "room4") && (
            <button
              type="button"
              onClick={() => void navigateToZone("room4", room4Opera?.id ?? 1)}
              aria-current={activeZone === "room4" ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors border ${
                activeZone === "room4"
                  ? "bg-[#c9a86a] text-[#0b0b0c] border-[#e4cc9a]"
                  : "museum-glass text-neutral-100 border-white/15 hover:border-[#c9a86a]/65"
              }`}
            >
              Sala Opera
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setFloorplanModal({
                open: true,
                tab: "floorplan",
                highlightId: room4Opera?.id ?? nearestArtwork?.id ?? null,
              })
            }
            className="museum-glass hover:border-[#c9a86a]/75 rounded-full px-4 py-2 text-xs font-medium text-[#e4cc9a] inline-flex items-center gap-1.5 shadow-lg transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mappa Sale</span>
          </button>
        </nav>
      </header>

      {/* ===================================================================
          ESTERNO — VISTA DALL'ALTO SUL MUSEO & FONTANA LUNARI NEL VUOTO
         =================================================================== */}
      {activeZone === "exterior" && (
        <div className="fixed inset-x-0 bottom-6 z-20 px-4 flex flex-col items-center gap-3 pointer-events-none">
          <div className="pointer-events-auto museum-glass rounded-full px-5 py-2.5 flex items-center gap-4 border border-[#c9a86a]/45 shadow-2xl">
            <span className="text-xs sm:text-sm text-neutral-100">
              Scorri con la rotella per entrare dalla notte lunare nella Hall Principale
            </span>
            <button
              type="button"
              onClick={() => void navigateToZone("room1")}
              className="shrink-0 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-1.5 inline-flex items-center gap-1 transition-colors"
            >
              <span>Entra nella Hall</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          HALL PRINCIPALE (Totem QR + Scritte 45° davanti alle ali)
         =================================================================== */}
      {activeZone === "room1" && (
        <div className="fixed inset-x-0 bottom-5 z-20 px-4 flex flex-col items-center gap-3 pointer-events-none">
          {isQrPopoverOpen && (
            <section
              aria-label="Totem Ospitalità QR nella Hall Principale"
              className="pointer-events-auto museum-glass w-full max-w-lg rounded-2xl border border-[#e4cc9a]/55 p-4 sm:p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-[#e4cc9a]">
                  <QrCode className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h1 className="font-serif-display text-xl text-white">
                    Totem QR — Accedi alla Sala Opera
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrPopoverOpen(false)}
                  aria-label="Chiudi Totem QR"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleResolveQrInHub();
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <label htmlFor="hub-qr-input" className="sr-only">
                  Inserisci codice QR dell&apos;opera
                </label>
                <input
                  ref={qrInputRef}
                  id="hub-qr-input"
                  type="text"
                  value={qrInput}
                  onChange={(e) => {
                    setQrInput(e.target.value);
                    setQrError(null);
                  }}
                  placeholder="Codice QR (es. COG-001)"
                  className="flex-1 rounded-xl bg-black/50 border border-white/20 focus:border-[#e4cc9a] px-3.5 py-2 text-sm text-white placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={qrLoading || !qrInput.trim()}
                  className="rounded-xl bg-[#c9a86a] hover:bg-[#e4cc9a] disabled:opacity-50 text-[#0b0b0c] font-semibold text-xs px-5 py-2.5 transition-colors shrink-0"
                >
                  {qrLoading ? "Apertura porte..." : "Apri Sala Opera"}
                </button>
              </form>

              {qrError && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                  {qrError}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-300">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>Codici rapidi:</span>
                  {["COG-001", "COG-004", "COG-005"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => void handleResolveQrInHub(code)}
                      className="rounded-full bg-white/5 hover:bg-[#c9a86a]/25 border border-white/15 hover:border-[#c9a86a] px-2.5 py-0.5 font-mono text-[#e4cc9a]"
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <Link
                  to={`/qr/${encodeURIComponent(qrInput.trim() || "COG-001")}`}
                  className="text-[#e4cc9a] hover:underline inline-flex items-center gap-1"
                >
                  <span>Vista 2D /qr</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          {!isQrPopoverOpen && hallStage === "qr" && (
            <div className="pointer-events-auto museum-glass rounded-full px-4 py-2 border border-[#e4cc9a]/70 shadow-2xl flex items-center gap-3">
              <QrCode className="w-4 h-4 text-[#e4cc9a]" aria-hidden="true" />
              <span className="text-xs text-[#fff7e0]">
                Totem QR inquadrato — tocca il totem o apri la tastiera QR
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsQrPopoverOpen(true);
                  window.setTimeout(() => qrInputRef.current?.focus(), 60);
                }}
                className="rounded-full bg-[#d4af37] hover:bg-[#f3dfa2] text-[#14110c] text-xs font-semibold px-3 py-1 transition-colors"
              >
                Inserisci QR
              </button>
            </div>
          )}

          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void navigateToZone("room2")}
              className="museum-glass hover:border-[#c9a86a]/70 rounded-full px-4 py-2 text-xs text-white inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e4cc9a]" aria-hidden="true" />
              <span>Sala Territorio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsQrPopoverOpen((prev) => !prev);
                window.setTimeout(() => qrInputRef.current?.focus(), 60);
              }}
              className={`rounded-full text-[#0b0b0c] text-xs font-semibold px-4 py-2 inline-flex items-center gap-1.5 shadow-lg transition-all ${
                hallStage === "qr"
                  ? "bg-[#f3dfa2] ring-2 ring-[#d4af37]"
                  : "bg-[#c9a86a] hover:bg-[#e4cc9a]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {room4Opera
                  ? `Totem QR • Opera Aperta: ${room4Opera.qr_code}`
                  : "Totem QR • Scansiona o Inserisci"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => void navigateToZone("room3")}
              className="museum-glass hover:border-[#c9a86a]/70 rounded-full px-4 py-2 text-xs text-white inline-flex items-center gap-1.5"
            >
              <span>Sala Archivi</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#e4cc9a]" aria-hidden="true" />
            </button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-[#cbb894]/90 drop-shadow">
            Scorri avanti per vedere il Totem QR • Clicca le ali a 45° per entrare
          </p>
        </div>
      )}

      {/* ===================================================================
          SALA TERRITORIO (Panning fluido + Mappa Reale OSM sulla parete finale)
         =================================================================== */}
      {activeZone === "room2" && (
        <>
          <div className="fixed top-20 left-4 right-4 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
            {nearbyData?.fallback_used && nearbyData.fallback_message && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-auto museum-glass rounded-full px-4 py-1.5 text-xs text-[#e4cc9a] border border-[#c9a86a]/45"
              >
                {nearbyData.fallback_message}
              </div>
            )}
            {usingFallbackCoords && (
              <button
                type="button"
                onClick={() => requestTerritoryGeo()}
                className="pointer-events-auto museum-glass hover:border-[#c9a86a]/70 rounded-full px-3.5 py-1.5 text-xs text-white inline-flex items-center gap-1.5"
              >
                <LocateFixed className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                <span>Usa la mia posizione</span>
              </button>
            )}
            {nearbyLoading && (
              <span className="museum-glass rounded-full px-3.5 py-1.5 text-xs text-neutral-200">
                Ricerca opere vicine...
              </span>
            )}
            {nearbyError && (
              <span role="alert" className="museum-glass rounded-full px-3.5 py-1.5 text-xs text-red-300">
                {nearbyError}
              </span>
            )}
          </div>

          {selectedTerritoryOpera && (
            <div className="fixed inset-x-0 bottom-24 z-30 px-4 flex justify-center pointer-events-none">
              <div className="pointer-events-auto museum-glass w-full max-w-md rounded-2xl border border-[#c9a86a]/55 p-4 shadow-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a86a]">
                      {CATEGORY_LABELS[selectedTerritoryOpera.categoria]} •{" "}
                      {selectedTerritoryOpera.distance_km} km
                    </p>
                    <h2 className="font-serif-display text-2xl text-white leading-tight">
                      {selectedTerritoryOpera.titolo}
                    </h2>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      {selectedTerritoryOpera.ente_nome}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTerritoryOpera(null)}
                    aria-label="Chiudi anteprima"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {selectedTerritoryOpera.breve_sintesi}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void navigateToZone("room4", selectedTerritoryOpera.id)}
                    className="flex-1 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    Entra in Sala Opera
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFloorplanModal({
                        open: true,
                        tab: "territory",
                        highlightId: selectedTerritoryOpera.id,
                      })
                    }
                    className="rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                    <span>Mostra su Mappa</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="fixed inset-x-0 bottom-4 z-20 px-4 flex flex-col items-center gap-2.5 pointer-events-none">
            {nearestArtwork && !selectedTerritoryOpera && (
              <div className="pointer-events-auto museum-glass rounded-full pl-4 pr-2 py-1.5 flex items-center gap-3 border border-[#c9a86a]/45 max-w-full shadow-xl">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9a86a] truncate">
                    Inquadrata • {nearestArtwork.distance_km} km
                  </p>
                  <p className="font-serif-display text-base text-white truncate leading-tight">
                    {nearestArtwork.titolo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void navigateToZone("room4", nearestArtwork.id)}
                  className="shrink-0 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-3.5 py-1.5"
                >
                  Entra in Sala Opera
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFloorplanModal({
                      open: true,
                      tab: "territory",
                      highlightId: nearestArtwork.id,
                    })
                  }
                  className="shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5"
                >
                  Mappa
                </button>
              </div>
            )}

            <div className="pointer-events-auto museum-glass rounded-full px-3.5 py-2 flex items-center gap-3 max-w-xl w-full">
              <button
                type="button"
                onClick={() => stepCorridorScroll(-0.1)}
                aria-label="Indietro nella Sala Territorio"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-[#c9a86a] transition-all duration-150"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-center uppercase tracking-[0.16em] text-neutral-300">
                  Scorri avanti fino alla mappa OSM • Scorri su all&apos;inizio per la Hall
                </p>
              </div>
              <button
                type="button"
                onClick={() => stepCorridorScroll(0.1)}
                aria-label="Avanti nella Sala Territorio"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setFloorplanModal({
                    open: true,
                    tab: "territory",
                    highlightId: nearestArtwork?.id ?? null,
                  })
                }
                className="shrink-0 rounded-full bg-[#c9a86a]/20 hover:bg-[#c9a86a]/35 border border-[#c9a86a]/55 px-3 py-1 text-[11px] font-medium text-[#e4cc9a]"
              >
                Mappa Interattiva
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================
          SALA ARCHIVI (Leggio centrale animato, Stele, Grafo Relazionale)
         =================================================================== */}
      {activeZone === "room3" && (
        <>
          <div className="fixed top-20 left-4 right-4 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
            <div className="pointer-events-auto museum-glass rounded-full px-4 py-1.5 text-xs text-neutral-100 flex items-center gap-2 border border-[#c9a86a]/40 shadow-lg">
              <BookOpen className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
              <span>
                {archiveOpera
                  ? `Opera attiva: ${archiveOpera.titolo}`
                  : "Avvicinati al leggio centrale per aprire il libro oppure continua a scorrere"}
              </span>
              {archiveLoading && <span className="text-[#e4cc9a]">(caricamento...)</span>}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-4 z-20 px-4 flex flex-col items-center gap-2.5 pointer-events-none">
            {sala3Stage === "book" && !isBookOpen && (
              <div className="pointer-events-auto museum-glass rounded-2xl border border-[#c9a86a]/60 px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 max-w-xl w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a86a]">
                    Leggio Centrale • Registro Aperto
                  </p>
                  <p className="font-serif-display text-lg text-white leading-snug">
                    Cerca nell&apos;archivio o scopri le opere consigliate
                  </p>
                  <p className="text-[11px] text-neutral-300">
                    Apri la ricerca (puoi anche entrare in Sala Opera) oppure continua a scorrere.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookOpen(true)}
                  className="shrink-0 rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-2 transition-colors"
                >
                  Cerca nell&apos;Archivio
                </button>
              </div>
            )}

            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsBookOpen(true)}
                className="rounded-full bg-[#c9a86a] hover:bg-[#e4cc9a] text-[#0b0b0c] text-xs font-semibold px-4 py-2 inline-flex items-center gap-1.5 shadow-lg"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Libro d&apos;Archivio</span>
              </button>

              {sala3Stage.startsWith("stele-") && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveSteleModal(
                      sala3Stage === "stele-descrizione"
                        ? "descrizione"
                        : sala3Stage === "stele-archivio"
                          ? "archivio"
                          : "narrazione",
                    )
                  }
                  className="museum-glass hover:border-[#c9a86a]/70 rounded-full px-3.5 py-2 text-xs text-white inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                  <span>Leggi Stele Inquadrata</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsRelationalGraphOpen(true)}
                className="museum-glass hover:border-[#c9a86a]/70 rounded-full px-3.5 py-2 text-xs text-[#e4cc9a] inline-flex items-center gap-1.5"
              >
                <Network className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Grafo Relazionale</span>
              </button>
            </div>

            <div className="pointer-events-auto museum-glass rounded-full px-3.5 py-2 flex items-center gap-3 max-w-xl w-full">
              <button
                type="button"
                onClick={() => stepCorridorScroll(-0.14)}
                aria-label="Indietro nella Sala Archivi"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-[#c9a86a] transition-all duration-150"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-center uppercase tracking-[0.16em] text-neutral-300">
                  Sosta sul Libro → Stele → Grafo • Scorri su all&apos;inizio per la Hall
                </p>
              </div>
              <button
                type="button"
                onClick={() => stepCorridorScroll(0.14)}
                aria-label="Avanti nella Sala Archivi"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <ArchiveBookOverlay
            isOpen={isBookOpen}
            selectedOperaId={archiveOpera?.id ?? null}
            onSelectOpera={handleBookSelectOpera}
            onEnterSalaOpera={(item) => void navigateToZone("room4", item.id)}
            onClose={() => setIsBookOpen(false)}
          />

          <ArchivePanel2DModal
            panelKey={activeSteleModal}
            opera={archiveOpera}
            narration={archiveNarration}
            onOpenBook={() => setIsBookOpen(true)}
            onEnterRoom4={(id) => void navigateToZone("room4", id)}
            onClose={() => setActiveSteleModal(null)}
          />

          {isRelationalGraphOpen && (
            <TreasureMapGraph
              sourceOpera={archiveOpera}
              correlazioni={archiveCorrelations}
              loading={archiveLoading}
              onOpenBook={() => setIsBookOpen(true)}
              onSelectNode={(id) => {
                setIsRelationalGraphOpen(false);
                void navigateToZone("room4", id);
              }}
              onClose={() => setIsRelationalGraphOpen(false)}
            />
          )}
        </>
      )}

      {/* ===================================================================
          SALA OPERA (Scroll tra le postazioni, Poltroncina & Scheda Tabbed)
         =================================================================== */}
      {activeZone === "room4" && (
        <>
          <div className="fixed bottom-4 left-4 z-20 flex flex-col gap-2 max-w-[calc(100%-2rem)] lg:max-w-[calc(100%-30rem)]">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "overview" as const, label: "Panoramica", icon: Compass },
                  { id: "artwork" as const, label: "Avvicina Opera", icon: Palette },
                  { id: "author" as const, label: "Autore & Info", icon: BookOpen },
                  { id: "archive" as const, label: "Teca Archivio", icon: Archive },
                  { id: "connections" as const, label: "Connessioni", icon: Network },
                  { id: "armchair" as const, label: "Siediti in Poltrona", icon: Armchair },
                  { id: "audio" as const, label: room4Speech.isSpeaking ? "Ferma Audio" : "Audioguida", icon: Volume2 },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = room4Focus === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFocusSala4(item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 border transition-colors ${
                      active
                        ? "bg-[#c9a86a] text-[#0b0b0c] border-[#e4cc9a]"
                        : "museum-glass text-white border-white/15 hover:border-[#c9a86a]/65"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void navigateToZone("room1")}
                className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-1.5 text-xs text-white inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                <span>Hall Principale</span>
              </button>

              {room4Opera && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setFloorplanModal({
                        open: true,
                        tab: "territory",
                        highlightId: room4Opera.id,
                      })
                    }
                    className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-1.5 text-xs text-white inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
                    <span>Mappa</span>
                  </button>

                  <Link
                    to={`/opera/${room4Opera.id}`}
                    className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-1.5 text-xs text-[#e4cc9a] inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Vista 2D</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => setRoom4DrawerOpen((prev) => !prev)}
                className="museum-glass hover:border-[#c9a86a]/65 rounded-full px-3.5 py-1.5 text-xs text-[#e4cc9a] inline-flex items-center gap-1.5"
              >
                {room4DrawerOpen ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Nascondi Scheda</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Apri Scheda</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scheda laterale pulita e organizzata a schede */}
          {room4DrawerOpen && (
            <aside
              aria-label="Scheda dell'opera nella Sala Opera"
              className="fixed top-20 bottom-24 lg:bottom-4 right-3 sm:right-4 z-20 w-[calc(100%-1.5rem)] sm:w-[420px] lg:w-[445px] museum-glass rounded-2xl border border-[#c9a86a]/40 flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.82)]"
            >
              {room4Loading ? (
                <div className="p-6 text-sm text-neutral-200" aria-busy="true">
                  Allestimento Sala Opera in corso...
                </div>
              ) : room4Error || !room4Opera ? (
                <div className="p-6 space-y-4">
                  <h2 className="font-serif-display text-2xl text-white">
                    Opera non disponibile
                  </h2>
                  <p className="text-sm text-neutral-300">
                    {room4Error ?? "Opera non trovata."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void navigateToZone("room1")}
                    className="rounded-full bg-[#c9a86a] text-[#0b0b0c] text-xs font-semibold px-4 py-2"
                  >
                    Torna alla Hall Principale
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-5 pb-3.5 border-b border-white/10 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#c9a86a]">
                        {CATEGORY_LABELS[room4Opera.categoria]} • {room4Opera.qr_code}
                      </span>
                      <span className="text-[10px] text-neutral-300">
                        Scorri nella sala per esplorare
                      </span>
                    </div>
                    <h1 className="font-serif-display text-2xl sm:text-3xl font-medium text-white leading-tight">
                      {room4Opera.titolo}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-300">
                      {room4Opera.autore} • {room4Opera.anno}
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 overflow-y-auto custom-scroll flex-1">
                    <OperaAnalysisContent
                      opera={room4Opera}
                      onSelectRelated={(rel) => void navigateToZone("room4", rel.id)}
                      compact
                      activeTab={room4Tab}
                      onTabChange={setRoom4Tab}
                    />
                  </div>
                </>
              )}
            </aside>
          )}
        </>
      )}

      {/* Modale Planimetria Reale & Mappa Territoriale Leaflet */}
      <MuseumFloorplanModal
        isOpen={floorplanModal.open}
        initialTab={floorplanModal.tab}
        activeZone={activeZone}
        visitorPos={visitorPos}
        highlightOperaId={floorplanModal.highlightId}
        hasActiveRoom4Opera={Boolean(room4Opera)}
        onSelectZone={(zone) => void navigateToZone(zone)}
        onEnterSala4Opera={(operaId) => void navigateToZone("room4", operaId)}
        onOpen2DOpera={(operaId) => navigate(`/opera/${operaId}`)}
        onClose={() => setFloorplanModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default Hub3DPage;
