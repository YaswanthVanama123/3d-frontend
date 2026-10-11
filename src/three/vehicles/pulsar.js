import * as THREE from 'three'
import {
  Parts,
  discX,
  discZ,
  easedSamples,
  endRound,
  fender,
  finRing,
  loftShape,
  loftX,
  profile,
  rbox,
  ring,
  rod,
  sectionRing,
  smooth01,
  splitLoft,
  spring,
  taperBar,
  tube,
} from './parts.js'
import { alloyWheel, brakeDisc, tyre } from './wheels.js'

// Detailed Bajaj Pulsar NS160 and N160 (2024), built to Bajaj's published key dimensions:
//   NS160: wheelbase 1372 mm · L × W × H 2012 × 803 × 1060 mm · seat 805 mm · ground clearance 176 mm · 12 L tank
//   N160:  wheelbase 1358 mm · L × W × H ≈ 2016 × 791 × 1080 mm · seat 795 mm · ground clearance 165 mm · 14 L tank
//   both:  100/80-17 front & 130/70-17 rear tyres · 300 / 230 mm petal discs · 33 mm gold USD fork · oil-cooled single
// The NS160 has a perimeter frame, silver swingarm and underbelly exhaust; the N160 a cradle frame and side exhaust.
// Metres; rear axle at x = 0, front axle at x = wheelbase, ground at y = 0, +Z = rider's left.

const RF = 0.296 // 17" rim + 100/80 → Ø592 mm
const RR = 0.307 // 17" rim + 130/70 → Ø614 mm
const RAKE = (25 * Math.PI) / 180
const FORK_Z = 0.08
const ARM_Z = 0.1
const lerp = (a, b, t) => a + (b - a) * t

const SPECS = {
  ns160: {
    wb: 1.372,
    spokes: 'split5',
    armRole: 'metal',
    hangerRole: 'metal',
    springRole: 'gold',
    pivot: [0.535, 0.4],
    shockTop: 0.66,
    lamp: {
      at: [1.205, 0.845],
      depth: 0.11,
      outline: [[0, 0.07], [0.06, 0.065], [0.095, 0.03], [0.088, -0.02], [0.05, -0.065], [0, -0.08]],
      projector: [-0.012, 0.023],
      drl: [[0.042, 0.05], [0.074, 0.022], [0.062, 0.012], [0.082, -0.026]], // "thunderbolt" either side
      visor: [0.08, 0.15, 0.09],
    },
    bar: { center: [1.075, 0.935], grip: [0.985, 0.968], gripZ: 0.39 },
    mirror: [0.99, 1.035, 0.33],
    dash: [1.12, 0.945],
    tank: { x0: 0.6, x1: 1.05, top: 0.85, rise: 0.12, bottom: 0.795, hw: 0.105, swell: 0.06, cut: 0.35 },
    shroud: {
      z: 0.158,
      body: [[0.8, 0.905], [1.04, 0.935], [1.115, 0.875], [1.1, 0.74], [1.02, 0.6], [0.94, 0.66], [0.86, 0.78]],
      accent: [[0.9, 0.72], [1.098, 0.77], [1.1, 0.74], [1.02, 0.6], [0.94, 0.66]],
    },
    engine: {
      crankcase: [[0.92, 0.29], [0.925, 0.36], [0.89, 0.43], [0.82, 0.46], [0.7, 0.46], [0.62, 0.47], [0.575, 0.43], [0.57, 0.33], [0.61, 0.265], [0.75, 0.25]],
      clutch: [0.7, 0.35, 0.095],
      magneto: [0.84, 0.35, 0.08],
      sprocket: [0.62, 0.375],
      base: [0.82, 0.46],
      tilt: 0.42,
      height: 0.17,
      fins: 8,
      fin: [0.17, 0.16],
      cooler: [1.06, 0.6, 0.25],
      intake: [[0.69, 0.65], [0.82, 0.67]],
      airbox: [0.55, 0.68],
    },
    pegs: { hanger: [0.56, 0.48], rider: [0.48, 0.39], pillionHanger: [0.35, 0.63], pillion: [0.27, 0.47] },
    seat: { rider: [0.32, 0.665, 0.802], pillion: [0.04, 0.33, 0.878] },
    tail: { x0: -0.17, x1: 0.6, pillionTop: 0.845, riderTop: 0.77, step: [0.28, 0.36], tipBottom: 0.8, bottom: 0.67 },
    tailLamp: 'split',
    rails: [[0.06, 0.835, 0.105], [0.14, 0.868, 0.113], [0.27, 0.862, 0.118], [0.315, 0.825, 0.118]],
    tidy: { x0: 0.05, x1: -0.31, y0: 0.75, y1: 0.62 },
    plate: [-0.33, 0.58],
  },
  n160: {
    wb: 1.358,
    spokes: 'twin6',
    armRole: 'black',
    hangerRole: 'black',
    springRole: 'black',
    pivot: [0.52, 0.39],
    shockTop: 0.65,
    lamp: {
      at: [1.19, 0.86],
      depth: 0.12,
      outline: [[0, 0.074], [0.072, 0.07], [0.1, 0.034], [0.086, -0.03], [0.04, -0.068], [0, -0.07]],
      projector: [-0.015, 0.026],
      drl: [[0.03, 0.03], [0.062, 0.047], [0.087, 0.035], [0.085, 0.004]], // "wolf-eye" brows over the projector
      visor: [0.075, 0.15, 0.095],
    },
    bar: { center: [1.06, 0.955], grip: [0.972, 0.985], gripZ: 0.384 },
    mirror: [0.975, 1.052, 0.32],
    dash: [1.105, 0.96],
    tank: { x0: 0.58, x1: 1.04, top: 0.855, rise: 0.13, bottom: 0.79, hw: 0.11, swell: 0.065, cut: 0.3 },
    shroud: {
      z: 0.17,
      body: [[0.78, 0.915], [1.03, 0.95], [1.13, 0.885], [1.13, 0.77], [1.06, 0.655], [0.95, 0.66], [0.84, 0.8]],
      accent: [[0.88, 0.74], [1.12, 0.79], [1.13, 0.77], [1.06, 0.655], [0.95, 0.66]],
    },
    engine: {
      crankcase: [[0.91, 0.28], [0.915, 0.35], [0.885, 0.42], [0.81, 0.45], [0.69, 0.45], [0.62, 0.465], [0.585, 0.425], [0.58, 0.33], [0.615, 0.26], [0.74, 0.245]],
      clutch: [0.69, 0.345, 0.098],
      magneto: [0.83, 0.34, 0.082],
      sprocket: [0.615, 0.37],
      base: [0.81, 0.45],
      tilt: 0.3,
      height: 0.19,
      fins: 9,
      fin: [0.18, 0.17],
      cooler: [1.05, 0.6, 0.22],
      intake: [[0.67, 0.655], [0.79, 0.675]],
      airbox: [0.53, 0.67],
    },
    pegs: { hanger: [0.55, 0.47], rider: [0.47, 0.38], pillionHanger: [0.34, 0.62], pillion: [0.26, 0.46] },
    seat: { rider: [0.33, 0.655, 0.795], pillion: [0.06, 0.34, 0.868] },
    tail: { x0: -0.15, x1: 0.58, pillionTop: 0.84, riderTop: 0.765, step: [0.29, 0.37], tipBottom: 0.79, bottom: 0.665 },
    tailLamp: 'single',
    rails: [[0.08, 0.83, 0.1], [0.16, 0.86, 0.11], [0.28, 0.855, 0.115], [0.325, 0.82, 0.115]],
    tidy: { x0: 0.06, x1: -0.33, y0: 0.74, y1: 0.61 },
    plate: [-0.345, 0.57],
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────

/** Front-view outline ([z, y] about a centre) extruded `depth` backward from a face at x. */
function frontShape(points, depth, [x, y, z = 0], bevel = 0.005) {
  const shape = new THREE.Shape(points.map(([pz, py]) => new THREE.Vector2(pz, py)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0005, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2 })
  g.rotateY(-Math.PI / 2)
  g.translate(x - bevel, y, z)
  return g
}

/** Closes a half outline (top centre → +Z side → bottom centre) into a symmetric one. */
const symmetric = (half) => [...half, ...half.slice(1, -1).reverse().map(([z, y]) => [-z, y])]
const scaled = (points, k) => points.map(([z, y]) => [z * k, y * k])

/** Sharp-cornered strip (an LED light guide) through 3D points. */
function strip(P, role, points, r) {
  points.forEach((p, i) => {
    if (i) P.add(role, rod(points[i - 1], p, r, r, 8))
    P.add(role, new THREE.SphereGeometry(r, 8, 6), { p })
  })
}

/**
 * Faceted side panel from a side-view outline at ±z: the top leans in toward the tank and the front toes in
 * toward the headlamp. `ref` is the outline whose extents set the fold, so layered panels stay flush.
 */
function sidePanel(P, role, points, z, side, { thickness = 0.016, lean = 0.12, toe = 0.03, ref = points } = {}) {
  const g = profile(points, thickness, { bevel: 0.005, smooth: false })
  const xs = ref.map((p) => p[0])
  const ys = ref.map((p) => p[1])
  const [x0, x1, yMid] = [Math.min(...xs), Math.max(...xs), (Math.min(...ys) + Math.max(...ys)) / 2]
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = Math.max(0, (pos.getX(i) - x0) / (x1 - x0))
    pos.setZ(i, side * (z - lean * (pos.getY(i) - yMid) - toe * u * u) + pos.getZ(i))
  }
  g.computeVertexNormals()
  P.add(role, g)
}

// ── Wheels, fork & front ─────────────────────────────────────────────────────────────────────

function wheels(P, S) {
  tyre(P, { x: 0, y: RR, r: RR, width: 0.13 })
  alloyWheel(P, { x: 0, y: RR, width: 0.13, spokes: S.spokes })
  brakeDisc(P, { x: 0, y: RR, r: 0.115, z: -0.077, side: -1, caliperAngle: -0.55, style: 'petal' }) // 230 mm
  tyre(P, { x: S.wb, y: RF, r: RF, width: 0.1 })
  alloyWheel(P, { x: S.wb, y: RF, width: 0.1, spokes: S.spokes })
  brakeDisc(P, { x: S.wb, y: RF, r: 0.15, z: 0.052, side: 1, caliperAngle: 2.4, style: 'petal' }) // 300 mm
}

function frontEnd(P, S) {
  // 33 mm upside-down fork: gold outer tubes, chrome stanchions, black axle lugs
  const f = S.fork
  for (const side of [-1, 1]) {
    const z = side * FORK_Z
    P.add('gold', rod([...f(0.33), z], [...f(0.665), z], 0.023, 0.023, 24))
    P.add('black', rod([...f(0.32), z], [...f(0.34), z], 0.0245, 0.0245, 24))
    P.add('chrome', rod([...f(0.06), z], [...f(0.38), z], 0.0165, 0.0165, 20))
    P.add('black', rbox(0.05, 0.09, 0.04, 0.012), { p: [...f(0.035), z], r: [0, 0, RAKE] })
    P.add('gold', rod([...f(0.665), z], [...f(0.677), z], 0.018, 0.018, 20))
  }
  P.add('metal', discZ([S.wb, RF, 0], 0.011, FORK_Z * 2 + 0.045, 12))
  P.add('black', rbox(0.075, 0.032, 0.22, 0.01), { p: [...f(0.55), 0], r: [0, 0, RAKE] })
  P.add('black', rbox(0.072, 0.026, 0.21, 0.01), { p: [...f(0.645), 0], r: [0, 0, RAKE] })
  P.add('black', rod([...f(0.52), 0], [...f(0.67), 0], 0.026, 0.026, 20))
  // body-coloured front fender on a fork brace
  P.add('paint', fender([S.wb, RF], RF + 0.018, 0.112, 0.005, 0.02, 0.5, 2.25))
  P.add('black', rbox(0.045, 0.012, FORK_Z * 2 + 0.02, 0.004), { p: [...f(0.31), 0], r: [0, 0, RAKE] })
}

function headlamp(P, S) {
  // compact LED projector unit: dark reflector, signature DRLs, clear lens and a small smoked visor
  const L = S.lamp
  const [hx, hy] = L.at
  const face = hx + 0.03
  const outline = symmetric(L.outline)
  P.add('black', frontShape(outline, L.depth, [face, hy]))
  P.add('reflector', frontShape(scaled(outline, 0.86), 0.004, [face + 0.004, hy], 0))
  const [py, pr] = L.projector
  P.add('chrome', new THREE.TorusGeometry(pr + 0.003, 0.004, 8, 32), { p: [face + 0.006, hy + py, 0], r: [0, Math.PI / 2, 0] })
  P.add('lens', discX([face + 0.006, hy + py, 0], pr, 0.004, 28))
  for (const s of [-1, 1]) strip(P, 'light', L.drl.map(([z, y]) => [face + 0.007, hy + y, s * z]), 0.0042)
  P.add('glass', frontShape(scaled(outline, 0.93), 0.003, [face + 0.016, hy], 0))
  const [vl, vw, vy] = L.visor
  P.add('black', rbox(vl, 0.004, vw, 0.0015), { p: [hx + 0.005, hy + vy, 0], r: [0, 0, -0.97] })
  // brackets to the fork, indicators on short stalks
  const rear = face - L.depth
  for (const s of [-1, 1]) {
    P.add('black', rod([rear + 0.012, hy, s * 0.05], [S.forkAtY(hy), hy, s * FORK_Z], 0.008))
    const iy = hy - 0.04
    P.add('black', rod([rear + 0.02, iy, s * 0.06], [rear + 0.025, iy, s * 0.13], 0.005))
    P.add('black', new THREE.CylinderGeometry(0.012, 0.01, 0.036, 16), { p: [rear + 0.03, iy, s * 0.137], r: [0, 0, -Math.PI / 2] })
    P.add('amber', discX([rear + 0.049, iy, s * 0.137], 0.011, 0.004, 16))
  }
}

function cockpit(P, S) {
  // flat one-piece handlebar on short risers
  const [cx, cy] = S.bar.center
  const [gx, gy] = S.bar.grip
  const gz = S.bar.gripZ
  const top = S.fork(0.645)
  for (const s of [-1, 1]) P.add('black', rod([top[0] - 0.005, top[1] + 0.01, s * 0.03], [cx + 0.005, cy - 0.005, s * 0.03], 0.013))
  const bar = (s) => [[gx, gy, s * gz], [gx + 0.025, gy - 0.008, s * (gz - 0.11)], [cx - 0.035, cy + 0.015, s * 0.18], [cx - 0.005, cy + 0.003, s * 0.08], [cx, cy, 0]]
  P.add('black', tube([...bar(-1), ...bar(1).reverse().slice(1)], 0.0115, { segments: 80 }))
  const [mx, my, mz] = S.mirror
  for (const s of [-1, 1]) {
    const z = (v) => s * v
    const on = (t) => [gx + 0.025 * t, gy - 0.008 * t] // along the grip section, t = 0 at the bar end
    P.add('rubber', rod([...on(0.9), z(gz - 0.1)], [gx, gy, z(gz)], 0.016, 0.016, 16))
    P.add('metal', rod([gx, gy, z(gz)], [gx - 0.002, gy + 0.001, z(gz + 0.011)], 0.015, 0.015, 16))
    P.add('black', rbox(0.042, 0.032, 0.036, 0.009), { p: [...on(1.1), z(gz - 0.125)] })
    P.add('black', tube([[gx + 0.032, gy - 0.01, z(gz - 0.115)], [gx + 0.05, gy - 0.016, z(gz - 0.08)], [gx + 0.042, gy - 0.02, z(gz - 0.02)], [gx + 0.028, gy - 0.022, z(gz + 0.003)]], 0.005, { segments: 16 }))
    // angular mirrors on short stalks
    P.add('black', tube([[gx + 0.03, gy - 0.004, z(gz - 0.14)], [mx + 0.015, my - 0.05, z(mz - 0.05)], [mx + 0.005, my - 0.012, z(mz - 0.02)]], 0.0055, { segments: 16 }))
    const shell = [[-0.055, 0.01], [-0.035, 0.028], [0.045, 0.024], [0.062, -0.004], [0.04, -0.024], [-0.045, -0.018]].map(([pz, py]) => [s * pz, py])
    P.add('black', frontShape(shell, 0.02, [mx + 0.01, my, z(mz)], 0.004))
    P.add('chrome', frontShape(scaled(shell, 0.84), 0.002, [mx - 0.0095, my, z(mz)], 0))
  }
  P.add('black', rbox(0.04, 0.034, 0.05, 0.01), { p: [gx + 0.03, gy + 0.02, -(gz - 0.155)] }) // front brake master cylinder
  // rectangular digital console, angled toward the rider
  const [dx, dy] = S.dash
  P.add('black', rbox(0.032, 0.075, 0.13, 0.008), { p: [dx, dy, 0], r: [0, 0, -0.93] })
  P.add('screen', rbox(0.004, 0.06, 0.112, 0.0015), { p: [dx - 0.0102, dy + 0.0136, 0], r: [0, 0, -0.93] })
  P.add('black', rod([dx + 0.01, dy - 0.03, 0], [top[0], top[1] + 0.01, 0], 0.007))
}

// ── Tank & shrouds ───────────────────────────────────────────────────────────────────────────

function tankShape(T) {
  return (u) => {
    const top = T.top + T.rise * Math.sin(Math.min(1, u / 0.72) * (Math.PI / 2)) - 0.025 * smooth01(0.86, 1, u)
    const bottom = T.bottom - 0.02 * smooth01(0.5, 1, u)
    const hw = T.hw + T.swell * Math.sin((Math.PI / 2) * Math.min(1, u / 0.62)) - 0.04 * smooth01(0.8, 1, u)
    const yc = bottom + 0.45 * (top - bottom)
    const e = endRound(u, 0.09, 0.1)
    const s = { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: hw * e, nTop: 2.4, nBot: 3.4 }
    s.cut = yc + (bottom + T.cut * (top - bottom) - yc) * e
    return s
  }
}

function tank(P, S) {
  const T = S.tank
  const shape = tankShape(T)
  const { upper, lower } = splitLoft(T, shape, 44)
  P.add('paint', upper)
  P.add('paint2', lower)
  // flush fuel cap, tilted to the slope of the crown
  const crown = (u) => {
    const s = shape(u)
    return s.yc + s.hTop
  }
  const uc = 0.62
  const x = lerp(T.x0, T.x1, uc)
  const tilt = Math.atan((crown(uc + 0.01) - crown(uc - 0.01)) / ((T.x1 - T.x0) * 0.02))
  P.add('steel', new THREE.CylinderGeometry(0.032, 0.032, 0.008, 28), { p: [x, crown(uc) - 0.002, 0], r: [0, 0, tilt] })
  P.add('black', new THREE.CylinderGeometry(0.024, 0.024, 0.01, 28), { p: [x, crown(uc) - 0.001, 0], r: [0, 0, tilt] })
  // angular tank shrouds with a contrasting lower tip
  for (const side of [-1, 1]) {
    sidePanel(P, 'paint', S.shroud.body, S.shroud.z, side)
    sidePanel(P, 'paint2', S.shroud.accent, S.shroud.z + 0.004, side, { thickness: 0.012, ref: S.shroud.body })
  }
}

// ── Engine & exhausts ────────────────────────────────────────────────────────────────────────

/** Oil-cooled single: crankcase and covers, finned barrel with machined fin edges, oil cooler, intake. Returns the exhaust port. */
function engine(P, E) {
  P.add('engine', profile(E.crankcase, 0.22, { bevel: 0.02 }))
  const [cx, cy, cr] = E.clutch
  P.add('engine', discZ([cx, cy, -0.12], cr, 0.035, 48)) // clutch cover (right)
  P.add('steel', ring([cx, cy], cr - 0.007, cr + 0.003, 0.006, -0.138))
  P.add('steel', discZ([cx, cy, -0.139], 0.028, 0.006, 24))
  const [mx, my, mr] = E.magneto
  P.add('engine', discZ([mx, my, 0.12], mr, 0.03, 48)) // magneto cover (left)
  P.add('steel', ring([mx, my], mr - 0.007, mr + 0.003, 0.006, 0.136))
  P.add('black', rbox(0.13, 0.11, 0.03, 0.02), { p: [...E.sprocket, 0.12] }) // sprocket cover

  const up = [Math.sin(E.tilt), Math.cos(E.tilt)]
  const fwd = [Math.cos(E.tilt), -Math.sin(E.tilt)]
  const at = (t) => [E.base[0] + up[0] * E.height * t, E.base[1] + up[1] * E.height * t]
  P.add('engine', rod([...E.base, 0], [...at(1), 0], 0.055, 0.055, 24))
  const [fw, fd] = E.fin
  for (let i = 0; i < E.fins; i++) {
    const k = 1 - ((i + 0.5) / E.fins) * 0.1
    const [x, y] = at((i + 0.5) / E.fins)
    P.add('engine', rbox(fw * k, 0.007, fd * k, 0.003, 1), { p: [x, y, 0], r: [0, 0, -E.tilt] })
    P.add('metal', finRing(fw * k + 0.007, fd * k + 0.007, 0.012, 0.006, 0.0076), { p: [x, y, 0], r: [0, 0, -E.tilt] })
  }
  const [hx, hy] = at(1.1)
  P.add('engine', rbox(fw + 0.01, 0.07, fd + 0.01, 0.022), { p: [hx, hy, 0], r: [0, 0, -E.tilt] })
  P.add('engine', rbox(fw - 0.04, 0.035, fd - 0.04, 0.012), { p: [hx + up[0] * 0.045, hy + up[1] * 0.045, 0], r: [0, 0, -E.tilt] })

  // oil cooler ahead of the engine, hoses tucked inboard
  const [ox, oy, ot] = E.cooler
  P.add('black', rbox(0.03, 0.1, 0.17, 0.008), { p: [ox, oy, 0], r: [0, 0, ot] })
  for (let i = 0; i < 5; i++) {
    const o = -0.036 + i * 0.018
    P.add('metal', rbox(0.032, 0.005, 0.158, 0.002, 1), { p: [ox - Math.sin(ot) * o, oy + Math.cos(ot) * o, 0], r: [0, 0, ot] })
  }
  for (const s of [-1, 1]) {
    P.add('rubber', tube([[ox - 0.01, oy - 0.05, s * 0.03], [ox - 0.08, oy - 0.13, s * 0.032], [ox - 0.15, oy - 0.18, s * 0.036]], 0.008, { segments: 16 }))
    P.add('black', rod([ox, oy + 0.05, s * 0.06], [ox + 0.04, oy + 0.19, s * 0.06], 0.006)) // cooler bracket
  }
  // intake: throttle body into the airbox under the seat
  P.add('black', rod([...E.intake[0], 0], [...E.intake[1], 0], 0.024, 0.024, 16))
  P.add('black', rbox(0.16, 0.12, 0.18, 0.03), { p: [...E.airbox, 0] })
  return [hx + fwd[0] * (fw / 2 - 0.01), hy + fwd[1] * (fw / 2 - 0.01)]
}

function underbellyExhaust(P, port) {
  // NS160: header down the front of the engine into a box muffler under it, twin outlets on the right
  P.add('black', tube([[port[0], port[1], -0.03], [0.995, 0.52, -0.07], [0.99, 0.36, -0.075], [0.935, 0.26, -0.06], [0.77, 0.225, -0.03]], 0.02, { segments: 64 }))
  P.add('black', rbox(0.3, 0.09, 0.2, 0.03), { p: [0.64, 0.221, 0] })
  P.add('steel', rbox(0.05, 0.075, 0.03, 0.01), { p: [0.505, 0.222, -0.092] })
  for (const y of [0.205, 0.238]) P.add('chrome', rod([0.505, y, -0.1], [0.47, y, -0.118], 0.011, 0.011, 16))
  // belly pan over the header bend
  P.add('paint2', profile([[0.98, 0.35], [0.97, 0.25], [0.9, 0.185], [0.77, 0.178], [0.75, 0.235], [0.86, 0.29]], 0.22, { bevel: 0.016 }))
}

function sideExhaust(P, port) {
  // N160: header under the engine to a short, squared-off muffler on the right, rising toward the rear
  P.add('black', tube([[port[0], port[1], -0.03], [0.975, 0.55, -0.08], [1.005, 0.44, -0.105], [0.975, 0.3, -0.115], [0.89, 0.22, -0.125], [0.75, 0.205, -0.145], [0.61, 0.222, -0.172]], 0.02, { segments: 72 }))
  const zc = -0.175
  const body = (u) => ({ yc: 0.225 + 0.1 * u, hTop: 0.05, hBot: 0.05, hw: 0.046, nTop: 3.2, nBot: 3.2 })
  const section = (x, s) => ({ x, points: sectionRing(s, 40).map(([y, z]) => [y, z + zc]) })
  P.add('black', loftX(easedSamples(12).map((k) => section(lerp(0.63, 0.4, k), body(k)))))
  const end = body(1)
  P.add('steel', loftX([section(0.402, { ...end, hTop: 0.053, hBot: 0.053, hw: 0.049 }), section(0.38, end)]))
  P.add('chrome', rod([0.385, end.yc - 0.012, zc], [0.362, end.yc - 0.008, zc], 0.016, 0.016, 16))
  P.add('engine', profile([[0.58, 0.21], [0.44, 0.27], [0.44, 0.33], [0.58, 0.27]], 0.008, { bevel: 0.002, z: zc - 0.048, smooth: false })) // heat shield
  P.add('black', taperBar([0.46, 0.35], [0.3, 0.5], 0.03, 0.022, 0.012, -0.15)) // hanger to the pillion peg mount
  // small belly pan under the engine
  P.add('black', profile([[0.97, 0.33], [0.955, 0.22], [0.87, 0.165], [0.74, 0.17], [0.73, 0.24], [0.86, 0.285]], 0.2, { bevel: 0.018 }))
}

// ── Frames, rear suspension & controls ───────────────────────────────────────────────────────

function perimeterFrame(P) {
  for (const s of [-1, 1]) {
    // beams from the steering head around the engine to the swingarm pivot, with engine hangers
    P.add('black', tube([[1.095, 0.845, s * 0.04], [1.02, 0.8, s * 0.095], [0.88, 0.74, s * 0.118], [0.72, 0.68, s * 0.118], [0.61, 0.6, s * 0.11], [0.55, 0.5, s * 0.102], [0.535, 0.42, s * 0.1]], 0.019, { segments: 72 }))
    P.add('black', taperBar([0.9, 0.735], [0.9, 0.66], 0.04, 0.03, 0.01, s * 0.105))
    P.add('black', taperBar([0.6, 0.59], [0.6, 0.45], 0.045, 0.035, 0.012, s * 0.1))
    // subframe
    P.add('black', tube([[0.63, 0.66, s * 0.1], [0.4, 0.745, s * 0.085], [0.15, 0.805, s * 0.07], [0.0, 0.83, s * 0.055]], 0.012))
    P.add('black', tube([[0.55, 0.5, s * 0.1], [0.36, 0.64, s * 0.09], [0.16, 0.775, s * 0.075]], 0.011))
  }
}

function cradleFrame(P) {
  P.add('black', tube([[1.075, 0.87, 0], [0.98, 0.83, 0], [0.78, 0.79, 0], [0.6, 0.75, 0]], 0.021)) // spine under the tank
  for (const s of [-1, 1]) {
    P.add('black', tube([[1.085, 0.83, s * 0.03], [1.04, 0.62, s * 0.045], [0.995, 0.42, s * 0.05], [0.93, 0.26, s * 0.055], [0.8, 0.2, s * 0.055], [0.62, 0.2, s * 0.06], [0.545, 0.26, s * 0.065], [0.525, 0.4, s * 0.07], [0.535, 0.6, s * 0.07], [0.6, 0.745, s * 0.06]], 0.0155, { segments: 96 }))
    P.add('black', tube([[0.6, 0.745, s * 0.07], [0.4, 0.75, s * 0.08], [0.15, 0.8, s * 0.07], [0.0, 0.825, s * 0.055]], 0.012))
    P.add('black', tube([[0.53, 0.47, s * 0.075], [0.35, 0.63, s * 0.085], [0.16, 0.77, s * 0.075]], 0.011))
  }
}

function rearEnd(P, S) {
  // box-section swingarm with brace and chain adjusters
  const [px, py] = S.pivot
  P.add('metal', discZ([px, py, 0], 0.016, ARM_Z * 2 + 0.03, 12))
  for (const s of [-1, 1]) {
    P.add(S.armRole, taperBar([px, py], [0, RR], 0.06, 0.04, 0.035, s * ARM_Z))
    P.add('steel', rbox(0.03, 0.02, 0.012, 0.004), { p: [0.02, RR, s * (ARM_Z + 0.019)] })
  }
  const armY = (x) => lerp(RR, py, x / px)
  const bx = px * 0.75
  P.add(S.armRole, rod([bx, armY(bx), -ARM_Z], [bx, armY(bx), ARM_Z], 0.015))

  // chain drive on the left
  const [sx, sy] = S.engine.sprocket
  P.add('metal', ring([0, RR], 0.058, 0.098, 0.005, 0.075))
  P.add('black', discZ([sx, sy, 0.075], 0.038, 0.012, 24))
  P.add('black', rod([sx, sy + 0.038, 0.075], [0, RR + 0.098, 0.075], 0.006, 0.006, 6))
  P.add('black', rod([sx, sy - 0.038, 0.075], [0, RR - 0.098, 0.075], 0.006, 0.006, 6))
  P.add('black', taperBar([sx - 0.08, sy + 0.06], [0.1, RR + 0.12], 0.022, 0.016, 0.03, 0.075))

  // monoshock from the swingarm brace up under the seat
  const lower = [bx, armY(bx) + 0.02, 0]
  const upper = [bx + 0.03, S.shockTop, 0]
  const on = (t) => [lerp(lower[0], upper[0], t), lerp(lower[1], upper[1], t), 0]
  P.add('chrome', rod(lower, upper, 0.01))
  P.add('black', rod(on(0.55), upper, 0.018))
  P.add(S.springRole, spring(on(0.12), on(0.62), 0.027, 0.005, 8))

  // swingarm-mounted hugger
  P.add('black', fender([0, RR], RR + 0.014, 0.16, 0.006, 0.02, 0.45, 2.0))
  for (const s of [-1, 1]) P.add(S.armRole, taperBar([0.25, armY(0.25) + 0.02], [0.3, 0.45], 0.026, 0.02, 0.008, s * 0.084))
}

function controls(P, S) {
  // rear-set footpegs, pedals and side stand
  const { hanger, rider, pillionHanger, pillion } = S.pegs
  for (const s of [-1, 1]) {
    P.add(S.hangerRole, taperBar(hanger, rider, 0.04, 0.03, 0.012, s * 0.15))
    P.add('rubber', rod([...rider, s * 0.15], [...rider, s * 0.21], 0.012, 0.012, 14))
    P.add('black', taperBar(pillionHanger, pillion, 0.03, 0.02, 0.01, s * 0.13))
    P.add('rubber', rod([...pillion, s * 0.13], [...pillion, s * 0.185], 0.011, 0.011, 12))
  }
  const [rx, ry] = rider
  P.add('black', rod([rx + 0.01, ry - 0.005, -0.165], [rx + 0.13, ry - 0.03, -0.172], 0.007)) // rear brake pedal
  P.add('black', rod([rx + 0.01, ry + 0.005, 0.165], [rx + 0.13, ry - 0.005, 0.17], 0.007)) // gear lever
  P.add('black', rod([rx + 0.05, 0.25, 0.1], [rx - 0.14, 0.245, 0.14], 0.009)) // side stand (folded)
}

// ── Split seats & tail ───────────────────────────────────────────────────────────────────────

function tail(P, S) {
  // rider seat stepping up to a separate, higher pillion seat
  const [r0, r1, rTop] = S.seat.rider
  P.add(
    'seat',
    loftShape({ x0: r0, x1: r1 }, (u) => {
      const top = rTop + 0.04 * smooth01(0.82, 1, u) ** 1.5
      const bottom = 0.74 + 0.05 * smooth01(0.8, 1, u)
      const hw = 0.125 - 0.022 * smooth01(0.72, 1, u)
      const yc = bottom + 0.4 * (top - bottom)
      const e = endRound(u, 0.12, 0.06)
      return { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: hw * e, nTop: 3.6, nBot: 6 }
    }, 32, 56),
  )
  const [p0, p1, pTop] = S.seat.pillion
  P.add(
    'seat',
    loftShape({ x0: p0, x1: p1 }, (u) => {
      const bottom = pTop - 0.048
      const yc = bottom + 0.45 * (pTop - bottom)
      const e = endRound(u, 0.15, 0.12)
      return { yc, hTop: (pTop - yc) * e, hBot: (yc - bottom) * e, hw: (0.082 + 0.025 * u) * e, nTop: 3.4, nBot: 5 }
    }, 24, 48),
  )

  // sharp body-coloured tail cowl, black underneath, tapering to the tail lamp
  const T = S.tail
  const { upper, lower } = splitLoft(
    T,
    (u) => {
      const x = lerp(T.x0, T.x1, u)
      const top = lerp(T.pillionTop, T.riderTop, smooth01(T.step[0], T.step[1], x))
      const bottom = lerp(T.tipBottom, T.bottom, smooth01(T.x0 + 0.04, 0.3, x))
      const hw = 0.045 + 0.085 * smooth01(T.x0, 0.22, x) - 0.03 * smooth01(T.x1 - 0.1, T.x1, x)
      const yc = (top + bottom) / 2
      const e = endRound(u, 0.06, 0.08)
      const s = { yc, hTop: (top - yc) * e, hBot: (yc - bottom) * e, hw: hw * e, nTop: 3.2, nBot: 3.2 }
      s.cut = yc - (yc - bottom) * 0.25 * e
      return s
    },
    40,
    48,
    40,
  )
  P.add('paint', upper)
  P.add('paint2', lower)
  const tipY = (T.pillionTop + T.tipBottom) / 2 + 0.004
  if (S.tailLamp === 'split') {
    for (const s of [-1, 1]) P.add('tail', rbox(0.014, 0.016, 0.042, 0.004), { p: [T.x0 + 0.02, tipY, s * 0.024], r: [s * 0.45, 0, 0] })
  } else {
    P.add('tail', rbox(0.014, 0.02, 0.075, 0.005), { p: [T.x0 + 0.02, tipY, 0] })
  }
  // split grab rails
  for (const s of [-1, 1]) P.add('engine', tube(S.rails.map(([x, y, z]) => [x, y, s * z]), 0.009, { segments: 32 }))

  // tail tidy sweeping down to the number plate, with the indicators
  const D = S.tidy
  const tidyY = (u) => lerp(D.y0, D.y1, u) - 0.01 * u * u
  P.add('black', loftShape(D, (u) => ({ yc: tidyY(u), hTop: 0.022 - 0.008 * u, hBot: 0.022 - 0.008 * u, hw: 0.05 - 0.015 * u, nTop: 3, nBot: 3 }), 24, 32))
  const [px, py] = S.plate
  P.add('black', rbox(0.008, 0.115, 0.195, 0.004), { p: [px, py, 0], r: [0, 0, -0.3] })
  P.add('plate', rbox(0.004, 0.1, 0.18, 0.0015), { p: [px - 0.006, py, 0], r: [0, 0, -0.3] })
  const ix = lerp(D.x0, D.x1, 0.45)
  const iy = tidyY(0.45)
  for (const s of [-1, 1]) {
    P.add('black', rod([ix, iy, s * 0.035], [ix - 0.002, iy, s * 0.13], 0.005))
    P.add('black', new THREE.CylinderGeometry(0.012, 0.01, 0.036, 16), { p: [ix - 0.01, iy, s * 0.137], r: [0, 0, Math.PI / 2] })
    P.add('amber', discX([ix - 0.029, iy, s * 0.137], 0.011, 0.004, 16))
  }
}

export function buildPulsar(variant) {
  const spec = SPECS[variant]
  const S = {
    ...spec,
    /** Point on the steering axis, t metres up the fork from the front axle. */
    fork: (t) => [spec.wb - Math.sin(RAKE) * t, RF + Math.cos(RAKE) * t],
    forkAtY: (y) => spec.wb - Math.tan(RAKE) * (y - RF),
  }
  const P = new Parts()
  wheels(P, S)
  frontEnd(P, S)
  headlamp(P, S)
  cockpit(P, S)
  tank(P, S)
  const port = engine(P, S.engine)
  if (variant === 'ns160') {
    underbellyExhaust(P, port)
    perimeterFrame(P)
  } else {
    sideExhaust(P, port)
    cradleFrame(P)
  }
  rearEnd(P, S)
  controls(P, S)
  tail(P, S)
  return P.build()
}
