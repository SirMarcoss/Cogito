import * as THREE from "three";
import type {
  CategoriaOpera,
  CorrelazioneItemOut,
  OperaDetailOut,
  OperaNearbyOut,
} from "../../types/api";
import { CATEGORY_LABELS, formatRelationType } from "../../utils/labels";

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Contesto 2D non disponibile");
  }
  return [canvas, ctx];
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      linesDrawn += 1;
      if (linesDrawn >= maxLines) {
        ctx.fillText(`${line.slice(0, Math.max(0, line.length - 1))}…`, x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export function createBrassPlaqueTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 160);
  const bg = ctx.createLinearGradient(0, 0, 512, 160);
  bg.addColorStop(0, "#231d16");
  bg.addColorStop(1, "#15110d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = "#d4b475";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.fillStyle = "#f2dca9";
  ctx.font = '600 24px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(title.slice(0, 34), 24, 62);

  ctx.fillStyle = "#dfd7c9";
  ctx.font = '400 18px "Inter", sans-serif';
  ctx.fillText(subtitle.slice(0, 42), 24, 108);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Grande insegna monumentale "COGITO" posta nel cielo dietro il museo (esterno). */
export function createHeroTitleBackdropTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1600, 460);
  ctx.clearRect(0, 0, 1600, 460);

  const glow = ctx.createRadialGradient(800, 220, 80, 800, 220, 740);
  glow.addColorStop(0, "rgba(255, 248, 232, 0.68)");
  glow.addColorStop(0.55, "rgba(242, 229, 204, 0.3)");
  glow.addColorStop(1, "rgba(242, 229, 204, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1600, 460);

  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(255, 248, 232, 0.85)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#1b140d";
  ctx.font = '700 228px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("C O G I T O", 800, 242);

  ctx.shadowBlur = 8;
  ctx.strokeStyle = "#8a672f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(400, 286);
  ctx.lineTo(655, 286);
  ctx.moveTo(945, 286);
  ctx.lineTo(1200, 286);
  ctx.stroke();

  ctx.fillStyle = "#3c2b16";
  ctx.font = '700 40px "Inter", sans-serif';
  ctx.fillText("BEYOND THE MUSEUM", 800, 346);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Pannello bidimensionale davanti agli ingressi (a ~45°) per orientamento chiaro. */
export function createFloatingPortalSignTexture(options: {
  eyebrow: string;
  title: string;
  subtitle: string;
  arrow: "left" | "right" | "center";
}): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(768, 280);
  ctx.clearRect(0, 0, 768, 280);

  // Pannello vetro scuro museale con cornice dorata arrotondata
  ctx.fillStyle = "rgba(18, 16, 14, 0.88)";
  ctx.beginPath();
  ctx.roundRect(14, 14, 740, 252, 24);
  ctx.fill();

  ctx.strokeStyle = "#d4b475";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(14, 14, 740, 252, 24);
  ctx.stroke();

  ctx.strokeStyle = "rgba(228, 204, 154, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(26, 26, 716, 228, 18);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a86a";
  ctx.font = '600 22px "Inter", sans-serif';
  ctx.fillText(options.eyebrow.toUpperCase(), 384, 76);

  const prefix = options.arrow === "left" ? "←  " : options.arrow === "center" ? "↑  " : "";
  const suffix = options.arrow === "right" ? "  →" : "";
  ctx.fillStyle = "#f9f5ec";
  ctx.font = '700 54px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`${prefix}${options.title}${suffix}`, 384, 150);

  ctx.fillStyle = "#dfd7c7";
  ctx.font = '400 22px "Inter", sans-serif';
  ctx.fillText(options.subtitle, 384, 208);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Segnaletica stile proiettore museale non cliccabile sui pilastri della Hall. */
export function createProjectorSignTexture(options: {
  eyebrow: string;
  title: string;
  arrow: "left" | "right";
}): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(768, 240);
  ctx.clearRect(0, 0, 768, 240);

  const glow = ctx.createRadialGradient(384, 120, 30, 384, 120, 360);
  glow.addColorStop(0, "rgba(212, 175, 55, 0.22)");
  glow.addColorStop(0.65, "rgba(22, 17, 10, 0.82)");
  glow.addColorStop(1, "rgba(18, 14, 9, 0.92)");
  ctx.fillStyle = "rgba(18, 14, 9, 0.88)";
  ctx.beginPath();
  ctx.roundRect(24, 24, 720, 192, 18);
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.roundRect(24, 24, 720, 192, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(212, 175, 55, 0.72)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(36, 36, 696, 168);

  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a86a";
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.fillText(options.eyebrow.toUpperCase(), 384, 84);

  const formatted =
    options.arrow === "left" ? `←  ${options.title}` : `${options.title}  →`;
  ctx.fillStyle = "#f4e5c0";
  ctx.font = '700 40px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(formatted, 384, 146);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Schermo ad alta leggibilità del Totem QR nella Hall Principale. */
export function createQrTotemScreenTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(640, 440);

  ctx.fillStyle = "#161310";
  ctx.fillRect(0, 0, 640, 440);
  ctx.strokeStyle = "#d4b475";
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 14, 612, 412);

  // Matrice QR stilizzata ad alto contrasto a sinistra
  const qrX = 48;
  const qrY = 92;
  const qrSize = 216;
  ctx.fillStyle = "#f7f1e5";
  ctx.fillRect(qrX, qrY, qrSize, qrSize);

  const drawFinder = (fx: number, fy: number) => {
    ctx.fillStyle = "#161310";
    ctx.fillRect(fx, fy, 54, 54);
    ctx.fillStyle = "#f7f1e5";
    ctx.fillRect(fx + 9, fy + 9, 36, 36);
    ctx.fillStyle = "#161310";
    ctx.fillRect(fx + 18, fy + 18, 18, 18);
  };
  drawFinder(qrX + 14, qrY + 14);
  drawFinder(qrX + qrSize - 68, qrY + 14);
  drawFinder(qrX + 14, qrY + qrSize - 68);

  // Moduli QR centrali
  ctx.fillStyle = "#161310";
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if ((r < 3 && c < 3) || (r < 3 && c > 4) || (r > 4 && c < 3)) continue;
      if ((r * 5 + c * 3) % 2 === 0) {
        ctx.fillRect(qrX + 20 + c * 22, qrY + 20 + r * 22, 16, 16);
      }
    }
  }

  // Testo chiaro a destra
  ctx.textAlign = "left";
  ctx.fillStyle = "#c9a86a";
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.fillText("ACCOGLIENZA QR", 296, 118);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 38px "Cormorant Garamond", Georgia, serif';
  wrapText(ctx, "Scansiona o Inserisci Codice QR", 296, 168, 300, 44, 2);

  ctx.fillStyle = "#dfd7c7";
  ctx.font = '400 19px "Inter", sans-serif';
  wrapText(
    ctx,
    "Tocca questo totem per aprire le porte della Sala Opera (es. COG-001).",
    296,
    274,
    300,
    27,
    3,
  );

  ctx.fillStyle = "#e4cc9a";
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.fillText("Clicca per inserire codice →", 296, 378);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPaintingTexture(
  imageUrl: string,
  fallbackTitle: string,
  fallbackCategory: CategoriaOpera,
  aspectRatio = 4 / 3,
): THREE.CanvasTexture {
  const w = 768;
  const h = Math.round(768 / aspectRatio);
  const [canvas, ctx] = makeCanvas(w, h);

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 30, w * 0.5, h * 0.5, w * 0.7);
  bg.addColorStop(0, "#3b2e1f");
  bg.addColorStop(1, "#181410");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(216,184,122,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.fillStyle = "#e4cc9a";
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(CATEGORY_LABELS[fallbackCategory].toUpperCase(), w / 2, h * 0.38);

  ctx.fillStyle = "#f7f3eb";
  ctx.font = '600 36px "Cormorant Garamond", Georgia, serif';
  wrapText(ctx, fallbackTitle, w / 2, h * 0.48, w - 120, 44, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  if (imageUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        ctx.clearRect(0, 0, w, h);
        const imgRatio = img.width / Math.max(1, img.height);
        const targetRatio = w / h;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        tex.needsUpdate = true;
      } catch {
        // Mantiene il fallback procedurale
      }
    };
    img.src = imageUrl;
  }

  return tex;
}

/** Copertina in pelle goffrata oro del Libro d'Archivio chiuso. */
export function createBookLeatherCoverTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 720);
  const bg = ctx.createLinearGradient(0, 0, 512, 720);
  bg.addColorStop(0, "#4b2116");
  bg.addColorStop(1, "#2f130c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 720);

  ctx.strokeStyle = "#d4b475";
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, 460, 668);
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 428, 636);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e4cc9a";
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillText("ARCHIVIO STORICO CIVICO", 256, 195);

  ctx.font = '700 50px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("REGISTRO", 256, 290);
  ctx.fillText("D'ARCHIVIO", 256, 352);

  ctx.strokeStyle = "#d4b475";
  ctx.beginPath();
  ctx.arc(256, 470, 54, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '700 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("COGITO", 256, 478);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Pagine in pergamena antica per il Libro d'Archivio 3D aperto. */
export function createOpenBookPageTexture(
  side: "left" | "right",
  activeOperaTitle: string | null,
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(640, 820);

  const grad =
    side === "left"
      ? ctx.createLinearGradient(0, 0, 640, 0)
      : ctx.createLinearGradient(640, 0, 0, 0);
  grad.addColorStop(0, "#d7c5a3");
  grad.addColorStop(0.84, "#e3d4b6");
  grad.addColorStop(1, "#ad956b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 820);

  ctx.strokeStyle = "#8a672f";
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 584, 764);
  ctx.strokeStyle = "rgba(138,103,47,0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(38, 38, 564, 744);

  ctx.textAlign = "left";
  if (side === "left") {
    ctx.fillStyle = "#6c4f22";
    ctx.font = '700 20px "Inter", sans-serif';
    ctx.fillText("RICERCA NELL'ARCHIVIO", 64, 92);

    ctx.fillStyle = "#24190f";
    ctx.font = '700 44px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("Cerca nei Fondi", 64, 146);

    // Campo ricerca stilizzato
    ctx.fillStyle = "#f7f0e2";
    ctx.fillRect(64, 186, 512, 62);
    ctx.strokeStyle = "#9c7a42";
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 186, 512, 62);
    ctx.fillStyle = "#6a5a49";
    ctx.font = 'italic 23px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("🔍  Cerca titolo, autore, QR (es. Ursino)...", 84, 224);

    ctx.fillStyle = "#33261a";
    ctx.font = '400 24px "Cormorant Garamond", Georgia, serif';
    wrapText(
      ctx,
      "Clicca sul libro aperto per consultare il catalogo archivistico oppure continua a scorrere lungo la Sala Archivi.",
      64,
      305,
      512,
      36,
      4,
    );

    ctx.fillStyle = "#8a2924";
    ctx.font = '700 22px "Inter", sans-serif';
    ctx.fillText("Clicca per aprire la ricerca →", 64, 710);
  } else {
    ctx.fillStyle = "#6c4f22";
    ctx.font = '700 20px "Inter", sans-serif';
    ctx.fillText(
      activeOperaTitle ? "OPERA SELEZIONATA" : "OPERE CONSIGLIATE",
      64,
      92,
    );

    ctx.fillStyle = "#24190f";
    ctx.font = '700 38px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      activeOperaTitle ? activeOperaTitle : "Itinerari di Catania",
      64,
      146,
    );

    if (activeOperaTitle) {
      ctx.fillStyle = "#3b2c1d";
      ctx.font = 'italic 26px "Cormorant Garamond", Georgia, serif';
      wrapText(
        ctx,
        "Le stele lungo la sala e il Grafo Relazionale finale ora mostrano le fonti di questo bene. Puoi anche entrare subito nella Sala Opera.",
        64,
        235,
        512,
        38,
        6,
      );
    } else {
      const recommendations = [
        "1. Castello Ursino — Portale Svevo",
        "2. Pianta della colata del 1669",
        "3. Partitura autografa di Norma",
        "4. Anfiteatro Romano (Stesicoro)",
      ];
      let ry = 232;
      recommendations.forEach((line) => {
        ctx.fillStyle = "#2b1f13";
        ctx.font = '600 26px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(line, 64, ry);
        ry += 64;
      });
    }

    ctx.beginPath();
    ctx.arc(485, 650, 52, 0, Math.PI * 2);
    ctx.fillStyle = "#8a2924";
    ctx.fill();
    ctx.strokeStyle = "#c9a86a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#f4ebd7";
    ctx.textAlign = "center";
    ctx.font = '700 20px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("COGITO", 485, 657);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export interface VerticalSteleRenderOptions {
  badge: string;
  heading: string;
  body: string;
  dimmed?: boolean;
}

/** Stele verticali su pergamena calda anticata (non bianco abbagliante). */
export function createVerticalSteleTexture({
  badge,
  heading,
  body,
  dimmed = false,
}: VerticalSteleRenderOptions): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 850);

  if (dimmed) {
    ctx.fillStyle = "#231f1b";
    ctx.fillRect(0, 0, 512, 850);
    ctx.strokeStyle = "rgba(190,180,165,0.28)";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 476, 814);

    ctx.fillStyle = "#a39a8e";
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText(badge.toUpperCase(), 44, 78);

    ctx.fillStyle = "#cec6ba";
    ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
    const afterHeading = wrapText(ctx, heading, 44, 132, 424, 42, 3);

    ctx.fillStyle = "#9c9489";
    ctx.font = '400 22px "Inter", sans-serif';
    wrapText(ctx, body, 44, afterHeading + 54, 424, 34, 12);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, 850);
    grad.addColorStop(0, "#dcccb0");
    grad.addColorStop(1, "#c7b392");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 850);

    ctx.strokeStyle = "#9c7838";
    ctx.lineWidth = 5;
    ctx.strokeRect(18, 18, 476, 814);
    ctx.strokeStyle = "rgba(156, 120, 56, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 456, 794);

    ctx.fillStyle = "#7a5b28";
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(badge.toUpperCase(), 46, 78);

    ctx.fillStyle = "#1f1811";
    ctx.font = '700 36px "Cormorant Garamond", Georgia, serif';
    const afterHeading = wrapText(ctx, heading, 46, 134, 420, 42, 3);

    ctx.strokeStyle = "rgba(156,120,56,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(46, afterHeading + 12);
    ctx.lineTo(466, afterHeading + 12);
    ctx.stroke();

    ctx.fillStyle = "#2d241b";
    ctx.font = '400 22px "Inter", sans-serif';
    wrapText(ctx, body, 46, afterHeading + 56, 420, 34, 13);

    ctx.fillStyle = "#6c4f22";
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillText("Clicca per aprire la scheda completa →", 46, 792);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const OSM_ZOOM = 15;
const OSM_TILE_X_START = 17755;
const OSM_TILE_Y_START = 12694;
const OSM_COLS = 4;
const OSM_ROWS = 3;

function latLngToTileFloat(lat: number, lng: number): { x: number; y: number } {
  const n = Math.pow(2, OSM_ZOOM);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * Mappa reale della città di Catania sulla tela finale della Sala Territorio:
 * carica la griglia 4x3 di tile OpenStreetMap reali (zoom 15) con fallback topografico.
 */
export function createRealCataniaOSMTileMapTexture(
  items: OperaNearbyOut[],
): THREE.CanvasTexture {
  const w = OSM_COLS * 256; // 1024
  const h = OSM_ROWS * 256; // 768
  const [canvas, ctx] = makeCanvas(w, h);

  const loadedTiles: { img: HTMLImageElement; col: number; row: number }[] = [];

  const redrawMap = () => {
    // Base topografica calda di fallback
    ctx.fillStyle = "#e6dcc8";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#b8ccd6";
    ctx.fillRect(w * 0.72, 0, w * 0.28, h);

    // Disegna le vere tile OpenStreetMap caricate
    for (const tile of loadedTiles) {
      try {
        ctx.drawImage(tile.img, tile.col * 256, tile.row * 256, 256, 256);
      } catch {
        // Ignora tile non disegnabile
      }
    }

    // Patina museale calda sopra le tile per integrarsi nell'atmosfera notturna della sala
    ctx.fillStyle = "rgba(26, 20, 12, 0.24)";
    ctx.fillRect(0, 0, w, h);

    // Cornice interna oro e cartiglio in alto
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = "rgba(22, 19, 16, 0.88)";
    ctx.fillRect(28, 26, 440, 86);
    ctx.strokeStyle = "#d4b475";
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 26, 440, 86);

    ctx.textAlign = "left";
    ctx.fillStyle = "#c9a86a";
    ctx.font = '700 14px "Inter", sans-serif';
    ctx.fillText("SALA TERRITORIO • MAPPA REALE DI CATANIA", 46, 56);

    ctx.fillStyle = "#f9f5ec";
    ctx.font = '700 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("Clicca per esplorare e spostare la mappa", 46, 94);

    // Pin proiettati alle coordinate reali (lat, lng) sulla griglia OSM
    const catColors: Record<CategoriaOpera, string> = {
      opera: "#c9a86a",
      reperto: "#f59e0b",
      documento: "#10b981",
      monumento: "#0ea5e9",
    };

    items.slice(0, 7).forEach((item, idx) => {
      const tf = latLngToTileFloat(item.lat, item.lng);
      const px = Math.max(46, Math.min(w - 180, ((tf.x - OSM_TILE_X_START) / OSM_COLS) * w));
      const py = Math.max(130, Math.min(h - 48, ((tf.y - OSM_TILE_Y_START) / OSM_ROWS) * h));

      ctx.fillStyle = "rgba(18, 16, 14, 0.9)";
      ctx.strokeStyle = catColors[item.categoria];
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = '700 13px "Inter", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(String(idx + 1), px, py + 4.5);

      // Etichetta leggibile accanto al pin
      const labelText = item.titolo.slice(0, 22);
      ctx.font = '600 13px "Inter", sans-serif';
      const tw = ctx.measureText(labelText).width;
      ctx.fillStyle = "rgba(18, 16, 14, 0.85)";
      ctx.fillRect(px + 20, py - 12, tw + 14, 24);
      ctx.fillStyle = "#f7f1e5";
      ctx.textAlign = "left";
      ctx.fillText(labelText, px + 27, py + 4.5);
    });
  };

  redrawMap();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  // Caricamento asincrono delle vere tessere OpenStreetMap di Catania
  for (let row = 0; row < OSM_ROWS; row += 1) {
    for (let col = 0; col < OSM_COLS; col += 1) {
      const tx = OSM_TILE_X_START + col;
      const ty = OSM_TILE_Y_START + row;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loadedTiles.push({ img, col, row });
        redrawMap();
        tex.needsUpdate = true;
      };
      img.src = `https://tile.openstreetmap.org/${OSM_ZOOM}/${tx}/${ty}.png`;
    }
  }

  return tex;
}

/** Grafo Relazionale visivo (poche scritte, miniature circolari e connessioni chiare). */
export function createRelationalGraphWallTexture(
  sourceOpera: OperaDetailOut | null,
  relatedItems: CorrelazioneItemOut[],
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(1200, 740);
  const loadedThumbs = new Map<string, HTMLImageElement>();

  const drawGraph = () => {
    const bg = ctx.createRadialGradient(600, 370, 50, 600, 370, 720);
    bg.addColorStop(0, "#241e18");
    bg.addColorStop(1, "#13100d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 740);

    ctx.strokeStyle = "rgba(212, 180, 117, 0.65)";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 1152, 692);

    ctx.textAlign = "center";
    ctx.fillStyle = "#c9a86a";
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillText("SALA ARCHIVI • RETE CULTURALE", 600, 74);

    ctx.fillStyle = "#f9f5ec";
    ctx.font = '700 44px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("Connessioni Storiche", 600, 122);

    const drawCircleMedallion = (
      cx: number,
      cy: number,
      radius: number,
      imgUrl: string | null,
      ringColor: string,
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#2b2218";
      ctx.fill();
      ctx.clip();

      const img = imgUrl ? loadedThumbs.get(imgUrl) : undefined;
      if (img) {
        try {
          ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
        } catch {
          // fallback solo cerchio
        }
      }
      ctx.restore();

      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    if (sourceOpera) {
      const center = { x: 600, y: 365 };
      const targets = [
        { x: 245, y: 270 },
        { x: 955, y: 270 },
        { x: 600, y: 580 },
      ];

      relatedItems.slice(0, 3).forEach((rel, idx) => {
        const t = targets[idx];
        if (!t) return;

        const ctrlX = (center.x + t.x) / 2;
        const ctrlY = t.y < center.y ? t.y - 60 : (center.y + t.y) / 2;

        // Linea luminosa di connessione
        ctx.strokeStyle = "rgba(228, 204, 154, 0.72)";
        ctx.setLineDash([12, 8]);
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, t.x, t.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge corto (1-2 parole) a metà curva
        const midX = 0.25 * center.x + 0.5 * ctrlX + 0.25 * t.x;
        const midY = 0.25 * center.y + 0.5 * ctrlY + 0.25 * t.y;
        const badgeLabel = formatRelationType(rel.tipo_relazione).slice(0, 18);
        ctx.font = '600 14px "Inter", sans-serif';
        const bw = ctx.measureText(badgeLabel).width + 24;
        ctx.fillStyle = "#181410";
        ctx.fillRect(midX - bw / 2, midY - 14, bw, 28);
        ctx.strokeStyle = "#c9a86a";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(midX - bw / 2, midY - 14, bw, 28);
        ctx.fillStyle = "#e4cc9a";
        ctx.fillText(badgeLabel, midX, midY + 5);

        // Nodo circolare con miniatura dell'opera
        drawCircleMedallion(t.x, t.y, 58, rel.opera.immagine_url, "#c9a86a");

        ctx.fillStyle = "#f9f5ec";
        ctx.font = '600 22px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(rel.opera.titolo.slice(0, 26), t.x, t.y + 84);
      });

      // Nodo centrale con miniatura opera principale
      drawCircleMedallion(center.x, center.y, 78, sourceOpera.immagine_url, "#f2dca9");

      ctx.fillStyle = "#f2dca9";
      ctx.font = '700 25px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(sourceOpera.titolo.slice(0, 30), center.x, center.y + 106);
    } else {
      drawCircleMedallion(600, 355, 74, null, "#c9a86a");
      ctx.fillStyle = "#e4cc9a";
      ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
      ctx.fillText("Seleziona un'opera nel Leggio per visualizzarne i legami", 600, 478);
    }

    ctx.fillStyle = "#c9a86a";
    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillText("Clicca per esplorare il grafo interattivo →", 600, 686);
  };

  drawGraph();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const urlsToLoad: string[] = [];
  if (sourceOpera?.immagine_url) urlsToLoad.push(sourceOpera.immagine_url);
  relatedItems.slice(0, 3).forEach((rel) => {
    if (rel.opera.immagine_url) urlsToLoad.push(rel.opera.immagine_url);
  });

  urlsToLoad.forEach((url) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedThumbs.set(url, img);
      drawGraph();
      tex.needsUpdate = true;
    };
    img.src = url;
  });

  return tex;
}

/** Pannello parete destra di Sala Opera: Autore, Epoca & Informazioni. */
export function createSala4AuthorPanelTexture(opera: OperaDetailOut | null): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(768, 560);
  const grad = ctx.createLinearGradient(0, 0, 0, 560);
  grad.addColorStop(0, "#dcccb0");
  grad.addColorStop(1, "#c7b392");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 560);

  ctx.strokeStyle = "#9c7838";
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 724, 516);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7a5b28";
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText("AUTORE, EPOCA & INFORMAZIONI", 48, 72);

  if (opera) {
    ctx.fillStyle = "#1f1811";
    ctx.font = '700 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(opera.autore, 48, 126);

    ctx.fillStyle = "#6c4f22";
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillText(`${opera.anno} • ${CATEGORY_LABELS[opera.categoria]}`, 48, 168);

    if (opera.sala) {
      ctx.fillStyle = "#4d3f31";
      ctx.font = '400 19px "Inter", sans-serif';
      ctx.fillText(`Collocazione: ${opera.sala}`, 48, 204);
    }

    ctx.strokeStyle = "rgba(156,120,56,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 230);
    ctx.lineTo(720, 230);
    ctx.stroke();

    ctx.fillStyle = "#2b2218";
    ctx.font = '400 24px "Cormorant Garamond", Georgia, serif';
    wrapText(ctx, opera.descrizione_ufficiale, 48, 282, 672, 34, 6);
  }

  ctx.fillStyle = "#6c4f22";
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText("Clicca per approfondire autore e scheda →", 48, 508);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Folio manoscritto nella teca in vetro di Sala Opera. */
export function createSala4ArchiveFolioTexture(opera: OperaDetailOut | null): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 640);
  ctx.fillStyle = "#d9c7a6";
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = "#8a672f";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 472, 600);

  ctx.textAlign = "left";
  if (opera?.documento_archivio) {
    const doc = opera.documento_archivio;
    ctx.fillStyle = "#8a2924";
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.fillText(`SEGNATURA: ${doc.segnatura}`, 42, 72);

    ctx.fillStyle = "#1f1811";
    ctx.font = '700 30px "Cormorant Garamond", Georgia, serif';
    const yAfter = wrapText(ctx, doc.titolo, 42, 120, 428, 36, 3);

    ctx.fillStyle = "#6c4f22";
    ctx.font = '500 16px "Inter", sans-serif';
    wrapText(ctx, `${doc.fondo} (${doc.datazione})`, 42, yAfter + 12, 428, 24, 2);

    ctx.fillStyle = "#2b2218";
    ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
    wrapText(ctx, `"${doc.estratto_verificato}"`, 42, yAfter + 100, 428, 32, 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Pannello parete sinistra di Sala Opera: Ente & Connessioni Territoriali. */
export function createSala4TerritoryPanelTexture(
  opera: OperaDetailOut | null,
  correlazioni: CorrelazioneItemOut[],
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(768, 560);
  const grad = ctx.createLinearGradient(0, 0, 0, 560);
  grad.addColorStop(0, "#dcccb0");
  grad.addColorStop(1, "#c7b392");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 560);

  ctx.strokeStyle = "#9c7838";
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 724, 516);

  ctx.textAlign = "left";
  ctx.fillStyle = "#7a5b28";
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText("ENTE DI CONSERVAZIONE & CONNESSIONI", 48, 72);

  if (opera) {
    ctx.fillStyle = "#1f1811";
    ctx.font = '700 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(opera.ente.nome, 48, 122);

    ctx.fillStyle = "#4d3f31";
    ctx.font = '400 19px "Inter", sans-serif';
    ctx.fillText(`${opera.ente.indirizzo}, ${opera.ente.citta}`, 48, 158);
    if (opera.ente.orari) {
      ctx.fillText(`Orari: ${opera.ente.orari}`, 48, 188);
    }

    ctx.strokeStyle = "rgba(156,120,56,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 214);
    ctx.lineTo(720, 214);
    ctx.stroke();

    ctx.fillStyle = "#6c4f22";
    ctx.font = '700 17px "Inter", sans-serif';
    ctx.fillText("OPERE E LUOGHI CORRELATI:", 48, 250);

    let y = 292;
    correlazioni.slice(0, 3).forEach((rel, idx) => {
      ctx.fillStyle = "#1f1811";
      ctx.font = '700 24px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(`${idx + 1}. ${rel.opera.titolo}`, 48, y);

      ctx.fillStyle = "#524334";
      ctx.font = '400 17px "Inter", sans-serif';
      ctx.fillText(
        `${formatRelationType(rel.tipo_relazione)} — ${rel.opera.ente_nome}`,
        68,
        y + 26,
      );
      y += 66;
    });
  }

  ctx.fillStyle = "#6c4f22";
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.fillText("Clicca per aprire le connessioni →", 48, 508);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
