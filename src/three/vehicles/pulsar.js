import * as THREE from 'three'
import {
  Parts,
  beam,
  discX,
  discZ,
  easedSamples,
  endRound,
  fender,
  finRing,
  loftRings,
  loftX,
  mergeAll,
  profile,
  rbox,
  ring,
  rod,
  roundedSection,
  sectionRing,
  smooth01,
  spring,
  taperBar,
  tube,
} from './parts.js'
import { alloyWheel, brakeDisc, tyre } from './wheels.js'

// Detailed Bajaj Pulsar NS160 and N160 (2024), built to Bajaj's published key dimensions:
//   NS160: wheelbase 1372 mm · L × W × H 2012 × 803 × 1060 mm · seat 805 mm · ground clearance 176 mm · 12 L tank
//   N160:  wheelbase 1358 mm · L × W × H ≈ 2016 × 791 × 1080 mm · seat 795 mm · ground clearance 165 mm · 14 L tank
//   both:  100/80-17 front & 130/70-17 rear tyres · 300 / 230 mm petal discs · 33 mm gold USD fork · oil-cooled single
// NS160: wide perimeter-frame beams, aluminium swingarm, keel belly pan housing the underbelly exhaust, thunderbolt DRLs.
// N160: tubular cradle, side-slung stubby exhaust, wolf-eye DRL brows. Both: angular tank with layered shrouds,
// raked headlamp cowl with visor, split seats and a short, sharp tail.
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
    arm: { role: 'metal', size: [0.066, 0.046, 0.04] },
    hangerRole: 'metal',
    springRole: 'gold',
    pivot: [0.565, 0.405],
    shockTop: 0.67,
    lamp: {
      at: [1.215, 0.84],
      tilt: 0.32,
      depth: 0.09,
      outline: [[0, 0.072], [0.055, 0.068], [0.088, 0.036], [0.084, -0.012], [0.052, -0.058], [0.018, -0.084], [0, -0.09]],
      projector: [-0.014, 0.024],
      drl: [[0.04, 0.05], [0.07, 0.024], [0.058, 0.014], [0.078, -0.024]], // "thunderbolt" either side
      visor: { at: [-0.005, 0.072], rake: 0.61, outline: [[-0.06, 0], [0.06, 0], [0.05, 0.055], [0.034, 0.09], [-0.034, 0.09], [-0.05, 0.055]] },
    },
    bar: { center: [1.085, 0.94], grip: [0.99, 0.972], gripZ: 0.39 },
    mirror: [0.995, 1.035, 0.33],
    dash: [1.13, 0.895],
    tank: { x0: 0.62, x1: 1.055, top: 0.865, rise: 0.11, bottom: 0.8, w: 0.1, swell: 0.065, taper: 0.035 },
    shroud: {
      z: 0.165,
      toe: 0.03,
      bulge: 0.012,
      base: { top: [[0.78, 0.9], [1.07, 0.935], [1.15, 0.86]], bottom: [[0.78, 0.9], [0.82, 0.8], [0.9, 0.7], [0.965, 0.6], [1.06, 0.605], [1.135, 0.73], [1.15, 0.86]] },
      cover: { top: [[0.8, 0.905], [1.06, 0.935], [1.135, 0.87]], bottom: [[0.8, 0.905], [0.84, 0.84], [0.91, 0.775], [1.02, 0.725], [1.12, 0.77], [1.135, 0.87]] },
    },
    engine: {
      crankcase: [[0.94, 0.29], [0.945, 0.36], [0.91, 0.43], [0.84, 0.46], [0.72, 0.46], [0.64, 0.47], [0.6, 0.43], [0.595, 0.33], [0.63, 0.265], [0.77, 0.25]],
      clutch: [0.72, 0.35, 0.095],
      magneto: [0.86, 0.35, 0.08],
      sprocket: [0.64, 0.375],
      base: [0.84, 0.46],
      tilt: 0.44,
      height: 0.17,
      fins: 8,
      fin: [0.17, 0.16],
      cooler: [1.07, 0.6, 0.25],
      intake: [[0.71, 0.655], [0.84, 0.668]],
      airbox: [0.58, 0.69],
    },
    pan: { x0: 0.5, x1: 0.995, rearTop: 0.3, frontTop: 0.43, bottom: 0.176, noseLift: 0.06, w: 0.1, role: 'paint2' },
    pegs: { hanger: [0.59, 0.49], rider: [0.505, 0.395], pillionHanger: [0.38, 0.65], pillion: [0.29, 0.48] },
    seat: {
      rider: { x0: 0.34, x1: 0.69, top: 0.805, frontTop: 0.845, w: 0.125, frontW: 0.095 },
      pillion: { x0: 0.03, x1: 0.33, top: 0.9, w: 0.085, frontW: 0.1 },
    },
    tail: { x0: -0.13, x1: 0.64, top: 0.875, lowTop: 0.78, step: [0.29, 0.37], tipBottom: 0.83, mid: 0.12, midBottom: 0.73, bottom: 0.675, tipW: 0.045, w: 0.125 },
    tailLamp: 'split',
    rails: [[0.03, 0.852, 0.112], [0.09, 0.874, 0.118], [0.24, 0.874, 0.12], [0.3, 0.854, 0.12]],
    tidy: { x0: 0.03, x1: -0.3, y0: 0.725, y1: 0.61 },
    plate: [-0.32, 0.585],
  },
  n160: {
    wb: 1.358,
    spokes: 'twin6',
    arm: { role: 'black', size: [0.058, 0.04, 0.036] },
    hangerRole: 'black',
    springRole: 'black',
    pivot: [0.52, 0.39],
    shockTop: 0.655,
    lamp: {
      at: [1.21, 0.86],
      tilt: 0.26,
      depth: 0.1,
      outline: [[0, 0.076], [0.068, 0.074], [0.1, 0.038], [0.09, -0.028], [0.048, -0.066], [0, -0.07]],
      projector: [-0.016, 0.026],
      drl: [[0.03, 0.032], [0.062, 0.049], [0.088, 0.037], [0.086, 0.006]], // "wolf-eye" brows over the projector
      visor: { at: [-0.005, 0.076], rake: 0.62, outline: [[-0.074, 0], [0.074, 0], [0.064, 0.06], [0.044, 0.1], [-0.044, 0.1], [-0.064, 0.06]] },
    },
    bar: { center: [1.07, 0.96], grip: [0.98, 0.99], gripZ: 0.385 },
    mirror: [0.98, 1.052, 0.32],
    dash: [1.12, 0.92],
    tank: { x0: 0.6, x1: 1.045, top: 0.875, rise: 0.11, bottom: 0.795, w: 0.105, swell: 0.07, taper: 0.035 },
    shroud: {
      z: 0.172,
      toe: 0.03,
      bulge: 0.014,
      base: { top: [[0.76, 0.915], [1.04, 0.955], [1.145, 0.875]], bottom: [[0.76, 0.915], [0.81, 0.83], [0.885, 0.74], [0.96, 0.635], [1.06, 0.63], [1.14, 0.74], [1.145, 0.875]] },
      cover: { top: [[0.78, 0.92], [1.03, 0.952], [1.125, 0.88]], bottom: [[0.78, 0.92], [0.87, 0.81], [0.98, 0.75], [1.1, 0.785], [1.125, 0.88]] },
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
    pan: { x0: 0.7, x1: 0.975, rearTop: 0.29, frontTop: 0.35, bottom: 0.168, noseLift: 0.05, w: 0.085, role: 'black' },
    pegs: { hanger: [0.55, 0.47], rider: [0.47, 0.38], pillionHanger: [0.35, 0.63], pillion: [0.27, 0.465] },
    seat: {
      rider: { x0: 0.35, x1: 0.68, top: 0.795, frontTop: 0.835, w: 0.128, frontW: 0.098 },
      pillion: { x0: 0.05, x1: 0.34, top: 0.89, w: 0.088, frontW: 0.104 },
    },
    tail: { x0: -0.12, x1: 0.63, top: 0.865, lowTop: 0.775, step: [0.3, 0.38], tipBottom: 0.825, mid: 0.13, midBottom: 0.725, bottom: 0.67, tipW: 0.05, w: 0.13 },
    tailLamp: 'single',
    rails: [[0.05, 0.847, 0.115], [0.11, 0.866, 0.12], [0.26, 0.866, 0.122], [0.32, 0.846, 0.122]],
    tidy: { x0: 0.04, x1: -0.315, y0: 0.72, y1: 0.6 },
    plate: [-0.335, 0.575],
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────

/** Lofts roundedSection(half(u)) along X from x0 (u = 0) to x1 (u = 1). */
const angularLoft = (x0, x1, half, radius, count = 32) =>
  loftX(easedSamples(count).map((u) => ({ x: lerp(x0, x1, u), points: roundedSection(half(u), radius, 4) })))

/** Scales a half outline toward its centre height yc, for rounded loft ends. */
const shrink = (half, e, yc) => half.map(([y, z]) => [yc + (y - yc) * e, z * e])

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
const strip = (points, r) => mergeAll(points.flatMap((p, i) => [...(i ? [rod(points[i - 1], p, r, r, 8)] : []), new THREE.SphereGeometry(r, 8, 6).translate(...p)]))

/** Piecewise-linear function through [x, y] points (x ascending), clamped at the ends. */
const piecewise = (pts) => (x) => {
  if (x <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]))
  return pts[pts.length - 1][1]
}

/**
 * Curved body shell on one side (±1): a strip between bottom(x) and top(x) — both meeting at the tips — following
 * surface(x, y) + offset with the given thickness. Shells sharing one surface stay flush when layered.
 */
function shell(side, x0, x1, top, bottom, surface, offset, thickness, count = 40) {
  const m = 10
  const rings = easedSamples(count).map((u) => {
    const x = lerp(x0, x1, u)
    const t = top(x)
    const b = Math.min(bottom(x), t)
    const outer = []
    const inner = []
    for (let i = 0; i <= m; i++) {
      const y = lerp(b, t, i / m)
      const z = surface(x, y) + offset
      outer.push([x, y, side * (z + thickness / 2)])
      inner.push([x, y, side * (z - thickness / 2)])
    }
    return [...outer, ...inner.reverse()]
  })
  const strip = []
  for (let i = 0; i < m; i++) strip.push([i, i + 1, 2 * m + 1 - i], [i + 1, 2 * m - i, 2 * m + 1 - i])
  return loftRings(rings, strip)
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
  // 33 mm upside-down fork: gold outer tubes, chrome stanchions, black axle lugs with amber side reflectors
  const f = S.fork
  for (const side of [-1, 1]) {
    const z = side * FORK_Z
    P.add('gold', rod([...f(0.33), z], [...f(0.665), z], 0.023, 0.023, 24))
    P.add('black', rod([...f(0.32), z], [...f(0.34), z], 0.0245, 0.0245, 24))
    P.add('chrome', rod([...f(0.06), z], [...f(0.38), z], 0.0165, 0.0165, 20))
    P.add('black', rbox(0.05, 0.09, 0.04, 0.012), { p: [...f(0.035), z], r: [0, 0, RAKE] })
    P.add('gold', rod([...f(0.665), z], [...f(0.677), z], 0.018, 0.018, 20))
    P.add('amber', discZ([...f(0.075), side * (FORK_Z + 0.021)], 0.008, 0.004, 16))
  }
  P.add('metal', discZ([S.wb, RF, 0], 0.011, FORK_Z * 2 + 0.045, 12))
  P.add('black', rbox(0.075, 0.032, 0.22, 0.01), { p: [...f(0.55), 0], r: [0, 0, RAKE] })
  P.add('black', rbox(0.072, 0.026, 0.21, 0.01), { p: [...f(0.645), 0], r: [0, 0, RAKE] })
  P.add('black', rod([...f(0.52), 0], [...f(0.67), 0], 0.026, 0.026, 20))
  // front brake hose from the bottom clamp down the left leg to the caliper
  P.add('black', tube([[...f(0.55), 0.05], [...f(0.38), FORK_Z - 0.03], [...f(0.16), FORK_Z - 0.03], [S.wb - 0.075, RF + 0.1, 0.058]], 0.004, { segments: 24 }))
  // body-coloured front fender on a fork brace
  P.add('paint', fender([S.wb, RF], RF + 0.018, 0.112, 0.005, 0.02, 0.5, 2.25))
  P.add('black', rbox(0.045, 0.012, FORK_Z * 2 + 0.02, 0.004), { p: [...f(0.31), 0], r: [0, 0, RAKE] })
}

function headlamp(P, S) {
  // raked LED projector unit in a tapered black cowl, with signature DRLs, clear lens and a smoked visor
  const L = S.lamp
  const [hx, hy] = L.at
  const [c, s] = [Math.cos(L.tilt), Math.sin(L.tilt)]
  const lamp = { p: [hx, hy, 0], r: [0, 0, L.tilt] }
  const add = (role, g) => P.add(role, g, lamp)
  const toWorld = ([x, y, z]) => [hx + x * c - y * s, hy + x * s + y * c, z]
  const outline = symmetric(L.outline)
  add('black', loftRings([[0, 1, 0], [-0.03, 0.96, 0.004], [-L.depth, 0.62, 0.02]].map(([x, k, dy]) => outline.map(([z, y]) => [x, y * k + dy, z * k]))))
  add('reflector', frontShape(scaled(outline, 0.88), 0.004, [0.004, 0], 0))
  const [py, pr] = L.projector
  add('chrome', new THREE.TorusGeometry(pr + 0.003, 0.004, 8, 32).rotateY(Math.PI / 2).translate(0.006, py, 0))
  add('lens', discX([0.006, py, 0], pr, 0.004, 28))
  for (const side of [-1, 1]) add('light', strip(L.drl.map(([z, y]) => [0.007, y, side * z]), 0.0042))
  add('glass', frontShape(scaled(outline, 0.95), 0.003, [0.015, 0], 0))
  const V = L.visor
  add('black', frontShape(V.outline, 0.004, [0, 0], 0.0015).rotateZ(V.rake).translate(...V.at, 0))
  // brackets to the fork, indicators on short stalks, horn underneath
  for (const side of [-1, 1]) {
    const back = toWorld([-L.depth + 0.01, 0, side * 0.04])
    P.add('black', rod(back, [S.forkAtY(back[1]), back[1], side * FORK_Z], 0.008))
    const [ix, iy] = toWorld([-L.depth * 0.6, -0.05, 0])
    P.add('black', rod([ix, iy, side * 0.05], [ix + 0.005, iy, side * 0.13], 0.005))
    P.add('black', new THREE.CylinderGeometry(0.012, 0.01, 0.036, 16), { p: [ix + 0.01, iy, side * 0.137], r: [0, 0, -Math.PI / 2] })
    P.add('amber', discX([ix + 0.029, iy, side * 0.137], 0.011, 0.004, 16))
  }
  const [nx, ny] = toWorld([-L.depth * 0.9, -0.1, 0])
  P.add('black', discX([nx, ny, 0.035], 0.021, 0.016, 20))
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
  // rectangular digital console tucked under the visor, angled toward the rider
  const [dx, dy] = S.dash
  P.add('black', rbox(0.032, 0.075, 0.13, 0.008), { p: [dx, dy, 0], r: [0, 0, -0.93] })
  P.add('screen', rbox(0.004, 0.06, 0.112, 0.0015), { p: [dx - 0.0102, dy + 0.0136, 0], r: [0, 0, -0.93] })
  P.add('black', rod([dx + 0.01, dy - 0.03, 0], [top[0], top[1] + 0.01, 0], 0.007))
}

// ── Tank & shrouds ───────────────────────────────────────────────────────────────────────────

function tank(P, S) {
  // angular tank: flat crown with crisp edges, widest at the knees, tapering into the seat
  const T = S.tank
  const half = (u) => {
    const top = T.top + T.rise * Math.sin(Math.min(1, u / 0.75) * (Math.PI / 2)) - 0.02 * smooth01(0.85, 1, u)
    const bottom = T.bottom - 0.015 * u
    const w = T.w + T.swell * Math.sin((Math.PI / 2) * Math.min(1, u / 0.6)) - T.taper * smooth01(0.78, 1, u)
    const h = top - bottom
    return shrink([[top, 0], [top - 0.006, w * 0.62], [bottom + 0.58 * h, w], [bottom + 0.16 * h, w * 0.82], [bottom, w * 0.45], [bottom, 0]], endRound(u, 0.08, 0.1), bottom + h / 2)
  }
  P.add('paint', angularLoft(T.x0, T.x1, half, 0.028, 40))
  // flush fuel cap, tilted to the slope of the crown
  const crown = (u) => half(u)[0][0]
  const uc = 0.62
  const x = lerp(T.x0, T.x1, uc)
  const tilt = Math.atan((crown(uc + 0.01) - crown(uc - 0.01)) / ((T.x1 - T.x0) * 0.02))
  P.add('steel', new THREE.CylinderGeometry(0.032, 0.032, 0.008, 28), { p: [x, crown(uc) - 0.002, 0], r: [0, 0, tilt] })
  P.add('black', new THREE.CylinderGeometry(0.024, 0.024, 0.01, 28), { p: [x, crown(uc) - 0.001, 0], r: [0, 0, tilt] })
  // layered shrouds: curved shells hugging the tank sides, bowing out and flaring over the oil cooler toward
  // the bottom, toed in at the front — a black lower shell under a body-coloured cover
  const H = S.shroud
  const [baseTop, baseBottom] = [piecewise(H.base.top), piecewise(H.base.bottom)]
  const [x0, x1] = [H.base.top[0][0], H.base.top[H.base.top.length - 1][0]]
  const surface = (x, y) => {
    const t = baseTop(x)
    const b = baseBottom(x)
    const v = t > b ? Math.min(1, Math.max(0, (y - b) / (t - b))) : 0.5
    return H.z - H.toe * smooth01(x1 - 0.2, x1, x) + H.bulge * Math.sin(Math.PI * v) - 0.15 * (y - (t + b) / 2)
  }
  const [c0, c1] = [H.cover.top[0][0], H.cover.top[H.cover.top.length - 1][0]]
  for (const side of [-1, 1]) {
    P.add('paint2', shell(side, x0, x1, baseTop, baseBottom, surface, 0, 0.016))
    P.add('paint', shell(side, c0, c1, piecewise(H.cover.top), piecewise(H.cover.bottom), surface, 0.014, 0.012))
  }
}

// ── Engine, belly pan & exhausts ─────────────────────────────────────────────────────────────

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
    P.add('steel', finRing(fw * k + 0.007, fd * k + 0.007, 0.012, 0.006, 0.0076), { p: [x, y, 0], r: [0, 0, -E.tilt] })
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

/** Angular keel under the engine, nose rising at the front. */
function bellyPan(P, B) {
  const half = (u) => {
    const top = lerp(B.rearTop, B.frontTop, smooth01(0.45, 1, u))
    const bottom = B.bottom + B.noseLift * smooth01(0.72, 1, u)
    const w = B.w + 0.025 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 0.03 * smooth01(0.82, 1, u)
    const h = top - bottom
    return shrink([[top, 0], [top, w * 0.75], [bottom + 0.5 * h, w], [bottom + 0.1 * h, w * 0.7], [bottom, w * 0.3], [bottom, 0]], endRound(u, 0.04, 0.1), bottom + h / 2)
  }
  P.add(B.role, angularLoft(B.x0, B.x1, half, 0.02, 28))
}

function underbellyExhaust(P, port) {
  // NS160: header down the front of the engine into the belly pan, stubby end can with twin outlets on the right
  P.add('black', tube([[port[0], port[1], -0.03], [1.01, 0.52, -0.07], [1.005, 0.38, -0.075], [0.97, 0.3, -0.06], [0.9, 0.26, -0.03]], 0.02, { segments: 64 }))
  const zc = -0.085
  P.add('black', beam([[0.59, 0.225, zc], [0.458, 0.2455, zc]], 0.062, 0.05, { segments: 4 }))
  P.add('steel', beam([[0.461, 0.245, zc], [0.448, 0.247, zc]], 0.066, 0.054, { segments: 2 }))
  for (const s of [-1, 1]) P.add('chrome', rod([0.452, 0.246, zc + s * 0.012], [0.437, 0.248, zc + s * 0.012], 0.0095, 0.0095, 14))
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
}

// ── Frames, rear suspension & controls ───────────────────────────────────────────────────────

function perimeterFrame(P) {
  for (const s of [-1, 1]) {
    // wide beams from the steering head over the engine to the swingarm pivot, with engine hangers
    P.add('black', beam([[1.1, 0.835, s * 0.05], [1.03, 0.785, s * 0.1], [0.9, 0.725, s * 0.118], [0.75, 0.665, s * 0.12], [0.645, 0.59, s * 0.115], [0.59, 0.49, s * 0.108], [0.57, 0.41, s * 0.104]], 0.05, 0.028, { segments: 64 }))
    P.add('black', taperBar([0.92, 0.72], [0.92, 0.655], 0.04, 0.03, 0.01, s * 0.1))
    P.add('black', taperBar([0.62, 0.57], [0.62, 0.45], 0.045, 0.035, 0.012, s * 0.1))
    // subframe under the seats
    P.add('black', tube([[0.66, 0.63, s * 0.1], [0.42, 0.75, s * 0.085], [0.15, 0.825, s * 0.07], [0.0, 0.85, s * 0.055]], 0.012))
    P.add('black', tube([[0.58, 0.5, s * 0.1], [0.38, 0.65, s * 0.09], [0.17, 0.79, s * 0.075]], 0.011))
  }
}

function cradleFrame(P) {
  P.add('black', tube([[1.075, 0.87, 0], [0.98, 0.83, 0], [0.78, 0.79, 0], [0.6, 0.75, 0]], 0.022)) // spine under the tank
  for (const s of [-1, 1]) {
    P.add('black', tube([[1.085, 0.83, s * 0.03], [1.04, 0.62, s * 0.045], [0.995, 0.42, s * 0.05], [0.93, 0.26, s * 0.055], [0.8, 0.2, s * 0.055], [0.62, 0.2, s * 0.06], [0.545, 0.26, s * 0.065], [0.525, 0.4, s * 0.07], [0.535, 0.6, s * 0.07], [0.6, 0.745, s * 0.06]], 0.017, { segments: 96 }))
    P.add('black', tube([[0.6, 0.745, s * 0.07], [0.4, 0.75, s * 0.08], [0.15, 0.8, s * 0.07], [0.0, 0.825, s * 0.055]], 0.012))
    P.add('black', tube([[0.53, 0.47, s * 0.075], [0.35, 0.63, s * 0.085], [0.16, 0.77, s * 0.075]], 0.011))
  }
}

function rearEnd(P, S) {
  // box-section swingarm with brace and chain adjusters
  const [px, py] = S.pivot
  const [w0, w1, depth] = S.arm.size
  P.add('metal', discZ([px, py, 0], 0.016, ARM_Z * 2 + 0.03, 12))
  for (const s of [-1, 1]) {
    P.add(S.arm.role, taperBar([px, py], [0, RR], w0, w1, depth, s * ARM_Z))
    P.add('steel', rbox(0.03, 0.02, 0.012, 0.004), { p: [0.02, RR, s * (ARM_Z + depth / 2 + 0.002)] })
  }
  const armY = (x) => lerp(RR, py, x / px)
  const bx = px * 0.75
  P.add(S.arm.role, rod([bx, armY(bx), -ARM_Z], [bx, armY(bx), ARM_Z], 0.015))

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
  for (const s of [-1, 1]) P.add(S.arm.role, taperBar([0.25, armY(0.25) + 0.02], [0.3, 0.45], 0.026, 0.02, 0.008, s * 0.084))
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
  P.add('black', rod([rx + 0.13, ry - 0.005, 0.17], [rx + 0.13, ry + 0.07, 0.13], 0.005)) // shift linkage
  P.add('black', rod([rx + 0.05, 0.25, 0.1], [rx - 0.14, 0.245, 0.14], 0.009)) // side stand (folded)
}

// ── Split seats & tail ───────────────────────────────────────────────────────────────────────

function tail(P, S) {
  // low rider seat stepping up to a separate, higher pillion seat
  const R = S.seat.rider
  P.add(
    'seat',
    angularLoft(R.x0, R.x1, (u) => {
      const top = R.top + (R.frontTop - R.top) * smooth01(0.7, 1, u) ** 1.4
      const bottom = 0.745 + 0.05 * smooth01(0.75, 1, u)
      const w = lerp(R.w, R.frontW, smooth01(0.55, 1, u))
      const h = top - bottom
      return shrink([[top, 0], [top, w * 0.78], [top - 0.35 * h, w], [bottom, w * 0.88], [bottom, 0]], endRound(u, 0.1, 0.06), bottom + h / 2)
    }, 0.016, 28),
  )
  const Q = S.seat.pillion
  P.add(
    'seat',
    angularLoft(Q.x0, Q.x1, (u) => {
      const w = lerp(Q.w, Q.frontW, u)
      return shrink([[Q.top, 0], [Q.top, w * 0.78], [Q.top - 0.016, w], [Q.top - 0.045, w * 0.9], [Q.top - 0.045, 0]], endRound(u, 0.14, 0.1), Q.top - 0.0225)
    }, 0.014, 22),
  )

  // short, sharp tail cowl in body colour over a black undertail
  const T = S.tail
  const top = (x) => lerp(T.top, T.lowTop, smooth01(T.step[0], T.step[1], x))
  const bottom = (x) => (x < T.mid ? lerp(T.tipBottom, T.midBottom, smooth01(T.x0, T.mid, x)) : lerp(T.midBottom, T.bottom, smooth01(T.mid, T.mid + 0.33, x)))
  const width = (x) => lerp(T.tipW, T.w, smooth01(T.x0, T.x0 + 0.32, x)) - 0.015 * smooth01(T.x1 - 0.12, T.x1, x)
  P.add(
    'paint',
    angularLoft(T.x0, T.x1, (u) => {
      const x = lerp(T.x0, T.x1, u)
      const [t, b, w] = [top(x), bottom(x), width(x)]
      const h = t - b
      return shrink([[t, 0], [t, w * 0.72], [t - 0.32 * h, w], [b + 0.22 * h, w * 0.9], [b, w * 0.5], [b, 0]], endRound(u, 0.05, 0.06), b + h / 2)
    }, 0.012, 40),
  )
  const [u0, u1] = [T.x0 + 0.04, T.mid + 0.3]
  P.add(
    'paint2',
    angularLoft(u0, u1, (u) => {
      const x = lerp(u0, u1, u)
      const [b, w] = [bottom(x), width(x) * 0.82]
      return shrink([[b + 0.012, 0], [b + 0.012, w], [b - 0.03, w * 0.7], [b - 0.03, 0]], endRound(u, 0.08, 0.08), b - 0.009)
    }, 0.008, 24),
  )
  // LED tail lamp in a black housing at the tip
  const tipY = (top(T.x0) + bottom(T.x0)) / 2
  P.add('black', rbox(0.04, 0.03, 0.07, 0.008), { p: [T.x0 + 0.018, tipY - 0.006, 0] })
  if (S.tailLamp === 'split') {
    for (const s of [-1, 1]) P.add('tail', rbox(0.01, 0.014, 0.034, 0.004), { p: [T.x0 - 0.003, tipY - 0.004, s * 0.02], r: [s * 0.45, 0, 0] })
  } else {
    P.add('tail', rbox(0.01, 0.016, 0.062, 0.005), { p: [T.x0 - 0.003, tipY - 0.004, 0] })
  }
  // chunky split grab rails beside the pillion seat
  for (const s of [-1, 1]) P.add('engine', beam(S.rails.map(([x, y, z]) => [x, y, s * z]), 0.024, 0.016, { segments: 32 }))

  // tail tidy sweeping down to the number plate, with the indicators
  const D = S.tidy
  const tidyY = (u) => lerp(D.y0, D.y1, u) - 0.01 * u * u
  P.add('black', loftX(easedSamples(24).map((u) => ({ x: lerp(D.x0, D.x1, u), points: sectionRing({ yc: tidyY(u), hTop: 0.022 - 0.008 * u, hBot: 0.022 - 0.008 * u, hw: 0.05 - 0.015 * u, nTop: 3, nBot: 3 }, 32) }))))
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
  bellyPan(P, S.pan)
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
