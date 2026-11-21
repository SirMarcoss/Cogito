import * as THREE from "three";

export interface ArchiveBookHandle {
  setOpen: (open: boolean) => void;
  setHovered: (hovered: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

function createStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#FFF9EE");
    grad.addColorStop(0.5, "#F2E6D0");
    grad.addColorStop(1, "#C9B38F");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    const lamp = ctx.createRadialGradient(180, 32, 4, 180, 32, 54);
    lamp.addColorStop(0, "rgba(255,255,248,1)");
    lamp.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, 256, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return rt.texture;
}

function createFrontCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1360;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Rich antique cream vellum / fine leather binding base
    const grad = ctx.createLinearGradient(0, 0, 1024, 1360);
    grad.addColorStop(0, "#F6F0E4");
    grad.addColorStop(0.45, "#ECE0CA");
    grad.addColorStop(1, "#DECBA9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1360);

    // Fine leather grain speckles
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1360;
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(120, 92, 52, 0.045)" : "rgba(255, 250, 240, 0.06)";
      ctx.fillRect(x, y, 2, 2);
    }

    // Subtle spine crease shadow on the left edge
    const spineShade = ctx.createLinearGradient(0, 0, 120, 0);
    spineShade.addColorStop(0, "rgba(62, 44, 24, 0.24)");
    spineShade.addColorStop(0.5, "rgba(62, 44, 24, 0.08)");
    spineShade.addColorStop(1, "rgba(62, 44, 24, 0)");
    ctx.fillStyle = spineShade;
    ctx.fillRect(0, 0, 120, 1360);

    // Ornate double gold-tooled border
    ctx.strokeStyle = "#A8843E";
    ctx.lineWidth = 10;
    ctx.strokeRect(76, 76, 872, 1208);

    ctx.strokeStyle = "#7B5B1E";
    ctx.lineWidth = 4;
    ctx.strokeRect(104, 104, 816, 1152);

    // Inner recessed decorative medallion frame
    ctx.strokeStyle = "rgba(168, 132, 62, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(126, 126, 772, 1108);

    // Header archival inscription
    ctx.fillStyle = "#7B5B1E";
    ctx.textAlign = "center";
    ctx.font = '600 30px Inter, Georgia, serif';
    ctx.fillText("C O G I T O   ·   A R C H I V I O   S T O R I C O", 512, 252);

    ctx.strokeStyle = "#A8843E";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(290, 300);
    ctx.lineTo(734, 300);
    ctx.stroke();

    // Classical museum crest emblem
    ctx.save();
    ctx.translate(512, 448);
    ctx.strokeStyle = "#856527";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.restore();

    ctx.fillStyle = "#A8843E";
    ctx.beginPath();
    ctx.arc(512, 448, 16, 0, Math.PI * 2);
    ctx.fill();

    // Crisp embossed cover title: CERCA TRA GLI ARCHIVI
    ctx.fillStyle = "#1E1812";
    ctx.font = '700 88px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("CERCA", 512, 665);
    ctx.fillText("TRA GLI", 512, 768);
    ctx.fillText("ARCHIVI", 512, 871);

    // Call to action engraving
    ctx.fillStyle = "#5B4A35";
    ctx.font = 'italic 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillText("Clicca per aprire il registro", 512, 1045);

    ctx.strokeStyle = "#A8843E";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(352, 1110);
    ctx.lineTo(672, 1110);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createIlluminatedPageTexture(isLeft: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#FCF7EC";
    ctx.fillRect(0, 0, 768, 1024);

    // Realistic gutter shading near the central spine
    const grad = isLeft
      ? ctx.createLinearGradient(540, 0, 768, 0)
      : ctx.createLinearGradient(0, 0, 228, 0);
    grad.addColorStop(0, isLeft ? "rgba(252,247,236,0)" : "rgba(148,124,88,0.28)");
    grad.addColorStop(1, isLeft ? "rgba(148,124,88,0.28)" : "rgba(252,247,236,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 768, 1024);

    // Fine gilt ruled manuscript border
    ctx.strokeStyle = "rgba(168, 132, 62, 0.34)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(64, 68, 640, 888);

    ctx.fillStyle = "#856527";
    ctx.textAlign = "center";
    ctx.font = '600 30px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      isLeft ? "INDICE DEI FONDI STORICI" : "REGISTRO DELLE OPERE",
      384,
      146,
    );

    ctx.strokeStyle = "rgba(168, 132, 62, 0.45)";
    ctx.beginPath();
    ctx.moveTo(180, 172);
    ctx.lineTo(588, 172);
    ctx.stroke();

    // Illuminated drop cap on left page
    if (isLeft) {
      ctx.fillStyle = "#856527";
      ctx.fillRect(112, 224, 78, 78);
      ctx.fillStyle = "#FCF7EC";
      ctx.font = '700 58px "Cormorant Garamond", Georgia, serif';
      ctx.fillText("C", 151, 282);
    }

    // Manuscript lines
    ctx.fillStyle = "rgba(62, 50, 36, 0.24)";
    for (let i = 0; i < 15; i++) {
      const y = 232 + i * 42;
      const startX = isLeft && i < 2 ? 210 : 112;
      const lineW = (isLeft && i < 2 ? 410 : 480) + Math.sin(i * 1.4) * 55;
      ctx.fillRect(startX, y, lineW, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGildedEdgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#E8D5A7";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 3) {
      ctx.fillStyle =
        y % 6 === 0 ? "rgba(168,132,62,0.3)" : "rgba(105,82,42,0.16)";
      ctx.fillRect(0, y, 256, 1.2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Creates an organically arched open-book page surface curving gracefully toward the spine */
function createArchedPageGeometry(
  width: number,
  height: number,
  side: "left" | "right",
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 24, 4);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); // ranges -width/2 to +width/2
    // Normalized distance from spine (0 at spine -> 1 at outer fore-edge)
    const u =
      side === "right"
        ? (x + width / 2) / width
        : (width / 2 - x) / width;
    // Smooth book-page arch peaking near u = 0.35 and dipping into the central spine gutter
    const archY = Math.sin(Math.pow(u, 0.72) * Math.PI) * 0.22;
    pos.setY(i, archY);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildArchiveBookScene(
  canvas: HTMLCanvasElement,
): ArchiveBookHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const w0 = canvas.clientWidth || 720;
  const h0 = canvas.clientHeight || 420;
  renderer.setSize(w0, h0, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const envTex = createStudioEnvMap(renderer);
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(34, w0 / Math.max(1, h0), 0.1, 60);
  camera.position.set(0, 5.5, 5.4);
  camera.lookAt(0, 0.15, 0);

  // Warm museum desk lighting
  const hemi = new THREE.HemisphereLight("#FFFDF9", "#D7C3A1", 1.2);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight("#FFF5E2", 2.0);
  keyLight.position.set(4.5, 9.5, 5.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0006;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight("#E8C888", 0.85);
  rimLight.position.set(-5.5, 4.5, -4.5);
  scene.add(rimLight);

  // Subtle shadow-receiving reading table plane
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.ShadowMaterial({ opacity: 0.18 }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.36;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const bookRoot = new THREE.Group();
  scene.add(bookRoot);

  const coverW = 2.85;
  const coverH = 3.8;
  const boardThick = 0.095;
  const pagesThick = 0.48;

  const frontCoverTex = createFrontCoverTexture();
  const leftPageTex = createIlluminatedPageTexture(true);
  const rightPageTex = createIlluminatedPageTexture(false);
  const gildedEdgeTex = createGildedEdgeTexture();

  const boardMat = new THREE.MeshStandardMaterial({
    color: "#E5D6BC",
    roughness: 0.58,
    metalness: 0.08,
  });

  const frontTopMat = new THREE.MeshStandardMaterial({
    map: frontCoverTex,
    roughness: 0.46,
    metalness: 0.12,
  });

  const goldBrassMat = new THREE.MeshStandardMaterial({
    color: "#C49C4D",
    roughness: 0.24,
    metalness: 0.88,
  });

  const silkRibbonMat = new THREE.MeshStandardMaterial({
    color: "#7E2E24",
    roughness: 0.55,
    metalness: 0.06,
  });

  const gildedEdgeMat = new THREE.MeshStandardMaterial({
    map: gildedEdgeTex,
    roughness: 0.36,
    metalness: 0.48,
  });

  const leftPageMat = new THREE.MeshStandardMaterial({
    map: leftPageTex,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });

  const rightPageMat = new THREE.MeshStandardMaterial({
    map: rightPageTex,
    roughness: 0.82,
    side: THREE.DoubleSide,
  });

  // 1. Back cover board
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(coverW, boardThick, coverH),
    boardMat,
  );
  backCover.position.set(coverW / 2, -pagesThick / 2 - boardThick / 2, 0);
  backCover.castShadow = true;
  backCover.receiveShadow = true;
  bookRoot.add(backCover);

  // 2. Right page stack (gilded fore-edges)
  const rightPageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(coverW - 0.16, pagesThick * 0.52, coverH - 0.2),
    gildedEdgeMat,
  );
  rightPageBlock.position.set((coverW - 0.16) / 2 + 0.03, -pagesThick * 0.23, 0);
  rightPageBlock.castShadow = true;
  rightPageBlock.receiveShadow = true;
  bookRoot.add(rightPageBlock);

  // Curved organic right open page surface resting on top of the right block
  const rightArchedPage = new THREE.Mesh(
    createArchedPageGeometry(coverW - 0.18, coverH - 0.22, "right"),
    rightPageMat,
  );
  rightArchedPage.position.set((coverW - 0.18) / 2 + 0.03, 0.035, 0);
  rightArchedPage.receiveShadow = true;
  bookRoot.add(rightArchedPage);

  // 3. Rounded leather-vellum spine with 5 sculpted brass raised ribs
  const spineRadius = (pagesThick + boardThick * 2) / 2;
  const spineMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      spineRadius,
      spineRadius,
      coverH,
      24,
      1,
      false,
      Math.PI / 2,
      Math.PI,
    ),
    boardMat,
  );
  spineMesh.rotation.x = Math.PI / 2;
  spineMesh.castShadow = true;
  bookRoot.add(spineMesh);

  for (let i = -2; i <= 2; i++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(spineRadius + 0.015, 0.022, 10, 24, Math.PI),
      goldBrassMat,
    );
    band.rotation.y = Math.PI / 2;
    band.rotation.z = Math.PI / 2;
    band.position.set(0, 0, i * 0.66);
    bookRoot.add(band);
  }

  // Silk bookmark ribbon emerging gracefully from the bottom of the spine
  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, -0.08, coverH / 2 - 0.1),
    new THREE.Vector3(0.18, -0.2, coverH / 2 + 0.35),
    new THREE.Vector3(0.42, -0.32, coverH / 2 + 0.78),
    new THREE.Vector3(0.62, -0.34, coverH / 2 + 1.05),
  ]);
  const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 18, 0.045, 6, false);
  ribbonGeo.scale(1.6, 0.22, 1);
  const silkRibbon = new THREE.Mesh(ribbonGeo, silkRibbonMat);
  silkRibbon.castShadow = true;
  bookRoot.add(silkRibbon);

  // 4. Front cover hinge group
  const frontHinge = new THREE.Group();
  frontHinge.position.set(0, pagesThick / 2 + boardThick / 2, 0);
  bookRoot.add(frontHinge);

  const frontCoverMats: THREE.Material[] = [
    boardMat,
    boardMat,
    frontTopMat, // +y outer front cover
    boardMat,
    boardMat,
    boardMat,
  ];
  const frontCoverMesh = new THREE.Mesh(
    new THREE.BoxGeometry(coverW, boardThick, coverH),
    frontCoverMats,
  );
  frontCoverMesh.position.set(coverW / 2, 0, 0);
  frontCoverMesh.castShadow = true;
  frontCoverMesh.receiveShadow = true;
  frontHinge.add(frontCoverMesh);

  // 4 Sculpted brass corner protectors on the front cover
  const cornerPositions: Array<[number, number]> = [
    [coverW - 0.14, -coverH / 2 + 0.14],
    [coverW - 0.14, coverH / 2 - 0.14],
    [0.14, -coverH / 2 + 0.14],
    [0.14, coverH / 2 - 0.14],
  ];
  cornerPositions.forEach(([cx, cz]) => {
    const corner = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, boardThick + 0.03, 0.32),
      goldBrassMat,
    );
    corner.position.set(cx, 0.005, cz);
    frontHinge.add(corner);
  });

  // Sculpted brass fore-edge book clasp
  const claspPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, boardThick + 0.04, 0.44),
    goldBrassMat,
  );
  claspPlate.position.set(coverW - 0.08, 0.01, 0);
  frontHinge.add(claspPlate);

  // Left page block (unfolds with front cover)
  const leftPageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(coverW - 0.16, pagesThick * 0.44, coverH - 0.2),
    gildedEdgeMat,
  );
  leftPageBlock.position.set(
    (coverW - 0.16) / 2 + 0.03,
    -boardThick / 2 - pagesThick * 0.22,
    0,
  );
  leftPageBlock.castShadow = true;
  frontHinge.add(leftPageBlock);

  // Curved organic left open page visible once opened
  const leftArchedPage = new THREE.Mesh(
    createArchedPageGeometry(coverW - 0.18, coverH - 0.22, "right"),
    leftPageMat,
  );
  leftArchedPage.rotation.z = Math.PI;
  leftArchedPage.position.set(
    (coverW - 0.18) / 2 + 0.03,
    -boardThick / 2 - pagesThick * 0.445,
    0,
  );
  frontHinge.add(leftArchedPage);

  // Extra turning leaf that gracefully sweeps across as the book opens
  const turningLeafPivot = new THREE.Group();
  turningLeafPivot.position.set(0, 0.04, 0);
  const turningLeaf = new THREE.Mesh(
    createArchedPageGeometry(coverW - 0.2, coverH - 0.24, "right"),
    rightPageMat,
  );
  turningLeaf.position.x = (coverW - 0.2) / 2 + 0.03;
  turningLeafPivot.add(turningLeaf);
  bookRoot.add(turningLeafPivot);

  let targetOpen = 0;
  let currentOpen = 0;
  let targetHover = 0;
  let currentHover = 0;
  let disposed = false;
  let rafId = 0;
  let lastTime = performance.now();

  const renderFrame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    currentOpen += (targetOpen - currentOpen) * Math.min(1, dt * 6.0);
    currentHover += (targetHover - currentHover) * Math.min(1, dt * 8.0);

    // Smooth cover swing (0 -> ~170 degrees)
    frontHinge.rotation.z = THREE.MathUtils.lerp(0, Math.PI * 0.94, currentOpen);

    // Turning leaf gracefully lags behind the cover for natural page-turn realism
    const leafProgress = Math.min(1, Math.max(0, (currentOpen - 0.18) / 0.72));
    turningLeafPivot.rotation.z = THREE.MathUtils.lerp(
      0,
      Math.PI * 0.91,
      leafProgress * leafProgress * (3 - 2 * leafProgress),
    );
    turningLeafPivot.visible = currentOpen > 0.05;

    // Keep book perfectly centered whether closed or open spread
    bookRoot.position.x = THREE.MathUtils.lerp(-coverW / 2, 0, currentOpen);

    const idleFloat = Math.sin(now * 0.0018) * 0.035 * (1 - currentOpen * 0.65);
    bookRoot.position.y = idleFloat + currentHover * 0.14 + currentOpen * 0.16;
    bookRoot.rotation.x =
      THREE.MathUtils.lerp(0.18, 0.3, currentOpen) - currentHover * 0.05;
    bookRoot.rotation.y =
      THREE.MathUtils.lerp(-0.2, 0, currentOpen) + currentHover * 0.1;

    camera.position.z = THREE.MathUtils.lerp(5.2, 6.6, currentOpen);
    camera.position.y = THREE.MathUtils.lerp(5.3, 6.1, currentOpen);
    camera.lookAt(0, 0.05, 0);

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(renderFrame);
  };

  rafId = window.requestAnimationFrame(renderFrame);

  return {
    setOpen: (open: boolean) => {
      targetOpen = open ? 1 : 0;
    },
    setHovered: (hovered: boolean) => {
      targetHover = hovered ? 1 : 0;
    },
    resize: () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 720;
      const h = parent ? parent.clientHeight : 420;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      envTex.dispose();
      frontCoverTex.dispose();
      leftPageTex.dispose();
      rightPageTex.dispose();
      gildedEdgeTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
