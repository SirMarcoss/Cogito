import * as THREE from "three";
import {
  applyAntiTilingShader,
  createCarpetRunnerTexture,
  createClassicalPaintingTexture,
  createClockFaceTexture,
  createContactShadowTexture,
  createHeroBookCoverPBR,
  createHeroBookPageTexture,
  createMuseumFriezePlaqueTexture,
  createPiazzaMedallionTexture,
  createPlazaPBR,
  createTravertinePBR,
  createVeinedMarblePBR,
  createVerticalAoGradientTexture,
  createVolumetricBeamTexture,
} from "./museumTextures";

export interface MuseumRenderStats {
  triangles: number;
  drawCalls: number;
  geometries: number;
  textures: number;
  isLowPowerDevice: boolean;
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
    const u =
      side === "right"
        ? (x + width / 2) / width
        : (width / 2 - x) / width;
    const archY = Math.sin(Math.pow(u, 0.75) * Math.PI) * archAmp;
    pos.setY(i, archY);
  }
  geo.computeVertexNormals();
  return geo;
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

function createMediterraneanPlanter(
  stoneMat: THREE.Material,
  foliageMat: THREE.Material,
  trunkMat: THREE.Material,
  contactShadowMat: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    contactShadowMat,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const planter = new THREE.Mesh(
    createBeveledBoxGeometry(1.75, 0.85, 1.75, 0.035),
    stoneMat,
  );
  planter.position.y = 0.425;
  planter.castShadow = true;
  planter.receiveShadow = true;
  group.add(planter);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.16, 1.5, 10),
    trunkMat,
  );
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);

  // Sculpted cypress / Mediterranean topiary cones
  [
    [0, 2.7, 0, 0.78, 2.2],
    [0, 3.85, 0, 0.56, 1.7],
    [0, 4.75, 0, 0.34, 1.1],
  ].forEach(([x, y, z, r, h]) => {
    const puff = new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), foliageMat);
    puff.position.set(x, y, z);
    puff.castShadow = true;
    group.add(puff);
  });

  return group;
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
): THREE.Group {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    createBeveledBoxGeometry(width + 0.26, height + 0.26, 0.14, 0.025),
    goldMat,
  );
  group.add(frame);

  // Subtle self-illumination via emissiveMap so museum artworks are vivid & readable even indoors!
  const canvasMat = new THREE.MeshStandardMaterial({
    map: paintingTex,
    emissive: "#FFF2DA",
    emissiveMap: paintingTex,
    emissiveIntensity: 0.32,
    roughness: 0.4,
    metalness: 0.02,
  });

  const canvasMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    canvasMat,
  );
  canvasMesh.position.z = 0.074;
  group.add(canvasMesh);

  // Brass picture-light bar above frame
  const lightBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, width * 0.56, 10),
    goldMat,
  );
  lightBar.rotation.z = Math.PI / 2;
  lightBar.position.set(0, height / 2 + 0.28, 0.22);
  group.add(lightBar);

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

export function buildNeoclassicalMuseum(
  canvas: HTMLCanvasElement,
): NeoclassicalMuseumHandle {
  const isLowPowerDevice = detectLowPowerDevice();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, isLowPowerDevice ? 1.5 : 2),
  );
  const w0 = canvas.clientWidth || window.innerWidth;
  const h0 = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w0, h0, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.07;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#FAF6EE", 0.0058);

  const envTexture = createEnvironmentMap(renderer);
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
  sunLight.shadow.camera.far = 96;
  sunLight.shadow.camera.left = -28;
  sunLight.shadow.camera.right = 28;
  sunLight.shadow.camera.top = 28;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.bias = -0.00035;
  scene.add(sunLight);

  const skyFillLight = new THREE.DirectionalLight("#DCE6F5", 0.58);
  skyFillLight.position.set(-22, 16, 15);
  scene.add(skyFillLight);

  // Warm interior lights inside atrium + book spotlight + wing galleries
  const atriumLight = new THREE.PointLight("#FFE5B4", 12.0, 38, 1.2);
  atriumLight.position.set(0, 6.9, -6.2);
  scene.add(atriumLight);

  const bookSpotLight = new THREE.SpotLight(
    "#FFE09E",
    18,
    18,
    Math.PI / 3.8,
    0.55,
    1.1,
  );
  bookSpotLight.position.set(0, 7.8, -5.0);
  bookSpotLight.target.position.set(0, 3.3, -6.6);
  scene.add(bookSpotLight);
  scene.add(bookSpotLight.target);

  const leftWingLight = new THREE.PointLight("#FFE0A3", 7.4, 20, 1.25);
  leftWingLight.position.set(-9.6, 6.1, -0.8);
  scene.add(leftWingLight);

  const rightWingLight = new THREE.PointLight("#FFE0A3", 7.4, 20, 1.25);
  rightWingLight.position.set(9.6, 6.1, -0.8);
  scene.add(rightWingLight);

  // =========================================================================
  // PBR TEXTURES & MATERIALS
  // =========================================================================
  const travertine = createTravertinePBR(3, 2);
  const plazaPBR = createPlazaPBR();
  const marblePBR = createVeinedMarblePBR();
  const piazzaMedallionTex = createPiazzaMedallionTexture();
  const carpetRunnerTex = createCarpetRunnerTexture();
  const clockFaceTex = createClockFaceTexture();
  const contactShadowTex = createContactShadowTexture();
  const verticalAoTex = createVerticalAoGradientTexture();
  const beamTex = createVolumetricBeamTexture();
  const friezePlaqueTex = createMuseumFriezePlaqueTexture();
  const paintingTextures = [0, 1, 2, 3, 4, 5].map((v) =>
    createClassicalPaintingTexture(v),
  );
  const heroBookCoverPBR = createHeroBookCoverPBR();
  const heroLeftPageTex = createHeroBookPageTexture(true);
  const heroRightPageTex = createHeroBookPageTexture(false);

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
    map: marblePBR.map,
    normalMap: marblePBR.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: marblePBR.roughnessMap,
    roughness: 0.88,
    metalness: 0.08,
    envMapIntensity: 1.35,
  });
  applyAntiTilingShader(marbleFloorMat, {
    macroScale: 0.18,
    dualScale: 1.37,
    macroColorStrength: 0.07,
    macroRoughnessStrength: 0.12,
  });

  const galleryWallMat = new THREE.MeshStandardMaterial({
    color: "#EFE5D4",
    normalMap: travertine.normalMap,
    normalScale: new THREE.Vector2(0.22, 0.22),
    emissive: "#E2BE7C",
    emissiveIntensity: 0.16,
    roughness: 0.74,
    envMapIntensity: 0.6,
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

  const foliageMat = new THREE.MeshStandardMaterial({
    color: "#52664B",
    roughness: 0.85,
    metalness: 0.02,
  });

  const trunkMat = new THREE.MeshStandardMaterial({
    color: "#5C4735",
    roughness: 0.9,
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

  const verticalAoMat = new THREE.MeshBasicMaterial({
    map: verticalAoTex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTex,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const friezePlaqueMat = new THREE.MeshStandardMaterial({
    map: friezePlaqueTex,
    roughness: 0.45,
    metalness: 0.22,
  });

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

  // Flanking Mediterranean stone planters & sculpted cypresses
  [-15.2, 15.2].forEach((px) => {
    [8.6, 16.5].forEach((pz) => {
      const planter = createMediterraneanPlanter(
        limestoneTrimMat,
        foliageMat,
        trunkMat,
        contactShadowMat,
      );
      planter.position.set(px, 0, pz);
      museumGroup.add(planter);
    });
  });

  // Distant Scenic Background: Subtle warm Sicilian Hills & Etna silhouette far behind the museum
  const hillMat1 = new THREE.MeshStandardMaterial({
    color: "#DED4C2",
    roughness: 0.95,
  });
  const hillMat2 = new THREE.MeshStandardMaterial({
    color: "#E8E0D1",
    roughness: 0.95,
  });
  [
    [-42, -55, 28, 7.5, hillMat1],
    [44, -58, 30, 8.2, hillMat1],
    [-26, -74, 34, 12.0, hillMat2],
    [32, -72, 32, 11.5, hillMat2],
  ].forEach(([hx, hz, hr, hh, hm]) => {
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(hr as number, hh as number, 28),
      hm as THREE.Material,
    );
    hill.position.set(hx as number, (hh as number) / 2 - 0.5, hz as number);
    museumGroup.add(hill);
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
  for (let i = 0; i < stepCount; i++) {
    const stepW = 14.8 - i * 0.82;
    const stepD = 6.5 - i * 0.96;
    const stepH = 0.36;
    const stepZ = 5.25 + (stepCount - 1 - i) * 0.42;

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
    nosing.position.set(0, (i + 1) * stepH - 0.015, stepZ + stepD / 2 - 0.02);
    museumGroup.add(nosing);
  }

  const stairAoStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(15.2, 0.55),
    verticalAoMat,
  );
  stairAoStrip.position.set(0, 0.25, 9.36);
  museumGroup.add(stairAoStrip);

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

    const wingAo = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 0.55),
      verticalAoMat,
    );
    wingAo.position.set(wx, podiumTopY + 0.28, 2.09);
    museumGroup.add(wingAo);
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

  const friezePlaque = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.58, 0.1),
    friezePlaqueMat,
  );
  friezePlaque.position.set(0, podiumTopY + doorHeight + 0.85, 2.05);
  museumGroup.add(friezePlaque);

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

  // Coffered Atrium Ceiling + Warm Luminous Skylight
  const atriumCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, 0.4, 18.5),
    limestoneTrimMat,
  );
  atriumCeiling.position.set(0, podiumTopY + wallHeight, -7.7);
  museumGroup.add(atriumCeiling);

  const skylightMat = new THREE.MeshStandardMaterial({
    color: "#FFF4DC",
    emissive: "#FFDFA4",
    emissiveIntensity: 0.72,
    roughness: 0.3,
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
  });

  // Atrium Side Walls with 6 Luminous Museum Paintings (3 on left, 3 on right)
  [-5.95, 5.95].forEach((x, idx) => {
    const innerWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, wallHeight, 18.5),
      galleryWallMat,
    );
    innerWall.position.set(x, podiumTopY + wallHeight / 2, -7.7);
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

  // Right open readable page strictly ON TOP of right block (y = 0.100)
  const ebRightArched = new THREE.Mesh(
    createArchedPageGeometry(ebW - 0.09, ebH - 0.11, "right", 0.038),
    ebRightPageMat,
  );
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

  // Crimson silk ribbon emerging cleanly below spine
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.04, ebH / 2 - 0.04),
    new THREE.Vector3(0.1, 0.015, ebH / 2 + 0.16),
    new THREE.Vector3(0.22, 0.005, ebH / 2 + 0.34),
  ]);
  const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 12, 0.02, 6, false);
  ribbonGeo.scale(1.4, 0.24, 1);
  const silkRibbon = new THREE.Mesh(ribbonGeo, velvetMat);
  heroBookGroup.add(silkRibbon);

  // Front cover hinge at y = 0.105:
  // When closed (θ = 0): frontBoard at [0.175..0.209], leftBlock at [0.113..0.173], leftTopPage at 0.111
  // When open (θ = π): frontBoard lands flat at [0.001..0.035], leftBlock at [0.037..0.097], leftTopPage at 0.099!
  const ebFrontHinge = new THREE.Group();
  ebFrontHinge.position.set(0, 0.105, 0);
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
  ebFrontBoard.position.set(ebW / 2, 0.087, 0);
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
    corner.position.set(cx, 0.087, cz);
    ebFrontHinge.add(corner);
  });

  const ebClasp = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, ebBoardT + 0.012, 0.18),
    goldMat,
  );
  ebClasp.position.set(ebW - 0.03, 0.087, 0);
  ebFrontHinge.add(ebClasp);

  const ebLeftBlock = new THREE.Mesh(
    new THREE.BoxGeometry(ebW - 0.08, 0.06, ebH - 0.1),
    goldMat,
  );
  ebLeftBlock.position.set((ebW - 0.08) / 2 + 0.02, 0.038, 0);
  ebFrontHinge.add(ebLeftBlock);

  const ebLeftArched = new THREE.Mesh(
    createArchedPageGeometry(ebW - 0.09, ebH - 0.11, "right", 0.038),
    ebLeftPageMat,
  );
  ebLeftArched.rotation.z = Math.PI;
  ebLeftArched.position.set((ebW - 0.09) / 2 + 0.02, 0.006, 0);
  ebFrontHinge.add(ebLeftArched);

  // 2 Thin Turning Parchment Leaves strictly pivoted at (0, 0.104, 0) & shorter than covers
  // Clamped monotonically so NO leaf EVER clips through the cover or another leaf!
  const turnLeaf1Pivot = new THREE.Group();
  turnLeaf1Pivot.position.set(0, 0.104, 0);
  const turnLeaf1 = new THREE.Mesh(
    createArchedPageGeometry(ebW - 0.13, ebH - 0.13, "right", 0.028),
    ebRightPageMat,
  );
  turnLeaf1.position.x = (ebW - 0.13) / 2 + 0.025;
  turnLeaf1Pivot.add(turnLeaf1);
  heroBookGroup.add(turnLeaf1Pivot);

  const turnLeaf2Pivot = new THREE.Group();
  turnLeaf2Pivot.position.set(0, 0.104, 0);
  const turnLeaf2 = new THREE.Mesh(
    createArchedPageGeometry(ebW - 0.13, ebH - 0.13, "right", 0.028),
    ebLeftPageMat,
  );
  turnLeaf2.position.x = (ebW - 0.13) / 2 + 0.025;
  turnLeaf2Pivot.add(turnLeaf2);
  heroBookGroup.add(turnLeaf2Pivot);

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

    const colShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.1),
      contactShadowMat,
    );
    colShadow.rotation.x = -Math.PI / 2;
    colShadow.position.y = 0.015;
    colG.add(colShadow);

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

  const dispose = () => {
    envTexture.dispose();
    travertine.map.dispose();
    travertine.normalMap.dispose();
    travertine.roughnessMap.dispose();
    plazaPBR.map.dispose();
    plazaPBR.normalMap.dispose();
    plazaPBR.roughnessMap.dispose();
    marblePBR.map.dispose();
    marblePBR.normalMap.dispose();
    marblePBR.roughnessMap.dispose();
    piazzaMedallionTex.dispose();
    carpetRunnerTex.dispose();
    clockFaceTex.dispose();
    contactShadowTex.dispose();
    verticalAoTex.dispose();
    beamTex.dispose();
    friezePlaqueTex.dispose();
    paintingTextures.forEach((t) => t.dispose());
    heroBookCoverPBR.map.dispose();
    heroBookCoverPBR.normalMap.dispose();
    heroBookCoverPBR.roughnessMap.dispose();
    heroLeftPageTex.dispose();
    heroRightPageTex.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    renderer.dispose();
  };

  const resize = () => {
    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    if (w <= 0 || h <= 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const update = (
    progress: number,
    pointerX: number,
    pointerY: number,
    _elapsed: number,
  ) => {
    // 1. Live Real-Time Clock synced to system clock
    const now = new Date();
    const secs = now.getSeconds() + now.getMilliseconds() / 1000;
    const mins = now.getMinutes() + secs / 60;
    const hrs = (now.getHours() % 12) + mins / 60;
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

    // 4. Bug-Free Hero Book Opening + Monotonic Non-Clipping Turning Leaves
    const coverAngle = THREE.MathUtils.lerp(0, Math.PI * 0.96, bookEase);
    ebFrontHinge.rotation.z = coverAngle;
    heroBookGroup.position.x = THREE.MathUtils.lerp(-ebW / 2, 0, bookEase);

    const leaf1T = Math.min(1, Math.max(0, (bookApproachT - 0.22) / 0.48));
    const leaf1Ease = leaf1T * leaf1T * (3 - 2 * leaf1T);
    const leaf1Raw = THREE.MathUtils.lerp(0.02, Math.PI * 0.94, leaf1Ease);
    const leaf1Angle = Math.max(0.02, Math.min(leaf1Raw, coverAngle - 0.34));
    turnLeaf1Pivot.rotation.z = leaf1Angle;
    turnLeaf1Pivot.visible = coverAngle > 0.4 && bookApproachT > 0.18;

    const leaf2T = Math.min(1, Math.max(0, (bookApproachT - 0.44) / 0.48));
    const leaf2Ease = leaf2T * leaf2T * (3 - 2 * leaf2T);
    const leaf2Raw = THREE.MathUtils.lerp(0.015, Math.PI * 0.92, leaf2Ease);
    const leaf2Angle = Math.max(0.015, Math.min(leaf2Raw, leaf1Angle - 0.3));
    turnLeaf2Pivot.rotation.z = leaf2Angle;
    turnLeaf2Pivot.visible = leaf1Angle > 0.38 && bookApproachT > 0.4;

    ebLeftPageMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.5, bookEase);
    ebRightPageMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 0.5, bookEase);

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

    renderer.render(scene, camera);
  };

  const getStats = (): MuseumRenderStats => ({
    triangles: renderer.info.render.triangles,
    drawCalls: renderer.info.render.calls,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    isLowPowerDevice,
  });

  return { update, resize, dispose, getStats };
}
