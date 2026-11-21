import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { QrScannerModal } from "./components/qr/QrScannerModal";
import { useUserLevel } from "./hooks/useUserLevel";
import { MainPage } from "./pages/MainPage";
import { OperaDetailPage } from "./pages/OperaDetailPage";

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

      <QrScannerModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </BrowserRouter>
  );
}

export default App;
