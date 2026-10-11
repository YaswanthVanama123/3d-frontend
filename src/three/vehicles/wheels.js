import * as THREE from 'three'
import { TAU, discZ, rbox, ring, superTorus, taperBar } from './parts.js'

// Wheel assemblies shared by the detailed bikes (ronin.js, pulsar.js): tyres, 17" alloys and brake discs.
// Builder coordinates as in parts.js: metres, +X forward, +Y up, +Z = rider's left.

export const RIM = 0.216 // 17" bead seat radius

/** Surface point and outward normal (radial r / axial z) of the tyre's superellipse section at z = f·aZ. */
function tyreSection(t, f) {
  const at = (v) => {
    const c = Math.cos(v)
    const s = Math.sin(v)
    return [t.rho + t.aR * Math.abs(c) ** (2 / t.n), t.aZ * Math.sign(s) * Math.abs(s) ** (2 / t.n)]
  }
  const v = Math.sign(f) * Math.asin(Math.min(1, Math.abs(f) ** (t.n / 2)))
  const [r, z] = at(v)
  const [r2, z2] = at(v + 1e-4)
  const len = Math.hypot(r2 - r, z2 - z)
  return { r, z, nr: (z2 - z) / len, nz: -(r2 - r) / len }
}

/** One tread block sitting on the curved tyre surface (≈5 mm proud), at wheel angle `angle`. */
function treadBlock(P, x, y, tyre, f, angle, [len, width, height]) {
  const { r, z, nr, nz } = tyreSection(tyre, f)
  const lift = height / 2 - 0.007
  const g = new THREE.BoxGeometry(height, len, width)
  g.rotateY(Math.atan2(-nz, nr))
  g.translate(r + nr * lift, 0, z + nz * lift)
  g.rotateZ(angle)
  g.translate(x, y, 0)
  P.add('rubber', g)
}

/** Tyre on a 17" rim with outer radius r. tread: 'block' (dual-purpose blocks) or 'road' (smooth, rounder sport profile). */
export function tyre(P, { x, y, r, width, tread = 'road' }) {
  const wall = r - RIM
  const t = { rho: RIM + wall / 2, aR: wall / 2, aZ: width / 2, n: tread === 'block' ? 2.6 : 2.3 }
  P.add('rubber', superTorus([x, y, 0], t.rho, t.aR, t.aZ, t.n, 128, 28))
  if (tread !== 'block') return
  // staggered centre blocks plus shoulder blocks
  const pitch = TAU / 36
  for (let i = 0; i < 36; i++) {
    const a = i * pitch
    treadBlock(P, x, y, t, 0.24, a, [0.026, width * 0.18, 0.012])
    treadBlock(P, x, y, t, -0.24, a + pitch / 2, [0.026, width * 0.18, 0.012])
    treadBlock(P, x, y, t, 0.66, a + pitch * 0.25, [0.021, width * 0.15, 0.011])
    treadBlock(P, x, y, t, -0.66, a + pitch * 0.75, [0.021, width * 0.15, 0.011])
  }
}

/**
 * 17" black alloy: rim barrel with flanges, hub, axle and spokes. spokes:
 * 'pairs5' five V-pairs · 'split5' five spokes forking into a Y · 'twin6' six slim parallel pairs.
 */
export function alloyWheel(P, { x, y, width, spokes = 'pairs5', role = 'black' }) {
  P.add(role, ring([x, y], RIM - 0.014, RIM + 0.002, width * 0.72))
  for (const side of [-1, 1]) P.add(role, ring([x, y], RIM - 0.003, RIM + 0.006, 0.006, side * width * 0.36))
  P.add(role, discZ([x, y, 0], 0.058, width * 0.78, 32))
  P.add('metal', discZ([x, y, 0], 0.02, width + 0.13, 16))
  const at = (a, r) => [x + Math.cos(a) * r, y + Math.sin(a) * r]
  const tip = RIM - 0.012
  if (spokes === 'pairs5') {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.31
      for (const s of [-1, 1]) P.add(role, taperBar(at(a + s * 0.07, 0.052), at(a + s * 0.19, tip), 0.026, 0.015, 0.03))
    }
  } else if (spokes === 'split5') {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.31
      P.add(role, taperBar(at(a, 0.05), at(a, 0.135), 0.034, 0.024, 0.032))
      for (const s of [-1, 1]) P.add(role, taperBar(at(a, 0.125), at(a + s * 0.17, tip), 0.02, 0.014, 0.028))
    }
  } else {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + 0.31
      for (const s of [-1, 1]) {
        const off = s * 0.012
        const n = [-Math.sin(a) * off, Math.cos(a) * off]
        const [hx, hy] = at(a, 0.05)
        const [rx, ry] = at(a, tip)
        P.add(role, taperBar([hx + n[0], hy + n[1]], [rx + n[0] * 1.6, ry + n[1] * 1.6], 0.014, 0.011, 0.03))
      }
    }
  }
}

const circlePath = (path, cx, cy, r, n) => path.setFromPoints(Array.from({ length: n }, (_, i) => new THREE.Vector2(cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r)))

/** 5 mm disc: 'drilled' (round, two staggered rings of holes) or 'petal' (wavy outline, one ring of holes). */
function discPlate([x, y], rOuter, rInner, z, style) {
  const shape =
    style === 'petal'
      ? new THREE.Shape().setFromPoints(
          Array.from({ length: 168 }, (_, i) => {
            const a = (i / 168) * TAU
            const r = rOuter - 0.011 * (0.5 - 0.5 * Math.cos(14 * a)) ** 0.6
            return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)
          }),
        )
      : circlePath(new THREE.Shape(), 0, 0, rOuter, 96)
  shape.holes.push(circlePath(new THREE.Path(), 0, 0, rInner, 72))
  const mid = (rOuter + rInner) / 2 - (style === 'petal' ? 0.003 : 0)
  const offset = style === 'petal' ? 0 : (rOuter - rInner) * 0.2
  const count = style === 'petal' ? 28 : 30
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU
    const r = mid + (i % 2 ? offset : -offset)
    shape.holes.push(circlePath(new THREE.Path(), Math.cos(a) * r, Math.sin(a) * r, 0.0034, 10))
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.005, bevelEnabled: false })
  g.translate(x, y, z - 0.0025)
  return g
}

/** ABS tone ring: a 3 mm steel ring with a circle of holes, around the hub at z. */
export function toneRing(P, { x, y, r0, r1, z, holes = 30 }) {
  const shape = circlePath(new THREE.Shape(), 0, 0, r1, 72)
  shape.holes.push(circlePath(new THREE.Path(), 0, 0, r0, 60))
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * TAU
    shape.holes.push(circlePath(new THREE.Path(), (Math.cos(a) * (r0 + r1)) / 2, (Math.sin(a) * (r0 + r1)) / 2, (r1 - r0) * 0.28, 8))
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.003, bevelEnabled: false })
  g.translate(x, y, z - 0.0015)
  P.add('steel', g)
}

/** Brake disc on a black five-arm carrier, with its caliper at `caliperAngle` (CCW from +X). side ±1 = which face of the wheel. */
export function brakeDisc(P, { x, y, r, z, side, caliperAngle, style = 'drilled', caliperRole = 'black' }) {
  P.add('steel', discPlate([x, y], r, r * 0.74, z, style))
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU
    const c = (rr) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr]
    P.add('black', taperBar(c(0.045), c(r * 0.77), 0.022, 0.016, 0.005, z))
  }
  const ca = caliperAngle
  P.add(caliperRole, rbox(0.072, 0.05, 0.042, 0.012), { p: [x + Math.cos(ca) * r * 0.84, y + Math.sin(ca) * r * 0.84, z + side * 0.006], r: [0, 0, ca + Math.PI / 2] })
}
