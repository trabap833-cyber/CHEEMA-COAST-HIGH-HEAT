import lamboAventadorImg from '../assets/images/lambo_aventador_svj_1795667270378.jpg';
import koenigseggJeskoImg from '../assets/images/koenigsegg_jesko_1795667272047.jpg';
import bugattiChironImg from '../assets/images/bugatti_chiron_1795667271364.jpg';
import ferrariPistaImg from '../assets/images/ferrari_pista_1795667272008.jpg';
import formulaOneImg from '../assets/images/formula_one_car_1795667272119.jpg';
import nissanGtrR34Img from '../assets/images/nissan_gtr_r34_1795667272529.jpg';
import toyotaSupraMk4Img from '../assets/images/toyota_supra_mk4_1795667272898.jpg';
import mazdaRx7Fd3sImg from '../assets/images/mazda_rx7_fd3s_1795667272925.jpg';
import bmwM5CsImg from '../assets/images/bmw_m5_cs_1795667274113.jpg';
import bmwM4CompImg from '../assets/images/bmw_m4_competition_1795691214439.jpg';
import porscheGt3RsImg from '../assets/images/porsche_gt3_rs_1795667274114.jpg';
import subaruWrxRallyImg from '../assets/images/subaru_wrx_rally_1795667392471.jpg';
import mclarenSpiderImg from '../assets/images/mclaren_spider_1795667274328.jpg';
import audiRs6AvantImg from '../assets/images/audi_rs6_avant_1795667393030.jpg';
import dodgeHellcatImg from '../assets/images/dodge_challenger_hellcat_1795691215326.jpg';
import mustangGt500Img from '../assets/images/mustang_gt500_1795667275295.jpg';
import fordRaptorRImg from '../assets/images/ford_raptor_r_1795667275915.jpg';
import ramTrxBajaImg from '../assets/images/ram_trx_baja_1795667286690.jpg';
import amgG63SuvImg from '../assets/images/amg_g63_suv_1795667346139.jpg';
import ducatiPanigaleV4Img from '../assets/images/ducati_panigale_v4_1795667288759.jpg';
import kawasakiH2rImg from '../assets/images/kawasaki_h2r_1795667345920.jpg';
import bmwS1000rrImg from '../assets/images/bmw_s1000rr_1795691215906.jpg';
import yamahaR1mImg from '../assets/images/yamaha_yzf_r1m_1795691216714.jpg';
import apriliaRsv4Img from '../assets/images/aprilia_rsv4_factory_1795691217322.jpg';
import suzukiHayabusaImg from '../assets/images/suzuki_hayabusa_1795689045465.jpg';
import { VEHICLES, VehicleSpec } from './types';

export type VehiclePhotoMap = Record<string, string>;

export const VEHICLE_REAL_PHOTOS: VehiclePhotoMap = {
  'italian-v12': lamboAventadorImg,
  'koenig-mega': koenigseggJeskoImg,
  'chiron-w16': bugattiChironImg,
  'v8-mid': ferrariPistaImg,
  'f1-formula': formulaOneImg,
  'skyline-r34': nissanGtrR34Img,
  'supra-mk4': toyotaSupraMk4Img,
  'rx7-rotary': mazdaRx7Fd3sImg,
  'sport-sedan': bmwM5CsImg,
  'bmw-m4-competition': bmwM4CompImg,
  'gt-coupe': porscheGt3RsImg,
  'rally-hatch': subaruWrxRallyImg,
  'convertible-spider': mclarenSpiderImg,
  'sport-wagon': audiRs6AvantImg,
  'dodge-challenger-hellcat': dodgeHellcatImg,
  'v8-muscle': mustangGt500Img,
  'beast-4x4': fordRaptorRImg,
  'pickup-truck': ramTrxBajaImg,
  'luxury-suv': amgG63SuvImg,
  'superbike-1000': ducatiPanigaleV4Img,
  streetfighter: kawasakiH2rImg,
  'bmw-s1000rr': bmwS1000rrImg,
  'yamaha-yzf-r1m': yamahaR1mImg,
  'aprilia-rsv4-factory': apriliaRsv4Img,
  'cyber-moto': suzukiHayabusaImg,
};

export const VEHICLE_PHOTOS: VehiclePhotoMap = VEHICLE_REAL_PHOTOS;

export function createFallbackVehiclePhoto(vehicle: VehicleSpec): string {
  const accent = vehicle.threeD?.defaultColor || '#2563eb';
  const title = vehicle.name.replace(/[<>&"]/g, '');
  const topSpeedKmh = Math.round(vehicle.physics.maxSpeedMs * 3.6);
  const sub = `${vehicle.year} • ${vehicle.vehicleClass.toUpperCase()} • ${topSpeedKmh} KM/H`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1020" />
          <stop offset="100%" stop-color="#172038" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg)" />
      <circle cx="650" cy="90" r="140" fill="${accent}" opacity="0.24" />
      <rect x="36" y="36" width="728" height="378" rx="18" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="2" />
      <text x="68" y="210" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="700">${title}</text>
      <text x="68" y="255" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="18">${sub}</text>
      <text x="68" y="355" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14">${vehicle.make} · ${vehicle.model}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getVehiclePhotoSrc(vehicleId: string): string {
  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[0];
  return VEHICLE_PHOTOS[vehicle.id] || createFallbackVehiclePhoto(vehicle);
}
