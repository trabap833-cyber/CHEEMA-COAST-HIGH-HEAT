import * as THREE from 'three';
import abdullahCheemaLockedPhoto from '../assets/images/abdullah_cheema_locked.png';
import { EnvironmentStyle } from './types';

export interface RoadTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.DataTexture;
}

export interface PbrTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.DataTexture;
}

function hash2D(x: number, y: number, seed = 1337): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function buildSobelNormalTexture(
  heights: Float32Array,
  size: number,
  strength: number,
  maxAnisotropy: number,
  wrapS: THREE.Wrapping = THREE.RepeatWrapping,
  wrapT: THREE.Wrapping = THREE.RepeatWrapping,
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return heights[wy * size + wx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = at(x - 1, y - 1);
      const t = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const l = at(x - 1, y);
      const r = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const b = at(x, y + 1);
      const br = at(x + 1, y + 1);

      const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round((nx * 0.5 + 0.5) * 255)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round((ny * 0.5 + 0.5) * 255)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round((nz * 0.5 + 0.5) * 255)));
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = wrapS;
  tex.wrapT = wrapT;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createRoadTextures(
  maxAnisotropy: number,
  style: EnvironmentStyle = 'coastal',
): RoadTextureSet {
  const width = 1024;
  const height = 1024;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const ctx = albedoCanvas.getContext('2d')!;

  const isWet =
    style === 'cyberpunk_rain' ||
    style === 'midnight_harbor_circuit' ||
    style === 'lahore_midnight_gp' ||
    style === 'emerald_valley_loop';
  const isGp =
    style === 'alpine_gp' ||
    style === 'mountain_hairpin_pass' ||
    style === 'karakorum_sky_pass';
  const isDesert =
    style === 'desert_canyon' ||
    style === 'desert_canyon_highway' ||
    style === 'cholistan_mirage_highway' ||
    style === 'drag_strip';
  const isPort =
    style === 'industrial_port' ||
    style === 'midnight_harbor_circuit' ||
    style === 'gwadar_port_docks';
  const isZigzag = style === 'zigzag_serpentine';
  const isWavy = style === 'wavy_coaster';

  ctx.fillStyle =
    style === 'midnight_harbor_circuit'
      ? '#111824'
      : style === 'lahore_midnight_gp'
        ? '#0e141c'
        : style === 'emerald_valley_loop'
          ? '#121e1b'
          : isWet
            ? '#10141f'
            : style === 'mountain_hairpin_pass' || style === 'karakorum_sky_pass'
              ? '#202630'
              : isGp
                ? '#262b35'
                : isDesert
                  ? '#2e2723'
                  : isPort
                    ? '#23272f'
                    : isZigzag
                      ? '#1f232c'
                      : isWavy
                        ? '#171f2e'
                        : '#1c202a';
  ctx.fillRect(0, 0, width, height);

  // Fine mineral asphalt aggregate grain (pixel-accurate ImageData pass for crisp detail)
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const fine = hash2D(x, y, 42);
      const coarse = hash2D(Math.floor(x / 4), Math.floor(y / 4), 91);
      const delta = Math.round((fine - 0.5) * 20 + (coarse - 0.5) * 14);
      const stoneTint = fine > 0.92 ? 12 : 0;
      px[idx] = Math.max(0, Math.min(255, px[idx] + delta + stoneTint + (isDesert ? 4 : 0)));
      px[idx + 1] = Math.max(0, Math.min(255, px[idx + 1] + delta + stoneTint));
      px[idx + 2] = Math.max(0, Math.min(255, px[idx + 2] + delta + stoneTint + (isDesert ? -3 : 3)));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle asphalt paving seams & tar-sealed micro cracks
  ctx.strokeStyle = 'rgba(7, 9, 13, 0.36)';
  ctx.lineWidth = 2.5;
  for (const seamX of [width * 0.25, width * 0.5, width * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(seamX, 0);
    ctx.lineTo(seamX, height);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(5, 7, 11, 0.55)';
  ctx.lineWidth = 2;
  for (let c = 0; c < 9; c++) {
    let cx = 90 + hash2D(c, 3, 77) * (width - 180);
    let cy = hash2D(c, 9, 77) * height;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let seg = 0; seg < 6; seg++) {
      cx += (hash2D(c, seg + 10, 51) - 0.5) * 34;
      cy += 18 + hash2D(seg, c, 33) * 26;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Polished tire wear tracks & subtle rubber skid streaks in racing lanes
  const laneCenters = [width * 0.24, width * 0.41, width * 0.59, width * 0.76];
  for (const cx of laneCenters) {
    const grad = ctx.createLinearGradient(cx - 56, 0, cx + 56, 0);
    grad.addColorStop(0, 'rgba(8, 10, 16, 0)');
    grad.addColorStop(0.28, 'rgba(8, 10, 16, 0.36)');
    grad.addColorStop(0.5, 'rgba(16, 19, 28, 0.08)');
    grad.addColorStop(0.72, 'rgba(8, 10, 16, 0.36)');
    grad.addColorStop(1, 'rgba(8, 10, 16, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 56, 0, 112, height);
  }
  // Subtle dark rubber braking marks
  ctx.fillStyle = 'rgba(6, 7, 11, 0.26)';
  for (let s = 0; s < 14; s++) {
    const rx = 140 + hash2D(s, 4, 19) * (width - 280);
    const ry = hash2D(s, 8, 19) * (height - 160);
    const len = 70 + hash2D(s, 12, 19) * 140;
    ctx.fillRect(rx, ry, 6, len);
    ctx.fillRect(rx + 26, ry + 10, 6, len * 0.9);
  }

  // Rumble strips themed by environment
  let curbA = '#00c46b';
  let curbB = '#f5b82e';
  if (style === 'karakorum_sky_pass') {
    curbA = '#fbbf24';
    curbB = '#f8fafc';
  } else if (style === 'cholistan_mirage_highway') {
    curbA = '#f97316';
    curbB = '#fef3c7';
  } else if (style === 'lahore_midnight_gp') {
    curbA = '#10b981';
    curbB = '#fbbf24';
  } else if (style === 'gwadar_port_docks') {
    curbA = '#0ea5e9';
    curbB = '#f97316';
  } else if (style === 'emerald_valley_loop') {
    curbA = '#34d399';
    curbB = '#e2e8f0';
  } else if (style === 'mountain_hairpin_pass') {
    curbA = '#10b981';
    curbB = '#f8fafc';
  } else if (isGp || style === 'mountain_touge') {
    curbA = '#ef4444';
    curbB = '#f8fafc';
  } else if (style === 'midnight_harbor_circuit') {
    curbA = '#06b6d4';
    curbB = '#fbbf24';
  } else if (isZigzag) {
    curbA = '#ff6b00';
    curbB = '#f8fafc';
  } else if (isWavy) {
    curbA = '#00f5d4';
    curbB = '#f59e0b';
  } else if (isWet) {
    curbA = '#e879f9';
    curbB = '#06b6d4';
  } else if (isPort) {
    curbA = '#f59e0b';
    curbB = '#18181b';
  } else if (isDesert) {
    curbA = '#ea580c';
    curbB = '#fef3c7';
  } else if (style === 'downtown_tunnels' || style === 'ring_road') {
    curbA = '#3b82f6';
    curbB = '#ef4444';
  }

  const rumbleSegs = 8;
  const segH = height / rumbleSegs;
  for (let i = 0; i < rumbleSegs; i++) {
    ctx.fillStyle = i % 2 === 0 ? curbA : curbB;
    ctx.fillRect(0, i * segH, 34, segH);
    ctx.fillRect(width - 34, i * segH, 34, segH);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(0, i * segH, 34, 4);
    ctx.fillRect(width - 34, i * segH, 34, 4);
  }

  // Edge solid lines (slightly weathered asphalt texture underneath)
  ctx.fillStyle = isWet || isWavy ? 'rgba(34, 211, 238, 0.92)' : isZigzag ? 'rgba(251, 191, 36, 0.92)' : 'rgba(232, 238, 247, 0.9)';
  ctx.fillRect(46, 0, 10, height);
  ctx.fillRect(width - 56, 0, 10, height);

  // Center line
  if (style === 'drag_strip') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(width * 0.5 - 9, 0, 18, height);
  } else {
    ctx.fillStyle = isGp ? 'rgba(248,250,252,0.62)' : 'rgba(245, 166, 35, 0.9)';
    ctx.fillRect(width * 0.5 - 11, 0, 7, height);
    ctx.fillRect(width * 0.5 + 4, 0, 7, height);
  }

  // Dashed lane lines
  ctx.fillStyle = isWet ? 'rgba(165, 243, 252, 0.84)' : 'rgba(235, 242, 255, 0.84)';
  const dashCount = 4;
  const dashStep = height / dashCount;
  for (let i = 0; i < dashCount; i++) {
    ctx.fillRect(width * 0.28 - 4, i * dashStep + 38, 8, dashStep * 0.48);
    ctx.fillRect(width * 0.72 - 4, i * dashStep + 38, 8, dashStep * 0.48);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  // High-res PBR roughness map (polished tire grooves + damp puddles vs coarse shoulder)
  const roughSize = 512;
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = roughSize;
  roughCanvas.height = roughSize;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = isWet ? '#303030' : isGp ? '#727272' : '#8a8a8a';
  rCtx.fillRect(0, 0, roughSize, roughSize);

  const rImg = rCtx.getImageData(0, 0, roughSize, roughSize);
  const rPx = rImg.data;
  for (let y = 0; y < roughSize; y++) {
    for (let x = 0; x < roughSize; x++) {
      const idx = (y * roughSize + x) * 4;
      const g = hash2D(x, y, 211);
      const vDelta = Math.round((g - 0.5) * (isWet ? 38 : 68));
      const val = Math.max(8, Math.min(248, rPx[idx] + vDelta));
      rPx[idx] = val;
      rPx[idx + 1] = val;
      rPx[idx + 2] = val;
    }
  }
  rCtx.putImageData(rImg, 0, 0);

  // Polished tire tracks in roughness (lower roughness = subtle sheen along wheel tracks)
  for (const cx of [roughSize * 0.24, roughSize * 0.41, roughSize * 0.59, roughSize * 0.76]) {
    const rGrad = rCtx.createLinearGradient(cx - 28, 0, cx + 28, 0);
    rGrad.addColorStop(0, 'rgba(40,40,40,0)');
    rGrad.addColorStop(0.5, isWet ? 'rgba(10,10,10,0.68)' : 'rgba(58,58,58,0.45)');
    rGrad.addColorStop(1, 'rgba(40,40,40,0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(cx - 28, 0, 56, roughSize);
  }

  if (isWet) {
    for (let p = 0; p < 18; p++) {
      const px = 48 + hash2D(p, 2, 99) * (roughSize - 96);
      const py = hash2D(p, 5, 99) * roughSize;
      const rad = 24 + hash2D(p, 7, 99) * 34;
      const rg = rCtx.createRadialGradient(px, py, 3, px, py, rad);
      rg.addColorStop(0, 'rgba(6,6,6,0.96)');
      rg.addColorStop(1, 'rgba(30,30,30,0)');
      rCtx.fillStyle = rg;
      rCtx.beginPath();
      rCtx.arc(px, py, rad, 0, Math.PI * 2);
      rCtx.fill();
    }
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  // Heightfield -> Sobel normal map for crisp asphalt pebble relief & flat puddles
  const normSize = 512;
  const heights = new Float32Array(normSize * normSize);
  for (let y = 0; y < normSize; y++) {
    for (let x = 0; x < normSize; x++) {
      const coarse = hash2D(Math.floor(x / 3), Math.floor(y / 3), 31);
      const fine = hash2D(x, y, 67);
      const seam =
        Math.abs(x - normSize * 0.25) < 2 ||
        Math.abs(x - normSize * 0.5) < 2 ||
        Math.abs(x - normSize * 0.75) < 2
          ? -0.35
          : 0;
      heights[y * normSize + x] = fine * 0.58 + coarse * 0.42 + seam;
    }
  }
  const normalMap = buildSobelNormalTexture(
    heights,
    normSize,
    isWet ? 0.55 : 1.05,
    maxAnisotropy,
    THREE.RepeatWrapping,
    THREE.RepeatWrapping,
  );

  return { map, roughnessMap, normalMap };
}

export function createConcretePbrTextures(
  maxAnisotropy: number,
  tintHex = '#4b5563',
): PbrTextureSet {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = hash2D(Math.floor(x / 8), Math.floor(y / 8), 11);
      const n2 = hash2D(x, y, 29);
      const panelEdge = x % 128 < 2 || y % 128 < 2 ? -18 : 0;
      const d = Math.round((n1 - 0.5) * 26 + (n2 - 0.5) * 14 + panelEdge);
      px[idx] = Math.max(0, Math.min(255, px[idx] + d));
      px[idx + 1] = Math.max(0, Math.min(255, px[idx + 1] + d));
      px[idx + 2] = Math.max(0, Math.min(255, px[idx + 2] + d));
      heights[y * size + x] = n1 * 0.6 + n2 * 0.4 + (panelEdge < 0 ? -0.35 : 0);
    }
  }
  ctx.putImageData(img, 0, 0);

  const rC = document.createElement('canvas');
  rC.width = 256;
  rC.height = 256;
  const rCtx = rC.getContext('2d')!;
  rCtx.fillStyle = '#c8c8c8';
  rCtx.fillRect(0, 0, 256, 256);
  const rImg = rCtx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 165 + Math.floor(hash2D(i % 256, Math.floor(i / 256), 55) * 65);
    rImg.data[i * 4] = v;
    rImg.data[i * 4 + 1] = v;
    rImg.data[i * 4 + 2] = v;
  }
  rCtx.putImageData(rImg, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rC);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  const normalMap = buildSobelNormalTexture(heights, size, 1.15, maxAnisotropy);
  return { map, roughnessMap, normalMap };
}

export function createRockCliffPbrTextures(
  maxAnisotropy: number,
  baseHex = '#5b4d42',
  strataHex = '#8a6f5a',
): PbrTextureSet {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = strataHex;
  for (let y = 0; y < size; y += 14) {
    ctx.globalAlpha = 0.08 + hash2D(y, 3, 19) * 0.22;
    ctx.fillRect(0, y, size, 4 + hash2D(y, 7, 19) * 10);
  }
  ctx.globalAlpha = 1;

  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const strata = Math.sin((y / size) * Math.PI * 18 + hash2D(Math.floor(x / 16), 2, 13) * 1.4);
      const ridge = hash2D(Math.floor(x / 6), Math.floor(y / 6), 88);
      const grit = hash2D(x, y, 47);
      const d = Math.round(strata * 16 + (ridge - 0.5) * 32 + (grit - 0.5) * 18);
      px[idx] = Math.max(0, Math.min(255, px[idx] + d));
      px[idx + 1] = Math.max(0, Math.min(255, px[idx + 1] + d));
      px[idx + 2] = Math.max(0, Math.min(255, px[idx + 2] + d));
      heights[y * size + x] = strata * 0.35 + ridge * 0.45 + grit * 0.2;
    }
  }
  ctx.putImageData(img, 0, 0);

  const rC = document.createElement('canvas');
  rC.width = 256;
  rC.height = 256;
  const rCtx = rC.getContext('2d')!;
  const rImg = rCtx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 195 + Math.floor(hash2D(i % 256, Math.floor(i / 256), 73) * 55);
    rImg.data[i * 4] = v;
    rImg.data[i * 4 + 1] = v;
    rImg.data[i * 4 + 2] = v;
    rImg.data[i * 4 + 3] = 255;
  }
  rCtx.putImageData(rImg, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rC);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  const normalMap = buildSobelNormalTexture(heights, size, 1.85, maxAnisotropy);
  return { map, roughnessMap, normalMap };
}

export function createSandDunePbrTextures(maxAnisotropy: number): PbrTextureSet {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c87228';
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const px = img.data;
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const ripple = Math.sin((y / size) * Math.PI * 36 + Math.sin((x / size) * Math.PI * 4) * 1.4);
      const grain = hash2D(x, y, 105);
      const d = Math.round(ripple * 14 + (grain - 0.5) * 16);
      px[idx] = Math.max(0, Math.min(255, px[idx] + d));
      px[idx + 1] = Math.max(0, Math.min(255, px[idx + 1] + Math.round(d * 0.82)));
      px[idx + 2] = Math.max(0, Math.min(255, px[idx + 2] + Math.round(d * 0.45)));
      heights[y * size + x] = ripple * 0.65 + grain * 0.35;
    }
  }
  ctx.putImageData(img, 0, 0);

  const rC = document.createElement('canvas');
  rC.width = 256;
  rC.height = 256;
  const rCtx = rC.getContext('2d')!;
  const rImg = rCtx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 205 + Math.floor(hash2D(i % 256, Math.floor(i / 256), 12) * 45);
    rImg.data[i * 4] = v;
    rImg.data[i * 4 + 1] = v;
    rImg.data[i * 4 + 2] = v;
    rImg.data[i * 4 + 3] = 255;
  }
  rCtx.putImageData(rImg, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rC);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  const normalMap = buildSobelNormalTexture(heights, size, 1.4, maxAnisotropy);
  return { map, roughnessMap, normalMap };
}

export function createFoliagePbrTextures(
  maxAnisotropy: number,
  baseHex = '#1f593b',
  highlightHex = '#378254',
): PbrTextureSet {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const heights = new Float32Array(size * size);
  for (let i = 0; i < 1600; i++) {
    const x = hash2D(i, 1, 9) * size;
    const y = hash2D(i, 2, 9) * size;
    const r = 3 + hash2D(i, 3, 9) * 7;
    ctx.fillStyle = i % 3 === 0 ? highlightHex : 'rgba(10, 32, 20, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.4, r * 0.6, hash2D(i, 4, 9) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      heights[y * size + x] = hash2D(Math.floor(x / 3), Math.floor(y / 3), 27);
    }
  }

  const rC = document.createElement('canvas');
  rC.width = 128;
  rC.height = 128;
  const rCtx = rC.getContext('2d')!;
  rCtx.fillStyle = '#c4c4c4';
  rCtx.fillRect(0, 0, 128, 128);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rC);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  const normalMap = buildSobelNormalTexture(heights, size, 1.3, maxAnisotropy);
  return { map, roughnessMap, normalMap };
}

export function createCarFlakeNormalTexture(): THREE.DataTexture {
  const size = 256;
  const heights = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    heights[i] = hash2D(i % size, Math.floor(i / size), 404);
  }
  return buildSobelNormalTexture(heights, size, 0.28, 4);
}

export function createLightPoolTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTruckArtTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c3b3e';
  ctx.fillRect(0, 0, 512, 256);

  const colors = ['#ffb703', '#fb5607', '#ff006e', '#00f5d4', '#8338ec'];
  const scallops = 16;
  const step = 512 / scallops;
  for (let i = 0; i < scallops; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(i * step + step * 0.5, 16, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors[(i + 2) % colors.length];
    ctx.beginPath();
    ctx.arc(i * step + step * 0.5, 240, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 34, 492, 188);

  const drawMandala = (cx: number, cy: number, r: number) => {
    for (let ring = 3; ring >= 1; ring--) {
      const petals = 12;
      ctx.fillStyle = ring === 3 ? '#ff006e' : ring === 2 ? '#ffb703' : '#00f5d4';
      for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          cx + Math.cos(a) * r * (ring * 0.28),
          cy + Math.sin(a) * r * (ring * 0.28),
          r * 0.22,
          r * 0.11,
          a,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  };

  drawMandala(115, 128, 64);
  drawMandala(397, 128, 64);

  ctx.fillStyle = '#e63946';
  ctx.fillRect(190, 74, 132, 108);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 5;
  ctx.strokeRect(190, 74, 132, 108);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAK', 256, 112);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('EXPRESS', 256, 146);

  ctx.fillStyle = '#e0fbfc';
  for (let x = 20; x < 500; x += 24) {
    ctx.beginPath();
    ctx.arc(x, 46, 3.5, 0, Math.PI * 2);
    ctx.arc(x, 210, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPoliceDecalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  // Tactical interceptor upper/lower bands
  ctx.fillStyle = '#090e1a';
  ctx.fillRect(0, 0, 512, 48);
  ctx.fillRect(0, 208, 512, 48);

  // High-visibility blue & gold interceptor stripes
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 48, 512, 12);
  ctx.fillRect(0, 196, 512, 12);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 60, 512, 5);
  ctx.fillRect(0, 191, 512, 5);

  ctx.fillStyle = '#090e1a';
  ctx.font = '900 78px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('POLICE', 256, 120);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText('HIGHWAY INTERCEPTOR · 911', 256, 166);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHighwaySignTexture(
  title: string,
  subtitle: string,
  maxAnisotropy: number,
  bgHex = '#065f46',
  borderHex = '#ffffff',
  subHex = '#fde68a',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 172);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(10, 10, 32, 14);
  ctx.fillRect(470, 10, 32, 14);
  ctx.fillRect(10, 168, 32, 14);
  ctx.fillRect(470, 168, 32, 14);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 76);

  ctx.fillStyle = subHex;
  ctx.font = 'bold 23px system-ui, sans-serif';
  ctx.fillText(subtitle, 256, 132);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBuildingFacadeTexture(
  accentColor: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0d1324';
  ctx.fillRect(0, 0, 256, 512);

  const cols = 8;
  const rows = 24;
  const padX = 6;
  const padY = 5;
  const cellW = 256 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const floorLitChance = 0.28 + Math.random() * 0.45;
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() < floorLitChance;
      if (lit) {
        const pick = Math.random();
        if (pick < 0.55) ctx.fillStyle = '#ffe5b0';
        else if (pick < 0.85) ctx.fillStyle = '#8ee7ff';
        else ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = '#151f38';
      }
      ctx.fillRect(
        c * cellW + padX,
        r * cellH + padY,
        cellW - padX * 2,
        cellH - padY * 2,
      );
    }
  }

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 256, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBoostPadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#051428';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(8, 0, 12, 256);
  ctx.fillRect(236, 0, 12, 256);

  const chevrons = [215, 145, 75];
  for (let idx = 0; idx < chevrons.length; idx++) {
    const y = chevrons[idx];
    ctx.strokeStyle = idx === 2 ? '#ffffff' : '#00f6ff';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(46, y + 36);
    ctx.lineTo(128, y - 28);
    ctx.lineTo(210, y + 36);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFinishBannerTexture(
  maxAnisotropy: number,
  subtitle = 'HIGH HEAT · NEON PURSUIT',
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const sq = 32;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#f4f7ff' : '#101420';
      ctx.fillRect(x * sq, y * sq, sq, sq);
    }
  }

  ctx.fillStyle = 'rgba(7, 11, 24, 0.92)';
  ctx.fillRect(76, 20, 360, 88);
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 5;
  ctx.strokeRect(76, 20, 360, 88);
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(82, 26, 348, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHEEMA COAST', 256, 52);

  ctx.fillStyle = '#ffb703';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(subtitle.toUpperCase(), 256, 82);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  // Crisp grounded chassis core + soft outer ambient-occlusion penumbra
  const grad = ctx.createRadialGradient(128, 128, 22, 128, 128, 124);
  grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.94)');
  grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.26)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getSkyPalette(style: EnvironmentStyle): {
  stops: Array<[number, string]>;
  sunColor: string;
  sunAlpha: number;
  sunX: number;
  sunY: number;
  stars: boolean;
  clouds: boolean;
  horizonGlow: string;
} {
  switch (style) {
    case 'alpine_gp':
      return {
        stops: [
          [0.0, '#134e80'],
          [0.38, '#2b77c2'],
          [0.68, '#7ab8f5'],
          [0.83, '#dff1ff'],
          [1.0, '#3e5347'],
        ],
        sunColor: '#fff8e1',
        sunAlpha: 0.95,
        sunX: 0.72,
        sunY: 0.24,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(224, 244, 255, 0.55)',
      };
    case 'drag_strip':
      return {
        stops: [
          [0.0, '#1a3a8a'],
          [0.36, '#0284c7'],
          [0.68, '#fcd34d'],
          [0.84, '#f59e0b'],
          [1.0, '#5a3a1e'],
        ],
        sunColor: '#fff3c4',
        sunAlpha: 0.95,
        sunX: 0.68,
        sunY: 0.28,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(253, 224, 130, 0.5)',
      };
    case 'desert_canyon':
    case 'desert_canyon_highway':
    case 'cholistan_mirage_highway':
      return {
        stops: [
          [0.0, '#230b20'],
          [0.32, '#7c2414'],
          [0.62, '#ea580c'],
          [0.81, '#fbbf24'],
          [1.0, '#451a03'],
        ],
        sunColor: '#ffd98a',
        sunAlpha: 0.98,
        sunX: 0.65,
        sunY: 0.34,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(255, 190, 90, 0.62)',
      };
    case 'mountain_touge':
      return {
        stops: [
          [0.0, '#04121c'],
          [0.35, '#0b2b3c'],
          [0.65, '#1e4d5c'],
          [0.83, '#5c838a'],
          [1.0, '#0f2027'],
        ],
        sunColor: '#cffafe',
        sunAlpha: 0.55,
        sunX: 0.32,
        sunY: 0.28,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(110, 210, 200, 0.28)',
      };
    case 'cyberpunk_rain':
      return {
        stops: [
          [0.0, '#03020d'],
          [0.36, '#17082e'],
          [0.66, '#4c1d95'],
          [0.84, '#0891b2'],
          [1.0, '#090915'],
        ],
        sunColor: '#38bdf8',
        sunAlpha: 0.45,
        sunX: 0.74,
        sunY: 0.32,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(34, 211, 238, 0.35)',
      };
    case 'industrial_port':
      return {
        stops: [
          [0.0, '#09090b'],
          [0.38, '#271710'],
          [0.66, '#7c2d12'],
          [0.84, '#ea580c'],
          [1.0, '#18181b'],
        ],
        sunColor: '#fdba74',
        sunAlpha: 0.78,
        sunX: 0.7,
        sunY: 0.36,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(251, 146, 60, 0.45)',
      };
    case 'zigzag_serpentine':
      return {
        stops: [
          [0.0, '#1a0912'],
          [0.36, '#6d1b1b'],
          [0.66, '#d97706'],
          [0.84, '#fbbf24'],
          [1.0, '#3f1408'],
        ],
        sunColor: '#fde68a',
        sunAlpha: 0.92,
        sunX: 0.64,
        sunY: 0.33,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(251, 146, 60, 0.52)',
      };
    case 'wavy_coaster':
      return {
        stops: [
          [0.0, '#040c24'],
          [0.34, '#0a244d'],
          [0.64, '#0e7490'],
          [0.83, '#00f5d4'],
          [1.0, '#091326'],
        ],
        sunColor: '#a5f3fc',
        sunAlpha: 0.62,
        sunX: 0.72,
        sunY: 0.28,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(0, 245, 212, 0.35)',
      };
    case 'mountain_hairpin_pass':
      return {
        stops: [
          [0.0, '#0b2540'],
          [0.34, '#1b5a72'],
          [0.68, '#4a989e'],
          [0.84, '#ccebe4'],
          [1.0, '#1e293b'],
        ],
        sunColor: '#fff7e0',
        sunAlpha: 0.9,
        sunX: 0.68,
        sunY: 0.26,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(186, 230, 253, 0.45)',
      };
    case 'midnight_harbor_circuit':
      return {
        stops: [
          [0.0, '#020617'],
          [0.36, '#091a38'],
          [0.68, '#0f3c68'],
          [0.84, '#06b6d4'],
          [1.0, '#06101f'],
        ],
        sunColor: '#bae6fd',
        sunAlpha: 0.48,
        sunX: 0.28,
        sunY: 0.28,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(56, 189, 248, 0.32)',
      };
    case 'karakorum_sky_pass':
      return {
        stops: [
          [0.0, '#0f2747'],
          [0.35, '#27537d'],
          [0.65, '#b46938'],
          [0.83, '#fde68a'],
          [1.0, '#362b26'],
        ],
        sunColor: '#ffe3a3',
        sunAlpha: 0.94,
        sunX: 0.7,
        sunY: 0.29,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(253, 210, 120, 0.52)',
      };
    case 'lahore_midnight_gp':
      return {
        stops: [
          [0.0, '#020512'],
          [0.38, '#091d24'],
          [0.68, '#064e3b'],
          [0.84, '#f59e0b'],
          [1.0, '#080e1a'],
        ],
        sunColor: '#fde68a',
        sunAlpha: 0.45,
        sunX: 0.72,
        sunY: 0.31,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(16, 185, 129, 0.32)',
      };
    case 'gwadar_port_docks':
      return {
        stops: [
          [0.0, '#071121'],
          [0.38, '#1a243b'],
          [0.66, '#8c3718'],
          [0.84, '#0ea5e9'],
          [1.0, '#0f172a'],
        ],
        sunColor: '#fdba74',
        sunAlpha: 0.72,
        sunX: 0.68,
        sunY: 0.35,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(251, 146, 60, 0.4)',
      };
    case 'emerald_valley_loop':
      return {
        stops: [
          [0.0, '#041a17'],
          [0.38, '#0b3b32'],
          [0.68, '#196452'],
          [0.84, '#6ee7b7'],
          [1.0, '#0b221e'],
        ],
        sunColor: '#d1fae5',
        sunAlpha: 0.65,
        sunX: 0.65,
        sunY: 0.29,
        stars: false,
        clouds: true,
        horizonGlow: 'rgba(110, 231, 183, 0.34)',
      };
    case 'downtown_tunnels':
    case 'ring_road':
      return {
        stops: [
          [0.0, '#020617'],
          [0.4, '#0f172a'],
          [0.7, '#1e293b'],
          [0.84, '#2563eb'],
          [1.0, '#090d16'],
        ],
        sunColor: '#93c5fd',
        sunAlpha: 0.42,
        sunX: 0.25,
        sunY: 0.27,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(59, 130, 246, 0.3)',
      };
    default:
      return {
        stops: [
          [0.0, '#040714'],
          [0.32, '#0d1636'],
          [0.52, '#2d1c4d'],
          [0.66, '#7a2b58'],
          [0.77, '#d45a48'],
          [0.84, '#f59c57'],
          [1.0, '#10182b'],
        ],
        sunColor: '#ffd296',
        sunAlpha: 0.85,
        sunX: 0.72,
        sunY: 0.35,
        stars: true,
        clouds: true,
        horizonGlow: 'rgba(245, 156, 87, 0.45)',
      };
  }
}

export function createEnvironmentSkyTexture(style: EnvironmentStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const palette = getSkyPalette(style);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  for (const [stop, col] of palette.stops) {
    grad.addColorStop(stop, col);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  if (palette.stars) {
    for (let i = 0; i < 160; i++) {
      const sx = hash2D(i, 1, 55) * 512;
      const sy = hash2D(i, 2, 55) * 195;
      const alpha = 0.25 + hash2D(i, 3, 55) * 0.65;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  // Soft solar / lunar corona & subtle atmospheric cloud bands
  if (palette.clouds) {
    for (let i = 0; i < 18; i++) {
      const cx = hash2D(i, 10, 77) * 512;
      const cy = 120 + hash2D(i, 11, 77) * 190;
      const rx = 55 + hash2D(i, 12, 77) * 90;
      const ry = 10 + hash2D(i, 13, 77) * 18;
      const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      cg.addColorStop(0, palette.horizonGlow);
      cg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createEnvironmentEquirectTexture(style: EnvironmentStyle): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const palette = getSkyPalette(style);

  // Equirectangular map: y=0 zenith, y=H*0.5 horizon, y=H nadir ground bounce
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  for (const [stop, col] of palette.stops) {
    // Remap sky stops cleanly to upper hemisphere + rich horizon reflection band
    grad.addColorStop(Math.min(0.98, stop * 0.62), col);
  }
  grad.addColorStop(0.56, palette.stops[palette.stops.length - 2]?.[1] ?? '#475569');
  grad.addColorStop(0.64, palette.stops[palette.stops.length - 1]?.[1] ?? '#111827');
  grad.addColorStop(1.0, '#0b0e14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Horizon specular glow ribbon for crisp automotive fender reflections
  const hGlow = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.56);
  hGlow.addColorStop(0, 'rgba(255,255,255,0)');
  hGlow.addColorStop(0.65, palette.horizonGlow);
  hGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hGlow;
  ctx.fillRect(0, H * 0.38, W, H * 0.18);

  // Soft cloud streaks in upper hemisphere
  for (let i = 0; i < 24; i++) {
    const cx = hash2D(i, 21, 91) * W;
    const cy = H * (0.12 + hash2D(i, 22, 91) * 0.32);
    const rx = 65 + hash2D(i, 23, 91) * 140;
    const cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
    cg.addColorStop(0, 'rgba(255,255,255,0.22)');
    cg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.22);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Intense solar / lunar key reflection disc so metallic clearcoat catches real highlights
  const sx = palette.sunX * W;
  const sy = palette.sunY * H;
  const corona = ctx.createRadialGradient(sx, sy, 4, sx, sy, 128);
  corona.addColorStop(0.0, `rgba(255, 255, 255, ${palette.sunAlpha})`);
  corona.addColorStop(0.18, palette.sunColor);
  corona.addColorStop(0.5, palette.horizonGlow);
  corona.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(sx, sy, 128, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

export const LOCKED_SPONSOR_PHOTO = abdullahCheemaLockedPhoto;
export const DEFAULT_BILLBOARD_PHOTO_URL = abdullahCheemaLockedPhoto;

export function paintAbdullahCheemaBillboardCanvas(
  canvas: HTMLCanvasElement,
  photoImg: HTMLImageElement | null,
): void {
  const W = 2048;
  const H = 1024;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark metallic architectural backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050814');
  bg.addColorStop(0.55, '#0b1224');
  bg.addColorStop(1, '#111936');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Diagonal subtle motorsport carbon sheen on right side
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let x = 960; x < W + 300; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 28, 0);
    ctx.lineTo(x - 190, H);
    ctx.lineTo(x - 218, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. Left Photo Frame (Aspect-Ratio Preserving Cover Crop, never squashed!)
  const pad = 42;
  const frameX = pad;
  const frameY = pad;
  const frameW = 970;
  const frameH = H - pad * 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();

  if (photoImg && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
    const iw = photoImg.naturalWidth;
    const ih = photoImg.naturalHeight;
    const scale = Math.max(frameW / iw, frameH / ih);
    const drawW = iw * scale;
    const drawH = ih * scale;
    const drawX = frameX + (frameW - drawW) * 0.5;
    // Slight top bias (0.18) keeps heads/faces & subject cleanly framed
    const drawY = frameY + (frameH - drawH) * 0.18;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.06) saturate(1.08)';
    ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
    ctx.filter = 'none';

    // Subtle right-edge blend vignette
    const fade = ctx.createLinearGradient(frameX + frameW - 140, 0, frameX + frameW, 0);
    fade.addColorStop(0, 'rgba(6, 10, 22, 0)');
    fade.addColorStop(1, 'rgba(6, 10, 22, 0.72)');
    ctx.fillStyle = fade;
    ctx.fillRect(frameX + frameW - 140, frameY, 140, frameH);
  } else {
    // Sleek crisp placeholder emblem while loading
    const pGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
    pGrad.addColorStop(0, '#0f172a');
    pGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = pGrad;
    ctx.fillRect(frameX, frameY, frameW, frameH);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 180px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AC', frameX + frameW * 0.5, frameY + frameH * 0.48);
  }
  ctx.restore();

  // Crisp gold & cyan photo frame border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(frameX + 10, frameY + 10, frameW - 20, frameH - 20);

  // 3. Right Side: Illuminated "ABDULLAH CHEEMA" Typography
  const rx = frameX + frameW + 58;
  const rw = W - rx - 48;
  const cx = rx + rw * 0.5;

  // M-Motorsport tricolor accent bar
  const stripeY = 128;
  ctx.fillStyle = '#00c8ff';
  ctx.fillRect(rx, stripeY, rw * 0.32, 16);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(rx + rw * 0.34, stripeY, rw * 0.32, 16);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(rx + rw * 0.68, stripeY, rw * 0.32, 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICIAL CIRCUIT SPONSOR', cx, 215);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 144px system-ui, sans-serif';
  ctx.fillText('ABDULLAH', cx, 395);

  ctx.shadowColor = 'rgba(245, 158, 11, 0.55)';
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 162px system-ui, sans-serif';
  ctx.fillText('CHEEMA', cx, 565);
  ctx.restore();

  // Gold horizontal divider
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(rx + 40, 675, rw - 80, 6);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 46px system-ui, sans-serif';
  ctx.fillText('CHEEMA COAST · HIGH HEAT', cx, 765);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText('100M EXPRESSWAY SECTOR · FULL THROTTLE', cx, 855);

  // Outer Billboard Neon Rim
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, W - 24, H - 24);
}

export function createAbdullahCheemaBillboardTexture(
  photoImg: HTMLImageElement | null,
  maxAnisotropy: number,
  existingTexture?: THREE.CanvasTexture,
): THREE.CanvasTexture {
  const canvas = existingTexture
    ? (existingTexture.image as HTMLCanvasElement)
    : document.createElement('canvas');

  paintAbdullahCheemaBillboardCanvas(canvas, photoImg);

  if (existingTexture) {
    existingTexture.needsUpdate = true;
    return existingTexture;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createTurnChevronTexture(
  direction: 'LEFT' | 'RIGHT',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const offset of [-58, 0, 58]) {
    const cx = 128 + offset;
    ctx.beginPath();
    if (direction === 'RIGHT') {
      ctx.moveTo(cx - 18, 28);
      ctx.lineTo(cx + 16, 64);
      ctx.lineTo(cx - 18, 100);
    } else {
      ctx.moveTo(cx + 18, 28);
      ctx.lineTo(cx - 16, 64);
      ctx.lineTo(cx + 18, 100);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCockpitClusterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, 512, 192);

  // Outer bezel
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 184);

  // Left & Right digital arc tachometers
  const drawGauge = (cx: number, cy: number, col: string, label: string) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 56, Math.PI * 0.8, Math.PI * 2.2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 56, Math.PI * 0.8, Math.PI * 1.9);
    ctx.strokeStyle = col;
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '800 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 36);
  };

  drawGauge(96, 100, '#00f0ff', 'RPM x1000');
  drawGauge(416, 100, '#f59e0b', 'BOOST PSI');

  // Center telemetry readout bars
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(182, 32, 148, 128);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(182, 32, 148, 128);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPORT+ MODE', 256, 62);

  ctx.fillStyle = '#10b981';
  ctx.fillRect(202, 86, 108, 12);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(202, 108, 84, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(202, 130, 56, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
