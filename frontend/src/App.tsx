import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { QrScannerModal } from "./components/qr/QrScannerModal";
import { useUserLevel } from "./hooks/useUserLevel";

const MainPage = lazy(() =>
  import("./pages/MainPage").then((m) => ({ default: m.MainPage })),
);
const OperaDetailPage = lazy(() =>
  import("./pages/OperaDetailPage").then((m) => ({
    default: m.OperaDetailPage,
  })),
);

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

export function App() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { level, hasSavedLevel, setLevel } = useUserLevel();

  const openQrScanner = () => setQrModalOpen(true);

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-panna px-6 text-center">
            <p className="font-serif text-3xl text-ink-secondary">
              Caricamento di Cogito…
            </p>
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <MainPage
                onOpenQrScanner={openQrScanner}
                userLevel={level}
                hasSavedLevel={hasSavedLevel}
                onChangeUserLevel={setLevel}
              />
            }
          />
          <Route
            path="/opera/:id"
            element={
              <OperaDetailPage
                onOpenQrScanner={openQrScanner}
                userLevel={level}
                onChangeUserLevel={setLevel}
              />
            }
          />
          <Route
            path="/qr/:code"
            element={
              <OperaDetailPage
                onOpenQrScanner={openQrScanner}
                userLevel={level}
                onChangeUserLevel={setLevel}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <QrScannerModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </BrowserRouter>
  );
}
