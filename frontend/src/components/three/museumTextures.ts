import * as THREE from "three";

export interface PBRTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface AntiTilingOptions {
  macroScale: number;
  dualScale: number;
  macroColorStrength?: number;
  macroRoughnessStrength?: number;
  walkwayWear?: boolean;
}

function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext("2d");
  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d");

  if (srcCtx && outCtx) {
    const src = srcCtx.getImageData(0, 0, w, h).data;
    const dstImg = outCtx.createImageData(w, h);
    const dst = dstImg.data;

    const sampleH = (x: number, y: number): number => {
      const wx = ((x % w) + w) % w;
      const wy = ((y % h) + h) % h;
      return src[(wy * w + wx) * 4] / 255;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl = sampleH(x - 1, y - 1);
        const t = sampleH(x, y - 1);
        const tr = sampleH(x + 1, y - 1);
        const l = sampleH(x - 1, y);
        const r = sampleH(x + 1, y);
        const bl = sampleH(x - 1, y + 1);
        const b = sampleH(x, y + 1);
        const br = sampleH(x + 1, y + 1);

        const dX = tr + 2 * r + br - (tl + 2 * l + bl);
        const dY = bl + 2 * b + br - (tl + 2 * t + tr);

        let nx = -dX * strength;
        let ny = dY * strength;
        let nz = 1.0;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;

        const idx = (y * w + x) * 4;
        dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
        dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        dst[idx + 3] = 255;
      }
    }
    outCtx.putImageData(dstImg, 0, 0);
  }

  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function applyAntiTilingShader(
  material: THREE.MeshStandardMaterial,
  options: AntiTilingOptions,
): void {
  const {
    macroScale,
    dualScale,
    macroColorStrength = 0.09,
    macroRoughnessStrength = 0.14,
    walkwayWear = false,
  } = options;

  const cacheKey = `cogito-antitile-${macroScale}-${dualScale}-${walkwayWear ? 1 : 0}`;
  material.customProgramCacheKey = () => cacheKey;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMacroScale = { value: macroScale };
    shader.uniforms.uDualScale = { value: dualScale };
    shader.uniforms.uMacroColorStrength = { value: macroColorStrength };
    shader.uniforms.uMacroRoughnessStrength = { value: macroRoughnessStrength };
    shader.uniforms.uWalkwayWear = { value: walkwayWear ? 1.0 : 0.0 };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vAntiTileWorldPos;`,
      )
      .replace(
        "#include <project_vertex>",
        `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
vAntiTileWorldPos = ( modelMatrix * mvPosition ).xyz;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vAntiTileWorldPos;
uniform float uMacroScale;
uniform float uDualScale;
uniform float uMacroColorStrength;
uniform float uMacroRoughnessStrength;
uniform float uWalkwayWear;

float cogitoHash21( vec2 p ) {
  p = fract( p * vec2( 123.34, 456.21 ) );
  p += dot( p, p + 45.32 );
  return fract( p.x * p.y );
}

float cogitoValueNoise( vec2 p ) {
  vec2 i = floor( p );
  vec2 f = fract( p );
  f = f * f * ( 3.0 - 2.0 * f );
  float a = cogitoHash21( i );
  float b = cogitoHash21( i + vec2( 1.0, 0.0 ) );
  float c = cogitoHash21( i + vec2( 0.0, 1.0 ) );
  float d = cogitoHash21( i + vec2( 1.0, 1.0 ) );
  return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
}

float cogitoMacroFbm( vec2 p ) {
  float v = 0.0;
  v += 0.65 * cogitoValueNoise( p );
  v += 0.35 * cogitoValueNoise( p * 2.13 + vec2( 17.1, 31.7 ) );
  return v;
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec2 macroCoord = vAntiTileWorldPos.xz * uMacroScale + vec2( vAntiTileWorldPos.y * uMacroScale * 0.72 );
  float macroNoise = cogitoMacroFbm( macroCoord );
  vec4 samplePrimary = texture2D( map, vMapUv );
  vec2 uvRotated = mat2( 0.866025, -0.5, 0.5, 0.866025 ) * ( vMapUv * uDualScale ) + vec2( 0.37, 0.19 );
  vec4 sampleDual = texture2D( map, uvRotated );
  vec4 sampledDiffuseColor = mix( samplePrimary, sampleDual, 0.24 + 0.16 * macroNoise );
  float toneMod = 1.0 + ( macroNoise - 0.5 ) * uMacroColorStrength;
  sampledDiffuseColor.rgb *= vec3( toneMod, toneMod * 0.995, toneMod * 0.985 );
  diffuseColor *= sampledDiffuseColor;
#endif`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  vec2 rMacroCoord = vAntiTileWorldPos.xz * uMacroScale + vec2( vAntiTileWorldPos.y * uMacroScale * 0.72 );
  float rMacro = cogitoMacroFbm( rMacroCoord );
  vec4 rPrimary = texture2D( roughnessMap, vRoughnessMapUv );
  vec2 rUvRot = mat2( 0.866025, -0.5, 0.5, 0.866025 ) * ( vRoughnessMapUv * uDualScale ) + vec2( 0.37, 0.19 );
  vec4 rDual = texture2D( roughnessMap, rUvRot );
  float mixedRough = mix( rPrimary.g, rDual.g, 0.26 + 0.16 * rMacro );
  mixedRough += ( rMacro - 0.5 ) * uMacroRoughnessStrength;
  if ( uWalkwayWear > 0.5 ) {
    float pathMask = smoothstep( 7.5, 1.8, abs( vAntiTileWorldPos.x ) ) * smoothstep( 42.0, 6.0, vAntiTileWorldPos.z );
    mixedRough -= pathMask * 0.16;
  }
  roughnessFactor *= clamp( mixedRough, 0.12, 0.96 );
#endif`,
      );
  };
}

export function createTravertinePBR(
  repeatX = 3,
  repeatY = 2,
): PBRTextureSet {
  const w = 512;
  const h = 512;
  const colorC = document.createElement("canvas");
  const heightC = document.createElement("canvas");
  const roughC = document.createElement("canvas");
  colorC.width = heightC.width = roughC.width = w;
  colorC.height = heightC.height = roughC.height = h;

  const cCtx = colorC.getContext("2d");
  const hCtx = heightC.getContext("2d");
  const rCtx = roughC.getContext("2d");

  if (cCtx && hCtx && rCtx) {
    cCtx.fillStyle = "#EAE0D0";
    cCtx.fillRect(0, 0, w, h);
    hCtx.fillStyle = "#C8C8C8";
    hCtx.fillRect(0, 0, w, h);
    rCtx.fillStyle = "#A2A2A2";
    rCtx.fillRect(0, 0, w, h);

    const rowH = 64;
    for (let row = 0; row < 8; row++) {
      const y = row * rowH;
      const offset = (row % 2) * 64;
      for (let x = -64; x < w; x += 128) {
        const tone = Math.floor((Math.random() - 0.5) * 14);
        cCtx.fillStyle = `rgb(${234 + tone}, ${224 + tone}, ${208 + Math.round(tone * 0.9)})`;
        cCtx.fillRect(x + offset, y, 128, rowH);

        const rVal = 152 + Math.floor((Math.random() - 0.5) * 28);
        rCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${rVal})`;
        rCtx.fillRect(x + offset, y, 128, rowH);
      }
    }

    for (let i = 0; i < 240; i++) {
      const y = Math.random() * h;
      const x = Math.random() * w;
      const len = 30 + Math.random() * 160;
      const thick = 1 + Math.random() * 2.2;
      cCtx.fillStyle =
        i % 3 === 0 ? "rgba(178, 146, 94, 0.14)" : "rgba(130, 114, 92, 0.12)";
      cCtx.fillRect(x, y, len, thick);
      hCtx.fillStyle = "rgba(85, 85, 85, 0.35)";
      hCtx.fillRect(x, y, len, thick);
      rCtx.fillStyle = "rgba(218, 218, 218, 0.4)";
      rCtx.fillRect(x, y, len, thick);
    }

    for (let i = 0; i < 2200; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const ps = 1 + Math.random() * 1.8;
      cCtx.fillStyle =
        i % 2 === 0 ? "rgba(118,100,78,0.06)" : "rgba(248,243,234,0.08)";
      cCtx.fillRect(px, py, ps, ps);
      hCtx.fillStyle = i % 2 === 0 ? "rgba(70,70,70,0.22)" : "rgba(230,230,230,0.18)";
      hCtx.fillRect(px, py, ps, ps);
    }

    cCtx.strokeStyle = "rgba(164, 149, 127, 0.45)";
    cCtx.lineWidth = 2;
    hCtx.strokeStyle = "#353535";
    hCtx.lineWidth = 3.5;
    rCtx.strokeStyle = "#E4E4E4";
    rCtx.lineWidth = 4;

    for (let row = 0; row <= 8; row++) {
      const y = row * rowH;
      [cCtx, hCtx, rCtx].forEach((ctx) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });

      const offset = (row % 2) * 64;
      for (let x = offset; x < w; x += 128) {
        [cCtx, hCtx, rCtx].forEach((ctx) => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        });
      }
    }
  }

  const map = new THREE.CanvasTexture(colorC);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeatX, repeatY);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(heightC, 1.85, repeatX, repeatY);

  return { map, normalMap, roughnessMap };
}

export function createPlazaPBR(): PBRTextureSet {
  const w = 512;
  const h = 512;
  const colorC = document.createElement("canvas");
  const heightC = document.createElement("canvas");
  const roughC = document.createElement("canvas");
  colorC.width = heightC.width = roughC.width = w;
  colorC.height = heightC.height = roughC.height = h;

  const cCtx = colorC.getContext("2d");
  const hCtx = heightC.getContext("2d");
  const rCtx = roughC.getContext("2d");

  if (cCtx && hCtx && rCtx) {
    cCtx.fillStyle = "#E0D4BF";
    cCtx.fillRect(0, 0, w, h);
    hCtx.fillStyle = "#C4C4C4";
    hCtx.fillRect(0, 0, w, h);
    rCtx.fillStyle = "#B8B8B8";
    rCtx.fillRect(0, 0, w, h);

    // Herringbone / staggered Sicilian courtyard stone pavers with subtle warm & slate stone variety
    const tileW = 64;
    const tileH = 48;
    for (let row = 0; row < Math.ceil(h / tileH); row++) {
      const y = row * tileH;
      const offset = (row % 2) * 32;
      for (let x = -32; x < w; x += tileW) {
        const isWarmAccent = (row + Math.floor((x + 32) / tileW)) % 5 === 0;
        const delta = Math.floor((Math.random() - 0.5) * 16);
        cCtx.fillStyle = isWarmAccent
          ? `rgb(${214 + delta}, ${196 + delta}, ${166 + delta})`
          : `rgb(${227 + delta}, ${216 + delta}, ${198 + delta})`;
        cCtx.fillRect(x + offset + 1, y + 1, tileW - 2, tileH - 2);

        const rough = 158 + Math.floor((Math.random() - 0.5) * 44);
        rCtx.fillStyle = `rgb(${rough}, ${rough}, ${rough})`;
        rCtx.fillRect(x + offset + 1, y + 1, tileW - 2, tileH - 2);
      }
    }

    for (let i = 0; i < 2400; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const s = 1 + Math.random() * 2;
      cCtx.fillStyle = i % 2 === 0 ? "rgba(115,98,74,0.06)" : "rgba(245,239,229,0.06)";
      cCtx.fillRect(px, py, s, s);
      rCtx.fillStyle = i % 2 === 0 ? "rgba(95,95,95,0.22)" : "rgba(235,235,235,0.22)";
      rCtx.fillRect(px, py, s, s);
    }

    cCtx.strokeStyle = "rgba(148, 130, 104, 0.52)";
    cCtx.lineWidth = 2;
    hCtx.strokeStyle = "#383838";
    hCtx.lineWidth = 3.5;
    rCtx.strokeStyle = "#EAEAEA";
    rCtx.lineWidth = 4;

    for (let row = 0; row <= Math.ceil(h / tileH); row++) {
      const y = row * tileH;
      [cCtx, hCtx, rCtx].forEach((ctx) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });
      const offset = (row % 2) * 32;
      for (let x = offset; x < w; x += tileW) {
        [cCtx, hCtx, rCtx].forEach((ctx) => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + tileH);
          ctx.stroke();
        });
      }
    }
  }

  const repeat = 16;
  const map = new THREE.CanvasTexture(colorC);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat, repeat);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(heightC, 1.7, repeat, repeat);

  return { map, normalMap, roughnessMap };
}

/** Ornamental travertine & brushed-gold inlaid compass rose medallion for the courtyard plaza */
export function createPiazzaMedallionTexture(): THREE.CanvasTexture {
  const s = 1024;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, s, s);
    const cx = s / 2;
    const cy = s / 2;

    // Outer travertine & warm porphyry inlaid ring
    ctx.fillStyle = "#E6D9C3";
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#A8843E";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 466, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#7D6234";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 412, 0, Math.PI * 2);
    ctx.stroke();

    // Inner warm terracotta-stone mosaic ring
    ctx.fillStyle = "#CDB896";
    ctx.beginPath();
    ctx.arc(cx, cy, 396, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#EFE5D4";
    ctx.beginPath();
    ctx.arc(cx, cy, 326, 0, Math.PI * 2);
    ctx.fill();

    // 16-point classical compass star inlay
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i / 16) * Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? "#856527" : "#C49C4D";
      ctx.beginPath();
      ctx.moveTo(0, -310);
      ctx.lineTo(36, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = i % 2 === 0 ? "#D8C5A2" : "#6B501D";
      ctx.beginPath();
      ctx.moveTo(0, -310);
      ctx.lineTo(-36, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = "#F3EAE0";
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#A8843E";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = "#856527";
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createVeinedMarblePBR(): PBRTextureSet {
  const w = 512;
  const h = 512;
  const colorC = document.createElement("canvas");
  const heightC = document.createElement("canvas");
  const roughC = document.createElement("canvas");
  colorC.width = heightC.width = roughC.width = w;
  colorC.height = heightC.height = roughC.height = h;

  const cCtx = colorC.getContext("2d");
  const hCtx = heightC.getContext("2d");
  const rCtx = roughC.getContext("2d");

  if (cCtx && hCtx && rCtx) {
    hCtx.fillStyle = "#D4D4D4";
    hCtx.fillRect(0, 0, w, h);
    rCtx.fillStyle = "#484848";
    rCtx.fillRect(0, 0, w, h);

    const tile = 64;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        cCtx.fillStyle = (x + y) % 2 === 0 ? "#EFE6D6" : "#DFCEB2";
        cCtx.fillRect(x * tile, y * tile, tile, tile);

        const slabR = (x + y) % 2 === 0 ? 52 : 68;
        rCtx.fillStyle = `rgb(${slabR}, ${slabR}, ${slabR})`;
        rCtx.fillRect(x * tile, y * tile, tile, tile);
      }
    }

    for (let v = 0; v < 30; v++) {
      cCtx.strokeStyle =
        v % 2 === 0 ? "rgba(150, 126, 94, 0.22)" : "rgba(244, 236, 222, 0.28)";
      cCtx.lineWidth = 1.2 + Math.random() * 1.4;
      cCtx.beginPath();
      let sx = Math.random() * w;
      let sy = Math.random() * h;
      cCtx.moveTo(sx, sy);
      for (let step = 0; step < 5; step++) {
        sx += 18 + Math.random() * 26;
        sy += (Math.random() - 0.35) * 32;
        cCtx.lineTo(sx, sy);
      }
      cCtx.stroke();
    }

    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rw = 24 + Math.random() * 70;
      rCtx.fillStyle = "rgba(110, 110, 110, 0.16)";
      rCtx.fillRect(x, y, rw, 8 + Math.random() * 14);
    }

    cCtx.strokeStyle = "rgba(168, 132, 62, 0.34)";
    cCtx.lineWidth = 1.5;
    hCtx.strokeStyle = "#4A4A4A";
    hCtx.lineWidth = 2.5;
    rCtx.strokeStyle = "#C6C6C6";
    rCtx.lineWidth = 3;

    for (let i = 0; i <= w; i += tile) {
      [cCtx, hCtx, rCtx].forEach((ctx) => {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      });
    }
  }

  const map = new THREE.CanvasTexture(colorC);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 4);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 4);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(heightC, 1.35, 3, 4);

  return { map, normalMap, roughnessMap };
}

/** Woven burgundy & antique gold ceremonial museum carpet runner */
export function createCarpetRunnerTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#6B241E";
    ctx.fillRect(0, 0, w, h);

    // Gold woven border stripes along left & right edges
    ctx.fillStyle = "#C89F4F";
    ctx.fillRect(10, 0, 12, h);
    ctx.fillRect(w - 22, 0, 12, h);

    ctx.fillStyle = "#8C3A2B";
    ctx.fillRect(28, 0, 6, h);
    ctx.fillRect(w - 34, 0, 6, h);

    // Repeating diamond weave motif
    ctx.strokeStyle = "rgba(218, 178, 96, 0.35)";
    ctx.lineWidth = 2;
    for (let y = 32; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(w / 2, y - 22);
      ctx.lineTo(w / 2 + 32, y);
      ctx.lineTo(w / 2, y + 22);
      ctx.lineTo(w / 2 - 32, y);
      ctx.closePath();
      ctx.stroke();
    }

    // Subtle fabric texture grain
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = "rgba(30, 10, 8, 0.08)";
      ctx.fillRect(0, y, w, 1);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Enameled cream & gold Roman-numeral clock dial for the pediment central oculus */
export function createClockFaceTexture(): THREE.CanvasTexture {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");

  if (ctx) {
    const cx = s / 2;
    const cy = s / 2;

    const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, 245);
    bg.addColorStop(0, "#FCF7EC");
    bg.addColorStop(0.85, "#EFE4CE");
    bg.addColorStop(1, "#DECBA9");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, 250, 0, Math.PI * 2);
    ctx.fill();

    // Inner & outer brass chapter rings
    ctx.strokeStyle = "#856527";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 232, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#B58D42";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 162, 0, Math.PI * 2);
    ctx.stroke();

    // 60 minute ticks
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
      const isHour = m % 5 === 0;
      const r1 = isHour ? 212 : 220;
      const r2 = 228;
      ctx.strokeStyle = isHour ? "#1E1812" : "#856527";
      ctx.lineWidth = isHour ? 4.5 : 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // Crisp Roman numerals
    const numerals = [
      "XII", "I", "II", "III", "IV", "V",
      "VI", "VII", "VIII", "IX", "X", "XI",
    ];
    ctx.fillStyle = "#1E1812";
    ctx.font = '700 30px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    numerals.forEach((num, idx) => {
      const a = (idx / 12) * Math.PI * 2 - Math.PI / 2;
      const rx = cx + Math.cos(a) * 188;
      const ry = cy + Math.sin(a) * 188;
      ctx.fillText(num, rx, ry);
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, "rgba(26, 20, 14, 0.58)");
    grad.addColorStop(0.5, "rgba(26, 20, 14, 0.24)");
    grad.addColorStop(1, "rgba(26, 20, 14, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createVerticalAoGradientTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0, "rgba(38, 30, 22, 0.34)");
    grad.addColorStop(0.35, "rgba(38, 30, 22, 0.12)");
    grad.addColorStop(1, "rgba(38, 30, 22, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createVolumetricBeamTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d");
  if (ctx) {
    const vGrad = ctx.createLinearGradient(0, 0, 0, 512);
    vGrad.addColorStop(0, "rgba(255, 232, 182, 0.45)");
    vGrad.addColorStop(0.45, "rgba(255, 224, 165, 0.18)");
    vGrad.addColorStop(1, "rgba(255, 224, 165, 0)");
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, 256, 512);

    ctx.globalCompositeOperation = "destination-in";
    const hGrad = ctx.createLinearGradient(0, 0, 256, 0);
    hGrad.addColorStop(0, "rgba(255,255,255,0)");
    hGrad.addColorStop(0.3, "rgba(255,255,255,0.85)");
    hGrad.addColorStop(0.5, "rgba(255,255,255,1)");
    hGrad.addColorStop(0.7, "rgba(255,255,255,0.85)");
    hGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, 256, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createAtmosphericMistTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, w, h);

    const drawPuff = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      peakAlpha: number,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(246, 239, 226, ${peakAlpha})`);
      g.addColorStop(0.42, `rgba(246, 239, 226, ${peakAlpha * 0.68})`);
      g.addColorStop(0.75, `rgba(246, 239, 226, ${peakAlpha * 0.22})`);
      g.addColorStop(1, "rgba(246, 239, 226, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Overlapping soft clouds well inside the 512x256 bounds so alpha = 0 at all edges
    drawPuff(256, 136, 196, 98, 0.72);
    drawPuff(164, 152, 132, 74, 0.56);
    drawPuff(348, 150, 134, 76, 0.56);
    drawPuff(256, 108, 150, 70, 0.42);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createHeroBookCoverPBR(): PBRTextureSet {
  const w = 1024;
  const h = 1360;
  const colorC = document.createElement("canvas");
  const heightC = document.createElement("canvas");
  const roughC = document.createElement("canvas");
  colorC.width = heightC.width = roughC.width = w;
  colorC.height = heightC.height = roughC.height = h;

  const cCtx = colorC.getContext("2d");
  const hCtx = heightC.getContext("2d");
  const rCtx = roughC.getContext("2d");

  if (cCtx && hCtx && rCtx) {
    const grad = cCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#EFE5D2");
    grad.addColorStop(0.5, "#E4D6BD");
    grad.addColorStop(1, "#D6C2A0");
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, w, h);

    hCtx.fillStyle = "#B4B4B4";
    hCtx.fillRect(0, 0, w, h);

    rCtx.fillStyle = "#A8A8A8";
    rCtx.fillRect(0, 0, w, h);

    for (let i = 0; i < 6500; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const s = 1.5 + Math.random() * 1.5;
      cCtx.fillStyle =
        i % 2 === 0 ? "rgba(115,86,48,0.045)" : "rgba(250,244,232,0.055)";
      cCtx.fillRect(px, py, s, s);
      hCtx.fillStyle = i % 2 === 0 ? "rgba(95,95,95,0.2)" : "rgba(215,215,215,0.2)";
      hCtx.fillRect(px, py, s, s);
    }

    cCtx.strokeStyle = "#B89042";
    cCtx.lineWidth = 14;
    cCtx.strokeRect(72, 72, 880, 1216);
    hCtx.strokeStyle = "#404040";
    hCtx.lineWidth = 16;
    hCtx.strokeRect(72, 72, 880, 1216);
    rCtx.strokeStyle = "#3E3E3E";
    rCtx.lineWidth = 16;
    rCtx.strokeRect(72, 72, 880, 1216);

    cCtx.strokeStyle = "#856527";
    cCtx.lineWidth = 5;
    cCtx.strokeRect(104, 104, 816, 1152);
    hCtx.strokeStyle = "#555555";
    hCtx.lineWidth = 6;
    hCtx.strokeRect(104, 104, 816, 1152);
    rCtx.strokeStyle = "#484848";
    rCtx.lineWidth = 6;
    rCtx.strokeRect(104, 104, 816, 1152);

    [cCtx, hCtx, rCtx].forEach((ctx, idx) => {
      ctx.save();
      ctx.translate(512, 430);
      ctx.strokeStyle = idx === 0 ? "#9C7730" : "#3E3E3E";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 74, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-52, -52, 104, 104);
      ctx.restore();
    });

    cCtx.textAlign = "center";
    hCtx.textAlign = "center";
    rCtx.textAlign = "center";

    cCtx.fillStyle = "#856527";
    cCtx.font = "600 32px Inter, Georgia, serif";
    cCtx.fillText("C O G I T O   ·   E D I Z I O N E   M U S E A L E", 512, 235);

    cCtx.fillStyle = "#1E1812";
    hCtx.fillStyle = "#383838";
    rCtx.fillStyle = "#444444";
    [cCtx, hCtx, rCtx].forEach((ctx) => {
      ctx.font = '700 120px "Cormorant Garamond", Georgia, serif';
      ctx.fillText("COGITO", 512, 725);
    });

    cCtx.fillStyle = "#6B501D";
    cCtx.font = 'italic 46px "Cormorant Garamond", Georgia, serif';
    cCtx.fillText("Archivio & Conoscenza", 512, 825);

    cCtx.fillStyle = "#856527";
    cCtx.font = "600 28px Inter, Georgia, serif";
    cCtx.fillText("S F O G L I A   P E R   E N T R A R E", 512, 1070);
  }

  const map = new THREE.CanvasTexture(colorC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 4;

  const normalMap = heightCanvasToNormalTexture(heightC, 2.1, 1, 1);

  return { map, normalMap, roughnessMap };
}

export function createHeroBookPageTexture(isLeft: boolean): THREE.CanvasTexture {
  const w = 768;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#F5EDE0";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(130,108,76,0.03)" : "rgba(252,248,240,0.04)";
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }

    const gutter = isLeft
      ? ctx.createLinearGradient(540, 0, w, 0)
      : ctx.createLinearGradient(0, 0, 228, 0);
    gutter.addColorStop(0, isLeft ? "rgba(245,237,224,0)" : "rgba(120,96,64,0.32)");
    gutter.addColorStop(1, isLeft ? "rgba(120,96,64,0.32)" : "rgba(245,237,224,0)");
    ctx.fillStyle = gutter;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(168, 132, 62, 0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(58, 62, w - 116, h - 124);

    ctx.fillStyle = "#856527";
    ctx.textAlign = "center";
    ctx.font = '600 32px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      isLeft ? "PROLOGUM · ARCHIVIO" : "BENVENUTO IN COGITO",
      w / 2,
      146,
    );

    ctx.strokeStyle = "rgba(168, 132, 62, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(190, 174);
    ctx.lineTo(w - 190, 174);
    ctx.stroke();

    ctx.fillStyle = "#856527";
    ctx.fillRect(108, 226, 86, 86);
    ctx.strokeStyle = "#D4B36A";
    ctx.lineWidth = 3;
    ctx.strokeRect(114, 232, 74, 74);
    ctx.fillStyle = "#F7F0E4";
    ctx.font = '700 62px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(isLeft ? "A" : "C", 151, 289);

    ctx.fillStyle = "rgba(54, 42, 28, 0.34)";
    for (let i = 0; i < 15; i++) {
      const y = 236 + i * 44;
      const sx = i < 2 ? 216 : 108;
      const lw = (i < 2 ? 390 : 500) + Math.sin(i * 1.55) * 48;
      ctx.fillRect(sx, y, lw, 9);
    }

    ctx.fillStyle = "#856527";
    ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(isLeft ? "— I —" : "— II —", w / 2, h - 94);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Generates 6 distinct, bright, recognizable museum artworks with clear subjects
 * (landscapes, Sicily Etna, classical temples, still life, portrait, music) so gallery walls feel alive.
 */
export function createClassicalPaintingTexture(
  variant: number,
): THREE.CanvasTexture {
  const w = 512;
  const h = 640;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const v = variant % 6;

    if (v === 0) {
      // Etna sunset over Castello Ursino & Mediterranean sea
      const sky = ctx.createLinearGradient(0, 0, 0, 390);
      sky.addColorStop(0, "#243B55");
      sky.addColorStop(0.5, "#C77D4B");
      sky.addColorStop(1, "#F4CE85");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#FFF2BF";
      ctx.beginPath();
      ctx.arc(330, 210, 48, 0, Math.PI * 2);
      ctx.fill();

      // Etna volcano silhouette with glowing summit plume
      ctx.fillStyle = "#3E2F3A";
      ctx.beginPath();
      ctx.moveTo(0, 410);
      ctx.lineTo(220, 175);
      ctx.lineTo(265, 175);
      ctx.lineTo(w, 410);
      ctx.closePath();
      ctx.fill();

      // Snow cap
      ctx.fillStyle = "#F5E9D6";
      ctx.beginPath();
      ctx.moveTo(220, 175);
      ctx.lineTo(265, 175);
      ctx.lineTo(295, 225);
      ctx.lineTo(245, 212);
      ctx.lineTo(192, 228);
      ctx.closePath();
      ctx.fill();

      // Sea & Ursino tower silhouette
      ctx.fillStyle = "#1E425E";
      ctx.fillRect(0, 410, w, 230);
      ctx.fillStyle = "#F4C26B";
      for (let ry = 430; ry < 600; ry += 24) {
        ctx.fillRect(280 + Math.sin(ry) * 18, ry, 90 - (ry - 430) * 0.2, 6);
      }
      ctx.fillStyle = "#241D18";
      ctx.fillRect(46, 330, 130, 140);
      ctx.fillRect(36, 305, 36, 165);
      ctx.fillRect(150, 305, 36, 165);
    } else if (v === 1) {
      // Baroque Still Life with Golden Amphora & Sicilian Oranges
      const bg = ctx.createRadialGradient(256, 260, 40, 256, 300, 420);
      bg.addColorStop(0, "#755234");
      bg.addColorStop(1, "#2A1B14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#543828";
      ctx.fillRect(0, 450, w, 190);
      ctx.fillStyle = "#C9A154";
      ctx.fillRect(0, 446, w, 6);

      // Golden Amphora
      ctx.fillStyle = "#D4A449";
      ctx.beginPath();
      ctx.ellipse(270, 355, 74, 102, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(240, 200, 60, 70);
      ctx.fillStyle = "#F6DC94";
      ctx.beginPath();
      ctx.ellipse(246, 340, 20, 62, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Vibrant Sicilian citrus & grapes
      [
        [152, 435, 38, "#E37B2B"],
        [205, 452, 34, "#EE9634"],
        [356, 442, 36, "#D86824"],
      ].forEach(([ox, oy, or, col]) => {
        ctx.fillStyle = col as string;
        ctx.beginPath();
        ctx.arc(ox as number, oy as number, or as number, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#486E3E";
      ctx.beginPath();
      ctx.ellipse(176, 396, 34, 14, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (v === 2) {
      // Renaissance Portrait in Lapis Lazuli Blue & Gold Foil
      ctx.fillStyle = "#1E3A5F";
      ctx.fillRect(0, 0, w, h);

      // Gold halo arch
      ctx.strokeStyle = "#E0B45A";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(256, 235, 130, 0, Math.PI * 2);
      ctx.stroke();

      // Draped crimson mantle & collar
      ctx.fillStyle = "#8C2C26";
      ctx.beginPath();
      ctx.moveTo(85, 640);
      ctx.quadraticCurveTo(130, 385, 256, 370);
      ctx.quadraticCurveTo(382, 385, 427, 640);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#E5B966";
      ctx.beginPath();
      ctx.moveTo(195, 375);
      ctx.lineTo(256, 455);
      ctx.lineTo(317, 375);
      ctx.closePath();
      ctx.fill();

      // Head & classic profile
      ctx.fillStyle = "#ECCBA8";
      ctx.beginPath();
      ctx.ellipse(256, 255, 64, 84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2E1E14";
      ctx.beginPath();
      ctx.arc(256, 224, 68, Math.PI, 0);
      ctx.fill();
    } else if (v === 3) {
      // Classical Greek Temple by Moonlight over Sea
      const night = ctx.createLinearGradient(0, 0, 0, 440);
      night.addColorStop(0, "#1A2C42");
      night.addColorStop(1, "#4C6A82");
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#FFF7DC";
      ctx.beginPath();
      ctx.arc(385, 130, 42, 0, Math.PI * 2);
      ctx.fill();

      // Sea
      ctx.fillStyle = "#213C52";
      ctx.fillRect(0, 460, w, 180);

      // Marble Temple silhouette
      ctx.fillStyle = "#E8DEC9";
      ctx.fillRect(92, 415, 328, 36);
      for (let cx = 114; cx <= 394; cx += 56) {
        ctx.fillRect(cx, 250, 22, 165);
      }
      ctx.fillRect(88, 225, 336, 28);
      ctx.beginPath();
      ctx.moveTo(76, 225);
      ctx.lineTo(256, 145);
      ctx.lineTo(436, 225);
      ctx.closePath();
      ctx.fill();
    } else if (v === 4) {
      // Roman Amphitheatre Arches & Mediterranean Cypresses
      const sky = ctx.createLinearGradient(0, 0, 0, 380);
      sky.addColorStop(0, "#759BB8");
      sky.addColorStop(1, "#F3DFBA");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#9A8258";
      ctx.fillRect(0, 470, w, 170);

      // Terracotta Roman aqueduct / amphitheatre arches
      ctx.fillStyle = "#B87A52";
      ctx.fillRect(50, 240, 412, 230);
      ctx.fillStyle = "#759BB8";
      for (let ax = 86; ax <= 366; ax += 92) {
        ctx.beginPath();
        ctx.arc(ax + 26, 365, 26, Math.PI, 0);
        ctx.lineTo(ax + 52, 470);
        ctx.lineTo(ax, 470);
        ctx.closePath();
        ctx.fill();
      }

      // Cypress silhouettes
      ctx.fillStyle = "#2F4A33";
      [58, 452].forEach((tx) => {
        ctx.beginPath();
        ctx.ellipse(tx, 345, 26, 130, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Homage to Vincenzo Bellini: Classical Violin & Musical Score
      ctx.fillStyle = "#2A3A35";
      ctx.fillRect(0, 0, w, h);

      // Parchment Sheet Music
      ctx.save();
      ctx.translate(290, 310);
      ctx.rotate(0.12);
      ctx.fillStyle = "#F5EAD4";
      ctx.fillRect(-130, -170, 260, 340);
      ctx.strokeStyle = "#856527";
      ctx.lineWidth = 2;
      for (let sy = -120; sy <= 120; sy += 48) {
        for (let line = 0; line < 5; line++) {
          ctx.beginPath();
          ctx.moveTo(-100, sy + line * 6);
          ctx.lineTo(100, sy + line * 6);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Warm Mahogany Violin
      ctx.save();
      ctx.translate(180, 355);
      ctx.rotate(-0.26);
      ctx.fillStyle = "#9C4A22";
      ctx.beginPath();
      ctx.ellipse(0, 56, 68, 74, 0, 0, Math.PI * 2);
      ctx.ellipse(0, -45, 52, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2B180E";
      ctx.fillRect(-10, -210, 20, 145);
      ctx.fillStyle = "#E8C374";
      ctx.fillRect(-2, -200, 4, 310);
      ctx.restore();
    }

    // Fine painted canvas weave overlay
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#1E1812";
    for (let y = 0; y < h; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
