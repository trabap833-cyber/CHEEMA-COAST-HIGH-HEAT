import * as THREE from 'three';
import { WeatherType } from './types';

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  startScale: number;
  endScale: number;
  color: THREE.Color;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class PooledParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly slots: ParticleSlot[];
  private cursor = 0;
  private readonly capacity: number;
  private activeCapacity: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;

  constructor(capacity = 360) {
    this.capacity = capacity;
    this.activeCapacity = capacity;
    this.geometry = new THREE.IcosahedronGeometry(0.32, 1);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.slots = [];
    for (let i = 0; i < capacity; i++) {
      this.slots.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        life: 1,
        startScale: 0.4,
        endScale: 1.5,
        color: new THREE.Color(0xffffff),
      });
      _dummy.position.set(0, -100, 0);
      _dummy.scale.setScalar(0.001);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public setBudgetScale(scale01: number): void {
    const nextCap = Math.max(16, Math.min(this.capacity, Math.round(this.capacity * scale01)));
    if (nextCap === this.activeCapacity) return;
    if (nextCap < this.activeCapacity) {
      for (let i = nextCap; i < this.activeCapacity; i++) {
        this.slots[i].active = false;
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    this.activeCapacity = nextCap;
    this.mesh.count = nextCap;
    this.cursor = this.cursor % nextCap;
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    life: number,
    startScale: number,
    endScale: number,
    colorHex: number,
  ): void {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % this.activeCapacity;

    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.vx = vx;
    slot.vy = vy;
    slot.vz = vz;
    slot.age = 0;
    slot.life = life;
    slot.startScale = startScale;
    slot.endScale = endScale;
    slot.color.setHex(colorHex);
  }

  public update(dt: number): void {
    let anyColor = false;
    for (let i = 0; i < this.activeCapacity; i++) {
      const s = this.slots[i];
      if (!s.active) continue;

      s.age += dt;
      if (s.age >= s.life) {
        s.active = false;
        _dummy.position.set(0, -100, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      const t = s.age / s.life;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vy += 0.45 * dt;

      const scaleCurve =
        t < 0.7
          ? THREE.MathUtils.lerp(s.startScale, s.endScale, t / 0.7)
          : THREE.MathUtils.lerp(s.endScale, 0.01, (t - 0.7) / 0.3);
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.scale.setScalar(Math.max(0.01, scaleCurve));
      _dummy.rotation.set(s.age * 1.8, s.age * 1.2, 0);
      _dummy.updateMatrix();

      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, s.color);
      anyColor = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (anyColor && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

interface StreakSlot {
  angle: number;
  radius: number;
  zOffset: number;
  speedMul: number;
}

const _streakFwd = new THREE.Vector3();
const _streakRight = new THREE.Vector3();
const _streakUp = new THREE.Vector3(0, 1, 0);
const _streakDummy = new THREE.Object3D();

export class SpeedStreakSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly slots: StreakSlot[] = [];
  private readonly capacity: number;
  private activeCapacity: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;

  constructor(capacity = 52) {
    this.capacity = capacity;
    this.activeCapacity = capacity;
    this.geometry = new THREE.BoxGeometry(0.045, 0.045, 3.8);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x99f6ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < capacity; i++) {
      this.slots.push({
        angle: (i / capacity) * Math.PI * 2 + (Math.random() - 0.5) * 0.25,
        radius: 5.2 + Math.random() * 5.5,
        zOffset: -Math.random() * 34,
        speedMul: 0.8 + Math.random() * 0.5,
      });
      _streakDummy.position.set(0, -100, 0);
      _streakDummy.scale.setScalar(0.001);
      _streakDummy.updateMatrix();
      this.mesh.setMatrixAt(i, _streakDummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public setBudgetScale(scale01: number): void {
    const nextCap = Math.max(12, Math.min(this.capacity, Math.round(this.capacity * scale01)));
    this.activeCapacity = nextCap;
    this.mesh.count = nextCap;
  }

  public update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    speedKmh: number,
    isBoosting: boolean,
    active: boolean,
  ): void {
    const intensity = active
      ? THREE.MathUtils.clamp((speedKmh - 165) / 195, 0, 1) + (isBoosting ? 0.45 : 0)
      : 0;
    const clampedIntensity = THREE.MathUtils.clamp(intensity, 0, 1);

    this.material.opacity = THREE.MathUtils.damp(
      this.material.opacity,
      clampedIntensity * (isBoosting ? 0.58 : 0.36),
      10,
      dt,
    );
    this.material.color.setHex(isBoosting ? 0x38f2ff : 0xcceeff);

    if (this.material.opacity < 0.015) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    camera.getWorldDirection(_streakFwd);
    _streakRight.crossVectors(_streakFwd, _streakUp).normalize();
    const camUp = _streakUp;

    const travelSpeed = (45 + speedKmh * 0.35 + (isBoosting ? 42 : 0)) * dt;
    const streakLen = 0.65 + clampedIntensity * (isBoosting ? 2.1 : 1.15);

    for (let i = 0; i < this.activeCapacity; i++) {
      const s = this.slots[i];
      s.zOffset += travelSpeed * s.speedMul;
      if (s.zOffset > 3) {
        s.zOffset = -30 - Math.random() * 10;
        s.angle = Math.random() * Math.PI * 2;
        s.radius = 5.0 + Math.random() * 5.8;
      }

      const cosA = Math.cos(s.angle) * s.radius;
      const sinA = Math.sin(s.angle) * s.radius * 0.65;

      _streakDummy.position
        .copy(camera.position)
        .addScaledVector(_streakFwd, -s.zOffset + 4)
        .addScaledVector(_streakRight, cosA)
        .addScaledVector(camUp, sinA);

      _streakDummy.quaternion.copy(camera.quaternion);
      _streakDummy.scale.set(1, 1, streakLen);
      _streakDummy.updateMatrix();
      this.mesh.setMatrixAt(i, _streakDummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

interface WeatherDrop {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
}

const _wDummy = new THREE.Object3D();

export class WeatherParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly drops: WeatherDrop[] = [];
  private readonly capacity: number;
  private activeCapacity: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;
  private weather: WeatherType = 'NONE';
  private baseOpacity = 0.45;
  private intensityScale = 1;

  constructor(capacity = 180) {
    this.capacity = capacity;
    this.activeCapacity = capacity;
    this.geometry = new THREE.BoxGeometry(0.06, 0.85, 0.06);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < capacity; i++) {
      this.drops.push({
        x: (Math.random() - 0.5) * 64,
        y: Math.random() * 24,
        z: (Math.random() - 0.5) * 64,
        vx: 0,
        vy: -25,
        vz: 0,
        scale: 0.8 + Math.random() * 0.7,
      });
    }
    this.setWeather('NONE');
  }

  public setBudgetScale(scale01: number): void {
    const nextCap = Math.max(24, Math.min(this.capacity, Math.round(this.capacity * scale01)));
    this.activeCapacity = nextCap;
    this.mesh.count = nextCap;
  }

  public setWeather(type: WeatherType, resetPositions = true): void {
    const changed = this.weather !== type;
    this.weather = type;
    if (type === 'NONE') {
      this.baseOpacity = 0;
      this.material.opacity = 0;
      this.mesh.visible = false;
      return;
    }

    if (type === 'RAIN') {
      this.material.color.setHex(0xbfe9ff);
      this.baseOpacity = 0.58;
    } else if (type === 'MIST') {
      this.material.color.setHex(0xcbd5e1);
      this.baseOpacity = 0.24;
    } else if (type === 'DUST') {
      this.material.color.setHex(0xfde68a);
      this.baseOpacity = 0.34;
    } else if (type === 'SPARKS') {
      this.material.color.setHex(0xfb923c);
      this.baseOpacity = 0.72;
    } else {
      // BOKEH
      this.material.color.setHex(0xfef08a);
      this.baseOpacity = 0.24;
    }

    this.material.opacity = this.baseOpacity * this.intensityScale;
    this.mesh.visible = this.intensityScale > 0.015;

    if (changed && resetPositions) {
      for (const d of this.drops) {
        d.x = (Math.random() - 0.5) * 64;
        d.y = Math.random() * 24;
        d.z = (Math.random() - 0.5) * 64;
      }
    }
  }

  public setIntensity(scale01: number): void {
    this.intensityScale = THREE.MathUtils.clamp(scale01, 0, 1.35);
    if (this.weather === 'NONE' || this.intensityScale <= 0.015) {
      this.material.opacity = 0;
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.material.opacity = Math.min(0.85, this.baseOpacity * this.intensityScale);
  }

  public update(dt: number, anchorPos: THREE.Vector3): void {
    if (this.weather === 'NONE' || !this.mesh.visible) return;

    const isRain = this.weather === 'RAIN';
    const isMist = this.weather === 'MIST';
    const isSparks = this.weather === 'SPARKS';
    const isDust = this.weather === 'DUST';

    for (let i = 0; i < this.activeCapacity; i++) {
      const d = this.drops[i];
      if (isRain) {
        d.y -= 42 * dt;
        d.x -= 6.5 * dt;
        if (d.y < 0) d.y = 24;
        if (d.x < -32) d.x = 32;
        _wDummy.scale.set(0.85, d.scale * 1.9, 0.85);
        _wDummy.rotation.set(0, 0, -0.15);
      } else if (isMist) {
        d.x += (2.8 + Math.sin(i) * 1.5) * dt;
        d.y += Math.sin(d.x * 0.1) * 0.35 * dt;
        if (d.x > 32) d.x = -32;
        _wDummy.scale.set(17 * d.scale, 1.7, 17 * d.scale);
        _wDummy.rotation.set(0, i * 0.2, 0);
      } else if (isSparks) {
        d.y += (5 + (i % 5)) * dt;
        d.x += Math.sin(d.y * 0.8 + i) * 3 * dt;
        if (d.y > 20) d.y = 0.5;
        _wDummy.scale.set(1.4, 0.35, 1.4);
        _wDummy.rotation.set(0, i, 0);
      } else if (isDust) {
        d.x += 9 * dt;
        d.z += 4 * dt;
        if (d.x > 32) d.x = -32;
        if (d.z > 32) d.z = -32;
        _wDummy.scale.set(3.2 * d.scale, 0.45, 3.2 * d.scale);
        _wDummy.rotation.set(0, i * 0.4, 0);
      } else {
        // Bokeh motes
        d.y += Math.sin(i + d.x * 0.2) * 0.6 * dt;
        d.x += 1.2 * dt;
        if (d.x > 32) d.x = -32;
        _wDummy.scale.set(2.2, 0.22, 2.2);
        _wDummy.rotation.set(0, 0, 0);
      }

      _wDummy.position.set(
        anchorPos.x + d.x,
        Math.max(0.2, anchorPos.y + d.y),
        anchorPos.z + d.z,
      );
      _wDummy.updateMatrix();
      this.mesh.setMatrixAt(i, _wDummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

interface SparkSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  groundY: number;
  age: number;
  life: number;
  color: THREE.Color;
}

const _sparkDummy = new THREE.Object3D();
const _sparkDir = new THREE.Vector3();
const _sparkTarget = new THREE.Vector3();

export class SparkParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly slots: SparkSlot[] = [];
  private cursor = 0;
  private readonly capacity: number;
  private activeCapacity: number;
  private budgetScale = 1;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;

  constructor(capacity = 260) {
    this.capacity = capacity;
    this.activeCapacity = capacity;
    this.geometry = new THREE.BoxGeometry(0.055, 0.055, 0.65);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < capacity; i++) {
      this.slots.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        groundY: 0,
        age: 0,
        life: 0.5,
        color: new THREE.Color(0xffcc55),
      });
      _sparkDummy.position.set(0, -100, 0);
      _sparkDummy.scale.setScalar(0.0001);
      _sparkDummy.updateMatrix();
      this.mesh.setMatrixAt(i, _sparkDummy.matrix);
      this.mesh.setColorAt(i, _color.setHex(0xffcc55));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public setBudgetScale(scale01: number): void {
    this.budgetScale = THREE.MathUtils.clamp(scale01, 0.2, 1);
    const nextCap = Math.max(16, Math.min(this.capacity, Math.round(this.capacity * this.budgetScale)));
    if (nextCap === this.activeCapacity) return;
    if (nextCap < this.activeCapacity) {
      for (let i = nextCap; i < this.activeCapacity; i++) {
        this.slots[i].active = false;
        _sparkDummy.position.set(0, -100, 0);
        _sparkDummy.scale.setScalar(0.0001);
        _sparkDummy.updateMatrix();
        this.mesh.setMatrixAt(i, _sparkDummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    this.activeCapacity = nextCap;
    this.mesh.count = nextCap;
    this.cursor = this.cursor % nextCap;
  }

  public spawnBurst(
    x: number,
    y: number,
    z: number,
    groundY: number,
    baseVx: number,
    baseVz: number,
    count: number,
    intensity = 1,
  ): void {
    const palette = [0xfff3b0, 0xffb703, 0xfb5607, 0xffe066];
    const scaledCount = Math.max(2, Math.round(count * this.budgetScale));
    for (let i = 0; i < scaledCount; i++) {
      const slot = this.slots[this.cursor];
      this.cursor = (this.cursor + 1) % this.activeCapacity;

      const spread = 11 + intensity * 12;
      slot.active = true;
      slot.x = x + (Math.random() - 0.5) * 0.45;
      slot.y = y + Math.random() * 0.35;
      slot.z = z + (Math.random() - 0.5) * 0.45;
      slot.vx = baseVx * 0.45 + (Math.random() - 0.5) * spread;
      slot.vy = 2.5 + Math.random() * (6.5 + intensity * 4);
      slot.vz = baseVz * 0.45 + (Math.random() - 0.5) * spread;
      slot.groundY = groundY;
      slot.age = 0;
      slot.life = 0.28 + Math.random() * 0.36;
      slot.color.setHex(palette[i % palette.length]);
    }
  }

  public update(dt: number): void {
    let anyColor = false;
    for (let i = 0; i < this.activeCapacity; i++) {
      const s = this.slots[i];
      if (!s.active) continue;

      s.age += dt;
      if (s.age >= s.life) {
        s.active = false;
        _sparkDummy.position.set(0, -100, 0);
        _sparkDummy.scale.setScalar(0.0001);
        _sparkDummy.updateMatrix();
        this.mesh.setMatrixAt(i, _sparkDummy.matrix);
        continue;
      }

      s.vy -= 21 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;

      if (s.y <= s.groundY + 0.08 && s.vy < 0) {
        s.y = s.groundY + 0.08;
        s.vy = -s.vy * 0.48;
        s.vx *= 0.84;
        s.vz *= 0.84;
      }

      const fade = 1 - s.age / s.life;
      _sparkDummy.position.set(s.x, s.y, s.z);
      _sparkDir.set(s.vx, s.vy, s.vz);
      if (_sparkDir.lengthSq() > 0.01) {
        _sparkTarget.set(s.x + s.vx, s.y + s.vy, s.z + s.vz);
        _sparkDummy.lookAt(_sparkTarget);
      }
      _sparkDummy.scale.set(0.85 * fade, 0.85 * fade, (0.5 + Math.min(2.2, _sparkDir.length() * 0.07)) * fade);
      _sparkDummy.updateMatrix();

      this.mesh.setMatrixAt(i, _sparkDummy.matrix);
      this.mesh.setColorAt(i, s.color);
      anyColor = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (anyColor && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

interface DriftTrailSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  widthScale: number;
  lengthScale: number;
  color: THREE.Color;
}

const _trailDummy = new THREE.Object3D();
const _trailDir = new THREE.Vector3();
const _trailTarget = new THREE.Vector3();
const _trailColor = new THREE.Color();

export class DriftTrailParticleSystem {
  public readonly mesh: THREE.InstancedMesh;
  private readonly slots: DriftTrailSlot[] = [];
  private cursor = 0;
  private readonly capacity: number;
  private activeCapacity: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;

  constructor(capacity = 280) {
    this.capacity = capacity;
    this.activeCapacity = capacity;
    this.geometry = new THREE.BoxGeometry(0.24, 0.14, 1.55);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.84,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, capacity);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < capacity; i++) {
      this.slots.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        life: 0.45,
        widthScale: 1,
        lengthScale: 1,
        color: new THREE.Color(0x00f0ff),
      });
      _trailDummy.position.set(0, -100, 0);
      _trailDummy.scale.setScalar(0.0001);
      _trailDummy.updateMatrix();
      this.mesh.setMatrixAt(i, _trailDummy.matrix);
      this.mesh.setColorAt(i, _trailColor.setHex(0x00f0ff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public setBudgetScale(scale01: number): void {
    const nextCap = Math.max(16, Math.min(this.capacity, Math.round(this.capacity * scale01)));
    if (nextCap === this.activeCapacity) return;
    if (nextCap < this.activeCapacity) {
      for (let i = nextCap; i < this.activeCapacity; i++) {
        this.slots[i].active = false;
        _trailDummy.position.set(0, -100, 0);
        _trailDummy.scale.setScalar(0.0001);
        _trailDummy.updateMatrix();
        this.mesh.setMatrixAt(i, _trailDummy.matrix);
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    this.activeCapacity = nextCap;
    this.mesh.count = nextCap;
    this.cursor = this.cursor % nextCap;
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    life: number,
    widthScale: number,
    lengthScale: number,
    colorHex: number,
  ): void {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % this.activeCapacity;

    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.vx = vx;
    slot.vy = vy;
    slot.vz = vz;
    slot.age = 0;
    slot.life = life;
    slot.widthScale = widthScale;
    slot.lengthScale = lengthScale;
    slot.color.setHex(colorHex);
  }

  public update(dt: number): void {
    let anyColor = false;
    for (let i = 0; i < this.activeCapacity; i++) {
      const s = this.slots[i];
      if (!s.active) continue;

      s.age += dt;
      if (s.age >= s.life) {
        s.active = false;
        _trailDummy.position.set(0, -100, 0);
        _trailDummy.scale.setScalar(0.0001);
        _trailDummy.updateMatrix();
        this.mesh.setMatrixAt(i, _trailDummy.matrix);
        continue;
      }

      const t = s.age / s.life;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vx *= Math.exp(-2.8 * dt);
      s.vz *= Math.exp(-2.8 * dt);
      s.vy += 0.35 * dt;

      const fade = 1 - t;
      const w = Math.max(0.02, s.widthScale * (0.4 + 0.85 * fade));
      const len = Math.max(0.05, s.lengthScale * (0.45 + 0.9 * fade));

      _trailDummy.position.set(s.x, s.y, s.z);
      _trailDir.set(s.vx, s.vy, s.vz);
      if (_trailDir.lengthSq() > 0.01) {
        _trailTarget.set(s.x + s.vx, s.y + s.vy, s.z + s.vz);
        _trailDummy.lookAt(_trailTarget);
      }
      _trailDummy.scale.set(w, w * 0.72, len);
      _trailDummy.updateMatrix();

      this.mesh.setMatrixAt(i, _trailDummy.matrix);
      this.mesh.setColorAt(i, s.color);
      anyColor = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (anyColor && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
