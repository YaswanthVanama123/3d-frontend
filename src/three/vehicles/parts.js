import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Geometry toolkit for the procedural vehicles. Coordinates are metres: +X forward, +Y up, +Z = rider's left.
// That frame is left-handed, so Parts.build() mirrors Z: in the finished three.js model +Z is the rider's right.
// Every helper returns a closed solid, so exported STL files give a meaningful volume for pricing.

export const TAU = Math.PI * 2
const UP = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _s = new THREE.Vector3()
const _p = new THREE.Vector3()

export const v3 = (a) => (a.isVector3 ? a : new THREE.Vector3(a[0], a[1], a[2] ?? 0))
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * t]
export const smooth01 = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Bakes position / Euler rotation / scale into a geometry. */
export function place(g, { p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
  _e.set(r[0], r[1], r[2])
  _q.setFromEuler(_e)
  const sc = typeof s === 'number' ? [s, s, s] : s
  _m.compose(_p.set(p[0], p[1], p[2] ?? 0), _q, _s.set(sc[0], sc[1], sc[2]))
  return g.applyMatrix4(_m)
}

function alignY(g, a, b) {
  const A = v3(a)
  const B = v3(b)
  const dir = new THREE.Vector3().subVectors(B, A)
  _q.setFromUnitVectors(UP, dir.normalize())
  _m.compose(_p.addVectors(A, B).multiplyScalar(0.5), _q, _s.set(1, 1, 1))
  return g.applyMatrix4(_m)
}

/** Round rod from a to b (radius r1 at a, r2 at b). */
export function rod(a, b, r1, r2 = r1, radial = 12) {
  const len = v3(a).distanceTo(v3(b))
  return alignY(new THREE.CylinderGeometry(r2, r1, len, radial, 1), a, b)
}

/** Coil spring from a to b. */
export function spring(a, b, radius, wire, turns = 8) {
  const len = v3(a).distanceTo(v3(b))
  class Helix extends THREE.Curve {
    getPoint(t, target = new THREE.Vector3()) {
      const ang = t * turns * TAU
      return target.set(Math.cos(ang) * radius, t * len - len / 2, Math.sin(ang) * radius)
    }
  }
  return alignY(new THREE.TubeGeometry(new Helix(), turns * 14, wire, 6, false), a, b)
}

/** Flat bar from a to b in the XY plane (thickness t), depth d along Z, centred on z. */
export function bar(a, b, t, d, z = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  return place(new THREE.BoxGeometry(len, t, d), { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z], r: [0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])] })
}

/** Smooth tube through points, capped at both ends. */
export function tube(points, radius, { segments = 56, radial = 10 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(v3), false, 'centripetal')
  const g = new THREE.TubeGeometry(curve, segments, radius, radial, false)
  const parts = [g]
  for (const [t, sign] of [[0, -1], [1, 1]]) {
    const cap = new THREE.CircleGeometry(radius, radial)
    _q.setFromUnitVectors(Z_AXIS, curve.getTangentAt(t).multiplyScalar(sign))
    _m.compose(curve.getPointAt(t), _q, _s.set(1, 1, 1))
    parts.push(cap.applyMatrix4(_m))
  }
  return mergeAll(parts)
}

export function rbox(w, h, d, radius = Math.min(w, h, d) * 0.25, segments = 3) {
  const r = Math.max(0.0005, Math.min(radius, Math.min(w, h, d) / 2 - 0.0005))
  return new RoundedBoxGeometry(w, h, d, segments, r)
}

/** Closed side profile (XY points) extruded along Z, centred on z. Smooth = Catmull-Rom through the points. */
export function profile(points, width, { bevel = 0.02, z = 0, smooth = true, samples = 96 } = {}) {
  const pts = smooth
    ? new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal')
        .getPoints(samples)
        .map((p) => new THREE.Vector2(p.x, p.y))
    : points.map(([x, y]) => new THREE.Vector2(x, y))
  const depth = Math.max(0.001, width - bevel * 2)
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 4,
    curveSegments: 8,
  })
  g.translate(0, 0, z - depth / 2)
  return g
}

/** Solid arc (annular sector) around a wheel: angles CCW from +X, i.e. 0 = front, π/2 = top. */
export function arcSolid(center, rInner, rOuter, width, a0, a1, z = 0) {
  const s = new THREE.Shape()
  s.absarc(0, 0, rOuter, a0, a1, false)
  s.absarc(0, 0, rInner, a1, a0, true)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 40 })
  g.translate(center[0], center[1], z - width / 2)
  return g
}

/** Solid ring (annulus) in the XY plane, e.g. a wheel rim. */
export function ring(center, rInner, rOuter, width, z = 0) {
  const s = new THREE.Shape()
  s.absarc(0, 0, rOuter, 0, TAU, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, rInner, 0, TAU, true)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 48 })
  g.translate(center[0], center[1], z - width / 2)
  return g
}

/** Disc facing +X (thin closed cylinder) — lenses, mirrors, gauges. */
export const discX = (center, r, thickness = 0.006, radial = 32) => place(new THREE.CylinderGeometry(r, r, thickness, radial), { p: center, r: [0, 0, -Math.PI / 2] })
/** Disc facing ±Z (axis along Z) — brake discs, hubs, covers. */
export const discZ = (center, r, thickness, radial = 32) => place(new THREE.CylinderGeometry(r, r, thickness, radial), { p: center, r: [Math.PI / 2, 0, 0] })

function normalize(g) {
  const out = g.index ? g.toNonIndexed() : g
  if (out !== g) g.dispose()
  for (const name of Object.keys(out.attributes)) if (name !== 'position' && name !== 'normal') out.deleteAttribute(name)
  if (!out.attributes.normal) out.computeVertexNormals()
  out.morphAttributes = {}
  return out
}

export function mergeAll(list) {
  const merged = mergeGeometries(list.map(normalize), false)
  return merged
}

/** Mirrors a geometry through the XY plane, re-winding its triangles so they still face outward. */
export function mirrorZ(g) {
  g.scale(1, 1, -1)
  if (g.index) {
    const idx = g.index.array
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]
    g.index.needsUpdate = true
    return g
  }
  for (const attr of Object.values(g.attributes)) {
    const a = attr.array
    const n = attr.itemSize
    for (let t = 0; t < attr.count; t += 3) {
      for (let k = 0; k < n; k++) {
        const i1 = (t + 1) * n + k
        const i2 = (t + 2) * n + k
        ;[a[i1], a[i2]] = [a[i2], a[i1]]
      }
    }
    attr.needsUpdate = true
  }
  return g
}

/** Collects parts per material role and merges each role into one geometry (one draw call per role). */
export class Parts {
  constructor() {
    this.roles = new Map()
  }

  add(role, geometry, transform) {
    if (transform) place(geometry, transform)
    if (!this.roles.has(role)) this.roles.set(role, [])
    this.roles.get(role).push(normalize(geometry))
    return this
  }

  build() {
    const out = {}
    for (const [role, list] of this.roles) out[role] = mirrorZ(mergeGeometries(list, false))
    for (const g of Object.values(out)) {
      g.computeBoundingBox()
      g.computeBoundingSphere()
    }
    return out
  }
}

// ── Advanced shapes (used by the detailed TVS Ronin) ─────────────────────────────────────────

export function signedVolume(g) {
  const p = g.attributes.position.array
  const idx = g.index?.array
  const count = idx ? idx.length : p.length / 3
  let v = 0
  for (let t = 0; t < count; t += 3) {
    const a = (idx ? idx[t] : t) * 3
    const b = (idx ? idx[t + 1] : t + 1) * 3
    const c = (idx ? idx[t + 2] : t + 2) * 3
    v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6
  }
  return v
}

function orientOutward(g) {
  if (signedVolume(g) < 0) {
    const idx = g.index.array
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]
    g.index.needsUpdate = true
  }
  g.computeVertexNormals()
  return g
}

/**
 * Closed solid through rings of [x, y, z] points (equal counts). Ends are capped with a fan from the centroid,
 * or with `capTriangles` (index triples into a ring, in ring order) for sections whose centroid lies outside.
 */
export function loftRings(rings, capTriangles) {
  const n = rings[0].length
  const S = rings.length
  const pos = []
  const idx = []
  for (const ring of rings) for (const p of ring) pos.push(p[0], p[1], p[2])
  for (let k = 0; k < S - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = k * n + i
      const b = k * n + j
      const c = (k + 1) * n + i
      const d = (k + 1) * n + j
      idx.push(a, b, c, b, d, c)
    }
  }
  const cap = (ring, offset, flip) => {
    if (capTriangles) {
      for (const [a, b, c] of capTriangles) idx.push(offset + a, offset + (flip ? c : b), offset + (flip ? b : c))
      return
    }
    const ci = pos.length / 3
    pos.push(...[0, 1, 2].map((axis) => ring.reduce((sum, p) => sum + p[axis], 0) / n))
    for (let i = 0; i < n; i++) {
      const a = offset + i
      const b = offset + ((i + 1) % n)
      if (flip) idx.push(ci, b, a)
      else idx.push(ci, a, b)
    }
  }
  cap(rings[0], 0, true)
  cap(rings[S - 1], (S - 1) * n, false)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  return orientOutward(g)
}

/** Closed solid lofted through cross-sections along X: [{ x, points: [[y, z], …] }] (equal point counts). */
export const loftX = (sections) => loftRings(sections.map((s) => s.points.map(([y, z]) => [s.x, y, z])))

/** Wheel fender with a crowned cross-section, swept from angle a0 to a1 (CCW from +X, 0 = front) around center. */
export function fender(center, r, width, thickness, crown, a0, a1, segments = 40) {
  const m = 12
  const section = []
  const bulge = (z) => crown * (1 - ((2 * z) / width) ** 2)
  for (let i = 0; i <= m; i++) {
    const z = -width / 2 + (width * i) / m
    section.push([r + thickness + bulge(z), z])
  }
  for (let i = m; i >= 0; i--) {
    const z = -width / 2 + (width * i) / m
    section.push([r + bulge(z) * 0.9, z])
  }
  const rings = []
  for (let k = 0; k <= segments; k++) {
    const a = a0 + ((a1 - a0) * k) / segments
    rings.push(section.map(([rho, z]) => [center[0] + rho * Math.cos(a), center[1] + rho * Math.sin(a), z]))
  }
  // the crescent section's centroid sits outside it, so cap the ends with a strip instead of a fan
  const strip = []
  for (let i = 0; i < m; i++) strip.push([i, i + 1, 2 * m + 1 - i], [i + 1, 2 * m - i, 2 * m + 1 - i])
  return loftRings(rings, strip)
}

/** Superellipse point on a cross-section; φ = 0 at the top, increasing toward +Z. */
export function superPoint(phi, s) {
  const c = Math.cos(phi)
  const si = Math.sin(phi)
  const top = c >= 0
  const n = top ? s.nTop : s.nBot
  const y = s.yc + Math.sign(c) * Math.abs(c) ** (2 / n) * (top ? s.hTop : s.hBot)
  const z = Math.sign(si) * Math.abs(si) ** (2 / n) * s.hw
  return [y, z]
}

/** Ring of `count` points around a superellipse section. */
export const sectionRing = (s, count) => Array.from({ length: count }, (_, i) => superPoint((i / count) * TAU, s))

/** Upper or lower part of a section, split by a horizontal line at y = cut (closed with a flat chord). */
export function sectionPart(s, cut, part, arcCount, chordCount) {
  // find φc on the +Z side where y(φ) = cut (y decreases monotonically from φ = 0 to π)
  let lo = 0
  let hi = Math.PI
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (superPoint(mid, s)[0] > cut) lo = mid
    else hi = mid
  }
  const pc = (lo + hi) / 2
  const pts = []
  const [a0, a1] = part === 'upper' ? [-pc, pc] : [pc, TAU - pc]
  for (let i = 0; i < arcCount; i++) pts.push(superPoint(a0 + ((a1 - a0) * i) / (arcCount - 1), s))
  const zFrom = pts[pts.length - 1][1]
  const zTo = pts[0][1]
  for (let i = 1; i <= chordCount; i++) pts.push([cut, zFrom + ((zTo - zFrom) * i) / (chordCount + 1)])
  return pts
}

/** Cosine-spaced samples in [0, 1] — denser near the ends for smoothly rounded lofts. */
export const easedSamples = (count) => Array.from({ length: count }, (_, i) => (1 - Math.cos((Math.PI * i) / (count - 1))) / 2)

/** Lofts the superellipse section shape(u) (see superPoint) along X over the part [u0, u1] of range { x0, x1 }. */
export function loftShape(range, shape, count, ringCount, u0 = 0, u1 = 1) {
  return loftX(
    easedSamples(count).map((k) => {
      const u = u0 + (u1 - u0) * k
      return { x: range.x0 + (range.x1 - range.x0) * u, points: sectionRing(shape(u), ringCount) }
    }),
  )
}

/** Like loftShape, split at y = shape(u).cut into an upper and a lower solid (two-tone paint). */
export function splitLoft(range, shape, count, upperCount = 56, lowerCount = 44) {
  const upper = []
  const lower = []
  for (const u of easedSamples(count)) {
    const s = shape(u)
    const x = range.x0 + (range.x1 - range.x0) * u
    upper.push({ x, points: sectionPart(s, s.cut, 'upper', upperCount, 14) })
    lower.push({ x, points: sectionPart(s, s.cut, 'lower', lowerCount, 14) })
  }
  return { upper: loftX(upper), lower: loftX(lower) }
}

/** Quarter-circle end rounding factor for a loft parameter u ∈ [0, 1]. */
export function endRound(u, r0, r1) {
  let f = 1
  if (r0 > 0 && u < r0) f = Math.min(f, Math.sqrt(Math.max(0, 1 - (1 - u / r0) ** 2)))
  if (r1 > 0 && u > 1 - r1) f = Math.min(f, Math.sqrt(Math.max(0, 1 - (1 - (1 - u) / r1) ** 2)))
  return Math.max(0.06, f)
}

/** Torus with a superellipse cross-section in the XY plane (axis Z) — realistic tyres. */
export function superTorus(center, rho, aR, aZ, n = 3, segU = 120, segV = 28) {
  const pos = []
  const idx = []
  for (let i = 0; i < segU; i++) {
    const u = (i / segU) * TAU
    for (let j = 0; j < segV; j++) {
      const v = (j / segV) * TAU
      const cv = Math.cos(v)
      const sv = Math.sin(v)
      const rr = rho + aR * Math.sign(cv) * Math.abs(cv) ** (2 / n)
      const zz = aZ * Math.sign(sv) * Math.abs(sv) ** (2 / n)
      pos.push(center[0] + rr * Math.cos(u), center[1] + rr * Math.sin(u), (center[2] ?? 0) + zz)
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const i2 = (i + 1) % segU
      const j2 = (j + 1) % segV
      idx.push(i * segV + j, i2 * segV + j, i * segV + j2, i2 * segV + j, i2 * segV + j2, i * segV + j2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  return orientOutward(g)
}

/** Tapered flat bar from a (width w0) to b (width w1) in the XY plane, depth along Z. */
export function taperBar(a, b, w0, w1, depth, z = 0) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const shape = new THREE.Shape([
    new THREE.Vector2(a[0] + (nx * w0) / 2, a[1] + (ny * w0) / 2),
    new THREE.Vector2(b[0] + (nx * w1) / 2, b[1] + (ny * w1) / 2),
    new THREE.Vector2(b[0] - (nx * w1) / 2, b[1] - (ny * w1) / 2),
    new THREE.Vector2(a[0] - (nx * w0) / 2, a[1] - (ny * w0) / 2),
  ])
  const bevel = Math.min(w0, w1, depth) * 0.22
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, depth - bevel * 2), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2 })
  g.translate(0, 0, z - (depth - bevel * 2) / 2)
  return g
}

function roundedRect(path, w, h, r) {
  const x = -w / 2
  const y = -h / 2
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  path.lineTo(x + w, y + h - r)
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  path.lineTo(x + r, y + h)
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  path.lineTo(x, y + r)
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return path
}

/** Flat rounded-rectangle frame lying in the XZ plane (thickness along Y) — machined cooling-fin edges. */
export function finRing(w, d, radius, border, thickness) {
  const shape = roundedRect(new THREE.Shape(), w, d, radius)
  shape.holes.push(roundedRect(new THREE.Path(), w - border * 2, d - border * 2, Math.max(0.001, radius - border)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 6 })
  g.translate(0, 0, -thickness / 2)
  g.rotateX(Math.PI / 2)
  return g
}
