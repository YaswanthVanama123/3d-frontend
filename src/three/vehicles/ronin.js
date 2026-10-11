import * as THREE from 'three'
import {
  Parts,
  discX,
  discZ,
  endRound,
  fender,
  finRing,
  loftShape,
  profile,
  rbox,
  ring,
  rod,
  smooth01,
  splitLoft,
  spring,
  taperBar,
  tube,
} from './parts.js'
import { alloyWheel, brakeDisc, tyre } from './wheels.js'

// Detailed TVS Ronin 225, built to its published dimensions:
//   wheelbase 1357 mm · L × W × H 2040 × 805 × 1170 mm · seat 795 mm · ground clearance 181 mm
//   110/70-17 front & 130/70-17 rear dual-purpose tyres · 300 / 240 mm discs · 41 mm USD fork · 14 L tank
// Metres; rear axle at x = 0, front axle at x = wheelbase, ground at y = 0, +Z = rider's left.

const WB = 1.357
const RF = 0.293 // 17" rim + 110/70 → Ø586 mm
const RR = 0.307 // 17" rim + 130/70 → Ø614 mm
const RAKE = (25.5 * Math.PI) / 180
const FORK_Z = 0.098
const ARM_Z = 0.1 // swingarm legs
/** Point on the steering axis, t metres up the fork from the front axle. */
const fork = (t) => [WB - Math.sin(RAKE) * t, RF + Math.cos(RAKE) * t]

// ── Wheels ───────────────────────────────────────────────────────────────────────────────────

function wheel(P, { x, y, r, width, discR, discSide, caliperAngle }) {
  tyre(P, { x, y, r, width, tread: 'block' }) // dual-purpose blocks
  alloyWheel(P, { x, y, width, spokes: 'pairs5' })
  brakeDisc(P, { x, y, r: discR, z: discSide * (width / 2 + 0.012), side: discSide, caliperAngle, style: 'drilled' })
}

// ── Tank, seat and tail (lofted superellipse sections) ───────────────────────────────────────

const TANK = { x0: 0.555, x1: 1.035 }
function tankShape(u) {
  // low at the back so it flows onto the seat, a broad flat crown, and a deep front around the steering head
  const top = 0.842 + 0.128 * Math.sin(Math.min(1, u / 0.72) * (Math.PI / 2)) - 0.02 * smooth01(0.85, 1, u)
  const bottom = 0.79 - 0.025 * smooth01(0.55, 1, u)
  const hw = 0.112 + 0.06 * Math.sin((Math.PI / 2) * Math.min(1, u / 0.6)) - 0.04 * smooth01(0.78, 1, u)
  const yc = bottom + 0.45 * (top - bottom)
  const e = endRound(u, 0.09, 0.12)
  const s = { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: hw * e, nTop: 2.6, nBot: 3.4 }
  // two-tone split: high at the seat, sweeping down toward the steering head
  s.cut = yc + (bottom + (0.44 - 0.26 * u) * (top - bottom) - yc) * e
  return s
}
const tankX = (u) => TANK.x0 + (TANK.x1 - TANK.x0) * u
const crown = (u) => {
  const s = tankShape(u)
  return s.yc + s.hTop
}

/** Frame for a decal on the upper tank flank: u along the tank, t = height above the waist (0…1), side ±1. */
function tankFrame(u, t, side, lift = 0.0012) {
  const point = (uu, tt) => {
    const s = tankShape(uu)
    return new THREE.Vector3(tankX(uu), s.yc + tt * s.hTop, side * s.hw * (1 - tt ** s.nTop) ** (1 / s.nTop))
  }
  const p = point(u, t)
  const du = point(u + 1e-3, t).sub(point(u - 1e-3, t)).normalize()
  const dt = point(u, t + 1e-3).sub(point(u, t - 1e-3)).normalize()
  const n = new THREE.Vector3().crossVectors(du, dt).normalize()
  if (n.z * side < 0) n.negate()
  const xAxis = du.addScaledVector(n, -du.dot(n)).normalize()
  const yAxis = new THREE.Vector3().crossVectors(n, xAxis)
  return new THREE.Matrix4().makeBasis(xAxis, yAxis, n).setPosition(p.addScaledVector(n, lift))
}

function tank(P) {
  const { upper, lower } = splitLoft(TANK, tankShape, 46)
  P.add('paint', upper)
  P.add('paint2', lower)

  // flush aircraft-style fuel cap, tilted to the slope of the crown
  const uc = 0.66
  const tilt = Math.atan((crown(uc + 0.01) - crown(uc - 0.01)) / (tankX(uc + 0.01) - tankX(uc - 0.01)))
  P.add('steel', new THREE.CylinderGeometry(0.034, 0.034, 0.008, 32), { p: [tankX(uc), crown(uc) - 0.002, 0], r: [0, 0, tilt] })
  P.add('black', new THREE.CylinderGeometry(0.026, 0.026, 0.01, 32), { p: [tankX(uc), crown(uc) - 0.001, 0], r: [0, 0, tilt] })

  // TVS badge on both flanks, following the curved paint
  for (const side of [-1, 1]) P.add('metal', rbox(0.07, 0.02, 0.004, 0.0015).applyMatrix4(tankFrame(0.6, 0.4, side)))
}

const SEAT = { x0: 0, x1: 0.645 }
function seatShape(u) {
  const top = 0.812 - 0.016 * smooth01(0.15, 0.55, u) + 0.042 * smooth01(0.8, 1, u) ** 1.5
  const bottom = 0.742 + 0.05 * smooth01(0.82, 1, u)
  const hw = 0.122 + 0.012 * Math.sin(Math.PI * u) - 0.028 * smooth01(0.8, 1, u)
  const yc = bottom + 0.35 * (top - bottom)
  const e = endRound(u, 0.075, 0.05)
  return { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: hw * e, nTop: 4.2, nBot: 6 }
}

const TAIL = { x0: 0.015, x1: 0.27 }
function tailShape(u) {
  const top = 0.745
  const bottom = 0.692 + 0.02 * u
  const yc = (top + bottom) / 2
  const e = endRound(u, 0.14, 0)
  return { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: (0.08 + 0.03 * u) * e, nTop: 3, nBot: 3 }
}

// ── Front end & cockpit ──────────────────────────────────────────────────────────────────────

function frontEnd(P) {
  // 41 mm upside-down fork: gold outer tubes up top, chrome stanchions below, black axle lugs
  for (const side of [-1, 1]) {
    const z = side * FORK_Z
    P.add('gold', rod([...fork(0.36), z], [...fork(0.7), z], 0.0255, 0.0255, 24))
    P.add('black', rod([...fork(0.35), z], [...fork(0.37), z], 0.027, 0.027, 24))
    P.add('chrome', rod([...fork(0.06), z], [...fork(0.42), z], 0.0205, 0.0205, 20))
    P.add('black', rbox(0.06, 0.1, 0.046, 0.014), { p: [...fork(0.035), z], r: [0, 0, RAKE] })
    P.add('gold', rod([...fork(0.7), z], [...fork(0.712), z], 0.02, 0.02, 20))
  }
  P.add('metal', discZ([WB, RF, 0], 0.012, FORK_Z * 2 + 0.05, 12))
  P.add('black', rbox(0.085, 0.036, 0.27, 0.012), { p: [...fork(0.56), 0], r: [0, 0, RAKE] })
  P.add('black', rbox(0.08, 0.03, 0.26, 0.012), { p: [...fork(0.665), 0], r: [0, 0, RAKE] })
  P.add('black', rod([...fork(0.53), 0], [...fork(0.69), 0], 0.028, 0.028, 20))
  P.add('metal', rod([...fork(0.68), 0], [...fork(0.69), 0], 0.016, 0.016, 6))

  // short body-coloured front fender on a black fork brace
  P.add('paint', fender([WB, RF], RF + 0.022, 0.125, 0.006, 0.022, 0.6, 2.2))
  P.add('black', rbox(0.05, 0.014, FORK_Z * 2 + 0.02, 0.005), { p: [...fork(0.33), 0], r: [0, 0, RAKE] })

  // round LED headlamp with the signature T-shaped DRL
  const [hx, hy] = [1.205, 0.865]
  P.add('black', new THREE.CylinderGeometry(0.089, 0.07, 0.075, 48), { p: [hx - 0.015, hy, 0], r: [0, 0, -Math.PI / 2] })
  P.add('black', new THREE.TorusGeometry(0.085, 0.008, 10, 56), { p: [hx + 0.023, hy, 0], r: [0, Math.PI / 2, 0] })
  P.add('reflector', discX([hx + 0.022, hy, 0], 0.08, 0.004, 56))
  P.add('light', new THREE.BoxGeometry(0.005, 0.011, 0.13), { p: [hx + 0.026, hy + 0.036, 0] })
  P.add('light', new THREE.BoxGeometry(0.005, 0.092, 0.011), { p: [hx + 0.026, hy - 0.015, 0] })
  for (const side of [-1, 1]) {
    P.add('chrome', new THREE.TorusGeometry(0.021, 0.004, 8, 28), { p: [hx + 0.026, hy - 0.03, side * 0.038], r: [0, Math.PI / 2, 0] })
    P.add('lens', discX([hx + 0.026, hy - 0.03, side * 0.038], 0.018, 0.004, 24))
  }
  P.add('glass', discX([hx + 0.031, hy, 0], 0.081, 0.003, 56))
  for (const side of [-1, 1]) {
    P.add('black', rod([hx - 0.03, hy, side * 0.07], [fork(0.634)[0], hy - 0.02, side * FORK_Z], 0.008))
    P.add('black', rod([1.13, 0.83, side * 0.1], [1.135, 0.83, side * 0.15], 0.006))
    P.add('black', new THREE.CylinderGeometry(0.014, 0.011, 0.042, 18), { p: [1.14, 0.83, side * 0.158], r: [0, 0, -Math.PI / 2] })
    P.add('amber', discX([1.162, 0.83, side * 0.158], 0.0125, 0.004, 18))
  }
  P.add('black', rod([hx - 0.03, hy - 0.06, -0.06], [hx - 0.03, hy - 0.06, 0.06], 0.007))
}

function cockpit(P) {
  // risers and a tapered black handlebar with a 14° sweep at the grips
  for (const side of [-1, 1]) P.add('black', rod([1.07, 0.905, side * 0.035], [1.06, 0.97, side * 0.035], 0.014))
  const bar = (s) => [
    [0.945, 1.015, s * 0.39],
    [0.975, 1.005, s * 0.27],
    [1.0, 0.995, s * 0.22],
    [1.05, 0.98, s * 0.12],
    [1.06, 0.975, 0],
  ]
  P.add('black', tube([...bar(-1), ...bar(1).reverse().slice(1)], 0.012, { segments: 80 }))
  for (const side of [-1, 1]) {
    const z = (v) => side * v
    P.add('rubber', rod([0.97, 1.0067, z(0.29)], [0.945, 1.015, z(0.39)], 0.017, 0.017, 16))
    P.add('metal', rod([0.945, 1.015, z(0.39)], [0.942, 1.016, z(0.403)], 0.016, 0.016, 16))
    P.add('black', rbox(0.045, 0.035, 0.04, 0.01), { p: [0.983, 1.002, z(0.255)] })
    // lever ahead of the grip
    P.add('black', tube([[0.99, 1.0, z(0.265)], [1.006, 0.995, z(0.3)], [1.0, 0.99, z(0.36)], [0.985, 0.988, z(0.385)]], 0.005, { segments: 16 }))
    // round mirrors on curved stalks (overall height 1170 mm at the mirror tops)
    P.add('black', tube([[0.985, 1.005, z(0.24)], [0.975, 1.07, z(0.28)], [0.965, 1.12, z(0.31)]], 0.006, { segments: 16 }))
    P.add('black', new THREE.CylinderGeometry(0.045, 0.045, 0.02, 32), { p: [0.96, 1.128, z(0.315)], r: [0, 0, Math.PI / 2] })
    P.add('chrome', discX([0.948, 1.128, z(0.315)], 0.04, 0.002, 32))
  }
  P.add('black', rbox(0.04, 0.035, 0.05, 0.01), { p: [0.995, 1.025, -0.235] }) // front brake master cylinder
  // offset round digital instrument, angled toward the rider
  P.add('black', new THREE.CylinderGeometry(0.05, 0.048, 0.032, 40), { p: [1.035, 1.005, -0.075], r: [0, 0, 0.64] })
  P.add('screen', new THREE.CylinderGeometry(0.041, 0.041, 0.004, 40), { p: [1.025, 1.019, -0.075], r: [0, 0, 0.64] })
  P.add('black', rod([1.05, 0.98, -0.06], [1.065, 0.93, -0.04], 0.006))
}

// ── Engine & exhaust ─────────────────────────────────────────────────────────────────────────

function engine(P) {
  // crankcase + gearbox (side outline, rounded), sitting inside the cradle
  const crankcase = [[0.9, 0.26], [0.905, 0.33], [0.88, 0.41], [0.8, 0.44], [0.68, 0.44], [0.6, 0.46], [0.55, 0.42], [0.545, 0.33], [0.58, 0.257], [0.72, 0.24]]
  P.add('engine', profile(crankcase, 0.22, { bevel: 0.02 }))
  P.add('engine', discZ([0.68, 0.335, -0.12], 0.1, 0.035, 48)) // clutch cover (right)
  P.add('steel', ring([0.68, 0.335], 0.093, 0.103, 0.006, -0.138))
  P.add('steel', discZ([0.68, 0.335, -0.139], 0.03, 0.006, 24))
  P.add('engine', discZ([0.83, 0.33, 0.12], 0.085, 0.03, 48)) // magneto cover (left)
  P.add('steel', ring([0.83, 0.33], 0.078, 0.088, 0.006, 0.136))
  P.add('black', rbox(0.13, 0.11, 0.03, 0.02), { p: [0.6, 0.36, 0.12] }) // sprocket cover

  // forward-inclined single: dark finned barrel with machined fin edges
  const tilt = 0.27
  const base = [0.8, 0.44]
  const h = 0.22
  const at = (t) => [base[0] + Math.sin(tilt) * h * t, base[1] + Math.cos(tilt) * h * t]
  P.add('engine', rod([...base, 0], [...at(1), 0], 0.06, 0.06, 24))
  const fins = 11
  for (let i = 0; i < fins; i++) {
    const k = 1 - ((i + 0.5) / fins) * 0.1
    const [x, y] = at((i + 0.5) / fins)
    P.add('engine', rbox(0.19 * k, 0.007, 0.18 * k, 0.003, 1), { p: [x, y, 0], r: [0, 0, -tilt] })
    P.add('metal', finRing(0.197 * k, 0.187 * k, 0.012, 0.006, 0.0076), { p: [x, y, 0], r: [0, 0, -tilt] })
  }
  const [hx, hy] = at(1.08)
  P.add('engine', rbox(0.2, 0.08, 0.2, 0.025), { p: [hx, hy, 0], r: [0, 0, -tilt] })
  for (const t of [1.02, 1.14]) {
    const [x, y] = at(t)
    P.add('metal', finRing(0.207, 0.207, 0.022, 0.006, 0.0076), { p: [x, y, 0], r: [0, 0, -tilt] })
  }
  P.add('engine', rbox(0.15, 0.04, 0.15, 0.015), { p: [hx - 0.012, hy + 0.05, 0], r: [0, 0, -tilt] })

  // oil cooler on the front down-tubes, with hoses tucked inboard
  const cooler = [1.06, 0.6]
  const ct = 0.19
  P.add('black', rbox(0.035, 0.12, 0.2, 0.01), { p: [...cooler, 0], r: [0, 0, ct] })
  for (let i = 0; i < 6; i++) {
    const o = -0.045 + i * 0.018
    P.add('metal', rbox(0.037, 0.005, 0.185, 0.002, 1), { p: [cooler[0] - Math.sin(ct) * o, cooler[1] + Math.cos(ct) * o, 0], r: [0, 0, ct] })
  }
  for (const s of [-1, 1]) P.add('rubber', tube([[1.05, 0.55, s * 0.035], [0.98, 0.47, s * 0.035], [0.9, 0.42, s * 0.04]], 0.009, { segments: 16 }))

  // intake: throttle body and airbox behind the cylinder head
  P.add('black', rod([0.68, 0.62, 0], [0.775, 0.685, 0], 0.022))
  P.add('black', rod([0.59, 0.585, 0], [0.69, 0.625, 0], 0.031, 0.031, 20))
  P.add('black', rbox(0.16, 0.13, 0.2, 0.03), { p: [0.5, 0.645, 0] })
  return [hx + 0.08, hy - 0.025]
}

function exhaust(P, port) {
  // black header: down the front, outboard of the right down-tube, then under the engine
  P.add('black', tube([[port[0], port[1], -0.03], [0.975, 0.56, -0.08], [1.0, 0.45, -0.105], [0.975, 0.31, -0.115], [0.9, 0.225, -0.125], [0.76, 0.205, -0.145], [0.6, 0.218, -0.172]], 0.021, { segments: 72 }))
  // short, stubby muffler angled up toward the rear
  const a = [0.62, 0.214, -0.178]
  const b = [0.28, 0.31, -0.178]
  const dir = new THREE.Vector2(b[0] - a[0], b[1] - a[1]).normalize()
  const along = (p, d) => [p[0] + dir.x * d, p[1] + dir.y * d, p[2]]
  P.add('black', rod(along(a, -0.045), a, 0.024, 0.047, 32))
  P.add('black', rod(a, b, 0.048, 0.058, 32))
  P.add('steel', rod(b, along(b, 0.015), 0.058, 0.055, 32))
  P.add('chrome', rod(along(b, 0.015), along(b, 0.036), 0.02, 0.02, 20))
  // curved brushed heat shield on the outer face
  const shield = new THREE.CylinderGeometry(0.0575, 0.0535, 0.15, 24, 1, false, Math.PI - 0.75, 1.5)
  shield.rotateZ(Math.atan2(-dir.x, dir.y))
  shield.translate(...along(a, 0.19))
  P.add('metal', shield)
  P.add('black', taperBar([0.34, 0.33], [0.25, 0.47], 0.03, 0.022, 0.012, -0.15))
}

// ── Chassis ──────────────────────────────────────────────────────────────────────────────────

function chassis(P) {
  // split double-cradle frame
  P.add('black', tube([[1.075, 0.885, 0], [0.98, 0.835, 0], [0.75, 0.795, 0], [0.5, 0.745, 0]], 0.022))
  for (const s of [-1, 1]) {
    P.add('black', tube([[0.52, 0.74, s * 0.07], [0.3, 0.737, s * 0.082], [0.12, 0.737, s * 0.07], [0.06, 0.733, s * 0.055]], 0.012))
    P.add('black', tube([[1.085, 0.84, s * 0.03], [1.04, 0.66, s * 0.055], [1.0, 0.45, s * 0.062], [0.93, 0.27, s * 0.065], [0.8, 0.205, s * 0.065], [0.6, 0.205, s * 0.065], [0.505, 0.27, s * 0.07], [0.48, 0.42, s * 0.075], [0.47, 0.6, s * 0.075], [0.5, 0.735, s * 0.07]], 0.0155, { segments: 96 }))
    P.add('black', tube([[0.475, 0.45, s * 0.075], [0.3, 0.6, s * 0.08], [0.16, 0.735, s * 0.078]], 0.011))
  }
  P.add('metal', discZ([0.475, 0.37, 0], 0.016, ARM_Z * 2 + 0.03, 12))

  // box-section swingarm with cross-brace and chain adjusters
  for (const s of [-1, 1]) {
    P.add('black', taperBar([0.475, 0.37], [0, RR], 0.052, 0.036, 0.03, s * ARM_Z))
    P.add('metal', rbox(0.03, 0.02, 0.012, 0.004), { p: [0.02, RR, s * (ARM_Z + 0.017)] })
  }
  P.add('black', rod([0.36, 0.36, -ARM_Z], [0.36, 0.36, ARM_Z], 0.014))

  // chain drive on the left
  P.add('metal', ring([0, RR], 0.06, 0.1, 0.005, 0.075))
  P.add('black', discZ([0.585, 0.35, 0.075], 0.04, 0.012, 24))
  P.add('black', rod([0.585, 0.39, 0.075], [0, RR + 0.1, 0.075], 0.006, 0.006, 6))
  P.add('black', rod([0.585, 0.31, 0.075], [0, RR - 0.1, 0.075], 0.006, 0.006, 6))
  P.add('black', taperBar([0.5, 0.425], [0.1, RR + 0.123], 0.022, 0.016, 0.03, 0.075))

  // monoshock from the swingarm brace up under the seat
  const lower = [0.36, 0.39, 0]
  const upper = [0.385, 0.66, 0]
  const on = (t) => [lower[0] + (upper[0] - lower[0]) * t, lower[1] + (upper[1] - lower[1]) * t, 0]
  P.add('chrome', rod(lower, upper, 0.011))
  P.add('black', rod(on(0.55), upper, 0.019))
  P.add('black', spring(on(0.12), on(0.62), 0.029, 0.0052, 8))

  // footpeg hangers, pegs, pedals and side stand
  for (const s of [-1, 1]) {
    P.add('black', taperBar([0.53, 0.46], [0.47, 0.35], 0.034, 0.026, 0.012, s * 0.15))
    P.add('rubber', rod([0.47, 0.35, s * 0.15], [0.47, 0.35, s * 0.215], 0.013, 0.013, 14))
    P.add('black', taperBar([0.3, 0.6], [0.215, 0.405], 0.028, 0.02, 0.01, s * 0.13))
    P.add('rubber', rod([0.215, 0.405, s * 0.13], [0.215, 0.405, s * 0.19], 0.011, 0.011, 12))
  }
  P.add('black', rod([0.48, 0.345, -0.17], [0.6, 0.32, -0.18], 0.007)) // rear brake pedal
  P.add('black', rod([0.48, 0.355, 0.165], [0.6, 0.345, 0.17], 0.007)) // gear lever
  P.add('black', rod([0.52, 0.255, 0.1], [0.33, 0.25, 0.14], 0.009)) // side stand (folded)

  // side panels below the seat
  P.add('paint2', profile([[0.36, 0.738], [0.58, 0.784], [0.595, 0.71], [0.55, 0.645], [0.45, 0.62], [0.38, 0.65]], 0.235, { bevel: 0.012, smooth: false }))
}

function rear(P) {
  // flat one-piece brat seat over a slim black tail cowl; its rounded tip is the LED tail lamp
  P.add('seat', loftShape(SEAT, seatShape, 40, 64))
  P.add('tail', loftShape(TAIL, tailShape, 10, 48, 0, 0.09))
  P.add('black', loftShape(TAIL, tailShape, 20, 48, 0.09, 1))

  // long, tapering tail tidy sweeping down to the number plate, with the indicators
  const tidy = (u) => {
    const yc = 0.688 - 0.1 * u - 0.012 * u * u
    const h = 0.026 - 0.01 * u
    return { yc, hTop: h, hBot: h, hw: 0.062 - 0.026 * u, nTop: 3, nBot: 3 }
  }
  P.add('black', loftShape({ x0: 0.08, x1: -0.345 }, tidy, 24, 32))
  P.add('black', rbox(0.008, 0.115, 0.195, 0.004), { p: [-0.37, 0.535, 0], r: [0, 0, -0.3] })
  P.add('plate', rbox(0.004, 0.1, 0.18, 0.0015), { p: [-0.376, 0.535, 0], r: [0, 0, -0.3] })
  for (const side of [-1, 1]) {
    P.add('black', rod([-0.17, 0.635, side * 0.04], [-0.172, 0.635, side * 0.14], 0.006))
    P.add('black', new THREE.CylinderGeometry(0.014, 0.011, 0.042, 18), { p: [-0.18, 0.635, side * 0.148], r: [0, 0, Math.PI / 2] })
    P.add('amber', discX([-0.202, 0.635, side * 0.148], 0.0125, 0.004, 18))
  }
  // swingarm-mounted hugger on two brackets
  P.add('black', fender([0, RR], RR + 0.014, 0.17, 0.006, 0.02, 0.45, 2.0))
  for (const s of [-1, 1]) P.add('black', taperBar([0.24, 0.345], [0.29, 0.45], 0.026, 0.02, 0.008, s * 0.089))
}

export function buildRonin() {
  const P = new Parts()
  wheel(P, { x: 0, y: RR, r: RR, width: 0.13, discR: 0.12, discSide: -1, caliperAngle: -0.55 })
  wheel(P, { x: WB, y: RF, r: RF, width: 0.11, discR: 0.15, discSide: 1, caliperAngle: 2.4 })
  frontEnd(P)
  cockpit(P)
  tank(P)
  exhaust(P, engine(P))
  chassis(P)
  rear(P)
  return P.build()
}
