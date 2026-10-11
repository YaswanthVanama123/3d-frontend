import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Procedural, closed (printable) solids used across the site. 1 scene unit ≈ 100 mm.
// Each printable shape also exports a radius function so a virtual nozzle can trace its outline.

const TAU = Math.PI * 2
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

function toMergeable(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
  }
  if (!g.attributes.normal) g.computeVertexNormals()
  g.morphAttributes = {}
  return g
}

export function mergeParts(parts) {
  const merged = mergeGeometries(parts.map(toMergeable), false)
  if (!merged) throw new Error('mergeParts: incompatible geometries')
  return merged
}

/** Sits the geometry on y = 0 (XZ stays centred on the axis the radius functions assume). */
function finalize(geometry) {
  geometry.computeBoundingBox()
  geometry.translate(0, -geometry.boundingBox.min.y, 0)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function profileRadius(profile, y) {
  if (y <= profile[0][1]) return profile[0][0]
  for (let i = 1; i < profile.length; i++) {
    const [r1, y1] = profile[i]
    const [r0, y0] = profile[i - 1]
    if (y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0 || 1))
  }
  return profile[profile.length - 1][0]
}

const lathe = (profile, segments) =>
  new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  )

// ── Spiral vase ────────────────────────────────────────────────────────────────
export const VASE = { height: 1.6, radius: 0.5, lobes: 7, twist: Math.PI / 2, ripple: 0.085, wall: 0.028, floor: 0.03 }

export function vaseRadius(theta, t, v = VASE) {
  const profile = 0.62 + 0.42 * Math.sin(t * Math.PI * 0.92 + 0.32) - 0.08 * t + 0.26 * smoothstep(0.8, 1, t) ** 2
  return v.radius * profile * (1 + v.ripple * Math.cos(v.lobes * (theta + v.twist * t)))
}

/** Closed solid: outer wall, inner wall, rim and floor — so its volume is real and it can be ordered. */
export function createVaseGeometry({ segments = 128, rows = 150, ...overrides } = {}) {
  const v = { ...VASE, ...overrides }
  const positions = []
  const indices = []

  const ring = (y, t, inset) => {
    const start = positions.length / 3
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * TAU
      const r = vaseRadius(theta, t, v) - inset
      positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r)
    }
    return start
  }
  const center = (y) => {
    positions.push(0, y, 0)
    return positions.length / 3 - 1
  }
  const stitch = (lower, upper, flip) => {
    for (let i = 0; i < segments; i++) {
      const n = (i + 1) % segments
      const a = lower + i
      const b = upper + i
      const c = lower + n
      const d = upper + n
      if (flip) indices.push(a, c, b, b, c, d)
      else indices.push(a, b, c, b, d, c)
    }
  }
  const fan = (c, start, up) => {
    for (let i = 0; i < segments; i++) {
      const n = (i + 1) % segments
      if (up) indices.push(c, start + n, start + i)
      else indices.push(c, start + i, start + n)
    }
  }

  const outer = []
  for (let j = 0; j <= rows; j++) outer.push(ring((j / rows) * v.height, j / rows, 0))
  for (let j = 0; j < rows; j++) stitch(outer[j], outer[j + 1], false)

  const inner = []
  for (let j = 0; j <= rows; j++) inner.push(ring(v.floor + (j / rows) * (v.height - v.floor), j / rows, v.wall))
  for (let j = 0; j < rows; j++) stitch(inner[j], inner[j + 1], true)

  // Rim and caps use their own rings so the edges stay crisp.
  stitch(ring(v.height, 1, 0), ring(v.height, 1, v.wall), false)
  fan(center(0), ring(0, 0, 0), false)
  fan(center(v.floor), ring(v.floor, 0, v.wall), true)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return finalize(geometry)
}

// ── Gears ──────────────────────────────────────────────────────────────────────
export const GEAR = {
  big: { teeth: 18, outer: 0.62, root: 0.54, height: 0.22, holes: 6 },
  small: { teeth: 10, outer: 0.34, root: 0.28, height: 0.36, holes: 0 },
  bore: 0.1,
}
export const GEAR_HEIGHT = GEAR.big.height + GEAR.small.height

function toothRadius(angle, teeth, outer, root) {
  const pitch = TAU / teeth
  const f = (((angle % pitch) + pitch) % pitch) / pitch
  if (f < 0.2) return root + (outer - root) * (f / 0.2)
  if (f < 0.45) return outer
  if (f < 0.65) return outer - (outer - root) * ((f - 0.45) / 0.2)
  return root
}

function gearShape({ teeth, outer, root, holes = 0 }, bore) {
  const shape = new THREE.Shape()
  const pitch = TAU / teeth
  const corners = [
    [0, root],
    [0.2, outer],
    [0.45, outer],
    [0.65, root],
  ]
  for (let k = 0; k < teeth; k++) {
    for (const [f, r] of corners) {
      const a = (k + f) * pitch
      if (k === 0 && f === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
  }
  shape.closePath()
  const hole = (x, y, r) => {
    const path = new THREE.Path()
    path.absarc(x, y, r, 0, TAU, true)
    shape.holes.push(path)
  }
  if (bore) hole(0, 0, bore)
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * TAU + Math.PI / holes
    hole(Math.cos(a) * root * 0.58, Math.sin(a) * root * 0.58, root * 0.17)
  }
  return shape
}

function extrudeUp(shape, height, bevel = 0.012) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, height - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 2,
    curveSegments: 18,
  })
  g.rotateX(-Math.PI / 2)
  g.translate(0, bevel, 0)
  return g
}

/** A single spur gear lying flat, y ∈ [0, height]. */
export function createSpurGearGeometry({ teeth = 14, outer = 0.5, root = 0.43, height = 0.18, holes = 5, bore = 0.09 } = {}) {
  return finalize(extrudeUp(gearShape({ teeth, outer, root, holes }, bore), height))
}

/** Compound gear (large spur + small pinion). */
export function createGearGeometry() {
  const big = extrudeUp(gearShape(GEAR.big, GEAR.bore), GEAR.big.height)
  const small = extrudeUp(gearShape(GEAR.small, GEAR.bore), GEAR.small.height)
  small.translate(0, GEAR.big.height, 0)
  return finalize(mergeParts([big, small]))
}

export function gearRadiusAt(theta, t) {
  const g = t * GEAR_HEIGHT < GEAR.big.height ? GEAR.big : GEAR.small
  // Shape angles map to world angles with a sign flip after rotating the extrusion upright.
  return toothRadius(-theta, g.teeth, g.outer, g.root)
}

// ── Chess king ─────────────────────────────────────────────────────────────────
const KING_PROFILE = [
  [0, 0], [0.4, 0], [0.42, 0.03], [0.42, 0.07], [0.37, 0.1], [0.36, 0.13], [0.39, 0.16], [0.3, 0.22],
  [0.24, 0.3], [0.19, 0.45], [0.16, 0.65], [0.15, 0.82], [0.22, 0.86], [0.27, 0.9], [0.21, 0.94], [0.17, 0.98],
  [0.2, 1.06], [0.25, 1.16], [0.27, 1.22], [0.22, 1.27], [0.12, 1.31], [0, 1.32],
]
export const KING_HEIGHT = 1.56

export function createKingGeometry(segments = 72) {
  const post = new THREE.BoxGeometry(0.075, 0.26, 0.075)
  post.translate(0, 1.43, 0)
  const bar = new THREE.BoxGeometry(0.22, 0.07, 0.075)
  bar.translate(0, 1.47, 0)
  return finalize(mergeParts([lathe(KING_PROFILE, segments), post, bar]))
}

export function kingRadiusAt(_theta, t) {
  const y = t * KING_HEIGHT
  if (y > 1.435 && y < 1.505) return 0.1
  if (y > 1.3) return 0.045
  return profileRadius(KING_PROFILE, y)
}

// ── Rocket ─────────────────────────────────────────────────────────────────────
const ROCKET_PROFILE = [
  [0, 0], [0.13, 0], [0.17, 0.05], [0.15, 0.11], [0.2, 0.15], [0.22, 0.22], [0.22, 0.95],
  [0.21, 1.05], [0.18, 1.17], [0.13, 1.29], [0.07, 1.39], [0.025, 1.46], [0, 1.48],
]
export const ROCKET_HEIGHT = 1.48

export function createRocketGeometry(segments = 64) {
  const parts = [lathe(ROCKET_PROFILE, segments)]
  const fin = new THREE.Shape()
  fin.moveTo(0, 0.16)
  fin.lineTo(0.24, 0)
  fin.lineTo(0.27, 0.13)
  fin.lineTo(0.06, 0.56)
  fin.lineTo(0, 0.6)
  fin.closePath()
  for (let k = 0; k < 3; k++) {
    const g = new THREE.ExtrudeGeometry(fin, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 })
    g.translate(0.19, 0, -0.02)
    g.rotateY((k / 3) * TAU + Math.PI / 6)
    parts.push(g)
  }
  const band = new THREE.TorusGeometry(0.222, 0.014, 10, 64)
  band.rotateX(Math.PI / 2)
  band.translate(0, 0.9, 0)
  parts.push(band)
  const porthole = new THREE.TorusGeometry(0.07, 0.016, 10, 32)
  porthole.translate(0, 0.72, 0.212)
  parts.push(porthole)
  return finalize(mergeParts(parts))
}

export const rocketRadiusAt = (_theta, t) => profileRadius(ROCKET_PROFILE, t * ROCKET_HEIGHT)

// ── Heart (upright, facing +Z, centred) ───────────────────────────────────────
export function createHeartGeometry({ depth = 0.18 } = {}) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.42)
  s.bezierCurveTo(0.08, -0.32, 0.52, -0.06, 0.52, 0.2)
  s.bezierCurveTo(0.52, 0.42, 0.34, 0.54, 0.2, 0.54)
  s.bezierCurveTo(0.09, 0.54, 0.02, 0.47, 0, 0.38)
  s.bezierCurveTo(-0.02, 0.47, -0.09, 0.54, -0.2, 0.54)
  s.bezierCurveTo(-0.34, 0.54, -0.52, 0.42, -0.52, 0.2)
  s.bezierCurveTo(-0.52, -0.06, -0.08, -0.32, 0, -0.42)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 6, curveSegments: 32 })
  g.center()
  return g
}

// ── Impeller (metal showcase) ──────────────────────────────────────────────────
export function createImpellerGeometry({ blades = 9 } = {}) {
  const parts = []
  const disk = new THREE.CylinderGeometry(0.7, 0.72, 0.06, 72)
  disk.translate(0, 0.03, 0)
  parts.push(disk)
  const hub = new THREE.CylinderGeometry(0.13, 0.2, 0.5, 40)
  hub.translate(0, 0.25, 0)
  parts.push(hub)
  const nose = new THREE.SphereGeometry(0.13, 32, 12, 0, TAU, 0, Math.PI / 2)
  nose.translate(0, 0.5, 0)
  parts.push(nose)

  for (let b = 0; b < blades; b++) {
    const base = (b / blades) * TAU
    const blade = new THREE.BoxGeometry(0.5, 0.32, 0.03, 14, 1, 1)
    const pos = blade.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 0.42 // 0.17 … 0.67 from the axis
      const y = pos.getY(i) + 0.16 // 0 … 0.32
      const z = pos.getZ(i)
      const u = (x - 0.17) / 0.5
      const a = base + 0.95 * u * u // swept-back blade
      const yy = 0.06 + y * (1 - 0.55 * u)
      pos.setXYZ(i, Math.cos(a) * x - Math.sin(a) * z, yy, Math.sin(a) * x + Math.cos(a) * z)
    }
    blade.computeVertexNormals()
    parts.push(blade)
  }
  return finalize(mergeParts(parts))
}

// ── Lattice cube (SLS showcase) ────────────────────────────────────────────────
export function createLatticeGeometry({ size = 0.8, cells = 3, strut = 0.05 } = {}) {
  const parts = []
  const step = size / cells
  const half = size / 2
  for (let i = 0; i <= cells; i++) {
    for (let j = 0; j <= cells; j++) {
      const a = -half + i * step
      const b = -half + j * step
      const x = new THREE.BoxGeometry(size + strut, strut, strut)
      x.translate(0, a, b)
      const y = new THREE.BoxGeometry(strut, size + strut, strut)
      y.translate(a, 0, b)
      const z = new THREE.BoxGeometry(strut, strut, size + strut)
      z.translate(a, b, 0)
      parts.push(x, y, z)
    }
  }
  return finalize(mergeParts(parts))
}

// ── Shared instances ───────────────────────────────────────────────────────────
// Geometries are immutable and reused by every scene (three uploads them once per renderer).
const cache = new Map()
export function shared(key, factory) {
  if (!cache.has(key)) cache.set(key, factory())
  return cache.get(key)
}

export const geometries = {
  vase: () => shared('vase', () => createVaseGeometry()),
  vaseLite: () => shared('vase-lite', () => createVaseGeometry({ segments: 84, rows: 90 })),
  gear: () => shared('gear', createGearGeometry),
  spur: () => shared('spur', () => createSpurGearGeometry()),
  king: () => shared('king', () => createKingGeometry()),
  rocket: () => shared('rocket', () => createRocketGeometry()),
  heart: () => shared('heart', () => createHeartGeometry()),
  impeller: () => shared('impeller', () => createImpellerGeometry()),
  lattice: () => shared('lattice', () => createLatticeGeometry()),
  knot: () => shared('knot', () => new THREE.TorusKnotGeometry(0.4, 0.13, 200, 28, 2, 3)),
}
