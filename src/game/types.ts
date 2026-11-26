export type GamePhase = 'TITLE' | 'COUNTDOWN' | 'RACING' | 'PAUSED' | 'FINISHED';

export type GameModeId =
  | 'CIRCUIT_RACE'
  | 'POLICE_ESCAPE'
  | 'DRAG_STRIP'
  | 'DRIFT_TOUGE'
  | 'TIME_TRIAL'
  | 'KNOCKOUT'
  | 'TRAFFIC_RUSH'
  | 'CHECKPOINT_BLITZ'
  | 'MIDNIGHT_RUN'
  | 'COP_TAKEDOWN'
  | 'ZIGZAG_SERPENTINE'
  | 'WAVY_COASTER'
  | 'MOUNTAIN_HAIRPIN_PASS'
  | 'DESERT_CANYON_HIGHWAY'
  | 'MIDNIGHT_HARBOR_CIRCUIT'
  | 'KARAKORUM_SKY_PASS'
  | 'CHOLISTAN_MIRAGE_HIGHWAY'
  | 'LAHORE_MIDNIGHT_GP'
  | 'GWADAR_PORT_DOCKS'
  | 'EMERALD_VALLEY_LOOP';

export type EnvironmentStyle =
  | 'coastal'
  | 'downtown_tunnels'
  | 'drag_strip'
  | 'mountain_touge'
  | 'alpine_gp'
  | 'industrial_port'
  | 'gt_highway'
  | 'desert_canyon'
  | 'cyberpunk_rain'
  | 'ring_road'
  | 'zigzag_serpentine'
  | 'wavy_coaster'
  | 'mountain_hairpin_pass'
  | 'desert_canyon_highway'
  | 'midnight_harbor_circuit'
  | 'karakorum_sky_pass'
  | 'cholistan_mirage_highway'
  | 'lahore_midnight_gp'
  | 'gwadar_port_docks'
  | 'emerald_valley_loop';

export type WeatherType = 'NONE' | 'RAIN' | 'MIST' | 'DUST' | 'SPARKS' | 'BOKEH';

export type DynamicWeatherCondition = 'SUNNY' | 'RAIN' | 'FOGGY';

export type VehicleClass = 'hypercar' | 'supercar' | 'sports' | 'muscle' | 'superbike';

export type BodyArchetype =
  | 'hyper_aero'
  | 'mid_wedge'
  | 'fastback_wing'
  | 'gt_coupe'
  | 'jdm_coupe'
  | 'muscle_coupe'
  | 'rally_sedan'
  | 'superbike_frame';

export interface Vehicle3DSpec {
  archetype: BodyArchetype;
  lengthM: number;
  widthM: number;
  heightM: number;
  wheelbaseM: number;
  hasRearWing: boolean;
  hasAeroWinglets: boolean;
  defaultColor: string;
}

export type VehicleCategory =
  | 'HYPERCAR'
  | 'JDM'
  | 'SEDAN_RALLY'
  | 'MUSCLE_SUV'
  | 'SUPERBIKE';

export type VehicleBodyStyle =
  | 'italian_v12'
  | 'koenig_mega'
  | 'chiron_w16'
  | 'v8_mid'
  | 'f1_formula'
  | 'skyline_r34'
  | 'supra_mk4'
  | 'rx7_rotary'
  | 'sport_sedan'
  | 'gt_coupe'
  | 'bmw_m4_competition'
  | 'rally_hatch'
  | 'convertible'
  | 'sport_wagon'
  | 'v8_muscle'
  | 'dodge_challenger_hellcat'
  | 'beast_4x4'
  | 'pickup_truck'
  | 'luxury_suv'
  | 'superbike_1000'
  | 'streetfighter'
  | 'cyber_moto'
  | 'bmw_s1000rr'
  | 'yamaha_yzf_r1m'
  | 'aprilia_rsv4_factory';

export interface VehicleStats {
  topSpeed: number; // 1..100
  accel: number; // 1..100
  handling: number; // 1..100
  nitro: number; // 1..100
}

export interface VehiclePhysics {
  maxSpeedMs: number;
  boostSpeedMs: number;
  accelRate: number;
  turnRate: number;
  driftGrip: number;
  nitroBurnRate: number;
  nitroRegenRate: number;
  engineTimbre: 'v12' | 'turbo' | 'muscle' | 'rotary' | 'bike' | 'cyber';
  maxLeanRad: number;
}

export interface VehicleSpec {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  price: number;
  vehicleClass: VehicleClass;
  subtitle: string;
  category: VehicleCategory;
  categoryLabel: string;
  bodyStyle: VehicleBodyStyle;
  isBike: boolean;
  defaultPaintId: string;
  threeD: Vehicle3DSpec;
  stats: VehicleStats;
  physics: VehiclePhysics;
}

export interface CarColorPreset {
  id: string;
  name: string;
  hex: number;
  css: string;
  accentHex: number;
  finish: 'metallic' | 'pearl' | 'matte';
}

export interface CarWheelPreset {
  id: string;
  name: string;
  hex: number;
  css: string;
  metalness: number;
  roughness: number;
}

export interface CarNeonPreset {
  id: string;
  name: string;
  hex: number;
  css: string;
}

export interface ModeConfig {
  id: GameModeId;
  name: string;
  shortName: string;
  environmentName: string;
  environmentStyle: EnvironmentStyle;
  weather: WeatherType;
  weatherLabel: string;
  difficulty: 'Medium' | 'Hard' | 'Pro' | 'Extreme';
  gripMultiplier: number;
  description: string;
  accentCss: string;
  previewGradient: string;
  badgeText: string;
}

export interface MusicTrackSpec {
  id: string;
  number: string;
  title: string;
  artist: string;
  subtitle: string;
  bpm: number;
  musicalKey: string;
  vibe: string;
  accentCss: string;
  vocalLines: string[];
  arpPattern: number[][];
  leadMelody: number[][];
  bassRoots: number[];
  arpWave: OscillatorType;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
}

export const CAR_COLOR_PRESETS: CarColorPreset[] = [
  {
    id: 'crimson',
    name: 'Lahori Crimson',
    hex: 0xe61c34,
    css: '#e61c34',
    accentHex: 0xffb81c,
    finish: 'metallic',
  },
  {
    id: 'cyan',
    name: 'Karachi Neon',
    hex: 0x00c8ff,
    css: '#00c8ff',
    accentHex: 0xff3ea5,
    finish: 'metallic',
  },
  {
    id: 'gold',
    name: 'Marigold Spark',
    hex: 0xf5a623,
    css: '#f5a623',
    accentHex: 0x00e6a8,
    finish: 'metallic',
  },
  {
    id: 'emerald',
    name: 'Pak Emerald',
    hex: 0x00b86b,
    css: '#00b86b',
    accentHex: 0xffd147,
    finish: 'metallic',
  },
  {
    id: 'violet',
    name: 'Cyber Amethyst',
    hex: 0x8b5cf6,
    css: '#8b5cf6',
    accentHex: 0x00f5d4,
    finish: 'pearl',
  },
  {
    id: 'obsidian',
    name: 'Stealth Matte',
    hex: 0x1e2538,
    css: '#1e2538',
    accentHex: 0xff3b6b,
    finish: 'matte',
  },
  {
    id: 'frost',
    name: 'Pearl Frost',
    hex: 0xeaf0f8,
    css: '#eaf0f8',
    accentHex: 0x00d8ff,
    finish: 'pearl',
  },
  {
    id: 'cobalt',
    name: 'Bay Cobalt',
    hex: 0x2563eb,
    css: '#2563eb',
    accentHex: 0xfacc15,
    finish: 'metallic',
  },
];

export const CAR_WHEEL_PRESETS: CarWheelPreset[] = [
  {
    id: 'alloy',
    name: 'Forged Silver',
    hex: 0xdbe3f0,
    css: '#dbe3f0',
    metalness: 0.94,
    roughness: 0.16,
  },
  {
    id: 'gold',
    name: 'Motorsport Gold',
    hex: 0xfbbf24,
    css: '#fbbf24',
    metalness: 0.92,
    roughness: 0.18,
  },
  {
    id: 'carbon',
    name: 'Satin Carbon',
    hex: 0x1e2433,
    css: '#1e2433',
    metalness: 0.65,
    roughness: 0.34,
  },
  {
    id: 'chrome',
    name: 'Mirror Chrome',
    hex: 0xf8fafc,
    css: '#f8fafc',
    metalness: 0.98,
    roughness: 0.06,
  },
  {
    id: 'bronze',
    name: 'Track Bronze',
    hex: 0xb45309,
    css: '#b45309',
    metalness: 0.88,
    roughness: 0.22,
  },
];

export const CAR_NEON_PRESETS: CarNeonPreset[] = [
  { id: 'cyan', name: 'Cyber Cyan', hex: 0x00e5ff, css: '#00e5ff' },
  { id: 'amber', name: 'Solar Gold', hex: 0xffb81c, css: '#ffb81c' },
  { id: 'pink', name: 'Magenta Surge', hex: 0xff3ea5, css: '#ff3ea5' },
  { id: 'emerald', name: 'Emerald Pulse', hex: 0x00e6a8, css: '#00e6a8' },
  { id: 'crimson', name: 'Track Crimson', hex: 0xff3b5c, css: '#ff3b5c' },
  { id: 'ice', name: 'Pure Ice', hex: 0xf1f5f9, css: '#f1f5f9' },
];

export const VEHICLES: VehicleSpec[] = [
  // 1. Hypercars & Formula Track Prototypes (345 - 440 km/h normal, up to 486 km/h nitro)
  {
    id: 'italian-v12',
    name: 'Lamborghini Aventador SVJ',
    make: 'Lamborghini',
    model: 'Aventador SVJ',
    year: 2021,
    price: 517000,
    vehicleClass: 'supercar',
    subtitle: '6.5L V12 Italian Hypercar · 360 KM/H',
    category: 'HYPERCAR',
    categoryLabel: 'Hypercar',
    bodyStyle: 'italian_v12',
    isBike: false,
    defaultPaintId: 'crimson',
    threeD: {
      archetype: 'mid_wedge',
      lengthM: 4.94,
      widthM: 2.09,
      heightM: 1.13,
      wheelbaseM: 2.7,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#d98a1c',
    },
    stats: { topSpeed: 93, accel: 94, handling: 90, nitro: 88 },
    physics: {
      maxSpeedMs: 100, // 360 km/h
      boostSpeedMs: 118, // 425 km/h
      accelRate: 49,
      turnRate: 2.04,
      driftGrip: 0.96,
      nitroBurnRate: 23,
      nitroRegenRate: 3.3,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },
  {
    id: 'koenig-mega',
    name: 'Koenigsegg Jesko Attack',
    make: 'Koenigsegg',
    model: 'Jesko Attack',
    year: 2024,
    price: 3400000,
    vehicleClass: 'hypercar',
    subtitle: 'Twin-Turbo V8 Megacar · 430 KM/H',
    category: 'HYPERCAR',
    categoryLabel: 'Megacar',
    bodyStyle: 'koenig_mega',
    isBike: false,
    defaultPaintId: 'gold',
    threeD: {
      archetype: 'hyper_aero',
      lengthM: 4.61,
      widthM: 2.03,
      heightM: 1.13,
      wheelbaseM: 2.7,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#e6e8ec',
    },
    stats: { topSpeed: 98, accel: 99, handling: 95, nitro: 93 },
    physics: {
      maxSpeedMs: 119.4, // 430 km/h
      boostSpeedMs: 133, // 479 km/h
      accelRate: 53,
      turnRate: 2.02,
      driftGrip: 0.94,
      nitroBurnRate: 22,
      nitroRegenRate: 3.5,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'chiron-w16',
    name: 'Bugatti Chiron Super Sport',
    make: 'Bugatti',
    model: 'Chiron Super Sport',
    year: 2022,
    price: 3900000,
    vehicleClass: 'hypercar',
    subtitle: 'Quad-Turbo W16 Speed King · 440 KM/H',
    category: 'HYPERCAR',
    categoryLabel: 'Speed King',
    bodyStyle: 'chiron_w16',
    isBike: false,
    defaultPaintId: 'cobalt',
    threeD: {
      archetype: 'hyper_aero',
      lengthM: 4.71,
      widthM: 2.04,
      heightM: 1.21,
      wheelbaseM: 2.71,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#0f294a',
    },
    stats: { topSpeed: 100, accel: 98, handling: 89, nitro: 92 },
    physics: {
      maxSpeedMs: 122.2, // 440 km/h
      boostSpeedMs: 135, // 486 km/h
      accelRate: 54,
      turnRate: 1.94,
      driftGrip: 0.91,
      nitroBurnRate: 22,
      nitroRegenRate: 3.2,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },
  {
    id: 'v8-mid',
    name: 'Ferrari 488 Pista',
    make: 'Ferrari',
    model: '488 Pista',
    year: 2020,
    price: 350000,
    vehicleClass: 'supercar',
    subtitle: 'Mid-Engine Twin-Turbo V8 · 345 KM/H',
    category: 'HYPERCAR',
    categoryLabel: 'Supercar',
    bodyStyle: 'v8_mid',
    isBike: false,
    defaultPaintId: 'emerald',
    threeD: {
      archetype: 'mid_wedge',
      lengthM: 4.61,
      widthM: 1.97,
      heightM: 1.2,
      wheelbaseM: 2.65,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#c81d25',
    },
    stats: { topSpeed: 88, accel: 95, handling: 95, nitro: 87 },
    physics: {
      maxSpeedMs: 96, // 345.6 km/h
      boostSpeedMs: 114, // 410 km/h
      accelRate: 49,
      turnRate: 2.16,
      driftGrip: 1.0,
      nitroBurnRate: 23,
      nitroRegenRate: 3.4,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },
  {
    id: 'f1-formula',
    name: 'Red Bull RB20 Formula 1',
    make: 'Red Bull Racing',
    model: 'RB20 Formula 1',
    year: 2024,
    price: 15000000,
    vehicleClass: 'hypercar',
    subtitle: 'Open-Wheel Hybrid GP Racer · 385 KM/H',
    category: 'HYPERCAR',
    categoryLabel: 'Formula GP',
    bodyStyle: 'f1_formula',
    isBike: false,
    defaultPaintId: 'crimson',
    threeD: {
      archetype: 'hyper_aero',
      lengthM: 5.2,
      widthM: 2.0,
      heightM: 0.97,
      wheelbaseM: 3.1,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#1e293b',
    },
    stats: { topSpeed: 96, accel: 99, handling: 100, nitro: 91 },
    physics: {
      maxSpeedMs: 107, // 385 km/h
      boostSpeedMs: 125, // 450 km/h
      accelRate: 57,
      turnRate: 2.38,
      driftGrip: 1.08,
      nitroBurnRate: 22,
      nitroRegenRate: 3.6,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },

  // 2. JDM & Drift Legends (320 - 335 km/h normal)
  {
    id: 'skyline-r34',
    name: 'Nissan Skyline GT-R R34',
    make: 'Nissan',
    model: 'Skyline GT-R V-Spec II (R34)',
    year: 2002,
    price: 215000,
    vehicleClass: 'sports',
    subtitle: 'AWD Twin-Turbo RB26 Tuner · 330 KM/H',
    category: 'JDM',
    categoryLabel: 'JDM Legend',
    bodyStyle: 'skyline_r34',
    isBike: false,
    defaultPaintId: 'cobalt',
    threeD: {
      archetype: 'gt_coupe',
      lengthM: 4.6,
      widthM: 1.79,
      heightM: 1.36,
      wheelbaseM: 2.66,
      hasRearWing: true,
      hasAeroWinglets: false,
      defaultColor: '#1d4ed8',
    },
    stats: { topSpeed: 85, accel: 92, handling: 93, nitro: 90 },
    physics: {
      maxSpeedMs: 91.7, // 330 km/h
      boostSpeedMs: 109, // 392 km/h
      accelRate: 49,
      turnRate: 2.12,
      driftGrip: 0.98,
      nitroBurnRate: 22,
      nitroRegenRate: 3.6,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'supra-mk4',
    name: 'Toyota Supra MK4 Turbo',
    make: 'Toyota',
    model: 'Supra RZ Twin-Turbo (A80)',
    year: 1998,
    price: 165000,
    vehicleClass: 'sports',
    subtitle: 'Twin-Turbo 2JZ Drift Coupe · 335 KM/H',
    category: 'JDM',
    categoryLabel: 'Drift Coupe',
    bodyStyle: 'supra_mk4',
    isBike: false,
    defaultPaintId: 'gold',
    threeD: {
      archetype: 'jdm_coupe',
      lengthM: 4.52,
      widthM: 1.81,
      heightM: 1.27,
      wheelbaseM: 2.55,
      hasRearWing: true,
      hasAeroWinglets: false,
      defaultColor: '#d92626',
    },
    stats: { topSpeed: 86, accel: 89, handling: 96, nitro: 95 },
    physics: {
      maxSpeedMs: 93, // 334.8 km/h
      boostSpeedMs: 112, // 403 km/h
      accelRate: 48,
      turnRate: 2.2,
      driftGrip: 1.06,
      nitroBurnRate: 21,
      nitroRegenRate: 3.9,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'rx7-rotary',
    name: 'Mazda RX-7 Spirit R (FD3S)',
    make: 'Mazda',
    model: 'RX-7 Type R (FD3S)',
    year: 1999,
    price: 65000,
    vehicleClass: 'muscle',
    subtitle: 'Twin-Rotor Touge Racer · 320 KM/H',
    category: 'JDM',
    categoryLabel: 'Rotary Racer',
    bodyStyle: 'rx7_rotary',
    isBike: false,
    defaultPaintId: 'cyan',
    threeD: {
      archetype: 'jdm_coupe',
      lengthM: 4.29,
      widthM: 1.76,
      heightM: 1.23,
      wheelbaseM: 2.42,
      hasRearWing: true,
      hasAeroWinglets: false,
      defaultColor: '#eab308',
    },
    stats: { topSpeed: 82, accel: 88, handling: 98, nitro: 92 },
    physics: {
      maxSpeedMs: 89, // 320.4 km/h
      boostSpeedMs: 107, // 385 km/h
      accelRate: 47,
      turnRate: 2.28,
      driftGrip: 1.1,
      nitroBurnRate: 21,
      nitroRegenRate: 3.8,
      engineTimbre: 'rotary',
      maxLeanRad: 0,
    },
  },

  // 3. Sports Coupes, Sedans, Roadsters, Wagons & Rally Cars (310 - 352 km/h normal)
  {
    id: 'sport-sedan',
    name: 'BMW M5 CS Competition',
    make: 'BMW',
    model: 'M5 CS (F90)',
    year: 2022,
    price: 142000,
    vehicleClass: 'sports',
    subtitle: 'Twin-Turbo V8 Super-Sedan · 318 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'Super-Sedan',
    bodyStyle: 'sport_sedan',
    isBike: false,
    defaultPaintId: 'emerald',
    threeD: {
      archetype: 'gt_coupe',
      lengthM: 4.98,
      widthM: 1.9,
      heightM: 1.46,
      wheelbaseM: 2.98,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#065f46',
    },
    stats: { topSpeed: 81, accel: 88, handling: 89, nitro: 88 },
    physics: {
      maxSpeedMs: 88.4, // 318.2 km/h
      boostSpeedMs: 106, // 381.6 km/h
      accelRate: 47,
      turnRate: 2.04,
      driftGrip: 0.95,
      nitroBurnRate: 22,
      nitroRegenRate: 3.4,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'bmw-m4-competition',
    name: 'BMW M4 Competition',
    make: 'BMW',
    model: 'M4 Competition (G82)',
    year: 2024,
    price: 83000,
    vehicleClass: 'sports',
    subtitle: 'Twin-Turbo Inline-6 M Coupe · 312 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'M Coupe',
    bodyStyle: 'bmw_m4_competition',
    isBike: false,
    defaultPaintId: 'cobalt',
    threeD: {
      archetype: 'gt_coupe',
      lengthM: 4.79,
      widthM: 1.88,
      heightM: 1.39,
      wheelbaseM: 2.85,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#1d4ed8',
    },
    stats: { topSpeed: 80, accel: 88, handling: 91, nitro: 92 },
    physics: {
      maxSpeedMs: 86.7, // 312.1 km/h (>= 300 km/h)
      boostSpeedMs: 105, // 378 km/h
      accelRate: 48,
      turnRate: 2.1,
      driftGrip: 1.02,
      nitroBurnRate: 21,
      nitroRegenRate: 3.7,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'gt-coupe',
    name: 'Porsche 911 GT3 RS',
    make: 'Porsche',
    model: '911 GT3 RS (992)',
    year: 2024,
    price: 241300,
    vehicleClass: 'sports',
    subtitle: 'Flat-Six Track Coupe · 348 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'GT Coupe',
    bodyStyle: 'gt_coupe',
    isBike: false,
    defaultPaintId: 'frost',
    threeD: {
      archetype: 'fastback_wing',
      lengthM: 4.57,
      widthM: 1.9,
      heightM: 1.32,
      wheelbaseM: 2.45,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#f4f6f9',
    },
    stats: { topSpeed: 90, accel: 93, handling: 98, nitro: 90 },
    physics: {
      maxSpeedMs: 96.7, // 348.1 km/h
      boostSpeedMs: 115, // 414 km/h
      accelRate: 51,
      turnRate: 2.24,
      driftGrip: 1.02,
      nitroBurnRate: 22,
      nitroRegenRate: 3.5,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },
  {
    id: 'rally-hatch',
    name: 'Subaru Impreza WRX STI',
    make: 'Subaru',
    model: 'Impreza WRX STI',
    year: 2021,
    price: 46000,
    vehicleClass: 'muscle',
    subtitle: 'Widebody AWD Rally Turbo · 310 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'WRC Rally',
    bodyStyle: 'rally_hatch',
    isBike: false,
    defaultPaintId: 'cobalt',
    threeD: {
      archetype: 'rally_sedan',
      lengthM: 4.59,
      widthM: 1.79,
      heightM: 1.47,
      wheelbaseM: 2.65,
      hasRearWing: true,
      hasAeroWinglets: false,
      defaultColor: '#155eef',
    },
    stats: { topSpeed: 79, accel: 94, handling: 98, nitro: 93 },
    physics: {
      maxSpeedMs: 86.2, // 310.3 km/h
      boostSpeedMs: 104, // 374.4 km/h
      accelRate: 53,
      turnRate: 2.32,
      driftGrip: 1.12,
      nitroBurnRate: 21,
      nitroRegenRate: 3.9,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },
  {
    id: 'convertible-spider',
    name: 'McLaren 765LT Spider',
    make: 'McLaren',
    model: '765LT Spider',
    year: 2022,
    price: 382500,
    vehicleClass: 'supercar',
    subtitle: 'Open-Top V8 Exotic Roadster · 352 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'Roadster',
    bodyStyle: 'convertible',
    isBike: false,
    defaultPaintId: 'crimson',
    threeD: {
      archetype: 'mid_wedge',
      lengthM: 4.6,
      widthM: 2.16,
      heightM: 1.19,
      wheelbaseM: 2.67,
      hasRearWing: true,
      hasAeroWinglets: true,
      defaultColor: '#ff6b1a',
    },
    stats: { topSpeed: 91, accel: 95, handling: 94, nitro: 89 },
    physics: {
      maxSpeedMs: 97.8, // 352.1 km/h
      boostSpeedMs: 116, // 417.6 km/h
      accelRate: 50,
      turnRate: 2.18,
      driftGrip: 1.0,
      nitroBurnRate: 22,
      nitroRegenRate: 3.5,
      engineTimbre: 'v12',
      maxLeanRad: 0,
    },
  },
  {
    id: 'sport-wagon',
    name: 'Audi RS6 Avant GT',
    make: 'Audi',
    model: 'RS6 Avant GT',
    year: 2024,
    price: 198000,
    vehicleClass: 'sports',
    subtitle: 'V8 Biturbo Performance Wagon · 322 KM/H',
    category: 'SEDAN_RALLY',
    categoryLabel: 'Sport Wagon',
    bodyStyle: 'sport_wagon',
    isBike: false,
    defaultPaintId: 'obsidian',
    threeD: {
      archetype: 'gt_coupe',
      lengthM: 4.99,
      widthM: 1.95,
      heightM: 1.46,
      wheelbaseM: 2.93,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#1e2538',
    },
    stats: { topSpeed: 83, accel: 90, handling: 88, nitro: 91 },
    physics: {
      maxSpeedMs: 89.5, // 322.2 km/h
      boostSpeedMs: 107, // 385.2 km/h
      accelRate: 48,
      turnRate: 2.02,
      driftGrip: 0.96,
      nitroBurnRate: 22,
      nitroRegenRate: 3.5,
      engineTimbre: 'turbo',
      maxLeanRad: 0,
    },
  },

  // 4. Muscle, Pickup Trucks & Luxury 4x4 SUVs (302 - 330 km/h normal)
  {
    id: 'dodge-challenger-hellcat',
    name: 'Dodge Challenger SRT Hellcat Redeye',
    make: 'Dodge',
    model: 'Challenger SRT Hellcat Redeye',
    year: 2023,
    price: 89000,
    vehicleClass: 'muscle',
    subtitle: '797-HP Supercharged V8 Widebody · 327 KM/H',
    category: 'MUSCLE_SUV',
    categoryLabel: 'Hellcat V8',
    bodyStyle: 'dodge_challenger_hellcat',
    isBike: false,
    defaultPaintId: 'obsidian',
    threeD: {
      archetype: 'muscle_coupe',
      lengthM: 5.02,
      widthM: 1.99,
      heightM: 1.46,
      wheelbaseM: 2.95,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#3b3f46',
    },
    stats: { topSpeed: 84, accel: 91, handling: 82, nitro: 95 },
    physics: {
      maxSpeedMs: 90.8, // 326.9 km/h
      boostSpeedMs: 109, // 392.4 km/h
      accelRate: 49,
      turnRate: 1.93,
      driftGrip: 0.94,
      nitroBurnRate: 21,
      nitroRegenRate: 3.7,
      engineTimbre: 'muscle',
      maxLeanRad: 0,
    },
  },
  {
    id: 'v8-muscle',
    name: 'Ford Mustang Shelby GT500',
    make: 'Ford',
    model: 'Mustang Shelby GT500',
    year: 2022,
    price: 84000,
    vehicleClass: 'muscle',
    subtitle: 'Supercharged Predator V8 · 330 KM/H',
    category: 'MUSCLE_SUV',
    categoryLabel: 'V8 Muscle',
    bodyStyle: 'v8_muscle',
    isBike: false,
    defaultPaintId: 'obsidian',
    threeD: {
      archetype: 'muscle_coupe',
      lengthM: 4.82,
      widthM: 1.93,
      heightM: 1.39,
      wheelbaseM: 2.72,
      hasRearWing: true,
      hasAeroWinglets: false,
      defaultColor: '#1e3a8a',
    },
    stats: { topSpeed: 85, accel: 92, handling: 83, nitro: 94 },
    physics: {
      maxSpeedMs: 91.7, // 330.1 km/h
      boostSpeedMs: 110, // 396 km/h
      accelRate: 50,
      turnRate: 1.94,
      driftGrip: 0.94,
      nitroBurnRate: 21,
      nitroRegenRate: 3.6,
      engineTimbre: 'muscle',
      maxLeanRad: 0,
    },
  },
  {
    id: 'beast-4x4',
    name: 'Ford F-150 Raptor R',
    make: 'Ford',
    model: 'F-150 Raptor R',
    year: 2024,
    price: 112000,
    vehicleClass: 'muscle',
    subtitle: 'Supercharged V8 Off-Road 4x4 · 302 KM/H',
    category: 'MUSCLE_SUV',
    categoryLabel: '4x4 Beast',
    bodyStyle: 'beast_4x4',
    isBike: false,
    defaultPaintId: 'emerald',
    threeD: {
      archetype: 'muscle_coupe',
      lengthM: 5.5,
      widthM: 2.19,
      heightM: 1.98,
      wheelbaseM: 3.3,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#00b86b',
    },
    stats: { topSpeed: 76, accel: 89, handling: 84, nitro: 96 },
    physics: {
      maxSpeedMs: 84, // 302.4 km/h (minimum speed >= 300 km/h)
      boostSpeedMs: 101, // 363.6 km/h
      accelRate: 47,
      turnRate: 1.96,
      driftGrip: 0.96,
      nitroBurnRate: 20,
      nitroRegenRate: 3.8,
      engineTimbre: 'muscle',
      maxLeanRad: 0,
    },
  },
  {
    id: 'pickup-truck',
    name: 'RAM 1500 TRX Baja',
    make: 'RAM',
    model: '1500 TRX Baja Edition',
    year: 2024,
    price: 118000,
    vehicleClass: 'muscle',
    subtitle: '702-HP Supercharged Street Truck · 306 KM/H',
    category: 'MUSCLE_SUV',
    categoryLabel: 'Baja Pickup',
    bodyStyle: 'pickup_truck',
    isBike: false,
    defaultPaintId: 'gold',
    threeD: {
      archetype: 'muscle_coupe',
      lengthM: 5.65,
      widthM: 2.21,
      heightM: 2.02,
      wheelbaseM: 3.4,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#f5a623',
    },
    stats: { topSpeed: 78, accel: 91, handling: 85, nitro: 95 },
    physics: {
      maxSpeedMs: 85, // 306 km/h
      boostSpeedMs: 103, // 370.8 km/h
      accelRate: 49,
      turnRate: 1.98,
      driftGrip: 0.97,
      nitroBurnRate: 20,
      nitroRegenRate: 3.8,
      engineTimbre: 'muscle',
      maxLeanRad: 0,
    },
  },
  {
    id: 'luxury-suv',
    name: 'Mercedes-AMG G63',
    make: 'Mercedes-AMG',
    model: 'G63 Biturbo',
    year: 2024,
    price: 185000,
    vehicleClass: 'muscle',
    subtitle: 'Widebody Biturbo Luxury SUV · 314 KM/H',
    category: 'MUSCLE_SUV',
    categoryLabel: 'Luxury SUV',
    bodyStyle: 'luxury_suv',
    isBike: false,
    defaultPaintId: 'violet',
    threeD: {
      archetype: 'muscle_coupe',
      lengthM: 4.87,
      widthM: 1.98,
      heightM: 1.96,
      wheelbaseM: 2.89,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#8b5cf6',
    },
    stats: { topSpeed: 80, accel: 90, handling: 84, nitro: 92 },
    physics: {
      maxSpeedMs: 87.3, // 314.3 km/h
      boostSpeedMs: 105, // 378 km/h
      accelRate: 48,
      turnRate: 1.96,
      driftGrip: 0.95,
      nitroBurnRate: 21,
      nitroRegenRate: 3.6,
      engineTimbre: 'muscle',
      maxLeanRad: 0,
    },
  },

  // 5. Superbikes (303 - 360 km/h normal)
  {
    id: 'superbike-1000',
    name: 'Ducati Panigale V4 R',
    make: 'Ducati',
    model: 'Panigale V4 R',
    year: 2024,
    price: 45000,
    vehicleClass: 'superbike',
    subtitle: '1000cc Desmosedici Superbike · 342 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'Superbike',
    bodyStyle: 'superbike_1000',
    isBike: true,
    defaultPaintId: 'crimson',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.09,
      widthM: 0.79,
      heightM: 1.15,
      wheelbaseM: 1.47,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#dc2626',
    },
    stats: { topSpeed: 89, accel: 98, handling: 96, nitro: 91 },
    physics: {
      maxSpeedMs: 95, // 342 km/h
      boostSpeedMs: 114, // 410.4 km/h
      accelRate: 55,
      turnRate: 2.34,
      driftGrip: 1.0,
      nitroBurnRate: 22,
      nitroRegenRate: 3.6,
      engineTimbre: 'bike',
      maxLeanRad: 0.56,
    },
  },
  {
    id: 'streetfighter',
    name: 'Kawasaki Ninja H2R',
    make: 'Kawasaki',
    model: 'Ninja H2R',
    year: 2024,
    price: 57500,
    vehicleClass: 'superbike',
    subtitle: 'Supercharged Hyper-Track Moto · 337 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'Hyper-Bike',
    bodyStyle: 'streetfighter',
    isBike: true,
    defaultPaintId: 'emerald',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.08,
      widthM: 0.77,
      heightM: 1.12,
      wheelbaseM: 1.45,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#16a34a',
    },
    stats: { topSpeed: 87, accel: 100, handling: 95, nitro: 94 },
    physics: {
      maxSpeedMs: 93.6, // 337 km/h
      boostSpeedMs: 112, // 403.2 km/h
      accelRate: 56,
      turnRate: 2.4,
      driftGrip: 1.04,
      nitroBurnRate: 21,
      nitroRegenRate: 3.8,
      engineTimbre: 'bike',
      maxLeanRad: 0.58,
    },
  },
  {
    id: 'bmw-s1000rr',
    name: 'BMW S1000RR',
    make: 'BMW',
    model: 'S1000RR M Package',
    year: 2024,
    price: 22000,
    vehicleClass: 'superbike',
    subtitle: 'ShiftCam Inline-4 M Superbike · 306 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'M Superbike',
    bodyStyle: 'bmw_s1000rr',
    isBike: true,
    defaultPaintId: 'frost',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.07,
      widthM: 0.74,
      heightM: 1.15,
      wheelbaseM: 1.45,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#f8fafc',
    },
    stats: { topSpeed: 79, accel: 96, handling: 95, nitro: 92 },
    physics: {
      maxSpeedMs: 85, // 306 km/h (>= 300 km/h)
      boostSpeedMs: 104, // 374.4 km/h
      accelRate: 54,
      turnRate: 2.38,
      driftGrip: 1.02,
      nitroBurnRate: 21,
      nitroRegenRate: 3.7,
      engineTimbre: 'bike',
      maxLeanRad: 0.57,
    },
  },
  {
    id: 'yamaha-yzf-r1m',
    name: 'Yamaha YZF-R1M',
    make: 'Yamaha',
    model: 'YZF-R1M',
    year: 2024,
    price: 27399,
    vehicleClass: 'superbike',
    subtitle: 'Carbon Crossplane CP4 Superbike · 304 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'Carbon R1M',
    bodyStyle: 'yamaha_yzf_r1m',
    isBike: true,
    defaultPaintId: 'obsidian',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.05,
      widthM: 0.69,
      heightM: 1.16,
      wheelbaseM: 1.4,
      hasRearWing: false,
      hasAeroWinglets: false,
      defaultColor: '#1e293b',
    },
    stats: { topSpeed: 78, accel: 95, handling: 97, nitro: 92 },
    physics: {
      maxSpeedMs: 84.5, // 304.2 km/h (>= 300 km/h)
      boostSpeedMs: 103, // 370.8 km/h
      accelRate: 54,
      turnRate: 2.42,
      driftGrip: 1.04,
      nitroBurnRate: 21,
      nitroRegenRate: 3.7,
      engineTimbre: 'bike',
      maxLeanRad: 0.59,
    },
  },
  {
    id: 'aprilia-rsv4-factory',
    name: 'Aprilia RSV4 Factory',
    make: 'Aprilia',
    model: 'RSV4 Factory 1100',
    year: 2024,
    price: 26499,
    vehicleClass: 'superbike',
    subtitle: '65° V4 Italian Track Machine · 308 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'V4 Superbike',
    bodyStyle: 'aprilia_rsv4_factory',
    isBike: true,
    defaultPaintId: 'violet',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.05,
      widthM: 0.73,
      heightM: 1.15,
      wheelbaseM: 1.43,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#4c1d95',
    },
    stats: { topSpeed: 80, accel: 96, handling: 96, nitro: 93 },
    physics: {
      maxSpeedMs: 85.6, // 308.2 km/h (>= 300 km/h)
      boostSpeedMs: 105, // 378 km/h
      accelRate: 55,
      turnRate: 2.4,
      driftGrip: 1.03,
      nitroBurnRate: 21,
      nitroRegenRate: 3.8,
      engineTimbre: 'bike',
      maxLeanRad: 0.58,
    },
  },
  {
    id: 'cyber-moto',
    name: 'Suzuki Hayabusa GSX1300R',
    make: 'Suzuki',
    model: 'Hayabusa GSX1300R',
    year: 2024,
    price: 19099,
    vehicleClass: 'superbike',
    subtitle: 'Aerodynamic Hyper-Sport Moto · 360 KM/H',
    category: 'SUPERBIKE',
    categoryLabel: 'Hyper-Moto',
    bodyStyle: 'cyber_moto',
    isBike: true,
    defaultPaintId: 'cyan',
    threeD: {
      archetype: 'superbike_frame',
      lengthM: 2.18,
      widthM: 0.74,
      heightM: 1.17,
      wheelbaseM: 1.48,
      hasRearWing: false,
      hasAeroWinglets: true,
      defaultColor: '#00c8ff',
    },
    stats: { topSpeed: 93, accel: 99, handling: 96, nitro: 98 },
    physics: {
      maxSpeedMs: 100, // 360 km/h
      boostSpeedMs: 119, // 428.4 km/h
      accelRate: 57,
      turnRate: 2.32,
      driftGrip: 1.02,
      nitroBurnRate: 20,
      nitroRegenRate: 4.1,
      engineTimbre: 'cyber',
      maxLeanRad: 0.6,
    },
  },
];

export const GAME_MODES: ModeConfig[] = [
  {
    id: 'CIRCUIT_RACE',
    name: '3-Lap Circuit Race',
    shortName: '3-Lap Circuit',
    environmentName: 'Neon Coastal Sunset',
    environmentStyle: 'coastal',
    weather: 'BOKEH',
    weatherLabel: 'Golden Sunset',
    difficulty: 'Medium',
    gripMultiplier: 1.0,
    description: 'Sunset waterfront palms, suspension bridge, AI rivals & highway patrol.',
    accentCss: '#06b6d4',
    previewGradient: 'linear-gradient(135deg, #0b1635 0%, #7a2b58 55%, #f59c57 100%)',
    badgeText: 'Dusk Coast',
  },
  {
    id: 'POLICE_ESCAPE',
    name: 'Police Escape (High Heat)',
    shortName: 'High Heat Escape',
    environmentName: 'Downtown Police Tunnel',
    environmentStyle: 'downtown_tunnels',
    weather: 'BOKEH',
    weatherLabel: 'Night City',
    difficulty: 'Extreme',
    gripMultiplier: 0.98,
    description: 'Survive 90s against 5-star interceptors, tunnels & police roadblocks.',
    accentCss: '#f43f5e',
    previewGradient: 'linear-gradient(135deg, #090d1f 0%, #1e1b4b 55%, #be123c 100%)',
    badgeText: 'Tunnels · Roadblocks',
  },
  {
    id: 'DRAG_STRIP',
    name: 'Highway Drag Strip',
    shortName: 'Pro Drag Strip',
    environmentName: 'Pro Drag Strip',
    environmentStyle: 'drag_strip',
    weather: 'DUST',
    weatherLabel: 'Clear Heat',
    difficulty: 'Medium',
    gripMultiplier: 1.08,
    description: 'Half-mile straight sprint with Christmas tree lights & perfect launch timing.',
    accentCss: '#f59e0b',
    previewGradient: 'linear-gradient(135deg, #1e3a5f 0%, #d97706 60%, #fde68a 100%)',
    badgeText: 'Daylight Salt-Flat',
  },
  {
    id: 'DRIFT_TOUGE',
    name: 'Drift King / Touge',
    shortName: 'Mountain Touge',
    environmentName: 'Misty Mountain Pass',
    environmentStyle: 'mountain_touge',
    weather: 'MIST',
    weatherLabel: 'Alpine Mist',
    difficulty: 'Hard',
    gripMultiplier: 0.86,
    description: 'Chain hairpin drifts through misty pine switchbacks before time runs out.',
    accentCss: '#10b981',
    previewGradient: 'linear-gradient(135deg, #06282a 0%, #0f4c5c 55%, #6ee7b7 100%)',
    badgeText: 'Misty Switchbacks',
  },
  {
    id: 'TIME_TRIAL',
    name: 'Time Trial (Ghost Attack)',
    shortName: 'Ghost Attack',
    environmentName: 'Alpine Circuit',
    environmentStyle: 'alpine_gp',
    weather: 'NONE',
    weatherLabel: 'Crisp Daylight',
    difficulty: 'Pro',
    gripMultiplier: 1.06,
    description: 'Clean daytime GP tarmac vs a live 3D Ghost racer. Zero traffic or cops.',
    accentCss: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 55%, #e0f2fe 100%)',
    badgeText: 'Daylight GP',
  },
  {
    id: 'KNOCKOUT',
    name: 'Knockout Elimination',
    shortName: 'Knockout',
    environmentName: 'Industrial Port',
    environmentStyle: 'industrial_port',
    weather: 'SPARKS',
    weatherLabel: 'Embers & Dusk',
    difficulty: 'Hard',
    gripMultiplier: 0.96,
    description: 'Every 25s last place is eliminated among cranes and cargo containers.',
    accentCss: '#fb923c',
    previewGradient: 'linear-gradient(135deg, #1c1917 0%, #7c2d12 55%, #fb923c 100%)',
    badgeText: 'Port Dusk · Sparks',
  },
  {
    id: 'TRAFFIC_RUSH',
    name: 'Traffic Rush (Near-Miss)',
    shortName: 'Desi Traffic Rush',
    environmentName: 'Desi GT Highway',
    environmentStyle: 'gt_highway',
    weather: 'BOKEH',
    weatherLabel: 'Warm Evening',
    difficulty: 'Hard',
    gripMultiplier: 1.0,
    description: 'Weave dense Pak mini-trucks, rickshaws & buses at 320+ km/h for combos.',
    accentCss: '#facc15',
    previewGradient: 'linear-gradient(135deg, #064e3b 0%, #b45309 55%, #facc15 100%)',
    badgeText: 'GT Road · Dhabas',
  },
  {
    id: 'CHECKPOINT_BLITZ',
    name: 'Checkpoint Blitz',
    shortName: 'Checkpoint Blitz',
    environmentName: 'Golden Desert Canyon',
    environmentStyle: 'desert_canyon',
    weather: 'DUST',
    weatherLabel: 'Desert Dust',
    difficulty: 'Pro',
    gripMultiplier: 0.94,
    description: 'Beat the ticking clock—every glowing arch adds precious seconds.',
    accentCss: '#f97316',
    previewGradient: 'linear-gradient(135deg, #431407 0%, #c2410c 55%, #fdba74 100%)',
    badgeText: 'Golden Canyon',
  },
  {
    id: 'MIDNIGHT_RUN',
    name: 'Night Neon Midnight Run',
    shortName: 'Midnight Run',
    environmentName: 'Rainy Cyberpunk City',
    environmentStyle: 'cyberpunk_rain',
    weather: 'RAIN',
    weatherLabel: 'Heavy Rain',
    difficulty: 'Extreme',
    gripMultiplier: 0.88,
    description: 'Slick mirror-wet asphalt, falling 3D rain, neon billboards & fierce rivals.',
    accentCss: '#e879f9',
    previewGradient: 'linear-gradient(135deg, #09051a 0%, #581c87 55%, #06b6d4 100%)',
    badgeText: 'Heavy Rain · Neon',
  },
  {
    id: 'COP_TAKEDOWN',
    name: 'Cop Takedown (Interceptor)',
    shortName: 'Cop Takedown',
    environmentName: 'Bridge Ring-Road',
    environmentStyle: 'ring_road',
    weather: 'BOKEH',
    weatherLabel: 'Night Patrol',
    difficulty: 'Hard',
    gripMultiplier: 1.04,
    description: 'Drive the Police Interceptor & ram 4 fleeing street racers off the road.',
    accentCss: '#3b82f6',
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #ef4444 100%)',
    badgeText: 'Interceptor Patrol',
  },
  {
    id: 'ZIGZAG_SERPENTINE',
    name: 'Zigzag Switchback Run',
    shortName: 'Zigzag Run',
    environmentName: 'Serpentine Zigzag Canyon',
    environmentStyle: 'zigzag_serpentine',
    weather: 'DUST',
    weatherLabel: 'Sunset Canyon',
    difficulty: 'Hard',
    gripMultiplier: 0.95,
    description: 'Rapid left-right-left hairpins, tight S-chicanes & canyon slaloms vs rivals.',
    accentCss: '#ff6b00',
    previewGradient: 'linear-gradient(135deg, #2b0f0a 0%, #9a3412 55%, #f59e0b 100%)',
    badgeText: 'Zigzag Slalom',
  },
  {
    id: 'WAVY_COASTER',
    name: 'Wavy Coastal Rollercoaster',
    shortName: 'Wavy Coaster',
    environmentName: 'Cresting Wave Viaduct',
    environmentStyle: 'wavy_coaster',
    weather: 'BOKEH',
    weatherLabel: 'Neon Twilight',
    difficulty: 'Pro',
    gripMultiplier: 1.0,
    description: 'High-speed rolling hills, undulating ocean viaduct waves & sweeping S-bends.',
    accentCss: '#00f5d4',
    previewGradient: 'linear-gradient(135deg, #071936 0%, #0e7490 55%, #00f5d4 100%)',
    badgeText: 'Wavy Viaduct',
  },
  {
    id: 'MOUNTAIN_HAIRPIN_PASS',
    name: 'Mountain Hairpin Pass',
    shortName: 'Hairpin Pass',
    environmentName: 'Alpine Hairpin Summit',
    environmentStyle: 'mountain_hairpin_pass',
    weather: 'MIST',
    weatherLabel: 'Alpine Dusk',
    difficulty: 'Pro',
    gripMultiplier: 0.92,
    description: 'Steep 3-lap alpine switchbacks, snowy summit crests & tight guardrailed hairpins.',
    accentCss: '#34d399',
    previewGradient: 'linear-gradient(135deg, #071c26 0%, #0f4c5c 52%, #a7f3d0 100%)',
    badgeText: '3-Lap Switchbacks',
  },
  {
    id: 'DESERT_CANYON_HIGHWAY',
    name: 'Desert Canyon Highway',
    shortName: 'Canyon Highway',
    environmentName: 'Red Rock Canyon Hwy',
    environmentStyle: 'desert_canyon_highway',
    weather: 'DUST',
    weatherLabel: 'Scorching Sunset',
    difficulty: 'Hard',
    gripMultiplier: 0.97,
    description: 'Long-radius 2-lap canyon sweepers, sandstone arches & blistering desert straights.',
    accentCss: '#fb923c',
    previewGradient: 'linear-gradient(135deg, #3b1206 0%, #c2410c 55%, #fde68a 100%)',
    badgeText: 'Sandstone Sweepers',
  },
  {
    id: 'MIDNIGHT_HARBOR_CIRCUIT',
    name: 'Midnight Harbor Circuit',
    shortName: 'Harbor Circuit',
    environmentName: 'Downtown Harbor Docks',
    environmentStyle: 'midnight_harbor_circuit',
    weather: 'BOKEH',
    weatherLabel: 'Harbor Midnight',
    difficulty: 'Extreme',
    gripMultiplier: 0.94,
    description: '2-lap neon dockyard & downtown waterfront sprint with cranes, bridges & pursuit.',
    accentCss: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #04091a 0%, #0f294a 52%, #06b6d4 100%)',
    badgeText: 'Downtown Dockyard',
  },
  {
    id: 'KARAKORUM_SKY_PASS',
    name: 'Karakorum Sky Pass',
    shortName: 'Karakorum Pass',
    environmentName: 'Karakorum Sky Pass',
    environmentStyle: 'karakorum_sky_pass',
    weather: 'DUST',
    weatherLabel: 'Golden Alpine Cliffs',
    difficulty: 'Extreme',
    gripMultiplier: 0.91,
    description: '3-lap mountain hairpin switchbacks, carved rock tunnels & golden-hour alpine cliffs.',
    accentCss: '#fbbf24',
    previewGradient: 'linear-gradient(135deg, #1b2e4b 0%, #8c5a2b 55%, #fde68a 100%)',
    badgeText: 'Rock Tunnels · Cliffs',
  },
  {
    id: 'CHOLISTAN_MIRAGE_HIGHWAY',
    name: 'Cholistan Mirage Highway',
    shortName: 'Cholistan Mirage',
    environmentName: 'Cholistan Mirage Highway',
    environmentStyle: 'cholistan_mirage_highway',
    weather: 'DUST',
    weatherLabel: 'Mirage Sunset',
    difficulty: 'Pro',
    gripMultiplier: 0.98,
    description: 'Wide desert canyon & sunset dunes with ultra-long 440+ km/h straights & sweepers.',
    accentCss: '#f97316',
    previewGradient: 'linear-gradient(135deg, #3b0d12 0%, #c2410c 52%, #fbbf24 100%)',
    badgeText: 'Wide Dunes · Sunset',
  },
  {
    id: 'LAHORE_MIDNIGHT_GP',
    name: 'Lahore Midnight Grand Prix',
    shortName: 'Lahore Midnight GP',
    environmentName: 'Lahore Midnight GP',
    environmentStyle: 'lahore_midnight_gp',
    weather: 'RAIN',
    weatherLabel: 'Midnight Neon Rain',
    difficulty: 'Extreme',
    gripMultiplier: 0.89,
    description: 'Rain-slicked midnight downtown boulevards, illuminated heritage arches & neon flyovers.',
    accentCss: '#10b981',
    previewGradient: 'linear-gradient(135deg, #05081a 0%, #064e3b 52%, #f59e0b 100%)',
    badgeText: 'Heritage Arches · Rain',
  },
  {
    id: 'GWADAR_PORT_DOCKS',
    name: 'Gwadar Port Industrial Docks',
    shortName: 'Gwadar Docks',
    environmentName: 'Gwadar Industrial Docks',
    environmentStyle: 'gwadar_port_docks',
    weather: 'SPARKS',
    weatherLabel: 'Dusk Shipyard',
    difficulty: 'Hard',
    gripMultiplier: 0.94,
    description: 'Harbor container chicane circuit at dusk with shipyard cranes, spotlights & hairpins.',
    accentCss: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #9a3412 50%, #0ea5e9 100%)',
    badgeText: 'Cranes · Spotlights',
  },
  {
    id: 'EMERALD_VALLEY_LOOP',
    name: 'Emerald Valley Rain-Forest Loop',
    shortName: 'Emerald Valley',
    environmentName: 'Emerald Rain-Forest Loop',
    environmentStyle: 'emerald_valley_loop',
    weather: 'RAIN',
    weatherLabel: 'Monsoon Valley Rain',
    difficulty: 'Pro',
    gripMultiplier: 0.9,
    description: 'Misty monsoon mountain valley with flowing S-curves, ravine bridges & dynamic rain.',
    accentCss: '#34d399',
    previewGradient: 'linear-gradient(135deg, #052e2b 0%, #065f46 52%, #6ee7b7 100%)',
    badgeText: 'Ravine Bridges · Monsoon',
  },
];

export const MUSIC_TRACKS: MusicTrackSpec[] = [
  {
    id: 'walker-faded',
    number: '01',
    title: 'Faded',
    artist: 'Alan Walker',
    subtitle: 'Vocal Choir Lead · Piano Arp & Atlantis Drop',
    bpm: 120,
    musicalKey: 'F# Minor',
    vibe: 'Walker Vocal EDM',
    accentCss: '#00f0ff',
    vocalLines: [
      'You were the shadow to my light, did you feel us?',
      'Another star, you fade away...',
      'Where are you now? Was it all in my fantasy?',
      'Atlantis, under the sea — where are you now?',
    ],
    arpWave: 'triangle',
    leadWave: 'sawtooth',
    bassWave: 'sine',
    // F#m -> D -> A -> E (Iconic Faded progression)
    arpPattern: [
      [66, 73, 69, 78, 73, 69, 66, 73, 66, 73, 69, 78, 73, 69, 78, 73],
      [62, 69, 66, 74, 69, 66, 62, 69, 62, 69, 66, 74, 69, 66, 74, 69],
      [69, 76, 73, 81, 76, 73, 69, 76, 69, 76, 73, 81, 76, 73, 81, 76],
      [64, 71, 68, 76, 71, 68, 64, 71, 64, 71, 68, 76, 71, 68, 76, 71],
    ],
    // Recognizable "Faded" chorus & drop vocal melody
    leadMelody: [
      [78, 0, 78, 0, 78, 0, 81, 0, 85, 0, 0, 0, 83, 0, 81, 0],
      [81, 0, 81, 0, 78, 0, 78, 0, 76, 0, 0, 0, 74, 0, 73, 0],
      [73, 0, 76, 0, 78, 0, 76, 0, 73, 0, 0, 0, 76, 0, 78, 0],
      [76, 0, 74, 0, 73, 0, 71, 0, 69, 0, 0, 0, 71, 0, 73, 0],
    ],
    bassRoots: [42, 38, 45, 40],
  },
  {
    id: 'walker-alone',
    number: '02',
    title: 'Alone',
    artist: 'Alan Walker',
    subtitle: 'Soaring Vocal Chorus & Uplifting Drop',
    bpm: 124,
    musicalKey: 'Bb Minor',
    vibe: 'Vocal Melodic House',
    accentCss: '#38bdf8',
    vocalLines: [
      'Lost in your mind, I wanna know — am I losing my mind?',
      'If this night is not forever, at least we are together',
      "I know I'm not alone, I know I'm not alone",
      'Anywhere, whenever — apart but still together',
    ],
    arpWave: 'triangle',
    leadWave: 'sawtooth',
    bassWave: 'sine',
    // Bbm -> Gb -> Db -> Ab
    arpPattern: [
      [70, 77, 73, 82, 77, 73, 70, 77, 70, 77, 73, 82, 77, 73, 82, 77],
      [66, 73, 70, 78, 73, 70, 66, 73, 66, 73, 70, 78, 73, 70, 78, 73],
      [61, 68, 65, 73, 68, 65, 61, 68, 61, 68, 65, 73, 68, 65, 73, 68],
      [68, 75, 72, 80, 75, 72, 68, 75, 68, 75, 72, 80, 75, 72, 80, 75],
    ],
    leadMelody: [
      [77, 0, 82, 0, 80, 0, 78, 0, 77, 0, 75, 0, 77, 0, 0, 0],
      [78, 0, 77, 0, 75, 0, 73, 0, 75, 0, 73, 0, 70, 0, 0, 0],
      [73, 0, 77, 0, 80, 0, 78, 0, 77, 0, 75, 0, 73, 0, 0, 0],
      [75, 0, 77, 0, 80, 0, 77, 0, 75, 0, 73, 0, 72, 0, 0, 0],
    ],
    bassRoots: [46, 42, 37, 44],
  },
  {
    id: 'walker-spectre',
    number: '03',
    title: 'The Spectre',
    artist: 'Alan Walker',
    subtitle: 'Vocal Synth Anthem & Euphoric Drop',
    bpm: 128,
    musicalKey: 'C# Minor',
    vibe: 'Walker Vocal Anthem',
    accentCss: '#e879f9',
    vocalLines: [
      'Hello, hello — can you hear me as I scream your name?',
      'Hello, hello — do you need me before I fade away?',
      'We live, we love, we lie...',
      'Deep in the dark I do not need the light',
    ],
    arpWave: 'sawtooth',
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    // C#m -> A -> E -> B
    arpPattern: [
      [61, 68, 64, 73, 68, 64, 61, 68, 61, 68, 64, 73, 68, 64, 73, 68],
      [69, 76, 73, 81, 76, 73, 69, 76, 69, 76, 73, 81, 76, 73, 81, 76],
      [64, 71, 68, 76, 71, 68, 64, 71, 64, 71, 68, 76, 71, 68, 76, 71],
      [59, 66, 63, 71, 66, 63, 59, 66, 59, 66, 63, 71, 66, 68, 71, 66],
    ],
    leadMelody: [
      [76, 0, 76, 0, 80, 0, 76, 0, 73, 0, 0, 0, 75, 0, 76, 0],
      [73, 0, 76, 0, 80, 0, 81, 0, 80, 0, 0, 0, 76, 0, 0, 0],
      [76, 0, 75, 0, 73, 0, 71, 0, 73, 0, 0, 0, 76, 0, 75, 0],
      [71, 0, 73, 0, 75, 0, 76, 0, 75, 0, 0, 0, 73, 0, 0, 0],
    ],
    bassRoots: [37, 45, 40, 35],
  },
  {
    id: 'walker-darkside',
    number: '04',
    title: 'Darkside',
    artist: 'Alan Walker',
    subtitle: 'Vocal Choir & High-Heat Future Bass',
    bpm: 128,
    musicalKey: 'D Minor',
    vibe: 'Pursuit Vocal Bass',
    accentCss: '#f43f5e',
    vocalLines: [
      "We're not in love, we share no stories",
      'Just something in your eyes — do not be afraid',
      'Let it be, let it be — take me to the darkside',
      'Beneath the sky as black as diamonds, running out of time',
    ],
    arpWave: 'triangle',
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    // Dm -> Bb -> F -> C
    arpPattern: [
      [62, 69, 65, 74, 69, 65, 62, 69, 62, 69, 65, 74, 69, 72, 74, 69],
      [58, 65, 62, 70, 65, 62, 58, 65, 58, 65, 62, 70, 65, 62, 70, 65],
      [65, 72, 69, 77, 72, 69, 65, 72, 65, 72, 69, 77, 72, 69, 77, 72],
      [60, 67, 64, 72, 67, 64, 60, 67, 60, 67, 64, 72, 67, 71, 72, 67],
    ],
    leadMelody: [
      [74, 0, 77, 0, 81, 0, 77, 0, 74, 0, 72, 0, 74, 0, 0, 0],
      [70, 0, 74, 0, 77, 0, 74, 0, 72, 0, 70, 0, 69, 0, 0, 0],
      [77, 0, 81, 0, 84, 0, 81, 0, 77, 0, 76, 0, 74, 0, 0, 0],
      [76, 0, 74, 0, 72, 0, 74, 0, 72, 0, 69, 0, 67, 0, 0, 0],
    ],
    bassRoots: [38, 34, 41, 36],
  },
  {
    id: 'walker-on-my-way',
    number: '05',
    title: 'On My Way',
    artist: 'Alan Walker',
    subtitle: 'Acoustic Pluck & Vocal Highway Anthem',
    bpm: 126,
    musicalKey: 'G Minor',
    vibe: 'Vocal Pop-EDM',
    accentCss: '#f59e0b',
    vocalLines: [
      'Nobody but me can keep me safe — and I am on my way',
      'The blood moon is on the rise, the fire burning in my eyes',
      'So take aim and fire away, I have never been so wide awake',
      'No, nobody but me can keep me safe, and I am on my way',
    ],
    arpWave: 'triangle',
    leadWave: 'triangle',
    bassWave: 'sine',
    // Gm -> Eb -> Bb -> F
    arpPattern: [
      [67, 74, 70, 79, 74, 70, 67, 74, 67, 74, 70, 79, 77, 74, 79, 74],
      [63, 70, 67, 75, 70, 67, 63, 70, 63, 70, 67, 75, 74, 70, 75, 70],
      [70, 77, 74, 82, 77, 74, 70, 77, 70, 77, 74, 82, 79, 77, 82, 77],
      [65, 72, 69, 77, 72, 69, 65, 72, 65, 72, 69, 77, 74, 72, 77, 72],
    ],
    leadMelody: [
      [79, 0, 79, 82, 84, 0, 82, 0, 79, 0, 77, 0, 74, 0, 0, 0],
      [75, 0, 75, 79, 82, 0, 79, 0, 77, 0, 75, 0, 74, 0, 0, 0],
      [82, 0, 82, 86, 87, 0, 86, 0, 82, 0, 79, 0, 77, 0, 0, 0],
      [81, 0, 79, 0, 77, 0, 74, 0, 77, 0, 79, 0, 81, 0, 0, 0],
    ],
    bassRoots: [43, 39, 46, 41],
  },
  {
    id: 'walker-ignite',
    number: '06',
    title: 'Ignite',
    artist: 'Alan Walker',
    subtitle: 'Festival Vocal Drop & Turbo Synth',
    bpm: 132,
    musicalKey: 'E Minor',
    vibe: 'Big-Room Vocal Drop',
    accentCss: '#10b981',
    vocalLines: [
      'Fireflies, a million little pieces feeding the dying light',
      'One touch and I ignite — like a starship speeding into the night',
      'You and I will burn so bright — let the darkness turn to light',
      'And ignite, ignite, ignite!',
    ],
    arpWave: 'sawtooth',
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    // Em -> C -> G -> D
    arpPattern: [
      [64, 71, 67, 76, 71, 67, 64, 71, 64, 71, 67, 76, 74, 71, 76, 71],
      [60, 67, 64, 72, 67, 64, 60, 67, 60, 67, 64, 72, 71, 67, 72, 67],
      [67, 74, 71, 79, 74, 71, 67, 74, 67, 74, 71, 79, 76, 74, 79, 74],
      [62, 69, 66, 74, 69, 66, 62, 69, 62, 69, 66, 74, 72, 69, 74, 69],
    ],
    leadMelody: [
      [76, 0, 79, 0, 83, 0, 79, 0, 78, 0, 76, 0, 74, 0, 0, 0],
      [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 71, 0, 0, 0],
      [79, 0, 83, 0, 86, 0, 83, 0, 81, 0, 79, 0, 78, 0, 0, 0],
      [74, 0, 78, 0, 81, 0, 79, 0, 78, 0, 74, 0, 76, 0, 0, 0],
    ],
    bassRoots: [40, 36, 43, 38],
  },
  {
    id: 'walker-sing-me-to-sleep',
    number: '07',
    title: 'Sing Me to Sleep',
    artist: 'Alan Walker',
    subtitle: 'Midnight Vocal Echo & Dreamy Plucks',
    bpm: 122,
    musicalKey: 'A Minor',
    vibe: 'Atmospheric Vocal House',
    accentCss: '#a855f7',
    vocalLines: [
      'Wait a second, let me catch my breath',
      'Remind me how it feels to hear your voice',
      'Just sing me to sleep now — sing me to sleep',
      'Remember me, now time cannot erase...',
    ],
    arpWave: 'sine',
    leadWave: 'triangle',
    bassWave: 'sine',
    // Am -> F -> C -> G
    arpPattern: [
      [69, 72, 76, 81, 76, 72, 69, 72, 69, 76, 79, 81, 76, 72, 76, 72],
      [65, 69, 72, 77, 72, 69, 65, 69, 65, 72, 76, 77, 72, 69, 72, 69],
      [60, 67, 64, 72, 67, 64, 60, 67, 60, 64, 67, 72, 67, 64, 72, 67],
      [67, 71, 74, 79, 74, 71, 67, 71, 67, 74, 76, 79, 74, 71, 74, 71],
    ],
    leadMelody: [
      [76, 0, 0, 0, 79, 0, 81, 0, 76, 0, 0, 0, 72, 0, 74, 0],
      [77, 0, 0, 0, 76, 0, 72, 0, 69, 0, 0, 0, 72, 0, 0, 0],
      [72, 0, 76, 0, 79, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0],
      [74, 0, 0, 0, 79, 0, 76, 0, 74, 0, 71, 0, 69, 0, 0, 0],
    ],
    bassRoots: [45, 41, 36, 43],
  },
  {
    id: 'walker-lily',
    number: '08',
    title: 'Lily',
    artist: 'Alan Walker',
    subtitle: 'Nordic Fairy-Tale Vocal & Driving Synth',
    bpm: 126,
    musicalKey: 'C Minor',
    vibe: 'Melodic Vocal Electro',
    accentCss: '#ec4899',
    vocalLines: [
      'Lily was a little girl, afraid of the big, wide world',
      'She grew up within her castle walls',
      'Follow everywhere I go — top over the mountains',
      'Running fast into the night, never looking back!',
    ],
    arpWave: 'triangle',
    leadWave: 'sawtooth',
    bassWave: 'sine',
    // Cm -> Ab -> Eb -> Bb
    arpPattern: [
      [60, 67, 63, 72, 67, 63, 60, 67, 60, 67, 63, 72, 67, 63, 72, 67],
      [68, 75, 72, 80, 75, 72, 68, 75, 68, 75, 72, 80, 75, 72, 80, 75],
      [63, 70, 67, 75, 70, 67, 63, 70, 63, 70, 67, 75, 70, 67, 75, 70],
      [58, 65, 62, 70, 65, 62, 58, 65, 58, 65, 62, 70, 65, 62, 70, 65],
    ],
    leadMelody: [
      [72, 0, 75, 0, 79, 0, 77, 0, 75, 0, 74, 0, 72, 0, 0, 0],
      [75, 0, 79, 0, 80, 0, 79, 0, 75, 0, 74, 0, 72, 0, 0, 0],
      [75, 0, 77, 0, 79, 0, 82, 0, 79, 0, 77, 0, 75, 0, 0, 0],
      [74, 0, 77, 0, 75, 0, 74, 0, 72, 0, 70, 0, 67, 0, 0, 0],
    ],
    bassRoots: [36, 44, 39, 46],
  },
];

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type TouchSteerMode = 'BUTTONS' | 'WHEEL';

export interface InputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
  steerAxis?: number;
}

export interface RacerMinimapDot {
  id: string;
  x: number;
  z: number;
  isPlayer: boolean;
  isPolice?: boolean;
  isSuspect?: boolean;
  color: string;
}

export interface RacerStanding {
  id: string;
  name: string;
  isPlayer: boolean;
  position: number;
  totalTimeMs: number;
  bestLapMs: number | null;
  color: string;
  finished: boolean;
  eliminated?: boolean;
}

export type PursuitAlertLevel = 'NONE' | 'LOCK_ON' | 'TAKEDOWN';

export type CameraMode = 'CHASE' | 'HOOD' | 'COCKPIT';

export interface RearMirrorBlip {
  id: string;
  distM: number; // positive distance behind player
  lateralOffset: number; // negative = left in mirror, positive = right
  isPolice: boolean;
  isTraffic: boolean;
  color: string;
}

export interface MirrorViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RaceSegmentMetric {
  label: string;
  timeMs: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  driftPts: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  mode: GameModeId;
  cameraMode: CameraMode;
  graphicsQuality: GraphicsQuality;
  isHardwareMirror: boolean;
  vehicleId: string;
  vehicleName: string;
  isBike: boolean;
  truckArtEnabled: boolean;
  speedKmh: number;
  topSpeedKmh: number;
  score: number;
  driftScore: number;
  comboMultiplier: number;
  nearMisses: number;
  rpmRatio: number;
  gear: number;
  nitro: number;
  hullIntegrity: number; // 0..100
  impactFlash: number; // 0..1
  slowMoActive: boolean;
  mirrorEnabled: boolean;
  isBoosting: boolean;
  isDrifting: boolean;
  driftIntensity: number;
  lap: number;
  totalLaps: number;
  position: number;
  totalRacers: number;
  raceTimeMs: number;
  currentLapMs: number;
  bestLapMs: number | null;
  modeTimerMs: number; // shared countdown for Escape / Drift / Traffic / Blitz / Knockout / Cop
  knockoutNextMs: number;
  checkpointsCleared: number;
  checkpointsTarget: number;
  dragProgress: number; // 0..100
  suspectsRemaining: number;
  suspectsTotal: number;
  policeHeat: number;
  wantedStars: number;
  pursuitAlert: PursuitAlertLevel;
  policeCloseWarning: boolean;
  bustProgress: number;
  busted: boolean;
  victory: boolean;
  resultHeadline: string;
  resultSubline: string;
  takedowns: number;
  countdownValue: number;
  bannerText: string | null;
  weatherCondition: DynamicWeatherCondition;
  trackGripPercent: number;
  playerHeadingRad: number;
  sharpTurnAhead: 'LEFT' | 'RIGHT' | null;
  minimapPath: Array<{ x: number; z: number }>;
  minimapDots: RacerMinimapDot[];
  rearBlips: RearMirrorBlip[];
  standings: RacerStanding[];
  lapMetrics: RaceSegmentMetric[];
  speedSplits: RaceSegmentMetric[];
}
