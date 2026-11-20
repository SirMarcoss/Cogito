import * as THREE from "three";
import type {
  CorrelazioneItemOut,
  NarrazioneOut,
  OperaDetailOut,
  OperaNearbyOut,
} from "../../types/api";
import type { ArchiveVerticalPanelKey } from "../ArchivePanel2DModal";
import {
  createBrassPlaqueTexture,
  createOpenBookPageTexture,
  createPaintingTexture,
  createRealCataniaOSMTileMapTexture,
  createRelationalGraphWallTexture,
  createSala4ArchiveFolioTexture,
  createSala4AuthorPanelTexture,
  createSala4TerritoryPanelTexture,
  createVerticalSteleTexture,
} from "./canvasArtworks";
import { createMuseumEnvironment } from "./pbrTextures";
import {
  buildContinuousMuseumWorld,
  createMuseumMaterials,
  type BuiltMuseumWorld,
} from "./roomBuilders";

export type HubZoneId = "exterior" | "room1" | "room2" | "room3" | "room4";

export type HallStage = "overview" | "qr" | "doors";

export type Sala4ExhibitFocus =
  | "overview"
  | "artwork"
  | "author"
  | "archive"
  | "connections"
  | "armchair"
  | "audio";

export type Sala3Stage =
  | "entry"
  | "book"
  | "stele-descrizione"
  | "stele-archivio"
  | "stele-narrazione"
  | "graph";

export type SceneHitTarget =
  | { kind: "portal"; room: 2 | 3 | 4; label: string }
  | { kind: "qr-station"; label: string }
  | { kind: "territory-artwork"; opera: OperaNearbyOut; label: string }
  | { kind: "open-map"; label: string }
  | { kind: "archive-book"; label: string }
  | { kind: "archive-panel"; panelKey: ArchiveVerticalPanelKey; label: string }
  | { kind: "relational-graph"; label: string }
  | { kind: "sala4-exhibit"; exhibit: Sala4ExhibitFocus; label: string };

export interface SceneCallbacks {
  onHoverTarget?: (target: SceneHitTarget | null, clientX: number, clientY: number) => void;
  onSelectTarget?: (target: SceneHitTarget) => void;
  onZoneChange?: (zone: HubZoneId) => void;
  onHallStageChange?: (stage: HallStage) => void;
  onScrollChange?: (progress: number) => void;
  onNearestTerritoryArtwork?: (opera: OperaNearbyOut | null) => void;
  onSala3StageChange?: (stage: Sala3Stage) => void;
  onSala4FocusChange?: (focus: Sala4ExhibitFocus) => void;
  onVisitorPositionChange?: (pos: { x: number; z: number }) => void;
}

interface InteractiveEntry {
  mesh: THREE.Object3D;
  allowedZones?: readonly HubZoneId[];
  getTarget: () => SceneHitTarget | null;
}

type WaypointTuple = readonly [number, number, number, number, number, number];

interface QueuedFlight {
  waypoints: WaypointTuple[];
  onComplete: () => void;
}

interface DoorSequence {
  startMs: number;
  stage: "close-prev" | "swing-open" | "walk-in";
  fromPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  onClosed?: () => void;
  resolve: () => void;
}

/**
 * Waypoint sequenziali [posX, posY, posZ, lookX, lookY, lookZ] ispirati a cogito.html:
 * interpolazione lineare ordinata tra soste pulite -> ZERO spin a 360° e fermate precise.
 */
const WAYPOINTS: Record<HubZoneId, readonly WaypointTuple[]> = {
  exterior: [
    [0, 32.5, 58.0, 0, 4.8, 2.0],
    [0, 14.5, 38.0, 0, 5.2, 4.0],
    [0, 3.6, 18.0, 0, 3.8, -4.0],
    [0, 2.7, 4.0, 0, 3.3, -14.0],
  ],
  room1: [
    [0, 3.15, -3.0, 0, 3.5, -18.5],
    [0, 2.85, -10.5, 0, 3.3, -24.5],
    [0, 2.8, -18.2, 0, 3.35, -26.5],
    [2.2, 2.05, -14.6, 5.2, 1.78, -17.5],
  ],
  room2: [
    [-16.2, 2.7, -13.0, -30.0, 3.0, -13.0],
    [-20.5, 2.7, -11.8, -21.5, 3.3, -18.7],
    [-25.5, 2.7, -14.2, -26.5, 3.3, -7.3],
    [-30.5, 2.7, -11.8, -31.5, 3.3, -18.7],
    [-35.5, 2.7, -14.2, -36.5, 3.3, -7.3],
    [-40.5, 2.7, -11.8, -41.5, 3.3, -18.7],
    [-45.5, 2.7, -14.2, -46.5, 3.3, -7.3],
    [-49.6, 2.7, -11.8, -50.8, 3.3, -18.7],
    [-50.5, 3.3, -13.0, -57.7, 3.65, -13.0],
  ],
  room3: [
    [16.0, 2.8, -13.0, 21.5, 1.85, -13.0],
    [19.1, 2.55, -13.0, 21.5, 1.55, -13.0],
    [19.25, 2.52, -13.0, 21.5, 1.55, -13.0],
    [24.8, 3.15, -13.0, 32.5, 3.0, -13.0],
    [31.2, 2.75, -11.8, 32.5, 2.85, -17.9],
    [38.2, 2.75, -14.2, 39.5, 2.85, -8.1],
    [45.2, 2.75, -11.8, 46.5, 2.85, -17.9],
    [50.6, 3.3, -13.0, 57.7, 3.65, -13.0],
  ],
  room4: [
    [0, 2.85, -29.0, 0, 3.85, -57.6],
    [0, 3.35, -47.2, 0, 4.35, -57.6],
    [5.4, 3.0, -44.2, 13.68, 3.85, -44.0],
    [-2.2, 2.5, -43.5, -7.2, 1.65, -47.0],
    [-5.4, 3.0, -42.0, -13.68, 3.85, -42.0],
    [0, 1.65, -41.2, 0, 4.35, -57.6],
  ],
};

const DOOR_PORTALS: Partial<Record<HubZoneId, WaypointTuple>> = {
  room2: [-13.5, 2.8, -13.0, -28.0, 3.0, -13.0],
  room3: [13.5, 2.8, -13.0, 28.0, 3.0, -13.0],
  room4: [0, 2.8, -25.2, 0, 3.4, -42.0],
};

function disposeMaterialMaps(mat: THREE.Material) {
  const std = mat as THREE.MeshStandardMaterial;
  std.map?.dispose();
  std.roughnessMap?.dispose();
  std.bumpMap?.dispose();
}

function sampleWaypoint(
  list: readonly WaypointTuple[],
  rawIdx: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
) {
  const maxIdx = list.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, rawIdx));
  const aIdx = Math.min(Math.floor(clamped), maxIdx);
  const bIdx = Math.min(aIdx + 1, maxIdx);
  const frac = clamped - aIdx;
  const a = list[aIdx];
  const b = list[bIdx];
  outPos.set(
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac,
    a[2] + (b[2] - a[2]) * frac,
  );
  outLook.set(
    a[3] + (b[3] - a[3]) * frac,
    a[4] + (b[4] - a[4]) * frac,
    a[5] + (b[5] - a[5]) * frac,
  );
}

export class MuseumSceneController {
  private readonly container: HTMLElement;
  private readonly callbacks: SceneCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly envDispose: () => void;

  private readonly world: BuiltMuseumWorld;
  private readonly interactiveEntries: InteractiveEntry[] = [];

  private readonly tempTargetPos = new THREE.Vector3();
  private readonly tempTargetLook = new THREE.Vector3();

  private rafId: number | null = null;
  private disposed = false;
  private lastFrameMs = performance.now();

  private activeZone: HubZoneId = "exterior";
  private zoneIndexTarget = 0;

  private currentCamPos = new THREE.Vector3(...WAYPOINTS.exterior[0].slice(0, 3));
  private currentLookAt = new THREE.Vector3(...WAYPOINTS.exterior[0].slice(3, 6));

  private sala4CustomFocus: "audio" | null = null;
  private sala4DrawerOpen = true;

  // Stato persistente porte Sala Opera e apertura progressiva Libro Archivi
  private openedOperaId: number | null = null;
  private currentDoorAngle = 0;
  private bookOpenProgress = 0;

  private activeFlight: QueuedFlight | null = null;
  private doorSequence: DoorSequence | null = null;

  private upBoundaryAccum = 0;
  private downBoundaryAccum = 0;
  private transitionLockUntilMs = 0;

  private pointerNormX = 0;
  private pointerNormY = 0;
  private smoothLookX = 0;
  private smoothLookY = 0;

  private isPointerDown = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private pointerMovedDist = 0;
  private touchLastY: number | null = null;

  private lastReportedProgress = -1;
  private lastHallStage: HallStage | null = null;
  private lastNearestId: number | null | undefined = undefined;
  private lastSala3Stage: Sala3Stage | null = null;
  private lastSala4Focus: Sala4ExhibitFocus | null = null;
  private lastPosEmitMs = 0;

  private currentSingleOpera: OperaDetailOut | null = null;

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c14);
    this.scene.fog = new THREE.FogExp2(0x0a0d16, 0.0058);

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 280);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    container.appendChild(this.renderer.domElement);

    const env = createMuseumEnvironment(this.renderer);
    this.scene.environment = env.texture;
    this.envDispose = env.dispose;

    // Illuminazione notturna contenuta + luce lunare argentata verso museo e fontana
    const hemiLight = new THREE.HemisphereLight(0x88a4d4, 0x2d2419, 0.34);
    const moonDirLight = new THREE.DirectionalLight(0xc2d8ff, 0.92);
    moonDirLight.position.set(-26, 28, -34);
    moonDirLight.castShadow = true;
    moonDirLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(hemiLight, moonDirLight);

    const materials = createMuseumMaterials();
    this.world = buildContinuousMuseumWorld(materials);
    this.scene.add(this.world.root);

    this.registerAllInteractives();

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    this.bindEvents();
    this.startLoop();
  }

  private registerInteractive(
    mesh: THREE.Object3D,
    getTarget: () => SceneHitTarget | null,
    allowedZones?: readonly HubZoneId[],
  ) {
    this.interactiveEntries.push({ mesh, allowedZones, getTarget });
  }

  private registerAllInteractives() {
    this.registerInteractive(
      this.world.qrTotemGroup,
      () => ({
        kind: "qr-station",
        label: "Totem QR — Scansiona o inserisci codice",
      }),
      ["exterior", "room1"],
    );

    [this.world.portalLeftSign.group, this.world.portalLeftHitArea].forEach((obj) => {
      this.registerInteractive(
        obj,
        () => ({
          kind: "portal",
          room: 2,
          label: "Entra in Sala Territorio",
        }),
        ["exterior", "room1"],
      );
    });

    [this.world.portalRightSign.group, this.world.portalRightHitArea].forEach((obj) => {
      this.registerInteractive(
        obj,
        () => ({
          kind: "portal",
          room: 3,
          label: "Entra in Sala Archivi",
        }),
        ["exterior", "room1"],
      );
    });

    this.registerInteractive(
      this.world.portalCenterSign.group,
      () => ({
        kind: "portal",
        room: 4,
        label: this.openedOperaId
          ? "Entra in Sala Opera"
          : "Totem QR — Apri la Sala Opera",
      }),
      ["exterior", "room1"],
    );

    // Sala Territorio
    this.world.territorySlots.forEach((slot) => {
      this.registerInteractive(
        slot.group,
        () => {
          if (!slot.opera) return null;
          return {
            kind: "territory-artwork",
            opera: slot.opera,
            label: `${slot.opera.titolo} (${slot.opera.distance_km} km)`,
          };
        },
        ["room2"],
      );
    });

    this.registerInteractive(
      this.world.territoryMapGroup,
      () => ({
        kind: "open-map",
        label: "Apri la Mappa Reale di Catania",
      }),
      ["room2"],
    );

    // Sala Archivi
    this.registerInteractive(
      this.world.bookLectern.group,
      () => ({
        kind: "archive-book",
        label: "Apri il Registro d'Archivio (Cerca opera)",
      }),
      ["room3"],
    );

    this.world.archiveSteles.forEach((stele) => {
      const labelMap: Record<ArchiveVerticalPanelKey, string> = {
        descrizione: "Stele I — Descrizione Ufficiale",
        archivio: "Stele II — Fonte d'Archivio",
        narrazione: "Stele III — Narrazione & Curiosità",
      };
      this.registerInteractive(
        stele.group,
        () => ({
          kind: "archive-panel",
          panelKey: stele.panelKey,
          label: labelMap[stele.panelKey],
        }),
        ["room3"],
      );
    });

    this.registerInteractive(
      this.world.relationalGraphGroup,
      () => ({
        kind: "relational-graph",
        label: "Apri Grafo Relazionale — Connessioni Storiche",
      }),
      ["room3"],
    );

    // Sala Opera
    this.registerInteractive(
      this.world.sala4Exhibits.artworkGroup,
      () => ({
        kind: "sala4-exhibit",
        exhibit: "artwork",
        label: this.currentSingleOpera?.titolo ?? "Opera Principale",
      }),
      ["room4"],
    );
    this.registerInteractive(
      this.world.sala4Exhibits.authorGroup,
      () => ({
        kind: "sala4-exhibit",
        exhibit: "author",
        label: "Autore, Epoca & Informazioni",
      }),
      ["room4"],
    );
    this.registerInteractive(
      this.world.sala4Exhibits.vitrine.group,
      () => ({
        kind: "sala4-exhibit",
        exhibit: "archive",
        label: this.currentSingleOpera?.documento_archivio
          ? "Teca d'Archivio — Fonte Primaria"
          : "Teca Scultorea — Monumento",
      }),
      ["room4"],
    );
    this.registerInteractive(
      this.world.sala4Exhibits.connectionsGroup,
      () => ({
        kind: "sala4-exhibit",
        exhibit: "connections",
        label: "Ente di Conservazione & Connessioni",
      }),
      ["room4"],
    );
    this.registerInteractive(
      this.world.sala4Exhibits.audioStandGroup,
      () => ({
        kind: "sala4-exhibit",
        exhibit: "audio",
        label: "Colonnina Audioguida AI",
      }),
      ["room4"],
    );
  }

  public getActiveZone(): HubZoneId {
    return this.activeZone;
  }

  public getOpenedOperaId(): number | null {
    return this.openedOperaId;
  }

  public setRoom4DrawerOpen(open: boolean) {
    this.sala4DrawerOpen = open;
  }

  public focusSala4Exhibit(exhibit: Sala4ExhibitFocus) {
    if (exhibit === "audio") {
      this.sala4CustomFocus = "audio";
      this.callbacks.onSala4FocusChange?.("audio");
      return;
    }

    this.sala4CustomFocus = null;
    const indexMap: Record<
      "overview" | "artwork" | "author" | "archive" | "connections" | "armchair",
      number
    > = {
      overview: 0,
      artwork: 1,
      author: 2,
      archive: 3,
      connections: 4,
      armchair: 5,
    };
    this.zoneIndexTarget = indexMap[exhibit];
    this.callbacks.onSala4FocusChange?.(exhibit);
  }

  public setCorridorProgress(progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    const maxIdx = WAYPOINTS[this.activeZone].length - 1;
    this.sala4CustomFocus = null;
    this.zoneIndexTarget = clamped * maxIdx;
  }

  public jumpImmediatelyToZone(zone: HubZoneId, initialIndex = 0) {
    this.activeFlight = null;
    if (this.doorSequence) {
      this.doorSequence.resolve();
      this.doorSequence = null;
    }
    this.activeZone = zone;
    this.zoneIndexTarget = Math.max(
      0,
      Math.min(WAYPOINTS[zone].length - 1, initialIndex),
    );
    this.sala4CustomFocus = null;
    this.upBoundaryAccum = 0;
    this.downBoundaryAccum = 0;

    if (zone === "room4") {
      this.applyDoorAngle(1.4);
    }

    sampleWaypoint(
      WAYPOINTS[zone],
      this.zoneIndexTarget,
      this.currentCamPos,
      this.currentLookAt,
    );
    this.callbacks.onZoneChange?.(zone);
  }

  /**
   * Volo fluido tra le sale sulla stessa pagina (stile cogito.html):
   * non richiude mai le porte della Sala Opera se un'opera è aperta.
   */
  public transitionToZone(targetZone: HubZoneId, targetIndex = 0): Promise<void> {
    if (this.disposed) return Promise.resolve();

    const fromZone = this.activeZone;
    const safeIdx = Math.max(
      0,
      Math.min(WAYPOINTS[targetZone].length - 1, targetIndex),
    );
    const destWp = WAYPOINTS[targetZone][safeIdx];

    if (fromZone === targetZone) {
      this.zoneIndexTarget = safeIdx;
      this.sala4CustomFocus = null;
      return Promise.resolve();
    }

    const q: WaypointTuple[] = [];
    const needsHallHub =
      (fromZone === "room2" || fromZone === "room3" || fromZone === "room4") &&
      targetZone !== "room1";

    if (fromZone === "exterior") {
      q.push(WAYPOINTS.exterior[3], WAYPOINTS.room1[0]);
    } else if (fromZone !== "room1") {
      // Esce dolcemente dalla sala laterale/nord verso il portale della Hall
      const exitDoor = DOOR_PORTALS[fromZone];
      if (exitDoor) q.push(exitDoor);
      q.push(WAYPOINTS.room1[1]);
    }

    if (needsHallHub) {
      q.push(WAYPOINTS.room1[0]);
    }

    if (targetZone === "exterior") {
      if (fromZone === "room1") q.push(WAYPOINTS.room1[0]);
      q.push(WAYPOINTS.exterior[3]);
    } else if (targetZone !== "room1") {
      const enterDoor = DOOR_PORTALS[targetZone];
      if (enterDoor) {
        q.push(WAYPOINTS.room1[1], enterDoor);
      }
    }
    q.push(destWp);

    this.activeZone = targetZone;
    this.zoneIndexTarget = safeIdx;
    this.sala4CustomFocus = null;
    this.upBoundaryAccum = 0;
    this.downBoundaryAccum = 0;
    this.transitionLockUntilMs = performance.now() + 350;

    this.lastReportedProgress = -1;
    this.lastHallStage = null;
    this.lastNearestId = undefined;
    this.lastSala3Stage = null;
    this.lastSala4Focus = null;

    this.callbacks.onZoneChange?.(targetZone);

    return new Promise<void>((resolve) => {
      this.activeFlight = {
        waypoints: q,
        onComplete: resolve,
      };
    });
  }

  /**
   * Gestione persistente porte Sala Opera:
   * - Stessa opera già aperta: porte già spalancate, si entra subito.
   * - Nessuna opera ancora aperta: aggiorna sala, apre le porte, entra lasciandole aperte.
   * - Nuova opera diversa: si avvicina alla soglia, richiude le porte, aggiorna dati,
   *   riapre le porte e entra mantenendole aperte.
   */
  public enterSalaOpera(
    opera: OperaDetailOut,
    correlazioni: CorrelazioneItemOut[] = [],
  ): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.doorSequence) {
      this.doorSequence.resolve();
      this.doorSequence = null;
    }
    this.activeFlight = null;

    const isSameOperaOpen =
      this.openedOperaId === opera.id && this.currentDoorAngle > 1.0;
    const needsCloseAndReopen =
      this.openedOperaId !== null &&
      this.openedOperaId !== opera.id &&
      this.currentDoorAngle > 0.3;

    if (isSameOperaOpen) {
      this.updateSingleOpera(opera, correlazioni);
      if (this.activeZone === "room4") {
        this.zoneIndexTarget = 1;
        this.sala4CustomFocus = null;
        return Promise.resolve();
      }
      this.openedOperaId = opera.id;
      return this.transitionToZone("room4", 0);
    }

    if (!needsCloseAndReopen) {
      this.updateSingleOpera(opera, correlazioni);
    }

    const startDoorSeq = (resolve: () => void) => {
      this.doorSequence = {
        startMs: performance.now(),
        stage: needsCloseAndReopen ? "close-prev" : "swing-open",
        fromPos: this.currentCamPos.clone(),
        fromLook: this.currentLookAt.clone(),
        onClosed: () => {
          this.updateSingleOpera(opera, correlazioni);
        },
        resolve: () => {
          this.openedOperaId = opera.id;
          resolve();
        },
      };
    };

    const thresholdWp = WAYPOINTS.room1[2];
    const dist = this.currentCamPos.distanceTo(
      new THREE.Vector3(thresholdWp[0], thresholdWp[1], thresholdWp[2]),
    );
    if (dist < 8.5 && this.activeZone === "room1") {
      return new Promise<void>((resolve) => startDoorSeq(resolve));
    }

    const q: WaypointTuple[] = [];
    if (this.activeZone !== "room1" && this.activeZone !== "exterior") {
      const exitDoor = DOOR_PORTALS[this.activeZone];
      if (exitDoor) q.push(exitDoor);
      q.push(WAYPOINTS.room1[1]);
    }
    q.push(thresholdWp);

    return new Promise<void>((resolve) => {
      this.activeFlight = {
        waypoints: q,
        onComplete: () => startDoorSeq(resolve),
      };
    });
  }

  private applyDoorAngle(angle: number) {
    this.currentDoorAngle = angle;
    this.world.leftDoorPivot.rotation.y = angle;
    this.world.rightDoorPivot.rotation.y = -angle;
  }

  public updateTerritoryArtworks(items: OperaNearbyOut[]) {
    const capped = items.slice(0, this.world.territorySlots.length);
    this.world.territorySlots.forEach((slot, idx) => {
      const opera = capped[idx] ?? null;
      slot.opera = opera;
      if (!opera) {
        slot.group.visible = false;
        slot.spotLight.intensity = 0;
        return;
      }
      slot.group.visible = true;
      slot.spotLight.intensity = 14;

      disposeMaterialMaps(slot.canvasMat);
      slot.canvasMat.map = createPaintingTexture(
        opera.immagine_url,
        opera.titolo,
        opera.categoria,
      );
      slot.canvasMat.needsUpdate = true;

      disposeMaterialMaps(slot.plaqueMat);
      slot.plaqueMat.map = createBrassPlaqueTexture(
        opera.titolo,
        `${opera.autore} • ${opera.distance_km} km`,
      );
      slot.plaqueMat.needsUpdate = true;
    });

    disposeMaterialMaps(this.world.territoryMapMat);
    this.world.territoryMapMat.map = createRealCataniaOSMTileMapTexture(capped);
    this.world.territoryMapMat.needsUpdate = true;
    this.lastNearestId = undefined;
  }

  public updateArchiveCorridor(state: {
    opera: OperaDetailOut | null;
    narration: NarrazioneOut | null;
    correlazioni: CorrelazioneItemOut[];
  }) {
    const { opera, narration, correlazioni } = state;

    disposeMaterialMaps(this.world.bookLectern.leftPageMat);
    disposeMaterialMaps(this.world.bookLectern.rightPageMat);
    this.world.bookLectern.leftPageMat.map = createOpenBookPageTexture(
      "left",
      opera?.titolo ?? null,
    );
    this.world.bookLectern.rightPageMat.map = createOpenBookPageTexture(
      "right",
      opera?.titolo ?? null,
    );
    this.world.bookLectern.leftPageMat.needsUpdate = true;
    this.world.bookLectern.rightPageMat.needsUpdate = true;

    this.world.archiveSteles.forEach((stele) => {
      disposeMaterialMaps(stele.canvasMat);
      if (!opera) {
        stele.spotLight.intensity = 15;
        stele.canvasMat.map = createVerticalSteleTexture({
          badge: "Sala Archivi • Registro Storico",
          heading: "Invito Curatoriale",
          body: "Consulta il Leggio Centrale per interrogare le fonti storiche e ricostruire i legami tra le opere.",
        });
      } else if (stele.panelKey === "descrizione") {
        stele.spotLight.intensity = 16;
        stele.canvasMat.map = createVerticalSteleTexture({
          badge: "Stele I • Scheda Storica",
          heading: opera.titolo,
          body: opera.descrizione_ufficiale,
        });
      } else if (stele.panelKey === "archivio") {
        if (opera.documento_archivio) {
          stele.spotLight.intensity = 16;
          stele.canvasMat.map = createVerticalSteleTexture({
            badge: `Stele II • ${opera.documento_archivio.segnatura}`,
            heading: opera.documento_archivio.titolo,
            body: `${opera.documento_archivio.fondo}\n\n"${opera.documento_archivio.estratto_verificato}"`,
          });
        } else {
          stele.spotLight.intensity = 1.4;
          stele.canvasMat.map = createVerticalSteleTexture({
            badge: "Stele II • Fonte d'Archivio",
            heading: "Nessun documento d'archivio collegato",
            body: "Per questo bene non è associato un fascicolo archivistico diretto. Clicca comunque per aprire la nota curatoriale.",
            dimmed: true,
          });
        }
      } else {
        stele.spotLight.intensity = 16;
        stele.canvasMat.map = createVerticalSteleTexture({
          badge: "Stele III • Narrazione & Curiosità",
          heading: opera.autore,
          body: narration?.testo_lettura ?? opera.breve_sintesi,
        });
      }
      stele.canvasMat.needsUpdate = true;
    });

    disposeMaterialMaps(this.world.relationalGraphMat);
    this.world.relationalGraphMat.map = createRelationalGraphWallTexture(
      opera,
      correlazioni,
    );
    this.world.relationalGraphMat.needsUpdate = true;
  }

  public updateSingleOpera(
    opera: OperaDetailOut | null,
    correlazioni: CorrelazioneItemOut[] = [],
  ) {
    this.currentSingleOpera = opera;
    if (!opera) return;

    const ex = this.world.sala4Exhibits;
    disposeMaterialMaps(ex.artworkMat);
    ex.artworkMat.map = createPaintingTexture(
      opera.immagine_url,
      opera.titolo,
      opera.categoria,
    );
    ex.artworkMat.needsUpdate = true;

    disposeMaterialMaps(ex.artworkPlaqueMat);
    ex.artworkPlaqueMat.map = createBrassPlaqueTexture(
      opera.titolo,
      `${opera.autore} • ${opera.anno}`,
    );
    ex.artworkPlaqueMat.needsUpdate = true;

    disposeMaterialMaps(ex.authorMat);
    ex.authorMat.map = createSala4AuthorPanelTexture(opera);
    ex.authorMat.needsUpdate = true;

    if (opera.documento_archivio) {
      ex.vitrine.manuscriptGroup.visible = true;
      ex.vitrine.monumentGroup.visible = false;
      disposeMaterialMaps(ex.vitrine.folioMat);
      ex.vitrine.folioMat.map = createSala4ArchiveFolioTexture(opera);
      ex.vitrine.folioMat.needsUpdate = true;
    } else {
      ex.vitrine.manuscriptGroup.visible = false;
      ex.vitrine.monumentGroup.visible = true;
    }

    disposeMaterialMaps(ex.connectionsMat);
    ex.connectionsMat.map = createSala4TerritoryPanelTexture(opera, correlazioni);
    ex.connectionsMat.needsUpdate = true;
  }

  private bindEvents() {
    window.addEventListener("resize", this.handleResize);
    const dom = this.renderer.domElement;
    dom.addEventListener("wheel", this.handleWheel, { passive: false });
    dom.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    dom.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    dom.addEventListener("touchmove", this.handleTouchMove, { passive: false });
  }

  private unbindEvents() {
    window.removeEventListener("resize", this.handleResize);
    const dom = this.renderer.domElement;
    dom.removeEventListener("wheel", this.handleWheel);
    dom.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    dom.removeEventListener("touchstart", this.handleTouchStart);
    dom.removeEventListener("touchmove", this.handleTouchMove);
  }

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Gestione dello scroll a waypoint:
   * - Sosta rallentata sopra il libro aperto in Sala Archivi (idx ∈ [0.8, 2.2])
   * - Scroll in su all'inizio di qualunque sala interna -> torna nella Hall Principale!
   * - Scroll in avanti nell'Esterno oltre il porticato -> entra nella Hall Principale!
   */
  private applyScrollDelta(rawStep: number) {
    if (
      this.activeFlight ||
      this.doorSequence ||
      performance.now() < this.transitionLockUntilMs
    ) {
      return;
    }

    const maxIdx = WAYPOINTS[this.activeZone].length - 1;
    let step = rawStep;

    // Rallenta dolcemente lo scroll sul leggio della Sala Archivi per fermarsi comodamente sul libro aperto
    if (
      this.activeZone === "room3" &&
      this.zoneIndexTarget >= 0.75 &&
      this.zoneIndexTarget <= 2.25
    ) {
      step *= 0.55;
    }

    this.sala4CustomFocus = null;
    const candidate = this.zoneIndexTarget + step;

    if (candidate > maxIdx) {
      this.zoneIndexTarget = maxIdx;
      this.upBoundaryAccum = 0;
      if (this.activeZone === "exterior" && step > 0) {
        this.downBoundaryAccum += step;
        if (this.downBoundaryAccum >= 0.08) {
          this.downBoundaryAccum = 0;
          void this.transitionToZone("room1", 0);
        }
      }
      return;
    }

    if (candidate < 0) {
      this.zoneIndexTarget = 0;
      this.downBoundaryAccum = 0;
      if (step < 0 && this.activeZone !== "exterior") {
        this.upBoundaryAccum += Math.abs(step);
        if (this.upBoundaryAccum >= 0.14) {
          this.upBoundaryAccum = 0;
          if (this.activeZone === "room1") {
            void this.transitionToZone("exterior", 3);
          } else {
            // Qualunque altra sala (Territorio, Archivi, Opera) scorrendo in su torna nella Hall Principale
            void this.transitionToZone("room1", 1);
          }
        }
      }
      return;
    }

    this.upBoundaryAccum = 0;
    this.downBoundaryAccum = 0;
    this.zoneIndexTarget = candidate;
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const clamped = Math.max(-140, Math.min(140, e.deltaY));
    this.applyScrollDelta(clamped * 0.0022);
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.touchLastY = e.touches[0].clientY;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1 && this.touchLastY !== null) {
      const currentY = e.touches[0].clientY;
      const dy = this.touchLastY - currentY;
      this.touchLastY = currentY;
      e.preventDefault();
      this.applyScrollDelta(dy * 0.0065);
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
    this.pointerMovedDist = 0;
  };

  private handlePointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.pointerNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNormY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }

    if (this.isPointerDown) {
      this.pointerMovedDist = Math.hypot(
        e.clientX - this.pointerDownX,
        e.clientY - this.pointerDownY,
      );
    }

    const hit = this.pickTarget(e.clientX, e.clientY);
    this.renderer.domElement.style.cursor = hit ? "pointer" : "default";
    this.callbacks.onHoverTarget?.(hit, e.clientX, e.clientY);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    if (this.pointerMovedDist < 6) {
      const hit = this.pickTarget(e.clientX, e.clientY);
      if (hit) {
        this.callbacks.onSelectTarget?.(hit);
      }
    }
  };

  private pickTarget(clientX: number, clientY: number): SceneHitTarget | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    const eligible = this.interactiveEntries.filter(
      (entry) =>
        entry.mesh.visible &&
        (!entry.allowedZones || entry.allowedZones.includes(this.activeZone)),
    );
    const meshes = eligible.map((e) => e.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length === 0) return null;

    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      const found = eligible.find((entry) => entry.mesh === obj);
      if (found) {
        return found.getTarget();
      }
      obj = obj.parent;
    }
    return null;
  }

  private startLoop() {
    const tick = (now: number) => {
      if (this.disposed) return;
      this.updateFrame(now);
      this.renderer.render(this.scene, this.camera);
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private updateFrame(now: number) {
    const dt = Math.min(0.1, Math.max(0.001, (now - this.lastFrameMs) / 1000));
    this.lastFrameMs = now;
    const tSec = now * 0.001;

    // Animazione zampillo fontana, nuvole notturne e pulviscolo luminoso nella luce
    this.world.fountainSpray.rotation.y = tSec * 0.55;
    this.world.fountainSpray.position.y = Math.sin(tSec * 4.0) * 0.07;

    for (const cloud of this.world.floatingClouds) {
      cloud.mesh.position.x =
        cloud.baseX + Math.sin(tSec * cloud.speed + cloud.phase) * 2.2;
      cloud.mesh.position.y =
        cloud.baseY + Math.cos(tSec * cloud.speed * 0.7 + cloud.phase) * 0.45;
    }

    for (const df of this.world.dustFields) {
      const posAttr = df.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const count = df.phases.length;
      for (let i = 0; i < count; i += 1) {
        const ph = df.phases[i];
        const i3 = i * 3;
        arr[i3] = df.basePositions[i3] + Math.sin(tSec * df.speed + ph) * df.amplitude;
        arr[i3 + 1] =
          df.basePositions[i3 + 1] +
          Math.cos(tSec * df.speed * 0.8 + ph * 1.3) * (df.amplitude * 0.75);
        arr[i3 + 2] =
          df.basePositions[i3 + 2] + Math.sin(tSec * df.speed * 0.6 + ph * 0.7) * (df.amplitude * 0.8);
      }
      posAttr.needsUpdate = true;
    }

    // Parallax dolce del puntatore
    this.smoothLookX += (this.pointerNormX * 0.24 - this.smoothLookX) * Math.min(1, dt * 4);
    this.smoothLookY += (this.pointerNormY * 0.14 - this.smoothLookY) * Math.min(1, dt * 4);

    // Dissolvenza delle scritte a 45° quando ci si avvicina al portale
    const updateSignFade = (sign: { group: THREE.Group; material: THREE.MeshBasicMaterial }) => {
      const d = this.camera.position.distanceTo(sign.group.position);
      const op = Math.max(0, Math.min(0.96, (d - 1.8) / 3.2));
      sign.material.opacity = op;
      sign.group.visible = op > 0.04;
    };
    updateSignFade(this.world.portalLeftSign);
    updateSignFade(this.world.portalRightSign);
    updateSignFade(this.world.portalCenterSign);

    // Apertura/chiusura fisica fluida del Libro 3D sul leggio (chiuso all'ingresso, si apre alla fermata)
    const bookOpenTarget =
      this.activeZone === "room3" && this.zoneIndexTarget >= 0.55 ? 1 : 0;
    this.bookOpenProgress += (bookOpenTarget - this.bookOpenProgress) * Math.min(1, dt * 4.5);
    this.world.bookLectern.bookCoverPivot.rotation.z =
      -Math.PI * (1 - this.bookOpenProgress) + 0.08 * this.bookOpenProgress;

    // 1. Sequenza porte persistenti Sala Opera
    if (this.doorSequence) {
      const seq = this.doorSequence;
      const elapsed = now - seq.startMs;

      if (seq.stage === "close-prev") {
        const t = Math.min(1, elapsed / 320);
        const ease = 1 - Math.pow(1 - t, 2);
        this.applyDoorAngle(1.4 * (1 - ease));
        if (t >= 1) {
          seq.onClosed?.();
          seq.stage = "swing-open";
          seq.startMs = now;
        }
      } else if (seq.stage === "swing-open") {
        const t = Math.min(1, elapsed / 420);
        const ease = 1 - Math.pow(1 - t, 3);
        this.applyDoorAngle(ease * 1.4);
        this.currentCamPos.lerpVectors(seq.fromPos, new THREE.Vector3(0, 2.8, -19.2), ease);
        this.currentLookAt.lerpVectors(seq.fromLook, new THREE.Vector3(0, 3.4, -28.0), ease);
        if (t >= 1) {
          seq.stage = "walk-in";
          seq.startMs = now;
        }
      } else {
        const t = Math.min(1, elapsed / 560);
        const ease = t * t * (3 - 2 * t);
        const wp0 = WAYPOINTS.room4[0];
        this.currentCamPos.lerpVectors(
          new THREE.Vector3(0, 2.8, -19.2),
          new THREE.Vector3(wp0[0], wp0[1], wp0[2]),
          ease,
        );
        this.currentLookAt.lerpVectors(
          new THREE.Vector3(0, 3.4, -28.0),
          new THREE.Vector3(wp0[3], wp0[4], wp0[5]),
          ease,
        );
        if (t >= 1) {
          const done = seq.resolve;
          this.doorSequence = null;
          this.activeZone = "room4";
          this.zoneIndexTarget = 0;
          this.sala4CustomFocus = null;
          this.callbacks.onZoneChange?.("room4");
          done();
        }
      }

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      this.emitVisitorPosition(now);
      return;
    }

    // 2. Volo fluido tra waypoint di stanze diverse
    if (this.activeFlight && this.activeFlight.waypoints.length > 0) {
      const wp = this.activeFlight.waypoints[0];
      this.tempTargetPos.set(wp[0], wp[1], wp[2]);
      this.tempTargetLook.set(wp[3], wp[4], wp[5]);

      const k = 1 - Math.exp(-dt * 5.2);
      this.currentCamPos.lerp(this.tempTargetPos, k);
      this.currentLookAt.lerp(this.tempTargetLook, k);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      this.emitVisitorPosition(now);

      if (this.currentCamPos.distanceTo(this.tempTargetPos) < 1.8) {
        this.activeFlight.waypoints.shift();
        if (this.activeFlight.waypoints.length === 0) {
          const done = this.activeFlight.onComplete;
          this.activeFlight = null;
          done();
        }
      }
      return;
    }

    // 3. Navigazione a waypoint ordinati nella sala corrente
    const wps = WAYPOINTS[this.activeZone];
    const maxIdx = wps.length - 1;

    if (this.activeZone === "room4" && this.sala4CustomFocus === "audio") {
      this.tempTargetPos.set(-4.6, 2.15, -33.2);
      this.tempTargetLook.set(-8.0, 1.35, -35.0);
    } else {
      sampleWaypoint(wps, this.zoneIndexTarget, this.tempTargetPos, this.tempTargetLook);
      if (this.activeZone === "room4") {
        const wide = this.container.clientWidth >= 1024;
        const shiftX = wide && this.sala4DrawerOpen && this.zoneIndexTarget < 1.5 ? 1.15 : 0;
        this.tempTargetPos.x += shiftX;
        this.tempTargetLook.x += shiftX * 0.35;
      }
    }

    const damp = 1 - Math.exp(-dt * 3.4);
    this.currentCamPos.lerp(this.tempTargetPos, damp);
    this.currentLookAt.lerp(this.tempTargetLook, damp);

    const progress = maxIdx > 0 ? this.zoneIndexTarget / maxIdx : 0;
    this.reportScroll(progress);

    if (this.activeZone === "room1") {
      this.reportHallStage(this.zoneIndexTarget);
    } else if (this.activeZone === "room2") {
      this.reportNearestTerritoryArtwork(this.tempTargetLook);
    } else if (this.activeZone === "room3") {
      this.reportSala3Stage(this.zoneIndexTarget);
    } else if (this.activeZone === "room4" && !this.sala4CustomFocus) {
      this.reportSala4Focus(this.zoneIndexTarget);
    }

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(
      this.currentLookAt.x + this.smoothLookX * 0.55,
      this.currentLookAt.y + this.smoothLookY * 0.4,
      this.currentLookAt.z,
    );
    this.emitVisitorPosition(now);
  }

  private emitVisitorPosition(now: number) {
    if (now - this.lastPosEmitMs < 140) return;
    this.lastPosEmitMs = now;
    this.callbacks.onVisitorPositionChange?.({
      x: this.currentCamPos.x,
      z: this.currentCamPos.z,
    });
  }

  private reportScroll(progress: number) {
    if (Math.abs(progress - this.lastReportedProgress) > 0.006) {
      this.lastReportedProgress = progress;
      this.callbacks.onScrollChange?.(progress);
    }
  }

  private reportHallStage(idx: number) {
    let stage: HallStage = "overview";
    if (idx >= 2.55) stage = "qr";
    else if (idx >= 1.55) stage = "doors";

    if (stage !== this.lastHallStage) {
      this.lastHallStage = stage;
      this.callbacks.onHallStageChange?.(stage);
    }
  }

  private reportNearestTerritoryArtwork(lookPt: THREE.Vector3) {
    if (this.zoneIndexTarget > 7.45) {
      if (this.lastNearestId !== null) {
        this.lastNearestId = null;
        this.callbacks.onNearestTerritoryArtwork?.(null);
      }
      return;
    }

    let best: OperaNearbyOut | null = null;
    let bestDist = Infinity;
    for (const slot of this.world.territorySlots) {
      if (!slot.opera || !slot.group.visible) continue;
      const d = Math.abs(slot.xPos - lookPt.x);
      if (d < bestDist && d < 4.5) {
        bestDist = d;
        best = slot.opera;
      }
    }

    const nextId = best?.id ?? null;
    if (nextId !== this.lastNearestId) {
      this.lastNearestId = nextId;
      this.callbacks.onNearestTerritoryArtwork?.(best);
    }
  }

  private reportSala3Stage(idx: number) {
    let stage: Sala3Stage = "entry";
    if (idx >= 6.45) stage = "graph";
    else if (idx >= 5.45) stage = "stele-narrazione";
    else if (idx >= 4.45) stage = "stele-archivio";
    else if (idx >= 3.45) stage = "stele-descrizione";
    else if (idx >= 0.65 && idx <= 2.45) stage = "book";

    if (stage !== this.lastSala3Stage) {
      this.lastSala3Stage = stage;
      this.callbacks.onSala3StageChange?.(stage);
    }
  }

  private reportSala4Focus(idx: number) {
    let focus: Sala4ExhibitFocus = "overview";
    if (idx >= 4.55) focus = "armchair";
    else if (idx >= 3.55) focus = "connections";
    else if (idx >= 2.55) focus = "archive";
    else if (idx >= 1.55) focus = "author";
    else if (idx >= 0.55) focus = "artwork";

    if (focus !== this.lastSala4Focus) {
      this.lastSala4Focus = focus;
      this.callbacks.onSala4FocusChange?.(focus);
    }
  }

  public dispose() {
    if (this.disposed) return;
    this.disposed = true;

    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.doorSequence) {
      this.doorSequence.resolve();
      this.doorSequence = null;
    }
    this.activeFlight = null;
    this.unbindEvents();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Sprite) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat) {
            disposeMaterialMaps(mat);
            mat.dispose();
          }
        });
      }
    });

    this.envDispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
