import * as THREE from 'three';
import { createCarFlakeNormalTexture } from './textures';
import { CameraMode, CarColorPreset, VehicleBodyStyle, VehicleSpec } from './types';

let sharedFlakeNormalTex: THREE.DataTexture | null = null;
function getFlakeNormalTexture(): THREE.DataTexture {
  if (!sharedFlakeNormalTex) {
    sharedFlakeNormalTex = createCarFlakeNormalTexture();
  }
  return sharedFlakeNormalTex;
}

export interface CarModelRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  paintMaterial: THREE.MeshPhysicalMaterial;
  accentMaterial: THREE.MeshStandardMaterial;
  brakeLightMat: THREE.MeshStandardMaterial;
  setPaintColor: (hex: number, accentHex: number, finish?: CarColorPreset['finish']) => void;
  setNeonColor: (accentHex: number) => void;
  setWheelFinish: (hex: number, metalness: number, roughness: number) => void;
  setTruckArtEnabled: (enabled: boolean) => void;
  setCameraMode: (mode: CameraMode) => void;
  setDamageLevel: (dmg01: number) => void;
  updateVisuals: (params: {
    dt: number;
    speed: number;
    steerAngle: number;
    bodyRoll: number;
    bodyPitch: number;
    isBraking: boolean;
    isBoosting: boolean;
    elapsed: number;
  }) => void;
  dispose: () => void;
}

export interface CarModelOptions {
  vehicleSpec?: VehicleSpec;
  isPolice?: boolean;
  isGhost?: boolean;
  truckArtEnabled?: boolean;
  truckArtTexture?: THREE.Texture;
  policeDecalTexture?: THREE.Texture;
  cockpitClusterTexture?: THREE.Texture;
  wheelHex?: number;
  wheelMetalness?: number;
  wheelRoughness?: number;
}

export function createVehicleModel(
  paintHex: number,
  accentHex: number,
  contactShadowTexture: THREE.Texture,
  options: CarModelOptions = {},
): CarModelRig {
  const spec = options.vehicleSpec;
  const style: VehicleBodyStyle = spec?.bodyStyle ?? 'italian_v12';
  const isBike = spec?.isBike ?? false;
  const isPolice = Boolean(options.isPolice);
  const isGhost = Boolean(options.isGhost);

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const flakeNormalMap = isGhost ? null : getFlakeNormalTexture();

  const paintMaterial = trackMat(
    isGhost
      ? new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.4,
          metalness: 0.2,
          roughness: 0.2,
          transparent: true,
          opacity: 0.42,
        })
      : new THREE.MeshPhysicalMaterial({
          color: paintHex,
          metalness: 0.88,
          roughness: 0.16,
          clearcoat: 1.0,
          clearcoatRoughness: 0.055,
          ior: 1.52,
          reflectivity: 0.96,
          envMapIntensity: 2.25,
          normalMap: flakeNormalMap,
          normalScale: new THREE.Vector2(0.055, 0.055),
        }),
  );

  // Realistic anodized/painted trim instead of glowing toy-neon stripes
  const accentMaterial = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: accentHex,
      metalness: 0.78,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      emissive: accentHex,
      emissiveIntensity: isGhost ? 1.8 : 0.06,
      envMapIntensity: 1.8,
      transparent: isGhost,
      opacity: isGhost ? 0.65 : 1,
    }),
  );

  const carbonMaterial = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: isGhost ? 0x0ea5e9 : 0x13161e,
      metalness: 0.36,
      roughness: 0.42,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.35,
      transparent: isGhost,
      opacity: isGhost ? 0.35 : 1,
    }),
  );

  const glassMaterial = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: isGhost ? 0x67e8f9 : 0x050b14,
      metalness: 0.12,
      roughness: 0.03,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      ior: 1.52,
      reflectivity: 1.0,
      transparent: true,
      opacity: isGhost ? 0.28 : 0.84,
      envMapIntensity: 2.35,
    }),
  );

  const tireMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x14161a,
      metalness: 0.04,
      roughness: 0.88,
      transparent: isGhost,
      opacity: isGhost ? 0.45 : 1,
    }),
  );

  const rimMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: options.wheelHex ?? 0xdde4ef,
      metalness: options.wheelMetalness ?? 0.94,
      roughness: options.wheelRoughness ?? 0.16,
      envMapIntensity: 2.1,
      transparent: isGhost,
      opacity: isGhost ? 0.55 : 1,
    }),
  );

  const rotorMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x717d8c,
      metalness: 0.88,
      roughness: 0.32,
      envMapIntensity: 1.6,
    }),
  );

  const caliperMaterial = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: accentHex,
      metalness: 0.45,
      roughness: 0.26,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    }),
  );

  const drlMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf4f9ff,
      emissive: 0xe6f6ff,
      emissiveIntensity: 2.35,
      roughness: 0.08,
    }),
  );

  const headlightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeaf8ff,
      emissiveIntensity: 3.6,
      roughness: 0.06,
    }),
  );

  const headlightDimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeaf8ff,
      emissiveIntensity: 3.6,
      roughness: 0.06,
    }),
  );

  const brakeLightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xff1c36,
      emissive: 0xff1028,
      emissiveIntensity: 1.85,
      roughness: 0.14,
    }),
  );

  // Subtle ground-tucked underbody shadow accent (no loud toy neon outlines)
  const underglowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: isGhost ? 1.5 : 0.35,
      roughness: 0.25,
      metalness: 0.45,
      transparent: isGhost,
      opacity: isGhost ? 0.55 : 1,
    }),
  );

  let decalMesh: THREE.Mesh | null = null;
  let stripeFallbackMesh: THREE.Mesh | null = null;
  let policeRedMat: THREE.MeshStandardMaterial | null = null;
  let policeBlueMat: THREE.MeshStandardMaterial | null = null;
  let policeTakedownMat: THREE.MeshStandardMaterial | null = null;

  const flamesList: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }> = [];
  const wheelSpins: THREE.Group[] = [];
  const frontWheelPivots: THREE.Group[] = [];
  const canopyHideMeshes: THREE.Object3D[] = [];
  let steeringPivot: THREE.Group | null = null;
  let cockpitGroup: THREE.Group | null = null;

  // Damageable mesh references + baseline transforms
  const damageRefs: Array<{
    obj: THREE.Object3D;
    baseY: number;
    baseZ: number;
    baseRotX: number;
    baseRotZ: number;
    dropY: number;
    tiltX: number;
    tiltZ: number;
  }> = [];

  const registerDamagePart = (
    obj: THREE.Object3D,
    dropY: number,
    tiltX: number,
    tiltZ: number,
  ) => {
    damageRefs.push({
      obj,
      baseY: obj.position.y,
      baseZ: obj.position.z,
      baseRotX: obj.rotation.x,
      baseRotZ: obj.rotation.z,
      dropY,
      tiltX,
      tiltZ,
    });
  };

  let currentDamage = 0;
  let currentCamMode: CameraMode = 'CHASE';
  let wheelRadius = 0.37;

  // Cockpit dash cluster material
  const dashScreenMat = options.cockpitClusterTexture
    ? trackMat(
        new THREE.MeshStandardMaterial({
          map: options.cockpitClusterTexture,
          emissiveMap: options.cockpitClusterTexture,
          emissive: 0xffffff,
          emissiveIntensity: 1.05,
          roughness: 0.25,
        }),
      )
    : trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.9,
        }),
      );

  if (isBike) {
    // =========================================================================
    // MODERN SUPERBIKE + AERODYNAMIC RIDER (3 distinct styles)
    // =========================================================================
    wheelRadius = 0.34;
    const isHayabusa = style === 'cyber_moto';
    const isH2R = style === 'streetfighter';
    const isBmwBike = style === 'bmw_s1000rr';
    const isR1M = style === 'yamaha_yzf_r1m';
    const isAprilia = style === 'aprilia_rsv4_factory';
    const isPanigale = !isHayabusa && !isH2R && !isBmwBike && !isR1M && !isAprilia;
    const showBikeWinglets = spec?.threeD ? spec.threeD.hasAeroWinglets : !isR1M;

    const bikeWheelGeo = trackGeo(new THREE.TorusGeometry(0.275, 0.085, 14, 28));
    bikeWheelGeo.rotateY(Math.PI / 2);
    const bikeRimGeo = trackGeo(new THREE.CylinderGeometry(0.205, 0.205, 0.13, 20));
    bikeRimGeo.rotateZ(Math.PI / 2);
    const bikeRotorGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.025, 18));
    bikeRotorGeo.rotateZ(Math.PI / 2);
    const spokeGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.028, 0.4));

    const makeBikeWheel = (zPos: number, isFront: boolean) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, wheelRadius, zPos);
      const spin = new THREE.Group();
      pivot.add(spin);

      const tire = new THREE.Mesh(bikeWheelGeo, tireMaterial);
      tire.castShadow = !isGhost;
      spin.add(tire);

      const rim = new THREE.Mesh(bikeRimGeo, rimMaterial);
      spin.add(rim);
      const rotor = new THREE.Mesh(bikeRotorGeo, rotorMaterial);
      rotor.position.x = isFront ? -0.07 : 0.07;
      spin.add(rotor);
      for (let i = 0; i < (isH2R ? 6 : 5); i++) {
        const sp = new THREE.Mesh(spokeGeo, rimMaterial);
        sp.rotation.x = (i * Math.PI) / (isH2R ? 6 : 5);
        spin.add(sp);
      }
      const bikeRingGeo = trackGeo(
        new THREE.TorusGeometry(0.212, isHayabusa ? 0.016 : 0.012, 8, 28),
      );
      bikeRingGeo.rotateY(Math.PI / 2);
      for (const rx of [-0.068, 0.068]) {
        const bikeRing = new THREE.Mesh(bikeRingGeo, rimMaterial);
        bikeRing.position.x = rx;
        spin.add(bikeRing);
      }
      // Stationary brake caliper clamped onto rotor
      const bikeCaliperGeo = trackGeo(new THREE.BoxGeometry(0.048, 0.09, 0.07));
      const bikeCaliper = new THREE.Mesh(bikeCaliperGeo, caliperMaterial);
      bikeCaliper.position.set(isFront ? -0.078 : 0.078, 0.05, isFront ? -0.115 : 0.115);
      pivot.add(bikeCaliper);

      bodyGroup.add(pivot);
      wheelSpins.push(spin);
      if (isFront) frontWheelPivots.push(pivot);
    };

    makeBikeWheel(isHayabusa ? -0.98 : -0.94, true);
    makeBikeWheel(isHayabusa ? 0.98 : 0.94, false);

    // Sculpted Frame (H2R Exposed Trellis Frame vs Panigale Monocoque vs Hayabusa Twin-Spar)
    const frameGeo = trackGeo(new THREE.BoxGeometry(0.3, 0.32, 1.28));
    const frame = new THREE.Mesh(frameGeo, isH2R ? accentMaterial : carbonMaterial);
    frame.position.set(0, 0.56, 0.02);
    frame.castShadow = !isGhost;
    bodyGroup.add(frame);

    if (isH2R) {
      // Exposed Kawasaki H2R steel trellis frame struts + supercharger intake plenum
      const strutGeo = trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8));
      for (const sx of [-0.19, 0.19]) {
        const t1 = new THREE.Mesh(strutGeo, accentMaterial);
        t1.position.set(sx, 0.62, -0.18);
        t1.rotation.x = 0.85;
        const t2 = new THREE.Mesh(strutGeo, accentMaterial);
        t2.position.set(sx, 0.62, 0.14);
        t2.rotation.x = -0.85;
        bodyGroup.add(t1, t2);
      }
    }

    const engineGeo = trackGeo(new THREE.CylinderGeometry(0.17, 0.19, 0.36, 10));
    engineGeo.rotateZ(Math.PI / 2);
    const engine = new THREE.Mesh(engineGeo, rotorMaterial);
    engine.position.set(0, 0.46, -0.06);
    bodyGroup.add(engine);

    const swingGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.11, isHayabusa ? 0.84 : 0.76));
    const swing = new THREE.Mesh(swingGeo, rimMaterial);
    swing.position.set(0, 0.37, isHayabusa ? 0.62 : 0.58);
    bodyGroup.add(swing);

    // USD Front Forks + Fender
    const forkGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.82, 10));
    for (const sx of [-0.115, 0.115]) {
      const fork = new THREE.Mesh(forkGeo, isPanigale ? accentMaterial : rimMaterial);
      fork.position.set(sx, 0.69, -0.78);
      fork.rotation.x = -0.38;
      bodyGroup.add(fork);
    }

    const fenderGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12, 1, false, -0.8, 1.6));
    fenderGeo.rotateZ(Math.PI / 2);
    const frontFender = new THREE.Mesh(fenderGeo, isHayabusa ? paintMaterial : carbonMaterial);
    frontFender.position.set(0, 0.38, isHayabusa ? -0.98 : -0.94);
    bodyGroup.add(frontFender);

    // Sculpted Fuel Tank
    const tankShape = new THREE.Shape();
    tankShape.moveTo(-0.46, 0.72);
    tankShape.quadraticCurveTo(-0.34, 1.07, 0.02, 1.04);
    tankShape.quadraticCurveTo(0.36, 0.98, 0.46, 0.78);
    tankShape.lineTo(-0.46, 0.72);
    const tankGeo = trackGeo(
      new THREE.ExtrudeGeometry(tankShape, {
        depth: isHayabusa ? 0.42 : 0.36,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.06,
        bevelSegments: 3,
        curveSegments: 12,
      }),
    );
    tankGeo.translate(0, 0, isHayabusa ? -0.21 : -0.18);
    tankGeo.rotateY(-Math.PI / 2);
    const tank = new THREE.Mesh(tankGeo, paintMaterial);
    tank.position.set(0, 0, -0.14);
    tank.castShadow = !isGhost;
    bodyGroup.add(tank);

    // Aerodynamic Front Nose Fairing + Windscreen (all superbikes have full sculpted race fairings)
    const noseShape = new THREE.Shape();
    if (isHayabusa) {
      // Iconic streamlined Hayabusa bulbous aero cowl
      noseShape.moveTo(-1.22, 0.62);
      noseShape.quadraticCurveTo(-0.92, 1.08, -0.34, 1.1);
      noseShape.lineTo(-0.26, 0.56);
      noseShape.closePath();
    } else if (isH2R || isR1M) {
      // Razor-sharp Kawasaki H2R / Yamaha R1M angular ram-air nose
      noseShape.moveTo(-1.18, 0.68);
      noseShape.lineTo(-0.84, 1.04);
      noseShape.lineTo(-0.36, 1.05);
      noseShape.lineTo(-0.32, 0.56);
      noseShape.closePath();
    } else {
      // Ducati Panigale / BMW S1000RR / Aprilia RSV4 sculpted fairing
      noseShape.moveTo(-1.14, 0.66);
      noseShape.quadraticCurveTo(-0.86, 1.02, -0.38, 1.06);
      noseShape.lineTo(-0.32, 0.56);
      noseShape.closePath();
    }
    const fairingW = isHayabusa ? 0.46 : isR1M ? 0.37 : 0.39;
    const fairingGeo = trackGeo(
      new THREE.ExtrudeGeometry(noseShape, {
        depth: fairingW,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.05,
        bevelSegments: 3,
        curveSegments: 12,
      }),
    );
    fairingGeo.translate(0, 0, -fairingW * 0.5);
    fairingGeo.rotateY(-Math.PI / 2);
    const fairing = new THREE.Mesh(fairingGeo, isH2R || isR1M ? carbonMaterial : paintMaterial);
    fairing.castShadow = !isGhost;
    bodyGroup.add(fairing);
    registerDamagePart(fairing, -0.06, 0.09, -0.05);

    // Tall Smoked Race Windscreen
    const windGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.26, 0.44, 12, 1, false, -0.9, 1.8));
    const wind = new THREE.Mesh(windGeo, glassMaterial);
    wind.position.set(0, 1.09, -0.68);
    wind.rotation.x = 0.85;
    bodyGroup.add(wind);

    // Distinct Aero Winglets & Fairing Vents
    if (showBikeWinglets && isH2R) {
      // Twin Upper Mirror-Mount + Lower Carbon Downforce Winglets
      const wingUpper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.84, 0.028, 0.16)), carbonMaterial);
      wingUpper.position.set(0, 0.96, -0.82);
      const wingLower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.032, 0.18)), carbonMaterial);
      wingLower.position.set(0, 0.72, -0.92);
      bodyGroup.add(wingUpper, wingLower);
    } else if (showBikeWinglets && (isPanigale || isBmwBike || isAprilia)) {
      // Biplane Side Winglets + Side Shark-Gill Vents
      const winglet = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(isBmwBike ? 0.78 : 0.72, 0.032, 0.18)),
        isAprilia ? accentMaterial : carbonMaterial,
      );
      winglet.position.set(0, 0.76, -0.88);
      bodyGroup.add(winglet);
      const gillGeo = trackGeo(new THREE.BoxGeometry(0.45, 0.04, 0.22));
      for (const gy of [0.68, 0.76]) {
        const gill = new THREE.Mesh(gillGeo, carbonMaterial);
        gill.position.set(0, gy, -0.52);
        bodyGroup.add(gill);
      }
      if (isBmwBike) {
        // BMW S1000RR asymmetric M radiator louver blades
        const mBlade = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.12, 0.28)), accentMaterial);
        mBlade.position.set(0, 0.62, -0.34);
        bodyGroup.add(mBlade);
      }
    } else if (isR1M) {
      // Yamaha YZF-R1M M1-style central ram-air nose duct & brushed silver alloy swingarm trim
      const ramDuct = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.1, 0.16)), carbonMaterial);
      ramDuct.position.set(0, 0.84, -1.1);
      bodyGroup.add(ramDuct);
    } else if (isHayabusa) {
      // Signature Hayabusa Rounded Aero Tail Hump
      const hump = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.21, 14, 10)).scale(0.9, 0.65, 1.75),
        paintMaterial,
      );
      hump.position.set(0, 0.94, 0.76);
      bodyGroup.add(hump);
    }

    // Upswept Tail Cowl + Rider Saddle
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0.28, 0.76);
    tailShape.lineTo(1.14, 1.04);
    tailShape.lineTo(1.18, 0.94);
    tailShape.lineTo(0.45, 0.68);
    tailShape.closePath();
    const tailGeo = trackGeo(
      new THREE.ExtrudeGeometry(tailShape, {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
      }),
    );
    tailGeo.translate(0, 0, -0.14);
    tailGeo.rotateY(-Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, paintMaterial);
    tail.castShadow = !isGhost;
    bodyGroup.add(tail);

    const seatGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.08, 0.46));
    const seat = new THREE.Mesh(seatGeo, carbonMaterial);
    seat.position.set(0, 0.82, 0.26);
    bodyGroup.add(seat);

    // Bike Cockpit Assembly (Clip-on Handlebars + TFT Dash Cluster)
    cockpitGroup = new THREE.Group();
    cockpitGroup.position.set(0, 0.96, -0.58);
    const tftBezelGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.12, 0.04));
    const tftBezel = new THREE.Mesh(tftBezelGeo, carbonMaterial);
    tftBezel.position.set(0, 0.06, -0.06);
    tftBezel.rotation.x = -0.52;
    const tftScreenGeo = trackGeo(new THREE.PlaneGeometry(0.21, 0.095));
    const tftScreen = new THREE.Mesh(tftScreenGeo, dashScreenMat);
    tftScreen.position.set(0, 0.063, -0.038);
    tftScreen.rotation.x = -0.52;
    cockpitGroup.add(tftBezel, tftScreen);

    steeringPivot = new THREE.Group();
    steeringPivot.position.set(0, 0.02, 0.02);
    const clipBarGeo = trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.68, 8));
    clipBarGeo.rotateZ(Math.PI / 2);
    const clipBar = new THREE.Mesh(clipBarGeo, carbonMaterial);
    const gripGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 8));
    gripGeo.rotateZ(Math.PI / 2);
    const gripL = new THREE.Mesh(gripGeo, accentMaterial);
    gripL.position.set(-0.3, 0, 0);
    const gripR = new THREE.Mesh(gripGeo, accentMaterial);
    gripR.position.set(0.3, 0, 0);
    steeringPivot.add(clipBar, gripL, gripR);
    cockpitGroup.add(steeringPivot);
    bodyGroup.add(cockpitGroup);

    // Truck-art decal strip on tank/fairing
    if (!isPolice && !isGhost && options.truckArtTexture) {
      const dMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: options.truckArtTexture,
          roughness: 0.24,
          emissiveMap: options.truckArtTexture,
          emissive: 0xffffff,
          emissiveIntensity: 0.24,
        }),
      );
      const dGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.025, 0.52));
      decalMesh = new THREE.Mesh(dGeo, dMat);
      decalMesh.position.set(0, 1.07, -0.18);
      decalMesh.rotation.x = 0.08;
      decalMesh.visible = options.truckArtEnabled !== false;
      bodyGroup.add(decalMesh);
    }

    // Side Fairing Trim + Carbon Belly Pan
    const trimGeo = trackGeo(new THREE.BoxGeometry(0.5, 0.055, 0.85));
    const trim = new THREE.Mesh(trimGeo, accentMaterial);
    trim.position.set(0, 0.66, -0.14);
    const bellyPanGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.035, 1.05));
    const bellyPan = new THREE.Mesh(bellyPanGeo, carbonMaterial);
    bellyPan.position.set(0, 0.36, -0.02);
    bodyGroup.add(trim, bellyPan);

    // Crisp White LED Headlight Projectors, DRLs & Ruby Tail Light
    const hlGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.07, 0.09));
    const hl = new THREE.Mesh(hlGeo, headlightMat);
    hl.position.set(0, 0.82, -1.11);
    const drlBladeGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.022, 0.08));
    for (const sx of [-0.13, 0.13]) {
      const drl = new THREE.Mesh(drlBladeGeo, drlMat);
      drl.position.set(sx, 0.72, -1.1);
      bodyGroup.add(drl);
    }
    const tlGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.06, 0.07));
    const tl = new THREE.Mesh(tlGeo, brakeLightMat);
    tl.position.set(0, 1.0, 1.15);
    bodyGroup.add(hl, tl);

    // Titanium Muffler + Nitro Flame
    const exhGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.075, 0.56, 12));
    exhGeo.rotateX(Math.PI / 2);
    const exh = new THREE.Mesh(exhGeo, rimMaterial);
    exh.position.set(0.22, 0.52, 0.86);
    exh.rotation.x = 0.22;
    bodyGroup.add(exh);

    const flameGeo = trackGeo(new THREE.ConeGeometry(0.14, 1.4, 10));
    flameGeo.rotateX(Math.PI / 2);
    flameGeo.translate(0, 0, 0.7);
    const fMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x22e8ff,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const flame = new THREE.Mesh(flameGeo, fMat);
    flame.position.set(0.22, 0.56, 1.14);
    flame.visible = false;
    bodyGroup.add(flame);
    flamesList.push({ mesh: flame, mat: fMat });

    // Sculpted 3D Rider (hidden in COCKPIT mode so view is clear!)
    const suitMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: isPolice ? 0x0f172a : 0x151b2b,
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 0.2,
        transparent: isGhost,
        opacity: isGhost ? 0.5 : 1,
      }),
    );
    const helmetMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: isPolice ? 0xf8fafc : isHayabusa ? 0x06b6d4 : isH2R ? 0x10b981 : 0xf59e0b,
        metalness: 0.6,
        roughness: 0.12,
        clearcoat: 1.0,
        transparent: isGhost,
        opacity: isGhost ? 0.55 : 1,
      }),
    );

    const torsoGeo = trackGeo(new THREE.CapsuleGeometry(0.19, 0.38, 6, 12));
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 1.14, 0.14);
    torso.rotation.x = 0.96;
    torso.castShadow = !isGhost;
    bodyGroup.add(torso);
    canopyHideMeshes.push(torso);

    const aeroHumpGeo = trackGeo(new THREE.ConeGeometry(0.14, 0.34, 8));
    aeroHumpGeo.rotateX(Math.PI / 2);
    const aeroHump = new THREE.Mesh(aeroHumpGeo, accentMaterial);
    aeroHump.position.set(0, 1.24, 0.24);
    aeroHump.rotation.x = 0.22;
    bodyGroup.add(aeroHump);
    canopyHideMeshes.push(aeroHump);

    const helmetGeo = trackGeo(new THREE.SphereGeometry(0.17, 16, 14));
    helmetGeo.scale(0.95, 1.02, 1.16);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 1.32, -0.26);
    helmet.castShadow = !isGhost;
    bodyGroup.add(helmet);
    canopyHideMeshes.push(helmet);

    const visorGeo = trackGeo(new THREE.SphereGeometry(0.155, 14, 10, 0, Math.PI, 0.35, 0.7));
    const visor = new THREE.Mesh(visorGeo, isHayabusa ? accentMaterial : glassMaterial);
    visor.position.copy(helmet.position);
    visor.rotation.y = Math.PI / 2;
    bodyGroup.add(visor);
    canopyHideMeshes.push(visor);

    const armGeo = trackGeo(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8));
    const legGeo = trackGeo(new THREE.CapsuleGeometry(0.075, 0.34, 4, 8));
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, suitMat);
      arm.position.set(sx * 0.24, 1.06, -0.3);
      arm.rotation.x = 1.15;
      arm.rotation.z = sx * -0.25;
      bodyGroup.add(arm);
      canopyHideMeshes.push(arm);

      const leg = new THREE.Mesh(legGeo, suitMat);
      leg.position.set(sx * 0.2, 0.72, 0.16);
      leg.rotation.x = -0.58;
      bodyGroup.add(leg);
    }

    if (isPolice) {
      policeRedMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xff1e38,
          emissive: 0xff1128,
          emissiveIntensity: 5.5,
          roughness: 0.1,
        }),
      );
      policeBlueMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x1e90ff,
          emissive: 0x0088ff,
          emissiveIntensity: 5.5,
          roughness: 0.1,
        }),
      );
      const beaconGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.1, 0.14));
      const rB = new THREE.Mesh(beaconGeo, policeRedMat);
      rB.position.set(-0.18, 1.07, 1.02);
      const bB = new THREE.Mesh(beaconGeo, policeBlueMat);
      bB.position.set(0.18, 1.07, 1.02);
      bodyGroup.add(rB, bB);
    }

    const shadowGeo = trackGeo(new THREE.PlaneGeometry(1.45, 3.05));
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: isGhost ? 0.2 : 0.74,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = 0.022;
    root.add(shadowPlane);
  } else {
    // =========================================================================
    // 17 DISTINCT MODERN-AGE SCULPTED CAR / F1 / TRUCK / SUV / COUPE SHAPES
    // =========================================================================
    const isFormula = style === 'f1_formula';
    const isPickup = style === 'pickup_truck';
    const isLuxurySuv = style === 'luxury_suv';
    const is4x4 = style === 'beast_4x4';
    const isTallTruck = is4x4 || isPickup || isLuxurySuv;
    const isHellcat = style === 'dodge_challenger_hellcat';
    const isMuscle = style === 'v8_muscle' || isHellcat;
    const isM4 = style === 'bmw_m4_competition';
    const isSedan = style === 'sport_sedan' || isM4;
    const isGtCoupe = style === 'gt_coupe';
    const isRally = style === 'rally_hatch';
    const isConvertible = style === 'convertible';
    const isWagon = style === 'sport_wagon';
    const isJdm = style === 'skyline_r34' || style === 'supra_mk4' || style === 'rx7_rotary';
    const isChiron = style === 'chiron_w16';
    const isKoenig = style === 'koenig_mega';
    const isHyper =
      style === 'italian_v12' ||
      style === 'koenig_mega' ||
      style === 'chiron_w16' ||
      style === 'v8_mid';

    wheelRadius = is4x4 || isPickup ? 0.48 : isLuxurySuv ? 0.44 : isFormula ? 0.38 : 0.37;
    const wheelWidth = is4x4 || isPickup ? 0.36 : isFormula ? 0.35 : 0.28;
    const groundLift = is4x4 || isPickup ? 0.18 : isLuxurySuv ? 0.14 : 0;

    if (isFormula) {
      // -----------------------------------------------------------------------
      // OPEN-WHEEL FORMULA GP-1 CAR
      // -----------------------------------------------------------------------
      const tubProfile = new THREE.Shape();
      tubProfile.moveTo(-2.46, 0.22);
      tubProfile.lineTo(-2.44, 0.34);
      tubProfile.quadraticCurveTo(-1.7, 0.52, -1.04, 0.58);
      tubProfile.lineTo(-0.34, 0.56);
      tubProfile.lineTo(-0.22, 0.46);
      tubProfile.lineTo(0.08, 0.54);
      tubProfile.lineTo(0.16, 1.02);
      tubProfile.quadraticCurveTo(0.75, 0.94, 1.44, 0.68);
      tubProfile.lineTo(2.16, 0.42);
      tubProfile.lineTo(2.14, 0.22);
      tubProfile.closePath();

      const tubGeo = trackGeo(
        new THREE.ExtrudeGeometry(tubProfile, {
          depth: 0.54,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.05,
          bevelSegments: 3,
          curveSegments: 14,
        }),
      );
      tubGeo.translate(0, 0, -0.27);
      tubGeo.rotateY(-Math.PI / 2);
      tubGeo.computeVertexNormals();
      const tubMesh = new THREE.Mesh(tubGeo, paintMaterial);
      tubMesh.castShadow = !isGhost;
      tubMesh.receiveShadow = true;
      bodyGroup.add(tubMesh);

      // Sculpted Sidepods + Radiator Intakes
      const podGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.34, 1.64));
      const intakeMouthGeo = trackGeo(new THREE.BoxGeometry(0.38, 0.24, 0.08));
      for (const sx of [-0.52, 0.52]) {
        const pod = new THREE.Mesh(podGeo, paintMaterial);
        pod.position.set(sx, 0.38, 0.36);
        pod.castShadow = !isGhost;
        bodyGroup.add(pod);

        const mouth = new THREE.Mesh(intakeMouthGeo, carbonMaterial);
        mouth.position.set(sx, 0.39, -0.47);
        bodyGroup.add(mouth);
      }

      // Carbon Underbody Plank / Floor + Subtle Underglow Trim
      const floorGeo = trackGeo(new THREE.BoxGeometry(1.62, 0.05, 3.05));
      const floor = new THREE.Mesh(floorGeo, carbonMaterial);
      floor.position.set(0, 0.16, 0.25);
      bodyGroup.add(floor);
      const podRailGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.03, 1.65));
      for (const sx of [-0.79, 0.79]) {
        const podRail = new THREE.Mesh(podRailGeo, carbonMaterial);
        podRail.position.set(sx, 0.16, 0.25);
        bodyGroup.add(podRail);
      }

      // Dual-Plane Wide Front Wing + Endplates
      const fWingGrp = new THREE.Group();
      fWingGrp.position.set(0, 0.21, -2.36);
      const fWingMain = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.12, 0.05, 0.36)), carbonMaterial);
      const fWingFlap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.04, 0.04, 0.18)), accentMaterial);
      fWingFlap.position.set(0, 0.05, 0.08);
      fWingFlap.rotation.x = 0.2;
      const fEndGeo = trackGeo(new THREE.BoxGeometry(0.045, 0.22, 0.42));
      const fEndL = new THREE.Mesh(fEndGeo, paintMaterial);
      fEndL.position.set(-1.06, 0.07, 0);
      const fEndR = new THREE.Mesh(fEndGeo, paintMaterial);
      fEndR.position.set(1.06, 0.07, 0);
      fWingGrp.add(fWingMain, fWingFlap, fEndL, fEndR);
      bodyGroup.add(fWingGrp);
      registerDamagePart(fWingGrp, -0.05, 0.08, -0.06);

      // High Twin-Plane DRS Rear Wing
      const rWingGrp = new THREE.Group();
      rWingGrp.position.set(0, 0.96, 2.12);
      const rMain = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.78, 0.06, 0.32)), carbonMaterial);
      const rDrs = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.05, 0.18)), paintMaterial);
      rDrs.position.set(0, 0.11, 0.08);
      rDrs.rotation.x = 0.25;
      const rEndGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.48, 0.44));
      const rEndL = new THREE.Mesh(rEndGeo, paintMaterial);
      rEndL.position.set(-0.89, -0.14, 0);
      const rEndR = new THREE.Mesh(rEndGeo, paintMaterial);
      rEndR.position.set(0.89, -0.14, 0);
      const rPylon = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.56, 0.22)), carbonMaterial);
      rPylon.position.set(0, -0.32, -0.04);
      rWingGrp.add(rMain, rDrs, rEndL, rEndR, rPylon);
      bodyGroup.add(rWingGrp);
      registerDamagePart(rWingGrp, -0.06, 0.1, 0.08);

      // Exposed Suspension Wishbones (connect tub to all 4 open wheels)
      const wishGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.036, 0.075));
      for (const [wx, wz, yOff] of [
        [-0.58, -1.38, 0.32],
        [0.58, -1.38, 0.32],
        [-0.58, -1.38, 0.48],
        [0.58, -1.38, 0.48],
        [-0.58, 1.38, 0.32],
        [0.58, 1.38, 0.32],
        [-0.58, 1.38, 0.48],
        [0.58, 1.38, 0.48],
      ]) {
        const arm = new THREE.Mesh(wishGeo, carbonMaterial);
        arm.position.set(wx, yOff, wz);
        arm.rotation.y = wx < 0 ? 0.12 : -0.12;
        bodyGroup.add(arm);
      }

      // Titanium Halo Safety Bar + Driver Helmet (hidden in COCKPIT view)
      const haloArcGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.032, 8, 18, Math.PI));
      haloArcGeo.rotateX(Math.PI / 2);
      const haloArc = new THREE.Mesh(haloArcGeo, carbonMaterial);
      haloArc.position.set(0, 0.72, -0.06);
      const haloStem = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.045, 0.22, 0.07)), carbonMaterial);
      haloStem.position.set(0, 0.64, -0.36);
      haloStem.rotation.x = 0.42;
      const tCam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.04, 0.1)), carbonMaterial);
      tCam.position.set(0, 1.07, 0.15);
      const driverHelmet = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.155, 14, 12)),
        accentMaterial,
      );
      driverHelmet.position.set(0, 0.65, 0.06);
      bodyGroup.add(haloArc, haloStem, tCam, driverHelmet);
      canopyHideMeshes.push(haloArc, haloStem, driverHelmet);

      // F1 Cockpit Dash & Steering Wheel
      cockpitGroup = new THREE.Group();
      const f1Dash = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.1, 0.18)), carbonMaterial);
      f1Dash.position.set(0, 0.56, -0.45);
      steeringPivot = new THREE.Group();
      steeringPivot.position.set(0, 0.58, -0.28);
      steeringPivot.rotation.x = -0.15;
      const f1Wheel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.15, 0.03)), carbonMaterial);
      const f1Screen = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.18, 0.08)), dashScreenMat);
      f1Screen.position.set(0, 0.01, 0.018);
      steeringPivot.add(f1Wheel, f1Screen);
      cockpitGroup.add(f1Dash, steeringPivot);
      bodyGroup.add(cockpitGroup);

      // Nose decal / stripe
      const stripeGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.025, 1.25));
      stripeFallbackMesh = new THREE.Mesh(stripeGeo, accentMaterial);
      stripeFallbackMesh.position.set(0, 0.49, -1.48);
      stripeFallbackMesh.rotation.x = 0.16;
      bodyGroup.add(stripeFallbackMesh);

      if (!isPolice && !isGhost && options.truckArtTexture) {
        const hoodDecalMat = trackMat(
          new THREE.MeshStandardMaterial({
            map: options.truckArtTexture,
            roughness: 0.24,
            emissiveMap: options.truckArtTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.25,
          }),
        );
        decalMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.026, 0.95)), hoodDecalMat);
        decalMesh.position.set(0, 0.52, -1.42);
        decalMesh.rotation.x = 0.16;
        decalMesh.visible = options.truckArtEnabled !== false;
        stripeFallbackMesh.visible = !decalMesh.visible;
        bodyGroup.add(decalMesh);
      }

      // F1 Nose LEDs + Rear Rain Light
      const f1Head = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.05, 0.08)), headlightMat);
      f1Head.position.set(0, 0.34, -2.45);
      const f1Tail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.14, 0.08)), brakeLightMat);
      f1Tail.position.set(0, 0.36, 2.2);
      bodyGroup.add(f1Head, f1Tail);

      // Center Exhaust + Nitro Flame
      const exh = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.08, 0.095, 0.28, 14)).rotateX(Math.PI / 2),
        rimMaterial,
      );
      exh.position.set(0, 0.44, 2.15);
      bodyGroup.add(exh);

      const flameGeo = trackGeo(new THREE.ConeGeometry(0.16, 1.65, 12));
      flameGeo.rotateX(Math.PI / 2);
      flameGeo.translate(0, 0, 0.82);
      const fMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x22e8ff,
          transparent: true,
          opacity: 0.94,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const flame = new THREE.Mesh(flameGeo, fMat);
      flame.position.set(0, 0.44, 2.24);
      flame.visible = false;
      bodyGroup.add(flame);
      flamesList.push({ mesh: flame, mat: fMat });
    } else {
      // -----------------------------------------------------------------------
      // 16 SCULPTED BODY STYLES (HYPERCARS, JDM, SEDANS, RALLY, CONVERTIBLE, WAGON, MUSCLE, PICKUP, SUVs)
      // -----------------------------------------------------------------------
      const profile = new THREE.Shape();
      if (isPickup) {
        // Crew-Cab Pickup + Dropped Open Rear Cargo Bed
        profile.moveTo(-2.22, 0.44);
        profile.quadraticCurveTo(-2.32, 0.72, -2.2, 1.02);
        profile.lineTo(-1.18, 1.1);
        profile.lineTo(-0.74, 1.66);
        profile.lineTo(0.38, 1.66);
        profile.lineTo(0.46, 0.72);
        profile.lineTo(2.14, 0.72);
        profile.lineTo(2.22, 1.08);
        profile.lineTo(2.2, 0.46);
        profile.closePath();
      } else if (isLuxurySuv) {
        // Iconic Squared-Off Boxy G-Class SUV
        profile.moveTo(-2.16, 0.4);
        profile.lineTo(-2.2, 1.02);
        profile.lineTo(-1.12, 1.06);
        profile.lineTo(-0.84, 1.68);
        profile.lineTo(1.86, 1.66);
        profile.lineTo(2.08, 1.06);
        profile.lineTo(2.08, 0.42);
        profile.closePath();
      } else if (is4x4) {
        // Raptor Track 4x4 SUV
        profile.moveTo(-2.22, 0.42);
        profile.quadraticCurveTo(-2.34, 0.68, -2.24, 0.94);
        profile.quadraticCurveTo(-1.75, 1.04, -1.16, 1.06);
        profile.lineTo(-0.68, 1.56);
        profile.quadraticCurveTo(0.0, 1.6, 0.64, 1.55);
        profile.lineTo(0.92, 1.14);
        profile.lineTo(2.16, 1.12);
        profile.quadraticCurveTo(2.26, 0.8, 2.18, 0.44);
        profile.closePath();
      } else if (isRally) {
        // Compact Widebody WRC Hot-Hatch
        profile.moveTo(-2.06, 0.28);
        profile.quadraticCurveTo(-2.18, 0.48, -2.08, 0.66);
        profile.quadraticCurveTo(-1.6, 0.8, -1.08, 0.86);
        profile.lineTo(-0.54, 1.32);
        profile.lineTo(1.16, 1.3);
        profile.lineTo(1.82, 0.84);
        profile.lineTo(1.94, 0.32);
        profile.closePath();
      } else if (isWagon) {
        // Long-Roof RS6 Performance Sport Wagon
        profile.moveTo(-2.22, 0.26);
        profile.quadraticCurveTo(-2.34, 0.46, -2.2, 0.64);
        profile.quadraticCurveTo(-1.68, 0.8, -1.16, 0.85);
        profile.lineTo(-0.52, 1.29);
        profile.lineTo(1.38, 1.26);
        profile.lineTo(2.08, 0.86);
        profile.lineTo(2.16, 0.5);
        profile.lineTo(2.1, 0.29);
        profile.closePath();
      } else if (isSedan) {
        // Classic 3-Box Executive Super-Sedan
        profile.moveTo(-2.22, 0.26);
        profile.quadraticCurveTo(-2.32, 0.48, -2.2, 0.64);
        profile.quadraticCurveTo(-1.66, 0.78, -1.18, 0.84);
        profile.lineTo(-0.56, 1.28);
        profile.quadraticCurveTo(0.04, 1.31, 0.62, 1.27);
        profile.lineTo(1.36, 0.89);
        profile.lineTo(2.12, 0.86);
        profile.quadraticCurveTo(2.2, 0.62, 2.12, 0.29);
        profile.closePath();
      } else if (isGtCoupe) {
        // Continuous Sloping Rear-Engine GT Sports Coupe
        profile.moveTo(-2.2, 0.24);
        profile.quadraticCurveTo(-2.32, 0.44, -2.18, 0.56);
        profile.quadraticCurveTo(-1.72, 0.72, -1.12, 0.77);
        profile.lineTo(-0.42, 1.24);
        profile.quadraticCurveTo(0.24, 1.28, 1.44, 0.92);
        profile.lineTo(2.14, 0.78);
        profile.lineTo(2.12, 0.28);
        profile.closePath();
      } else if (isConvertible) {
        // Open-Top Exotic Roadster (no closed roof hump!)
        profile.moveTo(-2.22, 0.23);
        profile.quadraticCurveTo(-2.36, 0.38, -2.22, 0.48);
        profile.quadraticCurveTo(-1.78, 0.72, -1.22, 0.8);
        profile.lineTo(-0.62, 0.84);
        profile.lineTo(0.56, 0.88);
        profile.lineTo(1.94, 0.85);
        profile.quadraticCurveTo(2.22, 0.74, 2.18, 0.46);
        profile.lineTo(2.12, 0.27);
        profile.closePath();
      } else if (isMuscle) {
        profile.moveTo(-2.24, 0.27);
        profile.quadraticCurveTo(-2.34, 0.48, -2.22, 0.66);
        profile.quadraticCurveTo(-1.68, 0.78, -1.06, 0.83);
        profile.lineTo(-0.46, 1.24);
        profile.quadraticCurveTo(0.24, 1.27, 0.86, 1.15);
        profile.lineTo(1.94, 0.89);
        profile.quadraticCurveTo(2.24, 0.82, 2.2, 0.56);
        profile.lineTo(2.14, 0.29);
        profile.closePath();
      } else if (isJdm) {
        if (style === 'skyline_r34') {
          profile.moveTo(-2.22, 0.26);
          profile.lineTo(-2.28, 0.56);
          profile.lineTo(-1.1, 0.82);
          profile.lineTo(-0.56, 1.24);
          profile.lineTo(0.68, 1.23);
          profile.lineTo(1.28, 0.86);
          profile.lineTo(2.12, 0.84);
          profile.lineTo(2.1, 0.29);
          profile.closePath();
        } else {
          profile.moveTo(-2.2, 0.25);
          profile.quadraticCurveTo(-2.32, 0.42, -2.18, 0.54);
          profile.quadraticCurveTo(-1.74, 0.76, -1.08, 0.82);
          profile.lineTo(-0.42, 1.2);
          profile.quadraticCurveTo(0.2, 1.26, 0.92, 1.1);
          profile.lineTo(1.92, 0.84);
          profile.quadraticCurveTo(2.2, 0.76, 2.16, 0.48);
          profile.lineTo(2.12, 0.29);
          profile.closePath();
        }
      } else {
        // Exotic Hypercar / Megacar / Speed King Wedge
        profile.moveTo(-2.22, 0.23);
        profile.quadraticCurveTo(-2.36, 0.37, -2.24, 0.47);
        profile.quadraticCurveTo(-1.86, 0.7, -1.24, 0.79);
        profile.lineTo(-0.5, 1.16);
        profile.quadraticCurveTo(0.14, 1.24, 0.84, 1.09);
        profile.lineTo(1.94, 0.86);
        profile.quadraticCurveTo(2.24, 0.76, 2.2, 0.45);
        profile.lineTo(2.14, 0.27);
        profile.closePath();
      }

      const bodyWidth = isTallTruck ? 1.88 : isRally || isWagon || isGtCoupe ? 1.76 : 1.72;
      const hullGeo = trackGeo(
        new THREE.ExtrudeGeometry(profile, {
          depth: bodyWidth,
          bevelEnabled: true,
          bevelThickness: isLuxurySuv ? 0.06 : 0.13,
          bevelSize: isLuxurySuv ? 0.05 : 0.1,
          bevelSegments: isLuxurySuv ? 2 : 4,
          curveSegments: 16,
        }),
      );
      hullGeo.translate(0, 0, -bodyWidth * 0.5);
      hullGeo.rotateY(-Math.PI / 2);
      hullGeo.computeVertexNormals();

      const hullMesh = new THREE.Mesh(hullGeo, paintMaterial);
      hullMesh.castShadow = !isGhost;
      hullMesh.receiveShadow = true;
      bodyGroup.add(hullMesh);

      // Pickup Cargo Bed Side Walls, Dark Bed Liner & Tubular Baja Roll Cage
      if (isPickup) {
        const wallGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.44, 1.82));
        for (const sx of [-0.94, 0.94]) {
          const w = new THREE.Mesh(wallGeo, paintMaterial);
          w.position.set(sx, 0.94, 1.32);
          w.castShadow = !isGhost;
          bodyGroup.add(w);
        }
        const tailgate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.96, 0.44, 0.14)), paintMaterial);
        tailgate.position.set(0, 0.94, 2.18);
        const bedLiner = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.74, 0.06, 1.66)), carbonMaterial);
        bedLiner.position.set(0, 0.75, 1.3);
        const rollTop = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 1.68, 10)).rotateZ(Math.PI / 2),
          carbonMaterial,
        );
        rollTop.position.set(0, 1.62, 0.58);
        const strutGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 1.08, 8));
        for (const sx of [-0.78, 0.78]) {
          const st = new THREE.Mesh(strutGeo, carbonMaterial);
          st.position.set(sx, 1.35, 1.0);
          st.rotation.x = 0.76;
          bodyGroup.add(st);
          const upright = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8)), carbonMaterial);
          upright.position.set(sx, 1.32, 0.58);
          bodyGroup.add(upright);
        }
        bodyGroup.add(tailgate, bedLiner, rollTop);
      }

      // 1b. Sculpted Wheel Arch Flares
      const archR = wheelRadius + 0.14;
      const archGeo = trackGeo(new THREE.TorusGeometry(archR, 0.085, 8, 16, Math.PI));
      archGeo.rotateY(Math.PI / 2);
      const archWx = isTallTruck ? 0.99 : isRally || isWagon ? 0.93 : 0.91;
      const fAz = isRally ? -1.26 : -1.36;
      const rAz = isRally ? 1.24 : 1.38;
      for (const [ax, az] of [
        [-archWx, fAz],
        [archWx, fAz],
        [-archWx - 0.02, rAz],
        [archWx + 0.02, rAz],
      ]) {
        const flare = new THREE.Mesh(
          archGeo,
          is4x4 || isPickup || isLuxurySuv || isRally ? carbonMaterial : paintMaterial,
        );
        flare.position.set(ax, wheelRadius + 0.02, az);
        bodyGroup.add(flare);
      }

      // 2. Wraparound Tinted Glass Canopy (or Open-Top Windshield + Roll Hoops for Convertible)
      const cabinW = isTallTruck
        ? 1.62
        : isWagon || isRally
          ? 1.5
          : isKoenig
            ? 1.42
            : 1.36;

      if (isConvertible) {
        // Raked Front Windshield Only + Open Cockpit Bucket Seats + Roll Hoops
        const windFrame = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(1.48, 0.44, 0.06)),
          glassMaterial,
        );
        windFrame.position.set(0, 0.98, -0.78);
        windFrame.rotation.x = 0.76;
        bodyGroup.add(windFrame);

        const seatBackGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.48, 0.12));
        const hoopGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.032, 8, 16, Math.PI));
        for (const sx of [-0.36, 0.36]) {
          const seatBack = new THREE.Mesh(seatBackGeo, carbonMaterial);
          seatBack.position.set(sx, 0.88, 0.24);
          seatBack.rotation.x = -0.22;
          const bolster = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(0.44, 0.14, 0.13)),
            accentMaterial,
          );
          bolster.position.set(sx, 1.06, 0.27);
          const hoop = new THREE.Mesh(hoopGeo, rimMaterial);
          hoop.position.set(sx, 0.94, 0.48);
          bodyGroup.add(seatBack, bolster, hoop);
          canopyHideMeshes.push(seatBack, bolster, hoop);
        }
      } else {
        const cabinProfile = new THREE.Shape();
        if (isPickup) {
          cabinProfile.moveTo(-1.14, 1.06);
          cabinProfile.lineTo(-0.74, 1.64);
          cabinProfile.lineTo(0.34, 1.64);
          cabinProfile.lineTo(0.42, 1.08);
          cabinProfile.closePath();
        } else if (isLuxurySuv) {
          cabinProfile.moveTo(-1.08, 1.04);
          cabinProfile.lineTo(-0.82, 1.66);
          cabinProfile.lineTo(1.82, 1.64);
          cabinProfile.lineTo(2.02, 1.06);
          cabinProfile.closePath();
        } else if (is4x4) {
          cabinProfile.moveTo(-1.1, 1.02);
          cabinProfile.lineTo(-0.68, 1.54);
          cabinProfile.lineTo(0.6, 1.53);
          cabinProfile.lineTo(0.86, 1.1);
          cabinProfile.closePath();
        } else if (isRally) {
          cabinProfile.moveTo(-1.04, 0.84);
          cabinProfile.lineTo(-0.54, 1.3);
          cabinProfile.lineTo(1.14, 1.28);
          cabinProfile.lineTo(1.68, 0.86);
          cabinProfile.closePath();
        } else if (isWagon) {
          cabinProfile.moveTo(-1.12, 0.84);
          cabinProfile.lineTo(-0.52, 1.28);
          cabinProfile.lineTo(1.36, 1.25);
          cabinProfile.lineTo(1.92, 0.88);
          cabinProfile.closePath();
        } else if (isGtCoupe) {
          cabinProfile.moveTo(-1.08, 0.76);
          cabinProfile.lineTo(-0.42, 1.22);
          cabinProfile.quadraticCurveTo(0.24, 1.26, 1.4, 0.9);
          cabinProfile.closePath();
        } else {
          cabinProfile.moveTo(-1.08, 0.78);
          cabinProfile.lineTo(-0.44, 1.18);
          cabinProfile.quadraticCurveTo(0.14, 1.26, 0.8, 1.1);
          cabinProfile.lineTo(1.44, 0.88);
          cabinProfile.closePath();
        }

        const cabinGeo = trackGeo(
          new THREE.ExtrudeGeometry(cabinProfile, {
            depth: cabinW,
            bevelEnabled: true,
            bevelThickness: 0.08,
            bevelSize: 0.06,
            bevelSegments: 3,
            curveSegments: 14,
          }),
        );
        cabinGeo.translate(0, 0, -cabinW * 0.5);
        cabinGeo.rotateY(-Math.PI / 2);
        const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
        cabinMesh.position.y = 0.03;
        cabinMesh.castShadow = !isGhost;
        bodyGroup.add(cabinMesh);
        canopyHideMeshes.push(cabinMesh);
      }

      // 2b. Detailed Interior Cockpit (visible in COCKPIT mode + through windshield!)
      cockpitGroup = new THREE.Group();
      const dashY = isTallTruck ? 1.12 : 0.86;
      const dashGeo = trackGeo(new THREE.BoxGeometry(cabinW * 0.88, 0.18, 0.34));
      const dash = new THREE.Mesh(dashGeo, carbonMaterial);
      dash.position.set(0, dashY, -0.58);

      const screenGeo = trackGeo(new THREE.PlaneGeometry(0.46, 0.14));
      const dashScreen = new THREE.Mesh(screenGeo, dashScreenMat);
      dashScreen.position.set(0, dashY + 0.03, -0.405);
      dashScreen.rotation.x = -0.18;

      const pillarGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.52, 0.06));
      const pL = new THREE.Mesh(pillarGeo, carbonMaterial);
      pL.position.set(-cabinW * 0.44, dashY + 0.18, -0.52);
      pL.rotation.x = -0.82;
      const pR = new THREE.Mesh(pillarGeo, carbonMaterial);
      pR.position.set(cabinW * 0.44, dashY + 0.18, -0.52);
      pR.rotation.x = -0.82;

      steeringPivot = new THREE.Group();
      steeringPivot.position.set(0, dashY + 0.02, -0.3);
      steeringPivot.rotation.x = -0.22;
      const wheelRimGeo = trackGeo(new THREE.TorusGeometry(0.145, 0.022, 8, 20));
      const wheelRim = new THREE.Mesh(wheelRimGeo, carbonMaterial);
      const topStripeGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.045, 0.048));
      const topStripe = new THREE.Mesh(topStripeGeo, accentMaterial);
      topStripe.position.set(0, 0.145, 0);
      const wheelHubGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.04, 0.03));
      const wheelHub = new THREE.Mesh(wheelHubGeo, rimMaterial);
      steeringPivot.add(wheelRim, topStripe, wheelHub);

      cockpitGroup.add(dash, dashScreen, pL, pR, steeringPivot);
      bodyGroup.add(cockpitGroup);

      // 3. Front Splitter, Grille, Diffuser & Wing Mirrors
      const lenZ = isRally ? 4.24 : 4.62;
      const splitterGeo = trackGeo(
        new THREE.BoxGeometry(isTallTruck ? 2.1 : 2.02, isTallTruck ? 0.12 : 0.07, lenZ),
      );
      const splitterMesh = new THREE.Mesh(splitterGeo, isTallTruck ? rimMaterial : carbonMaterial);
      splitterMesh.position.set(0, isTallTruck ? 0.4 : 0.22, -0.04);
      bodyGroup.add(splitterMesh);
      registerDamagePart(splitterMesh, -0.07, 0.05, -0.06);

      const frontZ = isRally ? -2.14 : -2.31;
      const rearZ = isRally ? 1.98 : 2.22;
      const grilleGeo = trackGeo(
        new THREE.BoxGeometry(isTallTruck ? 1.54 : 1.38, isTallTruck ? 0.38 : 0.18, 0.08),
      );
      const frontGrille = new THREE.Mesh(grilleGeo, carbonMaterial);
      frontGrille.position.set(0, isTallTruck ? 0.68 : 0.38, frontZ);
      bodyGroup.add(frontGrille);

      const diffuserGeo = trackGeo(new THREE.BoxGeometry(1.56, 0.18, 0.18));
      const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
      diffuser.position.set(0, isTallTruck ? 0.44 : 0.28, rearZ);
      bodyGroup.add(diffuser);

      // Aerodynamic Carbon Side Skirts, Front Splitter Lip & Diffuser Fins + Subtle Underbody Tube
      const sillRailGeo = trackGeo(new THREE.BoxGeometry(0.07, 0.045, lenZ * 0.72));
      const sillY = isTallTruck ? 0.36 : 0.19;
      for (const sx of [-1, 1]) {
        const sill = new THREE.Mesh(sillRailGeo, carbonMaterial);
        sill.position.set(sx * (bodyWidth * 0.5 + 0.07), sillY, -0.02);
        bodyGroup.add(sill);
      }
      const underTubeGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.022, lenZ * 0.6));
      for (const sx of [-1, 1]) {
        const tube = new THREE.Mesh(underTubeGeo, underglowMat);
        tube.position.set(sx * (bodyWidth * 0.42), sillY - 0.02, 0);
        bodyGroup.add(tube);
      }
      const frontChinLip = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(isTallTruck ? 1.96 : 1.9, 0.032, 0.09)),
        carbonMaterial,
      );
      frontChinLip.position.set(0, isTallTruck ? 0.37 : 0.195, frontZ - 0.04);
      bodyGroup.add(frontChinLip);
      const finGeo = trackGeo(new THREE.BoxGeometry(0.035, 0.17, 0.2));
      for (const fx of [-0.45, 0, 0.45]) {
        const fin = new THREE.Mesh(finGeo, carbonMaterial);
        fin.position.set(fx, isTallTruck ? 0.44 : 0.26, rearZ + 0.05);
        bodyGroup.add(fin);
      }

      const mirrorGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.09, 0.14));
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(mirrorGeo, paintMaterial);
        m.position.set(sx * (bodyWidth * 0.5 + 0.12), isTallTruck ? 1.14 : 0.87, -0.58);
        m.rotation.y = sx * -0.18;
        bodyGroup.add(m);
      }

      // 4. Signature Body Details per Real-World Car Model
      if (isHellcat) {
        // Dodge Challenger SRT Hellcat Redeye: Widebody dual-snorkel hood intake + carbon trunk lip
        const hoodIntake = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.11, 0.72)), carbonMaterial);
        hoodIntake.position.set(0, 0.85, -1.42);
        const chinLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.98, 0.08, 0.22)), carbonMaterial);
        chinLip.position.set(0, 0.24, -2.35);
        const duckLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.66, 0.1, 0.2)), carbonMaterial);
        duckLip.position.set(0, 0.92, 2.12);
        duckLip.rotation.x = 0.24;
        bodyGroup.add(hoodIntake, chinLip, duckLip);
        registerDamagePart(hoodIntake, -0.04, -0.06, 0.05);
      } else if (isMuscle) {
        const scoopGeo = trackGeo(new THREE.BoxGeometry(0.54, 0.2, 0.82));
        const scoop = new THREE.Mesh(scoopGeo, carbonMaterial);
        scoop.position.set(0, 0.86, -1.42);
        const bulge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.1, 0.94)), paintMaterial);
        bulge.position.set(0, 0.82, -1.42);
        bodyGroup.add(scoop, bulge);
        registerDamagePart(scoop, -0.04, -0.06, 0.05);
      } else if (style === 'italian_v12') {
        // Lamborghini Aventador SVJ: hex engine louvers + sharp front aero dive planes
        for (let lv = 0; lv < 4; lv++) {
          const louver = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.92 - lv * 0.06, 0.045, 0.14)), carbonMaterial);
          louver.position.set(0, 1.02 - lv * 0.05, 0.88 + lv * 0.24);
          louver.rotation.x = -0.18;
          bodyGroup.add(louver);
        }
        const canardGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.05, 0.26));
        for (const sx of [-0.94, 0.94]) {
          const canard = new THREE.Mesh(canardGeo, carbonMaterial);
          canard.position.set(sx, 0.34, -2.14);
          bodyGroup.add(canard);
        }
      } else if (isKoenig) {
        // Koenigsegg Jesko Absolut: center dorsal fin + twin rear stabilizer blades
        const dorsalGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.22, 1.04));
        const dorsal = new THREE.Mesh(dorsalGeo, carbonMaterial);
        dorsal.position.set(0, 1.24, 0.48);
        const finBladeGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.28, 0.56));
        for (const fx of [-0.62, 0.62]) {
          const fb = new THREE.Mesh(finBladeGeo, paintMaterial);
          fb.position.set(fx, 1.04, 1.84);
          bodyGroup.add(fb);
        }
        bodyGroup.add(dorsal);
      } else if (isChiron) {
        // Bugatti Chiron Pur Sport: sweeping side C-line + iconic horseshoe grille arch
        const cGeo = trackGeo(new THREE.TorusGeometry(0.46, 0.065, 10, 20, Math.PI));
        cGeo.rotateY(Math.PI / 2);
        const cL = new THREE.Mesh(cGeo, accentMaterial);
        cL.position.set(-0.96, 0.64, 0.25);
        const cR = new THREE.Mesh(cGeo, accentMaterial);
        cR.position.set(0.96, 0.64, 0.25);
        const horseshoe = new THREE.Mesh(
          trackGeo(new THREE.TorusGeometry(0.24, 0.045, 8, 18, Math.PI)),
          rimMaterial,
        );
        horseshoe.position.set(0, 0.39, -2.33);
        bodyGroup.add(cL, cR, horseshoe);
      } else if (style === 'v8_mid') {
        // Ferrari 488 Pista: front S-duct intake + side scallops + clear glass V8 bay
        const sDuct = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.08, 0.38)), carbonMaterial);
        sDuct.position.set(0, 0.66, -1.78);
        const glassBay = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.96, 0.06, 0.92)), glassMaterial);
        glassBay.position.set(0, 0.98, 1.12);
        glassBay.rotation.x = -0.14;
        const scoopGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.26, 0.72));
        for (const sx of [-0.92, 0.92]) {
          const sc = new THREE.Mesh(scoopGeo, carbonMaterial);
          sc.position.set(sx, 0.6, 0.42);
          bodyGroup.add(sc);
        }
        bodyGroup.add(sDuct, glassBay);
      } else if (style === 'supra_mk4') {
        // Toyota Supra MK4: twin hood vents
        const ventGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.04, 0.42));
        for (const vx of [-0.42, 0.42]) {
          const vent = new THREE.Mesh(ventGeo, carbonMaterial);
          vent.position.set(vx, 0.79, -1.42);
          bodyGroup.add(vent);
        }
      } else if (style === 'rx7_rotary') {
        // Mazda RX-7 FD3S: signature sleek side fender gills + subtle ducktail
        const gillGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.34));
        for (const sx of [-0.9, 0.9]) {
          const g = new THREE.Mesh(gillGeo, carbonMaterial);
          g.position.set(sx, 0.56, -0.96);
          bodyGroup.add(g);
        }
      } else if (style === 'skyline_r34') {
        // Nissan Skyline GT-R R34: aggressive lower intercooler + hood NACA duct
        const intercooler = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.2, 0.08)), rimMaterial);
        intercooler.position.set(0, 0.36, -2.31);
        const naca = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.04, 0.38)), carbonMaterial);
        naca.position.set(0.28, 0.81, -1.36);
        bodyGroup.add(intercooler, naca);
      } else if (is4x4) {
        const barGeo = trackGeo(new THREE.BoxGeometry(1.52, 0.11, 0.16));
        const ledBar = new THREE.Mesh(barGeo, headlightMat);
        ledBar.position.set(0, 1.66, -0.56);
        const rollGeo = trackGeo(new THREE.BoxGeometry(1.66, 0.4, 0.16));
        const roll = new THREE.Mesh(rollGeo, carbonMaterial);
        roll.position.set(0, 1.34, 1.05);
        bodyGroup.add(ledBar, roll);
      } else if (isPickup) {
        const bullBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.68, 0.22, 0.18)), carbonMaterial);
        bullBar.position.set(0, 0.62, -2.35);
        const roofBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.44, 0.1, 0.14)), headlightMat);
        roofBar.position.set(0, 1.74, -0.62);
        bodyGroup.add(bullBar, roofBar);
      } else if (isLuxurySuv) {
        // Fender-top turn signal pods + rear-door spare tire + side chrome exhausts
        const podGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.09, 0.18));
        for (const sx of [-0.82, 0.82]) {
          const pod = new THREE.Mesh(podGeo, accentMaterial);
          pod.position.set(sx, 1.11, -1.94);
          bodyGroup.add(pod);
        }
        const spareTire = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 18)).rotateX(Math.PI / 2),
          tireMaterial,
        );
        spareTire.position.set(0, 1.0, 2.2);
        const spareCover = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.24, 18)).rotateX(Math.PI / 2),
          paintMaterial,
        );
        spareCover.position.set(0, 1.0, 2.21);
        const sidePipeGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.45, 10)).rotateX(Math.PI / 2);
        for (const sx of [-1.04, 1.04]) {
          const sp = new THREE.Mesh(sidePipeGeo, rimMaterial);
          sp.position.set(sx, 0.38, 0.88);
          bodyGroup.add(sp);
        }
        bodyGroup.add(spareTire, spareCover);
      } else if (isRally) {
        // Hood Intercooler Scoop, Roof Vent, Quad Fog Pods & Red Rally Mudflaps
        const hoodScoop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.14, 0.44)), carbonMaterial);
        hoodScoop.position.set(0, 0.87, -1.36);
        const roofScoop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.11, 0.38)), carbonMaterial);
        roofScoop.position.set(0, 1.38, -0.15);
        const fogGeo = trackGeo(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12)).rotateX(Math.PI / 2);
        for (const fx of [-0.36, -0.12, 0.12, 0.36]) {
          const fog = new THREE.Mesh(fogGeo, headlightMat);
          fog.position.set(fx, 0.46, -2.18);
          bodyGroup.add(fog);
        }
        const mudMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 }));
        const flapGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.24, 0.03));
        for (const [mx, mz] of [
          [-0.92, -0.96],
          [0.92, -0.96],
          [-0.94, 1.54],
          [0.94, 1.54],
        ]) {
          const flap = new THREE.Mesh(flapGeo, mudMat);
          flap.position.set(mx, 0.22, mz);
          bodyGroup.add(flap);
        }
        bodyGroup.add(hoodScoop, roofScoop);
      } else if (isWagon) {
        // Anodized Roof Rails + Roof Edge Lip Spoiler
        const railGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.055, 1.85));
        for (const rx of [-0.54, 0.54]) {
          const rail = new THREE.Mesh(railGeo, rimMaterial);
          rail.position.set(rx, 1.35, 0.46);
          bodyGroup.add(rail);
        }
        const roofLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.48, 0.06, 0.26)), carbonMaterial);
        roofLip.position.set(0, 1.29, 1.44);
        roofLip.rotation.x = 0.16;
        bodyGroup.add(roofLip);
      } else if (isM4) {
        // BMW M4 Competition (G82): Tall twin vertical kidney grille + hood power bulge + trunk lip
        const trunkLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.56, 0.07, 0.2)), carbonMaterial);
        trunkLip.position.set(0, 0.92, 2.08);
        trunkLip.rotation.x = 0.24;
        const g82Grille = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.34, 0.1)), carbonMaterial);
        g82Grille.position.set(0, 0.44, -2.31);
        const kidneyMid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.35, 0.11)), paintMaterial);
        kidneyMid.position.set(0, 0.44, -2.32);
        const powerDome = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.64, 0.06, 0.85)), paintMaterial);
        powerDome.position.set(0, 0.82, -1.45);
        powerDome.rotation.x = 0.14;
        bodyGroup.add(trunkLip, g82Grille, kidneyMid, powerDome);
      } else if (isSedan) {
        // Subtle Carbon Trunk Lip Spoiler + Twin-Kidney Grille Bar
        const trunkLip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.52, 0.06, 0.18)), carbonMaterial);
        trunkLip.position.set(0, 0.91, 2.08);
        trunkLip.rotation.x = 0.22;
        const kidneyMid = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.22, 0.1)), paintMaterial);
        kidneyMid.position.set(0, 0.48, -2.32);
        bodyGroup.add(trunkLip, kidneyMid);
      } else if (isGtCoupe) {
        // Raised Front Fender Humps + Ducktail
        const humpGeo = trackGeo(new THREE.CylinderGeometry(0.2, 0.24, 0.95, 12)).rotateX(Math.PI / 2);
        for (const hx of [-0.66, 0.66]) {
          const hump = new THREE.Mesh(humpGeo, paintMaterial);
          hump.position.set(hx, 0.62, -1.68);
          bodyGroup.add(hump);
        }
      } else if (isHyper) {
        const intakeGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.26, 0.76));
        for (const sx of [-0.92, 0.92]) {
          const intake = new THREE.Mesh(intakeGeo, carbonMaterial);
          intake.position.set(sx, 0.62, 0.45);
          bodyGroup.add(intake);
        }
      }

      // 5. Hood Truck-Art Decal + Dual Racing Stripe Fallback
      const decalY = isTallTruck ? 1.1 : isRally || isWagon || isSedan ? 0.84 : isMuscle ? 0.85 : 0.81;
      const decalZ = isRally ? -1.52 : -1.48;
      if (!isPolice && !isGhost && options.truckArtTexture) {
        const hoodDecalMat = trackMat(
          new THREE.MeshStandardMaterial({
            map: options.truckArtTexture,
            roughness: 0.22,
            metalness: 0.35,
            emissiveMap: options.truckArtTexture,
            emissive: 0xffffff,
            emissiveIntensity: 0.25,
          }),
        );
        const decalGeo = trackGeo(new THREE.BoxGeometry(0.72, 0.026, 1.12));
        decalMesh = new THREE.Mesh(decalGeo, hoodDecalMat);
        decalMesh.position.set(0, decalY, decalZ);
        decalMesh.rotation.x = isTallTruck ? 0.04 : 0.14;
        decalMesh.visible = options.truckArtEnabled !== false;
        bodyGroup.add(decalMesh);
      }

      const stripeGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.025, 1.24));
      stripeFallbackMesh = new THREE.Mesh(stripeGeo, accentMaterial);
      stripeFallbackMesh.position.set(0, decalY - 0.008, decalZ);
      stripeFallbackMesh.rotation.x = isTallTruck ? 0.04 : 0.15;
      stripeFallbackMesh.visible = !decalMesh || !decalMesh.visible;
      bodyGroup.add(stripeFallbackMesh);

      // Twin Roof & Rear-Deck Racing Pinstripe Highlights
      if (!isConvertible && !isPickup) {
        const roofY = isLuxurySuv
          ? 1.68
          : is4x4
            ? 1.58
            : isRally
              ? 1.34
              : isWagon
                ? 1.31
                : isSedan || isGtCoupe
                  ? 1.3
                  : isMuscle || isJdm
                    ? 1.27
                    : 1.22;
        const roofStripeGeo = trackGeo(
          new THREE.BoxGeometry(0.06, 0.022, isLuxurySuv ? 1.8 : 0.95),
        );
        for (const sx of [-0.14, 0.14]) {
          const rs = new THREE.Mesh(roofStripeGeo, accentMaterial);
          rs.position.set(sx, roofY, isLuxurySuv ? 0.3 : 0.1);
          bodyGroup.add(rs);
          canopyHideMeshes.push(rs);
        }
      }
      if (!isTallTruck && !isWagon && !isRally) {
        const deckStripeGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.022, 0.55));
        for (const sx of [-0.14, 0.14]) {
          const ds = new THREE.Mesh(deckStripeGeo, accentMaterial);
          ds.position.set(sx, 0.88, rearZ - 0.42);
          bodyGroup.add(ds);
        }
      }

      // Side glowing accent blades
      const bladeGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.09, isRally ? 1.45 : 1.68));
      const leftBlade = new THREE.Mesh(bladeGeo, accentMaterial);
      leftBlade.position.set(isTallTruck ? -1.04 : -0.96, isTallTruck ? 0.54 : 0.41, 0.04);
      const rightBlade = new THREE.Mesh(bladeGeo, accentMaterial);
      rightBlade.position.set(isTallTruck ? 1.04 : 0.96, isTallTruck ? 0.54 : 0.41, 0.04);
      bodyGroup.add(leftBlade, rightBlade);

      // 6. Sculpted Multi-Element Carbon GT / WRC / Hoop Rear Wing
      const showCarWing = spec?.threeD
        ? spec.threeD.hasRearWing && !isTallTruck && !isSedan && !isWagon
        : !isTallTruck && !isSedan && !isWagon;
      if (showCarWing) {
        const wingH = isRally
          ? 1.42
          : style === 'skyline_r34' || style === 'supra_mk4' || isGtCoupe
            ? 1.26
            : 1.16;
        const wingZ = isRally ? 1.84 : 1.98;
        const wingGrp = new THREE.Group();
        wingGrp.position.set(0, wingH, wingZ);

        const wingGeo = trackGeo(new THREE.BoxGeometry(isRally ? 1.84 : 1.98, 0.065, 0.34));
        const wingMesh = new THREE.Mesh(
          wingGeo,
          style === 'supra_mk4' ? paintMaterial : carbonMaterial,
        );
        wingMesh.rotation.x = 0.15;
        wingMesh.castShadow = !isGhost;
        wingGrp.add(wingMesh);

        if (isRally) {
          const lowerWing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.78, 0.05, 0.28)), paintMaterial);
          lowerWing.position.set(0, -0.18, 0.04);
          wingGrp.add(lowerWing);
        }

        const wingEndGeo = trackGeo(new THREE.BoxGeometry(0.05, isRally ? 0.34 : 0.25, 0.44));
        const leftEnd = new THREE.Mesh(wingEndGeo, paintMaterial);
        leftEnd.position.set(isRally ? -0.92 : -0.99, -0.06, 0);
        const rightEnd = new THREE.Mesh(wingEndGeo, paintMaterial);
        rightEnd.position.set(isRally ? 0.92 : 0.99, -0.06, 0);
        wingGrp.add(leftEnd, rightEnd);

        const strutGeo = trackGeo(new THREE.BoxGeometry(0.055, wingH - 0.8, 0.16));
        const strutL = new THREE.Mesh(strutGeo, carbonMaterial);
        strutL.position.set(-0.48, -(wingH - 0.8) * 0.48, -0.03);
        const strutR = new THREE.Mesh(strutGeo, carbonMaterial);
        strutR.position.set(0.48, -(wingH - 0.8) * 0.48, -0.03);
        wingGrp.add(strutL, strutR);

        bodyGroup.add(wingGrp);
        registerDamagePart(wingGrp, -0.06, 0.08, 0.09);
      }

      // 7. Signature Multi-Element LED Headlights, Crisp DRLs & Taillights
      if (isHellcat) {
        // Dodge Challenger Hellcat: iconic Quad Round Halo Headlights
        const quadHaloGeo = trackGeo(new THREE.TorusGeometry(0.085, 0.022, 8, 16));
        for (const [hx, isInner] of [
          [-0.74, false],
          [-0.53, true],
          [0.53, true],
          [0.74, false],
        ] as const) {
          const halo = new THREE.Mesh(quadHaloGeo, isInner ? drlMat : headlightMat);
          halo.position.set(hx, 0.56, -2.28);
          bodyGroup.add(halo);
        }
      } else if (isLuxurySuv || isGtCoupe) {
        // Signature Round LED Halo Headlights
        const haloHeadGeo = trackGeo(new THREE.TorusGeometry(0.145, 0.028, 8, 18));
        const headZ = isLuxurySuv ? -2.21 : -2.22;
        const headY = isLuxurySuv ? 0.82 : 0.62;
        const hL = new THREE.Mesh(haloHeadGeo, headlightDimMat);
        hL.position.set(-0.66, headY, headZ);
        const hR = new THREE.Mesh(haloHeadGeo, headlightMat);
        hR.position.set(0.66, headY, headZ);
        bodyGroup.add(hL, hR);
        const drlBladeGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.024, 0.09));
        for (const sx of [-0.66, 0.66]) {
          const drl = new THREE.Mesh(drlBladeGeo, drlMat);
          drl.position.set(sx, headY - 0.16, headZ - 0.01);
          bodyGroup.add(drl);
        }
      } else {
        const headGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.065, 0.12));
        const headZ = isRally ? -2.1 : -2.26;
        const headY = isTallTruck ? 0.84 : isRally ? 0.62 : 0.53;
        const headL = new THREE.Mesh(headGeo, headlightDimMat);
        headL.position.set(-0.62, headY, headZ);
        headL.rotation.y = 0.26;
        headL.rotation.z = -0.06;
        const headR = new THREE.Mesh(headGeo, headlightMat);
        headR.position.set(0.62, headY, headZ);
        headR.rotation.y = -0.26;
        headR.rotation.z = 0.06;
        bodyGroup.add(headL, headR);
        const drlBladeGeo = trackGeo(new THREE.BoxGeometry(0.4, 0.022, 0.09));
        for (const sx of [-0.62, 0.62]) {
          const drl = new THREE.Mesh(drlBladeGeo, drlMat);
          drl.position.set(sx, headY - 0.06, headZ - 0.01);
          drl.rotation.y = sx < 0 ? 0.26 : -0.26;
          bodyGroup.add(drl);
        }
      }

      const tailZ = isRally ? 1.96 : 2.22;
      if (style === 'skyline_r34' || style === 'v8_mid' || style === 'supra_mk4') {
        const ringTailGeo = trackGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.08, 14)).rotateX(Math.PI / 2);
        for (const tx of [-0.66, -0.38, 0.38, 0.66]) {
          const ring = new THREE.Mesh(ringTailGeo, brakeLightMat);
          ring.position.set(tx, 0.68, tailZ);
          bodyGroup.add(ring);
        }
      } else {
        const tailBarGeo = trackGeo(new THREE.BoxGeometry(1.68, 0.075, 0.08));
        const tailBar = new THREE.Mesh(tailBarGeo, brakeLightMat);
        tailBar.position.set(0, isTallTruck ? 0.92 : 0.68, tailZ);
        bodyGroup.add(tailBar);
      }

      // 8. Quad/Dual Exhausts + Additive Nitro Flames
      const exhaustGeo = trackGeo(new THREE.CylinderGeometry(0.082, 0.092, 0.26, 14)).rotateX(Math.PI / 2);
      const exhY = isTallTruck ? 0.44 : 0.31;
      const exhZ = isRally ? 1.98 : 2.23;
      for (const ex of [-0.46, -0.3, 0.3, 0.46]) {
        const exh = new THREE.Mesh(exhaustGeo, rimMaterial);
        exh.position.set(ex, exhY, exhZ);
        bodyGroup.add(exh);
      }

      const flameGeo = trackGeo(new THREE.ConeGeometry(0.17, 1.65, 12));
      flameGeo.rotateX(Math.PI / 2);
      flameGeo.translate(0, 0, 0.82);
      const leftFlameMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x22e8ff,
          transparent: true,
          opacity: 0.94,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const rightFlameMat = leftFlameMat.clone();
      materials.push(rightFlameMat);

      const leftFlame = new THREE.Mesh(flameGeo, leftFlameMat);
      leftFlame.position.set(-0.38, exhY, exhZ + 0.05);
      leftFlame.visible = false;
      const rightFlame = new THREE.Mesh(flameGeo, rightFlameMat);
      rightFlame.position.set(0.38, exhY, exhZ + 0.05);
      rightFlame.visible = false;
      bodyGroup.add(leftFlame, rightFlame);
      flamesList.push({ mesh: leftFlame, mat: leftFlameMat }, { mesh: rightFlame, mat: rightFlameMat });

      // 9. Modern Tactical Police Interceptor Styling
      if (isPolice) {
        const whiteDoorMat = trackMat(
          new THREE.MeshPhysicalMaterial({
            color: 0xf1f5f9,
            metalness: 0.38,
            roughness: 0.2,
            clearcoat: 1.0,
          }),
        );
        const doorPanelGeo = trackGeo(new THREE.BoxGeometry(isTallTruck ? 2.08 : 1.94, 0.42, 1.38));
        const doorPanel = new THREE.Mesh(doorPanelGeo, whiteDoorMat);
        doorPanel.position.set(0, 0.56 + groundLift, 0.06);
        bodyGroup.add(doorPanel);

        const decalMat = options.policeDecalTexture
          ? trackMat(
              new THREE.MeshStandardMaterial({
                map: options.policeDecalTexture,
                roughness: 0.24,
                metalness: 0.22,
              }),
            )
          : whiteDoorMat;

        const hoodBadgeGeo = trackGeo(new THREE.BoxGeometry(1.18, 0.032, 0.72));
        const hoodBadge = new THREE.Mesh(hoodBadgeGeo, decalMat);
        hoodBadge.position.set(0, decalY + 0.018, -1.48);
        hoodBadge.rotation.x = 0.14;
        bodyGroup.add(hoodBadge);

        const roofCapGeo = trackGeo(new THREE.BoxGeometry(1.36, 0.07, 0.95));
        const roofCap = new THREE.Mesh(roofCapGeo, decalMat);
        roofCap.position.set(0, isTallTruck ? 1.62 : 1.28, 0.08);
        bodyGroup.add(roofCap);
        canopyHideMeshes.push(roofCap);

        const pushBarGrp = new THREE.Group();
        pushBarGrp.position.set(0, 0.44 + groundLift, -2.35);
        const bullBar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.62, 0.12, 0.12)), carbonMaterial);
        const guardGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.38, 0.14));
        const gL = new THREE.Mesh(guardGeo, carbonMaterial);
        gL.position.set(-0.46, 0.08, 0);
        const gR = new THREE.Mesh(guardGeo, carbonMaterial);
        gR.position.set(0.46, 0.08, 0);
        pushBarGrp.add(bullBar, gL, gR);
        bodyGroup.add(pushBarGrp);
        registerDamagePart(pushBarGrp, -0.05, 0.08, -0.04);

        const barY = isTallTruck ? 1.69 : 1.35;
        const barBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.28, 0.065, 0.2)), carbonMaterial);
        barBase.position.set(0, barY, 0.02);
        bodyGroup.add(barBase);
        canopyHideMeshes.push(barBase);

        policeRedMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xff1e38,
            emissive: 0xff1128,
            emissiveIntensity: 5.5,
            roughness: 0.08,
          }),
        );
        policeBlueMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x1e90ff,
            emissive: 0x0088ff,
            emissiveIntensity: 5.5,
            roughness: 0.08,
          }),
        );
        policeTakedownMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 3.5,
            roughness: 0.08,
          }),
        );

        const beaconGeo = trackGeo(new THREE.BoxGeometry(0.52, 0.11, 0.2));
        const redBeacon = new THREE.Mesh(beaconGeo, policeRedMat);
        redBeacon.position.set(-0.34, barY + 0.07, 0.02);
        const blueBeacon = new THREE.Mesh(beaconGeo, policeBlueMat);
        blueBeacon.position.set(0.34, barY + 0.07, 0.02);
        const tdCenter = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.11, 0.21)), policeTakedownMat);
        tdCenter.position.set(0, barY + 0.07, 0.02);

        const grilleStrobeGeo = trackGeo(new THREE.BoxGeometry(0.2, 0.06, 0.08));
        const grL = new THREE.Mesh(grilleStrobeGeo, policeRedMat);
        grL.position.set(-0.28, 0.42 + groundLift, -2.33);
        const grR = new THREE.Mesh(grilleStrobeGeo, policeBlueMat);
        grR.position.set(0.28, 0.42 + groundLift, -2.33);

        bodyGroup.add(redBeacon, blueBeacon, tdCenter, grL, grR);
        canopyHideMeshes.push(redBeacon, blueBeacon, tdCenter);
      }
    }

    // 10. Four Open Twin-Spoke Alloy Wheels + Slotted Rotors + Painted Calipers
    const tireGeo = trackGeo(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 28),
    );
    tireGeo.rotateZ(Math.PI / 2);

    const rearTireGeo = isFormula
      ? trackGeo(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth + 0.12, 28)).rotateZ(Math.PI / 2)
      : tireGeo;

    const barrelGeo = trackGeo(
      new THREE.CylinderGeometry(wheelRadius * 0.67, wheelRadius * 0.67, wheelWidth - 0.04, 20, 1, true),
    );
    barrelGeo.rotateZ(Math.PI / 2);

    const hubCapGeo = trackGeo(
      new THREE.CylinderGeometry(wheelRadius * 0.22, wheelRadius * 0.24, wheelWidth + 0.025, 14),
    );
    hubCapGeo.rotateZ(Math.PI / 2);

    const rotorGeo = trackGeo(
      new THREE.CylinderGeometry(wheelRadius * 0.56, wheelRadius * 0.56, 0.036, 20),
    );
    rotorGeo.rotateZ(Math.PI / 2);

    const spokeGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.024, wheelRadius * 1.24));
    const caliperGeo = trackGeo(new THREE.BoxGeometry(0.085, 0.18, 0.22));
    const rimRingGeo = trackGeo(new THREE.TorusGeometry(wheelRadius * 0.67, 0.016, 8, 28));
    rimRingGeo.rotateY(Math.PI / 2);

    const createWheel = (x: number, z: number, isFront: boolean) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, wheelRadius, z);

      const spin = new THREE.Group();
      pivot.add(spin);

      const tire = new THREE.Mesh(isFront ? tireGeo : rearTireGeo, tireMaterial);
      tire.castShadow = !isGhost;
      spin.add(tire);

      const effW = !isFront && isFormula ? wheelWidth + 0.12 : wheelWidth;
      const outerSide = x < 0 ? -1 : 1;

      const barrel = new THREE.Mesh(barrelGeo, carbonMaterial);
      spin.add(barrel);

      const hubCap = new THREE.Mesh(hubCapGeo, isFormula ? carbonMaterial : rimMaterial);
      spin.add(hubCap);

      const rotor = new THREE.Mesh(rotorGeo, rotorMaterial);
      rotor.position.x = outerSide * (effW * 0.22);
      spin.add(rotor);

      for (let i = 0; i < 5; i++) {
        const baseA = (i * Math.PI * 2) / 5;
        for (const offsetA of [-0.11, 0.11]) {
          const spoke = new THREE.Mesh(spokeGeo, isFormula ? accentMaterial : rimMaterial);
          spoke.position.x = outerSide * (effW * 0.44);
          spoke.rotation.x = baseA + offsetA;
          spin.add(spoke);
        }
      }

      const rimRing = new THREE.Mesh(rimRingGeo, isFormula ? accentMaterial : rimMaterial);
      rimRing.position.x = outerSide * (effW * 0.5 + 0.004);
      spin.add(rimRing);

      if (!isFormula) {
        const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
        caliper.position.set(outerSide * (effW * 0.23), 0.07, 0.14);
        pivot.add(caliper);
      }

      root.add(pivot);
      wheelSpins.push(spin);
      if (isFront) frontWheelPivots.push(pivot);
    };

    const wx = isTallTruck ? 1.03 : isFormula ? 0.96 : 0.92;
    const fWz = isRally ? -1.26 : -1.36;
    const rWz = isRally ? 1.24 : 1.38;
    createWheel(-wx, fWz, true);
    createWheel(wx, fWz, true);
    createWheel(-wx - 0.02, rWz, false);
    createWheel(wx + 0.02, rWz, false);

    // 11. Crisp Grounded Contact Shadow
    const shadowGeo = trackGeo(new THREE.PlaneGeometry(2.85, 5.25));
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: isGhost ? 0.2 : 0.74,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = 0.022;
    root.add(shadowPlane);
  }

  // Apply gentle real-world dimensional proportioning from Vehicle3DSpec
  if (spec?.threeD && !isPolice) {
    const baseL = isBike ? 2.1 : 4.65;
    const baseW = isBike ? 0.75 : 1.96;
    const baseH = isBike ? 1.15 : spec.bodyStyle === 'beast_4x4' || spec.bodyStyle === 'pickup_truck' || spec.bodyStyle === 'luxury_suv' ? 1.88 : 1.26;
    const sX = Math.max(0.92, Math.min(1.12, spec.threeD.widthM / baseW));
    const sY = Math.max(0.93, Math.min(1.1, spec.threeD.heightM / baseH));
    const sZ = Math.max(0.92, Math.min(1.12, spec.threeD.lengthM / baseL));
    root.scale.set(sX, sY, sZ);
  }

  return {
    root,
    bodyGroup,
    paintMaterial,
    accentMaterial,
    brakeLightMat,
    setPaintColor(hex: number, aHex: number, finish: CarColorPreset['finish'] = 'metallic') {
      if (isGhost) return;
      paintMaterial.color.setHex(hex);
      if (finish === 'matte') {
        paintMaterial.metalness = 0.28;
        paintMaterial.roughness = 0.62;
        paintMaterial.clearcoat = 0.08;
        paintMaterial.clearcoatRoughness = 0.35;
        paintMaterial.normalScale.set(0.015, 0.015);
        paintMaterial.envMapIntensity = 1.15;
      } else if (finish === 'pearl') {
        paintMaterial.metalness = 0.65;
        paintMaterial.roughness = 0.14;
        paintMaterial.clearcoat = 1.0;
        paintMaterial.clearcoatRoughness = 0.045;
        paintMaterial.normalScale.set(0.05, 0.05);
        paintMaterial.envMapIntensity = 2.3;
      } else {
        paintMaterial.metalness = 0.88;
        paintMaterial.roughness = 0.16;
        paintMaterial.clearcoat = 1.0;
        paintMaterial.clearcoatRoughness = 0.055;
        paintMaterial.normalScale.set(0.06, 0.06);
        paintMaterial.envMapIntensity = 2.25;
      }
      accentMaterial.color.setHex(aHex);
      accentMaterial.emissive.setHex(aHex);
      underglowMat.color.setHex(aHex);
      underglowMat.emissive.setHex(aHex);
      caliperMaterial.color.setHex(aHex);
    },
    setNeonColor(aHex: number) {
      if (isGhost) return;
      accentMaterial.color.setHex(aHex);
      accentMaterial.emissive.setHex(aHex);
      underglowMat.color.setHex(aHex);
      underglowMat.emissive.setHex(aHex);
      underglowMat.emissiveIntensity = 1.15;
      caliperMaterial.color.setHex(aHex);
    },
    setWheelFinish(hex: number, metalness: number, roughness: number) {
      if (isGhost) return;
      rimMaterial.color.setHex(hex);
      rimMaterial.metalness = metalness;
      rimMaterial.roughness = roughness;
      rimMaterial.needsUpdate = true;
    },
    setTruckArtEnabled(enabled: boolean) {
      if (decalMesh) decalMesh.visible = enabled;
      if (stripeFallbackMesh) stripeFallbackMesh.visible = !enabled;
    },
    setCameraMode(mode: CameraMode) {
      currentCamMode = mode;
      const hideInteriorBlockers = mode === 'COCKPIT';
      for (const m of canopyHideMeshes) {
        m.visible = !hideInteriorBlockers;
      }
      if (cockpitGroup) {
        cockpitGroup.visible = mode === 'COCKPIT' || !isGhost;
      }
    },
    setDamageLevel(dmg01: number) {
      currentDamage = THREE.MathUtils.clamp(dmg01, 0, 1);
      for (const d of damageRefs) {
        d.obj.position.y = d.baseY + d.dropY * currentDamage;
        d.obj.rotation.x = d.baseRotX + d.tiltX * currentDamage;
        d.obj.rotation.z = d.baseRotZ + d.tiltZ * currentDamage;
      }
    },
    updateVisuals({
      dt,
      speed,
      steerAngle,
      bodyRoll,
      bodyPitch,
      isBraking,
      isBoosting,
      elapsed,
    }) {
      const spinDelta = -(speed / wheelRadius) * dt;
      for (const s of wheelSpins) s.rotation.x += spinDelta;

      for (const fp of frontWheelPivots) {
        fp.rotation.y = steerAngle * (isBike ? 0.38 : 0.55);
      }

      if (steeringPivot) {
        steeringPivot.rotation.z = isBike ? 0 : steerAngle * 0.88;
        steeringPivot.rotation.y = isBike ? steerAngle * 0.35 : 0;
      }

      bodyGroup.rotation.z = THREE.MathUtils.damp(bodyGroup.rotation.z, bodyRoll, isBike ? 9 : 10, dt);
      bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, bodyPitch, isBike ? 8 : 10, dt);

      brakeLightMat.emissiveIntensity = isBraking ? 6.2 : 1.75;

      // Flickering damaged left headlight when hull < 55%
      if (currentDamage > 0.45) {
        const flicker = Math.sin(elapsed * 29) > -0.25 ? 0.35 : 3.2;
        headlightDimMat.emissiveIntensity = currentDamage > 0.78 ? 0.1 : flicker;
      } else {
        headlightDimMat.emissiveIntensity = 3.4;
      }

      for (const fl of flamesList) {
        if (isBoosting && currentCamMode !== 'COCKPIT') {
          fl.mesh.visible = true;
          const flicker = 0.95 + Math.sin(elapsed * 65) * 0.28 + Math.random() * 0.25;
          fl.mesh.scale.set(1.15, 1.15, flicker * 1.65);
          fl.mat.color.setHex(Math.random() > 0.35 ? 0x00eeff : 0xffaa33);
        } else {
          fl.mesh.visible = false;
        }
      }

      if (policeRedMat && policeBlueMat) {
        const flashPhase = Math.sin(elapsed * 22) > 0;
        policeRedMat.emissiveIntensity = flashPhase ? 8.5 : 0.3;
        policeBlueMat.emissiveIntensity = flashPhase ? 0.3 : 8.5;
        if (policeTakedownMat) {
          policeTakedownMat.emissiveIntensity = Math.sin(elapsed * 34) > 0.5 ? 6.5 : 1.0;
        }
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export function createSupercarModel(
  paintHex: number,
  accentHex: number,
  contactShadowTexture: THREE.Texture,
  options: CarModelOptions = {},
): CarModelRig {
  return createVehicleModel(paintHex, accentHex, contactShadowTexture, options);
}

export function createPoliceInterceptorModel(
  contactShadowTexture: THREE.Texture,
  policeDecalTexture?: THREE.Texture,
  vehicleSpec?: VehicleSpec,
): CarModelRig {
  return createVehicleModel(0x10141f, 0x00aaff, contactShadowTexture, {
    vehicleSpec,
    isPolice: true,
    policeDecalTexture,
  });
}

export interface TrafficVehicleRig {
  root: THREE.Group;
  updateVisuals: (dt: number, speed: number) => void;
  dispose: () => void;
}

export function createDecoratedTruckModel(
  truckArtTexture: THREE.Texture,
  contactShadowTexture: THREE.Texture,
): TrafficVehicleRig {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const artMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: truckArtTexture,
      roughness: 0.36,
      metalness: 0.25,
      emissiveMap: truckArtTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.24,
    }),
  );
  const cabMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      metalness: 0.65,
      roughness: 0.22,
      clearcoat: 1.0,
    }),
  );
  const chromeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.16,
    }),
  );
  const darkMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.3 }),
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
    }),
  );
  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.88, metalness: 0.05 }),
  );
  const headMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 2.5 }),
  );
  const tailMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 2.3 }),
  );

  // Sculpted Bedford Truck Cargo Bed + Art Side Panels
  const cargoGeo = trackGeo(new THREE.BoxGeometry(2.22, 1.92, 3.72));
  const cargo = new THREE.Mesh(cargoGeo, artMat);
  cargo.position.set(0, 1.54, 0.72);
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  root.add(cargo);

  // Sloped Aerodynamic Cab Profile
  const cabShape = new THREE.Shape();
  cabShape.moveTo(-2.55, 0.52);
  cabShape.lineTo(-2.58, 1.25);
  cabShape.lineTo(-2.25, 1.98);
  cabShape.lineTo(-1.12, 2.02);
  cabShape.lineTo(-1.12, 0.52);
  cabShape.closePath();
  const cabGeo = trackGeo(
    new THREE.ExtrudeGeometry(cabShape, {
      depth: 1.94,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: 2,
    }),
  );
  cabGeo.translate(0, 0, -0.97);
  cabGeo.rotateY(-Math.PI / 2);
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.castShadow = true;
  root.add(cab);

  // Signature Pakistani Decorative Curved Crown (Taj)
  const crownGeo = trackGeo(new THREE.CylinderGeometry(0.85, 1.05, 0.55, 8));
  crownGeo.scale(1.15, 1, 0.35);
  const crown = new THREE.Mesh(crownGeo, artMat);
  crown.position.set(0, 2.32, -1.78);
  root.add(crown);

  const windGeo = trackGeo(new THREE.BoxGeometry(1.86, 0.58, 0.08));
  const wind = new THREE.Mesh(windGeo, glassMat);
  wind.position.set(0, 1.62, -2.44);
  wind.rotation.x = 0.25;
  root.add(wind);

  const bumperGeo = trackGeo(new THREE.BoxGeometry(2.22, 0.28, 0.22));
  const bumper = new THREE.Mesh(bumperGeo, chromeMat);
  bumper.position.set(0, 0.46, -2.6);
  root.add(bumper);

  // Side Mirrors + Rear Mudflaps
  const mirrorGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.34, 0.14));
  for (const sx of [-1.14, 1.14]) {
    const mir = new THREE.Mesh(mirrorGeo, chromeMat);
    mir.position.set(sx, 1.56, -2.26);
    root.add(mir);
  }
  const flapGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.42, 0.05));
  for (const sx of [-0.78, 0.78]) {
    const flap = new THREE.Mesh(flapGeo, darkMat);
    flap.position.set(sx, 0.38, 2.58);
    root.add(flap);
  }

  const lampGeo = trackGeo(new THREE.BoxGeometry(0.34, 0.14, 0.08));
  const hl = new THREE.Mesh(lampGeo, headMat);
  hl.position.set(-0.74, 0.82, -2.62);
  const hr = new THREE.Mesh(lampGeo, headMat);
  hr.position.set(0.74, 0.82, -2.62);
  const tl = new THREE.Mesh(lampGeo, tailMat);
  tl.position.set(-0.76, 0.72, 2.6);
  const tr = new THREE.Mesh(lampGeo, tailMat);
  tr.position.set(0.76, 0.72, 2.6);
  root.add(hl, hr, tl, tr);

  const wheelR = 0.44;
  const wheelGeo = trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.34, 18));
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = trackGeo(new THREE.CylinderGeometry(wheelR * 0.56, wheelR * 0.56, 0.36, 12));
  rimGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  const coords = [
    [-1.02, -1.72],
    [1.02, -1.72],
    [-1.02, 1.05],
    [1.02, 1.05],
    [-1.02, 2.02],
    [1.02, 2.02],
  ];
  for (const [wx, wz] of coords) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wheelR, wz);
    w.castShadow = true;
    const r = new THREE.Mesh(rimGeo, chromeMat);
    r.position.copy(w.position);
    root.add(w, r);
    wheels.push(w);
  }

  const sGeo = trackGeo(new THREE.PlaneGeometry(2.9, 5.8));
  sGeo.rotateX(-Math.PI / 2);
  const sMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const sPlane = new THREE.Mesh(sGeo, sMat);
  sPlane.position.y = 0.022;
  root.add(sPlane);

  return {
    root,
    updateVisuals(dt, speed) {
      const delta = -(speed / wheelR) * dt;
      for (const w of wheels) w.rotation.x += delta;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export function createAutoRickshawModel(
  truckArtTexture: THREE.Texture,
  contactShadowTexture: THREE.Texture,
): TrafficVehicleRig {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const greenBodyMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x00a86b,
      metalness: 0.55,
      roughness: 0.24,
      clearcoat: 1.0,
    }),
  );
  const goldRoofMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffc300,
      metalness: 0.22,
      roughness: 0.5,
    }),
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.08,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    }),
  );
  const artMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: truckArtTexture,
      roughness: 0.36,
      emissiveMap: truckArtTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
    }),
  );
  const chromeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }),
  );
  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.88, metalness: 0.05 }),
  );
  const headMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5cc, emissiveIntensity: 2.6 }),
  );
  const tailMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 2.4 }),
  );

  // Curved Auto-Rickshaw Hull
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.42, 0.34);
  hullShape.quadraticCurveTo(-1.48, 0.85, -1.02, 0.98);
  hullShape.lineTo(1.25, 1.04);
  hullShape.lineTo(1.32, 0.38);
  hullShape.closePath();
  const bodyGeo = trackGeo(
    new THREE.ExtrudeGeometry(hullShape, {
      depth: 1.32,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: 2,
    }),
  );
  bodyGeo.translate(0, 0, -0.66);
  bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, greenBodyMat);
  body.castShadow = true;
  root.add(body);

  // Curved Canopy Top + Angled Windshield
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.02, 0.96);
  roofShape.lineTo(-0.76, 1.72);
  roofShape.quadraticCurveTo(0.28, 1.82, 1.24, 1.66);
  roofShape.lineTo(1.28, 1.02);
  roofShape.closePath();
  const roofGeo = trackGeo(
    new THREE.ExtrudeGeometry(roofShape, {
      depth: 1.3,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 2,
    }),
  );
  roofGeo.translate(0, 0, -0.65);
  roofGeo.rotateY(-Math.PI / 2);
  const roof = new THREE.Mesh(roofGeo, goldRoofMat);
  roof.castShadow = true;
  root.add(roof);

  const windGeo = trackGeo(new THREE.BoxGeometry(1.18, 0.56, 0.06));
  const wind = new THREE.Mesh(windGeo, glassMat);
  wind.position.set(0, 1.32, -0.92);
  wind.rotation.x = 0.36;
  root.add(wind);

  const rearArtGeo = trackGeo(new THREE.BoxGeometry(1.36, 0.68, 0.1));
  const rearArt = new THREE.Mesh(rearArtGeo, artMat);
  rearArt.position.set(0, 0.88, 1.34);
  root.add(rearArt);

  const hlGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12));
  hlGeo.rotateX(Math.PI / 2);
  const hl = new THREE.Mesh(hlGeo, headMat);
  hl.position.set(0, 0.68, -1.5);
  root.add(hl);

  const tlGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.11, 0.08));
  const tl = new THREE.Mesh(tlGeo, tailMat);
  tl.position.set(-0.48, 0.6, 1.4);
  const tr = new THREE.Mesh(tlGeo, tailMat);
  tr.position.set(0.48, 0.6, 1.4);
  root.add(tl, tr);

  const wheelR = 0.29;
  const wheelGeo = trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.22, 16));
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = trackGeo(new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, 0.24, 12));
  rimGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  const coords = [
    [0, -1.2],
    [-0.76, 0.95],
    [0.76, 0.95],
  ];
  for (const [wx, wz] of coords) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wheelR, wz);
    w.castShadow = true;
    const r = new THREE.Mesh(rimGeo, chromeMat);
    r.position.copy(w.position);
    root.add(w, r);
    wheels.push(w);
  }

  const sGeo = trackGeo(new THREE.PlaneGeometry(1.9, 3.2));
  sGeo.rotateX(-Math.PI / 2);
  const sMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const sPlane = new THREE.Mesh(sGeo, sMat);
  sPlane.position.y = 0.022;
  root.add(sPlane);

  return {
    root,
    updateVisuals(dt, speed) {
      const delta = -(speed / wheelR) * dt;
      for (const w of wheels) w.rotation.x += delta;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export function createDesiBusModel(
  truckArtTexture: THREE.Texture,
  contactShadowTexture: THREE.Texture,
): TrafficVehicleRig {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const bodyMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      metalness: 0.52,
      roughness: 0.24,
      clearcoat: 1.0,
    }),
  );
  const artMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: truckArtTexture,
      roughness: 0.34,
      emissiveMap: truckArtTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.25,
    }),
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x091120,
      roughness: 0.06,
      metalness: 0.35,
      clearcoat: 1.0,
    }),
  );
  const chromeMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 }),
  );
  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.88, metalness: 0.05 }),
  );
  const tailMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 2.3 }),
  );
  const headMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5cc, emissiveIntensity: 2.6 }),
  );

  // Aerodynamic Sloped Express Coach Bus Profile
  const busProfile = new THREE.Shape();
  busProfile.moveTo(-3.45, 0.38);
  busProfile.quadraticCurveTo(-3.55, 1.5, -3.12, 2.74);
  busProfile.lineTo(3.32, 2.74);
  busProfile.lineTo(3.42, 0.42);
  busProfile.closePath();
  const hullGeo = trackGeo(
    new THREE.ExtrudeGeometry(busProfile, {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.08,
      bevelSegments: 3,
      curveSegments: 12,
    }),
  );
  hullGeo.translate(0, 0, -1.1);
  hullGeo.rotateY(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, bodyMat);
  hull.castShadow = true;
  root.add(hull);

  const sideArtGeo = trackGeo(new THREE.BoxGeometry(2.42, 0.78, 5.9));
  const sideArt = new THREE.Mesh(sideArtGeo, artMat);
  sideArt.position.set(0, 0.96, 0.05);
  root.add(sideArt);

  const winGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.84, 5.7));
  const win = new THREE.Mesh(winGeo, glassMat);
  win.position.set(0, 2.02, -0.16);
  root.add(win);

  // Roof AC Pods
  const acGeo = trackGeo(new THREE.BoxGeometry(1.36, 0.22, 1.45));
  for (const az of [-0.9, 1.1]) {
    const ac = new THREE.Mesh(acGeo, chromeMat);
    ac.position.set(0, 2.9, az);
    root.add(ac);
  }

  const lampGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.15, 0.08));
  const hl = new THREE.Mesh(lampGeo, headMat);
  hl.position.set(-0.78, 0.72, -3.54);
  const hr = new THREE.Mesh(lampGeo, headMat);
  hr.position.set(0.78, 0.72, -3.54);
  const tl = new THREE.Mesh(lampGeo, tailMat);
  tl.position.set(-0.78, 0.82, 3.5);
  const tr = new THREE.Mesh(lampGeo, tailMat);
  tr.position.set(0.78, 0.82, 3.5);
  root.add(hl, hr, tl, tr);

  const wheelR = 0.45;
  const wheelGeo = trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.34, 18));
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = trackGeo(new THREE.CylinderGeometry(wheelR * 0.6, wheelR * 0.6, 0.36, 12));
  rimGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  for (const [wx, wz] of [
    [-1.12, -2.0],
    [1.12, -2.0],
    [-1.12, 2.0],
    [1.12, 2.0],
  ]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wheelR, wz);
    w.castShadow = true;
    const r = new THREE.Mesh(rimGeo, chromeMat);
    r.position.copy(w.position);
    root.add(w, r);
    wheels.push(w);
  }

  const sGeo = trackGeo(new THREE.PlaneGeometry(3.1, 7.8));
  sGeo.rotateX(-Math.PI / 2);
  const sMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const sPlane = new THREE.Mesh(sGeo, sMat);
  sPlane.position.y = 0.022;
  root.add(sPlane);

  return {
    root,
    updateVisuals(dt, speed) {
      const delta = -(speed / wheelR) * dt;
      for (const w of wheels) w.rotation.x += delta;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export function createTrafficSedanModel(
  colorHex: number,
  contactShadowTexture: THREE.Texture,
  variant: 'sedan' | 'suv' | 'hatchback' | 'pickup' = 'sedan',
): TrafficVehicleRig {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const isSuv = variant === 'suv';
  const isHatch = variant === 'hatchback';
  const isPickup = variant === 'pickup';

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const paintMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 1.0,
    }),
  );
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x091120,
      roughness: 0.06,
      metalness: 0.3,
      clearcoat: 1.0,
    }),
  );
  const trimMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x151822, roughness: 0.5, metalness: 0.3 }),
  );
  const rimMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 }),
  );
  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.88, metalness: 0.05 }),
  );
  const tailMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0xff1133, emissiveIntensity: 2.3 }),
  );
  const headMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe6f8ff, emissiveIntensity: 2.6 }),
  );

  const profile = new THREE.Shape();
  if (isPickup) {
    profile.moveTo(-2.15, 0.36);
    profile.lineTo(-2.18, 0.94);
    profile.lineTo(-1.14, 1.02);
    profile.lineTo(-0.72, 1.56);
    profile.lineTo(0.36, 1.56);
    profile.lineTo(0.46, 0.88);
    profile.lineTo(2.14, 0.88);
    profile.lineTo(2.12, 0.38);
    profile.closePath();
  } else if (isSuv) {
    profile.moveTo(-2.15, 0.34);
    profile.quadraticCurveTo(-2.22, 0.72, -2.1, 0.92);
    profile.lineTo(-1.12, 1.0);
    profile.lineTo(-0.68, 1.54);
    profile.lineTo(1.52, 1.5);
    profile.lineTo(2.08, 1.04);
    profile.lineTo(2.1, 0.36);
    profile.closePath();
  } else if (isHatch) {
    profile.moveTo(-1.92, 0.28);
    profile.quadraticCurveTo(-2.0, 0.54, -1.88, 0.68);
    profile.lineTo(-0.98, 0.82);
    profile.lineTo(-0.5, 1.28);
    profile.lineTo(1.16, 1.26);
    profile.lineTo(1.76, 0.76);
    profile.lineTo(1.8, 0.3);
    profile.closePath();
  } else {
    profile.moveTo(-2.1, 0.26);
    profile.quadraticCurveTo(-2.18, 0.5, -2.06, 0.64);
    profile.lineTo(-1.05, 0.78);
    profile.lineTo(-0.46, 1.24);
    profile.quadraticCurveTo(0.24, 1.28, 0.92, 1.15);
    profile.lineTo(1.94, 0.86);
    profile.lineTo(2.08, 0.3);
    profile.closePath();
  }
  const bodyW = isSuv || isPickup ? 1.82 : 1.66;
  const hullGeo = trackGeo(
    new THREE.ExtrudeGeometry(profile, {
      depth: bodyW,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.08,
      bevelSegments: 3,
      curveSegments: 12,
    }),
  );
  hullGeo.translate(0, 0, -bodyW * 0.5);
  hullGeo.rotateY(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, paintMat);
  hull.castShadow = true;
  root.add(hull);

  const cabGeo = trackGeo(
    new THREE.BoxGeometry(
      bodyW - 0.14,
      isSuv || isPickup ? 0.46 : 0.38,
      isPickup ? 1.18 : isSuv ? 2.45 : isHatch ? 1.85 : 2.05,
    ),
  );
  const cab = new THREE.Mesh(cabGeo, glassMat);
  cab.position.set(
    0,
    isSuv || isPickup ? 1.26 : 1.04,
    isPickup ? -0.18 : isSuv ? 0.32 : isHatch ? 0.24 : 0.16,
  );
  root.add(cab);

  const frontZ = isHatch ? -1.96 : -2.18;
  const rearZ = isHatch ? 1.82 : 2.12;
  const grilleGeo = trackGeo(new THREE.BoxGeometry(1.1, 0.22, 0.08));
  const grille = new THREE.Mesh(grilleGeo, trimMat);
  grille.position.set(0, isSuv || isPickup ? 0.64 : 0.45, frontZ);
  root.add(grille);

  const lampGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.09, 0.08));
  const hl = new THREE.Mesh(lampGeo, headMat);
  hl.position.set(-0.6, isSuv || isPickup ? 0.78 : 0.58, frontZ + 0.02);
  const hr = new THREE.Mesh(lampGeo, headMat);
  hr.position.set(0.6, isSuv || isPickup ? 0.78 : 0.58, frontZ + 0.02);
  const tl = new THREE.Mesh(lampGeo, tailMat);
  tl.position.set(-0.6, isSuv || isPickup ? 0.88 : 0.68, rearZ);
  const tr = new THREE.Mesh(lampGeo, tailMat);
  tr.position.set(0.6, isSuv || isPickup ? 0.88 : 0.68, rearZ);
  root.add(hl, hr, tl, tr);

  const wheelR = isSuv || isPickup ? 0.4 : 0.34;
  const wheelGeo = trackGeo(new THREE.CylinderGeometry(wheelR, wheelR, 0.25, 16));
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = trackGeo(new THREE.CylinderGeometry(wheelR * 0.64, wheelR * 0.64, 0.27, 12));
  rimGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  const wx = isSuv || isPickup ? 0.94 : 0.86;
  const wz = isHatch ? 1.15 : 1.28;
  for (const [cx, cz] of [
    [-wx, -wz],
    [wx, -wz],
    [-wx, wz],
    [wx, wz],
  ]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(cx, wheelR, cz);
    w.castShadow = true;
    const r = new THREE.Mesh(rimGeo, rimMat);
    r.position.copy(w.position);
    root.add(w, r);
    wheels.push(w);
  }

  const sGeo = trackGeo(new THREE.PlaneGeometry(2.4, 4.8));
  sGeo.rotateX(-Math.PI / 2);
  const sMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const sPlane = new THREE.Mesh(sGeo, sMat);
  sPlane.position.y = 0.022;
  root.add(sPlane);

  return {
    root,
    updateVisuals(dt, speed) {
      const delta = -(speed / wheelR) * dt;
      for (const w of wheels) w.rotation.x += delta;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
