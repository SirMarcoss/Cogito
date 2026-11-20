import * as THREE from "three";
import type { OperaNearbyOut } from "../../types/api";
import type { ArchiveVerticalPanelKey } from "../ArchivePanel2DModal";
import {
  createBookLeatherCoverTexture,
  createBrassPlaqueTexture,
  createFloatingPortalSignTexture,
  createOpenBookPageTexture,
  createProjectorSignTexture,
  createQrTotemScreenTexture,
  createRealCataniaOSMTileMapTexture,
  createRelationalGraphWallTexture,
  createSala4ArchiveFolioTexture,
  createSala4AuthorPanelTexture,
  createSala4TerritoryPanelTexture,
  createVerticalSteleTexture,
} from "./canvasArtworks";
import {
  createCanvasWeaveBump,
  createCloudPuffTexture,
  createDarkWalnutTexture,
  createDustMoteTexture,
  createLightBeamTexture,
  createMattePlasterTexture,
  createMoonHaloTexture,
  createMuseumStoneFloorTexture,
  createNightCloudySkyTexture,
  createSlateRoofTexture,
} from "./pbrTextures";

export interface MuseumMaterialPalette {
  floorMat: THREE.MeshStandardMaterial;
  stoneMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  roofSlateMat: THREE.MeshStandardMaterial;
  plasterMainMat: THREE.MeshStandardMaterial;
  plasterArchiveMat: THREE.MeshStandardMaterial;
  plasterOperaMat: THREE.MeshStandardMaterial;
  ceilingMat: THREE.MeshStandardMaterial;
  walnutMat: THREE.MeshStandardMaterial;
  brassMat: THREE.MeshStandardMaterial;
  gildedFrameMat: THREE.MeshStandardMaterial;
  darkBronzeMat: THREE.MeshStandardMaterial;
  leatherMat: THREE.MeshStandardMaterial;
  velvetMat: THREE.MeshStandardMaterial;
  passepartoutMat: THREE.MeshStandardMaterial;
  canvasBump: THREE.CanvasTexture;
  warmBeamTex: THREE.CanvasTexture;
  moonBeamTex: THREE.CanvasTexture;
}

export function createMuseumMaterials(): MuseumMaterialPalette {
  const stoneFloor = createMuseumStoneFloorTexture(7, 7);
  const stoneWarm = createMattePlasterTexture("#8f826f", 4, 2, 7);
  const mainWall = createMattePlasterTexture("#7a6d5a", 5, 2, 6);
  const archiveWall = createMattePlasterTexture("#6a5e4d", 5, 2, 6);
  const operaWall = createMattePlasterTexture("#4a4035", 5, 2, 5);
  const walnut = createDarkWalnutTexture("#452d19", "#28170b", 1, 1);
  const slate = createSlateRoofTexture(8, 6);

  return {
    floorMat: new THREE.MeshStandardMaterial({
      map: stoneFloor.map,
      bumpMap: stoneFloor.bumpMap,
      bumpScale: 0.014,
      roughness: 0.56,
      metalness: 0.04,
    }),
    stoneMat: new THREE.MeshStandardMaterial({
      map: stoneWarm.map,
      bumpMap: stoneWarm.bumpMap,
      bumpScale: 0.018,
      roughness: 0.84,
      metalness: 0.02,
    }),
    trimMat: new THREE.MeshStandardMaterial({
      color: 0x9b8d77,
      roughness: 0.78,
      metalness: 0.04,
    }),
    roofSlateMat: new THREE.MeshStandardMaterial({
      map: slate.map,
      bumpMap: slate.bumpMap,
      bumpScale: 0.024,
      roughness: 0.86,
      metalness: 0.04,
    }),
    plasterMainMat: new THREE.MeshStandardMaterial({
      map: mainWall.map,
      bumpMap: mainWall.bumpMap,
      bumpScale: 0.012,
      roughness: 0.92,
      metalness: 0.01,
    }),
    plasterArchiveMat: new THREE.MeshStandardMaterial({
      map: archiveWall.map,
      bumpMap: archiveWall.bumpMap,
      bumpScale: 0.012,
      roughness: 0.92,
      metalness: 0.01,
    }),
    plasterOperaMat: new THREE.MeshStandardMaterial({
      map: operaWall.map,
      bumpMap: operaWall.bumpMap,
      bumpScale: 0.01,
      roughness: 0.93,
      metalness: 0.02,
    }),
    ceilingMat: new THREE.MeshStandardMaterial({
      color: 0x453b2e,
      roughness: 0.88,
      metalness: 0.02,
    }),
    walnutMat: new THREE.MeshStandardMaterial({
      map: walnut.map,
      bumpMap: walnut.bumpMap,
      bumpScale: 0.014,
      roughness: 0.64,
      metalness: 0.05,
    }),
    brassMat: new THREE.MeshStandardMaterial({
      color: 0xc29d57,
      roughness: 0.34,
      metalness: 0.78,
    }),
    gildedFrameMat: new THREE.MeshStandardMaterial({
      color: 0xb08a42,
      roughness: 0.38,
      metalness: 0.72,
    }),
    darkBronzeMat: new THREE.MeshStandardMaterial({
      color: 0x2c2219,
      roughness: 0.44,
      metalness: 0.65,
    }),
    leatherMat: new THREE.MeshStandardMaterial({
      color: 0x4b1f16,
      roughness: 0.62,
      metalness: 0.05,
    }),
    velvetMat: new THREE.MeshStandardMaterial({
      color: 0x6b181d,
      roughness: 0.9,
      metalness: 0.02,
    }),
    passepartoutMat: new THREE.MeshStandardMaterial({
      color: 0x1e1914,
      roughness: 0.88,
    }),
    canvasBump: createCanvasWeaveBump(),
    warmBeamTex: createLightBeamTexture("255, 224, 168"),
    moonBeamTex: createLightBeamTexture("198, 220, 255"),
  };
}

function createFlutedColumn(
  height: number,
  radius: number,
  stoneMat: THREE.Material,
  trimMat: THREE.Material,
): THREE.Group {
  const col = new THREE.Group();
  const baseH = 0.48;
  const capH = 0.44;
  const shaftH = Math.max(1, height - baseH - capH);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2.8, baseH * 0.6, radius * 2.8),
    stoneMat,
  );
  plinth.position.y = baseH * 0.3;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  const torus = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.15, radius * 1.28, baseH * 0.4, 24),
    stoneMat,
  );
  torus.position.y = baseH * 0.8;

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.88, radius, shaftH, 20),
    stoneMat,
  );
  shaft.position.y = baseH + shaftH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;

  const neckRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, 0.04, 10, 24),
    trimMat,
  );
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = baseH + shaftH;

  const echinus = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.28, radius * 0.88, capH * 0.6, 24),
    stoneMat,
  );
  echinus.position.y = baseH + shaftH + capH * 0.3;

  const abacus = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 2.7, capH * 0.4, radius * 2.7),
    stoneMat,
  );
  abacus.position.y = height - capH * 0.2;

  col.add(plinth, torus, shaft, neckRing, echinus, abacus);
  return col;
}

/** Cornice museale a tre livelli in oro anticato e passepartout scuro. */
function createOrnateFrame(
  w: number,
  h: number,
  goldMat: THREE.Material,
  passepartoutMat?: THREE.Material,
): THREE.Group {
  const frame = new THREE.Group();
  const matPad = passepartoutMat ? 0.22 : 0;
  const innerW = w + matPad;
  const innerH = h + matPad;
  const border = 0.16;
  const depth = 0.16;

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(innerW + border * 2, border, depth),
    goldMat,
  );
  top.position.set(0, innerH / 2 + border / 2, depth / 2);
  const bot = new THREE.Mesh(
    new THREE.BoxGeometry(innerW + border * 2, border, depth),
    goldMat,
  );
  bot.position.set(0, -innerH / 2 - border / 2, depth / 2);
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(border, innerH, depth),
    goldMat,
  );
  left.position.set(-innerW / 2 - border / 2, 0, depth / 2);
  const right = new THREE.Mesh(
    new THREE.BoxGeometry(border, innerH, depth),
    goldMat,
  );
  right.position.set(innerW / 2 + border / 2, 0, depth / 2);
  frame.add(top, bot, left, right);

  if (passepartoutMat) {
    const pp = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, innerH, 0.05),
      passepartoutMat,
    );
    pp.position.set(0, 0, 0.025);
    frame.add(pp);
  }
  return frame;
}

/** Finestra ad architrave modanato con infissi scuri e vetro notturno/caldo + fascio morbido. */
function createFramedWindow(
  mats: MuseumMaterialPalette,
  options: {
    width?: number;
    height?: number;
    glowColor?: number;
    addBeam?: boolean;
    beamOpacity?: number;
  } = {},
): THREE.Group {
  const w = options.width ?? 2.3;
  const h = options.height ?? 4.2;
  const glowColor = options.glowColor ?? 0x2f4364;
  const grp = new THREE.Group();

  // Vetro incassato (mai foro bianco piatto!)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.88,
    }),
  );
  glass.position.z = 0.02;
  grp.add(glass);

  // Telaio e montanti a croce 3D in bronzo scuro
  const outerT = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.34, 0.2, 0.24),
    mats.trimMat,
  );
  outerT.position.set(0, h / 2 + 0.1, 0.06);
  const outerB = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.38, 0.18, 0.3),
    mats.trimMat,
  );
  outerB.position.set(0, -h / 2 - 0.09, 0.08);
  const outerL = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, h, 0.2),
    mats.trimMat,
  );
  outerL.position.set(-w / 2 - 0.08, 0, 0.05);
  const outerR = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, h, 0.2),
    mats.trimMat,
  );
  outerR.position.set(w / 2 + 0.08, 0, 0.05);

  const mullionV = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, h, 0.1),
    mats.darkBronzeMat,
  );
  mullionV.position.set(0, 0, 0.05);
  const mullionH1 = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.08, 0.1),
    mats.darkBronzeMat,
  );
  mullionH1.position.set(0, h * 0.14, 0.05);
  const mullionH2 = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.08, 0.1),
    mats.darkBronzeMat,
  );
  mullionH2.position.set(0, -h * 0.22, 0.05);

  grp.add(outerT, outerB, outerL, outerR, mullionV, mullionH1, mullionH2);

  if (options.addBeam) {
    const beamMat = new THREE.MeshBasicMaterial({
      map: mats.warmBeamTex,
      transparent: true,
      opacity: options.beamOpacity ?? 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, 8.2), beamMat);
    beam.position.set(0, -2.6, 2.3);
    beam.rotation.x = -0.58;
    grp.add(beam);
  }

  return grp;
}

/** Lampadario classico a sospensione ancorato saldamente al soffitto chiuso. */
function createChandelier(
  mats: MuseumMaterialPalette,
  x: number,
  y: number,
  z: number,
  ceilingH: number,
  intensity: number,
  distance: number,
): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);

  const rodLen = Math.max(0.6, ceilingH - y);
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, rodLen, 10),
    mats.darkBronzeMat,
  );
  rod.position.y = rodLen / 2;
  grp.add(rod);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.055, 8, 28),
    mats.brassMat,
  );
  ring.rotation.x = Math.PI / 2;
  grp.add(ring);

  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffdf9e });
  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bulbMat);
    bulb.position.set(Math.cos(ang) * 0.85, 0.12, Math.sin(ang) * 0.85);
    grp.add(bulb);
  }

  const light = new THREE.PointLight(0xffcf88, intensity, distance, 1.55);
  light.position.set(0, -0.3, 0);
  grp.add(light);

  return grp;
}

export interface TerritorySlotRef {
  index: number;
  xPos: number;
  zPos: number;
  group: THREE.Group;
  canvasMat: THREE.MeshStandardMaterial;
  plaqueMat: THREE.MeshBasicMaterial;
  spotLight: THREE.SpotLight;
  opera: OperaNearbyOut | null;
}

export interface ArchiveSteleRef {
  panelKey: ArchiveVerticalPanelKey;
  xPos: number;
  zPos: number;
  group: THREE.Group;
  canvasMat: THREE.MeshStandardMaterial;
  spotLight: THREE.SpotLight;
}

export interface ArchiveBookLecternRef {
  group: THREE.Group;
  bookCoverPivot: THREE.Group;
  leftPageMat: THREE.MeshBasicMaterial;
  rightPageMat: THREE.MeshBasicMaterial;
}

export interface Sala4VitrineRef {
  group: THREE.Group;
  manuscriptGroup: THREE.Group;
  monumentGroup: THREE.Group;
  folioMat: THREE.MeshBasicMaterial;
}

export interface PortalSignRef {
  group: THREE.Group;
  material: THREE.MeshBasicMaterial;
}

export interface DustFieldData {
  points: THREE.Points;
  basePositions: Float32Array;
  phases: Float32Array;
  speed: number;
  amplitude: number;
}

export interface CloudSpriteData {
  mesh: THREE.Sprite;
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
}

export interface BuiltMuseumWorld {
  root: THREE.Group;
  fountainSpray: THREE.Group;
  floatingClouds: CloudSpriteData[];
  dustFields: DustFieldData[];
  qrTotemGroup: THREE.Group;
  leftDoorPivot: THREE.Group;
  rightDoorPivot: THREE.Group;
  portalLeftSign: PortalSignRef;
  portalRightSign: PortalSignRef;
  portalCenterSign: PortalSignRef;
  portalLeftHitArea: THREE.Mesh;
  portalRightHitArea: THREE.Mesh;
  territorySlots: TerritorySlotRef[];
  territoryMapGroup: THREE.Group;
  territoryMapMat: THREE.MeshStandardMaterial;
  bookLectern: ArchiveBookLecternRef;
  archiveSteles: ArchiveSteleRef[];
  relationalGraphGroup: THREE.Group;
  relationalGraphMat: THREE.MeshStandardMaterial;
  sala4Exhibits: {
    artworkGroup: THREE.Group;
    artworkMat: THREE.MeshStandardMaterial;
    artworkPlaqueMat: THREE.MeshBasicMaterial;
    authorGroup: THREE.Group;
    authorMat: THREE.MeshStandardMaterial;
    vitrine: Sala4VitrineRef;
    connectionsGroup: THREE.Group;
    connectionsMat: THREE.MeshStandardMaterial;
    audioStandGroup: THREE.Group;
  };
}

/**
 * Costruisce il museo neoclassico cruciforme sospeso nel vuoto notturno:
 * - Cielo stellato/nuvoloso, Luna + fascio lunare, nuvole fluttuanti, NESSUN albero/prato
 * - Soli Museo e Fontana fluttuanti con lucine calde e polvere luminosa
 * - Soffitti chiusi multi-layer a cassettoni (zero buchi)
 * - Hall Centrale [-14..14 x -26..0], Sala Territorio Ovest [-58..-14], Sala Archivi Est [14..58], Sala Opera Nord [-58..-26]
 */
export function buildContinuousMuseumWorld(
  mats: MuseumMaterialPalette,
): BuiltMuseumWorld {
  const root = new THREE.Group();

  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root,
    castShadow = false,
    receiveShadow = true,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    parent.add(mesh);
    return mesh;
  };

  /** Segmento muro pulito con battiscopa, riquadri boiserie 3D modulari (zero texture tagliate) e cimasa. */
  const buildWallSegment = (
    ax: "x" | "z",
    fix: number,
    start: number,
    end: number,
    height: number,
    wallMat: THREE.Material,
  ) => {
    const len = end - start;
    if (len < 0.08) return;
    const mid = (start + end) / 2;
    const isX = ax === "x";

    const place = (
      span: number,
      hh: number,
      thick: number,
      mat: THREE.Material,
      y: number,
      offsetAlong = 0,
    ) => {
      if (isX) {
        return box(span, hh, thick, mat, mid + offsetAlong, y, fix, root, false, true);
      }
      return box(thick, hh, span, mat, fix, y, mid + offsetAlong, root, false, true);
    };

    // Corpo muro pieno
    place(len, height, 0.42, wallMat, height / 2);
    // Battiscopa in pietra
    place(len, 0.24, 0.54, mats.trimMat, 0.12);
    // Sfondo continuo boiserie inferiore
    place(len, 1.05, 0.48, mats.walnutMat, 0.72);
    // Cimasa boiserie e cornicione sommitale
    place(len, 0.1, 0.58, mats.trimMat, 1.28);
    place(len, 0.36, 0.66, mats.trimMat, height - 0.18);

    // Specchiature boiserie 3D reali (evitano qualsiasi cucitura di texture!)
    const panelStep = 2.6;
    const panelCount = Math.floor(len / panelStep);
    if (panelCount >= 1) {
      const actualStep = len / panelCount;
      for (let i = 0; i < panelCount; i += 1) {
        const off = -len / 2 + actualStep * (i + 0.5);
        place(actualStep * 0.72, 0.64, 0.53, mats.darkBronzeMat, 0.74, off);
        place(actualStep * 0.62, 0.52, 0.55, mats.walnutMat, 0.74, off);
      }
    }
  };

  /** Parete con eventuale apertura centrale (portale). */
  const buildWall = (
    ax: "x" | "z",
    fix: number,
    s: number,
    e: number,
    h: number,
    wallMat: THREE.Material,
    gateCenter?: number,
    gateW = 6,
    gateH = 6.5,
  ) => {
    const isX = ax === "x";
    if (gateCenter === undefined) {
      buildWallSegment(ax, fix, s, e, h, wallMat);
    } else {
      buildWallSegment(ax, fix, s, gateCenter - gateW / 2, h, wallMat);
      buildWallSegment(ax, fix, gateCenter + gateW / 2, e, h, wallMat);

      // Architrave sopra il portale
      const lintelH = h - gateH;
      if (lintelH > 0.1) {
        if (isX) {
          box(gateW, lintelH, 0.44, wallMat, gateCenter, gateH + lintelH / 2, fix);
          box(gateW + 0.4, 0.24, 0.58, mats.brassMat, gateCenter, gateH, fix);
        } else {
          box(0.44, lintelH, gateW, wallMat, fix, gateH + lintelH / 2, gateCenter);
          box(0.58, 0.24, gateW + 0.4, mats.brassMat, fix, gateH, gateCenter);
        }
      }
      // Cornicione continuo lungo tutta la parete
      const total = e - s;
      const mid = (s + e) / 2;
      if (isX) {
        box(total, 0.36, 0.66, mats.trimMat, mid, h - 0.18, fix);
      } else {
        box(0.66, 0.36, total, mats.trimMat, fix, h - 0.18, mid);
      }
    }
  };

  /** Guscio stanza completamente chiuso: pavimento pietra, soffitto a cassettoni 3D, tetto ardesia. */
  const buildRoomShell = (
    x1: number,
    x2: number,
    z1: number,
    z2: number,
    h: number,
  ) => {
    const w = x2 - x1;
    const d = z2 - z1;
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    const floorMat = mats.floorMat.clone();
    if (floorMat.map) {
      floorMat.map = floorMat.map.clone();
      floorMat.map.repeat.set(w / 4.2, d / 4.2);
      floorMat.map.needsUpdate = true;
    }
    if (floorMat.bumpMap) {
      floorMat.bumpMap = floorMat.bumpMap.clone();
      floorMat.bumpMap.repeat.set(w / 4.2, d / 4.2);
      floorMat.bumpMap.needsUpdate = true;
    }

    // Pavimento solido a filo esatto (zero sovrapposizioni z-fighting ai portali)
    box(w, 0.24, d, floorMat, cx, -0.12, cz);

    // Basamento sospeso esterno sotto ogni ala
    box(w, 1.4, d, mats.stoneMat, cx, -0.94, cz);
    box(Math.max(2, w - 1.2), 1.1, Math.max(2, d - 1.2), mats.darkBronzeMat, cx, -2.05, cz);

    // 1° layer soffitto interno chiuso
    box(w, 0.34, d, mats.ceilingMat, cx, h + 0.17, cz);
    // 2° layer tetto ardesia solido + cornicione perimetrale esterno (quote diverse per ala: zero z-fighting)
    box(w + 0.8, 0.5, d + 0.8, mats.roofSlateMat, cx, h + 0.58, cz, root, true, true);
    box(w + 1.2, 0.3, d + 1.2, mats.trimMat, cx, h + 0.32, cz);

    // Cassettoni 3D / travi interne
    const nx = Math.max(2, Math.round(w / 7));
    const nz = Math.max(2, Math.round(d / 7));
    for (let i = 1; i < nx; i += 1) {
      const bx = x1 + (w * i) / nx;
      box(0.28, 0.22, d, mats.walnutMat, bx, h - 0.1, cz);
    }
    for (let j = 1; j < nz; j += 1) {
      const bz = z1 + (d * j) / nz;
      box(w, 0.22, 0.28, mats.walnutMat, cx, h - 0.1, bz);
    }
  };

  // ===========================================================================
  // 1. ESTERNO NOTTURNO SOSPENSIVO: CIELO, LUNA + FASCIO, NUVOLE E SOLO MUSEO + FONTANA
  // ===========================================================================
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(230, 32, 20),
    new THREE.MeshBasicMaterial({
      map: createNightCloudySkyTexture(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  root.add(skyDome);

  // Luna visibile nel cielo notturno in alto a sinistra (libera dal titolo) + alone morbido
  const moonPos = new THREE.Vector3(-32, 30, -34);
  const moonSphere = new THREE.Mesh(
    new THREE.SphereGeometry(4.3, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xf4f8ff, fog: false }),
  );
  moonSphere.position.copy(moonPos);
  root.add(moonSphere);

  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createMoonHaloTexture(),
      color: 0xd6e6ff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  moonHalo.position.copy(moonPos);
  moonHalo.scale.set(24, 24, 1);
  root.add(moonHalo);

  // Luce lunare direzionale + spotlight dedicato verso facciata e fontana
  const moonSpot = new THREE.SpotLight(0xc2d9ff, 210, 150, Math.PI / 4, 0.65, 1.05);
  moonSpot.position.copy(moonPos);
  moonSpot.target.position.set(0, 1.5, 14);
  root.add(moonSpot, moonSpot.target);

  // Luce architettonica morbida frontale affinché colonne e frontone spicchino nella notte
  const facadeWash = new THREE.PointLight(0xffe1b0, 32, 60, 1.35);
  facadeWash.position.set(0, 14, 18);
  root.add(facadeWash);

  // Fascio volumetrico della Luna inclinato verso facciata e fontana
  const beamStart = new THREE.Vector3(-31, 29, -32);
  const beamEnd = new THREE.Vector3(-1, 0.5, 14);
  const beamDir = new THREE.Vector3().subVectors(beamEnd, beamStart);
  const beamLen = beamDir.length();
  const moonBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 17.5, beamLen, 28, 1, true),
    new THREE.MeshBasicMaterial({
      map: mats.moonBeamTex,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  moonBeam.position.copy(beamStart).addScaledVector(beamDir, 0.5);
  moonBeam.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    beamDir.clone().normalize(),
  );
  root.add(moonBeam);

  // Coltri di nuvole soffuse fluttuanti sotto e attorno al museo sospeso nel vuoto
  const cloudTex = createCloudPuffTexture();
  const floatingClouds: CloudSpriteData[] = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.4;
    const radius = i < 12 ? 16 + (i % 4) * 10 : 38 + (i % 6) * 14;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius - 10;
    const cy = -4.2 - (i % 5) * 2.1;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cloudTex,
        transparent: true,
        opacity: i < 12 ? 0.34 : 0.24,
        depthWrite: false,
      }),
    );
    const scale = 26 + (i % 5) * 9;
    sprite.scale.set(scale * 1.45, scale * 0.55, 1);
    sprite.position.set(cx, cy, cz);
    root.add(sprite);
    floatingClouds.push({
      mesh: sprite,
      baseX: cx,
      baseY: cy,
      baseZ: cz,
      speed: 0.08 + (i % 4) * 0.03,
      phase: i * 1.37,
    });
  }

  // Isola/piattaforma sospesa davanti alla facciata + fontana circolare nel vuoto
  box(28.0, 2.0, 7.56, mats.stoneMat, 0, -1.0, 3.8);
  for (let j = 1; j <= 3; j += 1) {
    const stepH = 1.5 - 0.38 * j;
    box(20, stepH, 1.2, mats.stoneMat, 0, -1.6 + stepH / 2, 7.58 + 1.2 * (j - 0.5));
  }
  // Ponte di pietra verso la piazza circolare della fontana
  box(7.8, 1.4, 15.0, mats.stoneMat, 0, -1.3, 14.5);
  box(6.6, 0.3, 14.0, mats.floorMat, 0, -0.45, 14.5);

  const plazaCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(8.2, 6.2, 1.8, 36),
    mats.stoneMat,
  );
  plazaCylinder.position.set(0, -1.35, 24.5);
  plazaCylinder.receiveShadow = true;
  root.add(plazaCylinder);

  const plazaRim = new THREE.Mesh(
    new THREE.TorusGeometry(8.05, 0.24, 10, 36),
    mats.trimMat,
  );
  plazaRim.rotation.x = Math.PI / 2;
  plazaRim.position.set(0, -0.42, 24.5);
  root.add(plazaRim);

  // Fontana classica a due vasche
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, -0.45, 24.5);
  root.add(fountainGroup);

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x3b6c8e,
    roughness: 0.08,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88,
  });
  const basinOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.7, 0.9, 32),
    mats.stoneMat,
  );
  basinOuter.position.y = 0.45;
  const basinWater = new THREE.Mesh(
    new THREE.CylinderGeometry(4.0, 4.0, 0.2, 32),
    waterMat,
  );
  basinWater.position.y = 0.85;
  const fountainPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.65, 2.5, 18),
    mats.stoneMat,
  );
  fountainPillar.position.y = 1.65;
  const upperBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 0.7, 0.55, 24),
    mats.stoneMat,
  );
  upperBowl.position.y = 2.8;
  const upperWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 0.14, 24),
    waterMat,
  );
  upperWater.position.y = 3.04;
  fountainGroup.add(basinOuter, basinWater, fountainPillar, upperBowl, upperWater);

  // Lucina subacquea calda nella fontana
  const fountainGlow = new THREE.PointLight(0x88bfff, 6, 16, 1.6);
  fountainGlow.position.set(0, 1.4, 0);
  fountainGroup.add(fountainGlow);

  const fountainSpray = new THREE.Group();
  const sprayMat = new THREE.MeshBasicMaterial({
    color: 0xdbeeff,
    transparent: true,
    opacity: 0.65,
  });
  for (let i = 0; i < 8; i += 1) {
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.05, 8), sprayMat);
    const a = (i / 8) * Math.PI * 2;
    jet.position.set(Math.cos(a) * 0.24, 3.35, Math.sin(a) * 0.24);
    jet.rotation.z = Math.cos(a) * 0.35;
    jet.rotation.x = Math.sin(a) * 0.35;
    fountainSpray.add(jet);
  }
  fountainGroup.add(fountainSpray);

  // Facciata neoclassica con 6 colonne, frontone, cupola illuminata e lucine calde d'ingresso
  [-11.5, -8.4, -5.3, 5.3, 8.4, 11.5].forEach((cx) => {
    const col = createFlutedColumn(10.6, 0.62, mats.stoneMat, mats.trimMat);
    col.position.set(cx, 0, 5.5);
    root.add(col);
  });
  box(28.4, 1.2, 2.8, mats.trimMat, 0, 11.2, 5.2);
  box(28.0, 0.72, 5.2, mats.trimMat, 0, 11.25, 2.62);
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-14.2, 0);
  pedShape.lineTo(14.2, 0);
  pedShape.lineTo(0, 3.8);
  pedShape.closePath();
  const pediment = new THREE.Mesh(
    new THREE.ExtrudeGeometry(pedShape, { depth: 1.5, bevelEnabled: false }),
    mats.trimMat,
  );
  pediment.position.set(0, 11.8, 3.8);
  root.add(pediment);

  // Cupola centrale e lanterna dorata accesa sopra la Hall Principale
  const domeDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(8.8, 9.2, 1.4, 28),
    mats.trimMat,
  );
  domeDrum.position.set(0, 13.0, -13);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3b5248, roughness: 0.62, metalness: 0.2 }),
  );
  dome.position.set(0, 13.6, -13);
  const lanternBody = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 2.2, 12),
    mats.trimMat,
  );
  lanternBody.position.set(0, 22.8, -13);
  const lanternGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd27d }),
  );
  lanternGlow.position.set(0, 22.8, -13);
  const domeTopLight = new THREE.PointLight(0xffcb78, 12, 28, 1.6);
  domeTopLight.position.set(0, 23.0, -13);
  root.add(domeDrum, dome, lanternBody, lanternGlow, domeTopLight);

  // Lucine calde su viale, portico e finestre esterne per illuminare l'edificio nella notte
  const lanternPositions: [number, number, number][] = [
    [-3.6, 1.0, 18.8],
    [3.6, 1.0, 18.8],
    [-3.6, 1.0, 11.8],
    [3.6, 1.0, 11.8],
    [-4.8, 1.9, 6.2],
    [4.8, 1.9, 6.2],
  ];
  const warmOrbMat = new THREE.MeshBasicMaterial({ color: 0xffd98e });
  lanternPositions.forEach(([lx, ly, lz], idx) => {
    box(0.28, 0.9, 0.28, mats.darkBronzeMat, lx, ly - 0.55, lz);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), warmOrbMat);
    orb.position.set(lx, ly, lz);
    root.add(orb);
    if (idx >= 2) {
      const l = new THREE.PointLight(0xffc970, 8, 15, 1.6);
      l.position.set(lx, ly + 0.1, lz);
      root.add(l);
    }
  });

  // ===========================================================================
  // 2. STRUTTURA CRUCIFORME SOLIDA DEL MUSEO
  // ===========================================================================
  // HALL PRINCIPALE: x ∈ [-14, 14], z ∈ [-26, 0], h = 12
  buildRoomShell(-14, 14, -26, 0, 12);
  buildWall("x", 0, -14, 14, 12, mats.plasterMainMat, 0, 8, 7.2);
  buildWall("x", -26, -14, 14, 12, mats.plasterMainMat, 0, 6, 6.5);
  buildWall("z", -14, -26, 0, 12, mats.plasterMainMat, -13, 6, 6.5);
  buildWall("z", 14, -26, 0, 12, mats.plasterMainMat, -13, 6, 6.5);

  // SALA TERRITORIO (Ala Ovest): x ∈ [-58, -14], z ∈ [-19, -7], h = 8
  buildRoomShell(-58, -14, -19, -7, 8);
  buildWall("x", -19, -58, -14, 8, mats.plasterMainMat);
  buildWall("x", -7, -58, -14, 8, mats.plasterMainMat);
  buildWall("z", -58, -19, -7, 8, mats.plasterMainMat);

  // SALA ARCHIVI (Ala Est): x ∈ [14, 58], z ∈ [-19, -7], h = 8
  buildRoomShell(14, 58, -19, -7, 8);
  buildWall("x", -19, 14, 58, 8, mats.plasterArchiveMat);
  buildWall("x", -7, 14, 58, 8, mats.plasterArchiveMat);
  buildWall("z", 58, -19, -7, 8, mats.plasterArchiveMat);

  // SALA OPERA (Santuario Nord): x ∈ [-14, 14], z ∈ [-58, -26], h = 10
  buildRoomShell(-14, 14, -58, -26, 10);
  buildWall("x", -58, -14, 14, 10, mats.plasterOperaMat);
  buildWall("z", -14, -58, -26, 10, mats.plasterOperaMat);
  buildWall("z", 14, -58, -26, 10, mats.plasterOperaMat);

  // Lampadari caldi morbidi e contenuti (atmosfera museale scura ed elegante)
  root.add(
    createChandelier(mats, 0, 9.2, -13, 12, 26, 42),
    createChandelier(mats, -30, 6.1, -13, 8, 16, 30),
    createChandelier(mats, -46, 6.1, -13, 8, 16, 30),
    createChandelier(mats, 30, 6.1, -13, 8, 16, 30),
    createChandelier(mats, 46, 6.1, -13, 8, 16, 30),
    createChandelier(mats, 0, 7.6, -42, 10, 18, 34),
  );

  // Finestre incassate con infissi 3D, luce calda/lunare e raggi morbidi (sia dentro che visibili fuori)
  const placeWindow = (
    x: number,
    y: number,
    z: number,
    ry: number,
    glow: number,
    beam: boolean,
  ) => {
    const win = createFramedWindow(mats, { glowColor: glow, addBeam: beam, beamOpacity: 0.12 });
    win.position.set(x, y, z);
    win.rotation.y = ry;
    root.add(win);
  };
  // Facciata Sud (visibile sia da Hall che dall'esterno come lucine calde)
  placeWindow(-9.0, 5.4, 0.25, 0, 0xf2bf66, false);
  placeWindow(9.0, 5.4, 0.25, 0, 0xf2bf66, false);
  placeWindow(-9.0, 5.4, -0.25, Math.PI, 0x3b4d6e, true);
  placeWindow(9.0, 5.4, -0.25, Math.PI, 0x3b4d6e, true);
  // Finestre esterne calde sulle ali Ovest/Est
  [-28, -42, 28, 42].forEach((wx) => {
    placeWindow(wx, 4.4, -6.74, 0, 0xf2bd63, false);
    placeWindow(wx, 4.4, -19.26, Math.PI, 0xf2bd63, false);
  });
  // Finestre alte interne in Sala Opera
  placeWindow(-13.72, 6.0, -35, Math.PI / 2, 0x354764, true);
  placeWindow(-13.72, 6.0, -51, Math.PI / 2, 0x354764, true);
  placeWindow(13.72, 6.0, -35, -Math.PI / 2, 0x354764, true);
  placeWindow(13.72, 6.0, -51, -Math.PI / 2, 0x354764, true);

  // Colonne interne davanti all'ingresso Nord della Hall
  [-6.2, 6.2].forEach((cx) => {
    const col = createFlutedColumn(11.6, 0.72, mats.stoneMat, mats.trimMat);
    col.position.set(cx, 0, -24.2);
    root.add(col);
  });

  // ===========================================================================
  // 3. SEGNALETICA HALL, PORTONE LIGNEO PERSISTENTE & TOTEM QR
  // ===========================================================================
  const buildFloatingSign = (
    opts: { eyebrow: string; title: string; subtitle: string; arrow: "left" | "right" | "center" },
    x: number,
    y: number,
    z: number,
    ry: number,
    w = 6.2,
  ): PortalSignRef => {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    root.add(grp);

    const tex = createFloatingPortalSignTexture(opts);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.365), mat);
    grp.add(plane);
    return { group: grp, material: mat };
  };

  const portalLeftSign = buildFloatingSign(
    {
      eyebrow: "Ala Occidentale",
      title: "Sala Territorio",
      subtitle: "Opere vicine e mappa reale di Catania",
      arrow: "left",
    },
    -10.2,
    3.55,
    -13.0,
    Math.PI / 4,
  );
  const portalRightSign = buildFloatingSign(
    {
      eyebrow: "Ala Orientale",
      title: "Sala Archivi",
      subtitle: "Leggio, fonti storiche e grafo",
      arrow: "right",
    },
    10.2,
    3.55,
    -13.0,
    -Math.PI / 4,
  );
  const portalCenterSign = buildFloatingSign(
    {
      eyebrow: "Santuario Centrale",
      title: "Sala Opera",
      subtitle: "Esposizione singola · usa il Totem QR",
      arrow: "center",
    },
    0,
    4.6,
    -23.2,
    0,
    5.8,
  );

  const portalLeftHitArea = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 6.2, 6.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  portalLeftHitArea.position.set(-13.8, 3.1, -13.0);
  root.add(portalLeftHitArea);

  const portalRightHitArea = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 6.2, 6.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  portalRightHitArea.position.set(13.8, 3.1, -13.0);
  root.add(portalRightHitArea);

  // Segnaletica non cliccabile stile proiettore museale sulle colonne/parete Nord della Hall
  const makeProjector = (
    eyebrow: string,
    title: string,
    arrow: "left" | "right",
    x: number,
    y: number,
    z: number,
  ) => {
    const tex = createProjectorSignTexture({ eyebrow, title, arrow });
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.15),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
    );
    p.position.set(x, y, z);
    root.add(p);
  };
  makeProjector("Direzione", "Cartina Territorio", "left", -6.2, 4.9, -23.1);
  makeProjector("Direzione", "QR Code & Archivi", "right", 6.2, 4.9, -23.1);

  // Portone ligneo a doppia anta a z = -26 (si apre verso -Z = Sala Opera)
  const leftDoorPivot = new THREE.Group();
  leftDoorPivot.position.set(-3.0, 0, -26.0);
  root.add(leftDoorPivot);
  box(3.0, 6.45, 0.28, mats.walnutMat, 1.5, 3.225, 0, leftDoorPivot, true, true);
  box(2.3, 2.4, 0.34, mats.darkBronzeMat, 1.5, 4.4, 0, leftDoorPivot);
  box(2.3, 2.2, 0.34, mats.darkBronzeMat, 1.5, 1.55, 0, leftDoorPivot);
  box(0.14, 0.55, 0.44, mats.brassMat, 2.68, 3.1, 0, leftDoorPivot);

  const rightDoorPivot = new THREE.Group();
  rightDoorPivot.position.set(3.0, 0, -26.0);
  root.add(rightDoorPivot);
  box(3.0, 6.45, 0.28, mats.walnutMat, -1.5, 3.225, 0, rightDoorPivot, true, true);
  box(2.3, 2.4, 0.34, mats.darkBronzeMat, -1.5, 4.4, 0, rightDoorPivot);
  box(2.3, 2.2, 0.34, mats.darkBronzeMat, -1.5, 1.55, 0, rightDoorPivot);
  box(0.14, 0.55, 0.44, mats.brassMat, -2.68, 3.1, 0, rightDoorPivot);

  // Totem QR d'accoglienza (orientato verso il centro Hall e verso il waypoint close-up QR!)
  const qrTotemGroup = new THREE.Group();
  qrTotemGroup.position.set(5.2, 0, -17.5);
  qrTotemGroup.rotation.y = -0.78;
  root.add(qrTotemGroup);

  box(1.55, 0.26, 0.9, mats.brassMat, 0, 0.13, 0, qrTotemGroup);
  box(1.28, 2.55, 0.52, mats.darkBronzeMat, 0, 1.48, 0, qrTotemGroup);
  box(1.4, 0.12, 0.64, mats.brassMat, 0, 2.8, 0, qrTotemGroup);
  box(1.18, 0.9, 0.08, mats.brassMat, 0, 1.82, 0.27, qrTotemGroup);
  const qrScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 0.78),
    new THREE.MeshBasicMaterial({ map: createQrTotemScreenTexture() }),
  );
  qrScreen.position.set(0, 1.82, 0.32);
  qrTotemGroup.add(qrScreen);
  const qrLamp = new THREE.PointLight(0xffd788, 7, 10, 1.6);
  qrLamp.position.set(4.1, 3.2, -16.2);
  root.add(qrLamp);

  // ===========================================================================
  // 4. SALA TERRITORIO (ALA OVEST: x ∈ [-58, -14], z ∈ [-19, -7])
  // ===========================================================================
  const territoryCoords: { x: number; side: "N" | "S" }[] = [
    { x: -21.5, side: "N" },
    { x: -26.5, side: "S" },
    { x: -31.5, side: "N" },
    { x: -36.5, side: "S" },
    { x: -41.5, side: "N" },
    { x: -46.5, side: "S" },
    { x: -50.8, side: "N" },
  ];

  const territorySlots: TerritorySlotRef[] = territoryCoords.map((cfg, idx) => {
    const g = new THREE.Group();
    const isNorth = cfg.side === "N";
    const zPos = isNorth ? -18.72 : -7.28;
    g.position.set(cfg.x, 3.35, zPos);
    g.rotation.y = isNorth ? 0 : Math.PI;
    root.add(g);

    const frame = createOrnateFrame(3.4, 2.5, mats.gildedFrameMat, mats.passepartoutMat);
    g.add(frame);

    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.74,
      metalness: 0.02,
      bumpMap: mats.canvasBump,
      bumpScale: 0.008,
    });
    const artMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.5), canvasMat);
    artMesh.position.z = 0.08;
    g.add(artMesh);

    const plaqueMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.44), plaqueMat);
    plaque.position.set(0, -1.78, 0.05);
    g.add(plaque);

    const spotLight = new THREE.SpotLight(0xffdfb0, 14, 15, Math.PI / 5, 0.5, 1.3);
    spotLight.position.set(cfg.x, 7.2, isNorth ? -15.4 : -10.6);
    spotLight.target = artMesh;
    root.add(spotLight);

    return {
      index: idx,
      xPos: cfg.x,
      zPos,
      group: g,
      canvasMat,
      plaqueMat,
      spotLight,
      opera: null,
    };
  });

  // Grande Mappa Reale OSM di Catania sulla parete finale Ovest (x = -57.72)
  const territoryMapGroup = new THREE.Group();
  territoryMapGroup.position.set(-57.72, 3.65, -13.0);
  territoryMapGroup.rotation.y = Math.PI / 2;
  root.add(territoryMapGroup);
  territoryMapGroup.add(
    createOrnateFrame(8.8, 5.4, mats.gildedFrameMat, mats.passepartoutMat),
  );
  const territoryMapMat = new THREE.MeshStandardMaterial({
    map: createRealCataniaOSMTileMapTexture([]),
    roughness: 0.65,
    metalness: 0.02,
  });
  const mapPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 5.4), territoryMapMat);
  mapPlane.position.z = 0.08;
  territoryMapGroup.add(mapPlane);
  const mapSpot = new THREE.SpotLight(0xffe4b8, 22, 18, Math.PI / 3.6, 0.45, 1.2);
  mapSpot.position.set(-51.5, 7.2, -13.0);
  mapSpot.target = mapPlane;
  root.add(mapSpot);

  // ===========================================================================
  // 5. SALA ARCHIVI (ALA EST: x ∈ [14, 58], z ∈ [-19, -7])
  // ===========================================================================
  // Leggio Centrale Alto a x = 21.5 con Libro 3D chiuso che si apre davanti alla camera
  const lecternGroup = new THREE.Group();
  lecternGroup.position.set(21.5, 0, -13.0);
  lecternGroup.rotation.y = -Math.PI / 2;
  root.add(lecternGroup);

  box(1.5, 0.24, 1.4, mats.brassMat, 0, 0.12, 0, lecternGroup);
  const colMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.34, 1.24, 18),
    mats.walnutMat,
  );
  colMesh.position.y = 0.86;
  lecternGroup.add(colMesh);

  const bookTilt = new THREE.Group();
  bookTilt.position.set(0, 1.54, 0);
  bookTilt.rotation.x = 0.36;
  lecternGroup.add(bookTilt);

  box(2.05, 0.1, 1.38, mats.walnutMat, 0, -0.06, 0, bookTilt);

  const leftPageMat = new THREE.MeshBasicMaterial({
    map: createOpenBookPageTexture("left", null),
  });
  const rightPageMat = new THREE.MeshBasicMaterial({
    map: createOpenBookPageTexture("right", null),
  });
  const coverMat = new THREE.MeshBasicMaterial({
    map: createBookLeatherCoverTexture(),
  });

  // Parte destra del libro (fissa sul leggio)
  box(0.86, 0.06, 1.06, mats.leatherMat, 0.45, 0.025, 0, bookTilt);
  const rPageMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), rightPageMat);
  rPageMesh.rotation.x = -Math.PI / 2;
  rPageMesh.position.set(0.45, 0.062, 0);
  bookTilt.add(rPageMesh);

  // Anta/copertina sinistra con perno alla rilegatura: a -Math.PI è chiusa sopra il libro!
  const bookCoverPivot = new THREE.Group();
  bookCoverPivot.position.set(0, 0.062, 0);
  bookCoverPivot.rotation.z = -Math.PI;
  bookTilt.add(bookCoverPivot);

  box(0.86, 0.055, 1.06, mats.leatherMat, -0.45, 0, 0, bookCoverPivot);
  const lPageMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), leftPageMat);
  lPageMesh.rotation.x = -Math.PI / 2;
  lPageMesh.position.set(-0.45, 0.032, 0);
  bookCoverPivot.add(lPageMesh);

  const frontCoverMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.06), coverMat);
  frontCoverMesh.rotation.x = Math.PI / 2;
  frontCoverMesh.rotation.z = Math.PI;
  frontCoverMesh.position.set(-0.45, -0.032, 0);
  bookCoverPivot.add(frontCoverMesh);

  const lecternSpot = new THREE.SpotLight(0xffdfb0, 18, 14, Math.PI / 5, 0.5, 1.2);
  lecternSpot.position.set(20.6, 6.2, -13.0);
  lecternSpot.target = lecternGroup;
  root.add(lecternSpot);

  // 3 Stele Verticali lungo la Sala Archivi
  const steleSpecs: { key: ArchiveVerticalPanelKey; x: number; z: number; ry: number }[] = [
    { key: "descrizione", x: 32.5, z: -17.9, ry: 0 },
    { key: "archivio", x: 39.5, z: -8.1, ry: Math.PI },
    { key: "narrazione", x: 46.5, z: -17.9, ry: 0 },
  ];

  const archiveSteles: ArchiveSteleRef[] = steleSpecs.map((spec) => {
    const g = new THREE.Group();
    g.position.set(spec.x, 0, spec.z);
    g.rotation.y = spec.ry;
    root.add(g);

    box(2.5, 0.28, 0.72, mats.trimMat, 0, 0.14, 0, g);
    box(2.25, 4.45, 0.46, mats.stoneMat, 0, 2.5, 0, g);
    box(2.38, 0.24, 0.64, mats.brassMat, 0, 4.82, 0, g);

    const canvasMat = new THREE.MeshStandardMaterial({
      map: createVerticalSteleTexture({
        badge: "Sala Archivi • Registro Storico",
        heading: "Invito Curatoriale",
        body: "Consulta il Leggio Centrale per selezionare un'opera e visualizzarne le fonti.",
      }),
      roughness: 0.7,
      metalness: 0.02,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.25), canvasMat);
    plane.position.set(0, 2.65, 0.25);
    g.add(plane);

    const spotLight = new THREE.SpotLight(0xffdfb0, 16, 15, Math.PI / 5, 0.5, 1.3);
    spotLight.position.set(spec.x, 7.0, spec.z + (spec.ry === 0 ? 3.2 : -3.2));
    spotLight.target = plane;
    root.add(spotLight);

    return {
      panelKey: spec.key,
      xPos: spec.x,
      zPos: spec.z,
      group: g,
      canvasMat,
      spotLight,
    };
  });

  // Tela finale Est: Grafo Relazionale (x = 57.72)
  const relationalGraphGroup = new THREE.Group();
  relationalGraphGroup.position.set(57.72, 3.65, -13.0);
  relationalGraphGroup.rotation.y = -Math.PI / 2;
  root.add(relationalGraphGroup);
  relationalGraphGroup.add(
    createOrnateFrame(8.8, 5.2, mats.gildedFrameMat, mats.passepartoutMat),
  );
  const relationalGraphMat = new THREE.MeshStandardMaterial({
    map: createRelationalGraphWallTexture(null, []),
    roughness: 0.62,
    metalness: 0.04,
  });
  const graphPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 5.2), relationalGraphMat);
  graphPlane.position.z = 0.08;
  relationalGraphGroup.add(graphPlane);
  const graphSpot = new THREE.SpotLight(0xffe0ad, 20, 18, Math.PI / 3.6, 0.45, 1.2);
  graphSpot.position.set(51.5, 7.2, -13.0);
  graphSpot.target = graphPlane;
  root.add(graphSpot);

  // ===========================================================================
  // 6. SALA OPERA (SANTUARIO NORD: x ∈ [-14, 14], z ∈ [-58, -26])
  // ===========================================================================
  // Opera principale sulla parete Nord (z = -57.68)
  const artworkGroup = new THREE.Group();
  artworkGroup.position.set(0, 4.35, -57.68);
  root.add(artworkGroup);
  artworkGroup.add(createOrnateFrame(6.8, 5.0, mats.gildedFrameMat, mats.passepartoutMat));
  const artworkMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    bumpMap: mats.canvasBump,
    bumpScale: 0.008,
  });
  const heroArtMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 5.0), artworkMat);
  heroArtMesh.position.z = 0.08;
  artworkGroup.add(heroArtMesh);

  const artworkPlaqueMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const heroPlaque = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), artworkPlaqueMat);
  heroPlaque.position.set(0, -3.1, 0.06);
  artworkGroup.add(heroPlaque);

  const heroSpot = new THREE.SpotLight(0xffe2b5, 28, 22, Math.PI / 4.2, 0.45, 1.2);
  heroSpot.position.set(0, 8.8, -48.5);
  heroSpot.target = heroArtMesh;
  root.add(heroSpot);

  // Transenne in ottone e velluto davanti all'opera principale
  const postCoords: [number, number][] = [
    [-4.2, -52.2],
    [4.2, -52.2],
    [-4.2, -55.4],
    [4.2, -55.4],
  ];
  postCoords.forEach(([px, pz]) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.08, 12),
      mats.brassMat,
    );
    post.position.set(px, 0.54, pz);
    root.add(post);
    box(0.36, 0.05, 0.36, mats.brassMat, px, 0.025, pz);
  });
  box(8.4, 0.045, 0.045, mats.velvetMat, 0, 0.96, -52.2);
  box(0.045, 0.045, 3.2, mats.velvetMat, -4.2, 0.96, -53.8);
  box(0.045, 0.045, 3.2, mats.velvetMat, 4.2, 0.96, -53.8);

  // Pannello Autore & Info sulla parete destra (+X)
  const authorGroup = new THREE.Group();
  authorGroup.position.set(13.68, 3.85, -44.0);
  authorGroup.rotation.y = -Math.PI / 2;
  root.add(authorGroup);
  authorGroup.add(createOrnateFrame(5.2, 3.6, mats.gildedFrameMat, mats.passepartoutMat));
  const authorMat = new THREE.MeshStandardMaterial({
    map: createSala4AuthorPanelTexture(null),
    roughness: 0.72,
  });
  const authorPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.6), authorMat);
  authorPlane.position.z = 0.08;
  authorGroup.add(authorPlane);
  const authorSpot = new THREE.SpotLight(0xffe0ad, 16, 16, Math.PI / 4.5, 0.5, 1.3);
  authorSpot.position.set(8.5, 7.6, -44.0);
  authorSpot.target = authorPlane;
  root.add(authorSpot);

  // Teca d'Archivio in vetro sulla sinistra (-7.2, 0, -47.0)
  const vitrineGroup = new THREE.Group();
  vitrineGroup.position.set(-7.2, 0, -47.0);
  vitrineGroup.rotation.y = Math.PI / 5;
  root.add(vitrineGroup);
  box(1.75, 1.05, 1.55, mats.walnutMat, 0, 0.525, 0, vitrineGroup);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdcebf2,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity: 0.24,
  });
  box(1.62, 1.3, 1.42, glassMat, 0, 1.7, 0, vitrineGroup);
  box(1.72, 0.08, 1.52, mats.brassMat, 0, 2.38, 0, vitrineGroup);

  const manuscriptGroup = new THREE.Group();
  manuscriptGroup.position.set(0, 1.2, 0);
  vitrineGroup.add(manuscriptGroup);
  const folioMat = new THREE.MeshBasicMaterial({
    map: createSala4ArchiveFolioTexture(null),
  });
  const folioMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.15), folioMat);
  folioMesh.rotation.x = -0.68;
  folioMesh.position.set(0, 0.18, 0.05);
  manuscriptGroup.add(folioMesh);

  const monumentGroup = new THREE.Group();
  monumentGroup.position.set(0, 1.08, 0);
  monumentGroup.visible = false;
  vitrineGroup.add(monumentGroup);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.3, 16), mats.stoneMat);
  ped.position.y = 0.15;
  const bust = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), mats.brassMat);
  bust.position.y = 0.6;
  monumentGroup.add(ped, bust);

  const vitrineSpot = new THREE.SpotLight(0xffe0ad, 16, 12, Math.PI / 5, 0.5, 1.3);
  vitrineSpot.position.set(-7.2, 5.5, -44.8);
  vitrineSpot.target = vitrineGroup;
  root.add(vitrineSpot);

  // Tela sinistra Connessioni & Ente (parete Ovest -13.68)
  const connectionsGroup = new THREE.Group();
  connectionsGroup.position.set(-13.68, 3.85, -42.0);
  connectionsGroup.rotation.y = Math.PI / 2;
  root.add(connectionsGroup);
  connectionsGroup.add(
    createOrnateFrame(5.2, 3.6, mats.gildedFrameMat, mats.passepartoutMat),
  );
  const connectionsMat = new THREE.MeshStandardMaterial({
    map: createSala4TerritoryPanelTexture(null, []),
    roughness: 0.72,
  });
  const connectionsPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.6), connectionsMat);
  connectionsPlane.position.z = 0.08;
  connectionsGroup.add(connectionsPlane);
  const connSpot = new THREE.SpotLight(0xffe0ad, 16, 16, Math.PI / 4.5, 0.5, 1.3);
  connSpot.position.set(-8.5, 7.6, -42.0);
  connSpot.target = connectionsPlane;
  root.add(connSpot);

  // Colonnina Audioguida lato sinistro (-8.0, 0, -35.0)
  const audioStandGroup = new THREE.Group();
  audioStandGroup.position.set(-8.0, 0, -35.0);
  audioStandGroup.rotation.y = Math.PI / 3;
  root.add(audioStandGroup);
  box(1.15, 0.14, 0.72, mats.brassMat, 0, 0.07, 0, audioStandGroup);
  box(0.88, 1.12, 0.44, mats.darkBronzeMat, 0, 0.7, 0, audioStandGroup);
  const audioPlaqueTex = createBrassPlaqueTexture("Audioguida AI", "Ascolta in sala");
  const audioPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(0.76, 0.28),
    new THREE.MeshBasicMaterial({ map: audioPlaqueTex }),
  );
  audioPlaque.position.set(0, 1.15, 0.24);
  audioPlaque.rotation.x = -0.35;
  audioStandGroup.add(audioPlaque);

  // Poltroncina Museale in velluto bordeaux al centro (0, 0, -41.2) rivolta a -Z
  const chair = new THREE.Group();
  chair.position.set(0, 0, -41.2);
  root.add(chair);
  box(1.45, 0.44, 1.25, mats.velvetMat, 0, 0.55, 0, chair);
  box(1.45, 0.98, 0.26, mats.velvetMat, 0, 1.18, 0.52, chair);
  box(0.22, 0.46, 1.18, mats.velvetMat, -0.78, 0.84, 0, chair);
  box(0.22, 0.46, 1.18, mats.velvetMat, 0.78, 0.84, 0, chair);
  [-0.6, 0.6].forEach((lx) =>
    [-0.48, 0.48].forEach((lz) => {
      box(0.1, 0.34, 0.1, mats.brassMat, lx, 0.17, lz, chair);
    }),
  );

  // ===========================================================================
  // 7. EFFETTO POLVERE LUMINOSA FLUTTUANTE NELLA LUCE (Esterno + Tutte le Sale)
  // ===========================================================================
  const dustTex = createDustMoteTexture();
  const buildDustField = (
    zones: { min: [number, number, number]; max: [number, number, number]; count: number }[],
    size: number,
    palette: number[],
    opacity: number,
    speed: number,
    amplitude: number,
  ): DustFieldData => {
    const total = zones.reduce((acc, z) => acc + z.count, 0);
    const pos = new Float32Array(total * 3);
    const basePositions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const phases = new Float32Array(total);
    let offset = 0;

    zones.forEach((zone) => {
      for (let i = 0; i < zone.count; i += 1) {
        const px = zone.min[0] + Math.random() * (zone.max[0] - zone.min[0]);
        const py = zone.min[1] + Math.random() * (zone.max[1] - zone.min[1]);
        const pz = zone.min[2] + Math.random() * (zone.max[2] - zone.min[2]);
        pos[offset * 3] = basePositions[offset * 3] = px;
        pos[offset * 3 + 1] = basePositions[offset * 3 + 1] = py;
        pos[offset * 3 + 2] = basePositions[offset * 3 + 2] = pz;

        const c = new THREE.Color(palette[offset % palette.length]);
        colors[offset * 3] = c.r;
        colors[offset * 3 + 1] = c.g;
        colors[offset * 3 + 2] = c.b;
        phases[offset] = Math.random() * Math.PI * 2;
        offset += 1;
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: dustTex,
      vertexColors: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    root.add(points);
    return { points, basePositions, phases, speed, amplitude };
  };

  const dustFields: DustFieldData[] = [
    // Bruma / pulviscolo lunare nell'esterno sopra fontana e raggio della Luna
    buildDustField(
      [
        { min: [-18, 0.5, 4], max: [14, 16, 32], count: 260 },
        { min: [-24, 8, -24], max: [-2, 22, 10], count: 140 },
      ],
      0.32,
      [0xdfeaff, 0xffebc2, 0xc7daff],
      0.58,
      0.42,
      0.45,
    ),
    // Polvere dorata atmosferica dentro i fasci di luce delle 4 sale interne
    buildDustField(
      [
        { min: [-12, 0.8, -24], max: [12, 9.5, -2], count: 260 }, // Hall Principale
        { min: [-55, 0.8, -18], max: [-16, 6.8, -8], count: 220 }, // Sala Territorio
        { min: [16, 0.8, -18], max: [55, 6.8, -8], count: 240 }, // Sala Archivi (sopra leggio e stele)
        { min: [-12, 0.8, -56], max: [12, 8.2, -28], count: 260 }, // Sala Opera
      ],
      0.16,
      [0xffe8b0, 0xf2cf82, 0xfff6dc],
      0.68,
      0.65,
      0.24,
    ),
  ];

  return {
    root,
    fountainSpray,
    floatingClouds,
    dustFields,
    qrTotemGroup,
    leftDoorPivot,
    rightDoorPivot,
    portalLeftSign,
    portalRightSign,
    portalCenterSign,
    portalLeftHitArea,
    portalRightHitArea,
    territorySlots,
    territoryMapGroup,
    territoryMapMat,
    bookLectern: {
      group: lecternGroup,
      bookCoverPivot,
      leftPageMat,
      rightPageMat,
    },
    archiveSteles,
    relationalGraphGroup,
    relationalGraphMat,
    sala4Exhibits: {
      artworkGroup,
      artworkMat,
      artworkPlaqueMat,
      authorGroup,
      authorMat,
      vitrine: {
        group: vitrineGroup,
        manuscriptGroup,
        monumentGroup,
        folioMat,
      },
      connectionsGroup,
      connectionsMat,
      audioStandGroup,
    },
  };
}
