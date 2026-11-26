import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RaceAudioEngine } from './audioEngine';
import {
  CarModelRig,
  TrafficVehicleRig,
  createAutoRickshawModel,
  createDecoratedTruckModel,
  createDesiBusModel,
  createTrafficSedanModel,
  createVehicleModel,
} from './carModel';
import {
  DriftTrailParticleSystem,
  PooledParticleSystem,
  SparkParticleSystem,
  SpeedStreakSystem,
  WeatherParticleSystem,
} from './particles';
import {
  DEFAULT_BILLBOARD_PHOTO_URL,
  createCockpitClusterTexture,
  createContactShadowTexture,
  createEnvironmentEquirectTexture,
  createEnvironmentSkyTexture,
  createPoliceDecalTexture,
  createTruckArtTexture,
} from './textures';
import {
  EnvironmentLightingConfig,
  RaceTrack,
  TrackQueryResult,
  getEnvironmentLighting,
} from './track';
import {
  CAR_COLOR_PRESETS,
  CAR_WHEEL_PRESETS,
  CameraMode,
  CarColorPreset,
  CarWheelPreset,
  DynamicWeatherCondition,
  GAME_MODES,
  GameModeId,
  GamePhase,
  GraphicsQuality,
  HudSnapshot,
  InputState,
  MirrorViewportRect,
  ModeConfig,
  PursuitAlertLevel,
  RaceSegmentMetric,
  RacerMinimapDot,
  RacerStanding,
  RearMirrorBlip,
  VEHICLES,
  VehicleSpec,
  WeatherType,
} from './types';

const GFX_STORAGE_KEY = 'cheema_coast_gfx_v1';

function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 820;
  return hasTouch || coarse || smallViewport;
}

function loadSavedGraphicsQuality(): GraphicsQuality | null {
  try {
    const raw = window.localStorage?.getItem(GFX_STORAGE_KEY);
    if (raw === 'LOW' || raw === 'MEDIUM' || raw === 'HIGH') return raw;
  } catch {
    // Ignore storage errors
  }
  return null;
}

interface RacerState {
  id: string;
  name: string;
  isPlayer: boolean;
  isPolice: boolean;
  isSuspect: boolean;
  active: boolean;
  eliminated: boolean;
  colorCss: string;
  spec: VehicleSpec;
  model: CarModelRig;
  pos: THREE.Vector3;
  heading: number;
  speed: number;
  driftSlip: number;
  steerInput: number;
  nitro: number;
  boostPadTimer: number;
  isBoosting: boolean;
  isDrifting: boolean;
  sampleHint: number;
  t: number;
  lap: number;
  lapStartedAtMs: number;
  bestLapMs: number | null;
  totalProgress: number;
  finished: boolean;
  finishTimeMs: number;
  aiTargetLane: number;
  aiLaneTimer: number;
  aiBaseSkill: number;
  aiNitroCooldown: number;
  disabledTimer: number;
  policeRoleOffset: number;
  swerveTimer: number;
  nearMissCooldown: number;
  suspectHealth: number;
}

interface TrafficCarState {
  id: string;
  rig: TrafficVehicleRig;
  pos: THREE.Vector3;
  heading: number;
  t: number;
  lane: number;
  speed: number;
  radius: number;
  nearMissCooldown: number;
  active: boolean;
}

// Pre-allocated scratch vectors (Zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camTargetPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _queryRes: TrackQueryResult = {
  sampleIndex: 0,
  t: 0,
  roadY: 0,
  lateral: 0,
  tangent: new THREE.Vector3(),
  right: new THREE.Vector3(),
  up: new THREE.Vector3(),
  closestPos: new THREE.Vector3(),
};

const ESCAPE_DURATION_MS = 90_000;
const DRIFT_DURATION_MS = 90_000;
const TRAFFIC_DURATION_MS = 90_000;
const COP_TAKEDOWN_DURATION_MS = 90_000;
const KNOCKOUT_INTERVAL_MS = 25_000;
const CHECKPOINT_START_MS = 24_000;
const CHECKPOINT_BONUS_MS = 8_000;
const CHECKPOINT_TARGET = 10;
const WEATHER_PHASE_DURATION_S = 20;

// Pre-allocated scratch colors for dynamic weather atmosphere (Zero GC in render loop)
const _baseBgColor = new THREE.Color();
const _baseFogColor = new THREE.Color();
const _baseSunColor = new THREE.Color();
const _baseHemiSkyColor = new THREE.Color();
const _baseHemiGroundColor = new THREE.Color();
const _baseRimColor = new THREE.Color();

const _sunnyBgTarget = new THREE.Color();
const _sunnyFogTarget = new THREE.Color();
const _sunnySunTarget = new THREE.Color();
const _sunnyWarmBoost = new THREE.Color(0xffe1a8);
const _sunnySkyTint = new THREE.Color(0xffffff);

const _rainBgTarget = new THREE.Color(0x0b1528);
const _rainFogTarget = new THREE.Color(0x162640);
const _rainSunTarget = new THREE.Color(0x7ca6d8);
const _rainHemiSkyTarget = new THREE.Color(0x5275a3);
const _rainRimTarget = new THREE.Color(0x38bdf8);
const _rainSkyTint = new THREE.Color(0x63799b);

const _fogBgTarget = new THREE.Color();
const _fogFogTarget = new THREE.Color();
const _fogSunTarget = new THREE.Color(0xc4d0dc);
const _fogHemiSkyTarget = new THREE.Color(0x9fb0c2);
const _fogRimTarget = new THREE.Color(0x94a3b8);
const _fogSkyTint = new THREE.Color(0x97a6b8);

const _workColor = new THREE.Color();
const _workSkyTint = new THREE.Color(0xffffff);
const _paintColor = new THREE.Color();
const _smokeColor = new THREE.Color();

export class RaceEngine {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly rearCamera: THREE.PerspectiveCamera;
  private readonly composer: EffectComposer | null = null;
  private readonly bloomPass: UnrealBloomPass | null = null;
  private readonly isSoftwareGl: boolean;
  private readonly isMobileDevice: boolean;
  private readonly maxAnisotropy: number;
  private graphicsQuality: GraphicsQuality = 'HIGH';
  private hasUserQualityOverride = false;
  private adaptiveResScale = 1.0;
  private fpsSampleAccum = 0;
  private fpsFrameCount = 0;
  private lowFpsStreaks = 0;
  private lastShadowSize = 2048;

  private track: RaceTrack;
  private readonly particles: PooledParticleSystem;
  private readonly driftTrails: DriftTrailParticleSystem;
  private readonly sparks: SparkParticleSystem;
  private readonly speedStreaks: SpeedStreakSystem;
  private readonly weather: WeatherParticleSystem;
  public readonly audio = new RaceAudioEngine();

  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly rimLight: THREE.DirectionalLight;
  private readonly policeStrobeLight: THREE.PointLight;
  private readonly skyDome: THREE.Mesh;
  private readonly pmremGenerator: THREE.PMREMGenerator;
  private envTexture: THREE.Texture;
  private currentEnvStyle: ModeConfig['environmentStyle'] | null = null;
  private readonly contactShadowTex: THREE.CanvasTexture;
  private skyTex: THREE.CanvasTexture;
  private readonly truckArtTex: THREE.CanvasTexture;
  private readonly policeDecalTex: THREE.CanvasTexture;
  private readonly cockpitClusterTex: THREE.CanvasTexture;
  private billboardPhotoImg: HTMLImageElement | null = null;

  private currentVehicle: VehicleSpec;
  private currentPreset: CarColorPreset;
  private currentWheelPreset: CarWheelPreset = CAR_WHEEL_PRESETS[0];
  private currentNeonHex: number = CAR_COLOR_PRESETS[0].accentHex;
  private truckArtEnabled = true;

  private readonly racers: RacerState[] = [];
  private readonly policeCars: RacerState[] = [];
  private readonly trafficCars: TrafficCarState[] = [];
  private ghostRig: CarModelRig | null = null;
  private ghostT = 0.99;
  private ghostPos = new THREE.Vector3();
  private readonly player: RacerState;

  private phase: GamePhase = 'TITLE';
  private mode: GameModeId = 'CIRCUIT_RACE';
  private modeConfig: ModeConfig = GAME_MODES[0];
  private totalLaps = 3;
  private cameraMode: CameraMode = 'CHASE';
  private mirrorEnabled = true;
  private mirrorRect: MirrorViewportRect | null = null;
  private readonly rearBlipsBuf: RearMirrorBlip[] = [];

  private countdownTimer = 3.2;
  private lastCountdownInt = 4;
  private raceTimeMs = 0;
  private modeTimerMs = 90_000;
  private knockoutNextMs = KNOCKOUT_INTERVAL_MS;
  private checkpointsCleared = 0;
  private lastCheckpointIdx = -1;
  private dragLaunchEvaluated = false;

  private topSpeedKmh = 0;
  private score = 0;
  private driftScore = 0;
  private comboMultiplier = 1;
  private comboDecayTimer = 0;
  private nearMisses = 0;

  private readonly lapMetrics: RaceSegmentMetric[] = [];
  private readonly speedSplits: RaceSegmentMetric[] = [];
  private lapTopSpeedKmh = 0;
  private lapSpeedSum = 0;
  private lapSpeedSamples = 0;
  private lapDriftStart = 0;
  private splitElapsedMs = 0;
  private splitTopSpeedKmh = 0;
  private splitSpeedSum = 0;
  private splitSpeedSamples = 0;
  private splitDriftStart = 0;
  private splitIndex = 0;

  private hullIntegrity = 100;
  private impactFlash = 0;
  private slowMoTimer = 0;
  private timeScale = 1;
  private engineSmokeAccum = 0;
  private scrapeCooldown = 0;

  private policeHeat = 20;
  private wantedStars = 1;
  private pursuitAlert: PursuitAlertLevel = 'NONE';
  private policeCloseWarning = false;
  private wasInCloseChase = false;
  private nearestPoliceDist = 999;
  private bustProgress = 0;
  private busted = false;
  private victory = true;
  private resultHeadline = '';
  private resultSubline = '';
  private takedowns = 0;
  private wasBoostingPrev = false;

  private bannerText: string | null = null;
  private bannerTimer = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private cameraKick = 0;
  private elapsed = 0;
  private hudEmitAccum = 0;

  // Dynamic weather state (cycles SUNNY -> RAIN -> FOGGY during racing)
  private baseLighting: EnvironmentLightingConfig = getEnvironmentLighting('coastal');
  private weatherCondition: DynamicWeatherCondition = 'SUNNY';
  private weatherPhaseTimer = 0;
  private weatherBlendSunny = 1;
  private weatherBlendRain = 0;
  private weatherBlendFog = 0;
  private weatherGripFactor = 1.04;
  private currentSurfaceWetness = 0;

  // Interactive 3D Garage orbit camera state
  private garageOrbitYaw = 0.65;
  private garageOrbitPitch = 0.22;
  private garageZoom = 1.0;
  private garageFocusMode = false;
  private garageTargetYaw = 0.65;
  private garageTargetPitch = 0.22;
  private garagePresetSnapTimer = 0;
  private garageDragResumeTimer = 0;

  private frameId = 0;
  private lastTime = performance.now();
  private disposed = false;

  private input: InputState = {
    throttle: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  };

  private readonly onHudUpdate: (snapshot: HudSnapshot) => void;
  private readonly cameraPos = new THREE.Vector3();
  private readonly cameraLook = new THREE.Vector3();
  private cameraRoll = 0;

  constructor(
    container: HTMLElement,
    initialVehicle: VehicleSpec,
    initialPreset: CarColorPreset,
    onHudUpdate: (snapshot: HudSnapshot) => void,
  ) {
    this.container = container;
    this.currentVehicle = initialVehicle;
    this.currentPreset = initialPreset;
    this.currentNeonHex = initialPreset.accentHex;
    this.onHudUpdate = onHudUpdate;
    this.audio.setEngineTimbre(initialVehicle.physics.engineTimbre);

    // 1. Software WebGL & Mobile GPU Tier probe
    this.isMobileDevice = detectMobileDevice();
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const savedQuality = loadSavedGraphicsQuality();
    if (savedQuality) {
      this.graphicsQuality = this.isSoftwareGl ? 'LOW' : savedQuality;
      this.hasUserQualityOverride = !this.isSoftwareGl;
    } else if (this.isSoftwareGl) {
      this.graphicsQuality = 'LOW';
    } else if (this.isMobileDevice) {
      this.graphicsQuality = 'MEDIUM';
    } else {
      this.graphicsQuality = 'HIGH';
    }

    // 2. Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && !this.isMobileDevice,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.computeTargetPixelRatio());
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.graphicsQuality !== 'LOW';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
    container.appendChild(this.renderer.domElement);
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // 3. Scene, Sky & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13172b);
    this.scene.fog = new THREE.FogExp2(0x161a30, 0.00145);

    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.25, 1900);
    this.rearCamera = new THREE.PerspectiveCamera(66, 2.8, 0.25, 650);

    // Dynamic Procedural Equirectangular Environment Reflections (PMREM)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.currentEnvStyle = this.modeConfig.environmentStyle;
    this.envTexture = this.buildEnvTextureForStyle(this.currentEnvStyle);
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 1.15;

    // Sky dome
    this.skyTex = createEnvironmentSkyTexture(this.modeConfig.environmentStyle);
    const skyGeo = new THREE.SphereGeometry(1300, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    // 4. Dynamic Environment Lighting
    this.hemiLight = new THREE.HemisphereLight(0x7fb4ff, 0x1b2338, 1.08);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffb580, 2.35);
    this.sunLight.position.set(110, 85, -140);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = this.isSoftwareGl ? 512 : 2048;
    this.sunLight.shadow.mapSize.height = this.isSoftwareGl ? 512 : 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 280;
    const d = 62;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x3ad7ff, 0.85);
    this.rimLight.position.set(-90, 45, 110);
    this.scene.add(this.rimLight);

    this.policeStrobeLight = new THREE.PointLight(0x3b82f6, 0, 26, 1.8);
    this.scene.add(this.policeStrobeLight);

    // 5. Track, Particles, Sparks, Speed Streaks & Weather
    this.track = new RaceTrack(this.maxAnisotropy, this.modeConfig, this.billboardPhotoImg);
    this.scene.add(this.track.group);

    this.particles = new PooledParticleSystem(420);
    this.scene.add(this.particles.mesh);

    this.driftTrails = new DriftTrailParticleSystem(280);
    this.scene.add(this.driftTrails.mesh);

    this.sparks = new SparkParticleSystem(260);
    this.scene.add(this.sparks.mesh);

    this.speedStreaks = new SpeedStreakSystem(52);
    this.scene.add(this.speedStreaks.mesh);

    this.weather = new WeatherParticleSystem(180);
    this.weather.setWeather(this.modeConfig.weather);
    this.scene.add(this.weather.mesh);

    // 6. Textures for Cars, Bikes, Police & Desi Traffic
    this.contactShadowTex = createContactShadowTexture();
    this.truckArtTex = createTruckArtTexture(this.maxAnisotropy);
    this.policeDecalTex = createPoliceDecalTexture(this.maxAnisotropy);
    this.cockpitClusterTex = createCockpitClusterTexture(this.maxAnisotropy);
    this.setBillboardPhoto(DEFAULT_BILLBOARD_PHOTO_URL);

    // Player Vehicle
    const playerRig = createVehicleModel(
      initialPreset.hex,
      initialPreset.accentHex,
      this.contactShadowTex,
      {
        vehicleSpec: initialVehicle,
        truckArtEnabled: this.truckArtEnabled,
        truckArtTexture: this.truckArtTex,
        policeDecalTexture: this.policeDecalTex,
        cockpitClusterTexture: this.cockpitClusterTex,
      },
    );
    this.scene.add(playerRig.root);

    this.player = {
      id: 'player',
      name: 'YOU',
      isPlayer: true,
      isPolice: false,
      isSuspect: false,
      active: true,
      eliminated: false,
      colorCss: initialPreset.css,
      spec: initialVehicle,
      model: playerRig,
      pos: new THREE.Vector3(),
      heading: 0,
      speed: 0,
      driftSlip: 0,
      steerInput: 0,
      nitro: 100,
      boostPadTimer: 0,
      isBoosting: false,
      isDrifting: false,
      sampleHint: 0,
      t: 0,
      lap: 1,
      lapStartedAtMs: 0,
      bestLapMs: null,
      totalProgress: 0,
      finished: false,
      finishTimeMs: 0,
      aiTargetLane: 0,
      aiLaneTimer: 0,
      aiBaseSkill: 1,
      aiNitroCooldown: 0,
      disabledTimer: 0,
      policeRoleOffset: 0,
      swerveTimer: 0,
      nearMissCooldown: 0,
      suspectHealth: 100,
    };
    this.racers.push(this.player);

    const pickVehicle = (id: string, fallbackIdx: number): VehicleSpec =>
      VEHICLES.find((v) => v.id === id) ?? VEHICLES[fallbackIdx % VEHICLES.length];

    // 3 AI Rivals / Suspects across diverse vehicle shapes
    const rivalConfigs = [
      { id: 'ai-1', name: 'Z. CHEEMA', spec: pickVehicle('koenig-mega', 1), preset: CAR_COLOR_PRESETS[1], skill: 1.0 },
      { id: 'ai-2', name: 'A. MALIK', spec: pickVehicle('gt-coupe', 9), preset: CAR_COLOR_PRESETS[2], skill: 0.96 },
      { id: 'ai-3', name: 'R. KHAN', spec: pickVehicle('superbike-1000', 17), preset: CAR_COLOR_PRESETS[3], skill: 0.94 },
    ];

    rivalConfigs.forEach((rc) => {
      const rig = createVehicleModel(
        rc.preset.hex,
        rc.preset.accentHex,
        this.contactShadowTex,
        {
          vehicleSpec: rc.spec,
          truckArtEnabled: true,
          truckArtTexture: this.truckArtTex,
        },
      );
      this.scene.add(rig.root);
      this.racers.push({
        id: rc.id,
        name: rc.name,
        isPlayer: false,
        isPolice: false,
        isSuspect: false,
        active: true,
        eliminated: false,
        colorCss: rc.preset.css,
        spec: rc.spec,
        model: rig,
        pos: new THREE.Vector3(),
        heading: 0,
        speed: 0,
        driftSlip: 0,
        steerInput: 0,
        nitro: 100,
        boostPadTimer: 0,
        isBoosting: false,
        isDrifting: false,
        sampleHint: 0,
        t: 0,
        lap: 1,
        lapStartedAtMs: 0,
        bestLapMs: null,
        totalProgress: 0,
        finished: false,
        finishTimeMs: 0,
        aiTargetLane: 0,
        aiLaneTimer: 1.5,
        aiBaseSkill: rc.skill,
        aiNitroCooldown: 3 + Math.random() * 4,
        disabledTimer: 0,
        policeRoleOffset: 0,
        swerveTimer: 0,
        nearMissCooldown: 0,
        suspectHealth: 100,
      });
    });

    // 4th extra suspect slot for Cop Takedown (ai-4)
    const extraSpec = pickVehicle('rally-hatch', 10);
    const extraPreset = CAR_COLOR_PRESETS[4];
    const extraRig = createVehicleModel(
      extraPreset.hex,
      extraPreset.accentHex,
      this.contactShadowTex,
      { vehicleSpec: extraSpec, truckArtEnabled: true, truckArtTexture: this.truckArtTex },
    );
    this.scene.add(extraRig.root);
    this.racers.push({
      id: 'ai-4',
      name: 'S. RAZA',
      isPlayer: false,
      isPolice: false,
      isSuspect: true,
      active: false,
      eliminated: false,
      colorCss: extraPreset.css,
      spec: extraSpec,
      model: extraRig,
      pos: new THREE.Vector3(),
      heading: 0,
      speed: 0,
      driftSlip: 0,
      steerInput: 0,
      nitro: 100,
      boostPadTimer: 0,
      isBoosting: false,
      isDrifting: false,
      sampleHint: 0,
      t: 0,
      lap: 1,
      lapStartedAtMs: 0,
      bestLapMs: null,
      totalProgress: 0,
      finished: false,
      finishTimeMs: 0,
      aiTargetLane: 0,
      aiLaneTimer: 1.4,
      aiBaseSkill: 0.95,
      aiNitroCooldown: 3.5,
      disabledTimer: 0,
      policeRoleOffset: 0,
      swerveTimer: 0,
      nearMissCooldown: 0,
      suspectHealth: 100,
    });

    // 3 Police Interceptor Cruisers (Executive Sedan, Luxury SUV & Supercharged V8)
    const policeRoleOffsets = [-0.004, 0.003, 0.011];
    const policeSpecs = [
      pickVehicle('sport-sedan', 8),
      pickVehicle('luxury-suv', 16),
      pickVehicle('v8-mid', 3),
    ];
    for (let i = 0; i < 3; i++) {
      const pRig = createVehicleModel(
        0x111827,
        0x3b82f6,
        this.contactShadowTex,
        {
          vehicleSpec: policeSpecs[i],
          isPolice: true,
          policeDecalTexture: this.policeDecalTex,
        },
      );
      this.scene.add(pRig.root);
      this.policeCars.push({
        id: `police-${i + 1}`,
        name: `PATROL-0${i + 1}`,
        isPlayer: false,
        isPolice: true,
        isSuspect: false,
        active: i < 2,
        eliminated: false,
        colorCss: '#3b82f6',
        spec: policeSpecs[i],
        model: pRig,
        pos: new THREE.Vector3(),
        heading: 0,
        speed: 0,
        driftSlip: 0,
        steerInput: 0,
        nitro: 100,
        boostPadTimer: 0,
        isBoosting: false,
        isDrifting: false,
        sampleHint: 0,
        t: 0,
        lap: 1,
        lapStartedAtMs: 0,
        bestLapMs: null,
        totalProgress: 0,
        finished: false,
        finishTimeMs: 0,
        aiTargetLane: i === 0 ? -4 : 4,
        aiLaneTimer: 1.2,
        aiBaseSkill: 1.05 - i * 0.02,
        aiNitroCooldown: 2,
        disabledTimer: 0,
        policeRoleOffset: policeRoleOffsets[i],
        swerveTimer: i * 1.4,
        nearMissCooldown: 0,
        suspectHealth: 100,
      });
    }

    // 22 Poolable Desi Traffic Vehicles (Trucks, Rickshaws, Desi Buses, Sedans, SUVs, Hatchbacks & Pickups)
    const sedanColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xe2e8f0, 0x8b5cf6];
    const lanes = [-5.7, -2.0, 2.0, 5.7];
    for (let i = 0; i < 22; i++) {
      const mod = i % 7;
      const rig =
        mod === 0
          ? createDecoratedTruckModel(this.truckArtTex, this.contactShadowTex)
          : mod === 1
            ? createAutoRickshawModel(this.truckArtTex, this.contactShadowTex)
            : mod === 2
              ? createDesiBusModel(this.truckArtTex, this.contactShadowTex)
              : createTrafficSedanModel(
                  sedanColors[i % sedanColors.length],
                  this.contactShadowTex,
                  mod === 4 ? 'suv' : mod === 5 ? 'hatchback' : mod === 6 ? 'pickup' : 'sedan',
                );
      this.scene.add(rig.root);
      this.trafficCars.push({
        id: `traffic-${i}`,
        rig,
        pos: new THREE.Vector3(),
        heading: 0,
        t: (i + 0.5) / 22,
        lane: lanes[i % lanes.length],
        speed:
          mod === 1
            ? 20
            : mod === 2
              ? 23
              : mod === 0
                ? 25
                : mod === 6
                  ? 29
                  : mod === 4
                    ? 31
                    : mod === 5
                      ? 29
                      : 28,
        radius:
          mod === 2
            ? 2.45
            : mod === 0
              ? 2.15
              : mod === 1
                ? 1.55
                : mod === 6
                  ? 2.02
                  : mod === 4
                    ? 1.92
                    : mod === 5
                      ? 1.62
                      : 1.72,
        nearMissCooldown: 0,
        active: i < 8,
      });
    }

    // Ghost Model for Time Trial
    this.ghostRig = createVehicleModel(
      0x38bdf8,
      0x00f5d4,
      this.contactShadowTex,
      { vehicleSpec: initialVehicle, isGhost: true },
    );
    this.ghostRig.root.visible = false;
    this.scene.add(this.ghostRig.root);

    this.applyEnvironmentLighting(this.modeConfig.environmentStyle);
    this.resetGridPositions();

    // 7. Balanced Selective Bloom Post-Processing (GPU only)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.28,
        0.32,
        0.96,
      );
      this.composer.addPass(this.bloomPass);
      this.renderer.compile(this.scene, this.camera);
    }

    this.applyGraphicsSettings();
    window.addEventListener('resize', this.handleResize);
    this.emitHud();
    this.scheduleNextFrame();
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
  };

  private handleContextRestored = (): void => {
    this.lastTime = performance.now();
  };

  public unlockAudio(): void {
    this.audio.unlock();
  }

  public rotateGaragePreview(dx: number, dy: number): void {
    if (this.phase !== 'TITLE') return;
    this.garagePresetSnapTimer = 0;
    this.garageOrbitYaw -= dx * 0.0085;
    this.garageOrbitPitch = THREE.MathUtils.clamp(
      this.garageOrbitPitch + dy * 0.0055,
      0.06,
      0.72,
    );
    this.garageDragResumeTimer = 2.8;
  }

  public zoomGaragePreview(delta: number): void {
    if (this.phase !== 'TITLE') return;
    this.garageZoom = THREE.MathUtils.clamp(this.garageZoom + delta, 0.58, 1.55);
    this.garageDragResumeTimer = Math.max(this.garageDragResumeTimer, 2.0);
  }

  public setGarageViewPreset(view: '34' | 'FRONT' | 'SIDE' | 'REAR' | 'TOP'): void {
    if (this.phase !== 'TITLE') return;
    const h = this.player.heading;
    if (view === 'FRONT') {
      this.garageTargetYaw = h + Math.PI;
      this.garageTargetPitch = 0.14;
    } else if (view === 'SIDE') {
      this.garageTargetYaw = h + Math.PI * 0.5;
      this.garageTargetPitch = 0.14;
    } else if (view === 'REAR') {
      this.garageTargetYaw = h;
      this.garageTargetPitch = 0.18;
    } else if (view === 'TOP') {
      this.garageTargetYaw = h + Math.PI - 0.58;
      this.garageTargetPitch = 0.68;
    } else {
      this.garageTargetYaw = h + Math.PI - 0.58;
      this.garageTargetPitch = 0.21;
    }
    this.garagePresetSnapTimer = 0.65;
    this.garageDragResumeTimer = 4.2;
  }

  public resetGaragePreview(): void {
    this.garageZoom = 1.0;
    this.setGarageViewPreset('34');
  }

  public setGarageFocusMode(inGarage: boolean): void {
    this.garageFocusMode = inGarage;
    if (inGarage) {
      this.garageZoom = 0.94;
      this.setGarageViewPreset('34');
    } else {
      this.garageZoom = 1.0;
    }
  }

  private computeTargetPixelRatio(): number {
    if (this.isSoftwareGl) return 1;
    const dpr = window.devicePixelRatio || 1;
    const cap =
      this.graphicsQuality === 'HIGH'
        ? this.isMobileDevice
          ? 1.5
          : 2.0
        : this.graphicsQuality === 'MEDIUM'
          ? this.isMobileDevice
            ? 1.25
            : 1.5
          : 1.0;
    return Math.max(0.7, Math.min(dpr, cap) * this.adaptiveResScale);
  }

  private applyGraphicsSettings(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const targetPr = this.computeTargetPixelRatio();
    this.renderer.setPixelRatio(targetPr);
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(targetPr);
      this.composer.setSize(w, h);
    }
    if (this.bloomPass) {
      const bloomScale = this.graphicsQuality === 'HIGH' ? 1 : 0.5;
      this.bloomPass.resolution.set(Math.max(128, Math.round(w * bloomScale)), Math.max(128, Math.round(h * bloomScale)));
    }

    const shadowsOn = !this.isSoftwareGl && this.graphicsQuality !== 'LOW';
    this.renderer.shadowMap.enabled = shadowsOn;
    this.sunLight.castShadow = shadowsOn;

    const targetShadowSize =
      this.graphicsQuality === 'HIGH'
        ? 2048
        : this.isMobileDevice
          ? 512
          : 1024;
    if (targetShadowSize !== this.lastShadowSize) {
      this.lastShadowSize = targetShadowSize;
      this.sunLight.shadow.mapSize.set(targetShadowSize, targetShadowSize);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    }

    const particleScale =
      this.graphicsQuality === 'HIGH'
        ? 1.0
        : this.graphicsQuality === 'MEDIUM'
          ? this.isMobileDevice
            ? 0.45
            : 0.65
          : 0.25;
    this.particles.setBudgetScale(particleScale);
    this.driftTrails.setBudgetScale(particleScale);
    this.sparks.setBudgetScale(particleScale);
    this.weather.setBudgetScale(particleScale);
    this.speedStreaks.setBudgetScale(particleScale);
  }

  public getGraphicsQuality(): GraphicsQuality {
    return this.graphicsQuality;
  }

  public setGraphicsQuality(quality: GraphicsQuality, persist = true): void {
    const effective: GraphicsQuality = this.isSoftwareGl ? 'LOW' : quality;
    this.graphicsQuality = effective;
    this.adaptiveResScale = 1.0;
    this.lowFpsStreaks = 0;
    this.fpsSampleAccum = 0;
    this.fpsFrameCount = 0;
    if (persist && !this.isSoftwareGl) {
      this.hasUserQualityOverride = true;
      try {
        window.localStorage?.setItem(GFX_STORAGE_KEY, effective);
      } catch {
        // Ignore storage errors
      }
    }
    this.applyGraphicsSettings();
    this.emitHud();
  }

  public get isHardwareMirrorSupported(): boolean {
    return !this.isSoftwareGl && this.graphicsQuality === 'HIGH';
  }

  public setMirrorViewportRect(rect: MirrorViewportRect | null): void {
    this.mirrorRect = rect;
  }

  public toggleMirror(): boolean {
    this.mirrorEnabled = !this.mirrorEnabled;
    this.emitHud();
    return this.mirrorEnabled;
  }

  public cycleCameraMode(): CameraMode {
    const order: CameraMode[] = ['CHASE', 'HOOD', 'COCKPIT'];
    const idx = order.indexOf(this.cameraMode);
    this.cameraMode = order[(idx + 1) % order.length];
    this.player.model.setCameraMode(this.phase === 'TITLE' ? 'CHASE' : this.cameraMode);

    // Snap camera promptly when cycling views during a race
    if (this.phase !== 'TITLE') {
      this.snapCameraForCurrentMode();
    }

    const label =
      this.cameraMode === 'HOOD'
        ? 'CAMERA: HOOD VIEW'
        : this.cameraMode === 'COCKPIT'
          ? 'CAMERA: COCKPIT VIEW'
          : 'CAMERA: CHASE VIEW';
    this.showBanner(label, 1.5);
    this.emitHud();
    return this.cameraMode;
  }

  private setBillboardPhoto(srcUrl: string): void {
    const targetSrc = srcUrl && srcUrl.trim().length > 0 ? srcUrl : DEFAULT_BILLBOARD_PHOTO_URL;
    const img = new Image();
    if (targetSrc.startsWith('http://') || targetSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      if (this.disposed) return;
      this.billboardPhotoImg = img;
      this.track.updateBillboardPhoto(img);
    };
    img.onerror = () => {
      if (this.disposed || targetSrc === DEFAULT_BILLBOARD_PHOTO_URL) return;
      this.setBillboardPhoto(DEFAULT_BILLBOARD_PHOTO_URL);
    };
    img.src = targetSrc;
  }

  private rebuildPlayerModel(): void {
    const asPolice = this.mode === 'COP_TAKEDOWN';
    this.scene.remove(this.player.model.root);
    this.player.model.dispose();

    const rig = createVehicleModel(
      asPolice ? 0x111827 : this.currentPreset.hex,
      asPolice ? 0x3b82f6 : this.currentNeonHex,
      this.contactShadowTex,
      {
        vehicleSpec: this.currentVehicle,
        isPolice: asPolice,
        truckArtEnabled: asPolice ? false : this.truckArtEnabled,
        truckArtTexture: this.truckArtTex,
        policeDecalTexture: this.policeDecalTex,
        cockpitClusterTexture: this.cockpitClusterTex,
        wheelHex: this.currentWheelPreset.hex,
        wheelMetalness: this.currentWheelPreset.metalness,
        wheelRoughness: this.currentWheelPreset.roughness,
      },
    );
    if (!asPolice) {
      rig.setPaintColor(
        this.currentPreset.hex,
        this.currentNeonHex,
        this.currentPreset.finish,
      );
      rig.setWheelFinish(
        this.currentWheelPreset.hex,
        this.currentWheelPreset.metalness,
        this.currentWheelPreset.roughness,
      );
    }
    rig.setCameraMode(this.phase === 'TITLE' ? 'CHASE' : this.cameraMode);
    rig.setDamageLevel(1 - this.hullIntegrity / 100);
    this.scene.add(rig.root);
    this.player.model = rig;
    this.player.spec = this.currentVehicle;
    this.player.isPolice = asPolice;

    // Also update ghost rig to match player's chosen vehicle silhouette
    if (this.ghostRig) {
      this.scene.remove(this.ghostRig.root);
      this.ghostRig.dispose();
    }
    this.ghostRig = createVehicleModel(
      0x38bdf8,
      0x00f5d4,
      this.contactShadowTex,
      { vehicleSpec: this.currentVehicle, isGhost: true },
    );
    this.ghostRig.root.visible = this.mode === 'TIME_TRIAL' && this.phase === 'RACING';
    this.scene.add(this.ghostRig.root);
  }

  public setVehicle(spec: VehicleSpec): void {
    this.currentVehicle = spec;
    this.audio.setEngineTimbre(spec.physics.engineTimbre);
    this.rebuildPlayerModel();
    this.resetGridPositions();
    this.emitHud();
  }

  public setPlayerColor(preset: CarColorPreset): void {
    this.currentPreset = preset;
    this.currentNeonHex = preset.accentHex;
    this.player.colorCss = preset.css;
    if (this.mode !== 'COP_TAKEDOWN') {
      this.player.model.setPaintColor(preset.hex, this.currentNeonHex, preset.finish);
    }
    const aiPresets = CAR_COLOR_PRESETS.filter((p) => p.id !== preset.id);
    let aiIdx = 0;
    for (const r of this.racers) {
      if (r.isPlayer) continue;
      const p = aiPresets[aiIdx % aiPresets.length];
      r.model.setPaintColor(p.hex, p.accentHex, p.finish);
      r.colorCss = p.css;
      aiIdx++;
    }
    this.emitHud();
  }

  public setNeonColor(hex: number): void {
    this.currentNeonHex = hex;
    if (this.mode !== 'COP_TAKEDOWN') {
      this.player.model.setNeonColor(hex);
    }
    this.emitHud();
  }

  public setWheelPreset(preset: CarWheelPreset): void {
    this.currentWheelPreset = preset;
    if (this.mode !== 'COP_TAKEDOWN') {
      this.player.model.setWheelFinish(preset.hex, preset.metalness, preset.roughness);
    }
    this.emitHud();
  }

  public setTruckArtEnabled(enabled: boolean): void {
    this.truckArtEnabled = enabled;
    if (this.mode !== 'COP_TAKEDOWN') {
      this.player.model.setTruckArtEnabled(enabled);
    }
    this.emitHud();
  }

  private getInitialWeatherForMode(cfg: ModeConfig): DynamicWeatherCondition {
    if (cfg.weather === 'RAIN') return 'RAIN';
    if (cfg.weather === 'MIST') return 'FOGGY';
    return 'SUNNY';
  }

  private getTargetGripForWeather(cond: DynamicWeatherCondition): number {
    if (cond === 'RAIN') return 0.75;
    if (cond === 'FOGGY') return 0.89;
    return 1.04;
  }

  private resetDynamicWeatherState(snapImmediately = true): void {
    const initial = this.getInitialWeatherForMode(this.modeConfig);
    this.weatherCondition = initial;
    this.weatherPhaseTimer = 0;
    if (snapImmediately) {
      this.weatherBlendSunny = initial === 'SUNNY' ? 1 : 0;
      this.weatherBlendRain = initial === 'RAIN' ? 1 : 0;
      this.weatherBlendFog = initial === 'FOGGY' ? 1 : 0;
      this.weatherGripFactor = this.getTargetGripForWeather(initial);
      this.currentSurfaceWetness =
        initial === 'RAIN'
          ? 1
          : initial === 'FOGGY'
            ? 0.32
            : this.modeConfig.environmentStyle === 'cyberpunk_rain' ||
                this.modeConfig.environmentStyle === 'lahore_midnight_gp'
              ? 0.55
              : this.modeConfig.environmentStyle === 'emerald_valley_loop'
                ? 0.45
                : 0;
      this.applyWeatherAtmosphere(true);
    }
  }

  private buildEnvTextureForStyle(style: ModeConfig['environmentStyle']): THREE.Texture {
    const equirect = createEnvironmentEquirectTexture(style);
    const envRT = this.pmremGenerator.fromEquirectangular(equirect);
    equirect.dispose();
    return envRT.texture;
  }

  private applyEnvironmentLighting(style: ModeConfig['environmentStyle']): void {
    const cfg = getEnvironmentLighting(style);
    this.baseLighting = cfg;

    _baseBgColor.setHex(cfg.bgHex);
    _baseFogColor.setHex(cfg.fogHex);
    _baseSunColor.setHex(cfg.sunHex);
    _baseHemiSkyColor.setHex(cfg.hemiSkyHex);
    _baseHemiGroundColor.setHex(cfg.hemiGroundHex);
    _baseRimColor.setHex(cfg.rimHex);

    if (!(this.scene.background instanceof THREE.Color)) {
      this.scene.background = new THREE.Color(cfg.bgHex);
    } else {
      this.scene.background.copy(_baseBgColor);
    }
    if (!(this.scene.fog instanceof THREE.FogExp2)) {
      this.scene.fog = new THREE.FogExp2(cfg.fogHex, cfg.fogDensity);
    } else {
      this.scene.fog.color.copy(_baseFogColor);
      this.scene.fog.density = cfg.fogDensity;
    }

    this.renderer.toneMappingExposure = cfg.exposure;
    this.hemiLight.color.copy(_baseHemiSkyColor);
    this.hemiLight.groundColor.copy(_baseHemiGroundColor);
    this.hemiLight.intensity = cfg.hemiIntensity;
    this.sunLight.color.copy(_baseSunColor);
    this.sunLight.intensity = cfg.sunIntensity;
    this.rimLight.color.copy(_baseRimColor);
    this.rimLight.intensity = cfg.rimIntensity;

    const newSkyTex = createEnvironmentSkyTexture(style);
    const skyMat = this.skyDome.material as THREE.MeshBasicMaterial;
    skyMat.map = newSkyTex;
    skyMat.color.setHex(0xffffff);
    skyMat.needsUpdate = true;
    this.skyTex.dispose();
    this.skyTex = newSkyTex;

    if (this.currentEnvStyle !== style) {
      const nextEnv = this.buildEnvTextureForStyle(style);
      this.scene.environment = nextEnv;
      this.envTexture.dispose();
      this.envTexture = nextEnv;
      this.currentEnvStyle = style;
    }

    this.resetDynamicWeatherState(true);
  }

  private stepDynamicWeather(dt: number, advanceCycle: boolean): void {
    if (advanceCycle) {
      this.weatherPhaseTimer += dt;
      if (this.weatherPhaseTimer >= WEATHER_PHASE_DURATION_S) {
        this.weatherPhaseTimer = 0;
        if (this.weatherCondition === 'SUNNY') {
          this.weatherCondition = 'RAIN';
          this.showBanner('WEATHER SHIFT: HEAVY RAIN · SLICK TRACK', 2.2);
        } else if (this.weatherCondition === 'RAIN') {
          this.weatherCondition = 'FOGGY';
          this.showBanner('WEATHER SHIFT: DENSE FOG · LOW VISIBILITY', 2.2);
        } else {
          this.weatherCondition = 'SUNNY';
          this.showBanner('WEATHER SHIFT: CLEAR SUN · PEAK GRIP', 2.2);
        }
      }
    }

    const targetSunny = this.weatherCondition === 'SUNNY' ? 1 : 0;
    const targetRain = this.weatherCondition === 'RAIN' ? 1 : 0;
    const targetFog = this.weatherCondition === 'FOGGY' ? 1 : 0;

    // Smooth ~3.5s atmospheric transition
    this.weatherBlendSunny = THREE.MathUtils.damp(this.weatherBlendSunny, targetSunny, 0.9, dt);
    this.weatherBlendRain = THREE.MathUtils.damp(this.weatherBlendRain, targetRain, 0.9, dt);
    this.weatherBlendFog = THREE.MathUtils.damp(this.weatherBlendFog, targetFog, 0.9, dt);

    const wSum = Math.max(
      0.001,
      this.weatherBlendSunny + this.weatherBlendRain + this.weatherBlendFog,
    );
    const wS = this.weatherBlendSunny / wSum;
    const wR = this.weatherBlendRain / wSum;
    const wF = this.weatherBlendFog / wSum;

    const targetGrip = wS * 1.04 + wR * 0.75 + wF * 0.89;
    this.weatherGripFactor = THREE.MathUtils.damp(this.weatherGripFactor, targetGrip, 1.4, dt);

    const targetWetness = Math.min(
      1,
      wR * 1.0 +
        wF * 0.32 +
        (this.modeConfig.environmentStyle === 'cyberpunk_rain' ||
        this.modeConfig.environmentStyle === 'lahore_midnight_gp'
          ? 0.55
          : this.modeConfig.environmentStyle === 'emerald_valley_loop'
            ? 0.45
            : 0),
    );
    this.currentSurfaceWetness = THREE.MathUtils.damp(
      this.currentSurfaceWetness,
      targetWetness,
      1.15,
      dt,
    );

    this.applyWeatherAtmosphere(false, wS, wR, wF);
  }

  private applyWeatherAtmosphere(
    snap: boolean,
    wS = this.weatherBlendSunny,
    wR = this.weatherBlendRain,
    wF = this.weatherBlendFog,
  ): void {
    const cfg = this.baseLighting;
    _baseBgColor.setHex(cfg.bgHex);
    _baseFogColor.setHex(cfg.fogHex);
    _baseSunColor.setHex(cfg.sunHex);
    _baseHemiSkyColor.setHex(cfg.hemiSkyHex);
    _baseRimColor.setHex(cfg.rimHex);

    const isDarkBase = _baseBgColor.r + _baseBgColor.g + _baseBgColor.b < 0.42;

    // Sunny target: crisp, vibrant sky and warm golden sun boost
    _sunnyBgTarget.copy(_baseBgColor).lerp(_sunnyWarmBoost, isDarkBase ? 0.06 : 0.14);
    _sunnyFogTarget.copy(_baseFogColor).lerp(_sunnyWarmBoost, isDarkBase ? 0.05 : 0.14);
    _sunnySunTarget.copy(_baseSunColor).lerp(_sunnyWarmBoost, 0.35);

    // Fog target: thick luminous haze for day/sunset, moody slate-blue mist for night
    _fogBgTarget.setHex(isDarkBase ? 0x263448 : 0x8697a8);
    _fogFogTarget.setHex(isDarkBase ? 0x2d3d54 : 0x91a2b3);

    // Background color
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setRGB(
        _sunnyBgTarget.r * wS + _rainBgTarget.r * wR + _fogBgTarget.r * wF,
        _sunnyBgTarget.g * wS + _rainBgTarget.g * wR + _fogBgTarget.g * wF,
        _sunnyBgTarget.b * wS + _rainBgTarget.b * wR + _fogBgTarget.b * wF,
      );
    }

    // Fog color & density
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setRGB(
        _sunnyFogTarget.r * wS + _rainFogTarget.r * wR + _fogFogTarget.r * wF,
        _sunnyFogTarget.g * wS + _rainFogTarget.g * wR + _fogFogTarget.g * wF,
        _sunnyFogTarget.b * wS + _rainFogTarget.b * wR + _fogFogTarget.b * wF,
      );
      const sunnyDensity = cfg.fogDensity * 0.72;
      const rainDensity = Math.max(cfg.fogDensity * 1.95, 0.0031);
      const fogDensity = Math.max(cfg.fogDensity * 4.5, 0.0074);
      this.scene.fog.density = sunnyDensity * wS + rainDensity * wR + fogDensity * wF;
    }

    // Sun light color & intensity
    this.sunLight.color.setRGB(
      _sunnySunTarget.r * wS + _rainSunTarget.r * wR + _fogSunTarget.r * wF,
      _sunnySunTarget.g * wS + _rainSunTarget.g * wR + _fogSunTarget.g * wF,
      _sunnySunTarget.b * wS + _rainSunTarget.b * wR + _fogSunTarget.b * wF,
    );
    this.sunLight.intensity =
      cfg.sunIntensity * (1.22 * wS + 0.44 * wR + 0.4 * wF);

    // Hemisphere sky fill
    this.hemiLight.color.setRGB(
      _baseHemiSkyColor.r * wS + _rainHemiSkyTarget.r * wR + _fogHemiSkyTarget.r * wF,
      _baseHemiSkyColor.g * wS + _rainHemiSkyTarget.g * wR + _fogHemiSkyTarget.g * wF,
      _baseHemiSkyColor.b * wS + _rainHemiSkyTarget.b * wR + _fogHemiSkyTarget.b * wF,
    );
    this.hemiLight.intensity =
      cfg.hemiIntensity * (1.06 * wS + 0.88 * wR + 1.2 * wF);

    // Rim light
    this.rimLight.color.setRGB(
      _baseRimColor.r * wS + _rainRimTarget.r * wR + _fogRimTarget.r * wF,
      _baseRimColor.g * wS + _rainRimTarget.g * wR + _fogRimTarget.g * wF,
      _baseRimColor.b * wS + _rainRimTarget.b * wR + _fogRimTarget.b * wF,
    );
    this.rimLight.intensity =
      cfg.rimIntensity * (0.95 * wS + 1.38 * wR + 0.78 * wF);

    // Sky dome tint & tone mapping exposure
    const skyMat = this.skyDome.material as THREE.MeshBasicMaterial;
    _workSkyTint.setRGB(
      _sunnySkyTint.r * wS + _rainSkyTint.r * wR + _fogSkyTint.r * wF,
      _sunnySkyTint.g * wS + _rainSkyTint.g * wR + _fogSkyTint.g * wF,
      _sunnySkyTint.b * wS + _rainSkyTint.b * wR + _fogSkyTint.b * wF,
    );
    skyMat.color.copy(_workSkyTint);

    this.renderer.toneMappingExposure =
      cfg.exposure * (1.06 * wS + 0.89 * wR + 0.93 * wF);

    this.scene.environmentIntensity = 1.2 * wS + 0.92 * wR + 0.72 * wF;

    if (this.bloomPass) {
      this.bloomPass.strength = 0.26 * wS + 0.36 * wR + 0.22 * wF;
      this.bloomPass.radius = 0.32;
    }

    // Track road wetness (specular reflections in rain, subtle dampness in fog)
    this.track.setSurfaceWetness(this.currentSurfaceWetness);

    // Weather particles: smoothly fade between dominant precipitation / fog / clear motes
    const clearType: WeatherType =
      this.modeConfig.weather === 'SPARKS' ||
      this.modeConfig.weather === 'DUST' ||
      this.modeConfig.weather === 'BOKEH'
        ? this.modeConfig.weather
        : 'BOKEH';

    if (wR >= wF && wR >= wS) {
      this.weather.setWeather('RAIN', snap);
      this.weather.setIntensity(THREE.MathUtils.clamp((wR - 0.18) / 0.82, 0, 1.15));
    } else if (wF >= wR && wF >= wS) {
      this.weather.setWeather('MIST', snap);
      this.weather.setIntensity(THREE.MathUtils.clamp((wF - 0.18) / 0.82, 0, 1.25));
    } else {
      this.weather.setWeather(clearType, snap);
      const clearAlpha =
        clearType === 'BOKEH' ? 0.65 * THREE.MathUtils.clamp((wS - 0.25) / 0.75, 0, 1) : THREE.MathUtils.clamp((wS - 0.2) / 0.8, 0, 1);
      this.weather.setIntensity(clearAlpha);
    }
    void _workColor;
  }

  public setMode(modeId: GameModeId): void {
    if (this.mode === modeId) return;
    const prevWasCop = this.mode === 'COP_TAKEDOWN';
    this.mode = modeId;
    this.modeConfig = GAME_MODES.find((m) => m.id === modeId) ?? GAME_MODES[0];

    // Swap 3D Track & Environment cleanly
    this.scene.remove(this.track.group);
    this.track.dispose();
    this.track = new RaceTrack(this.maxAnisotropy, this.modeConfig, this.billboardPhotoImg);
    this.scene.add(this.track.group);

    this.applyEnvironmentLighting(this.modeConfig.environmentStyle);

    const nowIsCop = modeId === 'COP_TAKEDOWN';
    if (prevWasCop !== nowIsCop) {
      this.rebuildPlayerModel();
    }

    this.resetGridPositions();
    this.emitHud();
  }

  public setInput(next: Partial<InputState>): void {
    Object.assign(this.input, next);
  }

  public startRace(modeOverride?: GameModeId): void {
    if (modeOverride && modeOverride !== this.mode) {
      this.setMode(modeOverride);
    }
    this.audio.unlock();
    this.resetGridPositions();

    this.phase = 'COUNTDOWN';
    this.countdownTimer = 3.2;
    this.lastCountdownInt = 4;
    this.raceTimeMs = 0;

    // Mode-specific initial timers & targets
    this.totalLaps =
      this.mode === 'MIDNIGHT_RUN' ||
      this.mode === 'TIME_TRIAL' ||
      this.mode === 'ZIGZAG_SERPENTINE' ||
      this.mode === 'WAVY_COASTER' ||
      this.mode === 'DESERT_CANYON_HIGHWAY' ||
      this.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
      this.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
      this.mode === 'LAHORE_MIDNIGHT_GP' ||
      this.mode === 'GWADAR_PORT_DOCKS' ||
      this.mode === 'EMERALD_VALLEY_LOOP'
        ? 2
        : this.mode === 'CIRCUIT_RACE' ||
            this.mode === 'MOUNTAIN_HAIRPIN_PASS' ||
            this.mode === 'KARAKORUM_SKY_PASS'
          ? 3
          : 1;

    this.modeTimerMs =
      this.mode === 'POLICE_ESCAPE'
        ? ESCAPE_DURATION_MS
        : this.mode === 'DRIFT_TOUGE'
          ? DRIFT_DURATION_MS
          : this.mode === 'TRAFFIC_RUSH'
            ? TRAFFIC_DURATION_MS
            : this.mode === 'CHECKPOINT_BLITZ'
              ? CHECKPOINT_START_MS
              : this.mode === 'COP_TAKEDOWN'
                ? COP_TAKEDOWN_DURATION_MS
                : 0;

    this.knockoutNextMs = KNOCKOUT_INTERVAL_MS;
    this.checkpointsCleared = 0;
    this.lastCheckpointIdx = -1;
    this.dragLaunchEvaluated = false;

    this.topSpeedKmh = 0;
    this.score = 0;
    this.driftScore = 0;
    this.comboMultiplier = 1;
    this.comboDecayTimer = 0;
    this.nearMisses = 0;

    this.lapMetrics.length = 0;
    this.speedSplits.length = 0;
    this.lapTopSpeedKmh = 0;
    this.lapSpeedSum = 0;
    this.lapSpeedSamples = 0;
    this.lapDriftStart = 0;
    this.splitElapsedMs = 0;
    this.splitTopSpeedKmh = 0;
    this.splitSpeedSum = 0;
    this.splitSpeedSamples = 0;
    this.splitDriftStart = 0;
    this.splitIndex = 0;

    this.policeHeat =
      this.mode === 'POLICE_ESCAPE' ? 65 : this.mode === 'COP_TAKEDOWN' ? 85 : 20;
    this.wantedStars =
      this.mode === 'POLICE_ESCAPE' ? 3 : this.mode === 'COP_TAKEDOWN' ? 4 : 1;
    this.pursuitAlert = 'NONE';
    this.policeCloseWarning = false;
    this.wasInCloseChase = false;
    this.nearestPoliceDist = 999;
    this.bustProgress = 0;
    this.busted = false;
    this.victory = true;
    this.resultHeadline = '';
    this.resultSubline = '';
    this.takedowns = 0;
    this.wasBoostingPrev = false;
    this.bannerText = null;
    this.bannerTimer = 0;
    this.hitstopTimer = 0;
    this.shakeIntensity = 0;
    this.cameraKick = 0;
    this.hullIntegrity = 100;
    this.impactFlash = 0;
    this.slowMoTimer = 0;
    this.timeScale = 1;
    this.engineSmokeAccum = 0;
    this.scrapeCooldown = 0;
    this.audio.setTimeScale(1);
    this.player.model.setDamageLevel(0);
    this.player.model.setCameraMode(this.cameraMode);

    this.snapCameraForCurrentMode();
    this.resetDynamicWeatherState(true);
    this.emitHud();
  }

  public returnToTitle(): void {
    this.resetGridPositions();
    this.resetDynamicWeatherState(true);
    this.phase = 'TITLE';
    this.bannerText = null;
    this.bustProgress = 0;
    this.busted = false;
    this.pursuitAlert = 'NONE';
    this.policeCloseWarning = false;
    this.hullIntegrity = 100;
    this.impactFlash = 0;
    this.slowMoTimer = 0;
    this.timeScale = 1;
    this.audio.setTimeScale(1);
    this.policeStrobeLight.intensity = 0;
    this.player.model.setDamageLevel(0);
    this.player.model.setCameraMode('CHASE');
    this.audio.updateContinuous({
      active: false,
      dt: 0.016,
      rpmRatio: 0,
      speedKmh: 0,
      throttle: false,
      driftIntensity: 0,
      isBoosting: false,
      policeProximity: 0,
      menuMode: true,
    });
    this.emitHud();
  }

  public pauseRace(): void {
    if (this.phase === 'RACING' || this.phase === 'COUNTDOWN') {
      this.phase = 'PAUSED';
      this.audio.updateContinuous({
        active: false,
        dt: 0.016,
        rpmRatio: 0,
        speedKmh: 0,
        throttle: false,
        driftIntensity: 0,
        isBoosting: false,
        policeProximity: 0,
        menuMode: true,
      });
      this.emitHud();
    }
  }

  public resumeRace(): void {
    if (this.phase === 'PAUSED') {
      this.audio.unlock();
      this.phase = this.countdownTimer > 0 ? 'COUNTDOWN' : 'RACING';
      this.lastTime = performance.now();
      this.emitHud();
    }
  }

  private resetGridPositions(): void {
    const isDrag = this.mode === 'DRAG_STRIP';
    const isBlitz = this.mode === 'CHECKPOINT_BLITZ';
    const isCop = this.mode === 'COP_TAKEDOWN';

    const gridSlots = isDrag
      ? [
          { t: 0.055, lateral: -3.4 },
          { t: 0.055, lateral: 3.4 },
          { t: 0.055, lateral: -6.0 },
          { t: 0.055, lateral: 6.0 },
          { t: 0.055, lateral: 0.0 },
        ]
      : isBlitz
        ? [
            { t: 0.03, lateral: 0.0 },
            { t: 0.03, lateral: 3.4 },
            { t: 0.03, lateral: -3.4 },
            { t: 0.03, lateral: 3.4 },
            { t: 0.03, lateral: -3.4 },
          ]
        : isCop
          ? [
              { t: 0.96, lateral: 0.0 },
              { t: 0.025, lateral: -3.5 },
              { t: 0.045, lateral: 3.5 },
              { t: 0.065, lateral: -2.0 },
              { t: 0.085, lateral: 2.5 },
            ]
          : [
              { t: 0.986, lateral: -3.4 },
              { t: 0.99, lateral: 3.4 },
              { t: 0.994, lateral: -3.4 },
              { t: 0.998, lateral: 3.4 },
              { t: 0.982, lateral: 0.0 },
            ];

    this.racers.forEach((r, idx) => {
      let isActive = false;
      if (r.isPlayer) {
        isActive = true;
      } else if (
        this.mode === 'CIRCUIT_RACE' ||
        this.mode === 'KNOCKOUT' ||
        this.mode === 'MIDNIGHT_RUN' ||
        this.mode === 'ZIGZAG_SERPENTINE' ||
        this.mode === 'WAVY_COASTER' ||
        this.mode === 'MOUNTAIN_HAIRPIN_PASS' ||
        this.mode === 'DESERT_CANYON_HIGHWAY' ||
        this.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
        this.mode === 'KARAKORUM_SKY_PASS' ||
        this.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
        this.mode === 'LAHORE_MIDNIGHT_GP' ||
        this.mode === 'GWADAR_PORT_DOCKS' ||
        this.mode === 'EMERALD_VALLEY_LOOP'
      ) {
        isActive = idx <= 3;
      } else if (this.mode === 'DRAG_STRIP') {
        isActive = idx === 1;
      } else if (this.mode === 'COP_TAKEDOWN') {
        isActive = idx >= 1 && idx <= 4;
      }

      r.active = isActive;
      r.eliminated = false;
      r.isSuspect = this.mode === 'COP_TAKEDOWN' && !r.isPlayer;
      r.suspectHealth = 100;
      r.model.root.visible = isActive;

      const slot = gridSlots[idx] ?? gridSlots[0];
      this.track.sampleAtT(slot.t, _v1, _v2, _v3);
      r.pos.copy(_v1).addScaledVector(_v3, slot.lateral);
      r.heading = Math.atan2(-_v2.x, -_v2.z);
      r.speed = 0;
      r.driftSlip = 0;
      r.steerInput = 0;
      r.nitro = 100;
      r.boostPadTimer = 0;
      r.isBoosting = false;
      r.isDrifting = false;
      r.t = slot.t;
      r.sampleHint = Math.floor(slot.t * this.track.sampleCount);
      r.lap = 1;
      r.lapStartedAtMs = 0;
      r.bestLapMs = null;
      r.totalProgress = isDrag || isBlitz ? slot.t : slot.t > 0.8 ? slot.t - 1.0 : slot.t;
      r.finished = false;
      r.finishTimeMs = 0;
      r.aiTargetLane = slot.lateral;
      r.aiLaneTimer = 1 + idx * 0.5;
      r.disabledTimer = 0;
      r.nearMissCooldown = 0;

      r.model.root.position.copy(r.pos);
      r.model.root.rotation.set(0, r.heading, 0);
      r.model.updateVisuals({
        dt: 0.016,
        speed: 0,
        steerAngle: 0,
        bodyRoll: 0,
        bodyPitch: 0,
        isBraking: false,
        isBoosting: false,
        elapsed: 0,
      });
    });

    // Police AI Cruisers
    const hasPoliceAi =
      this.mode === 'CIRCUIT_RACE' ||
      this.mode === 'POLICE_ESCAPE' ||
      this.mode === 'MIDNIGHT_RUN' ||
      this.mode === 'ZIGZAG_SERPENTINE' ||
      this.mode === 'WAVY_COASTER' ||
      this.mode === 'DESERT_CANYON_HIGHWAY' ||
      this.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
      this.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
      this.mode === 'LAHORE_MIDNIGHT_GP' ||
      this.mode === 'GWADAR_PORT_DOCKS';
    const policeCount = this.mode === 'POLICE_ESCAPE' ? 3 : hasPoliceAi ? 2 : 0;

    const policeSlots =
      this.mode === 'POLICE_ESCAPE'
        ? [
            { t: 0.968, lateral: -4.2 },
            { t: 0.974, lateral: 4.2 },
            { t: 0.032, lateral: 0.0 },
          ]
        : [
            { t: 0.045, lateral: -4.2 },
            { t: 0.34, lateral: 4.2 },
            { t: 0.65, lateral: 0.0 },
          ];

    this.policeCars.forEach((p, idx) => {
      const active = idx < policeCount;
      p.active = active;
      p.model.root.visible = active;
      const slot = policeSlots[idx];
      this.track.sampleAtT(slot.t, _v1, _v2, _v3);
      p.pos.copy(_v1).addScaledVector(_v3, slot.lateral);
      p.heading = Math.atan2(-_v2.x, -_v2.z);
      p.speed = 0;
      p.driftSlip = 0;
      p.steerInput = 0;
      p.nitro = 100;
      p.boostPadTimer = 0;
      p.isBoosting = false;
      p.isDrifting = false;
      p.t = slot.t;
      p.sampleHint = Math.floor(slot.t * this.track.sampleCount);
      p.aiTargetLane = slot.lateral;
      p.disabledTimer = 0;
      p.nearMissCooldown = 0;
      p.model.root.position.copy(p.pos);
      p.model.root.rotation.set(0, p.heading, 0);
      p.model.updateVisuals({
        dt: 0.016,
        speed: 0,
        steerAngle: 0,
        bodyRoll: 0,
        bodyPitch: 0,
        isBraking: false,
        isBoosting: false,
        elapsed: 0,
      });
    });

    // Traffic Count by Mode
    const trafficCount =
      this.mode === 'TRAFFIC_RUSH'
        ? 22
        : this.mode === 'DRAG_STRIP' ||
            this.mode === 'TIME_TRIAL' ||
            this.mode === 'DRIFT_TOUGE' ||
            this.mode === 'MOUNTAIN_HAIRPIN_PASS' ||
            this.mode === 'KARAKORUM_SKY_PASS'
          ? 0
          : 8;

    const lanes = [-5.7, -2.0, 2.0, 5.7];
    this.trafficCars.forEach((tc, idx) => {
      tc.active = idx < trafficCount;
      tc.rig.root.visible = tc.active;
      if (!tc.active) return;

      tc.t = (0.06 + (idx / Math.max(1, trafficCount)) * 0.88) % 1;
      tc.lane = lanes[idx % lanes.length];
      tc.nearMissCooldown = 0;
      this.track.sampleAtT(tc.t, _v1, _v2, _v3);
      tc.pos.copy(_v1).addScaledVector(_v3, tc.lane);
      tc.heading = Math.atan2(-_v2.x, -_v2.z);
      tc.rig.root.position.copy(tc.pos);
      tc.rig.root.rotation.set(0, tc.heading, 0);
    });

    // Time Trial Ghost
    if (this.ghostRig) {
      this.ghostT = 0.992;
      this.ghostRig.root.visible = false;
      this.track.sampleAtT(this.ghostT, _v1, _v2, _v3);
      this.ghostPos.copy(_v1);
      this.ghostRig.root.position.copy(_v1);
      this.ghostRig.root.rotation.set(0, Math.atan2(-_v2.x, -_v2.z), 0);
    }

    for (const p of this.track.nitroPickups) {
      p.cooldown = 0;
      p.group.visible = true;
    }
    for (const rb of this.track.roadblocks) {
      rb.brokenTimer = 0;
      rb.group.visible = true;
    }
    this.updateDragTreeVisuals();
  }

  private updateDragTreeVisuals(): void {
    const lights = this.track.dragTreeLights;
    if (!lights || lights.length < 4) return;
    if (this.phase === 'TITLE') {
      lights[0].emissiveIntensity = 0.2;
      lights[1].emissiveIntensity = 0.2;
      lights[2].emissiveIntensity = 0.2;
      lights[3].emissiveIntensity = 0.2;
    } else if (this.phase === 'COUNTDOWN') {
      lights[0].emissiveIntensity = this.countdownTimer < 2.8 ? 4.2 : 0.2;
      lights[1].emissiveIntensity = this.countdownTimer < 1.9 ? 4.2 : 0.2;
      lights[2].emissiveIntensity = this.countdownTimer < 1.0 ? 4.2 : 0.2;
      lights[3].emissiveIntensity = 0.2;
    } else {
      lights[0].emissiveIntensity = 0.2;
      lights[1].emissiveIntensity = 0.2;
      lights[2].emissiveIntensity = 0.2;
      lights[3].emissiveIntensity = 5.5;
    }
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const pr = this.computeTargetPixelRatio();
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
    }
    if (this.bloomPass) {
      const bloomScale = this.graphicsQuality === 'HIGH' ? 1 : 0.5;
      this.bloomPass.resolution.set(Math.max(128, Math.round(w * bloomScale)), Math.max(128, Math.round(h * bloomScale)));
    }
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private finishGame(
    victory: boolean,
    headline: string,
    subline: string,
  ): void {
    if (this.phase === 'FINISHED') return;
    if (this.splitElapsedMs > 700 && this.splitSpeedSamples > 0) {
      const startSec = this.splitIndex * 12;
      const endSec = Math.max(startSec + 1, Math.round(this.raceTimeMs / 1000));
      this.speedSplits.push({
        label: `${startSec}-${endSec}s`,
        timeMs: Math.round(this.splitElapsedMs),
        topSpeedKmh: Math.round(this.splitTopSpeedKmh),
        avgSpeedKmh: Math.round(this.splitSpeedSum / this.splitSpeedSamples),
        driftPts: Math.max(0, this.driftScore - this.splitDriftStart),
      });
      this.splitElapsedMs = 0;
    }
    this.victory = victory;
    this.resultHeadline = headline;
    this.resultSubline = subline;
    this.phase = 'FINISHED';
    this.audio.playLapChime(victory);
    this.emitHud();
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.elapsed += dt;

    // Adaptive Resolution / FPS Watchdog during active racing on GPU devices
    if (
      !this.isSoftwareGl &&
      (this.phase === 'RACING' || this.phase === 'COUNTDOWN') &&
      rawDt > 0.001 &&
      rawDt < 0.12
    ) {
      this.fpsSampleAccum += rawDt;
      this.fpsFrameCount += 1;
      if (this.fpsSampleAccum >= 1.6) {
        const avgFps = this.fpsFrameCount / this.fpsSampleAccum;
        this.fpsSampleAccum = 0;
        this.fpsFrameCount = 0;

        if (avgFps < 45) {
          this.lowFpsStreaks += 1;
          if (this.adaptiveResScale > 0.76) {
            this.adaptiveResScale = Math.max(0.75, Number((this.adaptiveResScale - 0.15).toFixed(2)));
            this.applyGraphicsSettings();
          } else if (!this.hasUserQualityOverride && this.lowFpsStreaks >= 2) {
            if (this.graphicsQuality === 'HIGH') {
              this.setGraphicsQuality('MEDIUM', false);
            } else if (this.graphicsQuality === 'MEDIUM' && avgFps < 38) {
              this.setGraphicsQuality('LOW', false);
            }
          }
        } else if (avgFps >= 57) {
          this.lowFpsStreaks = 0;
          if (this.adaptiveResScale < 1.0) {
            this.adaptiveResScale = Math.min(1.0, Number((this.adaptiveResScale + 0.08).toFixed(2)));
            this.applyGraphicsSettings();
          }
        }
      }
    }

    if (this.phase === 'PAUSED') {
      this.renderScene();
      this.scheduleNextFrame();
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.renderScene();
      this.scheduleNextFrame();
      return;
    }

    if (this.impactFlash > 0) {
      this.impactFlash = Math.max(0, this.impactFlash - dt * 2.4);
    }
    if (this.scrapeCooldown > 0) {
      this.scrapeCooldown = Math.max(0, this.scrapeCooldown - dt);
    }

    if (this.slowMoTimer > 0 && this.phase === 'RACING') {
      this.slowMoTimer = Math.max(0, this.slowMoTimer - dt);
      this.timeScale = THREE.MathUtils.damp(this.timeScale, 0.38, 12, dt);
    } else {
      this.slowMoTimer = 0;
      this.timeScale = THREE.MathUtils.damp(this.timeScale, 1.0, 7.5, dt);
    }
    this.audio.setTimeScale(this.timeScale);
    const simDt = this.phase === 'RACING' ? dt * this.timeScale : dt;

    this.track.updateDynamicProps(simDt, this.elapsed);

    if (this.phase === 'TITLE') {
      this.policeStrobeLight.intensity = 0;
      this.updateTitleCamera(dt);
      this.player.model.updateVisuals({
        dt,
        speed: 0,
        steerAngle: 0,
        bodyRoll: 0,
        bodyPitch: 0,
        isBraking: false,
        isBoosting: false,
        elapsed: this.elapsed,
      });
      this.speedStreaks.update(dt, this.camera, 0, false, false);
      this.stepDynamicWeather(dt, false);
      this.weather.update(dt, this.player.pos);
      this.audio.updateContinuous({
        active: false,
        dt,
        rpmRatio: 0,
        speedKmh: 0,
        throttle: false,
        driftIntensity: 0,
        isBoosting: false,
        policeProximity: 0,
        menuMode: true,
      });
    } else if (this.phase === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      this.updateDragTreeVisuals();
      const countInt = Math.ceil(this.countdownTimer);
      if (countInt !== this.lastCountdownInt && countInt >= 1 && countInt <= 3) {
        this.lastCountdownInt = countInt;
        this.audio.playCountdownTone(false);
      }
      if (this.countdownTimer <= 0) {
        this.phase = 'RACING';
        this.audio.playCountdownTone(true);
        this.updateDragTreeVisuals();

        if (this.mode === 'DRAG_STRIP' && !this.dragLaunchEvaluated) {
          this.dragLaunchEvaluated = true;
          if (this.input.throttle) {
            this.player.speed = 44;
            this.player.boostPadTimer = 1.25;
            this.score += 500;
            this.cameraKick = 1.25;
            this.audio.playBoostPad();
            this.showBanner('PERFECT LAUNCH! +500', 1.4);
          } else {
            this.showBanner('GO! FULL THROTTLE!', 1.2);
          }
        } else {
          const goLabels: Record<GameModeId, string> = {
            CIRCUIT_RACE: 'GO! 3-LAP RACE',
            POLICE_ESCAPE: 'OUTRUN THE POLICE!',
            DRAG_STRIP: 'GO!',
            DRIFT_TOUGE: 'DRIFT THE MOUNTAIN!',
            TIME_TRIAL: 'BEAT THE GHOST!',
            KNOCKOUT: 'SURVIVE THE ELIMINATION!',
            TRAFFIC_RUSH: 'WEAVE FOR COMBOS!',
            CHECKPOINT_BLITZ: 'HIT 10 CHECKPOINTS!',
            MIDNIGHT_RUN: 'NEON RAIN SPRINT!',
            COP_TAKEDOWN: 'WRECK ALL 4 RACERS!',
            ZIGZAG_SERPENTINE: 'CARVE THE ZIGZAG!',
            WAVY_COASTER: 'RIDE THE WAVES!',
            MOUNTAIN_HAIRPIN_PASS: 'CONQUER THE ALPINE PASS!',
            DESERT_CANYON_HIGHWAY: 'OPEN THROTTLE CANYON RUN!',
            MIDNIGHT_HARBOR_CIRCUIT: 'HARBOR DOCKS SPRINT!',
            KARAKORUM_SKY_PASS: 'ATTACK THE SKY PASS!',
            CHOLISTAN_MIRAGE_HIGHWAY: 'FULL BOOST ACROSS THE DUNES!',
            LAHORE_MIDNIGHT_GP: 'LAHORE MIDNIGHT GP — GO!',
            GWADAR_PORT_DOCKS: 'CARVE THE HARBOR DOCKS!',
            EMERALD_VALLEY_LOOP: 'MONSOON VALLEY SPRINT!',
          };
          this.showBanner(goLabels[this.mode], 1.35);
        }
      }

      this.nearestPoliceDist = 999;
      for (const p of this.policeCars) {
        if (!p.active) continue;
        p.model.updateVisuals({
          dt,
          speed: 0,
          steerAngle: 0,
          bodyRoll: 0,
          bodyPitch: 0,
          isBraking: false,
          isBoosting: false,
          elapsed: this.elapsed,
        });
        const d = p.pos.distanceTo(this.player.pos);
        if (d < this.nearestPoliceDist) this.nearestPoliceDist = d;
      }

      this.updatePoliceStrobeLight();
      this.updateChaseCamera(dt);
      this.updateRearMirrorCameraAndBlips();
      this.speedStreaks.update(dt, this.camera, 0, false, false);
      this.stepDynamicWeather(dt, false);
      this.weather.update(dt, this.player.pos);

      const revRatio = this.input.throttle ? 0.72 : 0.16;
      this.audio.updateContinuous({
        active: true,
        dt,
        rpmRatio: revRatio,
        speedKmh: 0,
        throttle: this.input.throttle,
        driftIntensity: 0,
        isBoosting: false,
        policeProximity:
          this.mode === 'POLICE_ESCAPE' || this.mode === 'COP_TAKEDOWN' ? 0.45 : 0.12,
        menuMode: false,
      });
    } else if (this.phase === 'RACING' || this.phase === 'FINISHED') {
      if (this.phase === 'RACING') {
        this.raceTimeMs += simDt * 1000;
        this.stepModeTimers(simDt);
      }
      this.stepDynamicWeather(simDt, this.phase === 'RACING');

      if (this.bannerTimer > 0) {
        this.bannerTimer = Math.max(0, this.bannerTimer - dt);
        if (this.bannerTimer === 0) this.bannerText = null;
      }

      for (const r of this.racers) {
        if (!r.active) continue;
        if (r.isPlayer && this.phase === 'RACING') {
          this.stepPlayerCar(r, simDt);
        } else {
          this.stepAiCar(r, simDt);
        }
      }

      if (this.mode === 'TIME_TRIAL' && this.ghostRig) {
        this.ghostRig.root.visible = true;
        this.ghostT = (this.ghostT + (90 * simDt) / this.track.totalLength) % 1;
        this.track.sampleAtT(this.ghostT, _v1, _v2, _v3);
        const apexLine = Math.sin(this.ghostT * Math.PI * 10) * 3.8;
        this.ghostPos.copy(_v1).addScaledVector(_v3, apexLine);
        this.ghostRig.root.position.copy(this.ghostPos);
        this.ghostRig.root.rotation.set(0, Math.atan2(-_v2.x, -_v2.z), 0);
        this.ghostRig.updateVisuals({
          dt: simDt,
          speed: 90,
          steerAngle: 0,
          bodyRoll: this.currentVehicle.isBike ? Math.cos(this.ghostT * Math.PI * 10) * 0.25 : 0,
          bodyPitch: 0,
          isBraking: false,
          isBoosting: false,
          elapsed: this.elapsed,
        });
      }

      this.nearestPoliceDist = 999;
      for (const p of this.policeCars) {
        if (!p.active) continue;
        this.stepPoliceCar(p, simDt);
        const dist = p.pos.distanceTo(this.player.pos);
        if (dist < this.nearestPoliceDist) {
          this.nearestPoliceDist = dist;
        }
      }

      this.stepTrafficCars(simDt);
      this.updatePursuitMetrics(simDt);
      this.resolveAllCollisions();

      // Damaged engine hood smoke when hullIntegrity < 60%
      if (this.phase === 'RACING' && this.hullIntegrity < 60) {
        this.engineSmokeAccum += simDt;
        const interval = this.hullIntegrity < 30 ? 0.045 : 0.09;
        if (this.engineSmokeAccum >= interval) {
          this.engineSmokeAccum = 0;
          const yaw = this.player.heading + this.player.driftSlip;
          const hx = this.player.pos.x - Math.sin(yaw) * 1.1;
          const hz = this.player.pos.z - Math.cos(yaw) * 1.1;
          this.particles.spawn(
            hx + (Math.random() - 0.5) * 0.35,
            this.player.pos.y + 0.85,
            hz + (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 1.5,
            1.9 + Math.random() * 1.3,
            (Math.random() - 0.5) * 1.5,
            0.75,
            0.42,
            1.65,
            this.hullIntegrity < 30 ? 0x262930 : 0x525866,
          );
        }
      }

      this.particles.update(simDt);
      this.driftTrails.update(simDt);
      this.sparks.update(simDt);
      this.weather.update(simDt, this.player.pos);

      const playerSpeedKmh = Math.abs(this.player.speed) * 3.6;
      if (playerSpeedKmh > this.topSpeedKmh) {
        this.topSpeedKmh = Math.round(playerSpeedKmh);
      }

      if (this.phase === 'RACING') {
        if (playerSpeedKmh > this.lapTopSpeedKmh) this.lapTopSpeedKmh = playerSpeedKmh;
        this.lapSpeedSum += playerSpeedKmh;
        this.lapSpeedSamples += 1;

        if (playerSpeedKmh > this.splitTopSpeedKmh) this.splitTopSpeedKmh = playerSpeedKmh;
        this.splitSpeedSum += playerSpeedKmh;
        this.splitSpeedSamples += 1;
        this.splitElapsedMs += simDt * 1000;

        if (this.splitElapsedMs >= 12_000) {
          const startSec = this.splitIndex * 12;
          const endSec = startSec + 12;
          this.speedSplits.push({
            label: `${startSec}-${endSec}s`,
            timeMs: Math.round(this.splitElapsedMs),
            topSpeedKmh: Math.round(this.splitTopSpeedKmh),
            avgSpeedKmh:
              this.splitSpeedSamples > 0
                ? Math.round(this.splitSpeedSum / this.splitSpeedSamples)
                : 0,
            driftPts: Math.max(0, this.driftScore - this.splitDriftStart),
          });
          this.splitIndex += 1;
          this.splitElapsedMs = 0;
          this.splitTopSpeedKmh = playerSpeedKmh;
          this.splitSpeedSum = 0;
          this.splitSpeedSamples = 0;
          this.splitDriftStart = this.driftScore;
        }
      }

      this.updatePoliceStrobeLight();
      this.updateChaseCamera(dt);
      this.updateRearMirrorCameraAndBlips();
      this.speedStreaks.update(
        dt,
        this.camera,
        playerSpeedKmh,
        this.player.isBoosting,
        this.phase === 'RACING' && this.cameraMode === 'CHASE',
      );

      if (this.phase === 'RACING') {
        const gearSpan = 64;
        const gearCycle = (playerSpeedKmh % gearSpan) / gearSpan;
        const rpmRatio = Math.min(
          1.12,
          0.18 + (playerSpeedKmh / 450) * 0.58 + gearCycle * 0.34,
        );
        const policeProximity =
          this.mode === 'COP_TAKEDOWN'
            ? 0.65
            : THREE.MathUtils.clamp(1 - (this.nearestPoliceDist - 8) / 85, 0, 1);

        this.audio.updateContinuous({
          active: true,
          dt,
          rpmRatio,
          speedKmh: playerSpeedKmh,
          throttle: this.input.throttle,
          driftIntensity: this.player.isDrifting
            ? Math.min(1, Math.abs(this.player.driftSlip) / 0.34)
            : 0,
          isBoosting: this.player.isBoosting,
          policeProximity,
          menuMode: false,
        });
      } else {
        this.audio.updateContinuous({
          active: false,
          dt,
          rpmRatio: 0,
          speedKmh: 0,
          throttle: false,
          driftIntensity: 0,
          isBoosting: false,
          policeProximity: 0,
          menuMode: true,
        });
      }
    }

    this.skyDome.position.copy(this.camera.position);
    _fwd.set(-Math.sin(this.player.heading), 0, -Math.cos(this.player.heading));
    this.sunLight.target.position.copy(this.player.pos).addScaledVector(_fwd, 14);
    this.sunLight.position.set(
      this.sunLight.target.position.x + 110,
      this.sunLight.target.position.y + 85,
      this.sunLight.target.position.z - 140,
    );

    this.renderScene();

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }

    this.scheduleNextFrame();
  };

  private stepModeTimers(dt: number): void {
    if (this.comboDecayTimer > 0) {
      this.comboDecayTimer = Math.max(0, this.comboDecayTimer - dt);
      if (this.comboDecayTimer === 0 && this.comboMultiplier > 1) {
        this.comboMultiplier = 1;
      }
    }

    if (this.mode === 'POLICE_ESCAPE') {
      this.modeTimerMs = Math.max(0, this.modeTimerMs - dt * 1000);
      if (this.modeTimerMs <= 0) {
        this.busted = false;
        this.score += 1800;
        this.finishGame(true, 'PURSUIT ESCAPED!', 'OUTRAN THE 5-STAR HIGHWAY PATROL');
      }
    } else if (this.mode === 'DRIFT_TOUGE') {
      this.modeTimerMs = Math.max(0, this.modeTimerMs - dt * 1000);
      if (this.modeTimerMs <= 0) {
        const won = this.driftScore >= 3500;
        this.finishGame(
          won,
          won ? 'DRIFT KING CROWNED!' : 'TOUGE RUN COMPLETE',
          `DRIFT SCORE: ${this.driftScore.toLocaleString()} PTS`,
        );
      }
    } else if (this.mode === 'TRAFFIC_RUSH') {
      this.modeTimerMs = Math.max(0, this.modeTimerMs - dt * 1000);
      if (this.modeTimerMs <= 0) {
        const won = this.score >= 5000;
        this.finishGame(
          won,
          'GT HIGHWAY MASTERED!',
          `${this.nearMisses} NEAR MISSES · ${this.score.toLocaleString()} PTS`,
        );
      }
    } else if (this.mode === 'CHECKPOINT_BLITZ') {
      this.modeTimerMs = Math.max(0, this.modeTimerMs - dt * 1000);
      if (this.modeTimerMs <= 0) {
        this.finishGame(
          false,
          'TIME EXPIRED!',
          `CLEARED ${this.checkpointsCleared} / ${CHECKPOINT_TARGET} GATES`,
        );
      }
    } else if (this.mode === 'COP_TAKEDOWN') {
      this.modeTimerMs = Math.max(0, this.modeTimerMs - dt * 1000);
      if (this.modeTimerMs <= 0) {
        const remaining = this.racers.filter((r) => !r.isPlayer && r.active).length;
        this.finishGame(
          false,
          'SUSPECTS ESCAPED!',
          `${4 - remaining} / 4 STREET RACERS WRECKED`,
        );
      }
    } else if (this.mode === 'KNOCKOUT') {
      this.knockoutNextMs -= dt * 1000;
      if (this.knockoutNextMs <= 0) {
        const alive = this.racers.filter((r) => r.active && !r.eliminated);
        if (alive.length > 1) {
          alive.sort((a, b) => a.totalProgress - b.totalProgress);
          const victim = alive[0];
          victim.eliminated = true;
          victim.active = false;
          victim.model.root.visible = false;
          if (victim.isPlayer) {
            this.finishGame(
              false,
              'KNOCKED OUT!',
              `ELIMINATED IN ${alive.length}TH PLACE`,
            );
            return;
          } else {
            this.audio.playCollision(0.7);
            this.showBanner(`${victim.name} ELIMINATED!`, 1.6);
            if (alive.length - 1 === 1) {
              this.score += 1500;
              this.finishGame(true, 'LAST SURVIVOR!', 'INDUSTRIAL PORT KNOCKOUT CHAMPION');
              return;
            }
          }
        }
        this.knockoutNextMs = KNOCKOUT_INTERVAL_MS;
      }
    }
  }

  private renderScene(): void {
    const useComposer =
      this.composer !== null &&
      !this.isSoftwareGl &&
      (this.graphicsQuality === 'HIGH' ||
        (this.graphicsQuality === 'MEDIUM' && !this.isMobileDevice));

    if (useComposer && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // Real-time Rear-View Mirror Hardware WebGL Scissor Pass (HIGH tier only)
    if (
      this.isHardwareMirrorSupported &&
      this.mirrorEnabled &&
      this.mirrorRect &&
      this.mirrorRect.width > 8 &&
      this.mirrorRect.height > 8 &&
      (this.phase === 'RACING' || this.phase === 'COUNTDOWN')
    ) {
      const canvasW = this.container.clientWidth || window.innerWidth;
      const canvasH = this.container.clientHeight || window.innerHeight;
      const r = this.mirrorRect;
      const x = Math.max(0, Math.round(r.left));
      const yBottom = Math.max(0, Math.round(canvasH - (r.top + r.height)));
      const w = Math.max(2, Math.min(canvasW - x, Math.round(r.width)));
      const h = Math.max(2, Math.min(canvasH - yBottom, Math.round(r.height)));
      if (w > 2 && h > 2) {
        const aspect = w / h;
        if (Math.abs(this.rearCamera.aspect - aspect) > 0.01) {
          this.rearCamera.aspect = aspect;
          this.rearCamera.updateProjectionMatrix();
        }
        this.renderer.setRenderTarget(null);
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(x, yBottom, w, h);
        this.renderer.setViewport(x, yBottom, w, h);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.rearCamera);
        this.renderer.setScissorTest(false);
        this.renderer.setViewport(0, 0, canvasW, canvasH);
      }
    }
  }

  private showBanner(text: string, duration = 1.5): void {
    this.bannerText = text;
    this.bannerTimer = duration;
  }

  private stepPlayerCar(car: RacerState, dt: number): void {
    const phys = car.spec.physics;
    const accelInput = this.input.throttle ? 1 : 0;
    const brakeInput = this.input.brake ? 1 : 0;
    const digitalSteer = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
    const analogSteer =
      typeof this.input.steerAxis === 'number' && Math.abs(this.input.steerAxis) > 0.02
        ? THREE.MathUtils.clamp(this.input.steerAxis, -1, 1)
        : 0;
    const steerRaw = analogSteer !== 0 ? analogSteer : digitalSteer;

    const wantsNitro = this.input.nitro && car.nitro > 1.5 && car.speed > 9;
    if (wantsNitro) {
      car.nitro = Math.max(0, car.nitro - phys.nitroBurnRate * dt);
    } else if (!car.isDrifting) {
      car.nitro = Math.min(100, car.nitro + phys.nitroRegenRate * dt);
    }

    if (car.boostPadTimer > 0) {
      car.boostPadTimer = Math.max(0, car.boostPadTimer - dt);
    }

    car.isBoosting = wantsNitro || car.boostPadTimer > 0;
    if (car.isBoosting && !this.wasBoostingPrev) {
      this.cameraKick = Math.max(this.cameraKick, 1.0);
    }
    this.wasBoostingPrev = car.isBoosting;

    const gripMult = THREE.MathUtils.clamp(
      this.modeConfig.gripMultiplier * this.weatherGripFactor,
      0.62,
      1.12,
    );
    const gripNorm = THREE.MathUtils.clamp((gripMult - 0.62) / 0.5, 0, 1);

    const maxSpeed =
      car.boostPadTimer > 0
        ? phys.boostSpeedMs + 6
        : wantsNitro
          ? phys.boostSpeedMs
          : phys.maxSpeedMs;
    const tractionFactor = THREE.MathUtils.lerp(0.88, 1.03, gripNorm);
    const accelRate =
      (car.isBoosting ? phys.accelRate * 1.78 : phys.accelRate) * tractionFactor;
    const brakeDecel = THREE.MathUtils.lerp(33, 53, gripNorm);

    if (accelInput > 0) {
      car.speed += accelRate * dt;
    } else if (brakeInput > 0) {
      if (car.speed > 1.5) {
        car.speed -= brakeDecel * dt;
      } else {
        car.speed -= 20 * dt;
      }
    } else {
      car.speed *= Math.exp(-0.76 * dt);
    }

    if (car.speed > maxSpeed) {
      car.speed = THREE.MathUtils.damp(car.speed, maxSpeed, 4.8, dt);
    }
    if (car.speed < -20) car.speed = -20;

    car.steerInput = THREE.MathUtils.damp(car.steerInput, steerRaw, 12.5, dt);
    const speedFactor = THREE.MathUtils.clamp(Math.abs(car.speed) / 14, 0, 1);
    const highSpeedStability =
      1 - THREE.MathUtils.clamp((Math.abs(car.speed) - 65) / 120, 0, 0.36);

    const prevDrifting = car.isDrifting;
    const wantsDrift =
      this.input.drift && Math.abs(car.speed) > 16 && Math.abs(car.steerInput) > 0.08;
    const enteredDrift = wantsDrift && !prevDrifting;
    car.isDrifting = wantsDrift;

    const steerGripScale = THREE.MathUtils.lerp(0.86, 1.03, gripNorm);
    const turnRate =
      (wantsDrift ? phys.turnRate * 1.32 : phys.turnRate) *
      speedFactor *
      highSpeedStability *
      steerGripScale;
    const reverseSign = car.speed >= -0.5 ? 1 : -1;
    car.heading += car.steerInput * turnRate * reverseSign * dt;

    const wetSlide = gripMult < 0.92 ? (0.94 - gripMult) * 0.72 : 0;
    const slipMag =
      (wantsDrift ? 0.43 + wetSlide * 0.35 : wetSlide) / phys.driftGrip;
    const targetSlip = car.steerInput * slipMag;
    car.driftSlip = THREE.MathUtils.damp(
      car.driftSlip,
      targetSlip,
      wantsDrift ? 6.5 : 7.8,
      dt,
    );

    if (!wantsDrift && gripMult < 0.85 && Math.abs(car.steerInput) > 0.45) {
      car.speed *= Math.exp(-0.24 * dt);
    }

    if (wantsDrift) {
      car.nitro = Math.min(100, car.nitro + 10.5 * dt);
      car.speed *= Math.exp(-0.13 * dt);
      this.comboDecayTimer = 3.0;
      const pts = Math.round(135 * this.comboMultiplier * dt);
      this.score += pts;
      this.driftScore += pts;
      if (this.mode === 'DRIFT_TOUGE') {
        this.comboMultiplier = Math.min(
          5,
          1 + Math.floor(Math.min(4, (this.driftScore % 3200) / 700)),
        );
      }
    }

    this.integrateCarOnTrack(car, dt, brakeInput > 0 || wantsDrift);

    // Dynamic paint-matched tire smoke & glowing drift trail particles
    if (wantsDrift) {
      const visualYaw = car.heading + car.driftSlip;
      _right.set(Math.cos(visualYaw), 0, -Math.sin(visualYaw));
      _fwd.set(-Math.sin(visualYaw), 0, -Math.cos(visualYaw));
      const wheelOffsets = car.spec.isBike ? [0] : [-0.92, 0.92];

      _paintColor.setHex(this.currentPreset.hex);
      _smokeColor.setHex(0xeaf0f8).lerp(_paintColor, 0.66);
      const smokeHex = _smokeColor.getHex();
      const trailPrimaryHex = this.currentPreset.hex;
      const trailAccentHex = this.currentNeonHex;
      const burstCount = enteredDrift ? 3 : 1;

      for (const side of wheelOffsets) {
        const wx = car.pos.x + _right.x * side - _fwd.x * 1.32;
        const wy = car.pos.y + 0.22;
        const wz = car.pos.z + _right.z * side - _fwd.z * 1.32;

        for (let b = 0; b < burstCount; b++) {
          this.particles.spawn(
            wx + (Math.random() - 0.5) * 0.28,
            wy,
            wz + (Math.random() - 0.5) * 0.28,
            (Math.random() - 0.5) * (enteredDrift ? 4.2 : 2.6),
            1.4 + Math.random() * 1.3,
            (Math.random() - 0.5) * (enteredDrift ? 4.2 : 2.6),
            0.58 + Math.random() * 0.26,
            enteredDrift ? 0.68 : 0.52,
            enteredDrift ? 2.7 : 2.35,
            b % 2 === 0 ? smokeHex : trailAccentHex,
          );
        }

        const speedTrail = Math.max(8, Math.abs(car.speed) * 0.26);
        this.driftTrails.spawn(
          wx,
          car.pos.y + 0.16,
          wz,
          -_fwd.x * speedTrail + _right.x * car.steerInput * 3.8 + (Math.random() - 0.5) * 1.2,
          0.35 + Math.random() * 0.6,
          -_fwd.z * speedTrail + _right.z * car.steerInput * 3.8 + (Math.random() - 0.5) * 1.2,
          enteredDrift ? 0.52 : 0.36,
          enteredDrift ? 1.45 : 1.05,
          enteredDrift ? 1.85 : 1.35,
          Math.random() > 0.38 ? trailPrimaryHex : trailAccentHex,
        );
      }
    }

    // Nitro exhaust flames
    if (car.isBoosting) {
      const visualYaw = car.heading + car.driftSlip;
      _fwd.set(-Math.sin(visualYaw), 0, -Math.cos(visualYaw));
      for (let s = 0; s < 2; s++) {
        this.particles.spawn(
          car.pos.x - _fwd.x * (car.spec.isBike ? 1.55 : 2.55) + (Math.random() - 0.5) * 0.5,
          car.pos.y + (car.spec.isBike ? 0.52 : 0.34),
          car.pos.z - _fwd.z * (car.spec.isBike ? 1.55 : 2.55) + (Math.random() - 0.5) * 0.5,
          -_fwd.x * 8 + (Math.random() - 0.5) * 2.2,
          0.5 + Math.random() * 1.1,
          -_fwd.z * 8 + (Math.random() - 0.5) * 2.2,
          0.25,
          0.4,
          0.06,
          Math.random() > 0.38 ? 0x00eeff : 0xffaa33,
        );
      }
    }
  }

  private stepAiCar(car: RacerState, dt: number): void {
    car.aiLaneTimer -= dt;
    if (car.aiLaneTimer <= 0) {
      car.aiLaneTimer = 1.6 + Math.random() * 2.2;
      const lanes = this.mode === 'DRAG_STRIP' ? [3.4] : [-5.4, -2.0, 2.0, 5.4];
      car.aiTargetLane = lanes[Math.floor(Math.random() * lanes.length)];
    }

    if (this.mode !== 'DRAG_STRIP') {
      for (const other of this.racers) {
        if (!other.active || other.id === car.id) continue;
        let dtAhead = other.t - car.t;
        if (dtAhead < 0) dtAhead += 1;
        if (dtAhead > 0.002 && dtAhead < 0.022) {
          this.track.queryPosition(other.pos, other.sampleHint, _queryRes);
          const otherLat = _queryRes.lateral;
          if (Math.abs(otherLat - car.aiTargetLane) < 2.6) {
            car.aiTargetLane = otherLat > 0 ? -4.4 : 4.4;
            car.aiLaneTimer = 1.4;
          }
        }
      }

      for (const tc of this.trafficCars) {
        if (!tc.active) continue;
        let dtAhead = tc.t - car.t;
        if (dtAhead < 0) dtAhead += 1;
        if (dtAhead > 0.002 && dtAhead < 0.024 && Math.abs(tc.lane - car.aiTargetLane) < 2.8) {
          car.aiTargetLane = tc.lane > 0 ? -3.0 : 3.0;
          car.aiLaneTimer = 1.2;
        }
      }
    }

    const lookT = this.track.isOpenLoop
      ? Math.min(0.995, car.t + 34 / this.track.totalLength)
      : (car.t + 34 / this.track.totalLength) % 1;
    this.track.sampleAtT(lookT, _v1, _v2, _v3);
    _v1.addScaledVector(_v3, car.aiTargetLane);

    const dx = _v1.x - car.pos.x;
    const dz = _v1.z - car.pos.z;
    const targetYaw = Math.atan2(-dx, -dz);

    let yawDiff = targetYaw - car.heading;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    const steer = THREE.MathUtils.clamp(yawDiff * 1.85, -1, 1);
    car.steerInput = THREE.MathUtils.damp(car.steerInput, steer, 10, dt);
    car.heading += car.steerInput * 2.15 * dt;

    car.aiNitroCooldown -= dt;
    const isStraight = Math.abs(yawDiff) < 0.14;
    if (car.aiNitroCooldown <= 0 && isStraight && car.nitro > 35 && this.phase === 'RACING') {
      car.isBoosting = true;
      car.nitro = Math.max(0, car.nitro - 25 * dt);
      if (car.nitro < 8) {
        car.isBoosting = false;
        car.aiNitroCooldown = 4 + Math.random() * 4;
      }
    } else {
      car.isBoosting = car.boostPadTimer > 0;
      car.nitro = Math.min(100, car.nitro + 5 * dt);
    }

    if (car.boostPadTimer > 0) {
      car.boostPadTimer = Math.max(0, car.boostPadTimer - dt);
    }

    const progressGap = this.player.totalProgress - car.totalProgress;
    const rubberBand =
      this.mode === 'DRAG_STRIP'
        ? 0
        : this.phase === 'RACING'
          ? THREE.MathUtils.clamp(progressGap * 14, -6, 12)
          : 0;
    const weatherCornerFactor = THREE.MathUtils.clamp(this.weatherGripFactor, 0.78, 1.03);
    const cornerSlow =
      1 -
      THREE.MathUtils.clamp(
        (Math.abs(yawDiff) * 0.42) / weatherCornerFactor,
        0,
        0.31,
      );

    const baseCruise =
      this.mode === 'DRAG_STRIP'
        ? 99
        : this.mode === 'COP_TAKEDOWN'
          ? 78
          : 90;
    const targetSpeed =
      (car.finished ? 52 : baseCruise * car.aiBaseSkill * cornerSlow + rubberBand) +
      (car.isBoosting ? 21 : 0);

    car.speed = THREE.MathUtils.damp(car.speed, targetSpeed, 2.3, dt);
    car.isDrifting = Math.abs(yawDiff) > 0.32 && car.speed > 38;
    const aiSlipMag = 0.26 + Math.max(0, 1 - this.weatherGripFactor) * 0.36;
    car.driftSlip = THREE.MathUtils.damp(
      car.driftSlip,
      car.isDrifting ? steer * aiSlipMag : 0,
      6,
      dt,
    );

    this.integrateCarOnTrack(car, dt, false);

    if (car.isDrifting && this.phase === 'RACING' && Math.random() < 0.45) {
      const visualYaw = car.heading + car.driftSlip;
      _right.set(Math.cos(visualYaw), 0, -Math.sin(visualYaw));
      _fwd.set(-Math.sin(visualYaw), 0, -Math.cos(visualYaw));
      _paintColor.set(car.colorCss);
      _smokeColor.setHex(0xeaf0f8).lerp(_paintColor, 0.58);
      const wheelOffsets = car.spec.isBike ? [0] : [-0.88, 0.88];
      for (const side of wheelOffsets) {
        const wx = car.pos.x + _right.x * side - _fwd.x * 1.25;
        const wz = car.pos.z + _right.z * side - _fwd.z * 1.25;
        this.particles.spawn(
          wx,
          car.pos.y + 0.2,
          wz,
          (Math.random() - 0.5) * 2.0,
          1.1 + Math.random() * 0.8,
          (Math.random() - 0.5) * 2.0,
          0.45,
          0.42,
          1.75,
          _smokeColor.getHex(),
        );
        this.driftTrails.spawn(
          wx,
          car.pos.y + 0.14,
          wz,
          -_fwd.x * 10,
          0.25,
          -_fwd.z * 10,
          0.28,
          0.8,
          1.05,
          _paintColor.getHex(),
        );
      }
    }
  }

  private stepPoliceCar(police: RacerState, dt: number): void {
    if (police.disabledTimer > 0) {
      police.disabledTimer = Math.max(0, police.disabledTimer - dt);
    }
    if (police.nearMissCooldown > 0) {
      police.nearMissCooldown = Math.max(0, police.nearMissCooldown - dt);
    }

    let signedDt = this.player.t - police.t;
    if (signedDt > 0.5) signedDt -= 1;
    if (signedDt < -0.5) signedDt += 1;
    const signedDistM = signedDt * this.track.totalLength;

    if (this.phase === 'RACING' && Math.abs(signedDistM) > 155) {
      const respawnT = ((this.player.t - 0.032) % 1 + 1) % 1;
      this.track.sampleAtT(respawnT, _v1, _v2, _v3);
      police.pos.copy(_v1).addScaledVector(_v3, (Math.random() - 0.5) * 8);
      police.heading = Math.atan2(-_v2.x, -_v2.z);
      police.speed = Math.max(68, this.player.speed * 0.98);
      police.t = respawnT;
      police.sampleHint = Math.floor(respawnT * this.track.sampleCount);
      police.disabledTimer = 0;
    }

    this.track.queryPosition(this.player.pos, this.player.sampleHint, _queryRes);
    const playerLat = _queryRes.lateral;

    police.swerveTimer += dt * 2.4;
    if (Math.abs(signedDistM) < 55 && police.disabledTimer <= 0) {
      const isBlockingAhead = signedDistM < -4;
      const swerveOffset = isBlockingAhead
        ? Math.sin(police.swerveTimer) * 2.4
        : police.policeRoleOffset > 0
          ? 0.7
          : -0.7;
      police.aiTargetLane = THREE.MathUtils.clamp(playerLat + swerveOffset, -7.2, 7.2);
    } else {
      police.aiLaneTimer -= dt;
      if (police.aiLaneTimer <= 0) {
        police.aiLaneTimer = 1.4;
        police.aiTargetLane = playerLat * 0.65;
      }
    }

    const lookT = (police.t + 25 / this.track.totalLength) % 1;
    this.track.sampleAtT(lookT, _v1, _v2, _v3);
    _v1.addScaledVector(_v3, police.aiTargetLane);

    const dx = _v1.x - police.pos.x;
    const dz = _v1.z - police.pos.z;
    const targetYaw = Math.atan2(-dx, -dz);

    let yawDiff = targetYaw - police.heading;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    const steer = THREE.MathUtils.clamp(yawDiff * 2.1, -1, 1);
    police.steerInput = THREE.MathUtils.damp(police.steerInput, steer, 11, dt);
    police.heading += police.steerInput * 2.25 * dt;

    const playerBoostAggro = this.player.isBoosting ? 16 : 0;
    const desiredPlayerGapM = police.policeRoleOffset * this.track.totalLength;
    const catchupBoost = THREE.MathUtils.clamp((signedDistM - desiredPlayerGapM) * 0.65, -16, 30);
    const basePursuit =
      this.phase === 'FINISHED'
        ? 45
        : police.disabledTimer > 0
          ? 38
          : Math.max(76, this.player.speed + 6) * police.aiBaseSkill + catchupBoost + playerBoostAggro;

    const clampedTarget = THREE.MathUtils.clamp(basePursuit, 38, 128);
    police.speed = THREE.MathUtils.damp(police.speed, clampedTarget, 3.4, dt);
    police.isBoosting = police.disabledTimer <= 0 && (signedDistM > 20 || this.player.isBoosting);
    police.isDrifting = Math.abs(yawDiff) > 0.3 && police.speed > 45;
    police.driftSlip = THREE.MathUtils.damp(
      police.driftSlip,
      police.isDrifting ? steer * 0.25 : 0,
      6,
      dt,
    );

    this.integrateCarOnTrack(police, dt, false);

    if (this.phase === 'RACING' && police.nearMissCooldown <= 0 && police.disabledTimer <= 0) {
      const dist = police.pos.distanceTo(this.player.pos);
      if (dist > 3.25 && dist < 5.6 && this.player.speed > 42) {
        police.nearMissCooldown = 3.5;
        this.nearMisses += 1;
        this.score += this.player.isDrifting ? 350 : 220;
        this.policeHeat = Math.min(100, this.policeHeat + 10);
        this.player.nitro = Math.min(100, this.player.nitro + 14);
        this.audio.playPickup();
        this.showBanner(
          this.player.isDrifting ? 'DRIFT EVADE! +350 · +14 NITRO' : 'POLICE NEAR MISS! +220',
          1.1,
        );
      }
    }
  }

  private stepTrafficCars(dt: number): void {
    const playerSpeed = Math.abs(this.player.speed);
    for (const tc of this.trafficCars) {
      if (!tc.active) continue;
      if (tc.nearMissCooldown > 0) {
        tc.nearMissCooldown = Math.max(0, tc.nearMissCooldown - dt);
      }

      tc.t = (tc.t + (tc.speed * dt) / this.track.totalLength) % 1;
      this.track.sampleAtT(tc.t, _v1, _v2, _v3);
      tc.pos.copy(_v1).addScaledVector(_v3, tc.lane);
      tc.heading = Math.atan2(-_v2.x, -_v2.z);

      tc.rig.root.position.copy(tc.pos);
      tc.rig.root.rotation.set(0, tc.heading, 0);
      tc.rig.updateVisuals(dt, tc.speed);

      if (this.phase === 'RACING' && tc.nearMissCooldown <= 0 && playerSpeed > 42) {
        const dx = this.player.pos.x - tc.pos.x;
        const dz = this.player.pos.z - tc.pos.z;
        const distSq = dx * dx + dz * dz;
        const minHit = tc.radius + (this.currentVehicle.isBike ? 1.05 : 1.45);
        if (distSq > minHit * minHit && distSq < 28) {
          tc.nearMissCooldown = 2.6;
          this.nearMisses += 1;
          if (this.mode === 'TRAFFIC_RUSH') {
            this.comboMultiplier = Math.min(8, this.comboMultiplier + 1);
            this.comboDecayTimer = 4.2;
          }
          const bonus = 250 * this.comboMultiplier;
          this.score += bonus;
          this.player.nitro = Math.min(100, this.player.nitro + 15);
          this.audio.playPickup();
          this.showBanner(
            this.comboMultiplier > 1
              ? `NEAR MISS x${this.comboMultiplier}! +${bonus}`
              : `NEAR MISS! +${bonus} · +15 NITRO`,
            1.0,
          );
        }
      }
    }
  }

  private updatePursuitMetrics(dt: number): void {
    if (this.phase !== 'RACING') return;

    const hasPolice =
      this.mode === 'CIRCUIT_RACE' ||
      this.mode === 'POLICE_ESCAPE' ||
      this.mode === 'MIDNIGHT_RUN' ||
      this.mode === 'ZIGZAG_SERPENTINE' ||
      this.mode === 'WAVY_COASTER' ||
      this.mode === 'DESERT_CANYON_HIGHWAY' ||
      this.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
      this.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
      this.mode === 'LAHORE_MIDNIGHT_GP' ||
      this.mode === 'GWADAR_PORT_DOCKS';

    if (!hasPolice) {
      this.policeCloseWarning = false;
      this.pursuitAlert = this.mode === 'COP_TAKEDOWN' ? 'LOCK_ON' : 'NONE';
      this.bustProgress = 0;
      return;
    }

    const close = this.nearestPoliceDist < 26;
    this.policeCloseWarning = close;

    if (this.nearestPoliceDist < 13.5) {
      this.pursuitAlert = 'TAKEDOWN';
    } else if (this.nearestPoliceDist < 32) {
      this.pursuitAlert = 'LOCK_ON';
    } else {
      this.pursuitAlert = 'NONE';
    }

    if (close) {
      this.wasInCloseChase = true;
      this.policeHeat = Math.min(100, this.policeHeat + 16 * dt);
    } else if (this.nearestPoliceDist > 58) {
      if (this.wasInCloseChase) {
        this.wasInCloseChase = false;
        this.score += 400;
        this.player.nitro = Math.min(100, this.player.nitro + 20);
        this.showBanner('CLEAN ESCAPE! +400 · +20 NITRO', 1.25);
      }
      this.policeHeat = Math.max(
        this.mode === 'POLICE_ESCAPE' ? 32 : 10,
        this.policeHeat - 10 * dt,
      );
    }

    this.wantedStars = Math.max(1, Math.min(5, Math.ceil(this.policeHeat / 20)));

    if (this.mode === 'POLICE_ESCAPE') {
      const playerSpeedKmh = Math.abs(this.player.speed) * 3.6;
      if (this.nearestPoliceDist < 11.5 && playerSpeedKmh < 88) {
        this.bustProgress = Math.min(100, this.bustProgress + 28 * dt);
        if (this.bustProgress >= 100) {
          this.busted = true;
          this.audio.playCollision(0.95);
          this.finishGame(false, 'BUSTED BY POLICE!', 'INTERCEPTORS BOXED YOU IN');
        }
      } else {
        this.bustProgress = Math.max(0, this.bustProgress - 22 * dt);
      }
    } else {
      this.bustProgress = 0;
    }
  }

  private integrateCarOnTrack(car: RacerState, dt: number, isBraking: boolean): void {
    _fwd.set(-Math.sin(car.heading), 0, -Math.cos(car.heading));
    car.pos.addScaledVector(_fwd, car.speed * dt);

    this.track.queryPosition(car.pos, car.sampleHint, _queryRes);
    car.sampleHint = _queryRes.sampleIndex;
    car.pos.y = _queryRes.roadY;

    const maxLat = this.track.roadHalfWidth - (car.spec.isBike ? 0.9 : 1.35);
    if (Math.abs(_queryRes.lateral) > maxLat) {
      const sign = Math.sign(_queryRes.lateral);
      const clampedLat = sign * maxLat;
      car.pos.x = _queryRes.closestPos.x - _queryRes.right.x * (_queryRes.lateral - clampedLat);
      car.pos.z = _queryRes.closestPos.z - _queryRes.right.z * (_queryRes.lateral - clampedLat);

      const roadYaw = Math.atan2(-_queryRes.tangent.x, -_queryRes.tangent.z);
      let diff = roadYaw - car.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.heading += diff * 0.42;

      if (car.speed > 18) {
        car.speed *= 0.92;
        if (car.isPlayer && this.phase === 'RACING' && this.scrapeCooldown <= 0) {
          this.scrapeCooldown = 0.22;
          this.shakeIntensity = Math.max(this.shakeIntensity, 0.25);
          this.applyHullDamage(
            Math.min(5.5, Math.max(1.5, car.speed * 0.08)),
            car.pos.x + _queryRes.right.x * sign * 0.9,
            car.pos.y + 0.5,
            car.pos.z + _queryRes.right.z * sign * 0.9,
            0.48,
            true,
          );
        } else if (!car.isPlayer) {
          this.sparks.spawnBurst(
            car.pos.x + _queryRes.right.x * sign * 0.9,
            car.pos.y + 0.5,
            car.pos.z + _queryRes.right.z * sign * 0.9,
            car.pos.y,
            _fwd.x * car.speed * 0.4,
            _fwd.z * car.speed * 0.4,
            5,
            0.45,
          );
        }
      }
    }

    // Boost pads
    for (const pad of this.track.boostPads) {
      const dx = car.pos.x - pad.pos.x;
      const dz = car.pos.z - pad.pos.z;
      if (dx * dx + dz * dz < 16) {
        if (car.boostPadTimer < 0.8) {
          car.boostPadTimer = 1.45;
          car.speed = Math.max(car.speed, car.spec.physics.boostSpeedMs * 0.92);
          if (car.isPlayer) {
            this.score += 120;
            this.audio.playBoostPad();
            this.shakeIntensity = Math.max(this.shakeIntensity, 0.24);
            this.cameraKick = Math.max(this.cameraKick, 1.35);
          }
        }
      }
    }

    // Nitro pickups (also repair +25% hull integrity!)
    for (const pickup of this.track.nitroPickups) {
      if (pickup.cooldown > 0) continue;
      const dx = car.pos.x - pickup.pos.x;
      const dz = car.pos.z - pickup.pos.z;
      if (dx * dx + dz * dz < 9.5) {
        pickup.cooldown = 7.0;
        pickup.group.visible = false;
        car.nitro = Math.min(100, car.nitro + 40);
        if (car.isPlayer) {
          this.score += 150;
          this.audio.playPickup();
          if (this.hullIntegrity < 100) {
            this.hullIntegrity = Math.min(100, this.hullIntegrity + 25);
            this.player.model.setDamageLevel(1 - this.hullIntegrity / 100);
            this.showBanner('+40 NITRO · +25% REPAIR', 1.05);
          } else {
            this.showBanner('+40 NITRO', 0.9);
          }
        }
        for (let k = 0; k < 8; k++) {
          this.particles.spawn(
            pickup.pos.x,
            pickup.pos.y,
            pickup.pos.z,
            (Math.random() - 0.5) * 8,
            1.5 + Math.random() * 3,
            (Math.random() - 0.5) * 8,
            0.35,
            0.4,
            0.05,
            0x00f0ff,
          );
        }
      }
    }

    // Checkpoints (flashing + Checkpoint Blitz timer extension)
    if (car.isPlayer && this.phase === 'RACING') {
      this.track.checkpoints.forEach((cp, idx) => {
        const dx = car.pos.x - cp.pos.x;
        const dz = car.pos.z - cp.pos.z;
        if (dx * dx + dz * dz < 145) {
          if (cp.flashTimer === 0) cp.flashTimer = 0.6;
          if (this.mode === 'CHECKPOINT_BLITZ' && idx !== this.lastCheckpointIdx) {
            this.lastCheckpointIdx = idx;
            this.checkpointsCleared += 1;
            this.modeTimerMs = Math.min(45_000, this.modeTimerMs + CHECKPOINT_BONUS_MS);
            this.score += 350;
            this.audio.playPickup();
            if (this.checkpointsCleared >= CHECKPOINT_TARGET) {
              this.score += 1500;
              this.finishGame(
                true,
                'BLITZ COMPLETED!',
                `ALL ${CHECKPOINT_TARGET} CANYON GATES CLEARED`,
              );
            } else {
              this.showBanner(
                `CHECKPOINT ${this.checkpointsCleared}/${CHECKPOINT_TARGET} · +8.0s`,
                1.1,
              );
            }
          }
        }
      });
    }

    // Track Progress & Lap / Finish Detection
    const prevT = car.t;
    const newT = _queryRes.t;
    car.t = newT;

    if (!car.isPolice && this.phase === 'RACING' && !car.finished) {
      if (this.track.isOpenLoop) {
        car.totalProgress = newT;
        if (this.mode === 'DRAG_STRIP' && newT >= 0.91) {
          car.finished = true;
          car.finishTimeMs = this.raceTimeMs;
          if (car.isPlayer) {
            const won = !this.racers[1].finished;
            if (won) this.score += 1200;
            this.finishGame(
              won,
              won ? 'DRAG STRIP VICTORY!' : 'PHOTO FINISH — 2ND!',
              `QUARTER/HALF-MILE TIME: ${(this.raceTimeMs / 1000).toFixed(2)}s`,
            );
          }
        }
      } else {
        const hasLaps =
          this.mode === 'CIRCUIT_RACE' ||
          this.mode === 'TIME_TRIAL' ||
          this.mode === 'MIDNIGHT_RUN' ||
          this.mode === 'ZIGZAG_SERPENTINE' ||
          this.mode === 'WAVY_COASTER' ||
          this.mode === 'MOUNTAIN_HAIRPIN_PASS' ||
          this.mode === 'DESERT_CANYON_HIGHWAY' ||
          this.mode === 'MIDNIGHT_HARBOR_CIRCUIT' ||
          this.mode === 'KARAKORUM_SKY_PASS' ||
          this.mode === 'CHOLISTAN_MIRAGE_HIGHWAY' ||
          this.mode === 'LAHORE_MIDNIGHT_GP' ||
          this.mode === 'GWADAR_PORT_DOCKS' ||
          this.mode === 'EMERALD_VALLEY_LOOP';

        if (prevT > 0.78 && newT < 0.22) {
          if (car.totalProgress >= 0.45) {
            const lapDuration = this.raceTimeMs - car.lapStartedAtMs;
            if (car.bestLapMs === null || lapDuration < car.bestLapMs) {
              car.bestLapMs = lapDuration;
            }
            if (car.isPlayer) {
              this.lapMetrics.push({
                label: `LAP ${car.lap}`,
                timeMs: Math.round(lapDuration),
                topSpeedKmh: Math.round(this.lapTopSpeedKmh),
                avgSpeedKmh:
                  this.lapSpeedSamples > 0
                    ? Math.round(this.lapSpeedSum / this.lapSpeedSamples)
                    : Math.round(this.topSpeedKmh * 0.78),
                driftPts: Math.max(0, this.driftScore - this.lapDriftStart),
              });
              this.lapTopSpeedKmh = 0;
              this.lapSpeedSum = 0;
              this.lapSpeedSamples = 0;
              this.lapDriftStart = this.driftScore;
            }
            car.lapStartedAtMs = this.raceTimeMs;

            if (hasLaps && car.lap >= this.totalLaps) {
              car.finished = true;
              car.finishTimeMs = this.raceTimeMs;
              car.totalProgress = this.totalLaps + 0.01;
              if (car.isPlayer) {
                this.score += 1200;
                const pos = this.computePlayerPosition();
                this.finishGame(
                  pos === 1,
                  pos === 1
                    ? '1ST PLACE VICTORY!'
                    : this.mode === 'TIME_TRIAL'
                      ? 'TIME TRIAL COMPLETE!'
                      : `${pos}${pos === 2 ? 'ND' : pos === 3 ? 'RD' : 'TH'} PLACE FINISH`,
                  `${this.modeConfig.environmentName.toUpperCase()} COMPLETE`,
                );
              }
            } else {
              car.lap += 1;
              if (car.isPlayer && hasLaps) {
                this.score += 500;
                this.audio.playLapChime(false);
                this.showBanner(
                  car.lap === this.totalLaps
                    ? 'FINAL LAP!'
                    : `LAP ${car.lap} / ${this.totalLaps}`,
                  1.8,
                );
              }
            }
          } else {
            car.lapStartedAtMs = this.raceTimeMs;
            car.totalProgress = newT;
          }
        } else if (prevT < 0.22 && newT > 0.78) {
          if (car.totalProgress < 0.25) {
            car.totalProgress = newT - 1;
          }
        } else {
          if (car.totalProgress < 0 && newT > 0.75) {
            car.totalProgress = newT - 1;
          } else {
            car.totalProgress = car.lap - 1 + newT;
          }
        }
      }
    }

    const slopePitch = Math.asin(THREE.MathUtils.clamp(_queryRes.tangent.y, -0.45, 0.45));
    const visualYaw = car.heading + car.driftSlip;
    car.model.root.position.copy(car.pos);
    car.model.root.rotation.set(0, visualYaw, 0);

    // Superbikes lean dramatically into turns & wheelie on nitro!
    const speedNorm = THREE.MathUtils.clamp(car.speed / 55, 0, 1);
    const bodyRoll = car.spec.isBike
      ? -car.steerInput * speedNorm * car.spec.physics.maxLeanRad
      : -car.steerInput * speedNorm * 0.08;
    const accelPitch =
      (car.isBoosting ? (car.spec.isBike ? 0.19 : 0.036) : 0) - (isBraking ? 0.045 : 0);

    car.model.updateVisuals({
      dt,
      speed: car.speed,
      steerAngle: car.steerInput,
      bodyRoll,
      bodyPitch: slopePitch + accelPitch,
      isBraking,
      isBoosting: car.isBoosting,
      elapsed: this.elapsed,
    });
  }

  private resolveAllCollisions(): void {
    const activeCars: RacerState[] = [];
    for (const r of this.racers) if (r.active) activeCars.push(r);
    for (const p of this.policeCars) if (p.active) activeCars.push(p);

    const minDist = 3.05;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < activeCars.length; i++) {
      for (let j = i + 1; j < activeCars.length; j++) {
        const a = activeCars[i];
        const b = activeCars[j];
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const dSq = dx * dx + dz * dz;

        if (dSq > 0.0001 && dSq < minDistSq) {
          const dist = Math.sqrt(dSq);
          const overlap = (minDist - dist) * 0.52;
          const nx = dx / dist;
          const nz = dz / dist;

          a.pos.x -= nx * overlap;
          a.pos.z -= nz * overlap;
          b.pos.x += nx * overlap;
          b.pos.z += nz * overlap;

          const avgSpeed = (a.speed + b.speed) * 0.5;
          a.speed = THREE.MathUtils.lerp(a.speed, avgSpeed, 0.35);
          b.speed = THREE.MathUtils.lerp(b.speed, avgSpeed, 0.35);

          // Police vs Player in regular modes
          const playerHitPolice =
            (a.isPlayer && b.isPolice && !a.isPolice) ||
            (b.isPlayer && a.isPolice && !b.isPolice);
          let takedownTriggered = false;
          if (playerHitPolice) {
            const police = a.isPolice ? a : b;
            if (this.player.isBoosting && police.disabledTimer <= 0) {
              police.disabledTimer = 4.0;
              police.speed *= 0.45;
              this.takedowns += 1;
              this.score += 500;
              this.bustProgress = 0;
              this.policeHeat = Math.max(15, this.policeHeat - 25);
              this.player.nitro = Math.min(100, this.player.nitro + 25);
              this.triggerSlowMo(0.85);
              takedownTriggered = true;
              this.showBanner('UNIT SHAKEN OFF! +500 · +25 NITRO', 1.3);
            } else {
              this.policeHeat = Math.min(100, this.policeHeat + 14);
            }
          }

          // Player (Interceptor) vs Suspect in COP_TAKEDOWN
          if (this.mode === 'COP_TAKEDOWN' && (a.isPlayer || b.isPlayer)) {
            const suspect = a.isPlayer ? b : a;
            if (suspect.isSuspect && suspect.active) {
              const dmg = this.player.isBoosting ? 100 : Math.max(40, Math.abs(this.player.speed));
              suspect.suspectHealth = Math.max(0, suspect.suspectHealth - dmg);
              suspect.speed *= 0.45;
              if (suspect.suspectHealth <= 0) {
                suspect.active = false;
                suspect.eliminated = true;
                suspect.model.root.visible = false;
                this.takedowns += 1;
                this.score += 1000;
                this.player.nitro = Math.min(100, this.player.nitro + 35);
                this.triggerSlowMo(0.85);
                takedownTriggered = true;
                const remaining = this.racers.filter((r) => !r.isPlayer && r.active).length;
                if (remaining === 0) {
                  this.finishGame(
                    true,
                    'ALL SUSPECTS WRECKED!',
                    'INTERCEPTOR PATROL MISSION COMPLETE',
                  );
                } else {
                  this.showBanner(
                    `SUSPECT WRECKED! ${remaining} LEFT · +1000`,
                    1.35,
                  );
                }
              } else {
                this.showBanner(`INTERCEPT HIT! ${Math.round(suspect.suspectHealth)}% HP`, 0.9);
              }
            }
          }

          if (a.isPlayer || b.isPlayer) {
            this.shakeIntensity = Math.max(this.shakeIntensity, takedownTriggered ? 0.55 : 0.42);
            this.hitstopTimer = takedownTriggered ? 0.045 : 0.032;
            const hitX = (a.pos.x + b.pos.x) * 0.5;
            const hitY = a.pos.y + 0.65;
            const hitZ = (a.pos.z + b.pos.z) * 0.5;
            this.applyHullDamage(
              takedownTriggered ? 4 : 9,
              hitX,
              hitY,
              hitZ,
              takedownTriggered ? 0.95 : 0.78,
              true,
            );
          }
        }
      }
    }

    // Police Roadblock collisions (Downtown Expressway)
    for (const rb of this.track.roadblocks) {
      if (rb.brokenTimer > 0) continue;
      const dx = this.player.pos.x - rb.pos.x;
      const dz = this.player.pos.z - rb.pos.z;
      const minR = rb.radius + 1.4;
      if (dx * dx + dz * dz < minR * minR) {
        rb.brokenTimer = 10.0;
        rb.group.visible = false;
        this.shakeIntensity = Math.max(this.shakeIntensity, 0.55);
        this.hitstopTimer = 0.045;
        if (this.player.isBoosting) {
          this.score += 350;
          this.triggerSlowMo(0.75);
          this.showBanner('ROADBLOCK SMASHED! +350', 1.15);
          this.applyHullDamage(5, rb.pos.x, rb.pos.y + 0.75, rb.pos.z, 0.92, true);
        } else {
          this.player.speed *= 0.52;
          this.policeHeat = Math.min(100, this.policeHeat + 15);
          this.showBanner('ROADBLOCK HIT! USE NITRO TO SMASH!', 1.2);
          this.applyHullDamage(16, rb.pos.x, rb.pos.y + 0.75, rb.pos.z, 0.95, true);
        }
        for (let k = 0; k < 8; k++) {
          this.particles.spawn(
            rb.pos.x,
            rb.pos.y + 0.8,
            rb.pos.z,
            (Math.random() - 0.5) * 14,
            3 + Math.random() * 5,
            (Math.random() - 0.5) * 14,
            0.35,
            0.4,
            0.05,
            0xef4444,
          );
        }
      }
    }

    // Desi Traffic vehicle collisions
    for (const tc of this.trafficCars) {
      if (!tc.active) continue;
      const minT = tc.radius + (this.currentVehicle.isBike ? 1.0 : 1.4);
      for (const car of activeCars) {
        const dx = car.pos.x - tc.pos.x;
        const dz = car.pos.z - tc.pos.z;
        const dSq = dx * dx + dz * dz;
        if (dSq > 0.0001 && dSq < minT * minT) {
          const dist = Math.sqrt(dSq);
          const push = minT - dist;
          const prevSpeed = Math.abs(car.speed);
          car.pos.x += (dx / dist) * push;
          car.pos.z += (dz / dist) * push;
          car.speed *= 0.68;

          if (car.isPlayer) {
            this.shakeIntensity = Math.max(this.shakeIntensity, 0.52);
            this.hitstopTimer = 0.04;
            tc.nearMissCooldown = 3.0;
            this.comboMultiplier = 1;
            const hitX = (car.pos.x + tc.pos.x) * 0.5;
            const hitZ = (car.pos.z + tc.pos.z) * 0.5;
            if (prevSpeed > 55) {
              this.triggerSlowMo(0.7);
            }
            this.applyHullDamage(14, hitX, car.pos.y + 0.75, hitZ, 0.9, true);
            for (let k = 0; k < 6; k++) {
              this.particles.spawn(
                hitX,
                car.pos.y + 0.8,
                hitZ,
                (Math.random() - 0.5) * 10,
                2 + Math.random() * 4,
                (Math.random() - 0.5) * 10,
                0.3,
                0.35,
                0.04,
                0xffb703,
              );
            }
          } else if (car.isPolice) {
            car.disabledTimer = 2.0;
          }
        }
      }
    }
  }

  private applyHullDamage(
    amount: number,
    hitX: number,
    hitY: number,
    hitZ: number,
    intensity: number,
    metallic = true,
  ): void {
    this.audio.playCollision(intensity, metallic);
    if (this.phase === 'RACING') {
      this.hullIntegrity = Math.max(8, this.hullIntegrity - amount);
      this.player.model.setDamageLevel(1 - this.hullIntegrity / 100);
      this.impactFlash = Math.min(1, Math.max(this.impactFlash, 0.35 + intensity * 0.6));
    }
    const yaw = this.player.heading + this.player.driftSlip;
    const vx = -Math.sin(yaw) * this.player.speed;
    const vz = -Math.cos(yaw) * this.player.speed;
    this.sparks.spawnBurst(
      hitX,
      hitY,
      hitZ,
      this.player.pos.y,
      vx,
      vz,
      Math.round(14 + intensity * 20),
      intensity,
    );
  }

  private triggerSlowMo(duration = 0.85): void {
    if (this.phase !== 'RACING') return;
    this.slowMoTimer = Math.max(this.slowMoTimer, duration);
  }

  private updatePoliceStrobeLight(): void {
    if (
      this.nearestPoliceDist < 42 &&
      (this.phase === 'RACING' || this.phase === 'COUNTDOWN')
    ) {
      let nearest: RacerState | null = null;
      let bestD = Infinity;
      for (const p of this.policeCars) {
        if (!p.active) continue;
        const d = p.pos.distanceTo(this.player.pos);
        if (d < bestD) {
          bestD = d;
          nearest = p;
        }
      }
      if (nearest) {
        this.policeStrobeLight.position.set(
          nearest.pos.x,
          nearest.pos.y + 2.2,
          nearest.pos.z,
        );
        this.policeStrobeLight.color.setHex(
          Math.sin(this.elapsed * 22) > 0 ? 0xff2244 : 0x2563eb,
        );
        this.policeStrobeLight.intensity =
          THREE.MathUtils.clamp(1 - bestD / 42, 0.12, 1) * 8.5;
        return;
      }
    }
    this.policeStrobeLight.intensity = 0;
  }

  private updateRearMirrorCameraAndBlips(): void {
    const car = this.player;
    const yaw = car.heading + car.driftSlip * 0.35;
    _fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    _right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    const backOffset = car.spec.isBike ? 1.65 : 2.35;
    const camHeight = car.spec.isBike ? 1.42 : 1.38;

    this.rearCamera.position
      .copy(car.pos)
      .addScaledVector(_fwd, -backOffset);
    this.rearCamera.position.y += camHeight;

    _camLookTarget
      .copy(car.pos)
      .addScaledVector(_fwd, -28);
    _camLookTarget.y += 1.15;
    this.rearCamera.lookAt(_camLookTarget);

    // Populate rearBlips for 2D mirror fallback / telemetry
    this.rearBlipsBuf.length = 0;
    const addIfBehind = (
      id: string,
      otherPos: THREE.Vector3,
      isPolice: boolean,
      isTraffic: boolean,
      color: string,
    ) => {
      const dx = otherPos.x - car.pos.x;
      const dz = otherPos.z - car.pos.z;
      const fwdProj = dx * _fwd.x + dz * _fwd.z;
      if (fwdProj >= -2.5 || fwdProj < -88) return;
      const latProj = dx * _right.x + dz * _right.z;
      if (Math.abs(latProj) > 15) return;
      this.rearBlipsBuf.push({
        id,
        distM: Math.round(-fwdProj),
        lateralOffset: Number(latProj.toFixed(2)),
        isPolice,
        isTraffic,
        color,
      });
    };

    for (const r of this.racers) {
      if (!r.active || r.isPlayer) continue;
      addIfBehind(r.id, r.pos, false, false, r.colorCss);
    }
    for (const p of this.policeCars) {
      if (!p.active) continue;
      addIfBehind(
        p.id,
        p.pos,
        true,
        false,
        Math.sin(this.elapsed * 20) > 0 ? '#ef4444' : '#3b82f6',
      );
    }
    for (const tc of this.trafficCars) {
      if (!tc.active) continue;
      addIfBehind(tc.id, tc.pos, false, true, '#fbbf24');
    }
    this.rearBlipsBuf.sort((a, b) => b.distM - a.distM);
  }

  private snapCameraForCurrentMode(): void {
    const car = this.player;
    const yaw = car.heading + car.driftSlip * 0.45;
    _fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    if (this.cameraMode === 'HOOD') {
      this.cameraPos.copy(car.pos).addScaledVector(_fwd, car.spec.isBike ? 0.45 : 0.35);
      this.cameraPos.y += car.spec.isBike ? 1.24 : 1.08;
      this.cameraLook.copy(car.pos).addScaledVector(_fwd, 26);
      this.cameraLook.y += 0.92;
    } else if (this.cameraMode === 'COCKPIT') {
      this.cameraPos.copy(car.pos).addScaledVector(_fwd, car.spec.isBike ? 0.12 : -0.14);
      this.cameraPos.y += car.spec.isBike ? 1.28 : 1.02;
      this.cameraLook.copy(car.pos).addScaledVector(_fwd, 24);
      this.cameraLook.y += 0.92;
    } else {
      this.cameraPos.copy(car.pos).addScaledVector(_fwd, -(car.spec.isBike ? 6.5 : 8.2));
      this.cameraPos.y += car.spec.isBike ? 2.55 : 3.2;
      this.cameraLook.copy(car.pos).addScaledVector(_fwd, 12);
      this.cameraLook.y += 1.25;
    }
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLook);
  }

  private updateTitleCamera(dt: number): void {
    if (this.garagePresetSnapTimer > 0) {
      this.garagePresetSnapTimer = Math.max(0, this.garagePresetSnapTimer - dt);
      let yawDiff = this.garageTargetYaw - this.garageOrbitYaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      this.garageOrbitYaw += yawDiff * (1 - Math.exp(-10 * dt));
      this.garageOrbitPitch = THREE.MathUtils.damp(
        this.garageOrbitPitch,
        this.garageTargetPitch,
        10,
        dt,
      );
    } else if (this.garageDragResumeTimer > 0) {
      this.garageDragResumeTimer = Math.max(0, this.garageDragResumeTimer - dt);
    } else {
      this.garageOrbitYaw += dt * (this.garageFocusMode ? 0.16 : 0.24);
    }

    const baseRadius = this.currentVehicle.isBike ? 5.3 : 7.2;
    const radius = baseRadius * this.garageZoom;
    const heightOffset = Math.sin(this.garageOrbitPitch) * radius + 0.85;
    const horizR = Math.cos(this.garageOrbitPitch) * radius;

    _camTargetPos.set(
      this.player.pos.x + Math.sin(this.garageOrbitYaw) * horizR,
      this.player.pos.y + heightOffset,
      this.player.pos.z + Math.cos(this.garageOrbitYaw) * horizR,
    );
    const lookY =
      (this.currentVehicle.isBike ? 0.65 : 0.55) + (this.garageFocusMode ? -0.22 : 0);
    _camLookTarget.set(
      this.player.pos.x,
      this.player.pos.y + lookY,
      this.player.pos.z,
    );
    this.cameraPos.lerp(_camTargetPos, 1 - Math.exp(-9 * dt));
    this.cameraLook.lerp(_camLookTarget, 1 - Math.exp(-11 * dt));
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraLook);
    this.camera.rotation.z = 0;
    const targetFov = this.garageFocusMode ? 52 : 56;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateChaseCamera(dt: number): void {
    const car = this.player;
    const speedRatio = THREE.MathUtils.clamp(Math.abs(car.speed) / 105, 0, 1.3);
    const camYaw =
      this.cameraMode === 'CHASE'
        ? car.heading + car.driftSlip * 0.45
        : car.heading + car.driftSlip * 0.72;
    _fwd.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    _right.set(Math.cos(camYaw), 0, -Math.sin(camYaw));

    this.cameraKick = THREE.MathUtils.damp(this.cameraKick, 0, 4.5, dt);

    const speedKmh = Math.abs(car.speed) * 3.6;
    const baseFov = this.cameraMode === 'COCKPIT' ? 68 : this.cameraMode === 'HOOD' ? 65 : 60;
    const targetFov =
      baseFov +
      Math.pow(Math.min(speedRatio, 1.35), 1.15) * 16 +
      (car.isBoosting ? 7.5 : 0) +
      this.cameraKick * 3.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.04) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7.2, dt);
      this.camera.updateProjectionMatrix();
    }

    if (this.cameraMode === 'HOOD') {
      const fwdOffset = car.spec.isBike ? 0.45 : 0.35;
      const height = car.spec.isBike ? 1.24 : 1.08;
      _camTargetPos.copy(car.pos).addScaledVector(_fwd, fwdOffset);
      _camTargetPos.y += height;
      _camLookTarget.copy(car.pos).addScaledVector(_fwd, 28);
      _camLookTarget.y += 0.92;

      this.cameraPos.copy(_camTargetPos);
      this.cameraLook.lerp(_camLookTarget, 1 - Math.exp(-26 * dt));
    } else if (this.cameraMode === 'COCKPIT') {
      const fwdOffset = car.spec.isBike ? 0.12 : -0.14;
      const height = car.spec.isBike ? 1.28 : 1.02;
      _camTargetPos.copy(car.pos).addScaledVector(_fwd, fwdOffset);
      _camTargetPos.y += height;
      _camLookTarget.copy(car.pos).addScaledVector(_fwd, 26);
      _camLookTarget.y += 0.9;

      this.cameraPos.copy(_camTargetPos);
      this.cameraLook.lerp(_camLookTarget, 1 - Math.exp(-28 * dt));
    } else {
      const baseDist = car.spec.isBike ? 6.5 : 7.9;
      const chaseDist =
        baseDist + speedRatio * 1.15 + (car.isBoosting ? 1.55 : 0) + this.cameraKick * 0.65;
      const chaseHeight = (car.spec.isBike ? 2.55 : 3.05) + (car.isBoosting ? 0.28 : 0);
      const driftShift = -car.driftSlip * 3.6;

      _camTargetPos
        .copy(car.pos)
        .addScaledVector(_fwd, -chaseDist)
        .addScaledVector(_right, driftShift);
      _camTargetPos.y += chaseHeight;

      _camLookTarget.copy(car.pos).addScaledVector(_fwd, 12);
      _camLookTarget.y += 1.25;

      this.cameraPos.x = THREE.MathUtils.damp(this.cameraPos.x, _camTargetPos.x, 12, dt);
      this.cameraPos.y = THREE.MathUtils.damp(this.cameraPos.y, _camTargetPos.y, 9.5, dt);
      this.cameraPos.z = THREE.MathUtils.damp(this.cameraPos.z, _camTargetPos.z, 12, dt);

      this.cameraLook.x = THREE.MathUtils.damp(this.cameraLook.x, _camLookTarget.x, 15, dt);
      this.cameraLook.y = THREE.MathUtils.damp(this.cameraLook.y, _camLookTarget.y, 12, dt);
      this.cameraLook.z = THREE.MathUtils.damp(this.cameraLook.z, _camLookTarget.z, 15, dt);
    }

    this.camera.position.copy(this.cameraPos);

    const aeroFactor = THREE.MathUtils.clamp((speedKmh - 280) / 160, 0, 1);
    const speedVib =
      this.phase === 'RACING'
        ? Math.max(0, speedRatio - 0.55) * 0.032 +
          aeroFactor * 0.048 +
          (car.isBoosting ? 0.038 : 0)
        : 0;
    const totalShake = this.shakeIntensity + speedVib;
    if (totalShake > 0.003) {
      const vibScale = this.cameraMode === 'CHASE' ? 1.0 : 0.36;
      const t = this.elapsed;
      const microX = Math.sin(t * 53.0) * 0.6 + (Math.random() - 0.5) * 0.8;
      const microY = Math.cos(t * 67.0) * 0.6 + (Math.random() - 0.5) * 0.8;
      this.camera.position.x += microX * totalShake * vibScale;
      this.camera.position.y += microY * totalShake * 0.72 * vibScale;
      this.shakeIntensity *= Math.exp(-10 * dt);
    } else {
      this.shakeIntensity = 0;
    }

    this.camera.lookAt(this.cameraLook);

    const bikeCockpitLean =
      car.spec.isBike && this.cameraMode !== 'CHASE'
        ? -car.steerInput * speedRatio * 0.24
        : 0;
    const targetRoll = -car.driftSlip * 0.17 + bikeCockpitLean;
    this.cameraRoll = THREE.MathUtils.damp(this.cameraRoll, targetRoll, 8, dt);
    this.camera.rotation.z += this.cameraRoll;
  }

  private computePlayerPosition(): number {
    const activeRacers = this.racers.filter((r) => r.active || r.isPlayer);
    const sorted = [...activeRacers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTimeMs - b.finishTimeMs;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.totalProgress - a.totalProgress;
    });
    return Math.max(1, sorted.findIndex((r) => r.isPlayer) + 1);
  }

  private emitHud(): void {
    const activeRacers = this.racers.filter((r) => r.active || r.eliminated || r.isPlayer);
    const visibleRacers = this.racers.filter((r) => r.active);
    const sorted = [...activeRacers]
      .filter((r) => r.isPlayer || r.active || r.eliminated)
      .sort((a, b) => {
        if (a.eliminated && !b.eliminated) return 1;
        if (!a.eliminated && b.eliminated) return -1;
        if (a.finished && b.finished) return a.finishTimeMs - b.finishTimeMs;
        if (a.finished) return -1;
        if (b.finished) return 1;
        return b.totalProgress - a.totalProgress;
      });

    const playerPosIdx = Math.max(1, sorted.findIndex((r) => r.isPlayer) + 1);
    const speedKmh = Math.round(Math.abs(this.player.speed) * 3.6);
    const gear = Math.min(7, Math.max(1, Math.floor(speedKmh / 64) + 1));
    const rpmRatio = Math.min(
      1,
      0.16 + ((speedKmh % 64) / 64) * 0.65 + (speedKmh / 450) * 0.25,
    );

    const bMin = this.track.boundsMin;
    const bMax = this.track.boundsMax;
    const spanX = Math.max(1, bMax.x - bMin.x);
    const spanZ = Math.max(1, bMax.y - bMin.y);

    const minimapDots: RacerMinimapDot[] = [
      ...visibleRacers.map((r) => ({
        id: r.id,
        x: (r.pos.x - bMin.x) / spanX,
        z: (r.pos.z - bMin.y) / spanZ,
        isPlayer: r.isPlayer,
        isPolice: false,
        isSuspect: r.isSuspect,
        color: r.isSuspect ? '#ef4444' : r.colorCss,
      })),
      ...this.policeCars
        .filter((p) => p.active)
        .map((p) => ({
          id: p.id,
          x: (p.pos.x - bMin.x) / spanX,
          z: (p.pos.z - bMin.y) / spanZ,
          isPlayer: false,
          isPolice: true,
          color: Math.sin(this.elapsed * 16) > 0 ? '#ff2a4b' : '#3b82f6',
        })),
    ];

    const standings: RacerStanding[] = sorted.map((r, idx) => ({
      id: r.id,
      name: r.name,
      isPlayer: r.isPlayer,
      position: idx + 1,
      totalTimeMs: r.finished ? r.finishTimeMs : this.raceTimeMs,
      bestLapMs: r.bestLapMs,
      color: r.colorCss,
      finished: r.finished,
      eliminated: r.eliminated,
    }));

    const dragProgress =
      this.mode === 'DRAG_STRIP'
        ? Math.round(
            THREE.MathUtils.clamp(((this.player.t - 0.055) / (0.91 - 0.055)) * 100, 0, 100),
          )
        : 0;

    const suspectsRemaining =
      this.mode === 'COP_TAKEDOWN'
        ? this.racers.filter((r) => !r.isPlayer && r.active).length
        : 0;

    this.onHudUpdate({
      phase: this.phase,
      mode: this.mode,
      cameraMode: this.cameraMode,
      graphicsQuality: this.graphicsQuality,
      isHardwareMirror: this.isHardwareMirrorSupported,
      vehicleId: this.currentVehicle.id,
      vehicleName: this.currentVehicle.name,
      isBike: this.currentVehicle.isBike,
      truckArtEnabled: this.truckArtEnabled,
      speedKmh,
      topSpeedKmh: this.topSpeedKmh,
      score: this.score,
      driftScore: this.driftScore,
      comboMultiplier: this.comboMultiplier,
      nearMisses: this.nearMisses,
      rpmRatio,
      gear,
      nitro: Math.round(this.player.nitro),
      hullIntegrity: Math.round(this.hullIntegrity),
      impactFlash: Number(this.impactFlash.toFixed(3)),
      slowMoActive: this.slowMoTimer > 0,
      mirrorEnabled: this.mirrorEnabled,
      isBoosting: this.player.isBoosting,
      isDrifting: this.player.isDrifting,
      driftIntensity: this.player.isDrifting
        ? Math.min(1, Math.abs(this.player.driftSlip) / 0.35)
        : 0,
      lap: this.player.lap,
      totalLaps: this.totalLaps,
      position: playerPosIdx,
      totalRacers: visibleRacers.length,
      raceTimeMs: this.raceTimeMs,
      currentLapMs: Math.max(0, this.raceTimeMs - this.player.lapStartedAtMs),
      bestLapMs: this.player.bestLapMs,
      modeTimerMs: this.modeTimerMs,
      knockoutNextMs: this.knockoutNextMs,
      checkpointsCleared: this.checkpointsCleared,
      checkpointsTarget: CHECKPOINT_TARGET,
      dragProgress,
      suspectsRemaining,
      suspectsTotal: 4,
      policeHeat: Math.round(this.policeHeat),
      wantedStars: this.wantedStars,
      pursuitAlert: this.pursuitAlert,
      policeCloseWarning: this.policeCloseWarning,
      bustProgress: Math.round(this.bustProgress),
      busted: this.busted,
      victory: this.victory,
      resultHeadline: this.resultHeadline,
      resultSubline: this.resultSubline,
      takedowns: this.takedowns,
      countdownValue: Math.max(0, Math.ceil(this.countdownTimer)),
      bannerText: this.bannerText,
      weatherCondition: this.weatherCondition,
      trackGripPercent: Math.round(
        THREE.MathUtils.clamp(
          this.modeConfig.gripMultiplier * this.weatherGripFactor * 100,
          55,
          105,
        ),
      ),
      playerHeadingRad: this.player.heading + this.player.driftSlip,
      sharpTurnAhead: this.track.detectSharpTurnAtT(this.player.t),
      minimapPath: this.track.minimapPath,
      minimapDots,
      rearBlips: [...this.rearBlipsBuf],
      standings,
      lapMetrics: [...this.lapMetrics],
      speedSplits: [...this.speedSplits],
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );

    this.audio.dispose();
    this.track.dispose();
    this.particles.dispose();
    this.driftTrails.dispose();
    this.sparks.dispose();
    this.speedStreaks.dispose();
    this.weather.dispose();
    this.racers.forEach((r) => r.model.dispose());
    this.policeCars.forEach((p) => p.model.dispose());
    this.trafficCars.forEach((tc) => tc.rig.dispose());
    this.ghostRig?.dispose();
    this.contactShadowTex.dispose();
    this.skyTex.dispose();
    this.truckArtTex.dispose();
    this.policeDecalTex.dispose();
    this.cockpitClusterTex.dispose();
    this.envTexture.dispose();
    this.pmremGenerator.dispose();
    this.skyDome.geometry.dispose();
    (this.skyDome.material as THREE.Material).dispose();
    this.composer?.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
