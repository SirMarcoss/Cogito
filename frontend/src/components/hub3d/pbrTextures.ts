import * as THREE from "three";

function hashNoise(x: number, y: number, seed = 1): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed = 1): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hashNoise(ix, iy, seed);
  const b = hashNoise(ix + 1, iy, seed);
  const c = hashNoise(ix, iy + 1, seed);
  const d = hashNoise(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm(x: number, y: number, octaves = 4, seed = 1): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    val += amp * smoothNoise(x * freq, y * freq, seed + i * 13);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  isColor: boolean,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  return tex;
}

export interface SubtleSurfaceSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

/**
 * Pavimento sobrio in pietra calcarea opaca a scacchiera calda (ispirato a cogito.html,
 * a basso contrasto e privo di venature plastiche).
 */
export function createMuseumStoneFloorTexture(
  repeatX = 7,
  repeatY = 7,
): SubtleSurfaceSet {
  const size = 256;
  const cAlb = document.createElement("canvas");
  cAlb.width = cAlb.height = size;
  const ctxA = cAlb.getContext("2d")!;
  const imgA = ctxA.createImageData(size, size);

  const cBump = document.createElement("canvas");
  cBump.width = cBump.height = size;
  const ctxB = cBump.getContext("2d")!;
  const imgB = ctxB.createImageData(size, size);

  const half = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      const tileX = x < half ? 0 : 1;
      const tileY = y < half ? 0 : 1;
      const isDark = (tileX + tileY) % 2 === 1;
      const lx = x % half;
      const ly = y % half;

      const grain = (fbm(x / 18, y / 18, 3, tileX * 7 + tileY * 11) - 0.5) * 12;
      const fine = (hashNoise(x, y, 5) - 0.5) * 5;

      let r = (isDark ? 116 : 132) + grain + fine;
      let g = (isDark ? 102 : 117) + grain * 0.92 + fine;
      let b = (isDark ? 82 : 95) + grain * 0.8 + fine;

      const isGrout = lx < 2 || ly < 2;
      let bumpVal = 132 + grain * 1.4;
      if (isGrout) {
        r *= 0.72;
        g *= 0.7;
        b *= 0.68;
        bumpVal = 72;
      }

      imgA.data[idx] = Math.min(255, Math.max(0, r));
      imgA.data[idx + 1] = Math.min(255, Math.max(0, g));
      imgA.data[idx + 2] = Math.min(255, Math.max(0, b));
      imgA.data[idx + 3] = 255;

      imgB.data[idx] = imgB.data[idx + 1] = imgB.data[idx + 2] = Math.min(
        255,
        Math.max(0, bumpVal),
      );
      imgB.data[idx + 3] = 255;
    }
  }

  ctxA.putImageData(imgA, 0, 0);
  ctxB.putImageData(imgB, 0, 0);

  return {
    map: configureTexture(cAlb, repeatX, repeatY, true),
    bumpMap: configureTexture(cBump, repeatX, repeatY, false),
  };
}

/** Intonaco museale caldo e scuro a grana finissima e naturale (zero cuciture evidenti). */
export function createMattePlasterTexture(
  hexBase = "#9c8d74",
  repeatX = 4,
  repeatY = 2,
  variation = 7,
): SubtleSurfaceSet {
  const size = 256;
  const base = new THREE.Color(hexBase);
  const br = base.r * 255;
  const bg = base.g * 255;
  const bb = base.b * 255;

  const cAlb = document.createElement("canvas");
  cAlb.width = cAlb.height = size;
  const ctxA = cAlb.getContext("2d")!;
  const imgA = ctxA.createImageData(size, size);

  const cBump = document.createElement("canvas");
  cBump.width = cBump.height = size;
  const ctxB = cBump.getContext("2d")!;
  const imgB = ctxB.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      // Campionamento periodico morbido per evitare stacchi ai bordi UV
      const n1 = fbm(x / 42, y / 42, 3, 19);
      const grain = (hashNoise(x, y, 3) - 0.5) * 4.5;
      const delta = (n1 - 0.5) * variation * 2 + grain;

      imgA.data[idx] = Math.min(255, Math.max(0, br + delta));
      imgA.data[idx + 1] = Math.min(255, Math.max(0, bg + delta * 0.95));
      imgA.data[idx + 2] = Math.min(255, Math.max(0, bb + delta * 0.88));
      imgA.data[idx + 3] = 255;

      const bv = Math.min(255, Math.max(0, 128 + (n1 - 0.5) * 26 + grain * 1.1));
      imgB.data[idx] = imgB.data[idx + 1] = imgB.data[idx + 2] = bv;
      imgB.data[idx + 3] = 255;
    }
  }

  ctxA.putImageData(imgA, 0, 0);
  ctxB.putImageData(imgB, 0, 0);

  return {
    map: configureTexture(cAlb, repeatX, repeatY, true),
    bumpMap: configureTexture(cBump, repeatX, repeatY, false),
  };
}

/** Legno noce scuro caldo con venatura omogenea (senza riquadri finti che si tagliano sui bordi). */
export function createDarkWalnutTexture(
  baseHex = "#472f1c",
  grainHex = "#29180c",
  repeatX = 1,
  repeatY = 1,
): SubtleSurfaceSet {
  const size = 256;
  const cAlb = document.createElement("canvas");
  cAlb.width = cAlb.height = size;
  const ctxA = cAlb.getContext("2d")!;

  const cBump = document.createElement("canvas");
  cBump.width = cBump.height = size;
  const ctxB = cBump.getContext("2d")!;

  ctxA.fillStyle = baseHex;
  ctxA.fillRect(0, 0, size, size);
  ctxB.fillStyle = "#808080";
  ctxB.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 2) {
    const wave = Math.sin((x / size) * Math.PI * 4) * 4 + (hashNoise(x, 2, 7) - 0.5) * 4;
    ctxA.strokeStyle = grainHex;
    ctxA.globalAlpha = 0.14 + hashNoise(x, 5, 3) * 0.15;
    ctxA.lineWidth = 1.4;
    ctxA.beginPath();
    ctxA.moveTo(x, 0);
    ctxA.bezierCurveTo(x + wave, size * 0.33, x - wave, size * 0.67, x, size);
    ctxA.stroke();

    ctxB.strokeStyle = "rgba(48,48,48,0.28)";
    ctxB.lineWidth = 1;
    ctxB.beginPath();
    ctxB.moveTo(x, 0);
    ctxB.lineTo(x + wave * 0.25, size);
    ctxB.stroke();
  }
  ctxA.globalAlpha = 1;

  return {
    map: configureTexture(cAlb, repeatX, repeatY, true),
    bumpMap: configureTexture(cBump, repeatX, repeatY, false),
  };
}

/** Copertura esterna in ardesia notturna opaca per tetti eleganti senza effetto plastica. */
export function createSlateRoofTexture(
  repeatX = 8,
  repeatY = 8,
): SubtleSurfaceSet {
  const size = 256;
  const cAlb = document.createElement("canvas");
  cAlb.width = cAlb.height = size;
  const ctxA = cAlb.getContext("2d")!;

  const cBump = document.createElement("canvas");
  cBump.width = cBump.height = size;
  const ctxB = cBump.getContext("2d")!;

  ctxA.fillStyle = "#2b2726";
  ctxA.fillRect(0, 0, size, size);
  ctxB.fillStyle = "#808080";
  ctxB.fillRect(0, 0, size, size);

  const rows = 8;
  const cols = 6;
  const rw = size / cols;
  const rh = size / rows;
  for (let r = 0; r < rows; r += 1) {
    const offset = r % 2 === 1 ? rw * 0.5 : 0;
    for (let c = -1; c <= cols; c += 1) {
      const x = c * rw + offset;
      const y = r * rh;
      const shade = (hashNoise(c + 4, r + 2, 19) - 0.5) * 10;
      const cr = Math.max(0, Math.min(255, 44 + shade));
      const cg = Math.max(0, Math.min(255, 39 + shade));
      const cb = Math.max(0, Math.min(255, 38 + shade));
      ctxA.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctxA.fillRect(x + 1, y + 1, rw - 2, rh - 2);
      ctxA.strokeStyle = "rgba(12,10,10,0.45)";
      ctxA.lineWidth = 1.5;
      ctxA.strokeRect(x, y, rw, rh);

      ctxB.fillStyle = "#8c8c8c";
      ctxB.fillRect(x + 1, y + 1, rw - 2, rh - 2);
      ctxB.strokeStyle = "#454545";
      ctxB.strokeRect(x, y, rw, rh);
    }
  }

  return {
    map: configureTexture(cAlb, repeatX, repeatY, true),
    bumpMap: configureTexture(cBump, repeatX, repeatY, false),
  };
}

/** Cielo notturno profondo con stelle e banchi di nuvole soffuse per l'esterno fluttuante. */
export function createNightCloudySkyTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#05070e");
  grad.addColorStop(0.32, "#0a101d");
  grad.addColorStop(0.62, "#131b2c");
  grad.addColorStop(0.84, "#192031");
  grad.addColorStop(1, "#0b0e17");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stelle discrete nell'emisfero superiore
  for (let i = 0; i < 240; i += 1) {
    const sx = hashNoise(i, 1.3, 41) * w;
    const sy = hashNoise(i, 7.1, 41) * h * 0.62;
    const alpha = 0.25 + hashNoise(i, 3.9, 41) * 0.65;
    const r = hashNoise(i, 9.4, 41) > 0.88 ? 1.6 : 0.9;
    ctx.fillStyle =
      i % 5 === 0
        ? `rgba(255, 236, 196, ${alpha.toFixed(2)})`
        : `rgba(220, 234, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Banchi di nuvole notturne soffuse
  for (let i = 0; i < 38; i += 1) {
    const cx = hashNoise(i, 2.2, 88) * w;
    const cy = h * 0.28 + hashNoise(i, 5.7, 88) * h * 0.56;
    const rx = 90 + hashNoise(i, 8.1, 88) * 140;
    const ry = 22 + hashNoise(i, 4.4, 88) * 34;
    const rg = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
    const cool = i % 2 === 0 ? "44, 58, 86" : "22, 28, 46";
    rg.addColorStop(0, `rgba(${cool}, 0.26)`);
    rg.addColorStop(0.6, `rgba(${cool}, 0.1)`);
    rg.addColorStop(1, `rgba(${cool}, 0)`);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.restore();
    ctx.fillStyle = rg;
    ctx.fillRect(cx - rx, cy - ry * 1.4, rx * 2, ry * 2.8);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sbuffo di nuvola notturna morbida per le coltri nuvolose attorno all'isola del museo. */
export function createCloudPuffTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const lobes = [
    [128, 128, 112, 0.34],
    [82, 136, 76, 0.26],
    [174, 134, 78, 0.26],
    [126, 98, 72, 0.22],
  ];
  lobes.forEach(([x, y, r, a]) => {
    const g = ctx.createRadialGradient(x, y, 6, x, y, r);
    g.addColorStop(0, `rgba(176, 194, 224, ${a})`);
    g.addColorStop(0.45, `rgba(110, 132, 170, ${(a * 0.55).toFixed(3)})`);
    g.addColorStop(1, "rgba(60, 74, 104, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Alone radiale morbido per la Luna. */
export function createMoonHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 14, 128, 128, 128);
  g.addColorStop(0, "rgba(244, 248, 255, 0.92)");
  g.addColorStop(0.28, "rgba(210, 226, 255, 0.42)");
  g.addColorStop(0.62, "rgba(148, 176, 230, 0.12)");
  g.addColorStop(1, "rgba(120, 148, 210, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Fascio di luce volumetrico sfumato (usabile sia per il raggio della Luna
 * che per i raggi interni delle finestre).
 */
export function createLightBeamTexture(colorRgb = "255, 232, 188"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 512);

  const vert = ctx.createLinearGradient(0, 0, 0, 512);
  vert.addColorStop(0, `rgba(${colorRgb}, 0.62)`);
  vert.addColorStop(0.42, `rgba(${colorRgb}, 0.25)`);
  vert.addColorStop(1, `rgba(${colorRgb}, 0)`);
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, 256, 512);

  ctx.globalCompositeOperation = "destination-in";
  const horiz = ctx.createLinearGradient(0, 0, 256, 0);
  horiz.addColorStop(0, "rgba(0,0,0,0)");
  horiz.addColorStop(0.3, "rgba(0,0,0,1)");
  horiz.addColorStop(0.7, "rgba(0,0,0,1)");
  horiz.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, 256, 512);
  ctx.globalCompositeOperation = "source-over";

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Particella sferica morbida per l'effetto polvere fluttuante nei raggi di luce. */
export function createDustMoteTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 31);
  g.addColorStop(0, "rgba(255, 255, 255, 1)");
  g.addColorStop(0.28, "rgba(255, 248, 228, 0.72)");
  g.addColorStop(0.65, "rgba(255, 232, 186, 0.18)");
  g.addColorStop(1, "rgba(255, 224, 160, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Trama tela di lino per bump map dei dipinti incorniciati. */
export function createCanvasWeaveBump(): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(x, 0, 1, size);
  }
  return configureTexture(c, 4, 4, false);
}

/** Environment map PMREM scuro e caldo per riflessi ricchi senza effetto plastica. */
export function createMuseumEnvironment(renderer: THREE.WebGLRenderer): {
  texture: THREE.Texture;
  dispose: () => void;
} {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x1b1611);

  const warmStripMat = new THREE.MeshBasicMaterial({ color: 0x8c7046 });
  for (let i = -1; i <= 1; i += 1) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), warmStripMat);
    strip.position.set(i * 5, 6, 0);
    strip.rotation.x = Math.PI / 2;
    envScene.add(strip);
  }

  const moodyWallMat = new THREE.MeshBasicMaterial({
    color: 0x261f18,
    side: THREE.BackSide,
  });
  const moodyRoom = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), moodyWallMat);
  envScene.add(moodyRoom);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  warmStripMat.dispose();
  moodyWallMat.dispose();
  moodyRoom.geometry.dispose();

  return {
    texture: rt.texture,
    dispose: () => {
      rt.dispose();
    },
  };
}
