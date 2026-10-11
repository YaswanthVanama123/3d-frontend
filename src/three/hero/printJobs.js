import {
  GEAR_HEIGHT,
  KING_HEIGHT,
  ROCKET_HEIGHT,
  VASE,
  gearRadiusAt,
  geometries,
  kingRadiusAt,
  rocketRadiusAt,
  vaseRadius,
} from '../geometries.js'

// The hero printer cycles through these jobs. `seconds` is animation time, `minutes` the "real" print time shown in the HUD.
export const PRINT_JOBS = [
  { key: 'vase', name: 'Spiral Vase', material: 'PLA · Sunset Orange', color: '#ff7a45', geometry: geometries.vase, height: VASE.height, radiusAt: vaseRadius, seconds: 16, minutes: 194, speed: 8.5, nozzle: 215, bed: 60, layerFreq: 55 },
  { key: 'gear', name: 'Compound Gear', material: 'PETG · Transparent Blue', color: '#4f9fe8', geometry: geometries.gear, height: GEAR_HEIGHT, radiusAt: gearRadiusAt, seconds: 9, minutes: 125, speed: 3.2, nozzle: 240, bed: 80, layerFreq: 55 },
  { key: 'king', name: 'Chess King', material: 'PLA · Arctic White', color: '#ece8df', geometry: geometries.king, height: KING_HEIGHT, radiusAt: kingRadiusAt, seconds: 14, minutes: 168, speed: 8, nozzle: 210, bed: 60, layerFreq: 55 },
  { key: 'rocket', name: 'Mini Rocket', material: 'PLA · Signal Red', color: '#e63946', geometry: geometries.rocket, height: ROCKET_HEIGHT, radiusAt: rocketRadiusAt, seconds: 13, minutes: 170, speed: 8, nozzle: 215, bed: 60, layerFreq: 55 },
]
