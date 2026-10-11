import * as THREE from 'three'
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { buildMotorcycle } from './motorcycle.js'
import { buildPulsar } from './pulsar.js'
import { buildRonin } from './ronin.js'
import { buildScooter } from './scooter.js'

// Stylised, procedurally built scale models (fan replicas) of popular Indian motorcycles and scooters.
// Dimensions are approximate real-world metres, so scale prints (1:24 … 1:6) come out at believable sizes.

const RE_CLASSIC = {
  wb: 1.39,
  front: { r: 0.335, w: 0.095, style: 'spoke', spokes: 40 },
  rear: { r: 0.325, w: 0.115, style: 'spoke', spokes: 40 },
  fork: { type: 'tele', top: [1.09, 0.95], gaiter: true, spread: 0.09 },
  pivot: [0.44, 0.39],
  headlight: { pos: [1.23, 0.97], r: 0.095, housing: 'chrome', nacelle: true, pilots: true },
  bar: { pos: [1.02, 1.08], width: 0.38, rise: 0.07, back: 0.12, speedo: true },
  tank: { shape: 'teardrop', x0: 0.56, x1: 1.07, bottom: 0.78, height: 0.21, width: 0.32, badge: true, kneePads: true },
  seat: { type: 'split', x0: 0.02, x1: 0.62, y: 0.8, width: 0.3 },
  engine: { type: 'single', crank: [0.72, 0.42], tilt: 0.12, fins: 10, role: 'metal', covers: 'chrome' },
  exhaust: { type: 'peashooter', role: 'chrome' },
  fenders: { front: [0.2, 2.75], rear: [0.35, 3.5], stays: true },
  shocks: 'twin',
  tail: { x: -0.25, y: 0.64 },
  extras: { sideBoxes: true, crashGuard: true },
}

export const VEHICLES = [
  {
    key: 'tvs-ronin',
    type: 'motorcycle',
    brand: 'TVS',
    name: 'Ronin',
    engine: '225.9 cc · oil-cooled single',
    style: 'Neo-retro scrambler',
    tagline: 'Gold 41 mm USD fork, T-shaped LED DRL, flat one-piece seat and an offset round digital console.',
    seat: '#1d1d20',
    colors: [
      { name: 'Magma Red', hex: '#a01d1a', accent: '#1c1d21' },
      { name: 'Lightning Black', hex: '#16171b', accent: '#3b3e45' },
      { name: 'Delta Blue', hex: '#24467e', accent: '#8d9198', seat: '#4a3324' },
      { name: 'Stargaze Black', hex: '#1a1b20', accent: '#5c6067', seat: '#4a3324' },
      { name: 'Galactic Grey', hex: '#565b62', accent: '#b8231e', seat: '#4a3324' },
      { name: 'Dawn Orange', hex: '#cf5f26', accent: '#2c2f35', seat: '#4a3324' },
    ],
    // Too distinctive for the generic builder: modelled part by part in ronin.js.
    builder: 'ronin',
  },
  {
    key: 'bajaj-pulsar-ns160',
    type: 'motorcycle',
    brand: 'Bajaj',
    name: 'Pulsar NS160',
    engine: '160.3 cc · 4-valve oil-cooled single',
    style: 'Naked sports',
    tagline: 'Perimeter frame, gold USD fork, underbelly exhaust, split seats and thunderbolt LED DRLs.',
    seat: '#151517',
    colors: [
      { name: 'Glossy Racing Red', hex: '#b3141c', accent: '#151619' },
      { name: 'Metallic Pearl White', hex: '#e9e9e5', accent: '#1b1c20' },
      { name: 'Pewter Grey', hex: '#5b5f66', accent: '#2a2c31', matte: true },
      { name: 'Glossy Ebony Black', hex: '#141518', accent: '#5b5f66' },
    ],
    builder: 'pulsar',
    variant: 'ns160',
  },
  {
    key: 'bajaj-pulsar-n160',
    type: 'motorcycle',
    brand: 'Bajaj',
    name: 'Pulsar N160',
    engine: '164.82 cc · oil-cooled single',
    style: 'Streetfighter',
    tagline: 'Muscular tank shrouds, wolf-eye LED projector, gold USD fork and a stubby side exhaust.',
    seat: '#151517',
    colors: [
      { name: 'Racing Red', hex: '#b8161d', accent: '#17181b' },
      { name: 'Caribbean Blue', hex: '#1f5aa6', accent: '#17181b' },
      { name: 'Brooklyn Black', hex: '#16171a', accent: '#5b5f66', matte: true },
      { name: 'Pearl Metallic White', hex: '#ebeae6', accent: '#17181b' },
    ],
    builder: 'pulsar',
    variant: 'n160',
  },
  {
    key: 're-classic-350',
    type: 'motorcycle',
    brand: 'Royal Enfield',
    name: 'Classic 350',
    engine: '349 cc · J-series single',
    style: 'Post-war classic',
    tagline: 'Teardrop tank, casquette headlamp with pilot lamps, wire wheels and a peashooter exhaust.',
    seat: '#3a2a20',
    colors: [
      { name: 'Halcyon Green', hex: '#2e4a37', accent: '#e8d9a8' },
      { name: 'Signals Desert Sand', hex: '#a8916b', accent: '#3b3b2f' },
      { name: 'Chrome Red', hex: '#8e1b1b', accent: '#e3e3e3' },
      { name: 'Stealth Black', hex: '#151517', accent: '#c9a227' },
      { name: 'Dark Gunmetal Grey', hex: '#3f444b', accent: '#c9a227' },
    ],
    spec: RE_CLASSIC,
  },
  {
    key: 're-bullet-350',
    type: 'motorcycle',
    brand: 'Royal Enfield',
    name: 'Bullet 350',
    engine: '349 cc · J-series single',
    style: 'Timeless classic',
    tagline: 'The legend — long bench seat, hand-painted gold pinstripes and that unmistakable thump.',
    seat: '#1b1b1d',
    colors: [
      { name: 'Black Gold', hex: '#121214', accent: '#d4a017' },
      { name: 'Military Red', hex: '#7e1f1f', accent: '#e8e2d0' },
      { name: 'Standard Maroon', hex: '#5a1a22', accent: '#d4a017' },
      { name: 'Standard Black', hex: '#141416', accent: '#f1f1ee' },
    ],
    spec: {
      ...RE_CLASSIC,
      seat: { type: 'bench', x0: 0.02, x1: 0.63, y: 0.81, width: 0.29 },
      tank: { ...RE_CLASSIC.tank, stripe: true, stripeRole: 'paint2' },
      extras: { sideBoxes: true },
    },
  },
  {
    key: 're-hunter-350',
    type: 'motorcycle',
    brand: 'Royal Enfield',
    name: 'Hunter 350',
    engine: '349 cc · J-series single',
    style: 'Urban roadster',
    tagline: 'Compact, flickable roadster on 17-inch alloys with a short upswept muffler.',
    seat: '#1d1d20',
    colors: [
      { name: 'Rebel Blue', hex: '#1f4fa8', accent: '#f1f1ee' },
      { name: 'Dapper Grey', hex: '#7d838b', accent: '#1d1d20' },
      { name: 'Factory Black', hex: '#1b1c20', accent: '#c9a227' },
      { name: 'Rebel Red', hex: '#b3261e', accent: '#f1f1ee' },
    ],
    spec: {
      wb: 1.37,
      front: { r: 0.31, w: 0.1, style: 'alloy10', rimRole: 'black' },
      rear: { r: 0.31, w: 0.12, style: 'alloy10', rimRole: 'black' },
      fork: { type: 'tele', top: [1.08, 0.92], spread: 0.085, upperRole: 'chrome', lowerRole: 'black' },
      pivot: [0.44, 0.39],
      headlight: { pos: [1.21, 0.93], r: 0.085, housing: 'black' },
      bar: { pos: [1.0, 1.04], width: 0.38, rise: 0.04, back: 0.06, role: 'black', mirrorRole: 'black', speedo: true },
      tank: { shape: 'teardrop', x0: 0.6, x1: 1.04, bottom: 0.78, height: 0.19, width: 0.3, badge: true },
      seat: { type: 'bench', x0: 0.06, x1: 0.62, y: 0.79, width: 0.28 },
      engine: { type: 'single', crank: [0.72, 0.41], tilt: 0.12, fins: 10, role: 'metal', covers: 'black' },
      exhaust: { type: 'short', role: 'chrome', mufflerRole: 'chrome', shieldRole: 'black' },
      fenders: { front: [0.5, 2.3], rear: [0.9, 2.5] },
      shocks: 'twin',
      tail: { x: -0.18, y: 0.7 },
      extras: { sideBoxes: true },
    },
  },
  {
    key: 're-himalayan-450',
    type: 'motorcycle',
    brand: 'Royal Enfield',
    name: 'Himalayan 450',
    engine: '452 cc · liquid-cooled single',
    style: 'Adventure tourer',
    tagline: '21-inch spoked front wheel, knobby tyres, tank guards, tall screen and a luggage rack.',
    seat: '#1d1d20',
    colors: [
      { name: 'Kaza Brown', hex: '#6b4a2f', accent: '#1d1d20' },
      { name: 'Slate Himalayan Salt', hex: '#b7b9b6', accent: '#2a5ea8' },
      { name: 'Hanle Black', hex: '#15161a', accent: '#c4161c' },
      { name: 'Kamet White', hex: '#e9e9e6', accent: '#1d1d20' },
    ],
    spec: {
      wb: 1.51,
      front: { r: 0.37, w: 0.09, style: 'spoke', spokes: 36, knobby: true, rimRole: 'black' },
      rear: { r: 0.33, w: 0.125, style: 'spoke', spokes: 36, knobby: true, rimRole: 'black' },
      fork: { type: 'usd', top: [1.17, 1.07], spread: 0.09, upperRole: 'black', lowerRole: 'chrome' },
      pivot: [0.47, 0.43],
      headlight: { pos: [1.31, 1.08], r: 0.088, housing: 'black', drl: 'ring' },
      bar: { pos: [1.08, 1.2], width: 0.42, rise: 0.08, back: 0.08, role: 'black', mirrorRole: 'black' },
      tank: { shape: 'adv', x0: 0.64, x1: 1.12, bottom: 0.86, height: 0.22, width: 0.36 },
      seat: { type: 'split', x0: 0.02, x1: 0.68, y: 0.86, width: 0.3 },
      engine: { type: 'liquid', crank: [0.78, 0.45], tilt: 0.2, role: 'black', covers: 'metal' },
      exhaust: { type: 'upswept', role: 'chrome', mufflerRole: 'black' },
      fenders: { front: [0.55, 2.35], rear: [0.9, 2.3], frontGap: 0.06, frontRole: 'paint2', rearRole: 'black' },
      shocks: 'mono',
      springRole: 'paint2',
      tail: { x: -0.18, y: 0.8 },
      extras: { tankGuard: true, windscreen: true, rack: true, sidePanel: true },
    },
  },
  {
    key: 're-interceptor-650',
    type: 'motorcycle',
    brand: 'Royal Enfield',
    name: 'Interceptor 650',
    engine: '648 cc · parallel twin',
    style: 'Classic twin roadster',
    tagline: 'Air-oil cooled parallel twin with twin peashooter exhausts and a ribbed bench seat.',
    seat: '#1b1b1d',
    colors: [
      { name: 'Canyon Red', hex: '#8c2a1e', accent: '#f1f1ee' },
      { name: 'Mark 2 Chrome', hex: '#c7cbd1', accent: '#1b1b1d' },
      { name: 'Black Ray', hex: '#141518', accent: '#c9a227' },
      { name: 'Sunset Strip', hex: '#c46a28', accent: '#f1f1ee' },
    ],
    spec: {
      wb: 1.4,
      front: { r: 0.33, w: 0.1, style: 'spoke', spokes: 40 },
      rear: { r: 0.33, w: 0.12, style: 'spoke', spokes: 40 },
      fork: { type: 'tele', top: [1.1, 0.95], spread: 0.09, gaiter: true },
      pivot: [0.44, 0.39],
      headlight: { pos: [1.24, 0.97], r: 0.092, housing: 'chrome' },
      bar: { pos: [1.03, 1.08], width: 0.4, rise: 0.08, back: 0.12 },
      tank: { shape: 'teardrop', x0: 0.58, x1: 1.08, bottom: 0.79, height: 0.2, width: 0.34, badge: true, kneePads: true },
      seat: { type: 'bench', x0: 0.0, x1: 0.64, y: 0.81, width: 0.3, grabRail: true },
      engine: { type: 'twin', crank: [0.73, 0.42], tilt: 0.1, fins: 9, role: 'metal', covers: 'chrome' },
      exhaust: { type: 'twin', role: 'chrome' },
      fenders: { front: [0.4, 2.55], rear: [0.6, 3.2], stays: true },
      shocks: 'twin',
      tail: { x: -0.22, y: 0.68 },
      extras: { sideBoxes: true },
    },
  },
  {
    key: 'tvs-jupiter',
    type: 'scooter',
    brand: 'TVS',
    name: 'Jupiter',
    engine: '113.3 cc · family scooter',
    style: 'Everyday scooter',
    tagline: 'Big front apron with chrome garnish, roomy floorboard and a comfy long seat.',
    seat: '#2a2320',
    colors: [
      { name: 'Starlight Blue', hex: '#2a4f8f', accent: '#1b1c20' },
      { name: 'Titanium Grey', hex: '#6d7178', accent: '#1b1c20' },
      { name: 'Dawn Orange', hex: '#d36b2a', accent: '#1b1c20' },
      { name: 'Pristine White', hex: '#ecebe7', accent: '#2a2b30' },
    ],
    spec: { wb: 1.275, front: { r: 0.26, w: 0.09 }, rear: { r: 0.25, w: 0.1 }, body: { seatY: 0.73, tailX: -0.42 }, headlight: 'apron', chrome: true },
  },
  {
    key: 'tvs-scooty-pep',
    type: 'scooter',
    brand: 'TVS',
    name: 'Scooty Pep+',
    engine: '87.8 cc · lightweight',
    style: 'Compact city scooter',
    tagline: 'Light, low and friendly — handlebar headlamp and a cute rounded body.',
    seat: '#1d1d20',
    colors: [
      { name: 'Princess Pink', hex: '#e7739b', accent: '#f4f1ee' },
      { name: 'Aqua Matte', hex: '#4fb3b0', accent: '#f4f1ee', matte: true },
      { name: 'Coffee Brown', hex: '#6e4b33', accent: '#efe6d8' },
      { name: 'Glossy Red', hex: '#c62a2a', accent: '#f4f1ee' },
    ],
    spec: {
      wb: 1.23,
      front: { r: 0.23, w: 0.08 },
      rear: { r: 0.22, w: 0.085 },
      body: { seatY: 0.68, tailX: -0.36, tailY: 0.56, floorY: 0.29, rearArch: 0.41, frontArch: 0.55, apronTop: 0.95, apronMid: 0.7, apronX: 1.27, bodyW: 0.32, apronW: 0.4 },
      headlight: 'handlebar',
    },
  },
  {
    key: 'tvs-ntorq-125',
    type: 'scooter',
    brand: 'TVS',
    name: 'NTorq 125',
    engine: '124.8 cc · sporty',
    style: 'Sport scooter',
    tagline: 'Stealth-aircraft lines, LED headlamp with DRLs and a sporty split grab rail.',
    seat: '#151517',
    colors: [
      { name: 'Race Red', hex: '#c4161c', accent: '#151517' },
      { name: 'Stealth Black', hex: '#141417', accent: '#c4161c' },
      { name: 'Metallic Grey', hex: '#6f747b', accent: '#151517' },
      { name: 'Turquoise Blue', hex: '#1aa3b0', accent: '#151517' },
    ],
    spec: { wb: 1.285, front: { r: 0.26, w: 0.1 }, rear: { r: 0.25, w: 0.11 }, body: { angular: true, bevel: 0.035, seatY: 0.74, tailY: 0.63, tailX: -0.42 }, headlight: 'apron', drl: true, springRole: 'tail' },
  },
  {
    key: 'honda-activa-6g',
    type: 'scooter',
    brand: 'Honda',
    name: 'Activa 6G',
    engine: '109.5 cc · family scooter',
    style: 'India’s favourite scooter',
    tagline: 'The classic family scooter — tall apron headlamp, chrome accents, metal body.',
    seat: '#3b2c22',
    colors: [
      { name: 'Pearl Precious White', hex: '#efeee9', accent: '#2a2b30' },
      { name: 'Matte Axis Grey', hex: '#5c6168', accent: '#1b1c20', matte: true },
      { name: 'Rebel Red Metallic', hex: '#9d1c22', accent: '#1b1c20' },
      { name: 'Pearl Siren Blue', hex: '#2c4f9c', accent: '#1b1c20' },
    ],
    spec: { wb: 1.26, front: { r: 0.255, w: 0.09 }, rear: { r: 0.24, w: 0.1 }, body: { seatY: 0.74, apronTop: 1.02, apronMid: 0.78 }, headlight: 'apron', chrome: true },
  },
  {
    key: 'ather-450x',
    type: 'scooter',
    brand: 'Ather',
    name: '450X',
    engine: 'Electric · 3.7 kWh battery',
    style: 'Smart electric scooter',
    tagline: 'Sharp, sporty electric with LED headlamp, belt drive and a flat floorboard.',
    seat: '#151517',
    colors: [
      { name: 'Space Grey', hex: '#5a5f66', accent: '#151517' },
      { name: 'Salt Green', hex: '#a7c4b5', accent: '#151517' },
      { name: 'Cosmic Black', hex: '#16171b', accent: '#2dd4bf' },
      { name: 'Still White', hex: '#efefec', accent: '#151517' },
    ],
    spec: { wb: 1.295, front: { r: 0.255, w: 0.1 }, rear: { r: 0.25, w: 0.11 }, body: { angular: true, bevel: 0.045, seatY: 0.75, tailY: 0.62, rearArch: 0.45 }, headlight: 'apron', drl: true, electric: true, springRole: 'paint2' },
  },
  {
    key: 'ola-s1-pro',
    type: 'scooter',
    brand: 'Ola',
    name: 'S1 Pro',
    engine: 'Electric · 4 kWh battery',
    style: 'Electric scooter',
    tagline: 'Smooth, rounded body with signature twin-pod headlamps and bold colours.',
    seat: '#151517',
    colors: [
      { name: 'Coral Glam', hex: '#f2786b', accent: '#151517' },
      { name: 'Midnight Blue', hex: '#1d2a4f', accent: '#151517' },
      { name: 'Porcelain White', hex: '#f2f1ee', accent: '#151517' },
      { name: 'Neo Mint', hex: '#9fe0c4', accent: '#151517' },
    ],
    spec: { wb: 1.36, front: { r: 0.25, w: 0.1 }, rear: { r: 0.25, w: 0.11 }, body: { bevel: 0.09, seatY: 0.74, tailX: -0.38, apronTop: 1.0, apronMid: 0.76 }, headlight: 'twin', drl: true, electric: true, floorRole: 'black' },
  },
]

export const vehicleByKey = (key) => VEHICLES.find((v) => v.key === key)

// Detailed, model-specific builders (everything else uses the parametric motorcycle / scooter builders).
const BUILDERS = {
  ronin: () => buildRonin(),
  pulsar: (vehicle) => buildPulsar(vehicle.variant),
}

const cache = new Map()

/** Builds (once) and returns { roles, box, size, center } for a vehicle. */
export function getVehicleGeometry(key) {
  if (!cache.has(key)) {
    const vehicle = vehicleByKey(key)
    const roles = vehicle.builder ? BUILDERS[vehicle.builder](vehicle) : vehicle.type === 'scooter' ? buildScooter(vehicle.spec) : buildMotorcycle(vehicle.spec)
    const box = new THREE.Box3()
    for (const g of Object.values(roles)) box.union(g.boundingBox)
    cache.set(key, { roles, box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) })
  }
  return cache.get(key)
}

/** Overall length in mm when printed at 1:`scale`. */
export const printedLengthMm = (key, scale) => (getVehicleGeometry(key).size.x * 1000) / scale

/** A real binary STL of the model at 1:`scale`, ready for the order flow. */
export function createVehicleFile(key, scale = 12) {
  const { roles } = getVehicleGeometry(key)
  const merged = mergeGeometries(Object.values(roles).map((g) => g.clone()), false)
  const mmPerMetre = 1000 / scale
  merged.scale(mmPerMetre, mmPerMetre, mmPerMetre)
  merged.rotateX(Math.PI / 2) // Y-up → Z-up like CAD exports
  const data = new STLExporter().parse(new THREE.Mesh(merged), { binary: true })
  merged.dispose()
  return new File([data], `${key}-scale-1-${scale}.stl`, { type: 'model/stl' })
}
