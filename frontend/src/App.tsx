import { lazy, Suspense, useCallback } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { TerritoryMapPage } from "./pages/map";
import { OperaDetailPage } from "./pages/opera/[id]";
import { QrResolverPage } from "./pages/qr/[code]";
import type { OperaDetailOut, OperaNearbyOut } from "./types/api";

const Hub3DPage = lazy(() => import("./pages/hub"));

function Hub3DFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Caricamento Hub 3D Cogito"
      className="min-h-screen bg-museum-bg text-museum-ink flex flex-col items-center justify-center p-6 text-center"
    >
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#c9a86a] mb-2">
        Cogito • Beyond the Museum
      </p>
      <h1 className="font-serif-display text-4xl sm:text-5xl text-white mb-3">
        Allestimento Sale 3D…
      </h1>
      <p className="text-sm text-neutral-300 max-w-md">
        Preparazione dell&apos;Atrio di Benvenuto e delle gallerie interattive.
      </p>
    </main>
  );
}

function QrRoute() {
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const handleResolved = useCallback(
    (opera: OperaDetailOut) => {
      navigate(`/opera/${opera.id}`, { replace: true, state: { opera } });
    },
    [navigate],
  );

  const handleBackToMap = useCallback(() => {
    navigate("/map");
  }, [navigate]);

  return (
    <QrResolverPage
      code={code}
      onResolved={handleResolved}
      onBackToMap={handleBackToMap}
    />
  );
}

function OperaRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { opera?: OperaDetailOut } | null;

  const operaId = Number(id);
  const handleBackToMap = useCallback(() => {
    navigate("/map");
  }, [navigate]);

  if (!Number.isInteger(operaId) || operaId <= 0) {
    return (
      <main className="min-h-screen bg-museum-bg flex flex-col items-center justify-center p-6 text-center">
        <h1 className="font-serif-display text-3xl text-white mb-2">
          Opera non trovata
        </h1>
        <p className="text-neutral-300 mb-6">
          L&apos;identificativo richiesto non è valido.
        </p>
        <Link
          to="/map"
          className="px-5 py-2.5 rounded-full bg-[#c9a86a] text-[#0b0b0c] font-semibold text-sm"
        >
          Torna alla mappa
        </Link>
      </main>
    );
  }

  return (
    <OperaDetailPage
      operaId={operaId}
      initialOpera={state?.opera ?? null}
      onBackToMap={handleBackToMap}
    />
  );
}

function MapRoute() {
  const navigate = useNavigate();

  const handleSelectOpera = useCallback(
    (opera: OperaNearbyOut) => {
      navigate(`/opera/${opera.id}`);
    },
    [navigate],
  );

  return <TerritoryMapPage onSelectOpera={handleSelectOpera} />;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<Hub3DFallback />}>
            <Hub3DPage />
          </Suspense>
        }
      />
      <Route path="/map" element={<MapRoute />} />
      <Route path="/qr/:code" element={<QrRoute />} />
      <Route path="/opera/:id" element={<OperaRoute />} />
      <Route
        path="*"
        element={
          <main className="min-h-screen bg-museum-bg flex flex-col items-center justify-center p-6 text-center">
            <h1 className="font-serif-display text-3xl text-white mb-2">
              Pagina non trovata
            </h1>
            <p className="text-neutral-300 mb-6">
              Il percorso richiesto non esiste.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/"
                className="px-5 py-2.5 rounded-full bg-[#c9a86a] text-[#0b0b0c] font-semibold text-sm"
              >
                Vai all&apos;Hub 3D
              </Link>
              <Link
                to="/map"
                className="px-5 py-2.5 rounded-full bg-white/10 text-white border border-white/15 font-medium text-sm"
              >
                Torna alla mappa
              </Link>
            </div>
          </main>
        }
      />
    </Routes>
  );
}

export default App;
