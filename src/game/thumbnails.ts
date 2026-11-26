import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createVehicleModel } from './carModel';
import { createContactShadowTexture, createTruckArtTexture } from './textures';
import {
  CAR_COLOR_PRESETS,
  EnvironmentStyle,
  ModeConfig,
  VehicleSpec,
} from './types';

const vehicleThumbCache = new Map<string, string>();
const trackThumbCache = new Map<string, string>();

interface StudioContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rimLight: THREE.DirectionalLight;
  floorRingMat: THREE.MeshBasicMaterial;
  contactShadowTex: THREE.CanvasTexture;
  truckArtTex: THREE.CanvasTexture;
}

let studioCtx: StudioContext | null = null;
let studioFailed = false;

function getStudioContext(): StudioContext | null {
  if (studioFailed) return null;
  if (studioCtx) return studioCtx;

  try {
    const W = 440;
    const H = 248;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b17);
    scene.fog = new THREE.FogExp2(0x070b17, 0.045);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);

    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 1.0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    keyLight.position.set(5.5, 6.5, 5.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 2.6);
    rimLight.position.set(-5.8, 3.6, -4.8);
    scene.add(rimLight);

    const floorGeo = new THREE.PlaneGeometry(34, 34);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b101f,
      metalness: 0.72,
      roughness: 0.24,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    const ringGeo = new THREE.RingGeometry(2.65, 2.74, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(ringGeo, floorRingMat);
    floorRing.position.y = 0.015;
    scene.add(floorRing);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const contactShadowTex = createContactShadowTexture();
    const truckArtTex = createTruckArtTexture(maxAniso);

    studioCtx = {
      renderer,
      scene,
      camera,
      rimLight,
      floorRingMat,
      contactShadowTex,
      truckArtTex,
    };
    return studioCtx;
  } catch {
    studioFailed = true;
    return null;
  }
}

function parseCssHex(css: string, fallback: number): number {
  const clean = css.replace('#', '');
  const val = parseInt(clean, 16);
  return Number.isNaN(val) ? fallback : val;
}

function shadeHex(hexCss: string, factor: number): string {
  const clean = hexCss.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  if (Number.isNaN(num)) return hexCss;
  const r = Math.min(255, Math.max(0, Math.round(((num >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((num & 255) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

export function getVehicleThumbnail(
  spec: VehicleSpec,
  paintCss: string,
  accentCss: string,
  truckArtEnabled: boolean,
): string {
  const key = `${spec.id}|${paintCss}|${accentCss}|${truckArtEnabled ? 1 : 0}`;
  const existing = vehicleThumbCache.get(key);
  if (existing) return existing;

  // 1. Primary: Live Offscreen 3D Studio Render of the actual modern PBR vehicle rig
  const studio = getStudioContext();
  if (studio) {
    try {
      const paintHex = parseCssHex(paintCss, 0xe61c34);
      const accentHex = parseCssHex(accentCss, 0xffb81c);
      const matchedPreset = CAR_COLOR_PRESETS.find(
        (p) => p.css.toLowerCase() === paintCss.toLowerCase(),
      );

      const rig = createVehicleModel(paintHex, accentHex, studio.contactShadowTex, {
        vehicleSpec: spec,
        truckArtEnabled,
        truckArtTexture: studio.truckArtTex,
      });
      if (matchedPreset) {
        rig.setPaintColor(matchedPreset.hex, matchedPreset.accentHex, matchedPreset.finish);
      }

      // Dramatic 3/4 hero showroom angle facing front-left
      rig.root.rotation.set(0, -0.68, 0);
      rig.updateVisuals({
        dt: 0.016,
        speed: 0,
        steerAngle: -0.22,
        bodyRoll: 0,
        bodyPitch: 0,
        isBraking: false,
        isBoosting: false,
        elapsed: 0.5,
      });

      studio.rimLight.color.setHex(accentHex);
      studio.floorRingMat.color.setHex(accentHex);

      if (spec.isBike) {
        studio.camera.position.set(2.8, 1.35, -3.2);
        studio.camera.lookAt(0, 0.68, 0);
      } else if (spec.bodyStyle === 'beast_4x4' || spec.bodyStyle === 'luxury_suv' || spec.bodyStyle === 'pickup_truck') {
        studio.camera.position.set(4.25, 1.82, -4.85);
        studio.camera.lookAt(0, 0.72, 0);
      } else if (spec.bodyStyle === 'f1_formula') {
        studio.camera.position.set(4.05, 1.48, -4.65);
        studio.camera.lookAt(0, 0.44, 0);
      } else {
        studio.camera.position.set(3.85, 1.44, -4.45);
        studio.camera.lookAt(0, 0.54, 0);
      }

      studio.scene.add(rig.root);
      studio.renderer.render(studio.scene, studio.camera);
      const dataUrl = studio.renderer.domElement.toDataURL('image/png');
      studio.scene.remove(rig.root);
      rig.dispose();

      if (dataUrl && dataUrl.length > 128) {
        vehicleThumbCache.set(key, dataUrl);
        return dataUrl;
      }
    } catch {
      studioFailed = true;
    }
  }

  // 2. Fallback: High-Contrast 2D Studio Render
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 248;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const bg = ctx.createLinearGradient(0, 0, 0, 248);
  bg.addColorStop(0, '#090e1d');
  bg.addColorStop(0.6, '#111a31');
  bg.addColorStop(1, '#070a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 440, 248);

  const glow = ctx.createRadialGradient(220, 140, 14, 220, 140, 180);
  glow.addColorStop(0, `${accentCss}38`);
  glow.addColorStop(0.55, `${paintCss}22`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 440, 248);

  const bodyGrad = ctx.createLinearGradient(90, 80, 350, 175);
  bodyGrad.addColorStop(0, shadeHex(paintCss, 1.18));
  bodyGrad.addColorStop(0.5, paintCss);
  bodyGrad.addColorStop(1, shadeHex(paintCss, 0.52));

  ctx.save();
  ctx.translate(20, 10);
  if (spec.isBike) {
    drawSuperbikeThumbnail(ctx, spec, bodyGrad, paintCss, accentCss, truckArtEnabled);
  } else {
    drawCarThumbnail(ctx, spec, bodyGrad, paintCss, accentCss, truckArtEnabled);
  }
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  vehicleThumbCache.set(key, url);
  return url;
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  accentCss: string,
  neonRim = true,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f1117';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = neonRim ? accentCss : '#262d3d';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.64, 0, Math.PI * 2);
  ctx.fillStyle = '#1b2234';
  ctx.fill();
  ctx.strokeStyle = neonRim ? accentCss : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius * 0.6, cy + Math.sin(a) * radius * 0.6);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx + radius * 0.25, cy - radius * 0.12, radius * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = accentCss;
  ctx.fill();
  ctx.restore();
}

function drawTruckArtAccent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
): void {
  ctx.save();
  const colors = ['#ffb703', '#ff006e', '#00f5d4', '#fb5607'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(x + (i / 4) * w, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 5);
  ctx.lineTo(x + w + 6, y + 5);
  ctx.stroke();
  ctx.restore();
}

function drawCarThumbnail(
  ctx: CanvasRenderingContext2D,
  spec: VehicleSpec,
  bodyGrad: CanvasGradient,
  paintCss: string,
  accentCss: string,
  truckArtEnabled: boolean,
): void {
  const s = spec.bodyStyle;

  if (s === 'f1_formula') {
    const baseLine = 160;
    // Front & rear multi-element wings
    ctx.fillStyle = '#151b2b';
    ctx.fillRect(58, baseLine - 10, 48, 8);
    ctx.fillRect(306, baseLine - 56, 30, 8);
    ctx.fillStyle = accentCss;
    ctx.fillRect(58, baseLine - 12, 46, 3);
    ctx.fillRect(306, baseLine - 58, 30, 3);
    ctx.fillRect(310, baseLine - 50, 8, 34);

    // Sculpted nosecone + sidepod + airbox + engine cover
    ctx.beginPath();
    ctx.moveTo(64, baseLine - 6);
    ctx.lineTo(138, baseLine - 20);
    ctx.lineTo(192, baseLine - 24);
    ctx.lineTo(208, baseLine - 46);
    ctx.lineTo(246, baseLine - 46);
    ctx.lineTo(318, baseLine - 22);
    ctx.lineTo(324, baseLine - 6);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Halo + helmet
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(164, baseLine - 24);
    ctx.quadraticCurveTo(186, baseLine - 42, 206, baseLine - 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(192, baseLine - 30, 9, 0, Math.PI * 2);
    ctx.fillStyle = accentCss;
    ctx.fill();

    drawWheel(ctx, 114, 158, 24, accentCss, true);
    drawWheel(ctx, 286, 158, 26, accentCss, true);
    return;
  }

  const isSuv = s === 'beast_4x4' || s === 'luxury_suv';
  const isPickup = s === 'pickup_truck';
  const isMuscle = s === 'v8_muscle';
  const isHatch = s === 'rally_hatch';
  const isWagon = s === 'sport_wagon';
  const isSedan = s === 'sport_sedan';
  const isConvertible = s === 'convertible';
  const isGtCoupe = s === 'gt_coupe';
  const isJdm = s === 'skyline_r34' || s === 'supra_mk4' || s === 'rx7_rotary';
  const isHyper = !isSuv && !isPickup && !isMuscle && !isHatch && !isWagon && !isSedan && !isConvertible && !isGtCoupe && !isJdm;

  const frontX = 74;
  const rearX = isPickup ? 334 : isWagon ? 328 : 326;
  const baseLine = isSuv || isPickup ? 148 : 158;
  const wheelY = isSuv || isPickup ? 156 : 158;
  const wheelR = isSuv || isPickup ? 28 : 24;

  // Rear wings for track coupes & rally hatch
  if (
    s === 'koenig_mega' ||
    s === 'italian_v12' ||
    s === 'v8_mid' ||
    isGtCoupe ||
    isJdm ||
    isHatch
  ) {
    ctx.fillStyle = '#151b2b';
    ctx.beginPath();
    ctx.moveTo(isHatch ? 286 : 298, baseLine - (isHatch ? 58 : 36));
    ctx.lineTo(isHatch ? 314 : 324, baseLine - (isHatch ? 74 : 58));
    ctx.lineTo(isHatch ? 326 : 334, baseLine - (isHatch ? 74 : 58));
    ctx.lineTo(isHatch ? 302 : 312, baseLine - (isHatch ? 54 : 34));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = accentCss;
    ctx.fillRect(isHatch ? 296 : 306, baseLine - (isHatch ? 78 : 62), 34, 4.5);
  }

  // Body silhouette by class
  ctx.beginPath();
  if (s === 'luxury_suv') {
    ctx.moveTo(frontX + 6, baseLine);
    ctx.lineTo(frontX + 6, baseLine - 40);
    ctx.lineTo(136, baseLine - 42);
    ctx.lineTo(156, baseLine - 82);
    ctx.lineTo(314, baseLine - 82);
    ctx.lineTo(324, baseLine - 28);
    ctx.lineTo(324, baseLine);
  } else if (isSuv) {
    ctx.moveTo(frontX, baseLine);
    ctx.lineTo(frontX + 8, baseLine - 36);
    ctx.lineTo(138, baseLine - 42);
    ctx.lineTo(166, baseLine - 76);
    ctx.lineTo(296, baseLine - 76);
    ctx.lineTo(322, baseLine - 38);
    ctx.lineTo(rearX, baseLine - 28);
    ctx.lineTo(rearX - 4, baseLine);
  } else if (isPickup) {
    ctx.moveTo(frontX, baseLine);
    ctx.lineTo(frontX + 8, baseLine - 36);
    ctx.lineTo(134, baseLine - 40);
    ctx.lineTo(160, baseLine - 76);
    ctx.lineTo(228, baseLine - 76);
    ctx.lineTo(234, baseLine - 40);
    ctx.lineTo(rearX, baseLine - 40);
    ctx.lineTo(rearX - 4, baseLine);
  } else if (isWagon) {
    ctx.moveTo(frontX + 2, baseLine);
    ctx.lineTo(frontX + 12, baseLine - 26);
    ctx.lineTo(148, baseLine - 34);
    ctx.lineTo(182, baseLine - 62);
    ctx.lineTo(304, baseLine - 62);
    ctx.lineTo(rearX, baseLine - 28);
    ctx.lineTo(rearX - 4, baseLine);
  } else if (isHatch) {
    ctx.moveTo(frontX + 8, baseLine);
    ctx.lineTo(frontX + 16, baseLine - 28);
    ctx.lineTo(146, baseLine - 36);
    ctx.lineTo(176, baseLine - 66);
    ctx.lineTo(278, baseLine - 66);
    ctx.lineTo(312, baseLine - 32);
    ctx.lineTo(314, baseLine);
  } else if (isSedan) {
    ctx.moveTo(frontX + 2, baseLine);
    ctx.lineTo(frontX + 10, baseLine - 26);
    ctx.lineTo(146, baseLine - 34);
    ctx.lineTo(180, baseLine - 62);
    ctx.lineTo(266, baseLine - 62);
    ctx.lineTo(300, baseLine - 34);
    ctx.lineTo(rearX - 2, baseLine - 28);
    ctx.lineTo(rearX - 6, baseLine);
  } else if (isConvertible) {
    ctx.moveTo(frontX, baseLine);
    ctx.lineTo(frontX + 18, baseLine - 22);
    ctx.lineTo(150, baseLine - 30);
    ctx.lineTo(176, baseLine - 46);
    ctx.lineTo(186, baseLine - 30);
    ctx.lineTo(298, baseLine - 30);
    ctx.lineTo(rearX, baseLine - 24);
    ctx.lineTo(rearX - 4, baseLine);
  } else if (isMuscle) {
    ctx.moveTo(frontX, baseLine);
    ctx.lineTo(frontX + 4, baseLine - 28);
    ctx.lineTo(156, baseLine - 34);
    ctx.lineTo(188, baseLine - 60);
    ctx.lineTo(268, baseLine - 60);
    ctx.lineTo(312, baseLine - 32);
    ctx.lineTo(rearX, baseLine - 26);
    ctx.lineTo(rearX - 4, baseLine);
  } else if (isJdm || isGtCoupe) {
    ctx.moveTo(frontX, baseLine);
    ctx.lineTo(frontX + 12, baseLine - 24);
    ctx.lineTo(150, baseLine - 32);
    ctx.lineTo(184, baseLine - 58);
    ctx.lineTo(256, baseLine - 58);
    ctx.lineTo(304, baseLine - 30);
    ctx.lineTo(rearX - 2, baseLine - 24);
    ctx.lineTo(rearX - 6, baseLine);
  } else {
    ctx.moveTo(frontX - 6, baseLine);
    ctx.lineTo(frontX + 24, baseLine - 20);
    ctx.lineTo(148, baseLine - 30);
    ctx.lineTo(190, baseLine - 52);
    ctx.lineTo(252, baseLine - 52);
    ctx.lineTo(308, baseLine - 28);
    ctx.lineTo(rearX + 2, baseLine - 22);
    ctx.lineTo(rearX - 4, baseLine);
  }
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (isPickup) {
    // Roll bar + LED lights + bed rim
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(232, baseLine - 40);
    ctx.lineTo(240, baseLine - 72);
    ctx.lineTo(286, baseLine - 40);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(236, baseLine - 44, 92, 5);
  }
  if (s === 'luxury_suv') {
    // Rear spare wheel carrier
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(322, baseLine - 58, 12, 34);
    ctx.fillStyle = accentCss;
    ctx.fillRect(324, baseLine - 52, 8, 22);
  }
  if (isConvertible) {
    // Dual roll hoops + seat headrests
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(198, baseLine - 40, 12, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(228, baseLine - 42, 10, 12);
  }
  if (isMuscle) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(114, baseLine - 41, 24, 9);
    ctx.fillStyle = accentCss;
    ctx.fillRect(112, baseLine - 38, 6, 6);
  }
  if (isSuv || isPickup) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(172, baseLine - 82, 42, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(174, baseLine - 81, 38, 3);
  }

  if (s === 'chiron_w16') {
    ctx.beginPath();
    ctx.arc(216, baseLine - 24, 24, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.strokeStyle = accentCss;
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // Side Glass
  if (!isConvertible) {
    ctx.beginPath();
    if (s === 'luxury_suv') {
      ctx.moveTo(148, baseLine - 46);
      ctx.lineTo(164, baseLine - 76);
      ctx.lineTo(304, baseLine - 76);
      ctx.lineTo(312, baseLine - 46);
    } else if (isSuv) {
      ctx.moveTo(146, baseLine - 44);
      ctx.lineTo(170, baseLine - 70);
      ctx.lineTo(290, baseLine - 70);
      ctx.lineTo(308, baseLine - 44);
    } else if (isPickup) {
      ctx.moveTo(142, baseLine - 42);
      ctx.lineTo(164, baseLine - 70);
      ctx.lineTo(222, baseLine - 70);
      ctx.lineTo(226, baseLine - 42);
    } else if (isWagon) {
      ctx.moveTo(154, baseLine - 36);
      ctx.lineTo(186, baseLine - 56);
      ctx.lineTo(298, baseLine - 56);
      ctx.lineTo(314, baseLine - 36);
    } else if (isHatch) {
      ctx.moveTo(152, baseLine - 38);
      ctx.lineTo(180, baseLine - 60);
      ctx.lineTo(272, baseLine - 60);
      ctx.lineTo(294, baseLine - 38);
    } else {
      ctx.moveTo(154, baseLine - 31);
      ctx.lineTo(188, baseLine - 49);
      ctx.lineTo(254, baseLine - 49);
      ctx.lineTo(286, baseLine - 31);
    }
    ctx.closePath();
    const glass = ctx.createLinearGradient(160, baseLine - 65, 280, baseLine - 30);
    glass.addColorStop(0, '#1e293b');
    glass.addColorStop(0.5, '#38bdf844');
    glass.addColorStop(1, '#090d16');
    ctx.fillStyle = glass;
    ctx.fill();
  }

  ctx.fillStyle = '#0f131f';
  ctx.fillRect(frontX - 6, baseLine - 5, rearX - frontX + 6, 7);
  ctx.fillStyle = accentCss;
  ctx.fillRect(142, baseLine - 3, 128, 2.5);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(frontX + 4, baseLine - 18, 16, 4);
  ctx.fillStyle = '#ff2a55';
  ctx.fillRect(rearX - 16, baseLine - 22, 14, 4);

  if (truckArtEnabled) {
    drawTruckArtAccent(ctx, 178, baseLine - 14, 62);
  }

  if (isHyper) {
    ctx.fillStyle = '#0b101b';
    ctx.beginPath();
    ctx.moveTo(232, baseLine - 25);
    ctx.lineTo(260, baseLine - 28);
    ctx.lineTo(254, baseLine - 10);
    ctx.closePath();
    ctx.fill();
  }

  drawWheel(ctx, 126, wheelY, wheelR, accentCss, true);
  drawWheel(ctx, 274, wheelY, wheelR, accentCss, true);

  const floorReflect = ctx.createLinearGradient(0, 172, 0, 210);
  floorReflect.addColorStop(0, `${accentCss}55`);
  floorReflect.addColorStop(0.5, `${paintCss}33`);
  floorReflect.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = floorReflect;
  ctx.fillRect(92, 174, 218, 30);
}

function drawSuperbikeThumbnail(
  ctx: CanvasRenderingContext2D,
  spec: VehicleSpec,
  bodyGrad: CanvasGradient,
  _paintCss: string,
  accentCss: string,
  truckArtEnabled: boolean,
): void {
  const isCyber = spec.bodyStyle === 'cyber_moto';
  const isNaked = spec.bodyStyle === 'streetfighter';
  const rearX = 272;
  const frontX = 128;
  const wheelY = 154;

  const bikeGlow = ctx.createLinearGradient(0, 176, 0, 206);
  bikeGlow.addColorStop(0, `${accentCss}55`);
  bikeGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bikeGlow;
  ctx.fillRect(108, 176, 184, 24);

  drawWheel(ctx, frontX, wheelY, 27, accentCss, true);
  drawWheel(ctx, rearX, wheelY, 28, accentCss, true);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(rearX, wheelY);
  ctx.lineTo(208, 134);
  ctx.stroke();

  ctx.strokeStyle = isNaked ? '#fbbf24' : '#cbd5e1';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(frontX, wheelY);
  ctx.lineTo(154, 96);
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(205, 146);
  ctx.lineTo(262, 132);
  ctx.stroke();

  ctx.beginPath();
  if (isCyber) {
    ctx.moveTo(118, 122);
    ctx.lineTo(164, 86);
    ctx.lineTo(246, 98);
    ctx.lineTo(286, 118);
    ctx.lineTo(222, 138);
    ctx.lineTo(148, 138);
  } else if (isNaked) {
    ctx.moveTo(146, 108);
    ctx.lineTo(188, 94);
    ctx.lineTo(234, 110);
    ctx.lineTo(276, 98);
    ctx.lineTo(242, 134);
    ctx.lineTo(166, 134);
  } else {
    ctx.moveTo(126, 120);
    ctx.lineTo(166, 86);
    ctx.lineTo(228, 102);
    ctx.lineTo(282, 92);
    ctx.lineTo(232, 138);
    ctx.lineTo(152, 138);
  }
  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(176, 98);
  ctx.quadraticCurveTo(202, 62, 232, 76);
  ctx.lineTo(244, 104);
  ctx.lineTo(196, 112);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(178, 72, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(165, 69, 10, 5);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(126, 108, 14, 5);

  if (truckArtEnabled) {
    drawTruckArtAccent(ctx, 174, 118, 42);
  }
}

export function getTrackThumbnail(mode: ModeConfig): string {
  const existing = trackThumbCache.get(mode.id);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawEnvironmentScene(ctx, mode.environmentStyle, mode.accentCss);

  const url = canvas.toDataURL('image/png');
  trackThumbCache.set(mode.id, url);
  return url;
}

function drawEnvironmentScene(
  ctx: CanvasRenderingContext2D,
  style: EnvironmentStyle,
  accentCss: string,
): void {
  const w = 440;
  const h = 220;
  const horizon = 114;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon + 10);
  if (style === 'coastal') {
    sky.addColorStop(0, '#0a1330');
    sky.addColorStop(0.55, '#6b2556');
    sky.addColorStop(1, '#f59e56');
  } else if (style === 'downtown_tunnels') {
    sky.addColorStop(0, '#050816');
    sky.addColorStop(0.7, '#161b3d');
    sky.addColorStop(1, '#4c1d4b');
  } else if (style === 'drag_strip') {
    sky.addColorStop(0, '#1d4ed8');
    sky.addColorStop(0.6, '#60a5fa');
    sky.addColorStop(1, '#fef3c7');
  } else if (style === 'mountain_touge') {
    sky.addColorStop(0, '#0c232a');
    sky.addColorStop(0.65, '#194a56');
    sky.addColorStop(1, '#6ee7b7');
  } else if (style === 'alpine_gp') {
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.7, '#7dd3fc');
    sky.addColorStop(1, '#e0f2fe');
  } else if (style === 'industrial_port') {
    sky.addColorStop(0, '#1c120d');
    sky.addColorStop(0.6, '#7c2d12');
    sky.addColorStop(1, '#fb923c');
  } else if (style === 'gt_highway') {
    sky.addColorStop(0, '#064e3b');
    sky.addColorStop(0.55, '#b45309');
    sky.addColorStop(1, '#fde047');
  } else if (style === 'desert_canyon') {
    sky.addColorStop(0, '#431407');
    sky.addColorStop(0.55, '#c2410c');
    sky.addColorStop(1, '#fdba74');
  } else if (style === 'cyberpunk_rain') {
    sky.addColorStop(0, '#060312');
    sky.addColorStop(0.6, '#3b0764');
    sky.addColorStop(1, '#0891b2');
  } else if (style === 'zigzag_serpentine') {
    sky.addColorStop(0, '#1e0b18');
    sky.addColorStop(0.55, '#7c2d12');
    sky.addColorStop(1, '#fb923c');
  } else if (style === 'wavy_coaster') {
    sky.addColorStop(0, '#041226');
    sky.addColorStop(0.55, '#0e4d64');
    sky.addColorStop(1, '#22d3ee');
  } else if (style === 'mountain_hairpin_pass') {
    sky.addColorStop(0, '#0f3460');
    sky.addColorStop(0.55, '#3b82f6');
    sky.addColorStop(1, '#bae6fd');
  } else if (style === 'desert_canyon_highway') {
    sky.addColorStop(0, '#451204');
    sky.addColorStop(0.55, '#d97706');
    sky.addColorStop(1, '#fed7aa');
  } else if (style === 'midnight_harbor_circuit') {
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.55, '#0f2942');
    sky.addColorStop(1, '#0891b2');
  } else if (style === 'karakorum_sky_pass') {
    sky.addColorStop(0, '#102a4c');
    sky.addColorStop(0.55, '#8c5a2b');
    sky.addColorStop(1, '#fde68a');
  } else if (style === 'cholistan_mirage_highway') {
    sky.addColorStop(0, '#3b0d12');
    sky.addColorStop(0.55, '#c2410c');
    sky.addColorStop(1, '#fbbf24');
  } else if (style === 'lahore_midnight_gp') {
    sky.addColorStop(0, '#030712');
    sky.addColorStop(0.6, '#064e3b');
    sky.addColorStop(1, '#f59e0b');
  } else if (style === 'gwadar_port_docks') {
    sky.addColorStop(0, '#081226');
    sky.addColorStop(0.55, '#7c2d12');
    sky.addColorStop(1, '#0ea5e9');
  } else if (style === 'emerald_valley_loop') {
    sky.addColorStop(0, '#05221d');
    sky.addColorStop(0.55, '#0f5c4a');
    sky.addColorStop(1, '#6ee7b7');
  } else {
    sky.addColorStop(0, '#0b1224');
    sky.addColorStop(0.6, '#1e3a8a');
    sky.addColorStop(1, '#3b82f6');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 6);

  if (
    style === 'coastal' ||
    style === 'desert_canyon' ||
    style === 'desert_canyon_highway' ||
    style === 'cholistan_mirage_highway' ||
    style === 'karakorum_sky_pass' ||
    style === 'gt_highway' ||
    style === 'drag_strip' ||
    style === 'zigzag_serpentine'
  ) {
    ctx.beginPath();
    ctx.arc(315, horizon - 26, 26, 0, Math.PI * 2);
    ctx.fillStyle = style === 'drag_strip' ? 'rgba(255,250,220,0.9)' : 'rgba(255,195,90,0.88)';
    ctx.fill();
  }

  if (style === 'coastal') {
    ctx.fillStyle = '#0c1f3d';
    ctx.fillRect(0, horizon, w, 24);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, horizon - 38);
    ctx.lineTo(130, horizon);
    ctx.moveTo(130, horizon - 46);
    ctx.lineTo(130, horizon);
    ctx.moveTo(130, horizon - 46);
    ctx.lineTo(250, horizon);
    ctx.stroke();

    for (const px of [44, 385, 412]) {
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, horizon + 12);
      ctx.quadraticCurveTo(px + 6, horizon - 24, px + 2, horizon - 52);
      ctx.stroke();
      ctx.fillStyle = '#050811';
      for (let a = 0; a < 5; a++) {
        const ang = -0.5 + a * 0.65;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(ang) * 14, horizon - 52 + Math.sin(ang) * 7, 14, 4, ang, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (
    style === 'downtown_tunnels' ||
    style === 'cyberpunk_rain' ||
    style === 'ring_road' ||
    style === 'midnight_harbor_circuit'
  ) {
    for (let bx = 6; bx < w; bx += 34) {
      const bh = 38 + ((bx * 17) % 62);
      ctx.fillStyle =
        style === 'cyberpunk_rain'
          ? '#0b0820'
          : style === 'midnight_harbor_circuit'
            ? '#08182b'
            : '#0f172a';
      ctx.fillRect(bx, horizon - bh, 28, bh + 8);
      ctx.fillStyle =
        style === 'cyberpunk_rain'
          ? bx % 2 === 0
            ? '#e879f9'
            : '#06b6d4'
          : style === 'midnight_harbor_circuit'
            ? bx % 2 === 0
              ? '#00f5d4'
              : '#38bdf8'
            : '#f59e0b';
      for (let wy = horizon - bh + 8; wy < horizon - 6; wy += 10) {
        ctx.fillRect(bx + 5, wy, 5, 4);
        ctx.fillRect(bx + 16, wy, 5, 4);
      }
    }
    if (style === 'midnight_harbor_circuit') {
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(310, horizon);
      ctx.lineTo(324, 38);
      ctx.lineTo(410, 38);
      ctx.stroke();
    }
    if (style === 'downtown_tunnels') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(220, horizon + 14, 96, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(220, horizon + 14, 72, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(220, horizon + 14, 74, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(220, horizon + 14, 74, Math.PI * 1.5, 0);
      ctx.stroke();
    }
  } else if (
    style === 'mountain_touge' ||
    style === 'alpine_gp' ||
    style === 'mountain_hairpin_pass'
  ) {
    ctx.fillStyle =
      style === 'alpine_gp'
        ? '#334155'
        : style === 'mountain_hairpin_pass'
          ? '#1e3a5f'
          : '#0f3d3e';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(75, 46);
    ctx.lineTo(155, 92);
    ctx.lineTo(250, 34);
    ctx.lineTo(355, 86);
    ctx.lineTo(440, 42);
    ctx.lineTo(440, horizon + 10);
    ctx.lineTo(0, horizon + 10);
    ctx.closePath();
    ctx.fill();
    if (style === 'alpine_gp' || style === 'mountain_hairpin_pass') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(250, 34);
      ctx.lineTo(222, 54);
      ctx.lineTo(278, 54);
      ctx.closePath();
      ctx.fill();
    }
  } else if (style === 'industrial_port') {
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(65, horizon);
    ctx.lineTo(80, 36);
    ctx.lineTo(175, 36);
    ctx.moveTo(310, horizon);
    ctx.lineTo(326, 46);
    ctx.lineTo(395, 46);
    ctx.stroke();
    const boxCols = ['#ef4444', '#2563eb', '#eab308'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = boxCols[i % 3];
      ctx.fillRect(14 + i * 22, horizon - 18 - (i % 2) * 14, 20, 18);
    }
  } else if (style === 'desert_canyon' || style === 'desert_canyon_highway') {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(18, 52, 68, horizon - 44);
    ctx.fillRect(354, 46, 74, horizon - 38);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(220, horizon + 12, 86, Math.PI, 0);
    ctx.stroke();
  } else if (style === 'gt_highway') {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(120, 48, 200, 22);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 48, 200, 22);
    ctx.beginPath();
    ctx.moveTo(132, 70);
    ctx.lineTo(132, horizon + 4);
    ctx.moveTo(308, 70);
    ctx.lineTo(308, horizon + 4);
    ctx.stroke();
  } else if (style === 'zigzag_serpentine') {
    // Canyon switchback mesas & stone ridges
    ctx.fillStyle = '#5c1d0c';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(64, 54);
    ctx.lineTo(138, 86);
    ctx.lineTo(212, 48);
    ctx.lineTo(298, 92);
    ctx.lineTo(382, 42);
    ctx.lineTo(440, 74);
    ctx.lineTo(440, horizon + 6);
    ctx.lineTo(0, horizon + 6);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'wavy_coaster') {
    // Coastal twilight viaduct silhouette + shimmering cyan horizon water
    ctx.fillStyle = '#082f49';
    ctx.fillRect(0, horizon - 8, w, 16);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    for (let px = 40; px < w; px += 76) {
      ctx.beginPath();
      ctx.moveTo(px, horizon + 4);
      ctx.lineTo(px, horizon - 30);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, horizon - 28);
    ctx.quadraticCurveTo(110, horizon - 46, 220, horizon - 24);
    ctx.quadraticCurveTo(330, horizon - 6, 440, horizon - 34);
    ctx.stroke();
  } else if (style === 'karakorum_sky_pass') {
    // Golden-hour alpine cliffs + snow peaks + rock tunnel portal
    ctx.fillStyle = '#3b2d26';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(68, 36);
    ctx.lineTo(148, 84);
    ctx.lineTo(240, 26);
    ctx.lineTo(340, 78);
    ctx.lineTo(440, 32);
    ctx.lineTo(440, horizon + 10);
    ctx.lineTo(0, horizon + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(240, 26);
    ctx.lineTo(212, 48);
    ctx.lineTo(268, 48);
    ctx.closePath();
    ctx.fill();
    // Carved rock tunnel portal
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(220, horizon + 12, 62, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(220, horizon + 12, 58, Math.PI, 0);
    ctx.stroke();
  } else if (style === 'cholistan_mirage_highway') {
    // Rolling sunset desert dunes
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(0, horizon + 8);
    ctx.quadraticCurveTo(95, 58, 200, 88);
    ctx.quadraticCurveTo(315, 52, 440, 82);
    ctx.lineTo(440, horizon + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(0, horizon + 8);
    ctx.quadraticCurveTo(135, 76, 260, 96);
    ctx.quadraticCurveTo(360, 72, 440, 94);
    ctx.lineTo(440, horizon + 10);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'lahore_midnight_gp') {
    // Midnight city skyline + illuminated Mughal heritage arch
    for (let bx = 8; bx < w; bx += 36) {
      const bh = 34 + ((bx * 19) % 54);
      ctx.fillStyle = '#07131e';
      ctx.fillRect(bx, horizon - bh, 26, bh + 8);
      ctx.fillStyle = bx % 2 === 0 ? '#10b981' : '#f59e0b';
      for (let wy = horizon - bh + 8; wy < horizon - 6; wy += 10) {
        ctx.fillRect(bx + 5, wy, 4, 4);
        ctx.fillRect(bx + 15, wy, 4, 4);
      }
    }
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(142, 46, 22, horizon - 38);
    ctx.fillRect(276, 46, 22, horizon - 38);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(220, 76, 62, Math.PI, 0);
    ctx.stroke();
  } else if (style === 'gwadar_port_docks') {
    // Harbor cranes + stacked containers + spotlights
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(62, horizon);
    ctx.lineTo(78, 34);
    ctx.lineTo(182, 34);
    ctx.moveTo(320, horizon);
    ctx.lineTo(334, 42);
    ctx.lineTo(410, 42);
    ctx.stroke();
    // Spotlight cones
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.moveTo(118, 34);
    ctx.lineTo(70, horizon + 10);
    ctx.lineTo(165, horizon + 10);
    ctx.closePath();
    ctx.fill();
    const boxCols = ['#0284c7', '#f97316', '#eab308'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = boxCols[i % 3];
      ctx.fillRect(16 + i * 21, horizon - 18 - (i % 2) * 14, 19, 18);
    }
  } else if (style === 'emerald_valley_loop') {
    // Lush misty rainforest peaks + ravine truss bridge
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(80, 42);
    ctx.lineTo(165, 86);
    ctx.lineTo(255, 36);
    ctx.lineTo(350, 82);
    ctx.lineTo(440, 46);
    ctx.lineTo(440, horizon + 10);
    ctx.lineTo(0, horizon + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(95, horizon - 14);
    ctx.lineTo(345, horizon - 14);
    ctx.moveTo(140, horizon - 38);
    ctx.lineTo(140, horizon + 8);
    ctx.moveTo(300, horizon - 38);
    ctx.lineTo(300, horizon + 8);
    ctx.stroke();
  }

  ctx.fillStyle =
    style === 'desert_canyon' ||
    style === 'zigzag_serpentine' ||
    style === 'desert_canyon_highway' ||
    style === 'cholistan_mirage_highway'
      ? '#6d250f'
      : style === 'drag_strip'
        ? '#b48a5a'
        : style === 'alpine_gp' || style === 'mountain_hairpin_pass'
          ? '#166534'
          : style === 'karakorum_sky_pass'
            ? '#332b24'
            : style === 'emerald_valley_loop'
              ? '#064e3b'
              : style === 'wavy_coaster' ||
                  style === 'midnight_harbor_circuit' ||
                  style === 'gwadar_port_docks'
                ? '#081b2d'
                : '#0b1020';
  ctx.fillRect(0, horizon, w, h - horizon);

  if (style === 'zigzag_serpentine') {
    // Dramatic S-switchback zigzag road ribbon
    ctx.fillStyle = '#1b2234';
    ctx.beginPath();
    ctx.moveTo(205, horizon);
    ctx.lineTo(245, horizon);
    ctx.bezierCurveTo(310, horizon + 18, 130, horizon + 40, 355, horizon + 64);
    ctx.bezierCurveTo(400, horizon + 76, 175, h - 18, 350, h);
    ctx.lineTo(72, h);
    ctx.bezierCurveTo(45, h - 22, 275, horizon + 62, 118, horizon + 36);
    ctx.bezierCurveTo(96, horizon + 22, 232, horizon + 12, 205, horizon);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(205, horizon);
    ctx.bezierCurveTo(232, horizon + 12, 96, horizon + 22, 118, horizon + 36);
    ctx.bezierCurveTo(275, horizon + 62, 45, h - 22, 72, h);
    ctx.moveTo(245, horizon);
    ctx.bezierCurveTo(310, horizon + 18, 130, horizon + 40, 355, horizon + 64);
    ctx.bezierCurveTo(400, horizon + 76, 175, h - 18, 350, h);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(225, horizon);
    ctx.bezierCurveTo(270, horizon + 16, 115, horizon + 32, 238, horizon + 50);
    ctx.bezierCurveTo(340, horizon + 68, 115, h - 20, 210, h);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (style === 'wavy_coaster') {
    // Rolling wavy rollercoaster ribbon with neon cyan/amber rails
    ctx.fillStyle = '#151e34';
    ctx.beginPath();
    ctx.moveTo(188, horizon);
    ctx.lineTo(254, horizon);
    ctx.bezierCurveTo(295, horizon + 26, 360, horizon + 54, 404, h);
    ctx.lineTo(38, h);
    ctx.bezierCurveTo(88, horizon + 56, 150, horizon + 26, 188, horizon);
    ctx.closePath();
    ctx.fill();

    // Rolling elevation crest bands across road
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.35)';
    ctx.lineWidth = 2;
    for (let y = horizon + 22; y < h; y += 22) {
      const spread = ((y - horizon) / (h - horizon)) * 130 + 36;
      ctx.beginPath();
      ctx.moveTo(220 - spread, y);
      ctx.quadraticCurveTo(220, y - 9, 220 + spread, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(188, horizon);
    ctx.bezierCurveTo(150, horizon + 26, 88, horizon + 56, 38, h);
    ctx.moveTo(254, horizon);
    ctx.bezierCurveTo(295, horizon + 26, 360, horizon + 54, 404, h);
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(221, horizon + 2);
    ctx.quadraticCurveTo(192, horizon + 46, 221, h);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.beginPath();
    ctx.moveTo(186, horizon);
    ctx.lineTo(254, horizon);
    ctx.lineTo(410, h);
    ctx.lineTo(30, h);
    ctx.closePath();
    ctx.fillStyle = style === 'cyberpunk_rain' ? '#0f172a' : '#1b2234';
    ctx.fill();

    ctx.strokeStyle = style === 'alpine_gp' ? '#ef4444' : accentCss;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(186, horizon);
    ctx.lineTo(30, h);
    ctx.moveTo(254, horizon);
    ctx.lineTo(410, h);
    ctx.stroke();

    ctx.strokeStyle = style === 'drag_strip' ? '#ffffff' : '#facc15';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(220, horizon + 4);
    ctx.lineTo(220, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (style === 'drag_strip') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(216, horizon - 26, 8, 56);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(220, horizon - 20 + i * 9, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(220, horizon + 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'gt_highway') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(154, horizon + 28, 36, 28);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(156, horizon + 20, 32, 10);
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(256, horizon + 44, 24, 20);
  } else if (
    style === 'cyberpunk_rain' ||
    style === 'lahore_midnight_gp' ||
    style === 'emerald_valley_loop'
  ) {
    ctx.strokeStyle =
      style === 'emerald_valley_loop'
        ? 'rgba(167, 243, 208, 0.45)'
        : 'rgba(103, 232, 249, 0.45)';
    ctx.lineWidth = 1.4;
    for (let rx = 18; rx < w; rx += 22) {
      const ry = (rx * 31) % 140;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 18);
      ctx.stroke();
    }
  } else if (style === 'ring_road') {
    const rb = ctx.createRadialGradient(170, horizon + 45, 4, 170, horizon + 45, 55);
    rb.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    rb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rb;
    ctx.fillRect(110, horizon, 120, 100);
    const bb = ctx.createRadialGradient(270, horizon + 45, 4, 270, horizon + 45, 55);
    bb.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
    bb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bb;
    ctx.fillRect(210, horizon, 120, 100);
  }

  const scrim = ctx.createLinearGradient(0, h - 55, 0, h);
  scrim.addColorStop(0, 'rgba(7,10,20,0)');
  scrim.addColorStop(1, 'rgba(7,10,20,0.85)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h - 55, w, 55);
}
