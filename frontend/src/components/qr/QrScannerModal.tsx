import { Html5Qrcode } from "html5-qrcode";
import { ArrowRight, Camera, Keyboard, QrCode, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractQrCodeFromInput } from "../../utils/format";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

type ScanTab = "camera" | "manual";

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const navigate = useNavigate();
  const readerElementId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const cameraTabRef = useRef<HTMLButtonElement | null>(null);
  const manualTabRef = useRef<HTMLButtonElement | null>(null);

  const [tab, setTab] = useState<ScanTab>("camera");
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCameraSafely = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (!instance) return;

    try {
      if (instance.isScanning) {
        await instance.stop();
      }
    } catch {
      // Ignore stop failures during teardown
    }

    try {
      instance.clear();
    } catch {
      // Ignore clear failures
    }
  }, []);

  const navigateWithCode = useCallback(
    async (raw: string) => {
      const code = extractQrCodeFromInput(raw);
      if (!code) {
        setManualError("Inserisci un codice valido (esempio: COG-008).");
        return;
      }
      await stopCameraSafely();
      onClose();
      navigate(`/qr/${encodeURIComponent(code)}`);
    },
    [navigate, onClose, stopCameraSafely],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void stopCameraSafely().then(onClose);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, stopCameraSafely]);

  useEffect(() => {
    if (!open) {
      setManualError(null);
      setCameraError(null);
      setCameraReady(false);
      void stopCameraSafely();
    }
  }, [open, stopCameraSafely]);

  useEffect(() => {
    if (!open || tab !== "camera") {
      void stopCameraSafely();
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setCameraReady(false);

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(readerElementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (cancelled) return;
            cancelled = true;
            void navigateWithCode(decodedText);
          },
          () => {
            // Frame without QR code; continue scanning
          },
        );

        if (!cancelled) {
          setCameraReady(true);
        } else {
          // Stop the local instance directly even if scannerRef was nulled during cancellation
          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {
            // Ignore stop failures on late cleanup
          }
          try {
            scanner.clear();
          } catch {
            // Ignore clear failures
          }
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            "Fotocamera non accessibile su questo dispositivo. Puoi inserire subito il codice manuale.",
          );
          setCameraReady(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void startScanner();
    }, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      void stopCameraSafely();
    };
  }, [open, tab, readerElementId, navigateWithCode, stopCameraSafely]);

  useEffect(() => {
    if (!open) return;
    if (tab === "manual") {
      const t = window.setTimeout(() => manualInputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => closeButtonRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open, tab]);

  if (!open) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    void navigateWithCode(manualCode);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab: ScanTab = tab === "camera" ? "manual" : "camera";
      setTab(nextTab);
      (nextTab === "camera" ? cameraTabRef.current : manualTabRef.current)?.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-xl rounded-3xl bg-panna p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-gold-light pb-5">
          <div className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-gold-deep" aria-hidden="true" />
            <div>
              <h2
                id="qr-modal-title"
                className="font-serif text-3xl font-semibold text-ink"
              >
                Scansiona il codice QR
              </h2>
              <p className="text-base text-ink-secondary">
                Inquadra il cartellino dell’opera o digita il codice identificativo
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => void stopCameraSafely().then(onClose)}
            aria-label="Chiudi finestra QR"
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-gold-light text-ink transition hover:border-gold-deep hover:bg-panna-soft"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Modalità scansione QR"
          className="mt-5 flex gap-3"
        >
          <button
            ref={cameraTabRef}
            id="qr-tab-camera"
            type="button"
            role="tab"
            aria-selected={tab === "camera"}
            aria-controls="qr-panel-camera"
            onKeyDown={handleTabKeyDown}
            onClick={() => setTab("camera")}
            className={`inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition ${
              tab === "camera"
                ? "bg-gold-deep text-panna-card"
                : "border border-gold-light text-ink-secondary hover:text-ink"
            }`}
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span>Fotocamera</span>
          </button>

          <button
            ref={manualTabRef}
            id="qr-tab-manual"
            type="button"
            role="tab"
            aria-selected={tab === "manual"}
            aria-controls="qr-panel-manual"
            onKeyDown={handleTabKeyDown}
            onClick={() => setTab("manual")}
            className={`inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition ${
              tab === "manual"
                ? "bg-gold-deep text-panna-card"
                : "border border-gold-light text-ink-secondary hover:text-ink"
            }`}
          >
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            <span>Inserimento manuale</span>
          </button>
        </div>

        {tab === "camera" && (
          <div
            id="qr-panel-camera"
            role="tabpanel"
            aria-labelledby="qr-tab-camera"
            className="mt-6 space-y-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-gold-light bg-panna-soft">
              <div
                id={readerElementId}
                className="min-h-[260px] w-full [&_video]:rounded-2xl [&_video]:object-cover"
              />

              {!cameraReady && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-panna-soft/90 p-6 text-center">
                  <Camera
                    className="h-9 w-9 animate-pulse text-gold-deep"
                    aria-hidden="true"
                  />
                  <p className="text-lg font-medium text-ink">
                    Attivazione fotocamera in corso…
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="space-y-4 pt-2">
                <p className="text-base text-ink-secondary">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setTab("manual")}
                  className="btn-museum-primary w-full"
                >
                  <Keyboard className="h-5 w-5" aria-hidden="true" />
                  <span>Inserisci codice manualmente</span>
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "manual" && (
          <form
            id="qr-panel-manual"
            role="tabpanel"
            aria-labelledby="qr-tab-manual"
            onSubmit={handleManualSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="modal-manual-qr-input"
                className="block text-base font-semibold text-ink"
              >
                Codice identificativo dell’opera
              </label>
              <input
                ref={manualInputRef}
                id="modal-manual-qr-input"
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  if (manualError) setManualError(null);
                }}
                placeholder="Es. COG-008"
                autoComplete="off"
                autoCapitalize="characters"
                className="mt-2 min-h-[56px] w-full border-b-2 border-gold-deep/60 bg-transparent px-1 text-2xl font-semibold uppercase tracking-wider text-ink placeholder:text-ink-muted/60 focus:border-gold-deep focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep focus-visible:rounded-sm"
              />
              {manualError && (
                <p className="mt-2 text-base font-medium text-[#8A3727]">
                  {manualError}
                </p>
              )}
              <p className="mt-3 text-sm text-ink-muted">
                Codici di esempio: COG-008, COG-017, COG-046, COG-088
              </p>
            </div>

            <button type="submit" className="btn-museum-primary w-full">
              <span>Apri scheda opera</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
