import * as THREE from "three";
import {
  applyAntiTilingShader,
  createAtmosphericMistTexture,
  createCarpetRunnerTexture,
  createClassicalPaintingTexture,
  createClockFaceTexture,
  createContactShadowTexture,
  createHeroBookCoverPBR,
  createHeroBookPageTexture,
  createPiazzaMedallionTexture,
  createPlazaPBR,
  createTravertinePBR,
  createVeinedMarblePBR,
  createVolumetricBeamTexture,
  type PBRTextureSet,
} from "./museumTextures";

export interface MuseumRenderStats {
  triangles: number;
  drawCalls: number;
  geometries: number;
  textures: number;
  isLowPowerDevice: boolean;
}

export interface MuseumBuildProgress {
  progress: number;
  label: string;
}

export interface MuseumBuildOptions {
  onProgress?: (state: MuseumBuildProgress) => void;
  signal?: AbortSignal;
}

export class MuseumBuildAbortedError extends Error {
  constructor() {
    super("Museum 3D build aborted");
    this.name = "MuseumBuildAbortedError";
  }
}

function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const fallbackTimer = window.setTimeout(finish, 120);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.clearTimeout(fallbackTimer);
        finish();
      }, 0);
    });
  });
}

export interface NeoclassicalMuseumHandle {
  update: (
    progress: number,
    pointerX: number,
    pointerY: number,
    elapsed: number,
  ) => void;
  resize: () => void;
  dispose: () => void;
  getStats: () => MuseumRenderStats;
}

function detectLowPowerDevice(): boolean {
  if (typeof window === "undefined") return false;
  const smallViewport = window.innerWidth < 768;
  const lowCores =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;
  return smallViewport || lowCores;
}

function createEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 512;
  envCanvas.height = 256;
  const ctx = envCanvas.getContext("2d");

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#CAD6E3");
    grad.addColorStop(0.26, "#ECE6DA");
    grad.addColorStop(0.48, "#FFF7E6");
    grad.addColorStop(0.62, "#E1CEA9");
    grad.addColorStop(1, "#B89D76");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    const sunGrad = ctx.createRadialGradient(355, 68, 4, 355, 68, 95);
    sunGrad.addColorStop(0, "rgba(255, 252, 240, 1)");
    sunGrad.addColorStop(0.3, "rgba(255, 238, 196, 0.85)");
    sunGrad.addColorStop(1, "rgba(255, 236, 188, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 512, 256);
  }

  const equirect = new THREE.CanvasTexture(envCanvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromEquirectangular(equirect);
  equirect.dispose();
  pmrem.dispose();
  return rt.texture;
}

function createBeveledBoxGeometry(
  w: number,
  h: number,
  d: number,
  bevel = 0.032,
): THREE.BufferGeometry {
  const bw = Math.max(0.05, w - bevel * 2);
  const bh = Math.max(0.05, h - bevel * 2);
  const bd = Math.max(0.05, d - bevel * 2);

  const shape = new THREE.Shape();
  shape.moveTo(-bw / 2, -bh / 2);
  shape.lineTo(bw / 2, -bh / 2);
  shape.lineTo(bw / 2, bh / 2);
  shape.lineTo(-bw / 2, bh / 2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: bd,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

function createArchedPageGeometry(
  width: number,
  height: number,
  side: "left" | "right",
  archAmp = 0.045,
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 18, 4);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const u = THREE.MathUtils.clamp(
      side === "right" ? (x + width / 2) / width : (width / 2 - x) / width,
      0,
      1,
    );
    const archY = Math.sin(Math.pow(u, 0.75) * Math.PI) * archAmp;
    pos.setY(i, archY);
  }
  geo.computeVertexNormals();
  return geo;
}

function createDynamicArchedPageGeometry(
  width: number,
  height: number,
  side: "left" | "right",
  initialArchAmp = 0.045,
): { geo: THREE.BufferGeometry; setArchAmp: (amp: number) => void } {
  const geo = createArchedPageGeometry(width, height, side, 1);
  const pos = geo.attributes.position;
  const unitArch = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    unitArch[i] = pos.getY(i);
  }
  let lastAmp = Number.NaN;

  const setArchAmp = (amp: number) => {
    if (Math.abs(amp - lastAmp) < 1e-4) return;
    lastAmp = amp;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, unitArch[i] * amp);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  setArchAmp(initialArchAmp);
  return { geo, setArchAmp };
}

/** Creates a flat silk bookmark ribbon staying strictly at y=0 across the page before draping beyond edgeClearZ. */
function createPiecewiseSilkRibbonGeometry(opts: {
  startZ: number;
  edgeClearZ: number;
  tipZ: number;
  dropY: number;
  width: number;
  pageSegments?: number;
  tailSegments?: number;
}): THREE.BufferGeometry {
  const {
    startZ,
    edgeClearZ,
    tipZ,
    dropY,
    width,
    pageSegments = 14,
    tailSegments = 10,
  } = opts;
  const halfW = width / 2;
  const tailLen = Math.max(0.01, tipZ - edgeClearZ);
  const notchT = Math.min(0.8 / tailSegments, (width * 0.48) / tailLen);

  const sampleTail = (t: number): { y: number; z: number } => ({
    y: -dropY * (0.5 - 0.5 * Math.cos(Math.PI * t)),
    z: edgeClearZ + tailLen * t,
  });

  const rows: Array<{
    edgeY: number;
    edgeZ: number;
    centerY: number;
    centerZ: number;
  }> = [];

  for (let i = 0; i <= pageSegments; i++) {
    const t = i / pageSegments;
    const z = startZ + (edgeClearZ - startZ) * t;
    rows.push({ edgeY: 0, edgeZ: z, centerY: 0, centerZ: z });
  }

  for (let i = 1; i <= tailSegments; i++) {
    const t = i / tailSegments;
    const edgePt = sampleTail(t);
    const centerPt = i === tailSegments ? sampleTail(1 - notchT) : edgePt;
    rows.push({
      edgeY: edgePt.y,
      edgeZ: edgePt.z,
      centerY: centerPt.y,
      centerZ: centerPt.z,
    });
  }

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    positions.push(
      -halfW,
      r.edgeY,
      r.edgeZ,
      0,
      r.centerY,
      r.centerZ,
      halfW,
      r.edgeY,
      r.edgeZ,
    );

    if (i < rows.length - 1) {
      const r0 = i * 3;
      const r1 = (i + 1) * 3;
      indices.push(r0, r1, r1 + 1, r0, r1 + 1, r0 + 1);
      indices.push(r0 + 1, r1 + 1, r1 + 2, r0 + 1, r1 + 2, r0 + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Applies warm atmospheric haze behind the museum so distant simplified landmarks blend softly. */
function applyBackgroundDepthFog(
  material: THREE.MeshStandardMaterial,
  minStrength = 0.46,
  maxStrength = 0.8,
): void {
  material.customProgramCacheKey = () =>
    `cogito-bg-fog-${minStrength.toFixed(2)}-${maxStrength.toFixed(2)}`;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBgMinFog = { value: minStrength };
    shader.uniforms.uBgMaxFog = { value: maxStrength };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBgWorldPos;`,
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
vBgWorldPos = ( modelMatrix * mvPosition ).xyz;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBgWorldPos;
uniform float uBgMinFog;
uniform float uBgMaxFog;`,
      )
      .replace(
        "#include <fog_fragment>",
        `#include <fog_fragment>
float bgDepthT = smoothstep( -5.5, -26.0, vBgWorldPos.z );
float bgGroundMist = 0.16 * ( 1.0 - smoothstep( 0.0, 7.5, vBgWorldPos.y ) );
float bgMist = clamp( mix( uBgMinFog, uBgMaxFog, bgDepthT ) + bgGroundMist, 0.0, 0.90 );
gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( 0.965, 0.937, 0.886 ), bgMist );`,
      );
  };
}

function disableShadowsOnBackground(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      obj.castShadow = false;
    }
  });
}

function createClassicalUrn(
  stoneMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const base = new THREE.Mesh(
    createBeveledBoxGeometry(1.18, 0.72, 1.18, 0.03),
    stoneMat,
  );
  base.position.y = 0.36;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.32, 0.06),
    new THREE.Vector2(0.18, 0.25),
    new THREE.Vector2(0.46, 0.72),
    new THREE.Vector2(0.42, 0.98),
    new THREE.Vector2(0.52, 1.12),
    new THREE.Vector2(0.44, 1.15),
  ];
  const urn = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), stoneMat);
  urn.position.y = 0.72;
  urn.castShadow = true;
  group.add(urn);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.035, 8, 22),
    goldMat,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.84;
  group.add(rim);

  return group;
}

/** Helper creating an engaged or free-standing classical column for exterior ruins & monuments. */
function createExteriorClassicalColumn(
  height: number,
  radius: number,
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
): THREE.Group {
  const col = new THREE.Group();
  const baseH = 0.28;
  const capH = 0.34;
  const shaftH = Math.max(0.5, height - baseH - capH);

  const plinth = new THREE.Mesh(
    createBeveledBoxGeometry(radius * 2.8, baseH, radius * 2.8, 0.02),
    limestoneTrimMat,
  );
  plinth.position.y = baseH / 2;
  plinth.castShadow = true;
  col.add(plinth);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.86, radius, shaftH, 16),
    stoneMat,
  );
  shaft.position.y = baseH + shaftH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  col.add(shaft);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.9, 0.028, 8, 18),
    goldMat,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = baseH + shaftH;
  col.add(collar);

  const capital = new THREE.Mesh(
    createBeveledBoxGeometry(radius * 2.65, capH, radius * 2.65, 0.02),
    limestoneTrimMat,
  );
  capital.position.y = baseH + shaftH + capH / 2;
  capital.castShadow = true;
  col.add(capital);

  return col;
}

/** Right-side Roman triple-fornix Triumphal Arch. */
function createTriumphalArchStructure(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(9.8, 4.0),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const plinthH = 0.48;
  const plinth = new THREE.Mesh(
    createBeveledBoxGeometry(8.0, plinthH, 2.2, 0.03),
    limestoneTrimMat,
  );
  plinth.position.y = plinthH / 2;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const archW = 7.4;
  const archH = 5.8;
  const shape = new THREE.Shape();
  shape.moveTo(-archW / 2, 0);
  shape.lineTo(archW / 2, 0);
  shape.lineTo(archW / 2, archH);
  shape.lineTo(-archW / 2, archH);
  shape.closePath();

  const addArchCutout = (cx: number, halfW: number, straightH: number) => {
    const hole = new THREE.Path();
    hole.moveTo(cx - halfW, 0);
    hole.lineTo(cx - halfW, straightH);
    hole.absarc(cx, straightH, halfW, Math.PI, 0, true);
    hole.lineTo(cx + halfW, 0);
    hole.closePath();
    shape.holes.push(hole);
  };

  addArchCutout(0, 1.15, 2.45);
  addArchCutout(-2.45, 0.6, 1.65);
  addArchCutout(2.45, 0.6, 1.65);

  const archGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.65,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 22,
  });
  const archBody = new THREE.Mesh(archGeo, stoneMat);
  archBody.position.set(0, plinthH, -0.825);
  archBody.castShadow = true;
  archBody.receiveShadow = true;
  group.add(archBody);

  // 4 front + 4 rear engaged columns framing the three arches
  [-3.32, -1.48, 1.48, 3.32].forEach((cx) => {
    [-0.92, 0.92].forEach((cz) => {
      const col = createExteriorClassicalColumn(
        5.35,
        0.2,
        stoneMat,
        limestoneTrimMat,
        goldMat,
      );
      col.position.set(cx, plinthH, cz);
      group.add(col);
    });
  });

  // Molded keystones over central and lateral fornices
  const keystoneSpecs: Array<[number, number, number]> = [
    [0, plinthH + 2.45 + 1.15 + 0.08, 0.42],
    [-2.45, plinthH + 1.65 + 0.6 + 0.06, 0.3],
    [2.45, plinthH + 1.65 + 0.6 + 0.06, 0.3],
  ];
  keystoneSpecs.forEach(([kx, ky, kh]) => {
    const keystone = new THREE.Mesh(
      createBeveledBoxGeometry(0.28, kh, 1.8, 0.02),
      limestoneTrimMat,
    );
    keystone.position.set(kx, ky, 0);
    group.add(keystone);
  });

  // Bold cornice, golden frieze band, and sculpted attic with medallion
  const cornice = new THREE.Mesh(
    createBeveledBoxGeometry(8.1, 0.38, 2.15, 0.025),
    limestoneTrimMat,
  );
  cornice.position.y = plinthH + archH + 0.19;
  cornice.castShadow = true;
  group.add(cornice);

  const goldFrieze = new THREE.Mesh(
    new THREE.BoxGeometry(7.9, 0.09, 2.02),
    goldMat,
  );
  goldFrieze.position.y = plinthH + archH - 0.04;
  group.add(goldFrieze);

  const attic = new THREE.Mesh(
    createBeveledBoxGeometry(6.2, 1.15, 1.55, 0.025),
    stoneMat,
  );
  attic.position.y = plinthH + archH + 0.38 + 0.575;
  attic.castShadow = true;
  group.add(attic);

  const inscriptionTablet = new THREE.Mesh(
    createBeveledBoxGeometry(2.8, 0.68, 1.64, 0.02),
    limestoneTrimMat,
  );
  inscriptionTablet.position.y = plinthH + archH + 0.96;
  group.add(inscriptionTablet);

  const laurelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.045, 10, 28),
    goldMat,
  );
  laurelRing.position.set(0, plinthH + archH + 0.96, 0.85);
  group.add(laurelRing);

  return group;
}

/** Right-side curved concave Exedra architectural recess ("rientranza"). */
function createCurvedExedraRecess(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 6.2),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.015, -1.6);
  group.add(shadow);

  const createArcExtrude = (
    innerR: number,
    outerR: number,
    height: number,
    startA = 0.12 * Math.PI,
    endA = 0.88 * Math.PI,
  ): THREE.BufferGeometry => {
    const arcShape = new THREE.Shape();
    arcShape.moveTo(outerR * Math.cos(startA), outerR * Math.sin(startA));
    arcShape.absarc(0, 0, outerR, startA, endA, false);
    arcShape.lineTo(innerR * Math.cos(endA), innerR * Math.sin(endA));
    arcShape.absarc(0, 0, innerR, endA, startA, true);
    arcShape.closePath();

    const geo = new THREE.ExtrudeGeometry(arcShape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
      curveSegments: 28,
    });
    // Rotate -90deg around X so +Y curve goes into -Z (opening toward +Z) and extrusion goes UP (+Y)
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  const baseArc = new THREE.Mesh(
    createArcExtrude(2.72, 3.78, 0.34, 0.1 * Math.PI, 0.9 * Math.PI),
    limestoneTrimMat,
  );
  baseArc.castShadow = true;
  baseArc.receiveShadow = true;
  group.add(baseArc);

  const wallArc = new THREE.Mesh(
    createArcExtrude(2.95, 3.55, 4.3, 0.12 * Math.PI, 0.88 * Math.PI),
    stoneMat,
  );
  wallArc.position.y = 0.34;
  wallArc.castShadow = true;
  wallArc.receiveShadow = true;
  group.add(wallArc);

  const goldArc = new THREE.Mesh(
    createArcExtrude(2.86, 3.68, 0.09, 0.11 * Math.PI, 0.89 * Math.PI),
    goldMat,
  );
  goldArc.position.y = 4.64;
  group.add(goldArc);

  const corniceArc = new THREE.Mesh(
    createArcExtrude(2.75, 3.78, 0.32, 0.1 * Math.PI, 0.9 * Math.PI),
    limestoneTrimMat,
  );
  corniceArc.position.y = 4.73;
  corniceArc.castShadow = true;
  group.add(corniceArc);

  // 4 engaged columns along the concave inner wall
  [0.24 * Math.PI, 0.42 * Math.PI, 0.58 * Math.PI, 0.76 * Math.PI].forEach(
    (ang) => {
      const r = 2.82;
      const col = createExteriorClassicalColumn(
        4.25,
        0.18,
        stoneMat,
        limestoneTrimMat,
        goldMat,
      );
      col.position.set(r * Math.cos(ang), 0.34, -r * Math.sin(ang));
      group.add(col);
    },
  );

  // Classical stone pedestal & golden amphora centered inside the alcove
  const ped = new THREE.Mesh(
    createBeveledBoxGeometry(0.88, 1.05, 0.88, 0.025),
    limestoneTrimMat,
  );
  ped.position.set(0, 0.525, -1.25);
  ped.castShadow = true;
  group.add(ped);

  const vasePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.19, 0.04),
    new THREE.Vector2(0.12, 0.17),
    new THREE.Vector2(0.3, 0.5),
    new THREE.Vector2(0.28, 0.76),
    new THREE.Vector2(0.12, 0.96),
    new THREE.Vector2(0.21, 1.08),
  ];
  const amphora = new THREE.Mesh(new THREE.LatheGeometry(vasePts, 20), goldMat);
  amphora.position.set(0, 1.05, -1.25);
  amphora.castShadow = true;
  group.add(amphora);

  return group;
}

/** Right-side distant classical portico colonnade fragment. */
function createDistantColonnadeFragment(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.2),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const stylobate = new THREE.Mesh(
    createBeveledBoxGeometry(5.8, 0.48, 2.0, 0.03),
    limestoneTrimMat,
  );
  stylobate.position.y = 0.24;
  stylobate.castShadow = true;
  stylobate.receiveShadow = true;
  group.add(stylobate);

  [-2.1, -0.7, 0.7, 2.1].forEach((cx) => {
    const col = createExteriorClassicalColumn(
      4.8,
      0.22,
      stoneMat,
      limestoneTrimMat,
      goldMat,
    );
    col.position.set(cx, 0.48, 0);
    group.add(col);
  });

  const architrave = new THREE.Mesh(
    createBeveledBoxGeometry(5.95, 0.5, 1.4, 0.025),
    stoneMat,
  );
  architrave.position.y = 0.48 + 4.8 + 0.25;
  architrave.castShadow = true;
  group.add(architrave);

  const goldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.08, 1.46),
    goldMat,
  );
  goldTrim.position.y = 0.48 + 4.8 + 0.52;
  group.add(goldTrim);

  const cornice = new THREE.Mesh(
    createBeveledBoxGeometry(6.2, 0.28, 1.68, 0.02),
    limestoneTrimMat,
  );
  cornice.position.y = 0.48 + 4.8 + 0.7;
  cornice.castShadow = true;
  group.add(cornice);

  return group;
}

/** Left-side miniature Roman Colosseum / Anfiteatro Romano with stepped iconic outer attic. */
function createMiniColosseumStructure(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
  darkInteriorMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const rx = 4.6;
  const rz = 3.8;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(11.4, 9.6),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Stepped elliptical podium
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(rx + 0.42, rx + 0.52, 0.46, 38),
    limestoneTrimMat,
  );
  podium.scale.set(1, 1, rz / rx);
  podium.position.y = 0.23;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group.add(podium);

  // Dark inner arena core so the radial arcade bays read deep & crisp
  const innerCore = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 4.42, 32),
    darkInteriorMat,
  );
  innerCore.scale.set(rx - 0.55, 1, rz - 0.55);
  innerCore.position.y = 0.46 + 4.42 / 2;
  group.add(innerCore);

  // Elliptical stone cornices & gold stringcourse rings separating Tier 1 and Tier 2
  const addEllipticalBand = (
    y: number,
    height: number,
    radialOffset: number,
    mat: THREE.Material,
  ) => {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(
        rx + radialOffset,
        rx + radialOffset,
        height,
        38,
      ),
      mat,
    );
    ring.scale.set(1, 1, (rz + radialOffset) / (rx + radialOffset));
    ring.position.y = y;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  };

  addEllipticalBand(2.74, 0.22, 0.08, limestoneTrimMat);
  addEllipticalBand(2.87, 0.06, 0.12, goldMat);
  addEllipticalBand(5.04, 0.24, 0.1, limestoneTrimMat);
  addEllipticalBand(5.18, 0.07, 0.14, goldMat);

  // 18 radial arcade bays around Tier 1 & Tier 2, plus partial stepped Tier 3 outer attic
  const numBays = 18;
  const dummy = new THREE.Object3D();

  const pierGeo = createBeveledBoxGeometry(0.46, 2.08, 0.56, 0.015);
  const lintelGeo = createBeveledBoxGeometry(0.42, 0.46, 1.38, 0.015);
  const pierMatrices: THREE.Matrix4[] = [];
  const lintelMatrices: THREE.Matrix4[] = [];

  for (let i = 0; i < numBays; i++) {
    const theta = (i / numBays) * Math.PI * 2;
    const x = rx * Math.cos(theta);
    const z = rz * Math.sin(theta);
    const tx = -rx * Math.sin(theta);
    const tz = rz * Math.cos(theta);
    const rotY = Math.atan2(tx, tz);

    // Tier 1 pier & arch header
    dummy.position.set(x, 0.46 + 1.04, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pierMatrices.push(dummy.matrix.clone());

    const midTheta = ((i + 0.5) / numBays) * Math.PI * 2;
    const mx = rx * Math.cos(midTheta);
    const mz = rz * Math.sin(midTheta);
    const mRotY = Math.atan2(-rx * Math.sin(midTheta), rz * Math.cos(midTheta));
    dummy.position.set(mx, 0.46 + 1.88, mz);
    dummy.rotation.set(0, mRotY, 0);
    dummy.updateMatrix();
    lintelMatrices.push(dummy.matrix.clone());

    // Tier 2 pier & arch header
    dummy.position.set(x, 2.9 + 0.98, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(0.95, 0.92, 0.95);
    dummy.updateMatrix();
    pierMatrices.push(dummy.matrix.clone());

    dummy.position.set(mx, 2.9 + 1.78, mz);
    dummy.rotation.set(0, mRotY, 0);
    dummy.scale.set(0.95, 0.92, 0.95);
    dummy.updateMatrix();
    lintelMatrices.push(dummy.matrix.clone());
  }

  const piersInstanced = new THREE.InstancedMesh(
    pierGeo,
    stoneMat,
    pierMatrices.length,
  );
  piersInstanced.castShadow = true;
  piersInstanced.receiveShadow = true;
  piersInstanced.frustumCulled = false;
  pierMatrices.forEach((m, idx) => piersInstanced.setMatrixAt(idx, m));
  piersInstanced.instanceMatrix.needsUpdate = true;
  group.add(piersInstanced);

  const lintelsInstanced = new THREE.InstancedMesh(
    lintelGeo,
    limestoneTrimMat,
    lintelMatrices.length,
  );
  lintelsInstanced.castShadow = true;
  lintelsInstanced.frustumCulled = false;
  lintelMatrices.forEach((m, idx) => lintelsInstanced.setMatrixAt(idx, m));
  lintelsInstanced.instanceMatrix.needsUpdate = true;
  group.add(lintelsInstanced);

  // Iconic partial Tier 3 outer attic wall around the outer-left/rear arc
  const atticGeo = createBeveledBoxGeometry(0.44, 1.38, 1.48, 0.02);
  const atticCapGeo = createBeveledBoxGeometry(0.56, 0.22, 1.54, 0.02);
  const atticPanels: Array<{ x: number; z: number; rotY: number }> = [];
  for (let i = 0; i < numBays; i++) {
    const midTheta = ((i + 0.5) / numBays) * Math.PI * 2;
    if (Math.sin(midTheta) <= 0.28 || Math.cos(midTheta) < -0.15) {
      atticPanels.push({
        x: rx * Math.cos(midTheta),
        z: rz * Math.sin(midTheta),
        rotY: Math.atan2(-rx * Math.sin(midTheta), rz * Math.cos(midTheta)),
      });
    }
  }

  const atticInstanced = new THREE.InstancedMesh(
    atticGeo,
    stoneMat,
    atticPanels.length,
  );
  atticInstanced.castShadow = true;
  atticInstanced.frustumCulled = false;

  const atticCapInstanced = new THREE.InstancedMesh(
    atticCapGeo,
    limestoneTrimMat,
    atticPanels.length,
  );
  atticCapInstanced.castShadow = true;
  atticCapInstanced.frustumCulled = false;

  atticPanels.forEach((p, idx) => {
    dummy.position.set(p.x, 5.21 + 0.69, p.z);
    dummy.rotation.set(0, p.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    atticInstanced.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(p.x, 5.21 + 1.46, p.z);
    dummy.updateMatrix();
    atticCapInstanced.setMatrixAt(idx, dummy.matrix);
  });
  atticInstanced.instanceMatrix.needsUpdate = true;
  atticCapInstanced.instanceMatrix.needsUpdate = true;
  group.add(atticInstanced);
  group.add(atticCapInstanced);

  return group;
}

/** Left-side U-shaped classical architectural recess ("rientranza") with blind niche & columns. */
function createRectangularRecessStructure(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 4.0),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const baseH = 0.36;
  const base = new THREE.Mesh(
    createBeveledBoxGeometry(5.4, baseH, 2.8, 0.025),
    limestoneTrimMat,
  );
  base.position.y = baseH / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const wallH = 4.05;
  const backWall = new THREE.Mesh(
    createBeveledBoxGeometry(5.0, wallH, 0.58, 0.025),
    stoneMat,
  );
  backWall.position.set(0, baseH + wallH / 2, -1.05);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // Two forward-projecting wing walls framing the recessed bay
  [-2.16, 2.16].forEach((wx) => {
    const sideWall = new THREE.Mesh(
      createBeveledBoxGeometry(0.68, wallH, 2.35, 0.025),
      stoneMat,
    );
    sideWall.position.set(wx, baseH + wallH / 2, -0.05);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    group.add(sideWall);
  });

  // Framing columns in front of the recess
  [-1.44, 1.44].forEach((cx) => {
    const col = createExteriorClassicalColumn(
      wallH - 0.1,
      0.19,
      stoneMat,
      limestoneTrimMat,
      goldMat,
    );
    col.position.set(cx, baseH, 0.92);
    group.add(col);
  });

  // Molded cornice & golden frieze across back and wings
  const topGold = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.08, 2.55),
    goldMat,
  );
  topGold.position.set(0, baseH + wallH + 0.04, -0.05);
  group.add(topGold);

  const topCornice = new THREE.Mesh(
    createBeveledBoxGeometry(5.45, 0.3, 2.72, 0.02),
    limestoneTrimMat,
  );
  topCornice.position.set(0, baseH + wallH + 0.22, -0.05);
  topCornice.castShadow = true;
  group.add(topCornice);

  // Golden relief medallion on the recessed rear wall & classical pedestal
  const backRelief = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.045, 10, 28),
    goldMat,
  );
  backRelief.position.set(0, baseH + 2.75, -0.74);
  group.add(backRelief);

  const innerUrn = createClassicalUrn(limestoneTrimMat, goldMat, contactShadowMat);
  innerUrn.scale.setScalar(0.86);
  innerUrn.position.set(0, baseH, -0.08);
  group.add(innerUrn);

  return group;
}

/** Left-side distant circular classical pavilion (Tholos). */
function createClassicalTholosStructure(
  stoneMat: THREE.Material,
  limestoneTrimMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.8, 6.8),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const step1 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.72, 0.26, 28),
    limestoneTrimMat,
  );
  step1.position.y = 0.13;
  step1.receiveShadow = true;
  group.add(step1);

  const step2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.45, 0.24, 28),
    stoneMat,
  );
  step2.position.y = 0.38;
  step2.castShadow = true;
  group.add(step2);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    const col = createExteriorClassicalColumn(
      4.0,
      0.18,
      stoneMat,
      limestoneTrimMat,
      goldMat,
    );
    col.position.set(Math.cos(a) * 1.95, 0.5, Math.sin(a) * 1.95);
    group.add(col);
  }

  const ringEntablature = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.3, 0.48, 28),
    limestoneTrimMat,
  );
  ringEntablature.position.y = 0.5 + 4.0 + 0.24;
  ringEntablature.castShadow = true;
  group.add(ringEntablature);

  const goldBand = new THREE.Mesh(
    new THREE.TorusGeometry(2.33, 0.042, 8, 32),
    goldMat,
  );
  goldBand.rotation.x = Math.PI / 2;
  goldBand.position.y = 0.5 + 4.0 + 0.44;
  group.add(goldBand);

  const tholosDome = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    stoneMat,
  );
  tholosDome.scale.y = 0.62;
  tholosDome.position.y = 0.5 + 4.0 + 0.48;
  tholosDome.castShadow = true;
  group.add(tholosDome);

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 12), goldMat);
  finial.position.y = 0.5 + 4.0 + 0.48 + 2.15 * 0.62 + 0.22;
  group.add(finial);

  return group;
}

function createBlendedMountainTerrain(): THREE.Mesh {
  const width = 250;
  const depth = 76;
  const segX = 96;
  const segZ = 24;
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  // Palette colors that seamlessly match the courtyard stone ground at y = 0
  const baseGroundColor = new THREE.Color("#E1D5C0");
  const midSlopeColor = new THREE.Color("#D8CCB8");
  const peakMistColor = new THREE.Color("#EAE3D6");
  const tmpColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const localZ = pos.getZ(i); // ranges -depth/2 (back) to +depth/2 (front)
    // v = 0 at front edge (+depth/2), v = 1 at far horizon (-depth/2)
    const v = THREE.MathUtils.clamp((depth / 2 - localZ) / depth, 0, 1);

    // Flat underground apron along the very front (v < 0.14) blends seamlessly under the plaza plane
    const frontRamp = Math.pow(THREE.MathUtils.clamp((v - 0.12) / 0.88, 0, 1), 1.6);
    const sideEnvelope = 0.42 + 0.58 * Math.min(1, Math.pow(Math.abs(x) / 36, 1.35));

    const ridge =
      6.8 +
      4.2 * Math.sin(x * 0.042 + 0.65) * Math.cos(localZ * 0.032) +
      2.6 * Math.cos(x * 0.092 - 0.4) +
      1.35 * Math.sin(x * 0.17 + localZ * 0.065);

    const y = v < 0.12 ? -0.06 : -0.06 + frontRamp * sideEnvelope * Math.max(0, ridge);
    pos.setY(i, y);

    const hNorm = THREE.MathUtils.clamp(y / 13.5, 0, 1);
    if (hNorm < 0.45) {
      tmpColor.lerpColors(baseGroundColor, midSlopeColor, hNorm / 0.45);
    } else {
      tmpColor.lerpColors(midSlopeColor, peakMistColor, (hNorm - 0.45) / 0.55);
    }
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.01,
    envMapIntensity: 0.3,
  });
  applyBackgroundDepthFog(mat, 0.5, 0.86);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -54);
  mesh.receiveShadow = true;
  return mesh;
}

function createMuseumTreasurePedestal(
  type: "amphora" | "bust" | "obelisk",
  marbleMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
  yawOffset = 0,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  const base = new THREE.Mesh(
    createBeveledBoxGeometry(0.95, 0.18, 0.95, 0.02),
    marbleMat,
  );
  base.position.y = 0.09;
  group.add(base);

  const column = new THREE.Mesh(
    createBeveledBoxGeometry(0.72, 1.35, 0.72, 0.025),
    marbleMat,
  );
  column.position.y = 0.85;
  group.add(column);

  const cap = new THREE.Mesh(
    createBeveledBoxGeometry(0.92, 0.14, 0.92, 0.02),
    marbleMat,
  );
  cap.position.y = 1.58;
  group.add(cap);

  const goldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.05, 0.78),
    goldMat,
  );
  goldTrim.position.y = 1.49;
  group.add(goldTrim);

  const artifact = new THREE.Group();
  artifact.rotation.y = yawOffset;

  if (type === "amphora") {
    const pts = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.22, 0.04),
      new THREE.Vector2(0.14, 0.18),
      new THREE.Vector2(0.36, 0.58),
      new THREE.Vector2(0.34, 0.88),
      new THREE.Vector2(0.14, 1.12),
      new THREE.Vector2(0.24, 1.28),
      new THREE.Vector2(0.18, 1.32),
    ];
    const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), goldMat);
    vase.position.y = 1.65;
    artifact.add(vase);
  } else if (type === "bust") {
    const socle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.18, 18),
      goldMat,
    );
    socle.position.y = 1.74;
    artifact.add(socle);

    const shoulders = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 18, 14),
      marbleMat,
    );
    shoulders.scale.set(1.15, 0.72, 0.65);
    shoulders.position.y = 2.08;
    artifact.add(shoulders);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 16),
      marbleMat,
    );
    head.scale.set(0.88, 1.12, 0.95);
    head.position.y = 2.52;
    artifact.add(head);
  } else {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.24, 1.25, 4),
      goldMat,
    );
    shaft.position.y = 2.28;
    shaft.rotation.y = Math.PI / 4;
    artifact.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.155, 0.26, 4), goldMat);
    tip.position.y = 3.03;
    tip.rotation.y = Math.PI / 4;
    artifact.add(tip);
  }

  group.add(artifact);
  return group;
}

/** Transparent museum glass display case (teca) containing a lit golden/marble relic */
function createMuseumDisplayCase(
  relicType: "amphora" | "bust" | "obelisk",
  marbleMat: THREE.Material,
  goldMat: THREE.Material,
  glassMat: THREE.Material,
  velvetMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 1.75),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  group.add(shadow);

  const plinth = new THREE.Mesh(
    createBeveledBoxGeometry(1.1, 1.15, 1.1, 0.025),
    marbleMat,
  );
  plinth.position.y = 0.575;
  plinth.castShadow = true;
  group.add(plinth);

  const velvetPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.06, 0.88),
    velvetMat,
  );
  velvetPad.position.y = 1.18;
  group.add(velvetPad);

  // Artifact inside teca
  if (relicType === "amphora") {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.16, 0.04),
      new THREE.Vector2(0.11, 0.14),
      new THREE.Vector2(0.26, 0.42),
      new THREE.Vector2(0.24, 0.64),
      new THREE.Vector2(0.1, 0.8),
      new THREE.Vector2(0.17, 0.92),
    ];
    const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), goldMat);
    vase.position.y = 1.21;
    group.add(vase);
  } else if (relicType === "bust") {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), marbleMat);
    head.scale.set(0.85, 1.15, 0.95);
    head.position.y = 1.68;
    const chest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 0.34, 14),
      marbleMat,
    );
    chest.position.y = 1.38;
    group.add(chest, head);
  } else {
    const ob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.19, 0.88, 4),
      goldMat,
    );
    ob.position.y = 1.65;
    ob.rotation.y = Math.PI / 4;
    group.add(ob);
  }

  // Glass vitrine enclosure + brass corner framing
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.22, 0.96),
    glassMat,
  );
  vitrine.position.y = 1.78;
  group.add(vitrine);

  const capTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.05, 1.0),
    goldMat,
  );
  capTrim.position.y = 2.4;
  group.add(capTrim);

  return group;
}

function createMuseumBench(
  velvetMat: THREE.Material,
  bronzeMat: THREE.Material,
  goldMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.7),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  group.add(shadow);

  const seat = new THREE.Mesh(
    createBeveledBoxGeometry(0.86, 0.22, 2.25, 0.04),
    velvetMat,
  );
  seat.position.y = 0.56;
  seat.castShadow = true;
  group.add(seat);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.04, 2.28),
    goldMat,
  );
  trim.position.y = 0.44;
  group.add(trim);

  [-0.32, 0.32].forEach((lx) => {
    [-0.92, 0.92].forEach((lz) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.032, 0.44, 10),
        bronzeMat,
      );
      leg.position.set(lx, 0.22, lz);
      group.add(leg);
    });
  });

  return group;
}

function createFramedPaintingWithLabel(
  width: number,
  height: number,
  paintingTex: THREE.Texture,
  goldMat: THREE.Material,
  labelMat: THREE.Material,
  beamMat: THREE.Material,
  bronzeMat: THREE.Material,
  lanternGlowMat?: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    createBeveledBoxGeometry(width + 0.26, height + 0.26, 0.14, 0.025),
    goldMat,
  );
  group.add(frame);

  // Subtle self-illumination via emissiveMap so museum artworks are vivid & readable even in darker gallery light
  const canvasMat = new THREE.MeshStandardMaterial({
    map: paintingTex,
    emissive: "#FFF2DA",
    emissiveMap: paintingTex,
    emissiveIntensity: 0.28,
    roughness: 0.4,
    metalness: 0.02,
  });

  const canvasMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    canvasMat,
  );
  canvasMesh.position.z = 0.074;
  group.add(canvasMesh);

  // Brass picture-light bar above frame + warm glowing bulb strip underneath
  const lightBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, width * 0.56, 10),
    goldMat,
  );
  lightBar.rotation.z = Math.PI / 2;
  lightBar.position.set(0, height / 2 + 0.28, 0.22);
  group.add(lightBar);

  if (lanternGlowMat) {
    const bulbStrip = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.48, 0.018, 0.022),
      lanternGlowMat,
    );
    bulbStrip.position.set(0, height / 2 + 0.255, 0.215);
    group.add(bulbStrip);
  }

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.24),
    bronzeMat,
  );
  arm.position.set(0, height / 2 + 0.24, 0.1);
  group.add(arm);

  // Museum wall label plaque
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.25, 0.025),
    labelMat,
  );
  label.position.set(width / 2 + 0.38, -height / 2 + 0.25, 0.01);
  group.add(label);

  // Soft overhead gallery spot cone
  const spotCone = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 1.15, height * 1.4),
    beamMat,
  );
  spotCone.position.set(0, 0.2, 0.16);
  group.add(spotCone);

  return group;
}

function createPorticoLantern(
  bronzeMat: THREE.Material,
  lanternGlowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 0.45),
    bronzeMat,
  );
  group.add(bracket);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.44, 8),
    lanternGlowMat,
  );
  glass.position.set(0, -0.22, 0.2);
  group.add(glass);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.22, 8), bronzeMat);
  cap.position.set(0, 0.08, 0.2);
  group.add(cap);
  return group;
}

export async function buildNeoclassicalMuseum(
  canvas: HTMLCanvasElement,
  options: MuseumBuildOptions = {},
): Promise<NeoclassicalMuseumHandle> {
  const { onProgress, signal } = options;
  const isLowPowerDevice = detectLowPowerDevice();

  const scene = new THREE.Scene();
  const trackedTextures: THREE.Texture[] = [];
  let renderer: THREE.WebGLRenderer | null = null;
  let disposed = false;

  const trackTex = <T extends THREE.Texture>(tex: T): T => {
    trackedTextures.push(tex);
    return tex;
  };

  const trackPBR = (set: PBRTextureSet): PBRTextureSet => {
    trackedTextures.push(set.map, set.normalMap, set.roughnessMap);
    return set;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const tex of trackedTextures) {
      tex.dispose();
    }
    trackedTextures.length = 0;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    renderer?.dispose();
  };

  const reportStep = async (progress: number, label: string) => {
    if (signal?.aborted) {
      dispose();
      throw new MuseumBuildAbortedError();
    }
    onProgress?.({ progress, label });
    await yieldToPaint();
    if (signal?.aborted) {
      dispose();
      throw new MuseumBuildAbortedError();
    }
  };

  try {
    await reportStep(6, "Inizializzazione scena 3D…");

    const activeRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer = activeRenderer;
    activeRenderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isLowPowerDevice ? 1.5 : 2),
    );
    const w0 = canvas.clientWidth || window.innerWidth;
    const h0 = canvas.clientHeight || window.innerHeight;
    activeRenderer.setSize(w0, h0, false);
    activeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    activeRenderer.shadowMap.enabled = true;
    activeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    activeRenderer.toneMapping = THREE.AgXToneMapping;
    activeRenderer.toneMappingExposure = 1.07;

    const extFogColor = new THREE.Color("#F6EFE2");
    const intFogColor = new THREE.Color("#261F17");
    const sceneFog = new THREE.FogExp2("#F6EFE2", 0.0092);
    scene.fog = sceneFog;

    const envTexture = trackTex(createEnvironmentMap(activeRenderer));
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(42, w0 / Math.max(1, h0), 0.1, 180);
    // Slightly higher & farther initial vantage so all letters of background COGITO—especially G & I—read crystal-clear!
    const startPos = new THREE.Vector3(0, 10.2, 34.0);
    const startLook = new THREE.Vector3(0, 9.6, -1.0);
    camera.position.copy(startPos);
    camera.lookAt(startLook);

    // =========================================================================
    // LIGHTING RIG
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight("#FFFDF8", "#C8B088", 1.15);
    scene.add(hemiLight);

    const sunShadowSize = isLowPowerDevice ? 1024 : 2048;
    const sunLight = new THREE.DirectionalLight("#FFF0D2", 2.45);
    sunLight.position.set(20, 31, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(sunShadowSize, sunShadowSize);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 115;
    sunLight.shadow.camera.left = -48;
    sunLight.shadow.camera.right = 48;
    sunLight.shadow.camera.top = 34;
    sunLight.shadow.camera.bottom = -28;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.normalBias = 0.035;
    scene.add(sunLight);

    const skyFillLight = new THREE.DirectionalLight("#DCE6F5", 0.58);
    skyFillLight.position.set(-22, 16, 15);
    scene.add(skyFillLight);

    // Darker, moody entrance hall lit by focused golden spotlight & warm gallery column sconces
    const atriumLight = new THREE.PointLight("#FFB866", 1.0, 22, 2.0);
    atriumLight.position.set(0, 6.8, -6.2);
    scene.add(atriumLight);

    const coolSkylightFill = new THREE.PointLight("#D6E5F7", 0.65, 13, 1.8);
    coolSkylightFill.position.set(0, 8.2, -6.6);
    scene.add(coolSkylightFill);

    const bookSpotLight = new THREE.SpotLight(
      "#FFD890",
      26,
      18,
      Math.PI / 7.5,
      0.68,
      1.3,
    );
    bookSpotLight.position.set(0, 8.0, -5.1);
    bookSpotLight.target.position.set(0, 3.2, -6.6);
    scene.add(bookSpotLight);
    scene.add(bookSpotLight.target);

    // Warm amber accent pools at front & rear marble column sconces + vitrine display cases
    const atriumLeftAccent = new THREE.PointLight("#FFB250", 3.5, 10, 2.0);
    atriumLeftAccent.position.set(-4.0, 4.7, -4.6);
    scene.add(atriumLeftAccent);

    const atriumRightAccent = new THREE.PointLight("#FFB250", 3.5, 10, 2.0);
    atriumRightAccent.position.set(4.0, 4.7, -4.6);
    scene.add(atriumRightAccent);

    const atriumRearLeftAccent = new THREE.PointLight("#FFB250", 3.5, 10, 2.0);
    atriumRearLeftAccent.position.set(-4.0, 4.7, -11.4);
    scene.add(atriumRearLeftAccent);

    const atriumRearRightAccent = new THREE.PointLight("#FFB250", 3.5, 10, 2.0);
    atriumRearRightAccent.position.set(4.0, 4.7, -11.4);
    scene.add(atriumRearRightAccent);

    const rearSpotLight = new THREE.SpotLight(
      "#FFDCA0",
      14,
      18,
      Math.PI / 5.8,
      0.72,
      1.2,
    );
    rearSpotLight.position.set(0, 8.0, -11.8);
    rearSpotLight.target.position.set(0, 5.4, -16.4);
    scene.add(rearSpotLight);
    scene.add(rearSpotLight.target);

    const leftWingLight = new THREE.PointLight("#FFE0A3", 7.4, 20, 1.25);
    leftWingLight.position.set(-9.6, 6.1, -0.8);
    scene.add(leftWingLight);

    const rightWingLight = new THREE.PointLight("#FFE0A3", 7.4, 20, 1.25);
    rightWingLight.position.set(9.6, 6.1, -0.8);
    scene.add(rightWingLight);

    await reportStep(16, "Preparazione illuminazione museale…");

    // =========================================================================
    // PBR TEXTURES & MATERIALS
    // =========================================================================
    const travertine = trackPBR(createTravertinePBR(3, 2));
    await reportStep(26, "Generazione marmi e travertino…");

    const plazaPBR = trackPBR(createPlazaPBR());
    const marblePBR = trackPBR(createVeinedMarblePBR());
    await reportStep(38, "Creazione pavimentazione e piazza…");

    const piazzaMedallionTex = trackTex(createPiazzaMedallionTexture());
    const carpetRunnerTex = trackTex(createCarpetRunnerTexture());
    const clockFaceTex = trackTex(createClockFaceTexture());
    const contactShadowTex = trackTex(createContactShadowTexture());
    const beamTex = trackTex(createVolumetricBeamTexture());
    const mistTex = trackTex(createAtmosphericMistTexture());
    const paintingTextures = [0, 1, 2, 3, 4, 5].map((v) =>
      trackTex(createClassicalPaintingTexture(v)),
    );
    await reportStep(52, "Allestimento dipinti e dettagli…");

    const heroBookCoverPBR = trackPBR(createHeroBookCoverPBR());
    const heroLeftPageTex = trackTex(createHeroBookPageTexture(true));
    const heroRightPageTex = trackTex(createHeroBookPageTexture(false));

  const stoneMat = new THREE.MeshStandardMaterial({
    color: "#F3ECE2",
    map: travertine.map,
    normalMap: travertine.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: travertine.roughnessMap,
    roughness: 1.0,
    metalness: 0.03,
    envMapIntensity: 0.72,
  });
  applyAntiTilingShader(stoneMat, {
    macroScale: 0.14,
    dualScale: 1.67,
    macroColorStrength: 0.11,
    macroRoughnessStrength: 0.16,
  });

  const limestoneTrimMat = new THREE.MeshStandardMaterial({
    color: "#F4EDE2",
    normalMap: travertine.normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: travertine.roughnessMap,
    roughness: 0.86,
    metalness: 0.04,
    envMapIntensity: 0.85,
  });

  const plazaMat = new THREE.MeshStandardMaterial({
    map: plazaPBR.map,
    normalMap: plazaPBR.normalMap,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: plazaPBR.roughnessMap,
    roughness: 1.0,
    metalness: 0.03,
    envMapIntensity: 0.82,
  });
  applyAntiTilingShader(plazaMat, {
    macroScale: 0.075,
    dualScale: 2.13,
    macroColorStrength: 0.13,
    macroRoughnessStrength: 0.18,
    walkwayWear: true,
  });

  const marbleFloorMat = new THREE.MeshStandardMaterial({
    color: "#B9A992",
    map: marblePBR.map,
    normalMap: marblePBR.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: marblePBR.roughnessMap,
    roughness: 0.52,
    metalness: 0.08,
    envMapIntensity: 0.45,
  });
  applyAntiTilingShader(marbleFloorMat, {
    macroScale: 0.18,
    dualScale: 1.37,
    macroColorStrength: 0.07,
    macroRoughnessStrength: 0.12,
  });

  const galleryWallMat = new THREE.MeshStandardMaterial({
    color: "#9A876E",
    normalMap: travertine.normalMap,
    normalScale: new THREE.Vector2(0.28, 0.28),
    emissive: "#000000",
    emissiveIntensity: 0.0,
    roughness: 0.84,
    envMapIntensity: 0.15,
  });

  const atriumCeilingMat = new THREE.MeshStandardMaterial({
    color: "#86745D",
    normalMap: travertine.normalMap,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.88,
    envMapIntensity: 0.14,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: "#C8A050",
    roughness: 0.22,
    metalness: 0.91,
    envMapIntensity: 1.35,
  });

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: "#36281C",
    roughness: 0.34,
    metalness: 0.72,
    envMapIntensity: 1.15,
  });

  const clockHandMat = new THREE.MeshStandardMaterial({
    color: "#1E1812",
    roughness: 0.28,
    metalness: 0.75,
  });

  const clockSecondMat = new THREE.MeshStandardMaterial({
    color: "#9A3426",
    roughness: 0.32,
    metalness: 0.55,
  });

  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: "#FFF4D2",
    emissive: "#FFC664",
    emissiveIntensity: 1.65,
    roughness: 0.28,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: "#F2E9D8",
    roughness: 0.7,
    metalness: 0.05,
  });

  const velvetMat = new THREE.MeshStandardMaterial({
    color: "#6A2721",
    roughness: 0.86,
    metalness: 0.04,
  });

  const carpetMat = new THREE.MeshStandardMaterial({
    map: carpetRunnerTex,
    roughness: 0.92,
    metalness: 0.02,
  });

  const transparentGlassMat = new THREE.MeshPhysicalMaterial({
    color: "#F8F3E8",
    transparent: true,
    opacity: 0.22,
    roughness: 0.05,
    metalness: 0.05,
    reflectivity: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
    envMapIntensity: 1.4,
  });

  const contactShadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTex,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const bgStoneMat = new THREE.MeshStandardMaterial({
    color: "#EFE6D6",
    map: travertine.map,
    roughnessMap: travertine.roughnessMap,
    roughness: 1.0,
    metalness: 0.02,
    envMapIntensity: 0.35,
  });
  applyBackgroundDepthFog(bgStoneMat, 0.44, 0.8);

  const bgLimestoneMat = new THREE.MeshStandardMaterial({
    color: "#F3ECE0",
    roughness: 0.9,
    metalness: 0.02,
    envMapIntensity: 0.38,
  });
  applyBackgroundDepthFog(bgLimestoneMat, 0.44, 0.8);

  const bgGoldMat = new THREE.MeshStandardMaterial({
    color: "#CBB07A",
    roughness: 0.36,
    metalness: 0.72,
    envMapIntensity: 0.6,
  });
  applyBackgroundDepthFog(bgGoldMat, 0.42, 0.78);

  const bgDarkInteriorMat = new THREE.MeshStandardMaterial({
    color: "#A89A86",
    roughness: 0.95,
    metalness: 0.01,
    envMapIntensity: 0.2,
  });
  applyBackgroundDepthFog(bgDarkInteriorMat, 0.5, 0.84);

  const bgContactShadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  await reportStep(62, "Preparazione volume d’ingresso…");

  const museumGroup = new THREE.Group();
  scene.add(museumGroup);

  // =========================================================================
  // 1. ENRICHED COURTYARD PLAZA, INLAID MEDALLION, MEDITERRANEAN PLANTERS & SCENIC HILLS
  // =========================================================================
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.receiveShadow = true;
  museumGroup.add(plaza);

  // Inlaid Travertine & Gold Compass Medallion centered in front of the stairs
  const medallionMat = new THREE.MeshStandardMaterial({
    map: piazzaMedallionTex,
    transparent: true,
    roughness: 0.52,
    metalness: 0.14,
  });
  const medallion = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 10.8),
    medallionMat,
  );
  medallion.rotation.x = -Math.PI / 2;
  medallion.position.set(0, 0.014, 14.5);
  medallion.receiveShadow = true;
  museumGroup.add(medallion);

  // Stone walkway border curbs framing the ceremonial approach
  [-6.8, 6.8].forEach((bx) => {
    const curb = new THREE.Mesh(
      createBeveledBoxGeometry(0.42, 0.14, 15.0, 0.02),
      limestoneTrimMat,
    );
    curb.position.set(bx, 0.07, 15.5);
    curb.receiveShadow = true;
    museumGroup.add(curb);
  });

  // Varied Asymmetric Classical Structures flanking the museum, veiled in warm atmospheric background fog:
  // Right: Triumphal Arch, Curved Exedra Recess ("rientranza"), Distant Colonnade
  // Left: Miniature Roman Colosseum, U-Shaped Architectural Recess ("rientranza"), Circular Tholos
  const rightTriumphalArch = createTriumphalArchStructure(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
  );
  rightTriumphalArch.position.set(27.2, 0, -17.5);
  rightTriumphalArch.rotation.y = -0.56;
  disableShadowsOnBackground(rightTriumphalArch);
  museumGroup.add(rightTriumphalArch);

  const rightCurvedRecess = createCurvedExedraRecess(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
  );
  rightCurvedRecess.position.set(35.8, 0, -22.2);
  rightCurvedRecess.rotation.y = -0.7;
  disableShadowsOnBackground(rightCurvedRecess);
  museumGroup.add(rightCurvedRecess);

  const rightColonnade = createDistantColonnadeFragment(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
  );
  rightColonnade.position.set(42.5, 0, -24.6);
  rightColonnade.rotation.y = -0.74;
  disableShadowsOnBackground(rightColonnade);
  museumGroup.add(rightColonnade);

  const leftColosseum = createMiniColosseumStructure(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
    bgDarkInteriorMat,
  );
  leftColosseum.position.set(-28.4, 0, -18.5);
  leftColosseum.rotation.y = 0.54;
  disableShadowsOnBackground(leftColosseum);
  museumGroup.add(leftColosseum);

  const leftRecess = createRectangularRecessStructure(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
  );
  leftRecess.position.set(-37.2, 0, -23.0);
  leftRecess.rotation.y = 0.66;
  disableShadowsOnBackground(leftRecess);
  museumGroup.add(leftRecess);

  const leftTholos = createClassicalTholosStructure(
    bgStoneMat,
    bgLimestoneMat,
    bgGoldMat,
    bgContactShadowMat,
  );
  leftTholos.position.set(-43.2, 0, -25.6);
  leftTholos.rotation.y = 0.52;
  disableShadowsOnBackground(leftTholos);
  museumGroup.add(leftTholos);

  // Seamless Ground-Blended Distant Sicilian Mountain Ridge (vertex color gradient into plaza)
  const mountainRidge = createBlendedMountainTerrain();
  museumGroup.add(mountainRidge);

  // Soft layered atmospheric mist veils positioned strictly behind the side wings & rear horizon (never in atrium)
  const mistVeilMeshes: Array<{ mesh: THREE.Mesh; baseOpacity: number }> = [];
  const mistPlacements: Array<{
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    rotY: number;
    opacity: number;
  }> = [
    { x: -25.5, y: 4.1, z: -12.5, w: 26, h: 12.5, rotY: 0.36, opacity: 0.42 },
    { x: -34.5, y: 4.8, z: -17.2, w: 30, h: 14.5, rotY: 0.32, opacity: 0.48 },
    { x: 25.5, y: 4.1, z: -12.5, w: 26, h: 12.5, rotY: -0.36, opacity: 0.42 },
    { x: 34.5, y: 4.8, z: -17.2, w: 30, h: 14.5, rotY: -0.32, opacity: 0.48 },
    { x: 0, y: 6.2, z: -26.0, w: 88, h: 20.0, rotY: 0, opacity: 0.44 },
  ];
  mistPlacements.forEach((p) => {
    const mat = new THREE.MeshBasicMaterial({
      map: mistTex,
      color: "#F6EFE2",
      transparent: true,
      opacity: p.opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat);
    veil.position.set(p.x, p.y, p.z);
    veil.rotation.y = p.rotY;
    veil.renderOrder = 2;
    museumGroup.add(veil);
    mistVeilMeshes.push({ mesh: veil, baseOpacity: p.opacity });
  });

  // Bronze entrance stanchions & velvet ropes
  const stanchionPostGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.9, 10);
  const stanchionBaseGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.06, 12);
  [-5.8, 5.8].forEach((sx) => {
    [9.2, 12.2].forEach((sz) => {
      const post = new THREE.Mesh(stanchionPostGeo, goldMat);
      post.position.set(sx, 0.45, sz);
      post.castShadow = true;
      museumGroup.add(post);

      const sBase = new THREE.Mesh(stanchionBaseGeo, bronzeMat);
      sBase.position.set(sx, 0.03, sz);
      museumGroup.add(sBase);
    });

    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 3.0, 8),
      velvetMat,
    );
    rope.rotation.x = Math.PI / 2;
    rope.position.set(sx, 0.82, 10.7);
    museumGroup.add(rope);
  });

  // =========================================================================
  // 2. MONUMENTAL STAIRCASE, URNS & PODIUM
  // =========================================================================
  const stepCount = 5;
  const stepBackZ = 5.05;
  for (let i = 0; i < stepCount; i++) {
    const stepW = 14.8 - i * 0.82;
    const stepFrontZ = 6.55 + (stepCount - 1 - i) * 0.9;
    const stepD = stepFrontZ - stepBackZ;
    const stepH = 0.36;
    const stepZ = stepBackZ + stepD / 2;

    const step = new THREE.Mesh(
      createBeveledBoxGeometry(stepW, stepH, stepD, 0.024),
      limestoneTrimMat,
    );
    step.position.set(0, stepH / 2 + i * stepH, stepZ);
    step.castShadow = true;
    step.receiveShadow = true;
    museumGroup.add(step);

    const nosing = new THREE.Mesh(
      new THREE.BoxGeometry(stepW - 0.04, 0.032, 0.06),
      goldMat,
    );
    nosing.position.set(0, (i + 1) * stepH - 0.015, stepFrontZ - 0.02);
    museumGroup.add(nosing);
  }

  [-8.2, 8.2].forEach((ux) => {
    const urn = createClassicalUrn(limestoneTrimMat, goldMat, contactShadowMat);
    urn.position.set(ux, 0, 8.2);
    museumGroup.add(urn);
  });

  const podiumTopY = stepCount * 0.36; // 1.8

  const mainPodium = new THREE.Mesh(
    createBeveledBoxGeometry(28.4, podiumTopY, 14.5, 0.04),
    stoneMat,
  );
  mainPodium.position.set(0, podiumTopY / 2, -2.2);
  mainPodium.castShadow = true;
  mainPodium.receiveShadow = true;
  museumGroup.add(mainPodium);

  [-9.65, 9.65].forEach((wx) => {
    const baseboard = new THREE.Mesh(
      createBeveledBoxGeometry(8.5, 0.24, 0.16, 0.015),
      limestoneTrimMat,
    );
    baseboard.position.set(wx, podiumTopY + 0.12, 2.08);
    museumGroup.add(baseboard);
  });

  // =========================================================================
  // 3. CENTRAL PORTICO, SCROLL-OPENING ENTRANCE DOORS & REAL-TIME CLOCK OCULUS
  // =========================================================================
  const wallHeight = 7.2;
  const doorWidth = 3.6;
  const doorHeight = 5.35;

  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(
      createBeveledBoxGeometry(4.0, wallHeight, 1.05, 0.03),
      stoneMat,
    );
    wall.position.set(
      side * (doorWidth / 2 + 2.0),
      podiumTopY + wallHeight / 2,
      1.5,
    );
    wall.castShadow = true;
    wall.receiveShadow = true;
    museumGroup.add(wall);

    const lantern = createPorticoLantern(bronzeMat, lanternGlowMat);
    lantern.position.set(
      side * (doorWidth / 2 + 0.58),
      podiumTopY + 3.55,
      2.15,
    );
    museumGroup.add(lantern);
  });

  const lintelHeight = wallHeight - doorHeight;
  const doorLintel = new THREE.Mesh(
    createBeveledBoxGeometry(doorWidth, lintelHeight, 1.05, 0.025),
    stoneMat,
  );
  doorLintel.position.set(
    0,
    podiumTopY + doorHeight + lintelHeight / 2,
    1.5,
  );
  doorLintel.castShadow = true;
  museumGroup.add(doorLintel);

  const portalHeader = new THREE.Mesh(
    createBeveledBoxGeometry(doorWidth + 0.55, 0.25, 1.25, 0.02),
    goldMat,
  );
  portalHeader.position.set(0, podiumTopY + doorHeight + 0.08, 1.5);
  museumGroup.add(portalHeader);

  // Scroll-animated Double Doors (start nearly closed at progress 0 -> swing wide open on scroll!)
  const doorPivots: Array<{ pivot: THREE.Group; side: number }> = [];
  [-1, 1].forEach((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(
      side * (doorWidth / 2 - 0.06),
      podiumTopY + (doorHeight - 0.1) / 2,
      1.5,
    );

    const doorFrameOuter = new THREE.Mesh(
      createBeveledBoxGeometry(1.74, doorHeight - 0.12, 0.14, 0.018),
      bronzeMat,
    );
    doorFrameOuter.position.x = -side * 0.87;
    pivot.add(doorFrameOuter);

    const doorGlassInsert = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, doorHeight - 1.15),
      transparentGlassMat,
    );
    doorGlassInsert.position.set(-side * 0.87, 0.2, 0.08);
    pivot.add(doorGlassInsert);

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.68, 10),
      goldMat,
    );
    handle.position.set(-side * 1.54, -0.25, 0.12);
    pivot.add(handle);

    pivot.rotation.y = side * 0.04; // Initially closed gracefully
    museumGroup.add(pivot);
    doorPivots.push({ pivot, side });
  });

  await reportStep(72, "Costruzione facciata neoclassica…");

  // =========================================================================
  // 4. RICHLY FURNISHED ENTRANCE HALL & LUMINOUS ARTWORKS
  // =========================================================================
  const atriumFloor = new THREE.Mesh(
    new THREE.BoxGeometry(12.2, 0.16, 18.5),
    marbleFloorMat,
  );
  atriumFloor.position.set(0, podiumTopY + 0.08, -7.7);
  atriumFloor.receiveShadow = true;
  museumGroup.add(atriumFloor);

  // Ceremonial Woven Burgundy & Gold Carpet Runner leading straight to the Hero Book
  const carpetRunner = new THREE.Mesh(
    new THREE.BoxGeometry(3.15, 0.025, 16.0),
    carpetMat,
  );
  carpetRunner.position.set(0, podiumTopY + 0.175, -6.9);
  carpetRunner.receiveShadow = true;
  museumGroup.add(carpetRunner);

  // Coffered Atrium Ceiling + Soft Subtle Skylight (casts shadow inside to darken atrium!)
  const atriumCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, 0.4, 18.5),
    atriumCeilingMat,
  );
  atriumCeiling.position.set(0, podiumTopY + wallHeight, -7.7);
  atriumCeiling.castShadow = true;
  atriumCeiling.receiveShadow = true;
  museumGroup.add(atriumCeiling);

  const skylightMat = new THREE.MeshStandardMaterial({
    color: "#F5E5C4",
    emissive: "#FFDCA0",
    emissiveIntensity: 0.34,
    roughness: 0.35,
  });
  const skylight = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 5.4),
    skylightMat,
  );
  skylight.rotation.x = Math.PI / 2;
  skylight.position.set(0, podiumTopY + wallHeight - 0.22, -6.6);
  museumGroup.add(skylight);

  // Ceiling lighting tracks inside atrium
  [-4.6, 4.6].forEach((tx) => {
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 14.0),
      bronzeMat,
    );
    track.position.set(tx, podiumTopY + wallHeight - 0.25, -7.2);
    museumGroup.add(track);
  });

  // Interior Marble Columns framing the central atrium hall (4 columns)
  [
    [-4.15, -3.6],
    [4.15, -3.6],
    [-4.15, -10.6],
    [4.15, -10.6],
  ].forEach(([ix, iz]) => {
    const colBase = new THREE.Mesh(
      createBeveledBoxGeometry(0.95, 0.28, 0.95, 0.02),
      limestoneTrimMat,
    );
    colBase.position.set(ix, podiumTopY + 0.3, iz);
    museumGroup.add(colBase);

    const colShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.31, 0.36, wallHeight - 0.9, 18),
      limestoneTrimMat,
    );
    colShaft.position.set(ix, podiumTopY + wallHeight / 2, iz);
    colShaft.castShadow = true;
    museumGroup.add(colShaft);

    const colRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.03, 8, 22),
      goldMat,
    );
    colRing.rotation.x = Math.PI / 2;
    colRing.position.set(ix, podiumTopY + wallHeight - 0.58, iz);
    museumGroup.add(colRing);

    // Warm brass & alabaster interior wall sconce (applique) casting soft golden glow
    const sconceArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.08, 0.16),
      goldMat,
    );
    const inwardSign = ix < 0 ? 1 : -1;
    sconceArm.position.set(ix + inwardSign * 0.36, podiumTopY + 3.4, iz);
    museumGroup.add(sconceArm);

    const sconceGlobe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.09, 0.32, 10),
      lanternGlowMat,
    );
    sconceGlobe.position.set(ix + inwardSign * 0.42, podiumTopY + 3.6, iz);
    museumGroup.add(sconceGlobe);
  });

  // Atrium Side Walls with 6 Luminous Museum Paintings (3 on left, 3 on right)
  [-5.95, 5.95].forEach((x, idx) => {
    const innerWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, wallHeight, 18.5),
      galleryWallMat,
    );
    innerWall.position.set(x, podiumTopY + wallHeight / 2, -7.7);
    innerWall.castShadow = true;
    innerWall.receiveShadow = true;
    museumGroup.add(innerWall);

    const innerBaseboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.24, 18.5),
      limestoneTrimMat,
    );
    innerBaseboard.position.set(x, podiumTopY + 0.28, -7.7);
    museumGroup.add(innerBaseboard);

    [-2.8, -7.6, -12.6].forEach((zPos, pIdx) => {
      const tex = paintingTextures[(idx * 3 + pIdx) % paintingTextures.length];
      const wVar = pIdx === 1 ? 2.2 : 1.9;
      const hVar = pIdx === 1 ? 2.75 : 2.45;
      const painting = createFramedPaintingWithLabel(
        wVar,
        hVar,
        tex,
        goldMat,
        labelMat,
        beamMat,
        bronzeMat,
        lanternGlowMat,
      );
      painting.position.set(x + (x < 0 ? 0.3 : -0.3), podiumTopY + 3.65, zPos);
      painting.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      museumGroup.add(painting);
    });
  });

  // Back Atrium Wall with Monumental Focal Painting & Architectural Pilasters
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, wallHeight, 0.5),
    galleryWallMat,
  );
  backWall.position.set(0, podiumTopY + wallHeight / 2, -16.8);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  museumGroup.add(backWall);

  [-4.4, 4.4].forEach((px) => {
    const pilaster = new THREE.Mesh(
      createBeveledBoxGeometry(0.65, wallHeight - 0.4, 0.35, 0.02),
      limestoneTrimMat,
    );
    pilaster.position.set(px, podiumTopY + wallHeight / 2, -16.45);
    museumGroup.add(pilaster);
  });

  const rearMasterpiece = createFramedPaintingWithLabel(
    3.6,
    3.2,
    paintingTextures[0],
    goldMat,
    labelMat,
    beamMat,
    bronzeMat,
    lanternGlowMat,
  );
  rearMasterpiece.position.set(0, podiumTopY + 4.1, -16.4);
  museumGroup.add(rearMasterpiece);

  // 4 Glass Display Cases (Teche) & 2 Tufted Museum Benches inside the Atrium
  [
    [-3.65, -5.6, "amphora"],
    [3.65, -5.6, "bust"],
    [-3.65, -12.2, "obelisk"],
    [3.65, -12.2, "amphora"],
  ].forEach(([dx, dz, relic]) => {
    const teca = createMuseumDisplayCase(
      relic as "amphora" | "bust" | "obelisk",
      limestoneTrimMat,
      goldMat,
      transparentGlassMat,
      velvetMat,
      contactShadowMat,
    );
    teca.position.set(dx as number, podiumTopY + 0.16, dz as number);
    museumGroup.add(teca);
  });

  [-2.65, 2.65].forEach((bx) => {
    const bench = createMuseumBench(
      velvetMat,
      bronzeMat,
      goldMat,
      contactShadowMat,
    );
    bench.position.set(bx, podiumTopY + 0.16, -8.8);
    museumGroup.add(bench);
  });

  // 2 Classical Urns in Rear Atrium Corners
  [-4.3, 4.3].forEach((ux) => {
    const urn = createClassicalUrn(limestoneTrimMat, goldMat, contactShadowMat);
    urn.position.set(ux, podiumTopY + 0.16, -15.3);
    museumGroup.add(urn);
  });

  // Soft fake volumetric skylight shafts descending onto the entrance book
  const shaft1 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7.6), beamMat);
  shaft1.position.set(-0.35, podiumTopY + 4.3, -6.2);
  shaft1.rotation.z = -0.14;
  shaft1.rotation.y = 0.22;
  museumGroup.add(shaft1);

  const shaft2 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 7.2), beamMat);
  shaft2.position.set(0.35, podiumTopY + 4.2, -6.3);
  shaft2.rotation.z = 0.12;
  shaft2.rotation.y = -0.35;
  museumGroup.add(shaft2);

  // =========================================================================
  // 5. HERO OPENING ENTRANCE BOOK (MATHEMATICALLY ZERO CLIPPING / ZERO OVERLAP)
  // =========================================================================
  const lecternZ = -6.6;

  const lecternShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.5),
    contactShadowMat,
  );
  lecternShadow.rotation.x = -Math.PI / 2;
  lecternShadow.position.set(0, podiumTopY + 0.17, lecternZ);
  museumGroup.add(lecternShadow);

  const lecternBase = new THREE.Mesh(
    createBeveledBoxGeometry(1.82, 0.26, 1.48, 0.03),
    limestoneTrimMat,
  );
  lecternBase.position.set(0, podiumTopY + 0.28, lecternZ);
  lecternBase.receiveShadow = true;
  museumGroup.add(lecternBase);

  const lecternPillar = new THREE.Mesh(
    createBeveledBoxGeometry(1.18, 1.18, 0.96, 0.035),
    limestoneTrimMat,
  );
  lecternPillar.position.set(0, podiumTopY + 0.98, lecternZ);
  lecternPillar.castShadow = true;
  museumGroup.add(lecternPillar);

  const lecternGoldBand = new THREE.Mesh(
    createBeveledBoxGeometry(1.3, 0.08, 1.08, 0.015),
    goldMat,
  );
  lecternGoldBand.position.set(0, podiumTopY + 1.56, lecternZ);
  museumGroup.add(lecternGoldBand);

  const lecternTiltGroup = new THREE.Group();
  lecternTiltGroup.position.set(0, podiumTopY + 1.66, lecternZ);
  lecternTiltGroup.rotation.x = 0.34;
  museumGroup.add(lecternTiltGroup);

  const lecternDesk = new THREE.Mesh(
    createBeveledBoxGeometry(2.4, 0.14, 1.72, 0.025),
    limestoneTrimMat,
  );
  lecternTiltGroup.add(lecternDesk);

  const cushion = new THREE.Mesh(
    createBeveledBoxGeometry(2.1, 0.06, 1.44, 0.02),
    velvetMat,
  );
  cushion.position.y = 0.095;
  lecternTiltGroup.add(cushion);

  const deskLedge = new THREE.Mesh(
    createBeveledBoxGeometry(2.15, 0.09, 0.08, 0.015),
    goldMat,
  );
  deskLedge.position.set(0, 0.11, 0.78);
  lecternTiltGroup.add(deskLedge);

  // Hero Book Codex sitting cleanly with its back cover resting at bookGroup local y = 0 (cushion top y = 0.125)
  const heroBookGroup = new THREE.Group();
  heroBookGroup.position.set(0, 0.126, 0.03);
  lecternTiltGroup.add(heroBookGroup);

  const ebW = 1.04;
  const ebH = 1.4;
  const ebBoardT = 0.034;

  const ebBoardMat = new THREE.MeshStandardMaterial({
    color: "#E3D3B7",
    roughness: 0.54,
    metalness: 0.08,
  });

  const ebFrontCoverMat = new THREE.MeshStandardMaterial({
    map: heroBookCoverPBR.map,
    normalMap: heroBookCoverPBR.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: heroBookCoverPBR.roughnessMap,
    roughness: 1.0,
    metalness: 0.24,
    envMapIntensity: 1.15,
  });

  const ebLeftPageMat = new THREE.MeshStandardMaterial({
    map: heroLeftPageTex,
    emissive: "#FFE09E",
    emissiveIntensity: 0.22,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  const ebRightPageMat = new THREE.MeshStandardMaterial({
    map: heroRightPageTex,
    emissive: "#FFE09E",
    emissiveIntensity: 0.22,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // Back cover board (y ∈ [0.000, 0.034])
  const ebBackBoard = new THREE.Mesh(
    new THREE.BoxGeometry(ebW, ebBoardT, ebH),
    ebBoardMat,
  );
  ebBackBoard.position.set(ebW / 2, ebBoardT / 2, 0);
  heroBookGroup.add(ebBackBoard);

  // Right gilded page block (y ∈ [0.034, 0.098])
  const ebRightBlock = new THREE.Mesh(
    new THREE.BoxGeometry(ebW - 0.08, 0.064, ebH - 0.1),
    goldMat,
  );
  ebRightBlock.position.set((ebW - 0.08) / 2 + 0.02, 0.066, 0);
  heroBookGroup.add(ebRightBlock);

  // Right open readable page strictly ON TOP of right block (y = 0.100, flat when closed)
  const ebRightPageCtrl = createDynamicArchedPageGeometry(
    ebW - 0.09,
    ebH - 0.11,
    "right",
    0,
  );
  const ebRightArched = new THREE.Mesh(ebRightPageCtrl.geo, ebRightPageMat);
  ebRightArched.position.set((ebW - 0.09) / 2 + 0.02, 0.1, 0);
  heroBookGroup.add(ebRightArched);

  // Rounded spine cylinder along x = 0 (center y = 0.098, radius = 0.096)
  const ebSpineR = 0.096;
  const ebSpine = new THREE.Mesh(
    new THREE.CylinderGeometry(
      ebSpineR,
      ebSpineR,
      ebH,
      18,
      1,
      false,
      Math.PI / 2,
      Math.PI,
    ),
    ebBoardMat,
  );
  ebSpine.rotation.x = Math.PI / 2;
  ebSpine.position.set(0, 0.098, 0);
  heroBookGroup.add(ebSpine);

  for (let i = -2; i <= 2; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(ebSpineR + 0.006, 0.009, 8, 18, Math.PI),
      goldMat,
    );
    band.rotation.y = Math.PI / 2;
    band.rotation.z = Math.PI / 2;
    band.position.set(0, 0.098, i * 0.24);
    heroBookGroup.add(band);
  }

  const getHeroRightPageY = (worldX: number, archAmp: number): number => {
    const u = THREE.MathUtils.clamp((worldX - 0.02) / (ebW - 0.09), 0, 1);
    return 0.1 + Math.sin(Math.pow(u, 0.75) * Math.PI) * archAmp;
  };

  // Flat crimson silk ribbon anchored strictly beside the spine crease (never at page center)
  const ebRibbonMat = new THREE.MeshStandardMaterial({
    color: "#8E2820",
    roughness: 0.48,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const ebRibbonW = 0.06;
  const ebRibbonHalfW = ebRibbonW / 2;
  const ribbonGeo = createPiecewiseSilkRibbonGeometry({
    startZ: -0.62,
    edgeClearZ: 0.66,
    tipZ: 0.76,
    dropY: 0.048,
    width: ebRibbonW,
  });
  const silkRibbon = new THREE.Mesh(ribbonGeo, ebRibbonMat);
  const ebRibbonX = 0.132;
  silkRibbon.position.set(ebRibbonX, getHeroRightPageY(ebRibbonX, 0) + 0.003, 0);
  silkRibbon.rotation.z = 0;
  heroBookGroup.add(silkRibbon);

  // Front cover hinge at y = 0.111:
  // When closed (θ = 0): frontBoard at [0.175..0.209], leftBlock at [0.113..0.173], leftTopPage at 0.112
  // When open (θ = π): frontBoard lands flat at [0.013..0.047], leftBlock at [0.049..0.109], leftTopPage at 0.110
  const ebFrontHinge = new THREE.Group();
  ebFrontHinge.position.set(0, 0.111, 0);
  heroBookGroup.add(ebFrontHinge);

  const ebFrontBoard = new THREE.Mesh(
    new THREE.BoxGeometry(ebW, ebBoardT, ebH),
    [
      ebBoardMat,
      ebBoardMat,
      ebFrontCoverMat,
      ebBoardMat,
      ebBoardMat,
      ebBoardMat,
    ],
  );
  ebFrontBoard.position.set(ebW / 2, 0.081, 0);
  ebFrontHinge.add(ebFrontBoard);

  // Sculpted brass corners & clasp mounted strictly on frontBoard
  const hCorners: Array<[number, number]> = [
    [ebW - 0.06, -ebH / 2 + 0.06],
    [ebW - 0.06, ebH / 2 - 0.06],
    [0.06, -ebH / 2 + 0.06],
    [0.06, ebH / 2 - 0.06],
  ];
  hCorners.forEach(([cx, cz]) => {
    const corner = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, ebBoardT + 0.008, 0.13),
      goldMat,
    );
    corner.position.set(cx, 0.081, cz);
    ebFrontHinge.add(corner);
  });

  const ebClasp = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, ebBoardT + 0.012, 0.18),
    goldMat,
  );
  ebClasp.position.set(ebW - 0.03, 0.081, 0);
  ebFrontHinge.add(ebClasp);

  const ebLeftBlock = new THREE.Mesh(
    new THREE.BoxGeometry(ebW - 0.08, 0.06, ebH - 0.1),
    goldMat,
  );
  ebLeftBlock.position.set((ebW - 0.08) / 2 + 0.02, 0.032, 0);
  ebFrontHinge.add(ebLeftBlock);

  const ebLeftPageCtrl = createDynamicArchedPageGeometry(
    ebW - 0.09,
    ebH - 0.11,
    "right",
    0,
  );
  const ebLeftArched = new THREE.Mesh(ebLeftPageCtrl.geo, ebLeftPageMat);
  ebLeftArched.rotation.z = Math.PI;
  ebLeftArched.position.set((ebW - 0.09) / 2 + 0.02, 0.001, 0);
  ebFrontHinge.add(ebLeftArched);

  // 2 Thin Turning Parchment Leaves strictly pivoted inside the stack and ALWAYS visible (zero pop-in)
  const turnLeaf1Pivot = new THREE.Group();
  turnLeaf1Pivot.position.set(0, 0.1085, 0);
  const turnLeaf1Ctrl = createDynamicArchedPageGeometry(
    ebW - 0.092,
    ebH - 0.112,
    "right",
    0,
  );
  const turnLeaf1 = new THREE.Mesh(turnLeaf1Ctrl.geo, ebRightPageMat);
  turnLeaf1.position.x = (ebW - 0.092) / 2 + 0.02;
  turnLeaf1Pivot.add(turnLeaf1);
  heroBookGroup.add(turnLeaf1Pivot);

  const turnLeaf2Pivot = new THREE.Group();
  turnLeaf2Pivot.position.set(0, 0.1055, 0);
  const turnLeaf2Ctrl = createDynamicArchedPageGeometry(
    ebW - 0.092,
    ebH - 0.112,
    "right",
    0,
  );
  const turnLeaf2 = new THREE.Mesh(turnLeaf2Ctrl.geo, ebLeftPageMat);
  turnLeaf2.position.x = (ebW - 0.092) / 2 + 0.02;
  turnLeaf2Pivot.add(turnLeaf2);
  heroBookGroup.add(turnLeaf2Pivot);

  await reportStep(82, "Allestimento atrio e leggio…");

  // =========================================================================
  // 6. PORTICO COLUMNS (4 COLUMNS + 56 INSTANCED FLUTED RIBS)
  // =========================================================================
  const columnPositionsX = [-4.65, -2.25, 2.25, 4.65];
  const columnHeight = 6.95;
  const colR = 0.44;
  const shaftH = columnHeight - 1.12;

  const colPlinthGeo = createBeveledBoxGeometry(
    colR * 2.95,
    0.28,
    colR * 2.95,
    0.024,
  );
  const colTorus1Geo = new THREE.CylinderGeometry(
    colR * 1.3,
    colR * 1.38,
    0.18,
    26,
  );
  const colTorus2Geo = new THREE.CylinderGeometry(
    colR * 1.12,
    colR * 1.24,
    0.14,
    26,
  );
  const colShaftGeo = new THREE.CylinderGeometry(
    colR * 0.87,
    colR * 0.98,
    shaftH,
    24,
  );
  const colAstragalGeo = new THREE.TorusGeometry(colR * 0.92, 0.036, 10, 30);
  const colEchinusGeo = new THREE.CylinderGeometry(
    colR * 1.28,
    colR * 0.9,
    0.32,
    26,
  );
  const colAbacusGeo = createBeveledBoxGeometry(
    colR * 2.8,
    0.18,
    colR * 2.8,
    0.022,
  );

  columnPositionsX.forEach((cx) => {
    const colG = new THREE.Group();
    colG.position.set(cx, podiumTopY, 3.85);

    const plinth = new THREE.Mesh(colPlinthGeo, limestoneTrimMat);
    plinth.position.y = 0.14;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    colG.add(plinth);

    const t1 = new THREE.Mesh(colTorus1Geo, limestoneTrimMat);
    t1.position.y = 0.37;
    t1.castShadow = true;
    colG.add(t1);

    const t2 = new THREE.Mesh(colTorus2Geo, limestoneTrimMat);
    t2.position.y = 0.53;
    t2.castShadow = true;
    colG.add(t2);

    const shaft = new THREE.Mesh(colShaftGeo, limestoneTrimMat);
    shaft.position.y = 0.6 + shaftH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colG.add(shaft);

    const astragal = new THREE.Mesh(colAstragalGeo, goldMat);
    astragal.rotation.x = Math.PI / 2;
    astragal.position.y = columnHeight - 0.52;
    colG.add(astragal);

    const echinus = new THREE.Mesh(colEchinusGeo, limestoneTrimMat);
    echinus.position.y = columnHeight - 0.35;
    echinus.castShadow = true;
    colG.add(echinus);

    const abacus = new THREE.Mesh(colAbacusGeo, limestoneTrimMat);
    abacus.position.y = columnHeight - 0.1;
    abacus.castShadow = true;
    colG.add(abacus);

    museumGroup.add(colG);
  });

  const fluteCountPerCol = 14;
  const totalFlutes = columnPositionsX.length * fluteCountPerCol;
  const fluteGeo = new THREE.CylinderGeometry(
    colR * 0.075,
    colR * 0.095,
    shaftH - 0.2,
    8,
  );
  const flutesInstanced = new THREE.InstancedMesh(
    fluteGeo,
    limestoneTrimMat,
    totalFlutes,
  );
  flutesInstanced.castShadow = true;
  flutesInstanced.frustumCulled = false;
  const dummy = new THREE.Object3D();
  let fIdx = 0;
  columnPositionsX.forEach((cx) => {
    for (let i = 0; i < fluteCountPerCol; i++) {
      const a = (i / fluteCountPerCol) * Math.PI * 2;
      dummy.position.set(
        cx + Math.cos(a) * colR * 0.91,
        podiumTopY + 0.6 + shaftH / 2,
        3.85 + Math.sin(a) * colR * 0.91,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      flutesInstanced.setMatrixAt(fIdx++, dummy.matrix);
    }
  });
  flutesInstanced.instanceMatrix.needsUpdate = true;
  museumGroup.add(flutesInstanced);

  // =========================================================================
  // 7. ENTABLATURE, PEDIMENT WITH LIVE WORKING CLOCK, DOME & CUPOLA
  // =========================================================================
  const entablatureY = podiumTopY + columnHeight;
  const entablature = new THREE.Mesh(
    createBeveledBoxGeometry(11.6, 0.85, 3.35, 0.03),
    limestoneTrimMat,
  );
  entablature.position.set(0, entablatureY + 0.42, 2.65);
  entablature.castShadow = true;
  entablature.receiveShadow = true;
  museumGroup.add(entablature);

  const friezeGoldLine = new THREE.Mesh(
    new THREE.BoxGeometry(11.68, 0.09, 3.42),
    goldMat,
  );
  friezeGoldLine.position.set(0, entablatureY + 0.07, 2.65);
  museumGroup.add(friezeGoldLine);

  const dentilGeo = new THREE.BoxGeometry(0.18, 0.16, 0.16);
  const dentilPositions: Array<[number, number, number]> = [];
  for (let x = -5.4; x <= 5.4; x += 0.45) {
    dentilPositions.push([x, entablatureY + 0.88, 4.35]);
  }
  [-9.65, 9.65].forEach((wx) => {
    for (let x = -3.9; x <= 3.9; x += 0.52) {
      dentilPositions.push([wx + x, podiumTopY + 6.08, 2.26]);
    }
  });
  const dentilsInstanced = new THREE.InstancedMesh(
    dentilGeo,
    limestoneTrimMat,
    dentilPositions.length,
  );
  dentilsInstanced.frustumCulled = false;
  dentilPositions.forEach(([dx, dy, dz], idx) => {
    dummy.position.set(dx, dy, dz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dentilsInstanced.setMatrixAt(idx, dummy.matrix);
  });
  dentilsInstanced.instanceMatrix.needsUpdate = true;
  museumGroup.add(dentilsInstanced);

  const pedShape = new THREE.Shape();
  pedShape.moveTo(-5.95, 0);
  pedShape.lineTo(5.95, 0);
  pedShape.lineTo(0, 2.7);
  pedShape.closePath();

  const pedOculusHole = new THREE.Path();
  pedOculusHole.absarc(0, 1.12, 0.56, 0, Math.PI * 2, false);
  pedShape.holes.push(pedOculusHole);

  const pedGeo = new THREE.ExtrudeGeometry(pedShape, {
    depth: 2.9,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  const pediment = new THREE.Mesh(pedGeo, stoneMat);
  pediment.position.set(0, entablatureY + 0.85, 1.1);
  pediment.castShadow = true;
  pediment.receiveShadow = true;
  museumGroup.add(pediment);

  // WORKING REAL-TIME CLOCK IN PEDIMENT CENTRAL OCULUS
  const clockY = entablatureY + 1.97;
  const clockZ = 4.02;

  const oculusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.075, 14, 36),
    goldMat,
  );
  oculusRing.position.set(0, clockY, clockZ + 0.04);
  museumGroup.add(oculusRing);

  const clockDialMat = new THREE.MeshStandardMaterial({
    map: clockFaceTex,
    roughness: 0.38,
    metalness: 0.05,
  });
  const clockDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.56, 36),
    clockDialMat,
  );
  clockDial.position.set(0, clockY, clockZ);
  museumGroup.add(clockDial);

  const hourHandPivot = new THREE.Group();
  hourHandPivot.position.set(0, clockY, clockZ + 0.02);
  const hourBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.27, 0.015),
    clockHandMat,
  );
  hourBlade.position.y = 0.11;
  hourHandPivot.add(hourBlade);
  museumGroup.add(hourHandPivot);

  const minuteHandPivot = new THREE.Group();
  minuteHandPivot.position.set(0, clockY, clockZ + 0.032);
  const minuteBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.39, 0.015),
    clockHandMat,
  );
  minuteBlade.position.y = 0.17;
  minuteHandPivot.add(minuteBlade);
  museumGroup.add(minuteHandPivot);

  const secondHandPivot = new THREE.Group();
  secondHandPivot.position.set(0, clockY, clockZ + 0.044);
  const secondBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.44, 0.01),
    clockSecondMat,
  );
  secondBlade.position.y = 0.16;
  secondHandPivot.add(secondBlade);
  museumGroup.add(secondHandPivot);

  const clockPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.04, 14),
    goldMat,
  );
  clockPin.rotation.x = Math.PI / 2;
  clockPin.position.set(0, clockY, clockZ + 0.048);
  museumGroup.add(clockPin);

  [-1, 1].forEach((side) => {
    const beam = new THREE.Mesh(
      createBeveledBoxGeometry(6.72, 0.25, 3.4, 0.025),
      limestoneTrimMat,
    );
    beam.position.set(side * 3.1, entablatureY + 2.24, 2.6);
    beam.rotation.z = -side * 0.43;
    beam.castShadow = true;
    museumGroup.add(beam);
  });

  // Ribbed Dome & Lantern Cupola
  const drumY = entablatureY + 0.8;
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(4.35, 4.55, 2.0, 40),
    stoneMat,
  );
  drum.position.set(0, drumY + 1.0, -2.5);
  drum.castShadow = true;
  museumGroup.add(drum);

  const drumCornice = new THREE.Mesh(
    new THREE.CylinderGeometry(4.68, 4.45, 0.3, 40),
    limestoneTrimMat,
  );
  drumCornice.position.set(0, drumY + 2.08, -2.5);
  museumGroup.add(drumCornice);

  const domeY = drumY + 2.18;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4.35, 40, 26, 0, Math.PI * 2, 0, Math.PI / 2),
    limestoneTrimMat,
  );
  dome.position.set(0, domeY, -2.5);
  dome.castShadow = true;
  museumGroup.add(dome);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(4.37, 0.055, 8, 26, Math.PI / 2),
      goldMat,
    );
    rib.position.set(0, domeY, -2.5);
    rib.rotation.y = angle;
    museumGroup.add(rib);
  }

  const lanternBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.94, 0.82, 16),
    limestoneTrimMat,
  );
  lanternBase.position.set(0, domeY + 4.42, -2.5);
  museumGroup.add(lanternBase);

  const lanternCap = new THREE.Mesh(
    new THREE.ConeGeometry(0.88, 1.02, 16),
    goldMat,
  );
  lanternCap.position.set(0, domeY + 5.28, -2.5);
  museumGroup.add(lanternCap);

  // =========================================================================
  // 8. SYMMETRIC WINGS WITH LUMINOUS ARTWORKS & EXACT SYMMETRIC ROOF BALUSTERS
  // =========================================================================
  const balusterOffsets = [-3.6, -2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7, 3.6];
  const balusterMatrices: Array<{ x: number; y: number; z: number; rotY: number }> = [];
  const spotlightCanPositions: Array<[number, number, number]> = [];

  [-1, 1].forEach((side, wingIdx) => {
    const wingX = side * 9.65;
    const wingW = 8.4;
    const wingH = 6.2;
    const wingD = 7.4;
    const frontZ = 2.05;

    const frontWallShape = new THREE.Shape();
    frontWallShape.moveTo(-wingW / 2, 0);
    frontWallShape.lineTo(wingW / 2, 0);
    frontWallShape.lineTo(wingW / 2, wingH);
    frontWallShape.lineTo(-wingW / 2, wingH);
    frontWallShape.closePath();

    const winOffsets = [-1.95, 1.95];
    const winW = 1.05;
    const winBottom = 1.45;
    const winStraightH = 2.1;

    winOffsets.forEach((wx) => {
      const hole = new THREE.Path();
      hole.moveTo(wx - winW, winBottom);
      hole.lineTo(wx - winW, winBottom + winStraightH);
      hole.absarc(wx, winBottom + winStraightH, winW, Math.PI, 0, true);
      hole.lineTo(wx + winW, winBottom);
      hole.closePath();
      frontWallShape.holes.push(hole);
    });

    const frontWallGeo = new THREE.ExtrudeGeometry(frontWallShape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
      curveSegments: 24,
    });
    const frontWallMesh = new THREE.Mesh(frontWallGeo, stoneMat);
    frontWallMesh.position.set(wingX, podiumTopY, frontZ - 0.55);
    frontWallMesh.castShadow = true;
    frontWallMesh.receiveShadow = true;
    museumGroup.add(frontWallMesh);

    const wingTrack = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.06, 0.1),
      bronzeMat,
    );
    wingTrack.position.set(wingX, podiumTopY + wingH - 0.3, frontZ - 2.3);
    museumGroup.add(wingTrack);

    winOffsets.forEach((wx, localIdx) => {
      const paneShape = new THREE.Shape();
      paneShape.moveTo(-winW, 0);
      paneShape.lineTo(-winW, winStraightH);
      paneShape.absarc(0, winStraightH, winW, Math.PI, 0, true);
      paneShape.lineTo(winW, 0);
      paneShape.closePath();

      const glassPane = new THREE.Mesh(
        new THREE.ShapeGeometry(paneShape, 24),
        transparentGlassMat,
      );
      glassPane.position.set(wingX + wx, podiumTopY + winBottom, frontZ - 0.25);
      museumGroup.add(glassPane);

      const vMullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, winStraightH + winW, 0.05),
        goldMat,
      );
      vMullion.position.set(
        wingX + wx,
        podiumTopY + winBottom + (winStraightH + winW) / 2,
        frontZ - 0.22,
      );
      museumGroup.add(vMullion);

      const hMullion = new THREE.Mesh(
        new THREE.BoxGeometry(winW * 2, 0.045, 0.05),
        goldMat,
      );
      hMullion.position.set(
        wingX + wx,
        podiumTopY + winBottom + winStraightH,
        frontZ - 0.22,
      );
      museumGroup.add(hMullion);

      const sill = new THREE.Mesh(
        createBeveledBoxGeometry(winW * 2.5, 0.22, 0.72, 0.02),
        limestoneTrimMat,
      );
      sill.position.set(
        wingX + wx,
        podiumTopY + winBottom - 0.08,
        frontZ - 0.14,
      );
      sill.castShadow = true;
      museumGroup.add(sill);

      const treasureTypes: Array<"amphora" | "bust" | "obelisk"> =
        side < 0 ? ["amphora", "bust"] : ["bust", "obelisk"];
      const treasure = createMuseumTreasurePedestal(
        treasureTypes[localIdx],
        limestoneTrimMat,
        goldMat,
        contactShadowMat,
        (localIdx - 0.5) * 0.28 * side,
      );
      treasure.position.set(wingX + wx, podiumTopY + 0.14, frontZ - 2.35);
      museumGroup.add(treasure);

      spotlightCanPositions.push([
        wingX + wx,
        podiumTopY + wingH - 0.42,
        frontZ - 2.3,
      ]);

      // Luminous vibrant paintings visible inside both wings behind arched glass!
      const tex =
        paintingTextures[(wingIdx * 2 + localIdx + 1) % paintingTextures.length];
      const painting = createFramedPaintingWithLabel(
        1.85,
        2.35,
        tex,
        goldMat,
        labelMat,
        beamMat,
        bronzeMat,
        lanternGlowMat,
      );
      painting.position.set(wingX + wx, podiumTopY + 3.55, frontZ - wingD + 0.6);
      museumGroup.add(painting);
    });

    const wingFloor = new THREE.Mesh(
      new THREE.BoxGeometry(wingW, 0.14, wingD),
      marbleFloorMat,
    );
    wingFloor.position.set(wingX, podiumTopY + 0.07, frontZ - wingD / 2);
    museumGroup.add(wingFloor);

    const wingBackWall = new THREE.Mesh(
      new THREE.BoxGeometry(wingW, wingH, 0.45),
      galleryWallMat,
    );
    wingBackWall.position.set(
      wingX,
      podiumTopY + wingH / 2,
      frontZ - wingD + 0.22,
    );
    museumGroup.add(wingBackWall);

    const wingOuterWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, wingH, wingD),
      stoneMat,
    );
    wingOuterWall.position.set(
      wingX + side * (wingW / 2 - 0.27),
      podiumTopY + wingH / 2,
      frontZ - wingD / 2,
    );
    wingOuterWall.castShadow = true;
    museumGroup.add(wingOuterWall);

    const cornice = new THREE.Mesh(
      createBeveledBoxGeometry(wingW + 0.45, 0.44, wingD + 0.45, 0.025),
      limestoneTrimMat,
    );
    cornice.position.set(wingX, podiumTopY + wingH + 0.22, frontZ - wingD / 2);
    cornice.castShadow = true;
    museumGroup.add(cornice);

    const wingGoldBand = new THREE.Mesh(
      new THREE.BoxGeometry(wingW + 0.4, 0.08, wingD + 0.4),
      goldMat,
    );
    wingGoldBand.position.set(
      wingX,
      podiumTopY + wingH - 0.06,
      frontZ - wingD / 2,
    );
    museumGroup.add(wingGoldBand);

    // Top parapet rail + symmetric end corner piers
    const rail = new THREE.Mesh(
      createBeveledBoxGeometry(wingW + 0.1, 0.14, 0.26, 0.015),
      limestoneTrimMat,
    );
    rail.position.set(wingX, podiumTopY + wingH + 0.96, frontZ - 0.25);
    museumGroup.add(rail);

    [-4.05, 4.05].forEach((pierX) => {
      const pier = new THREE.Mesh(
        createBeveledBoxGeometry(0.32, 0.64, 0.32, 0.02),
        limestoneTrimMat,
      );
      pier.position.set(wingX + pierX, podiumTopY + wingH + 0.72, frontZ - 0.25);
      museumGroup.add(pier);
    });

    // Exact symmetric baluster offsets for both wings!
    balusterOffsets.forEach((bx) => {
      balusterMatrices.push({
        x: wingX + bx,
        y: podiumTopY + wingH + 0.68,
        z: frontZ - 0.25,
        rotY: 0,
      });
    });
  });

  const balusterGeo = new THREE.CylinderGeometry(0.07, 0.095, 0.54, 10);
  const balustersInstanced = new THREE.InstancedMesh(
    balusterGeo,
    limestoneTrimMat,
    balusterMatrices.length,
  );
  balustersInstanced.frustumCulled = false;
  balusterMatrices.forEach((b, idx) => {
    dummy.position.set(b.x, b.y, b.z);
    dummy.rotation.set(0, b.rotY, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    balustersInstanced.setMatrixAt(idx, dummy.matrix);
  });
  balustersInstanced.instanceMatrix.needsUpdate = true;
  museumGroup.add(balustersInstanced);

  [-4.6, 4.6].forEach((tx) => {
    [-2.8, -7.6, -12.6].forEach((tz) => {
      spotlightCanPositions.push([tx, podiumTopY + wallHeight - 0.38, tz]);
    });
  });
  const canGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.24, 10);
  const cansInstanced = new THREE.InstancedMesh(
    canGeo,
    bronzeMat,
    spotlightCanPositions.length,
  );
  cansInstanced.frustumCulled = false;
  spotlightCanPositions.forEach(([sx, sy, sz], idx) => {
    dummy.position.set(sx, sy, sz);
    dummy.rotation.set(0.35, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    cansInstanced.setMatrixAt(idx, dummy.matrix);
  });
  cansInstanced.instanceMatrix.needsUpdate = true;
  museumGroup.add(cansInstanced);

  await reportStep(92, "Compilazione luci e ombre…");

  const resize = () => {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (w <= 0 || h <= 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    activeRenderer.setSize(w, h, false);
  };

  const tzOffsetMs = new Date().getTimezoneOffset() * 60000;

  const update = (
    progress: number,
    pointerX: number,
    pointerY: number,
    elapsed: number,
  ) => {
    // 1. Live Real-Time Clock synced to system clock (zero per-frame Date allocations)
    const localMs = Date.now() - tzOffsetMs;
    const dayMs = ((localMs % 86400000) + 86400000) % 86400000;
    const secs = (dayMs / 1000) % 60;
    const mins = (dayMs / 60000) % 60;
    const hrs = (dayMs / 3600000) % 12;
    secondHandPivot.rotation.z = -(secs / 60) * Math.PI * 2;
    minuteHandPivot.rotation.z = -(mins / 60) * Math.PI * 2;
    hourHandPivot.rotation.z = -(hrs / 12) * Math.PI * 2;

    const clamped = Math.min(1, Math.max(0, progress));
    const ease = clamped * clamped * (3 - 2 * clamped);

    // 2. Scroll-driven Double Entrance Doors swing open smoothly as user approaches
    const doorT = Math.min(1, Math.max(0, (clamped - 0.16) / 0.4));
    const doorEase = doorT * doorT * (3 - 2 * doorT);
    doorPivots.forEach(({ pivot, side }) => {
      pivot.rotation.y = side * THREE.MathUtils.lerp(0.04, 1.42, doorEase);
    });

    // 3. Two-stage Camera Glide into Atrium & Lectern Book
    const approachT = Math.min(1, clamped / 0.56);
    const approachEase = approachT * approachT * (3 - 2 * approachT);

    const bookApproachT = Math.min(1, Math.max(0, (clamped - 0.54) / 0.42));
    const bookEase = bookApproachT * bookApproachT * (3 - 2 * bookApproachT);

    // 4. Bug-Free Hero Book Opening + Continuous Non-Popping Turning Leaves
    const coverAngle = THREE.MathUtils.lerp(0, Math.PI * 0.96, bookEase);
    ebFrontHinge.rotation.z = coverAngle;
    heroBookGroup.position.x = THREE.MathUtils.lerp(-ebW / 2, 0, bookEase);

    const rightArchAmp = 0.038 * bookEase;
    ebRightPageCtrl.setArchAmp(rightArchAmp);

    const leftArchT = THREE.MathUtils.clamp(
      (coverAngle / Math.PI - 0.3) / 0.55,
      0,
      1,
    );
    const leftArchEase = leftArchT * leftArchT * (3 - 2 * leftArchT);
    ebLeftPageCtrl.setArchAmp(0.038 * leftArchEase);

    // Silk ribbon stays anchored beside the spine crease and follows the right page arch height
    const ribYa = getHeroRightPageY(ebRibbonX - ebRibbonHalfW, rightArchAmp);
    const ribYm = getHeroRightPageY(ebRibbonX, rightArchAmp);
    const ribYb = getHeroRightPageY(ebRibbonX + ebRibbonHalfW, rightArchAmp);
    silkRibbon.position.y = ribYm + 0.003;
    silkRibbon.rotation.z = Math.atan2(ribYb - ribYa, ebRibbonW);

    // Turning leaves start flush at 0 rad (always visible, never popping in) and settle cleanly onto the left spread
    const leaf1T = Math.min(1, Math.max(0, (bookApproachT - 0.14) / 0.56));
    const leaf1Ease = leaf1T * leaf1T * (3 - 2 * leaf1T);
    const leaf1Raw = THREE.MathUtils.lerp(0, Math.PI * 0.945, leaf1Ease);
    const leaf1Angle = Math.min(leaf1Raw, Math.max(0, coverAngle - 0.08));
    turnLeaf1Pivot.rotation.z = leaf1Angle;
    turnLeaf1Ctrl.setArchAmp(rightArchAmp * Math.cos(leaf1Angle));

    const leaf2T = Math.min(1, Math.max(0, (bookApproachT - 0.36) / 0.56));
    const leaf2Ease = leaf2T * leaf2T * (3 - 2 * leaf2T);
    const leaf2Raw = THREE.MathUtils.lerp(0, Math.PI * 0.93, leaf2Ease);
    const leaf2Angle = Math.min(leaf2Raw, Math.max(0, leaf1Angle - 0.08));
    turnLeaf2Pivot.rotation.z = leaf2Angle;
    turnLeaf2Ctrl.setArchAmp(rightArchAmp * Math.cos(leaf2Angle));

    ebLeftPageMat.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.56, bookEase);
    ebRightPageMat.emissiveIntensity = THREE.MathUtils.lerp(0.14, 0.56, bookEase);

    // Darker, high-contrast museum atmosphere on entry so golden focal pools & sconces shine dramatically
    const moodRaw = Math.min(1, Math.max(0, (clamped - 0.42) / 0.46));
    const insideMoodT = moodRaw * moodRaw * (3 - 2 * moodRaw);
    const warmPulse = 1 + 0.045 * Math.sin(elapsed * 1.45);

    hemiLight.intensity = THREE.MathUtils.lerp(1.15, 0.22, insideMoodT);
    skyFillLight.intensity = THREE.MathUtils.lerp(0.58, 0.08, insideMoodT);
    sunLight.intensity = THREE.MathUtils.lerp(2.45, 0.55, insideMoodT);
    activeRenderer.toneMappingExposure = THREE.MathUtils.lerp(
      1.07,
      0.84,
      insideMoodT,
    );

    sceneFog.color.lerpColors(extFogColor, intFogColor, insideMoodT);
    sceneFog.density = THREE.MathUtils.lerp(0.0092, 0.0115, insideMoodT);

    const mistVisibility = Math.max(0, 1 - insideMoodT * 1.1);
    for (const { mesh, baseOpacity } of mistVeilMeshes) {
      mesh.visible = mistVisibility > 0.02;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        baseOpacity * mistVisibility;
    }

    beamMat.opacity = THREE.MathUtils.lerp(0.1, 0.34, insideMoodT) * warmPulse;
    bookSpotLight.intensity = THREE.MathUtils.lerp(26, 74, insideMoodT);
    rearSpotLight.intensity = THREE.MathUtils.lerp(14, 38, insideMoodT);

    const sconceIntensity =
      THREE.MathUtils.lerp(3.5, 13.5, insideMoodT) * warmPulse;
    atriumLeftAccent.intensity = sconceIntensity;
    atriumRightAccent.intensity = sconceIntensity;
    atriumRearLeftAccent.intensity = sconceIntensity;
    atriumRearRightAccent.intensity = sconceIntensity;

    const parallaxWeight = Math.max(0, 1 - ease * 1.5);
    const camX = pointerX * 0.46 * parallaxWeight;
    const camY =
      THREE.MathUtils.lerp(10.2, 4.45, approachEase) +
      THREE.MathUtils.lerp(0, -0.35, bookEase) +
      pointerY * 0.22 * parallaxWeight;
    const camZ = THREE.MathUtils.lerp(34.0, -4.45, ease);

    camera.position.set(camX, camY, camZ);

    const lookY =
      THREE.MathUtils.lerp(9.6, 4.1, approachEase) +
      THREE.MathUtils.lerp(0, -0.48, bookEase);
    const lookZ = THREE.MathUtils.lerp(-1.0, lecternZ, ease);
    camera.lookAt(0, lookY, lookZ);

    activeRenderer.render(scene, camera);
  };

  const getStats = (): MuseumRenderStats => ({
    triangles: activeRenderer.info.render.triangles,
    drawCalls: activeRenderer.info.render.calls,
    geometries: activeRenderer.info.memory.geometries,
    textures: activeRenderer.info.memory.textures,
    isLowPowerDevice,
  });

    activeRenderer.compile(scene, camera);
    update(0, 0, 0, 0);

    await reportStep(100, "Benvenuto in Cogito");

    return { update, resize, dispose, getStats };
  } catch (err) {
    dispose();
    throw err;
  }
}
