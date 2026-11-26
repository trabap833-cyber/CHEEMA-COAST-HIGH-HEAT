import * as THREE from 'three';
import {
  PbrTextureSet,
  createAbdullahCheemaBillboardTexture,
  createBoostPadTexture,
  createBuildingFacadeTexture,
  createConcretePbrTextures,
  createFinishBannerTexture,
  createFoliagePbrTextures,
  createHighwaySignTexture,
  createLightPoolTexture,
  createRoadTextures,
  createRockCliffPbrTextures,
  createSandDunePbrTextures,
  createTruckArtTexture,
  createTurnChevronTexture,
} from './textures';
import { EnvironmentStyle, ModeConfig } from './types';

export interface TrackSample {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  t: number;
  dist: number;
  curvature: number;
  bankAngle: number;
  isBridge: boolean;
}

export interface BoostPadItem {
  t: number;
  lateral: number;
  pos: THREE.Vector3;
  mesh: THREE.Mesh;
}

export interface NitroPickupItem {
  id: number;
  t: number;
  lateral: number;
  pos: THREE.Vector3;
  group: THREE.Group;
  cooldown: number;
}

export interface CheckpointGate {
  t: number;
  pos: THREE.Vector3;
  emissiveMat: THREE.MeshStandardMaterial;
  flashTimer: number;
}

export interface RoadblockItem {
  t: number;
  lateral: number;
  pos: THREE.Vector3;
  radius: number;
  group: THREE.Group;
  brokenTimer: number;
}

export interface TrackQueryResult {
  sampleIndex: number;
  t: number;
  roadY: number;
  lateral: number;
  tangent: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  closestPos: THREE.Vector3;
}

export interface EnvironmentLightingConfig {
  bgHex: number;
  fogHex: number;
  fogDensity: number;
  sunHex: number;
  sunIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  rimHex: number;
  rimIntensity: number;
  exposure: number;
}

export function getEnvironmentLighting(style: EnvironmentStyle): EnvironmentLightingConfig {
  switch (style) {
    case 'alpine_gp':
      return {
        bgHex: 0x5ca4e6,
        fogHex: 0x8cc7f7,
        fogDensity: 0.00085,
        sunHex: 0xfff7e6,
        sunIntensity: 2.75,
        hemiSkyHex: 0xbfe3ff,
        hemiGroundHex: 0x3b593f,
        hemiIntensity: 1.25,
        rimHex: 0x93c5fd,
        rimIntensity: 0.75,
        exposure: 1.08,
      };
    case 'drag_strip':
      return {
        bgHex: 0x93c5fd,
        fogHex: 0xfde68a,
        fogDensity: 0.0009,
        sunHex: 0xffedd5,
        sunIntensity: 2.85,
        hemiSkyHex: 0x7dd3fc,
        hemiGroundHex: 0xc29b61,
        hemiIntensity: 1.2,
        rimHex: 0xfbbf24,
        rimIntensity: 0.8,
        exposure: 1.08,
      };
    case 'desert_canyon':
      return {
        bgHex: 0x9a3412,
        fogHex: 0xd97706,
        fogDensity: 0.0012,
        sunHex: 0xffa94d,
        sunIntensity: 2.65,
        hemiSkyHex: 0xfdba74,
        hemiGroundHex: 0x5c2610,
        hemiIntensity: 1.15,
        rimHex: 0xf59e0b,
        rimIntensity: 0.9,
        exposure: 1.1,
      };
    case 'mountain_touge':
      return {
        bgHex: 0x163844,
        fogHex: 0x26535e,
        fogDensity: 0.0022,
        sunHex: 0xa7f3d0,
        sunIntensity: 1.85,
        hemiSkyHex: 0x67e8f9,
        hemiGroundHex: 0x0f2922,
        hemiIntensity: 1.1,
        rimHex: 0x34d399,
        rimIntensity: 0.9,
        exposure: 1.12,
      };
    case 'cyberpunk_rain':
      return {
        bgHex: 0x07041a,
        fogHex: 0x110a2c,
        fogDensity: 0.0019,
        sunHex: 0x67e8f9,
        sunIntensity: 1.55,
        hemiSkyHex: 0xc084fc,
        hemiGroundHex: 0x090b1a,
        hemiIntensity: 1.05,
        rimHex: 0xf43f5e,
        rimIntensity: 1.25,
        exposure: 1.18,
      };
    case 'industrial_port':
      return {
        bgHex: 0x2a1812,
        fogHex: 0x452216,
        fogDensity: 0.0016,
        sunHex: 0xfb923c,
        sunIntensity: 2.3,
        hemiSkyHex: 0xfdba74,
        hemiGroundHex: 0x1c1917,
        hemiIntensity: 1.05,
        rimHex: 0x38bdf8,
        rimIntensity: 0.9,
        exposure: 1.12,
      };
    case 'downtown_tunnels':
    case 'ring_road':
      return {
        bgHex: 0x091124,
        fogHex: 0x0f1933,
        fogDensity: 0.0016,
        sunHex: 0x93c5fd,
        sunIntensity: 1.75,
        hemiSkyHex: 0x60a5fa,
        hemiGroundHex: 0x111827,
        hemiIntensity: 1.1,
        rimHex: 0xf43f5e,
        rimIntensity: 1.05,
        exposure: 1.14,
      };
    case 'gt_highway':
      return {
        bgHex: 0x1b192c,
        fogHex: 0x2b2236,
        fogDensity: 0.00135,
        sunHex: 0xfbbf24,
        sunIntensity: 2.4,
        hemiSkyHex: 0xfde68a,
        hemiGroundHex: 0x1e293b,
        hemiIntensity: 1.1,
        rimHex: 0x10b981,
        rimIntensity: 0.9,
        exposure: 1.12,
      };
    case 'zigzag_serpentine':
      return {
        bgHex: 0x45120b,
        fogHex: 0x7c2d12,
        fogDensity: 0.00125,
        sunHex: 0xff9f43,
        sunIntensity: 2.6,
        hemiSkyHex: 0xfdba74,
        hemiGroundHex: 0x3b170e,
        hemiIntensity: 1.15,
        rimHex: 0xff6b00,
        rimIntensity: 1.0,
        exposure: 1.12,
      };
    case 'wavy_coaster':
      return {
        bgHex: 0x091936,
        fogHex: 0x0e2a47,
        fogDensity: 0.0012,
        sunHex: 0x7dd3fc,
        sunIntensity: 2.25,
        hemiSkyHex: 0x38bdf8,
        hemiGroundHex: 0x0b172a,
        hemiIntensity: 1.18,
        rimHex: 0x00f5d4,
        rimIntensity: 1.15,
        exposure: 1.14,
      };
    case 'mountain_hairpin_pass':
      return {
        bgHex: 0x2a5b84,
        fogHex: 0x72a5c8,
        fogDensity: 0.00105,
        sunHex: 0xfff3d6,
        sunIntensity: 2.7,
        hemiSkyHex: 0xbae6fd,
        hemiGroundHex: 0x1e3a2f,
        hemiIntensity: 1.25,
        rimHex: 0x38bdf8,
        rimIntensity: 0.9,
        exposure: 1.1,
      };
    case 'desert_canyon_highway':
      return {
        bgHex: 0x7c2d12,
        fogHex: 0xc2410c,
        fogDensity: 0.0011,
        sunHex: 0xfdba74,
        sunIntensity: 2.8,
        hemiSkyHex: 0xfed7aa,
        hemiGroundHex: 0x451a03,
        hemiIntensity: 1.2,
        rimHex: 0xf59e0b,
        rimIntensity: 0.95,
        exposure: 1.12,
      };
    case 'midnight_harbor_circuit':
      return {
        bgHex: 0x050b1a,
        fogHex: 0x0a1630,
        fogDensity: 0.00155,
        sunHex: 0x38bdf8,
        sunIntensity: 1.65,
        hemiSkyHex: 0x60a5fa,
        hemiGroundHex: 0x081022,
        hemiIntensity: 1.1,
        rimHex: 0x00f5d4,
        rimIntensity: 1.25,
        exposure: 1.18,
      };
    case 'karakorum_sky_pass':
      return {
        bgHex: 0x203b60,
        fogHex: 0xb87e4b,
        fogDensity: 0.00115,
        sunHex: 0xffcc70,
        sunIntensity: 2.75,
        hemiSkyHex: 0xfde68a,
        hemiGroundHex: 0x2c241d,
        hemiIntensity: 1.2,
        rimHex: 0xf59e0b,
        rimIntensity: 1.0,
        exposure: 1.12,
      };
    case 'cholistan_mirage_highway':
      return {
        bgHex: 0x6b2010,
        fogHex: 0xdf7222,
        fogDensity: 0.00105,
        sunHex: 0xffb347,
        sunIntensity: 2.85,
        hemiSkyHex: 0xfed7aa,
        hemiGroundHex: 0x4d1d09,
        hemiIntensity: 1.22,
        rimHex: 0xf97316,
        rimIntensity: 0.95,
        exposure: 1.14,
      };
    case 'lahore_midnight_gp':
      return {
        bgHex: 0x050816,
        fogHex: 0x0b1628,
        fogDensity: 0.00175,
        sunHex: 0x34d399,
        sunIntensity: 1.6,
        hemiSkyHex: 0x6ee7b7,
        hemiGroundHex: 0x0a101d,
        hemiIntensity: 1.08,
        rimHex: 0xfbbf24,
        rimIntensity: 1.25,
        exposure: 1.18,
      };
    case 'gwadar_port_docks':
      return {
        bgHex: 0x101c30,
        fogHex: 0x3a2835,
        fogDensity: 0.0015,
        sunHex: 0xfb923c,
        sunIntensity: 2.2,
        hemiSkyHex: 0x7dd3fc,
        hemiGroundHex: 0x131a26,
        hemiIntensity: 1.1,
        rimHex: 0x0ea5e9,
        rimIntensity: 1.1,
        exposure: 1.15,
      };
    case 'emerald_valley_loop':
      return {
        bgHex: 0x0b2a24,
        fogHex: 0x1c4a3e,
        fogDensity: 0.0021,
        sunHex: 0x6ee7b7,
        sunIntensity: 1.9,
        hemiSkyHex: 0xa7f3d0,
        hemiGroundHex: 0x08241d,
        hemiIntensity: 1.18,
        rimHex: 0x34d399,
        rimIntensity: 1.05,
        exposure: 1.14,
      };
    default:
      // coastal
      return {
        bgHex: 0x13172b,
        fogHex: 0x161a30,
        fogDensity: 0.00145,
        sunHex: 0xffb580,
        sunIntensity: 2.35,
        hemiSkyHex: 0x7fb4ff,
        hemiGroundHex: 0x1b2338,
        hemiIntensity: 1.08,
        rimHex: 0x3ad7ff,
        rimIntensity: 0.85,
        exposure: 1.12,
      };
  }
}

const UP = new THREE.Vector3(0, 1, 0);

export class RaceTrack {
  public readonly group = new THREE.Group();
  public readonly style: EnvironmentStyle;
  public readonly isOpenLoop: boolean;
  public readonly roadHalfWidth: number;
  public readonly totalLength: number;
  public readonly samples: TrackSample[] = [];
  public readonly sampleCount = 800;
  public readonly boostPads: BoostPadItem[] = [];
  public readonly nitroPickups: NitroPickupItem[] = [];
  public readonly checkpoints: CheckpointGate[] = [];
  public readonly roadblocks: RoadblockItem[] = [];
  public readonly dragTreeLights: THREE.MeshStandardMaterial[] = [];
  public readonly minimapPath: Array<{ x: number; z: number }> = [];
  public readonly boundsMin = new THREE.Vector2();
  public readonly boundsMax = new THREE.Vector2();

  private readonly disposables: Array<{ dispose: () => void }> = [];
  private readonly maxAnisotropy: number;
  private readonly boostTex: THREE.CanvasTexture;
  private readonly roadMap: THREE.CanvasTexture;
  private readonly roadRough: THREE.CanvasTexture;
  private readonly roadNorm: THREE.DataTexture;
  private readonly concretePbr: PbrTextureSet;
  private readonly rockPbr: PbrTextureSet;
  private readonly sandPbr: PbrTextureSet;
  private readonly barkPbr: PbrTextureSet;
  private readonly foliagePbr: PbrTextureSet;
  private readonly lightPoolTex: THREE.CanvasTexture;
  private readonly billboardTex: THREE.CanvasTexture;
  private readonly billboardMat: THREE.MeshStandardMaterial;
  private roadMat: THREE.MeshStandardMaterial | null = null;

  constructor(
    maxAnisotropy: number,
    modeConfig: ModeConfig,
    billboardPhotoImg: HTMLImageElement | null = null,
  ) {
    this.maxAnisotropy = maxAnisotropy;
    this.style = modeConfig.environmentStyle;
    this.isOpenLoop = this.style === 'drag_strip';
    this.roadHalfWidth =
      this.style === 'cholistan_mirage_highway'
        ? 11.2
        : this.style === 'gt_highway' ||
            this.style === 'downtown_tunnels' ||
            this.style === 'lahore_midnight_gp'
          ? 10.6
          : 9.4;

    const controlPoints = this.getControlPointsForStyle(this.style);
    const curve = new THREE.CatmullRomCurve3(
      controlPoints,
      !this.isOpenLoop,
      'catmullrom',
      0.45,
    );
    this.totalLength = curve.getLength();

    const spaced = curve.getSpacedPoints(this.sampleCount);
    const rawCurvatures = new Float32Array(this.sampleCount);
    const tangents: THREE.Vector3[] = [];
    const flatRights: THREE.Vector3[] = [];

    for (let i = 0; i < this.sampleCount; i++) {
      const next = this.isOpenLoop
        ? spaced[Math.min(this.sampleCount - 1, i + 1)]
        : spaced[(i + 1) % this.sampleCount];
      const prev = this.isOpenLoop
        ? spaced[Math.max(0, i - 1)]
        : spaced[(i - 1 + this.sampleCount) % this.sampleCount];
      const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
      const flatRight = new THREE.Vector3().crossVectors(tangent, UP).normalize();
      tangents.push(tangent);
      flatRights.push(flatRight);
    }

    for (let i = 0; i < this.sampleCount; i++) {
      if (this.isOpenLoop) {
        rawCurvatures[i] = 0;
        continue;
      }
      const prevT = tangents[(i - 2 + this.sampleCount) % this.sampleCount];
      const nextT = tangents[(i + 2) % this.sampleCount];
      const dtx = nextT.x - prevT.x;
      const dtz = nextT.z - prevT.z;
      rawCurvatures[i] = dtx * flatRights[i].x + dtz * flatRights[i].z;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < this.sampleCount; i++) {
      const p = spaced[i];
      const tangent = tangents[i];
      const flatRight = flatRights[i];
      const baseUp = new THREE.Vector3().crossVectors(flatRight, tangent).normalize();

      // Smooth curvature over nearby window for realistic banked curves
      let smoothCurv = 0;
      if (!this.isOpenLoop) {
        for (let w = -5; w <= 5; w++) {
          smoothCurv += rawCurvatures[(i + w + this.sampleCount) % this.sampleCount];
        }
        smoothCurv /= 11;
      }

      const bankAngle = this.isOpenLoop
        ? 0
        : THREE.MathUtils.clamp(-smoothCurv * 1.45, -0.15, 0.15);

      const right = flatRight
        .clone()
        .multiplyScalar(Math.cos(bankAngle))
        .addScaledVector(baseUp, Math.sin(bankAngle))
        .normalize();
      const up = new THREE.Vector3().crossVectors(right, tangent).normalize();
      const t = i / this.sampleCount;

      this.samples.push({
        pos: p.clone(),
        tangent,
        right,
        up,
        t,
        dist: t * this.totalLength,
        curvature: smoothCurv,
        bankAngle,
        isBridge:
          (this.style === 'emerald_valley_loop' ? p.y > 7.5 : p.y > 3.4) &&
          this.style !== 'mountain_touge' &&
          this.style !== 'mountain_hairpin_pass' &&
          this.style !== 'karakorum_sky_pass',
      });

      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    const pad = 45;
    this.boundsMin.set(minX - pad, minZ - pad);
    this.boundsMax.set(maxX + pad, maxZ + pad);

    for (let i = 0; i < 80; i++) {
      const s = this.samples[Math.floor((i / 80) * this.sampleCount)];
      this.minimapPath.push({
        x: (s.pos.x - this.boundsMin.x) / Math.max(1, this.boundsMax.x - this.boundsMin.x),
        z: (s.pos.z - this.boundsMin.y) / Math.max(1, this.boundsMax.y - this.boundsMin.y),
      });
    }

    const roadTex = createRoadTextures(maxAnisotropy, this.style);
    this.roadMap = roadTex.map;
    this.roadRough = roadTex.roughnessMap;
    this.roadNorm = roadTex.normalMap;

    const isDesertLike =
      this.style === 'desert_canyon' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'desert_canyon_highway' ||
      this.style === 'cholistan_mirage_highway';
    const isLushValley =
      this.style === 'emerald_valley_loop' ||
      this.style === 'mountain_touge' ||
      this.style === 'alpine_gp' ||
      this.style === 'mountain_hairpin_pass';

    this.concretePbr = this.trackPbr(createConcretePbrTextures(maxAnisotropy, '#525b68'));
    this.rockPbr = this.trackPbr(
      createRockCliffPbrTextures(
        maxAnisotropy,
        isDesertLike ? '#8a401f' : isLushValley ? '#2c4239' : '#4f463f',
        isDesertLike ? '#c26938' : isLushValley ? '#496e59' : '#7a6c61',
      ),
    );
    this.sandPbr = this.trackPbr(createSandDunePbrTextures(maxAnisotropy));
    this.barkPbr = this.trackPbr(createRockCliffPbrTextures(maxAnisotropy, '#4d3724', '#6f5136'));
    this.foliagePbr = this.trackPbr(
      createFoliagePbrTextures(
        maxAnisotropy,
        this.style === 'alpine_gp' ? '#246c44' : '#194f3a',
        this.style === 'alpine_gp' ? '#429a65' : '#2d7d57',
      ),
    );
    this.lightPoolTex = createLightPoolTexture();

    this.boostTex = createBoostPadTexture(maxAnisotropy);
    this.billboardTex = createAbdullahCheemaBillboardTexture(billboardPhotoImg, maxAnisotropy);
    this.billboardMat = new THREE.MeshStandardMaterial({
      map: this.billboardTex,
      emissiveMap: this.billboardTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.72,
      roughness: 0.28,
      metalness: 0.15,
    });
    this.disposables.push(
      this.roadMap,
      this.roadRough,
      this.roadNorm,
      this.lightPoolTex,
      this.boostTex,
      this.billboardTex,
      this.billboardMat,
    );

    // Core Track Layers
    this.buildRoadSurface();
    this.buildGuardrails();
    this.buildApexCurbsAndTurnSigns(maxAnisotropy);
    this.buildAbdullahCheemaBillboards();
    this.buildEnvironmentTerrain();
    this.buildEnvironmentLandmarks(maxAnisotropy);
    this.buildStreetlights();
    this.buildCheckpointsAndFinish(maxAnisotropy, modeConfig);

    if (!this.isOpenLoop) {
      this.buildBoostPads();
      this.buildNitroPickups();
    } else {
      this.buildDragStripFeatures(maxAnisotropy);
    }

    if (this.style === 'downtown_tunnels') {
      this.buildTunnelsAndRoadblocks();
    }
  }

  public updateBillboardPhoto(img: HTMLImageElement | null): void {
    createAbdullahCheemaBillboardTexture(img, this.maxAnisotropy, this.billboardTex);
    this.billboardMat.needsUpdate = true;
  }

  public setSurfaceWetness(wetness01: number): void {
    if (!this.roadMat) return;
    const baseWet =
      this.style === 'cyberpunk_rain' || this.style === 'lahore_midnight_gp'
        ? 0.72
        : this.style === 'emerald_valley_loop'
          ? 0.58
          : 0;
    const effectiveWet = Math.max(baseWet, THREE.MathUtils.clamp(wetness01, 0, 1));
    this.roadMat.roughness = THREE.MathUtils.lerp(0.74, 0.16, effectiveWet);
    this.roadMat.metalness = THREE.MathUtils.lerp(0.14, 0.48, effectiveWet);
    this.roadMat.envMapIntensity = THREE.MathUtils.lerp(1.22, 2.35, effectiveWet);
    const ns = THREE.MathUtils.lerp(0.36, 0.14, effectiveWet);
    this.roadMat.normalScale.set(ns, ns);
    const shade = THREE.MathUtils.lerp(1.0, 0.74, effectiveWet);
    this.roadMat.color.setRGB(shade, shade, Math.min(1, shade * 1.04));
  }

  public detectSharpTurnAtT(tNorm: number): 'LEFT' | 'RIGHT' | null {
    if (this.isOpenLoop) return null;
    const baseIdx = Math.floor((((tNorm % 1) + 1) % 1) * this.sampleCount);
    let peak = 0;
    for (let offset = 6; offset <= 24; offset += 2) {
      const s = this.samples[(baseIdx + offset) % this.sampleCount];
      if (Math.abs(s.curvature) > Math.abs(peak)) {
        peak = s.curvature;
      }
    }
    if (peak > 0.048) return 'RIGHT';
    if (peak < -0.048) return 'LEFT';
    return null;
  }

  private getControlPointsForStyle(style: EnvironmentStyle): THREE.Vector3[] {
    if (style === 'drag_strip') {
      return [
        new THREE.Vector3(0, 0.25, 480),
        new THREE.Vector3(0, 0.25, 220),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.25, -260),
        new THREE.Vector3(0, 0.25, -560),
      ];
    }

    if (style === 'mountain_touge') {
      // Winding mountain pass with tight hairpins, S-bends & elevation climb
      return [
        new THREE.Vector3(0, 1.0, 150),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(-24, 4.0, -155),
        new THREE.Vector3(95, 10.0, -295),
        new THREE.Vector3(270, 15.5, -235),
        new THREE.Vector3(195, 19.0, -105),
        new THREE.Vector3(395, 22.0, -25),
        new THREE.Vector3(450, 18.0, 145),
        new THREE.Vector3(285, 13.0, 240),
        new THREE.Vector3(190, 8.5, 138),
        new THREE.Vector3(115, 5.0, 325),
        new THREE.Vector3(-75, 2.5, 315),
        new THREE.Vector3(-140, 1.5, 205),
        new THREE.Vector3(-48, 1.0, 185),
      ];
    }

    if (style === 'alpine_gp') {
      // Sweeping GP circuit with technical S-chicanes and fast hairpins
      return [
        new THREE.Vector3(0, 0.3, 175),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(-18, 0.5, -185),
        new THREE.Vector3(95, 2.4, -365),
        new THREE.Vector3(275, 4.2, -395),
        new THREE.Vector3(385, 3.4, -270),
        new THREE.Vector3(475, 2.5, -175),
        new THREE.Vector3(410, 1.5, 10),
        new THREE.Vector3(305, 1.2, 135),
        new THREE.Vector3(355, 1.0, 260),
        new THREE.Vector3(195, 0.8, 355),
        new THREE.Vector3(55, 0.5, 290),
        new THREE.Vector3(-85, 0.3, 305),
        new THREE.Vector3(-60, 0.3, 210),
      ];
    }

    if (style === 'zigzag_serpentine') {
      // Rapid alternating left-right-left switchbacks, chicanes & canyon slaloms
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.4, -125),
        new THREE.Vector3(-105, 2.2, -215),
        new THREE.Vector3(45, 5.2, -320),
        new THREE.Vector3(-75, 7.6, -440),
        new THREE.Vector3(95, 8.8, -510),
        new THREE.Vector3(235, 6.4, -405),
        new THREE.Vector3(140, 4.0, -295),
        new THREE.Vector3(335, 5.8, -225),
        new THREE.Vector3(255, 8.2, -85),
        new THREE.Vector3(430, 6.2, -5),
        new THREE.Vector3(290, 3.2, 110),
        new THREE.Vector3(415, 2.4, 245),
        new THREE.Vector3(240, 1.8, 335),
        new THREE.Vector3(135, 2.6, 225),
        new THREE.Vector3(35, 1.2, 365),
        new THREE.Vector3(-95, 0.4, 305),
        new THREE.Vector3(-12, 0.25, 250),
      ];
    }

    if (style === 'wavy_coaster') {
      // Rollercoaster undulating hills + sweeping coastal S-waves
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.4, -135),
        new THREE.Vector3(-65, 11.5, -260),
        new THREE.Vector3(55, 1.8, -370),
        new THREE.Vector3(215, 14.5, -425),
        new THREE.Vector3(355, 2.4, -330),
        new THREE.Vector3(465, 16.0, -195),
        new THREE.Vector3(365, 2.2, -55),
        new THREE.Vector3(475, 13.5, 85),
        new THREE.Vector3(340, 1.8, 215),
        new THREE.Vector3(205, 11.0, 340),
        new THREE.Vector3(55, 1.4, 355),
        new THREE.Vector3(-75, 6.2, 295),
        new THREE.Vector3(-20, 0.25, 240),
      ];
    }

    if (style === 'gt_highway') {
      // Rhythmic high-speed sinusoidal S-waves with rolling highway crests
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.35, -135),
        new THREE.Vector3(70, 5.5, -255),
        new THREE.Vector3(-25, 1.2, -375),
        new THREE.Vector3(145, 7.5, -460),
        new THREE.Vector3(305, 2.5, -395),
        new THREE.Vector3(255, 8.5, -245),
        new THREE.Vector3(425, 10.5, -130),
        new THREE.Vector3(335, 3.0, 20),
        new THREE.Vector3(445, 7.2, 165),
        new THREE.Vector3(270, 1.4, 285),
        new THREE.Vector3(165, 4.8, 375),
        new THREE.Vector3(45, 0.9, 325),
        new THREE.Vector3(-85, 0.35, 285),
        new THREE.Vector3(-18, 0.25, 235),
      ];
    }

    if (style === 'desert_canyon') {
      // Winding canyon zigzag + desert arroyo dips
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.3, -135),
        new THREE.Vector3(-90, 2.4, -245),
        new THREE.Vector3(35, 4.8, -360),
        new THREE.Vector3(195, 7.2, -415),
        new THREE.Vector3(295, 3.5, -310),
        new THREE.Vector3(185, 1.2, -205),
        new THREE.Vector3(375, 5.6, -135),
        new THREE.Vector3(410, 6.8, 25),
        new THREE.Vector3(275, 2.0, 130),
        new THREE.Vector3(365, 4.2, 265),
        new THREE.Vector3(180, 1.5, 355),
        new THREE.Vector3(75, 3.8, 265),
        new THREE.Vector3(-65, 1.1, 325),
        new THREE.Vector3(-110, 0.35, 225),
        new THREE.Vector3(-24, 0.25, 215),
      ];
    }

    if (style === 'cyberpunk_rain') {
      // Elevated sweeping wet-neon S-curve expressway
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.4, -140),
        new THREE.Vector3(-55, 4.5, -280),
        new THREE.Vector3(85, 9.2, -395),
        new THREE.Vector3(255, 6.0, -405),
        new THREE.Vector3(365, 12.5, -285),
        new THREE.Vector3(290, 8.0, -145),
        new THREE.Vector3(445, 14.5, -30),
        new THREE.Vector3(390, 10.0, 130),
        new THREE.Vector3(245, 3.5, 215),
        new THREE.Vector3(290, 1.4, 345),
        new THREE.Vector3(115, 0.6, 385),
        new THREE.Vector3(-55, 0.35, 320),
        new THREE.Vector3(-105, 0.25, 235),
        new THREE.Vector3(-25, 0.25, 210),
      ];
    }

    if (style === 'mountain_hairpin_pass') {
      // Dramatic high-altitude alpine pass with sweeping switchback hairpins & fast elevation climbs
      return [
        new THREE.Vector3(0, 1.0, 165),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(-18, 4.5, -165),
        new THREE.Vector3(85, 11.5, -310),
        new THREE.Vector3(245, 18.0, -295),
        new THREE.Vector3(165, 22.5, -170),
        new THREE.Vector3(345, 27.5, -135),
        new THREE.Vector3(465, 25.0, 10),
        new THREE.Vector3(315, 20.0, 85),
        new THREE.Vector3(425, 14.5, 225),
        new THREE.Vector3(255, 10.5, 315),
        new THREE.Vector3(150, 7.0, 205),
        new THREE.Vector3(45, 3.8, 345),
        new THREE.Vector3(-105, 2.0, 295),
        new THREE.Vector3(-135, 1.4, 205),
        new THREE.Vector3(-42, 1.0, 190),
      ];
    }

    if (style === 'desert_canyon_highway') {
      // High-speed sweeping canyon highway with long red-rock curves & fast straights
      return [
        new THREE.Vector3(0, 0.25, 170),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(-12, 0.5, -185),
        new THREE.Vector3(75, 2.5, -365),
        new THREE.Vector3(255, 5.2, -445),
        new THREE.Vector3(430, 7.0, -335),
        new THREE.Vector3(365, 3.5, -175),
        new THREE.Vector3(495, 6.2, -35),
        new THREE.Vector3(445, 4.8, 155),
        new THREE.Vector3(295, 2.0, 245),
        new THREE.Vector3(335, 3.2, 365),
        new THREE.Vector3(160, 1.4, 410),
        new THREE.Vector3(25, 0.6, 330),
        new THREE.Vector3(-95, 0.35, 285),
        new THREE.Vector3(-32, 0.25, 225),
      ];
    }

    if (style === 'midnight_harbor_circuit') {
      // Waterfront dock-to-downtown loop with an elevated harbor bridge span & crisp dockyard chicanes
      return [
        new THREE.Vector3(0, 0.25, 165),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.25, -165),
        new THREE.Vector3(95, 0.35, -315),
        new THREE.Vector3(260, 1.0, -345),
        new THREE.Vector3(345, 5.5, -245),
        new THREE.Vector3(460, 13.5, -145),
        new THREE.Vector3(475, 14.5, 25),
        new THREE.Vector3(385, 6.0, 175),
        new THREE.Vector3(265, 0.4, 165),
        new THREE.Vector3(295, 0.25, 310),
        new THREE.Vector3(165, 0.25, 375),
        new THREE.Vector3(45, 0.25, 305),
        new THREE.Vector3(-80, 0.25, 345),
        new THREE.Vector3(-135, 0.25, 235),
        new THREE.Vector3(-44, 0.25, 200),
      ];
    }

    if (style === 'karakorum_sky_pass') {
      // High-altitude Karakorum alpine switchbacks, sheer cliff ridges & carved rock tunnels
      return [
        new THREE.Vector3(0, 1.0, 160),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(0, 3.8, -195),
        new THREE.Vector3(25, 8.5, -355),
        new THREE.Vector3(165, 15.0, -405),
        new THREE.Vector3(270, 19.5, -280),
        new THREE.Vector3(155, 23.0, -170),
        new THREE.Vector3(320, 27.5, -105),
        new THREE.Vector3(445, 28.0, 45),
        new THREE.Vector3(315, 22.0, 135),
        new THREE.Vector3(415, 16.0, 265),
        new THREE.Vector3(240, 11.5, 365),
        new THREE.Vector3(120, 7.5, 265),
        new THREE.Vector3(25, 4.0, 350),
        new THREE.Vector3(-115, 1.8, 295),
        new THREE.Vector3(-55, 1.0, 210),
      ];
    }

    if (style === 'cholistan_mirage_highway') {
      // Wide sunset desert canyon & dunes with ultra-long 440+ km/h straights and sweeping curves
      return [
        new THREE.Vector3(0, 0.25, 240),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.35, -260),
        new THREE.Vector3(15, 0.8, -510),
        new THREE.Vector3(165, 3.2, -640),
        new THREE.Vector3(395, 5.5, -560),
        new THREE.Vector3(540, 4.0, -340),
        new THREE.Vector3(565, 2.5, -60),
        new THREE.Vector3(520, 4.5, 220),
        new THREE.Vector3(380, 3.0, 420),
        new THREE.Vector3(175, 1.2, 470),
        new THREE.Vector3(-35, 0.5, 405),
        new THREE.Vector3(-90, 0.25, 315),
      ];
    }

    if (style === 'lahore_midnight_gp') {
      // Fast rain-slicked downtown boulevard circuit with wide sweeping heritage-arch straights & technical chicanes
      return [
        new THREE.Vector3(0, 0.25, 180),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.3, -210),
        new THREE.Vector3(85, 1.5, -370),
        new THREE.Vector3(265, 4.2, -395),
        new THREE.Vector3(375, 8.5, -270),
        new THREE.Vector3(310, 4.0, -130),
        new THREE.Vector3(465, 1.5, -35),
        new THREE.Vector3(445, 0.5, 155),
        new THREE.Vector3(295, 0.3, 225),
        new THREE.Vector3(325, 0.3, 355),
        new THREE.Vector3(145, 0.25, 395),
        new THREE.Vector3(35, 0.25, 310),
        new THREE.Vector3(-85, 0.25, 330),
        new THREE.Vector3(-125, 0.25, 225),
        new THREE.Vector3(-35, 0.25, 200),
      ];
    }

    if (style === 'gwadar_port_docks') {
      // Technical harbor container chicane circuit with tight 90-deg turns, waterfront hairpins & dock straight
      return [
        new THREE.Vector3(0, 0.25, 170),
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(0, 0.25, -185),
        new THREE.Vector3(95, 0.25, -285),
        new THREE.Vector3(215, 0.25, -225),
        new THREE.Vector3(310, 0.4, -335),
        new THREE.Vector3(445, 1.2, -265),
        new THREE.Vector3(425, 6.5, -110),
        new THREE.Vector3(485, 11.5, 45),
        new THREE.Vector3(395, 4.5, 195),
        new THREE.Vector3(270, 0.3, 155),
        new THREE.Vector3(245, 0.25, 295),
        new THREE.Vector3(115, 0.25, 345),
        new THREE.Vector3(40, 0.25, 255),
        new THREE.Vector3(-75, 0.25, 315),
        new THREE.Vector3(-125, 0.25, 215),
        new THREE.Vector3(-42, 0.25, 195),
      ];
    }

    if (style === 'emerald_valley_loop') {
      // Misty monsoon rainforest S-curves climbing to high ravine bridges and sweeping valley bends
      return [
        new THREE.Vector3(0, 1.0, 165),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(-42, 2.6, -155),
        new THREE.Vector3(65, 5.5, -295),
        new THREE.Vector3(225, 14.5, -365),
        new THREE.Vector3(375, 15.0, -255),
        new THREE.Vector3(305, 6.5, -115),
        new THREE.Vector3(445, 4.0, 25),
        new THREE.Vector3(385, 13.5, 185),
        new THREE.Vector3(235, 14.0, 315),
        new THREE.Vector3(95, 4.2, 345),
        new THREE.Vector3(-55, 2.0, 285),
        new THREE.Vector3(-115, 1.2, 210),
        new THREE.Vector3(-35, 1.0, 190),
      ];
    }

    // Coastal, Downtown, Port, Ring-Road:
    // Flowing fast straightaway -> banked sweeping S-curves -> elevated suspension bridge -> chicane!
    return [
      new THREE.Vector3(0, 0.25, 165),
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(-22, 0.25, -165),
      new THREE.Vector3(58, 0.25, -335),
      new THREE.Vector3(215, 0.6, -415),
      new THREE.Vector3(345, 2.8, -350),
      new THREE.Vector3(445, 8.5, -245),
      new THREE.Vector3(470, 14.0, -110),
      new THREE.Vector3(445, 13.5, 55),
      new THREE.Vector3(350, 4.2, 200),
      new THREE.Vector3(245, 0.35, 195),
      new THREE.Vector3(215, 0.25, 340),
      new THREE.Vector3(65, 0.25, 375),
      new THREE.Vector3(-75, 0.25, 310),
      new THREE.Vector3(-125, 0.25, 225),
      new THREE.Vector3(-48, 0.25, 195),
    ];
  }

  private trackDisposable<T extends { dispose: () => void }>(d: T): T {
    this.disposables.push(d);
    return d;
  }

  private buildRoadSurface(): void {
    const N = this.sampleCount;
    const hw = this.roadHalfWidth;
    const endIdx = this.isOpenLoop ? N - 1 : N;
    const positions = new Float32Array((endIdx + 1) * 2 * 3);
    const normals = new Float32Array((endIdx + 1) * 2 * 3);
    const uvs = new Float32Array((endIdx + 1) * 2 * 2);
    const indices: number[] = [];

    const tileRepeat = Math.round(this.totalLength / 18);

    for (let i = 0; i <= endIdx; i++) {
      const s = this.samples[i % N];
      const vCoord = (i / N) * tileRepeat;

      const lx = s.pos.x - s.right.x * hw;
      const ly = s.pos.y - s.right.y * hw;
      const lz = s.pos.z - s.right.z * hw;

      const rx = s.pos.x + s.right.x * hw;
      const ry = s.pos.y + s.right.y * hw;
      const rz = s.pos.z + s.right.z * hw;

      const idx3 = i * 6;
      positions[idx3] = lx;
      positions[idx3 + 1] = ly;
      positions[idx3 + 2] = lz;
      positions[idx3 + 3] = rx;
      positions[idx3 + 4] = ry;
      positions[idx3 + 5] = rz;

      normals[idx3] = s.up.x;
      normals[idx3 + 1] = s.up.y;
      normals[idx3 + 2] = s.up.z;
      normals[idx3 + 3] = s.up.x;
      normals[idx3 + 4] = s.up.y;
      normals[idx3 + 5] = s.up.z;

      const idx2 = i * 4;
      uvs[idx2] = 0;
      uvs[idx2 + 1] = vCoord;
      uvs[idx2 + 2] = 1;
      uvs[idx2 + 3] = vCoord;

      if (i < endIdx) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    }

    const roadGeo = this.trackDisposable(new THREE.BufferGeometry());
    roadGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    roadGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeBoundingSphere();

    const isWet =
      this.style === 'cyberpunk_rain' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'lahore_midnight_gp' ||
      this.style === 'emerald_valley_loop';
    const roadMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: this.roadMap,
        roughnessMap: this.roadRough,
        normalMap: this.roadNorm,
        normalScale: new THREE.Vector2(isWet ? 0.16 : 0.35, isWet ? 0.16 : 0.35),
        roughness: isWet ? 0.22 : 0.72,
        metalness: isWet ? 0.42 : 0.14,
        envMapIntensity: isWet ? 2.1 : 1.25,
      }),
    );
    this.roadMat = roadMat;

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // Underside deck slab with UVs for concrete PBR paneling
    const deckPos = new Float32Array((endIdx + 1) * 4 * 3);
    const deckUv = new Float32Array((endIdx + 1) * 4 * 2);
    const deckIdx: number[] = [];
    for (let i = 0; i <= endIdx; i++) {
      const s = this.samples[i % N];
      const base = i * 12;
      const w = hw + 0.55;
      deckPos[base] = s.pos.x - s.right.x * w;
      deckPos[base + 1] = s.pos.y - 0.04;
      deckPos[base + 2] = s.pos.z - s.right.z * w;
      deckPos[base + 3] = s.pos.x + s.right.x * w;
      deckPos[base + 4] = s.pos.y - 0.04;
      deckPos[base + 5] = s.pos.z + s.right.z * w;
      deckPos[base + 6] = s.pos.x - s.right.x * (w - 0.2);
      deckPos[base + 7] = s.pos.y - 1.3;
      deckPos[base + 8] = s.pos.z - s.right.z * (w - 0.2);
      deckPos[base + 9] = s.pos.x + s.right.x * (w - 0.2);
      deckPos[base + 10] = s.pos.y - 1.3;
      deckPos[base + 11] = s.pos.z + s.right.z * (w - 0.2);

      const vCoord = (i / N) * tileRepeat;
      const uBase = i * 8;
      deckUv[uBase] = 0;
      deckUv[uBase + 1] = vCoord;
      deckUv[uBase + 2] = 1;
      deckUv[uBase + 3] = vCoord;
      deckUv[uBase + 4] = 0.25;
      deckUv[uBase + 5] = vCoord;
      deckUv[uBase + 6] = 0.75;
      deckUv[uBase + 7] = vCoord;

      if (i < endIdx) {
        const o = i * 4;
        const n = o + 4;
        deckIdx.push(o, o + 2, n, n, o + 2, n + 2);
        deckIdx.push(o + 1, n + 1, o + 3, o + 3, n + 1, n + 3);
        deckIdx.push(o + 2, o + 3, n + 2, n + 2, o + 3, n + 3);
      }
    }

    const deckGeo = this.trackDisposable(new THREE.BufferGeometry());
    deckGeo.setAttribute('position', new THREE.BufferAttribute(deckPos, 3));
    deckGeo.setAttribute('uv', new THREE.BufferAttribute(deckUv, 2));
    deckGeo.setIndex(deckIdx);
    deckGeo.computeVertexNormals();

    const deckMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color:
          this.style === 'desert_canyon' ||
          this.style === 'desert_canyon_highway' ||
          this.style === 'cholistan_mirage_highway'
            ? 0x7c4a2d
            : this.style === 'karakorum_sky_pass'
              ? 0x564e49
              : this.style === 'emerald_valley_loop'
                ? 0x354d45
                : 0x4b5566,
        map: this.concretePbr.map,
        roughnessMap: this.concretePbr.roughnessMap,
        normalMap: this.concretePbr.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.84,
        metalness: 0.14,
      }),
    );
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.receiveShadow = true;
    this.group.add(deckMesh);
  }

  private buildGuardrails(): void {
    const N = this.sampleCount;
    const railOffset = this.roadHalfWidth + 0.35;

    const railGeo = this.trackDisposable(new THREE.BoxGeometry(0.18, 0.42, 4.1));
    const railMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color:
          this.style === 'desert_canyon' ||
          this.style === 'desert_canyon_highway' ||
          this.style === 'cholistan_mirage_highway'
            ? 0xd97706
            : 0xd1dae8,
        metalness: 0.84,
        roughness: 0.28,
        envMapIntensity: 1.5,
      }),
    );

    const postGeo = this.trackDisposable(new THREE.BoxGeometry(0.18, 0.95, 0.18));
    const postMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x3b4459,
        metalness: 0.72,
        roughness: 0.42,
        envMapIntensity: 1.25,
      }),
    );

    const refCol =
      this.style === 'cyberpunk_rain' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'gwadar_port_docks'
        ? 0x00f5d4
        : this.style === 'lahore_midnight_gp' || this.style === 'emerald_valley_loop'
          ? 0x34d399
          : this.style === 'mountain_touge' ||
              this.style === 'mountain_hairpin_pass' ||
              this.style === 'karakorum_sky_pass'
            ? 0xfacc15
            : this.style === 'desert_canyon_highway' || this.style === 'cholistan_mirage_highway'
              ? 0xfb923c
              : 0xff3b5c;

    const reflectorGeo = this.trackDisposable(new THREE.BoxGeometry(0.08, 0.14, 0.32));
    const reflectorMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: refCol,
        emissive: refCol,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      }),
    );

    const step = 2;
    const countPerSide = Math.floor(N / step);
    const totalRails = countPerSide * 2;

    const railsInst = new THREE.InstancedMesh(railGeo, railMat, totalRails);
    const postsInst = new THREE.InstancedMesh(postGeo, postMat, totalRails);
    const refInst = new THREE.InstancedMesh(reflectorGeo, reflectorMat, totalRails);

    const dummy = new THREE.Object3D();
    const lookTarget = new THREE.Vector3();
    let idx = 0;

    for (let i = 0; i < countPerSide; i++) {
      const s = this.samples[(i * step) % N];
      for (const side of [-1, 1]) {
        const px = s.pos.x + s.right.x * railOffset * side;
        const py = s.pos.y + 0.58;
        const pz = s.pos.z + s.right.z * railOffset * side;

        dummy.position.set(px, py, pz);
        lookTarget.set(px + s.tangent.x, py + s.tangent.y, pz + s.tangent.z);
        dummy.lookAt(lookTarget);
        dummy.scale.set(1, 1, 1.9);
        dummy.updateMatrix();
        railsInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(px, s.pos.y + 0.42, pz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postsInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(
          px - s.right.x * 0.11 * side,
          s.pos.y + 0.62,
          pz - s.right.z * 0.11 * side,
        );
        dummy.updateMatrix();
        refInst.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }

    railsInst.computeBoundingSphere();
    postsInst.computeBoundingSphere();
    refInst.computeBoundingSphere();
    this.group.add(railsInst, postsInst, refInst);
  }

  private buildApexCurbsAndTurnSigns(maxAnisotropy: number): void {
    if (this.isOpenLoop) return;

    // 1. Striped Apex Curbs along curved inner shoulders
    const curbGeo = this.trackDisposable(new THREE.BoxGeometry(0.95, 0.14, 3.6));
    const curbRedMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.55, metalness: 0.1 }),
    );
    const curbWhiteMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, metalness: 0.1 }),
    );

    const redCurbs: THREE.Matrix4[] = [];
    const whiteCurbs: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();
    const lookTarget = new THREE.Vector3();

    for (let i = 0; i < this.sampleCount; i += 2) {
      const s = this.samples[i];
      if (Math.abs(s.curvature) < 0.022) continue;
      const side = s.curvature > 0 ? 1 : -1;
      const offset = this.roadHalfWidth - 0.35;
      const px = s.pos.x + s.right.x * offset * side;
      const py = s.pos.y + s.right.y * offset * side + 0.04;
      const pz = s.pos.z + s.right.z * offset * side;

      dummy.position.set(px, py, pz);
      lookTarget.set(px + s.tangent.x, py + s.tangent.y, pz + s.tangent.z);
      dummy.lookAt(lookTarget);
      dummy.rotateZ(s.bankAngle);
      dummy.updateMatrix();
      if ((i / 2) % 2 === 0) redCurbs.push(dummy.matrix.clone());
      else whiteCurbs.push(dummy.matrix.clone());
    }

    if (redCurbs.length > 0) {
      const rInst = new THREE.InstancedMesh(curbGeo, curbRedMat, redCurbs.length);
      redCurbs.forEach((m, idx) => rInst.setMatrixAt(idx, m));
      rInst.computeBoundingSphere();
      this.group.add(rInst);
    }
    if (whiteCurbs.length > 0) {
      const wInst = new THREE.InstancedMesh(curbGeo, curbWhiteMat, whiteCurbs.length);
      whiteCurbs.forEach((m, idx) => wInst.setMatrixAt(idx, m));
      wInst.computeBoundingSphere();
      this.group.add(wInst);
    }

    // 2. Glowing Turn-Warning Chevron Signs on outer corner approaches
    const leftTex = this.trackDisposable(createTurnChevronTexture('LEFT', maxAnisotropy));
    const rightTex = this.trackDisposable(createTurnChevronTexture('RIGHT', maxAnisotropy));
    const leftMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: leftTex,
        emissiveMap: leftTex,
        emissive: 0xffffff,
        emissiveIntensity: 1.5,
      }),
    );
    const rightMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: rightTex,
        emissiveMap: rightTex,
        emissive: 0xffffff,
        emissiveIntensity: 1.5,
      }),
    );
    const signGeo = this.trackDisposable(new THREE.BoxGeometry(3.2, 1.6, 0.16));
    const postGeo = this.trackDisposable(new THREE.CylinderGeometry(0.1, 0.12, 3.0, 6));
    const postMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 }),
    );

    let lastSignIdx = -30;
    for (let i = 10; i < this.sampleCount - 10; i += 6) {
      if (i - lastSignIdx < 18) continue;
      const s = this.samples[i];
      if (Math.abs(s.curvature) < 0.036) continue;
      lastSignIdx = i;

      const isRightTurn = s.curvature > 0;
      const outerSide = isRightTurn ? -1 : 1;
      const grp = new THREE.Group();
      const distOut = this.roadHalfWidth + 1.85;
      grp.position.set(
        s.pos.x + s.right.x * distOut * outerSide,
        s.pos.y,
        s.pos.z + s.right.z * distOut * outerSide,
      );
      grp.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z) + outerSide * 0.35;

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 1.5;
      const board = new THREE.Mesh(signGeo, isRightTurn ? rightMat : leftMat);
      board.position.y = 2.6;
      grp.add(post, board);
      this.group.add(grp);
    }
  }

  private buildAbdullahCheemaBillboards(): void {
    // Place large illuminated ABDULLAH CHEEMA photo billboards every 100 meters!
    const stepMeters = 100;
    const count = Math.max(4, Math.floor(this.totalLength / stepMeters));

    const steelMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 }),
    );
    const goldTrimMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.35,
        roughness: 0.25,
      }),
    );

    const frameGeo = this.trackDisposable(new THREE.BoxGeometry(13.6, 6.9, 0.42));
    const faceGeo = this.trackDisposable(new THREE.PlaneGeometry(13.1, 6.45));
    const poleGeo = this.trackDisposable(new THREE.CylinderGeometry(0.32, 0.42, 8.6, 8));
    const gantryPillarGeo = this.trackDisposable(new THREE.CylinderGeometry(0.28, 0.36, 12.2, 8));
    const lightBarGeo = this.trackDisposable(new THREE.BoxGeometry(11.4, 0.22, 0.32));

    for (let k = 0; k < count; k++) {
      const distM = k * stepMeters + (this.isOpenLoop ? 75 : 22);
      if (distM >= this.totalLength - 35) continue;
      const t = distM / this.totalLength;
      const sIdx = Math.floor(t * this.sampleCount) % this.sampleCount;
      const s = this.samples[sIdx];

      const grp = new THREE.Group();
      const yaw = Math.atan2(-s.tangent.x, -s.tangent.z);
      const isOverheadArch = !s.isBridge && k % 3 === 1;

      if (isOverheadArch) {
        // Overhead Expressway Gantry Billboard centered cleanly above the road
        grp.position.copy(s.pos);
        grp.rotation.y = yaw;

        const legOffset = this.roadHalfWidth + 1.5;
        const pL = new THREE.Mesh(gantryPillarGeo, steelMat);
        pL.position.set(-legOffset, 6.1, 0);
        const pR = new THREE.Mesh(gantryPillarGeo, steelMat);
        pR.position.set(legOffset, 6.1, 0);

        const cabinet = new THREE.Mesh(frameGeo, steelMat);
        cabinet.position.set(0, 10.6, 0);

        const frontFace = new THREE.Mesh(faceGeo, this.billboardMat);
        frontFace.position.set(0, 10.6, 0.23);

        const backFace = new THREE.Mesh(faceGeo, this.billboardMat);
        backFace.position.set(0, 10.6, -0.23);
        backFace.rotation.y = Math.PI;

        const trimBar = new THREE.Mesh(lightBarGeo, goldTrimMat);
        trimBar.position.set(0, 14.15, 0);

        grp.add(pL, pR, cabinet, frontFace, backFace, trimBar);
      } else {
        // Cantilever Roadside Billboard angled cleanly toward oncoming drivers
        const side = k % 2 === 0 ? -1 : 1;
        const lateralDist = this.roadHalfWidth + (s.isBridge ? 5.2 : 6.4);
        grp.position.set(
          s.pos.x + s.right.x * lateralDist * side,
          s.pos.y,
          s.pos.z + s.right.z * lateralDist * side,
        );
        grp.rotation.y = yaw + side * 0.28;

        const pole = new THREE.Mesh(poleGeo, steelMat);
        pole.position.set(side * 2.2, 4.3, 0);

        const cabinet = new THREE.Mesh(frameGeo, steelMat);
        cabinet.position.set(0, 8.2, 0);

        const frontFace = new THREE.Mesh(faceGeo, this.billboardMat);
        frontFace.position.set(0, 8.2, 0.23);

        const backFace = new THREE.Mesh(faceGeo, this.billboardMat);
        backFace.position.set(0, 8.2, -0.23);
        backFace.rotation.y = Math.PI;

        const trimBar = new THREE.Mesh(lightBarGeo, goldTrimMat);
        trimBar.position.set(0, 11.75, 0);

        grp.add(pole, cabinet, frontFace, backFace, trimBar);
      }

      this.group.add(grp);
    }
  }

  private buildEnvironmentTerrain(): void {
    const baseGeo = this.trackDisposable(new THREE.PlaneGeometry(5400, 5400));
    baseGeo.rotateX(-Math.PI / 2);

    let groundColor = 0x0a2540;
    let groundRough = 0.2;
    let groundMetal = 0.65;

    if (
      this.style === 'desert_canyon' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'desert_canyon_highway' ||
      this.style === 'cholistan_mirage_highway'
    ) {
      groundColor =
        this.style === 'zigzag_serpentine'
          ? 0x6e2814
          : this.style === 'cholistan_mirage_highway'
            ? 0xb45309
            : this.style === 'desert_canyon_highway'
              ? 0x94411e
              : 0xa14924;
      groundRough = 0.94;
      groundMetal = 0.04;
    } else if (this.style === 'drag_strip') {
      groundColor = 0xd6c3a5;
      groundRough = 0.88;
      groundMetal = 0.05;
    } else if (this.style === 'alpine_gp' || this.style === 'mountain_hairpin_pass') {
      groundColor = this.style === 'mountain_hairpin_pass' ? 0x1e4a38 : 0x2d5e3b;
      groundRough = 0.9;
      groundMetal = 0.04;
    } else if (this.style === 'karakorum_sky_pass') {
      groundColor = 0x36312d;
      groundRough = 0.94;
      groundMetal = 0.05;
    } else if (this.style === 'mountain_touge' || this.style === 'emerald_valley_loop') {
      groundColor = this.style === 'emerald_valley_loop' ? 0x0d382a : 0x162b22;
      groundRough = 0.9;
      groundMetal = 0.05;
    } else if (
      this.style === 'industrial_port' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'gwadar_port_docks'
    ) {
      groundColor =
        this.style === 'midnight_harbor_circuit'
          ? 0x061529
          : this.style === 'gwadar_port_docks'
            ? 0x081b2e
            : 0x111a28;
      groundRough = 0.22;
      groundMetal = 0.65;
    } else if (this.style === 'gt_highway') {
      groundColor = 0x1b3322;
      groundRough = 0.92;
      groundMetal = 0.04;
    } else if (this.style === 'wavy_coaster') {
      groundColor = 0x072447;
      groundRough = 0.18;
      groundMetal = 0.68;
    } else if (
      this.style === 'cyberpunk_rain' ||
      this.style === 'downtown_tunnels' ||
      this.style === 'lahore_midnight_gp'
    ) {
      groundColor = this.style === 'lahore_midnight_gp' ? 0x0b121c : 0x0c111e;
      groundRough = 0.18;
      groundMetal = 0.55;
    }

    const isDesertGround =
      this.style === 'desert_canyon' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'desert_canyon_highway' ||
      this.style === 'cholistan_mirage_highway' ||
      this.style === 'drag_strip';
    const isNaturalRockOrAlpine =
      this.style === 'alpine_gp' ||
      this.style === 'mountain_hairpin_pass' ||
      this.style === 'karakorum_sky_pass' ||
      this.style === 'mountain_touge' ||
      this.style === 'emerald_valley_loop' ||
      this.style === 'gt_highway';

    const groundPbr = isDesertGround
      ? this.clonePbrWithRepeat(this.sandPbr, 58, 58)
      : isNaturalRockOrAlpine
        ? this.clonePbrWithRepeat(this.rockPbr, 54, 54)
        : null;

    const baseMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: groundColor,
        map: groundPbr?.map ?? null,
        roughnessMap: groundPbr?.roughnessMap ?? null,
        normalMap: groundPbr?.normalMap ?? null,
        normalScale: new THREE.Vector2(groundPbr ? 0.45 : 0.0, groundPbr ? 0.45 : 0.0),
        roughness: groundRough,
        metalness: groundMetal,
        envMapIntensity: groundPbr ? 0.9 : 1.45,
      }),
    );
    const ground = new THREE.Mesh(baseGeo, baseMat);
    ground.position.set(160, -1.6, 0);
    ground.receiveShadow = true;
    this.group.add(ground);

    // Coastal / Port landmass island where applicable
    if (
      this.style === 'coastal' ||
      this.style === 'industrial_port' ||
      this.style === 'ring_road' ||
      this.style === 'cyberpunk_rain' ||
      this.style === 'wavy_coaster' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'gwadar_port_docks'
    ) {
      const islandShape = new THREE.Shape();
      islandShape.moveTo(-280, -480);
      islandShape.lineTo(310, -480);
      islandShape.quadraticCurveTo(360, -320, 320, -230);
      islandShape.quadraticCurveTo(220, -140, 220, -10);
      islandShape.quadraticCurveTo(240, 140, 340, 260);
      islandShape.lineTo(310, 480);
      islandShape.lineTo(-280, 480);
      islandShape.closePath();

      const landGeo = this.trackDisposable(
        new THREE.ExtrudeGeometry(islandShape, { depth: 2.2, bevelEnabled: false }),
      );
      landGeo.rotateX(Math.PI / 2);
      const landPbr = this.clonePbrWithRepeat(this.concretePbr, 0.055, 0.055);
      const landMat = this.trackDisposable(
        new THREE.MeshStandardMaterial({
          color:
            this.style === 'industrial_port' ||
            this.style === 'midnight_harbor_circuit' ||
            this.style === 'gwadar_port_docks'
              ? 0x414854
              : 0x323f54,
          map: landPbr.map,
          roughnessMap: landPbr.roughnessMap,
          normalMap: landPbr.normalMap,
          normalScale: new THREE.Vector2(0.4, 0.4),
          roughness: 0.88,
          metalness: 0.08,
        }),
      );
      const land = new THREE.Mesh(landGeo, landMat);
      land.position.y = -0.35;
      land.receiveShadow = true;
      this.group.add(land);
    }

    // Horizon Mountains / Mesas / Alpine Peaks
    const mountainGeo = this.trackDisposable(new THREE.ConeGeometry(165, 155, 9));
    const mountainColor =
      this.style === 'desert_canyon' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'desert_canyon_highway' ||
      this.style === 'cholistan_mirage_highway'
        ? 0xa14922
        : this.style === 'karakorum_sky_pass'
          ? 0x7b6d62
          : this.style === 'alpine_gp' || this.style === 'mountain_hairpin_pass'
            ? 0x64748b
            : this.style === 'mountain_touge' || this.style === 'emerald_valley_loop'
              ? 0x205241
              : 0x24304a;
    const mountainPbr = this.clonePbrWithRepeat(this.rockPbr, 3, 2);
    const mountainMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: mountainColor,
        map: mountainPbr.map,
        roughnessMap: mountainPbr.roughnessMap,
        normalMap: mountainPbr.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.94,
        metalness: 0.04,
      }),
    );
    const mCoords = [
      [-650, -780, 1.4],
      [-320, -920, 1.8],
      [180, -960, 1.3],
      [-820, -250, 1.6],
      [-780, 480, 1.5],
      [-320, 820, 1.3],
      [780, -640, 1.5],
      [820, 420, 1.4],
    ];
    for (const [mx, mz, ms] of mCoords) {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(mx, 45 * ms - 12, mz);
      m.scale.set(ms * 1.4, ms, ms);
      m.rotation.y = mx * 0.01;
      this.group.add(m);
    }
  }

  private buildEnvironmentLandmarks(maxAnisotropy: number): void {
    // Suspension Bridge Towers for the main bridge-span circuits
    if (
      this.style === 'coastal' ||
      this.style === 'downtown_tunnels' ||
      this.style === 'industrial_port' ||
      this.style === 'ring_road' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'gwadar_port_docks' ||
      this.style === 'emerald_valley_loop'
    ) {
      this.buildBridgeStructures();
    }

    if (
      this.style === 'wavy_coaster' ||
      this.style === 'gt_highway' ||
      this.style === 'cyberpunk_rain' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'mountain_hairpin_pass' ||
      this.style === 'karakorum_sky_pass' ||
      this.style === 'lahore_midnight_gp'
    ) {
      this.buildViaductPiers();
    }

    if (
      this.style === 'coastal' ||
      this.style === 'gt_highway' ||
      this.style === 'wavy_coaster' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'lahore_midnight_gp'
    ) {
      this.buildPalmTrees();
    }

    if (
      this.style === 'mountain_touge' ||
      this.style === 'alpine_gp' ||
      this.style === 'mountain_hairpin_pass' ||
      this.style === 'karakorum_sky_pass' ||
      this.style === 'emerald_valley_loop'
    ) {
      this.buildPineForest();
    }

    if (
      this.style === 'mountain_touge' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'mountain_hairpin_pass' ||
      this.style === 'karakorum_sky_pass'
    ) {
      this.buildHairpinApexMarkers();
    }

    if (
      this.style === 'desert_canyon' ||
      this.style === 'zigzag_serpentine' ||
      this.style === 'desert_canyon_highway' ||
      this.style === 'cholistan_mirage_highway'
    ) {
      this.buildDesertMesasAndArches();
    }

    if (this.style === 'cholistan_mirage_highway') {
      this.buildDesertDunes();
    }

    if (this.style === 'karakorum_sky_pass') {
      this.buildRockTunnelsAndCliffs();
    }

    if (this.style === 'lahore_midnight_gp') {
      this.buildLahoreHeritageArches();
    }

    if (
      this.style === 'industrial_port' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'gwadar_port_docks'
    ) {
      this.buildPortContainersAndCranes();
    }

    if (this.style === 'gwadar_port_docks') {
      this.buildHarborSpotlights();
    }

    if (this.style === 'emerald_valley_loop') {
      this.buildEmeraldValleyCliffs();
    }

    if (this.style === 'gt_highway') {
      this.buildDesiDhabas(maxAnisotropy);
    }

    if (
      this.style === 'coastal' ||
      this.style === 'downtown_tunnels' ||
      this.style === 'cyberpunk_rain' ||
      this.style === 'ring_road' ||
      this.style === 'wavy_coaster' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'lahore_midnight_gp'
    ) {
      this.buildCitySkyline(maxAnisotropy);
    }

    if (
      this.style === 'cyberpunk_rain' ||
      this.style === 'midnight_harbor_circuit' ||
      this.style === 'lahore_midnight_gp'
    ) {
      this.buildNeonBillboards(maxAnisotropy);
    }
  }

  private buildRockTunnelsAndCliffs(): void {
    // Rugged carved granite rock tunnels & towering golden-hour alpine cliff walls
    const tunnelRockPbr = this.clonePbrWithRepeat(this.rockPbr, 2, 2);
    const rockMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x7b6d63,
        map: tunnelRockPbr.map,
        roughnessMap: tunnelRockPbr.roughnessMap,
        normalMap: tunnelRockPbr.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.92,
        metalness: 0.06,
        side: THREE.DoubleSide,
      }),
    );
    const lanternMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.8,
      }),
    );

    const tunnelGeo = this.trackDisposable(
      new THREE.CylinderGeometry(
        this.roadHalfWidth + 1.8,
        this.roadHalfWidth + 2.2,
        10.0,
        11,
        1,
        true,
        0,
        Math.PI,
      ),
    );
    tunnelGeo.rotateZ(Math.PI / 2);
    tunnelGeo.rotateY(Math.PI / 2);

    const lanternGeo = this.trackDisposable(new THREE.BoxGeometry(0.32, 0.28, 4.6));

    for (const startT of [0.14, 0.64]) {
      const baseIdx = Math.floor(startT * this.sampleCount);
      for (let k = 0; k < 10; k++) {
        const s = this.samples[(baseIdx + k * 2) % this.sampleCount];
        const seg = new THREE.Group();
        seg.position.copy(s.pos);
        seg.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

        const rockShell = new THREE.Mesh(tunnelGeo, rockMat);
        seg.add(rockShell);

        const lL = new THREE.Mesh(lanternGeo, lanternMat);
        lL.position.set(-4.5, this.roadHalfWidth - 0.6, 0);
        const lR = new THREE.Mesh(lanternGeo, lanternMat);
        lR.position.set(4.5, this.roadHalfWidth - 0.6, 0);
        seg.add(lL, lR);
        this.group.add(seg);
      }
    }

    // Alpine cliff faces along outer mountain ridges
    const cliffGeo = this.trackDisposable(new THREE.DodecahedronGeometry(16, 1));
    const cliffMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x8d7b6f,
        map: tunnelRockPbr.map,
        roughnessMap: tunnelRockPbr.roughnessMap,
        normalMap: tunnelRockPbr.normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.94,
        metalness: 0.04,
      }),
    );
    for (let i = 16; i < this.sampleCount; i += 24) {
      const s = this.samples[i];
      const side = i % 48 === 16 ? -1 : 1;
      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.set(
        s.pos.x + s.right.x * 28 * side,
        s.pos.y + 8,
        s.pos.z + s.right.z * 28 * side,
      );
      cliff.scale.set(1.2, 1.9 + (i % 3) * 0.4, 1.5);
      cliff.rotation.set(0.2, i * 0.4, 0.1);
      cliff.receiveShadow = true;
      this.group.add(cliff);
    }
  }

  private buildDesertDunes(): void {
    // Rolling golden-orange Cholistan sand dunes flanking the wide desert highway
    const duneGeo = this.trackDisposable(new THREE.SphereGeometry(48, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5));
    const dunePbr = this.clonePbrWithRepeat(this.sandPbr, 4, 2);
    const duneMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xeb9b46,
        map: dunePbr.map,
        roughnessMap: dunePbr.roughnessMap,
        normalMap: dunePbr.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.93,
        metalness: 0.02,
      }),
    );
    for (let i = 10; i < this.sampleCount; i += 28) {
      const s = this.samples[i];
      for (const side of [-1, 1]) {
        const dist = 62 + ((i * 11) % 45);
        const dune = new THREE.Mesh(duneGeo, duneMat);
        dune.position.set(
          s.pos.x + s.right.x * dist * side,
          -4.5,
          s.pos.z + s.right.z * dist * side,
        );
        dune.scale.set(1.8, 0.42 + ((i + side) % 3) * 0.14, 1.2);
        dune.rotation.y = i * 0.5;
        dune.receiveShadow = true;
        this.group.add(dune);
      }
    }
  }

  private buildLahoreHeritageArches(): void {
    // Illuminated Mughal-inspired sandstone & emerald-gold heritage arches spanning Lahore's midnight boulevards
    const stoneMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.72, metalness: 0.18 }),
    );
    const goldMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.9,
        roughness: 0.25,
      }),
    );
    const emeraldMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      }),
    );

    const pillarGeo = this.trackDisposable(new THREE.BoxGeometry(2.6, 13.5, 2.8));
    const domeGeo = this.trackDisposable(new THREE.ConeGeometry(1.7, 3.2, 8));
    const spanGeo = this.trackDisposable(new THREE.BoxGeometry(this.roadHalfWidth * 2 + 5.6, 2.6, 2.4));
    const stripGeo = this.trackDisposable(new THREE.BoxGeometry(this.roadHalfWidth * 2 + 4.4, 0.28, 2.55));
    const archTrimGeo = this.trackDisposable(
      new THREE.TorusGeometry(this.roadHalfWidth + 0.8, 0.34, 8, 20, Math.PI),
    );

    for (const tVal of [0.14, 0.44, 0.74]) {
      const s = this.samples[Math.floor(tVal * this.sampleCount) % this.sampleCount];
      if (s.isBridge) continue;
      const archGrp = new THREE.Group();
      archGrp.position.copy(s.pos);
      archGrp.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

      const px = this.roadHalfWidth + 1.9;
      const pL = new THREE.Mesh(pillarGeo, stoneMat);
      pL.position.set(-px, 6.75, 0);
      const pR = new THREE.Mesh(pillarGeo, stoneMat);
      pR.position.set(px, 6.75, 0);

      const dL = new THREE.Mesh(domeGeo, goldMat);
      dL.position.set(-px, 15.0, 0);
      const dR = new THREE.Mesh(domeGeo, goldMat);
      dR.position.set(px, 15.0, 0);

      const topSpan = new THREE.Mesh(spanGeo, stoneMat);
      topSpan.position.set(0, 12.6, 0);
      const goldTrim = new THREE.Mesh(stripGeo, goldMat);
      goldTrim.position.set(0, 13.9, 0);
      const emeraldArch = new THREE.Mesh(archTrimGeo, emeraldMat);
      emeraldArch.position.set(0, 0.2, 0);

      archGrp.add(pL, pR, dL, dR, topSpan, goldTrim, emeraldArch);
      this.group.add(archGrp);
    }
  }

  private buildHarborSpotlights(): void {
    // Tall shipyard floodlight towers casting crisp cyan/amber harbor beams
    const towerGeo = this.trackDisposable(new THREE.CylinderGeometry(0.28, 0.48, 24, 8));
    const towerMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 }),
    );
    const headGeo = this.trackDisposable(new THREE.BoxGeometry(3.2, 1.1, 0.8));
    const bulbMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x38bdf8,
        emissiveIntensity: 3.4,
      }),
    );
    const beamGeo = this.trackDisposable(new THREE.ConeGeometry(8.5, 25, 12, 1, true));
    const beamMat = this.trackDisposable(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );

    for (let i = 20; i < this.sampleCount; i += 64) {
      const s = this.samples[i];
      if (s.isBridge) continue;
      const side = i % 128 === 20 ? -1 : 1;
      const grp = new THREE.Group();
      grp.position.set(
        s.pos.x + s.right.x * (this.roadHalfWidth + 13) * side,
        s.pos.y,
        s.pos.z + s.right.z * (this.roadHalfWidth + 13) * side,
      );
      grp.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

      const mast = new THREE.Mesh(towerGeo, towerMat);
      mast.position.y = 12;
      const head = new THREE.Mesh(headGeo, bulbMat);
      head.position.set(-side * 0.8, 24, 0);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(-side * 6.0, 12.2, 0);
      beam.rotation.z = side * 0.42;

      grp.add(mast, head, beam);
      this.group.add(grp);
    }
  }

  private buildEmeraldValleyCliffs(): void {
    // Mossy lush rainforest cliffs flanking the monsoon valley & ravines
    const cliffGeo = this.trackDisposable(new THREE.ConeGeometry(24, 42, 8));
    const valleyPbr = this.clonePbrWithRepeat(this.rockPbr, 2, 2);
    const cliffMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x266b52,
        map: valleyPbr.map,
        roughnessMap: valleyPbr.roughnessMap,
        normalMap: valleyPbr.normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.9,
        metalness: 0.04,
      }),
    );
    for (let i = 12; i < this.sampleCount; i += 22) {
      const s = this.samples[i];
      if (s.isBridge) continue;
      const side = i % 44 === 12 ? -1 : 1;
      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.set(
        s.pos.x + s.right.x * (this.roadHalfWidth + 24) * side,
        s.pos.y + 10,
        s.pos.z + s.right.z * (this.roadHalfWidth + 24) * side,
      );
      cliff.scale.set(1.2, 0.8 + (i % 4) * 0.25, 1.3);
      cliff.rotation.y = i * 0.7;
      cliff.receiveShadow = true;
      this.group.add(cliff);
    }
  }

  private buildViaductPiers(): void {
    const pierGeo = this.trackDisposable(new THREE.CylinderGeometry(1.05, 1.45, 20, 12));
    const pierPbr = this.clonePbrWithRepeat(this.concretePbr, 1, 3);
    const pierMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: this.style === 'zigzag_serpentine' ? 0x8a5436 : 0x5c6878,
        map: pierPbr.map,
        roughnessMap: pierPbr.roughnessMap,
        normalMap: pierPbr.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.82,
        metalness: 0.14,
      }),
    );
    const neonCol =
      this.style === 'wavy_coaster'
        ? 0x00f5d4
        : this.style === 'cyberpunk_rain'
          ? 0xe879f9
          : 0xf59e0b;
    const collarGeo = this.trackDisposable(new THREE.CylinderGeometry(1.22, 1.22, 0.35, 10));
    const collarMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: neonCol,
        emissive: neonCol,
        emissiveIntensity: 1.6,
        roughness: 0.25,
      }),
    );

    for (let i = 0; i < this.sampleCount; i += 20) {
      const s = this.samples[i];
      if (s.pos.y <= 2.4) continue;
      for (const side of [-6.0, 6.0]) {
        const px = s.pos.x + s.right.x * side;
        const pz = s.pos.z + s.right.z * side;
        const pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(px, s.pos.y - 11.2, pz);
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.set(px, s.pos.y - 1.5, pz);
        this.group.add(pier, collar);
      }
    }
  }

  private buildBridgeStructures(): void {
    const towerSamples = [Math.floor(this.sampleCount * 0.41), Math.floor(this.sampleCount * 0.50)];
    const towerPbr = this.clonePbrWithRepeat(this.concretePbr, 1, 3);
    const towerMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xe6edf8,
        map: towerPbr.map,
        roughnessMap: towerPbr.roughnessMap,
        normalMap: towerPbr.normalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        metalness: 0.58,
        roughness: 0.34,
      }),
    );
    const neonCol =
      this.style === 'cyberpunk_rain'
        ? 0xe879f9
        : this.style === 'ring_road'
          ? 0x3b82f6
          : 0x00f0ff;
    const neonTrimMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: neonCol,
        emissive: neonCol,
        emissiveIntensity: 2.8,
        roughness: 0.2,
      }),
    );
    const cableMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x8ea4c8, metalness: 0.85, roughness: 0.25 }),
    );

    const pylonGeo = this.trackDisposable(new THREE.BoxGeometry(1.7, 36, 2.2));
    const crossGeo = this.trackDisposable(new THREE.BoxGeometry(24, 1.6, 1.8));
    const neonGeo = this.trackDisposable(new THREE.BoxGeometry(0.35, 32, 0.35));

    for (const sIdx of towerSamples) {
      const s = this.samples[sIdx];
      const tower = new THREE.Group();
      tower.position.set(s.pos.x, s.pos.y, s.pos.z);
      tower.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

      const leftPylon = new THREE.Mesh(pylonGeo, towerMat);
      leftPylon.position.set(-11.2, 12, 0);
      leftPylon.castShadow = true;
      const rightPylon = new THREE.Mesh(pylonGeo, towerMat);
      rightPylon.position.set(11.2, 12, 0);
      rightPylon.castShadow = true;

      const crossTop = new THREE.Mesh(crossGeo, towerMat);
      crossTop.position.set(0, 27, 0);
      const crossMid = new THREE.Mesh(crossGeo, towerMat);
      crossMid.position.set(0, 14, 0);

      const stripL = new THREE.Mesh(neonGeo, neonTrimMat);
      stripL.position.set(-10.2, 13, 0);
      const stripR = new THREE.Mesh(neonGeo, neonTrimMat);
      stripR.position.set(10.2, 13, 0);

      tower.add(leftPylon, rightPylon, crossTop, crossMid, stripL, stripR);

      for (const side of [-1, 1]) {
        for (const dir of [-1, 1]) {
          for (let c = 1; c <= 4; c++) {
            const pTop = new THREE.Vector3(side * 11.2, 26 - c * 1.4, 0);
            const pDeck = new THREE.Vector3(side * 10.6, 0.5, dir * c * 13);
            const len = pTop.distanceTo(pDeck);
            const cableGeo = this.trackDisposable(new THREE.CylinderGeometry(0.08, 0.08, len, 6));
            const cable = new THREE.Mesh(cableGeo, cableMat);
            cable.position.copy(pTop).add(pDeck).multiplyScalar(0.5);
            cable.quaternion.setFromUnitVectors(
              UP,
              new THREE.Vector3().subVectors(pTop, pDeck).normalize(),
            );
            tower.add(cable);
          }
        }
      }
      this.group.add(tower);
    }

    const pierGeo = this.trackDisposable(new THREE.CylinderGeometry(1.1, 1.5, 22, 12));
    const pierMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x3b4358, roughness: 0.7, metalness: 0.2 }),
    );
    for (let i = 0; i < this.sampleCount; i += 24) {
      const s = this.samples[i];
      if (!s.isBridge) continue;
      for (const side of [-6.5, 6.5]) {
        const pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(
          s.pos.x + s.right.x * side,
          s.pos.y - 11.8,
          s.pos.z + s.right.z * side,
        );
        this.group.add(pier);
      }
    }
  }

  private buildPalmTrees(): void {
    const palmPlacements: Array<{ x: number; y: number; z: number; scale: number; rot: number }> = [];
    for (let i = 0; i < this.sampleCount; i += 10) {
      const s = this.samples[i];
      if (s.isBridge) continue;
      for (const side of [-1, 1]) {
        if ((i + (side > 0 ? 3 : 0)) % 20 !== 0 && s.pos.x < 120) continue;
        const dist = this.roadHalfWidth + 4.8 + (i % 3) * 1.6;
        const px = s.pos.x + s.right.x * dist * side;
        const pz = s.pos.z + s.right.z * dist * side;
        if (px > 335 && pz > -240 && pz < 220) continue;
        palmPlacements.push({
          x: px,
          y: s.pos.y - 0.55,
          z: pz,
          scale: 0.85 + ((i * 17) % 30) / 100,
          rot: (i * 1.3 + side) % (Math.PI * 2),
        });
      }
    }

    const count = palmPlacements.length;
    if (count === 0) return;

    const trunkGeo = this.trackDisposable(new THREE.CylinderGeometry(0.18, 0.34, 8.2, 7));
    trunkGeo.translate(0, 4.1, 0);
    const trunkMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x8a644b,
        map: this.barkPbr.map,
        roughnessMap: this.barkPbr.roughnessMap,
        normalMap: this.barkPbr.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.9,
        metalness: 0.04,
      }),
    );
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    trunkInst.castShadow = true;

    const frondGeo = this.trackDisposable(new THREE.ConeGeometry(1.1, 4.2, 4));
    frondGeo.scale(0.6, 1, 0.16);
    frondGeo.rotateX(Math.PI * 0.42);
    frondGeo.translate(0, 8.1, 1.9);

    const frondMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x67b87e,
        map: this.foliagePbr.map,
        roughnessMap: this.foliagePbr.roughnessMap,
        normalMap: this.foliagePbr.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.74,
        metalness: 0.06,
      }),
    );
    const frondsInst = new THREE.InstancedMesh(frondGeo, frondMat, count * 6);
    const dummy = new THREE.Object3D();
    const frondColor = new THREE.Color();

    palmPlacements.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0.06, p.rot, 0.04);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      for (let f = 0; f < 6; f++) {
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(0, p.rot + (f * Math.PI * 2) / 6, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        const fIdx = idx * 6 + f;
        frondsInst.setMatrixAt(fIdx, dummy.matrix);
        frondColor.setHSL(0.37 + ((idx + f) % 5) * 0.015, 0.45, 0.45 + (f % 2) * 0.08);
        frondsInst.setColorAt(fIdx, frondColor);
      }
    });

    trunkInst.computeBoundingSphere();
    frondsInst.computeBoundingSphere();
    if (frondsInst.instanceColor) frondsInst.instanceColor.needsUpdate = true;
    this.group.add(trunkInst, frondsInst);
  }

  private buildPineForest(): void {
    const placements: Array<{ x: number; y: number; z: number; scale: number }> = [];
    for (let i = 0; i < this.sampleCount; i += 6) {
      const s = this.samples[i];
      for (const side of [-1, 1]) {
        const dist = this.roadHalfWidth + 5.5 + ((i * 7) % 16);
        placements.push({
          x: s.pos.x + s.right.x * dist * side,
          y: s.pos.y - 0.6,
          z: s.pos.z + s.right.z * dist * side,
          scale: 0.8 + ((i * 13) % 45) / 100,
        });
      }
    }
    const count = placements.length;
    if (count === 0) return;

    const trunkGeo = this.trackDisposable(new THREE.CylinderGeometry(0.28, 0.42, 4.5, 6));
    trunkGeo.translate(0, 2.25, 0);
    const trunkMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x7e5a3e,
        map: this.barkPbr.map,
        roughnessMap: this.barkPbr.roughnessMap,
        normalMap: this.barkPbr.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.92,
      }),
    );
    const coneGeo = this.trackDisposable(new THREE.ConeGeometry(2.8, 10.5, 8));
    coneGeo.translate(0, 8.2, 0);
    const pineMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: this.style === 'alpine_gp' ? 0x5ca874 : 0x4b876e,
        map: this.foliagePbr.map,
        roughnessMap: this.foliagePbr.roughnessMap,
        normalMap: this.foliagePbr.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.85,
      }),
    );

    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    trunkInst.castShadow = true;
    const pineInst = new THREE.InstancedMesh(coneGeo, pineMat, count);
    pineInst.castShadow = true;
    const dummy = new THREE.Object3D();
    const pineColor = new THREE.Color();

    placements.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, idx * 0.7, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);
      pineInst.setMatrixAt(idx, dummy.matrix);
      pineColor.setHSL(0.38 + (idx % 4) * 0.012, 0.32, 0.44 + (idx % 5) * 0.04);
      pineInst.setColorAt(idx, pineColor);
    });

    trunkInst.computeBoundingSphere();
    pineInst.computeBoundingSphere();
    if (pineInst.instanceColor) pineInst.instanceColor.needsUpdate = true;
    this.group.add(trunkInst, pineInst);
  }

  private buildHairpinApexMarkers(): void {
    const markerGeo = this.trackDisposable(new THREE.BoxGeometry(0.3, 1.8, 2.2));
    const markerMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.2,
      }),
    );
    for (let i = 15; i < this.sampleCount - 15; i += 24) {
      const s = this.samples[i];
      const next = this.samples[(i + 6) % this.sampleCount];
      const dot = s.tangent.dot(next.tangent);
      if (dot < 0.94) {
        for (const side of [-1, 1]) {
          const m = new THREE.Mesh(markerGeo, markerMat);
          m.position.set(
            s.pos.x + s.right.x * (this.roadHalfWidth + 1.2) * side,
            s.pos.y + 1.1,
            s.pos.z + s.right.z * (this.roadHalfWidth + 1.2) * side,
          );
          m.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
          this.group.add(m);
        }
      }
    }
  }

  private buildDesertMesasAndArches(): void {
    const mesaPbr = this.clonePbrWithRepeat(this.rockPbr, 3, 2);
    const rockMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xc26c34,
        map: mesaPbr.map,
        roughnessMap: mesaPbr.roughnessMap,
        normalMap: mesaPbr.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.92,
        metalness: 0.04,
      }),
    );
    const mesaGeo = this.trackDisposable(new THREE.CylinderGeometry(18, 28, 36, 9));

    for (let i = 20; i < this.sampleCount; i += 38) {
      const s = this.samples[i];
      const side = i % 76 === 20 ? -1 : 1;
      const mesa = new THREE.Mesh(mesaGeo, rockMat);
      mesa.position.set(
        s.pos.x + s.right.x * 46 * side,
        14,
        s.pos.z + s.right.z * 46 * side,
      );
      mesa.scale.set(1 + (i % 3) * 0.4, 0.7 + (i % 4) * 0.25, 1.2);
      mesa.receiveShadow = true;
      this.group.add(mesa);
    }

    // Iconic red-rock natural canyon arch spanning over the highway!
    const archGeo = this.trackDisposable(new THREE.TorusGeometry(15, 2.8, 7, 16, Math.PI));
    for (const tVal of [0.24, 0.72]) {
      const s = this.samples[Math.floor(tVal * this.sampleCount)];
      const arch = new THREE.Mesh(archGeo, rockMat);
      arch.position.copy(s.pos);
      arch.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
      this.group.add(arch);
    }
  }

  private buildPortContainersAndCranes(): void {
    const cColors = [0xef4444, 0x2563eb, 0xf59e0b, 0x10b981, 0xe2e8f0];
    const boxGeo = this.trackDisposable(new THREE.BoxGeometry(3.2, 2.9, 9.5));
    const cMats = cColors.map((hex) =>
      this.trackDisposable(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.65, metalness: 0.25 })),
    );

    for (let i = 10; i < this.sampleCount; i += 14) {
      const s = this.samples[i];
      if (s.isBridge) continue;
      for (const side of [-1, 1]) {
        const dist = this.roadHalfWidth + 6.5;
        const stacks = 1 + ((i + (side > 0 ? 1 : 0)) % 3);
        for (let lv = 0; lv < stacks; lv++) {
          const mat = cMats[(i + lv + (side > 0 ? 2 : 0)) % cMats.length];
          const box = new THREE.Mesh(boxGeo, mat);
          box.position.set(
            s.pos.x + s.right.x * dist * side,
            s.pos.y + 1.45 + lv * 2.95,
            s.pos.z + s.right.z * dist * side,
          );
          box.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
          this.group.add(box);
        }
      }
    }

    // Towering Cargo Cranes
    const craneMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.55 }),
    );
    const legGeo = this.trackDisposable(new THREE.BoxGeometry(1.8, 38, 1.8));
    const boomGeo = this.trackDisposable(new THREE.BoxGeometry(44, 2.2, 2.2));
    for (const [cx, cz] of [
      [-65, 20],
      [85, -140],
      [180, 260],
      [-95, -240],
    ]) {
      const crane = new THREE.Group();
      crane.position.set(cx, 0, cz);
      const l1 = new THREE.Mesh(legGeo, craneMat);
      l1.position.set(-7, 19, 0);
      const l2 = new THREE.Mesh(legGeo, craneMat);
      l2.position.set(7, 19, 0);
      const boom = new THREE.Mesh(boomGeo, craneMat);
      boom.position.set(6, 36, 0);
      crane.add(l1, l2, boom);
      this.group.add(crane);
    }
  }

  private buildDesiDhabas(maxAnisotropy: number): void {
    const truckArtTex = this.trackDisposable(createTruckArtTexture(maxAnisotropy));
    const dhabaMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: truckArtTex,
        emissiveMap: truckArtTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.45,
        roughness: 0.4,
      }),
    );
    const roofMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6 }),
    );
    const stallGeo = this.trackDisposable(new THREE.BoxGeometry(8, 3.6, 5));
    const canopyGeo = this.trackDisposable(new THREE.BoxGeometry(9.5, 0.35, 6.2));

    for (let i = 16; i < this.sampleCount; i += 44) {
      const s = this.samples[i];
      if (s.isBridge) continue;
      const side = i % 88 === 16 ? -1 : 1;
      const dhaba = new THREE.Group();
      dhaba.position.set(
        s.pos.x + s.right.x * (this.roadHalfWidth + 8.5) * side,
        s.pos.y,
        s.pos.z + s.right.z * (this.roadHalfWidth + 8.5) * side,
      );
      dhaba.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
      const body = new THREE.Mesh(stallGeo, dhabaMat);
      body.position.y = 1.8;
      const roof = new THREE.Mesh(canopyGeo, roofMat);
      roof.position.y = 3.8;
      dhaba.add(body, roof);
      this.group.add(dhaba);
    }
  }

  private buildCitySkyline(maxAnisotropy: number): void {
    const facadeCyan = this.trackDisposable(createBuildingFacadeTexture('#00e5ff', maxAnisotropy));
    const facadePink = this.trackDisposable(createBuildingFacadeTexture('#ff2e88', maxAnisotropy));
    const bGeo = this.trackDisposable(new THREE.BoxGeometry(1, 1, 1));
    bGeo.translate(0, 0.5, 0);

    const matCyan = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: facadeCyan,
        emissiveMap: facadeCyan,
        emissive: 0xffffff,
        emissiveIntensity: this.style === 'cyberpunk_rain' ? 1.25 : 0.85,
        roughness: 0.25,
        metalness: 0.65,
      }),
    );
    const matPink = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: facadePink,
        emissiveMap: facadePink,
        emissive: 0xffffff,
        emissiveIntensity: this.style === 'cyberpunk_rain' ? 1.25 : 0.85,
        roughness: 0.25,
        metalness: 0.65,
      }),
    );

    const buildings = [
      { x: -55, z: 95, w: 28, h: 72, d: 28, pink: false },
      { x: -62, z: 35, w: 32, h: 98, d: 30, pink: true },
      { x: -58, z: -30, w: 26, h: 64, d: 28, pink: false },
      { x: -64, z: -105, w: 34, h: 112, d: 34, pink: true },
      { x: -95, z: -175, w: 36, h: 86, d: 36, pink: false },
      { x: -125, z: 45, w: 40, h: 124, d: 38, pink: false },
      { x: -135, z: -65, w: 36, h: 95, d: 36, pink: true },
      { x: 65, z: 80, w: 26, h: 68, d: 26, pink: true },
      { x: 75, z: 10, w: 30, h: 92, d: 28, pink: false },
      { x: 68, z: -75, w: 28, h: 78, d: 28, pink: true },
      { x: 145, z: 50, w: 34, h: 105, d: 32, pink: false },
      { x: 155, z: -45, w: 30, h: 84, d: 30, pink: true },
      { x: 150, z: 145, w: 32, h: 76, d: 32, pink: false },
      { x: 195, z: 420, w: 34, h: 88, d: 34, pink: true },
      { x: 105, z: 435, w: 38, h: 118, d: 36, pink: false },
      { x: 25, z: 425, w: 30, h: 74, d: 30, pink: true },
      { x: -65, z: 405, w: 36, h: 96, d: 36, pink: false },
      { x: -175, z: 325, w: 32, h: 82, d: 32, pink: true },
      { x: -195, z: 225, w: 34, h: 104, d: 34, pink: false },
      { x: 40, z: 255, w: 24, h: 58, d: 24, pink: true },
    ];

    const cyanList = buildings.filter((b) => !b.pink);
    const pinkList = buildings.filter((b) => b.pink);
    const dummy = new THREE.Object3D();

    const instCyan = new THREE.InstancedMesh(bGeo, matCyan, cyanList.length);
    cyanList.forEach((b, i) => {
      dummy.position.set(b.x, -0.4, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      instCyan.setMatrixAt(i, dummy.matrix);
    });
    instCyan.computeBoundingSphere();

    const instPink = new THREE.InstancedMesh(bGeo, matPink, pinkList.length);
    pinkList.forEach((b, i) => {
      dummy.position.set(b.x, -0.4, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      instPink.setMatrixAt(i, dummy.matrix);
    });
    instPink.computeBoundingSphere();

    this.group.add(instCyan, instPink);
  }

  private buildNeonBillboards(maxAnisotropy: number): void {
    const boards = [
      { t: 0.08, side: -1, title: 'KARACHI NIGHTS', sub: '24/7 MIDNIGHT CLUB', bg: '#3b0764', border: '#e879f9' },
      { t: 0.25, side: 1, title: 'CHEEMA TURBO', sub: 'NITRO + TUNING PRO', bg: '#083344', border: '#22d3ee' },
      { t: 0.62, side: -1, title: 'AKIRA DRIFT', sub: 'WET ASPHALT RUN', bg: '#4c0519', border: '#fb7185' },
      { t: 0.85, side: 1, title: 'HIGH HEAT', sub: 'NEON PURSUIT ZONE', bg: '#1e1b4b', border: '#38bdf8' },
    ];
    const poleGeo = this.trackDisposable(new THREE.CylinderGeometry(0.2, 0.25, 9, 8));
    const poleMat = this.trackDisposable(new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    const boardGeo = this.trackDisposable(new THREE.BoxGeometry(10.5, 4.2, 0.35));

    for (const b of boards) {
      const s = this.samples[Math.floor(b.t * this.sampleCount)];
      const tex = this.trackDisposable(
        createHighwaySignTexture(b.title, b.sub, maxAnisotropy, b.bg, b.border, '#ffffff'),
      );
      const bMat = this.trackDisposable(
        new THREE.MeshStandardMaterial({
          map: tex,
          emissiveMap: tex,
          emissive: 0xffffff,
          emissiveIntensity: 1.4,
        }),
      );
      const grp = new THREE.Group();
      grp.position.set(
        s.pos.x + s.right.x * (this.roadHalfWidth + 4.5) * b.side,
        s.pos.y,
        s.pos.z + s.right.z * (this.roadHalfWidth + 4.5) * b.side,
      );
      grp.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z) + b.side * 0.42;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 4.5;
      const mesh = new THREE.Mesh(boardGeo, bMat);
      mesh.position.y = 9.5;
      grp.add(pole, mesh);
      this.group.add(grp);
    }
  }

  private buildStreetlights(): void {
    const step = 10;
    const count = Math.floor(this.sampleCount / step);
    const poleOffset = this.roadHalfWidth + 1.05;

    const isDayTrack =
      this.style === 'alpine_gp' ||
      this.style === 'drag_strip' ||
      this.style === 'mountain_hairpin_pass' ||
      this.style === 'karakorum_sky_pass' ||
      this.style === 'cholistan_mirage_highway';

    const poleGeo = this.trackDisposable(new THREE.CylinderGeometry(0.11, 0.16, 7.6, 8));
    poleGeo.translate(0, 3.8, 0);
    const poleMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x364154,
        metalness: 0.82,
        roughness: 0.3,
        envMapIntensity: 1.4,
      }),
    );

    const armGeo = this.trackDisposable(new THREE.BoxGeometry(2.4, 0.14, 0.18));
    const headGeo = this.trackDisposable(new THREE.BoxGeometry(1.1, 0.16, 0.45));
    const headMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: isDayTrack ? 0.55 : 2.8,
        roughness: 0.12,
      }),
    );

    const poolGeo = this.trackDisposable(new THREE.PlaneGeometry(11.5, 11.5));
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = this.trackDisposable(
      new THREE.MeshBasicMaterial({
        map: this.lightPoolTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        opacity: isDayTrack ? 0.05 : 0.24,
      }),
    );

    const total = count * 2;
    const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, total);
    const armInst = new THREE.InstancedMesh(armGeo, poleMat, total);
    const headInst = new THREE.InstancedMesh(headGeo, headMat, total);
    const poolInst = new THREE.InstancedMesh(poolGeo, poolMat, total);

    const dummy = new THREE.Object3D();
    const headColor = new THREE.Color();
    let idx = 0;

    for (let i = 0; i < count; i++) {
      const s = this.samples[(i * step) % this.sampleCount];
      const yaw = Math.atan2(-s.tangent.x, -s.tangent.z);
      const isWarmSection = s.t > 0.18 && s.t < 0.6;

      for (const side of [-1, 1]) {
        const px = s.pos.x + s.right.x * poleOffset * side;
        const py = s.pos.y;
        const pz = s.pos.z + s.right.z * poleOffset * side;

        dummy.position.set(px, py, pz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(px - s.right.x * 1.1 * side, py + 7.55, pz - s.right.z * 1.1 * side);
        dummy.updateMatrix();
        armInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(px - s.right.x * 1.9 * side, py + 7.42, pz - s.right.z * 1.9 * side);
        dummy.updateMatrix();
        headInst.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(px - s.right.x * 2.1 * side, py + 0.032, pz - s.right.z * 2.1 * side);
        dummy.rotation.set(0, yaw, s.bankAngle);
        dummy.updateMatrix();
        poolInst.setMatrixAt(idx, dummy.matrix);

        if (
          this.style === 'cyberpunk_rain' ||
          this.style === 'midnight_harbor_circuit' ||
          this.style === 'gwadar_port_docks'
        ) {
          headColor.setHex(i % 2 === 0 ? 0x00f5d4 : 0x38bdf8);
        } else if (this.style === 'lahore_midnight_gp') {
          headColor.setHex(i % 2 === 0 ? 0x10b981 : 0xfbbf24);
        } else if (this.style === 'emerald_valley_loop') {
          headColor.setHex(i % 2 === 0 ? 0x34d399 : 0xa7f3d0);
        } else if (
          this.style === 'industrial_port' ||
          this.style === 'desert_canyon' ||
          this.style === 'desert_canyon_highway' ||
          this.style === 'cholistan_mirage_highway' ||
          this.style === 'zigzag_serpentine'
        ) {
          headColor.setHex(this.style === 'zigzag_serpentine' && i % 2 === 1 ? 0xff6b00 : 0xfbbf24);
        } else if (
          this.style === 'wavy_coaster' ||
          this.style === 'mountain_hairpin_pass' ||
          this.style === 'karakorum_sky_pass'
        ) {
          headColor.setHex(i % 2 === 0 ? 0x00f5d4 : 0xfbbf24);
        } else if (this.style === 'ring_road' || this.style === 'downtown_tunnels') {
          headColor.setHex(i % 2 === 0 ? 0x3b82f6 : 0xfef08a);
        } else {
          headColor.setHex(isWarmSection ? 0xffae42 : 0x4df3ff);
        }
        headInst.setColorAt(idx, headColor);
        poolInst.setColorAt(idx, headColor);
        idx++;
      }
    }

    poleInst.computeBoundingSphere();
    armInst.computeBoundingSphere();
    headInst.computeBoundingSphere();
    poolInst.computeBoundingSphere();
    if (headInst.instanceColor) headInst.instanceColor.needsUpdate = true;
    if (poolInst.instanceColor) poolInst.instanceColor.needsUpdate = true;
    this.group.add(poleInst, armInst, headInst, poolInst);
  }

  private buildCheckpointsAndFinish(maxAnisotropy: number, modeConfig: ModeConfig): void {
    const finishBannerTex = this.trackDisposable(
      createFinishBannerTexture(maxAnisotropy, modeConfig.environmentName),
    );
    const truckArtTex = this.trackDisposable(createTruckArtTexture(maxAnisotropy));

    const startIdx = this.isOpenLoop ? 40 : 0;
    const s0 = this.samples[startIdx];
    const gantry = new THREE.Group();
    gantry.position.copy(s0.pos);
    gantry.rotation.y = Math.atan2(-s0.tangent.x, -s0.tangent.z);

    const pillarGeo = this.trackDisposable(new THREE.BoxGeometry(0.95, 8.4, 1.3));
    const pillarMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: truckArtTex,
        emissiveMap: truckArtTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.32,
        metalness: 0.35,
        roughness: 0.4,
      }),
    );
    const leftP = new THREE.Mesh(pillarGeo, pillarMat);
    leftP.position.set(-this.roadHalfWidth - 0.65, 4.2, 0);
    const rightP = new THREE.Mesh(pillarGeo, pillarMat);
    rightP.position.set(this.roadHalfWidth + 0.65, 4.2, 0);

    const headerGeo = this.trackDisposable(
      new THREE.BoxGeometry(this.roadHalfWidth * 2 + 2.4, 2.5, 0.95),
    );
    const headerMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: finishBannerTex,
        emissiveMap: finishBannerTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.95,
        roughness: 0.3,
      }),
    );
    const header = new THREE.Mesh(headerGeo, headerMat);
    header.position.set(0, 7.6, 0);

    const lineGeo = this.trackDisposable(new THREE.PlaneGeometry(this.roadHalfWidth * 1.95, 3.2));
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: finishBannerTex,
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    const startStrip = new THREE.Mesh(lineGeo, lineMat);
    startStrip.position.set(0, 0.03, 0);

    gantry.add(leftP, rightP, header, startStrip);
    this.group.add(gantry);

    // Overhead Pakistani Highway / Mode Flyover Sign Gantries
    if (!this.isOpenLoop) {
      const signConfigs =
        this.style === 'alpine_gp'
          ? [
              { t: 0.11, title: 'ALPINE PRO GP', sub: 'FAST SECTOR 1 · FULL THROTTLE' },
              { t: 0.58, title: 'APEX CHICANE', sub: 'TIME TRIAL GHOST ZONE' },
              { t: 0.77, title: 'GRAND PRIX', sub: 'FINAL SPRINT CORRIDOR' },
            ]
          : this.style === 'zigzag_serpentine'
            ? [
                { t: 0.11, title: 'SERPENTINE ZIGZAG', sub: 'RAPID LEFT-RIGHT SWITCHBACKS' },
                { t: 0.55, title: 'SWITCHBACK GORGE', sub: 'CANYON S-CHICANE ZONE' },
                { t: 0.78, title: 'APEX SLALOM', sub: 'DRIFT FOR NITRO BOOST' },
              ]
            : this.style === 'wavy_coaster'
              ? [
                  { t: 0.11, title: 'WAVE VIADUCT', sub: 'COASTAL ROLLERCOASTER HILLS' },
                  { t: 0.52, title: 'CREST SECTOR', sub: 'HIGH-SPEED WAVE DROP' },
                  { t: 0.78, title: 'OCEAN ROLLERCOASTER', sub: 'SWEEPING S-BEND EXPRESS' },
                ]
              : this.style === 'mountain_hairpin_pass'
                ? [
                    { t: 0.11, title: 'ALPINE PASS', sub: 'ELEVATION CLIMB ▲ 2,400M' },
                    { t: 0.54, title: 'GLACIER SWITCHBACK', sub: 'TIGHT HAIRPIN ZONE' },
                    { t: 0.78, title: 'SUMMIT DESCENT', sub: 'HIGH-SPEED DOWNHILL' },
                  ]
                : this.style === 'desert_canyon_highway'
                  ? [
                      { t: 0.11, title: 'RED ROCK CANYON', sub: 'OPEN HIGHWAY · NO SPEED LIMIT' },
                      { t: 0.55, title: 'SCORPION PASS', sub: 'CANYON SWEEPER CORRIDOR' },
                      { t: 0.78, title: 'SUNSET STRAIGHT', sub: 'FULL BOOST · 400+ KM/H' },
                    ]
                  : this.style === 'midnight_harbor_circuit'
                    ? [
                        { t: 0.11, title: 'PIER 9 DOCKS', sub: 'MIDNIGHT HARBOR CIRCUIT' },
                        { t: 0.5, title: 'HARBOR SKYBRIDGE', sub: 'WET ASPHALT EXPRESS SPAN' },
                        { t: 0.78, title: 'DOWNTOWN QUAY', sub: 'FINAL CHICANE SPRINT' },
                      ]
                    : this.style === 'karakorum_sky_pass'
                      ? [
                          { t: 0.11, title: 'KARAKORUM SKY PASS', sub: 'ROCK TUNNELS ▲ 3,800M' },
                          { t: 0.54, title: 'KHUNJERAB CLIFFS', sub: 'GOLDEN ALPINE SWITCHBACKS' },
                          { t: 0.78, title: 'GLACIER DESCENT', sub: 'FAST DOWNHILL HAIRPINS' },
                        ]
                      : this.style === 'cholistan_mirage_highway'
                        ? [
                            { t: 0.11, title: 'CHOLISTAN MIRAGE', sub: 'WIDE DESERT HIGHWAY' },
                            { t: 0.52, title: 'SUNSET DUNES', sub: '440+ KM/H STRAIGHTAWAY' },
                            { t: 0.78, title: 'DERAWAR SWEEPER', sub: 'HIGH-SPEED CANYON CURVE' },
                          ]
                        : this.style === 'lahore_midnight_gp'
                          ? [
                              { t: 0.11, title: 'MALL ROAD GP', sub: 'LAHORE MIDNIGHT CIRCUIT' },
                              { t: 0.52, title: 'SHAHI HERITAGE ARCH', sub: 'WET NEON BOULEVARD' },
                              { t: 0.78, title: 'KALMA FLYOVER', sub: 'FINAL SPRINT CORRIDOR' },
                            ]
                          : this.style === 'gwadar_port_docks'
                            ? [
                                { t: 0.11, title: 'GWADAR DEEP PORT', sub: 'CONTAINER CHICANE SECTOR' },
                                { t: 0.52, title: 'SHIPYARD CRANES', sub: 'FLOODLIT HARBOR PIER' },
                                { t: 0.78, title: 'MAKRAM QUAY', sub: 'WATERFRONT HAIRPIN' },
                              ]
                            : this.style === 'emerald_valley_loop'
                              ? [
                                  { t: 0.11, title: 'EMERALD VALLEY', sub: 'MONSOON RAIN-FOREST LOOP' },
                                  { t: 0.45, title: 'RAVINE SKYBRIDGE', sub: 'MISTY GORGE CROSSING' },
                                  { t: 0.78, title: 'SWAT CANOPY S-CURVES', sub: 'DYNAMIC RAIN GRIP ZONE' },
                                ]
                              : [
                                  { t: 0.11, title: 'CLIFTON FLYOVER', sub: 'COASTAL CORRIDOR ▲ 1 KM' },
                                  { t: 0.58, title: 'SHAHRAH-E-FAISAL', sub: 'EXPRESSWAY HIGH HEAT' },
                                  { t: 0.77, title: 'GT ROAD · LAHORE', sub: 'PAK EXPRESS CORRIDOR' },
                                ];

      const steelMat = this.trackDisposable(
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.82, roughness: 0.32 }),
      );
      const signPostGeo = this.trackDisposable(new THREE.CylinderGeometry(0.24, 0.28, 8.2, 8));
      const trussGeo = this.trackDisposable(
        new THREE.BoxGeometry(this.roadHalfWidth * 2 + 2.4, 0.45, 0.45),
      );
      const signBoardGeo = this.trackDisposable(new THREE.BoxGeometry(11.5, 2.8, 0.32));

      for (const cfg of signConfigs) {
        const sIdx = Math.floor(cfg.t * this.sampleCount) % this.sampleCount;
        const s = this.samples[sIdx];
        const signTex = this.trackDisposable(
          createHighwaySignTexture(
            cfg.title,
            cfg.sub,
            maxAnisotropy,
            this.style === 'alpine_gp' ? '#1e3a8a' : '#065f46',
          ),
        );
        const signMat = this.trackDisposable(
          new THREE.MeshStandardMaterial({
            map: signTex,
            emissiveMap: signTex,
            emissive: 0xffffff,
            emissiveIntensity: 0.55,
            roughness: 0.35,
          }),
        );

        const flyover = new THREE.Group();
        flyover.position.copy(s.pos);
        flyover.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

        const postL = new THREE.Mesh(signPostGeo, steelMat);
        postL.position.set(-this.roadHalfWidth - 0.8, 4.1, 0);
        const postR = new THREE.Mesh(signPostGeo, steelMat);
        postR.position.set(this.roadHalfWidth + 0.8, 4.1, 0);
        const truss = new THREE.Mesh(trussGeo, steelMat);
        truss.position.set(0, 8.0, 0);
        const board = new THREE.Mesh(signBoardGeo, signMat);
        board.position.set(0, 7.6, 0);

        flyover.add(postL, postR, truss, board);
        this.group.add(flyover);
      }

      const archTs = [0.16, 0.33, 0.50, 0.68, 0.84];
      const archColors = [0xffb703, 0xff007f, 0x00e5ff, 0x00e676, 0xffb703];
      const archGeo = this.trackDisposable(
        new THREE.TorusGeometry(this.roadHalfWidth + 0.6, 0.28, 8, 24, Math.PI),
      );

      archTs.forEach((tVal, i) => {
        const idx = Math.floor(tVal * this.sampleCount) % this.sampleCount;
        const s = this.samples[idx];
        const col = archColors[i % archColors.length];
        const gateMat = this.trackDisposable(
          new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: 2.3,
            roughness: 0.2,
            metalness: 0.5,
          }),
        );
        const arch = new THREE.Mesh(archGeo, gateMat);
        arch.position.copy(s.pos);
        arch.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
        this.group.add(arch);

        this.checkpoints.push({
          t: tVal,
          pos: s.pos.clone(),
          emissiveMat: gateMat,
          flashTimer: 0,
        });
      });
    }
  }

  private buildDragStripFeatures(maxAnisotropy: number): void {
    // 1. Christmas Tree Starting Lights right ahead of start line
    const treeGroup = new THREE.Group();
    const sStart = this.samples[48];
    treeGroup.position.copy(sStart.pos);
    treeGroup.rotation.y = Math.atan2(-sStart.tangent.x, -sStart.tangent.z);

    const poleMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 }),
    );
    const treePole = new THREE.Mesh(
      this.trackDisposable(new THREE.BoxGeometry(0.42, 4.6, 0.42)),
      poleMat,
    );
    treePole.position.set(0, 2.3, 0);
    treeGroup.add(treePole);

    const bulbGeo = this.trackDisposable(new THREE.SphereGeometry(0.22, 10, 10));
    const lightCols = [0xf59e0b, 0xf59e0b, 0xf59e0b, 0x10b981];
    lightCols.forEach((col, i) => {
      const mat = this.trackDisposable(
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.15,
          roughness: 0.15,
        }),
      );
      this.dragTreeLights.push(mat);
      const bL = new THREE.Mesh(bulbGeo, mat);
      bL.position.set(-0.28, 3.6 - i * 0.58, 0.22);
      const bR = new THREE.Mesh(bulbGeo, mat);
      bR.position.set(0.28, 3.6 - i * 0.58, 0.22);
      treeGroup.add(bL, bR);
    });
    this.group.add(treeGroup);

    // 2. Spectator Grandstands along first 350m
    const standGeo = this.trackDisposable(new THREE.BoxGeometry(6, 7.5, 55));
    const standMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.3 }),
    );
    for (const zPos of [350, 240, 120]) {
      for (const side of [-1, 1]) {
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(side * (this.roadHalfWidth + 10), 3.75, zPos);
        this.group.add(stand);
      }
    }

    // 3. Distance Marker Boards (200M, 400M, 600M, 800M, FINISH)
    const markers = [
      { t: 0.24, title: '200 METERS', sub: 'QUARTER STRIP' },
      { t: 0.44, title: '400 METERS', sub: '1/4 MILE TRAP' },
      { t: 0.64, title: '600 METERS', sub: 'TOP END PULL' },
      { t: 0.88, title: 'FINISH LINE', sub: 'HALF-MILE PRO STRIP' },
    ];
    const boardGeo = this.trackDisposable(new THREE.BoxGeometry(10.5, 2.4, 0.3));
    const postGeo = this.trackDisposable(new THREE.CylinderGeometry(0.22, 0.26, 7.8, 8));
    for (const m of markers) {
      const s = this.samples[Math.floor(m.t * this.sampleCount)];
      const tex = this.trackDisposable(
        createHighwaySignTexture(m.title, m.sub, maxAnisotropy, '#1e293b', '#f59e0b', '#38bdf8'),
      );
      const mat = this.trackDisposable(
        new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.5 }),
      );
      const g = new THREE.Group();
      g.position.copy(s.pos);
      const pL = new THREE.Mesh(postGeo, standMat);
      pL.position.set(-this.roadHalfWidth - 0.8, 3.9, 0);
      const pR = new THREE.Mesh(postGeo, standMat);
      pR.position.set(this.roadHalfWidth + 0.8, 3.9, 0);
      const b = new THREE.Mesh(boardGeo, mat);
      b.position.set(0, 7.2, 0);
      g.add(pL, pR, b);
      this.group.add(g);
    }
  }

  private buildTunnelsAndRoadblocks(): void {
    // 2 Dramatic Concrete & Neon Expressway Tunnels
    const tunnelPbr = this.clonePbrWithRepeat(this.concretePbr, 2, 2);
    const tunnelMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x394354,
        map: tunnelPbr.map,
        roughnessMap: tunnelPbr.roughnessMap,
        normalMap: tunnelPbr.normalMap,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.72,
        metalness: 0.22,
        side: THREE.DoubleSide,
      }),
    );
    const stripMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.6,
      }),
    );

    const tunnelArchGeo = this.trackDisposable(
      new THREE.CylinderGeometry(
        this.roadHalfWidth + 1.1,
        this.roadHalfWidth + 1.1,
        9.5,
        14,
        1,
        true,
        0,
        Math.PI,
      ),
    );
    tunnelArchGeo.rotateZ(Math.PI / 2);
    tunnelArchGeo.rotateY(Math.PI / 2);

    const stripGeo = this.trackDisposable(new THREE.BoxGeometry(0.28, 0.28, 8.6));

    for (const startT of [0.18, 0.68]) {
      const baseIdx = Math.floor(startT * this.sampleCount);
      for (let k = 0; k < 10; k++) {
        const s = this.samples[(baseIdx + k * 2) % this.sampleCount];
        const seg = new THREE.Group();
        seg.position.copy(s.pos);
        seg.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
        const shell = new THREE.Mesh(tunnelArchGeo, tunnelMat);
        seg.add(shell);

        const lightL = new THREE.Mesh(stripGeo, stripMat);
        lightL.position.set(-4.2, this.roadHalfWidth - 1.2, 0);
        const lightR = new THREE.Mesh(stripGeo, stripMat);
        lightR.position.set(4.2, this.roadHalfWidth - 1.2, 0);
        seg.add(lightL, lightR);
        this.group.add(seg);
      }
    }

    // 4 Flashing Police Roadblocks (breakable with Nitro or dodgeable!)
    const rbConfigs = [
      { t: 0.12, lateral: -3.8 },
      { t: 0.36, lateral: 3.6 },
      { t: 0.56, lateral: -3.2 },
      { t: 0.82, lateral: 3.8 },
    ];
    const barGeo = this.trackDisposable(new THREE.BoxGeometry(5.6, 0.95, 0.65));
    const barMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8 }),
    );
    const beaconGeo = this.trackDisposable(new THREE.BoxGeometry(0.55, 0.3, 0.4));
    const redMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0xff1e38, emissive: 0xff1128, emissiveIntensity: 4.5 }),
    );
    const blueMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb, emissiveIntensity: 4.5 }),
    );

    for (const rb of rbConfigs) {
      const s = this.samples[Math.floor(rb.t * this.sampleCount) % this.sampleCount];
      const pos = s.pos.clone().addScaledVector(s.right, rb.lateral);
      const grp = new THREE.Group();
      grp.position.copy(pos);
      grp.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);

      const barrier = new THREE.Mesh(barGeo, barMat);
      barrier.position.y = 0.5;
      const bL = new THREE.Mesh(beaconGeo, redMat);
      bL.position.set(-1.8, 1.12, 0);
      const bR = new THREE.Mesh(beaconGeo, blueMat);
      bR.position.set(1.8, 1.12, 0);
      grp.add(barrier, bL, bR);
      this.group.add(grp);

      this.roadblocks.push({
        t: rb.t,
        lateral: rb.lateral,
        pos,
        radius: 2.8,
        group: grp,
        brokenTimer: 0,
      });
    }
  }

  private buildBoostPads(): void {
    const padConfigs = [
      { t: 0.07, lateral: -3.2 },
      { t: 0.22, lateral: 3.4 },
      { t: 0.39, lateral: 0 },
      { t: 0.49, lateral: -3.0 },
      { t: 0.63, lateral: 3.0 },
      { t: 0.78, lateral: -2.8 },
      { t: 0.91, lateral: 2.5 },
    ];

    const padGeo = this.trackDisposable(new THREE.PlaneGeometry(4.2, 8.2));
    padGeo.rotateX(-Math.PI / 2);
    const padMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        map: this.boostTex,
        emissiveMap: this.boostTex,
        emissive: 0x00ffff,
        emissiveIntensity: 2.4,
        roughness: 0.25,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );

    for (const cfg of padConfigs) {
      const idx = Math.floor(cfg.t * this.sampleCount) % this.sampleCount;
      const s = this.samples[idx];
      const mesh = new THREE.Mesh(padGeo, padMat);
      const pos = s.pos.clone().addScaledVector(s.right, cfg.lateral);
      pos.y += 0.04;
      mesh.position.copy(pos);
      mesh.rotation.y = Math.atan2(-s.tangent.x, -s.tangent.z);
      this.group.add(mesh);

      this.boostPads.push({ t: cfg.t, lateral: cfg.lateral, pos, mesh });
    }
  }

  private buildNitroPickups(): void {
    const pickupConfigs = [
      { t: 0.04, lateral: 4.0 },
      { t: 0.13, lateral: -4.2 },
      { t: 0.27, lateral: 0 },
      { t: 0.35, lateral: 4.5 },
      { t: 0.45, lateral: 3.5 },
      { t: 0.55, lateral: -4.0 },
      { t: 0.69, lateral: 0 },
      { t: 0.74, lateral: 4.5 },
      { t: 0.86, lateral: -4.0 },
      { t: 0.95, lateral: 0 },
    ];

    const coreGeo = this.trackDisposable(new THREE.OctahedronGeometry(0.82, 0));
    const ringGeo = this.trackDisposable(new THREE.TorusGeometry(1.12, 0.11, 8, 20));
    const coreMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x00f6ff,
        emissive: 0x00d9ff,
        emissiveIntensity: 3.0,
        metalness: 0.4,
        roughness: 0.15,
      }),
    );
    const ringMat = this.trackDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xff2e93,
        emissive: 0xff2e93,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      }),
    );

    pickupConfigs.forEach((cfg, id) => {
      const idx = Math.floor(cfg.t * this.sampleCount) % this.sampleCount;
      const s = this.samples[idx];
      const pos = s.pos.clone().addScaledVector(s.right, cfg.lateral);
      pos.y += 1.25;

      const group = new THREE.Group();
      group.position.copy(pos);
      const core = new THREE.Mesh(coreGeo, coreMat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(core, ring);
      this.group.add(group);

      this.nitroPickups.push({
        id,
        t: cfg.t,
        lateral: cfg.lateral,
        pos,
        group,
        cooldown: 0,
      });
    });
  }

  public updateDynamicProps(dt: number, elapsed: number): void {
    this.boostTex.offset.y = -(elapsed * 1.4) % 1;

    for (const p of this.nitroPickups) {
      if (p.cooldown > 0) {
        p.cooldown -= dt;
        if (p.cooldown <= 0) {
          p.cooldown = 0;
          p.group.visible = true;
        }
      } else {
        p.group.rotation.y = elapsed * 2.4 + p.id;
        p.group.position.y = p.pos.y + Math.sin(elapsed * 3.5 + p.id) * 0.22;
      }
    }

    for (const cp of this.checkpoints) {
      if (cp.flashTimer > 0) {
        cp.flashTimer = Math.max(0, cp.flashTimer - dt);
        const k = cp.flashTimer / 0.6;
        cp.emissiveMat.emissive.setHex(k > 0.1 ? 0xfff066 : 0x00d4ff);
        cp.emissiveMat.emissiveIntensity = 2.2 + k * 4.5;
      }
    }

    for (const rb of this.roadblocks) {
      if (rb.brokenTimer > 0) {
        rb.brokenTimer = Math.max(0, rb.brokenTimer - dt);
        if (rb.brokenTimer <= 0) {
          rb.group.visible = true;
        }
      }
    }
  }

  public sampleAtT(
    tNorm: number,
    outPos: THREE.Vector3,
    outTangent: THREE.Vector3,
    outRight: THREE.Vector3,
  ): void {
    const wrapped = this.isOpenLoop
      ? THREE.MathUtils.clamp(tNorm, 0, 0.999)
      : ((tNorm % 1) + 1) % 1;
    const fIdx = wrapped * this.sampleCount;
    const i0 = Math.min(this.sampleCount - 1, Math.floor(fIdx));
    const i1 = this.isOpenLoop ? Math.min(this.sampleCount - 1, i0 + 1) : (i0 + 1) % this.sampleCount;
    const alpha = fIdx - Math.floor(fIdx);

    const a = this.samples[i0];
    const b = this.samples[i1];

    outPos.lerpVectors(a.pos, b.pos, alpha);
    outTangent.lerpVectors(a.tangent, b.tangent, alpha).normalize();
    outRight.lerpVectors(a.right, b.right, alpha).normalize();
  }

  public queryPosition(worldPos: THREE.Vector3, hintIdx: number, out: TrackQueryResult): void {
    const N = this.sampleCount;
    let bestIdx = hintIdx >= 0 ? Math.min(N - 1, hintIdx % N) : 0;
    let bestDistSq = Infinity;

    if (hintIdx >= 0) {
      const windowRadius = 36;
      for (let offset = -windowRadius; offset <= windowRadius; offset++) {
        const idx = this.isOpenLoop
          ? THREE.MathUtils.clamp(hintIdx + offset, 0, N - 1)
          : (hintIdx + offset + N) % N;
        const p = this.samples[idx].pos;
        const dx = worldPos.x - p.x;
        const dz = worldPos.z - p.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = idx;
        }
      }
    }

    if (bestDistSq > 900) {
      bestDistSq = Infinity;
      for (let idx = 0; idx < N; idx++) {
        const p = this.samples[idx].pos;
        const dx = worldPos.x - p.x;
        const dz = worldPos.z - p.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = idx;
        }
      }
    }

    const s = this.samples[bestIdx];
    const dx = worldPos.x - s.pos.x;
    const dz = worldPos.z - s.pos.z;
    const lateral = dx * s.right.x + dz * s.right.z;
    const along = dx * s.tangent.x + dz * s.tangent.z;

    const stepLen = this.totalLength / N;
    const nextSample = this.samples[
      this.isOpenLoop ? Math.min(N - 1, bestIdx + 1) : (bestIdx + 1) % N
    ];
    const prevSample = this.samples[
      this.isOpenLoop ? Math.max(0, bestIdx - 1) : (bestIdx - 1 + N) % N
    ];
    const centerY =
      along >= 0
        ? THREE.MathUtils.lerp(s.pos.y, nextSample.pos.y, Math.min(1, along / stepLen))
        : THREE.MathUtils.lerp(s.pos.y, prevSample.pos.y, Math.min(1, -along / stepLen));
    const roadY = centerY + lateral * s.right.y;

    const tRaw = (bestIdx + along / stepLen) / N;
    out.sampleIndex = bestIdx;
    out.t = this.isOpenLoop ? THREE.MathUtils.clamp(tRaw, 0, 1) : ((tRaw % 1) + 1) % 1;
    out.roadY = roadY;
    out.lateral = lateral;
    out.tangent.copy(s.tangent);
    out.right.copy(s.right);
    out.up.copy(s.up);
    out.closestPos.copy(s.pos).addScaledVector(s.right, lateral);
    out.closestPos.y = roadY;
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }

  private trackPbr(set: PbrTextureSet): PbrTextureSet {
    this.disposables.push(set.map, set.roughnessMap, set.normalMap);
    return set;
  }

  private clonePbrWithRepeat(src: PbrTextureSet, repeatX: number, repeatY: number): PbrTextureSet {
    const map = src.map.clone();
    map.repeat.set(repeatX, repeatY);
    map.needsUpdate = true;

    const roughnessMap = src.roughnessMap.clone();
    roughnessMap.repeat.set(repeatX, repeatY);
    roughnessMap.needsUpdate = true;

    const normalMap = src.normalMap.clone();
    normalMap.repeat.set(repeatX, repeatY);
    normalMap.needsUpdate = true;

    return this.trackPbr({ map, roughnessMap, normalMap });
  }
}
