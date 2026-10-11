import * as THREE from 'three'
import { STLExporter } from 'three/addons/exporters/STLExporter.js'
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { geometries } from '../three/geometries.js'

export const PREVIEWABLE_EXTS = ['stl', 'obj', '3mf']
export const MODEL_EXTS = ['stl', 'obj', '3mf', 'step', 'stp']
export const REFERENCE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'zip']
export const UNIT_FACTORS = { mm: 1, cm: 10, in: 25.4 }

export const extOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

function groupToGeometry(group) {
  group.updateMatrixWorld(true)
  const parts = []
  group.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return
    const g = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone()
    for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name)
    g.morphAttributes = {}
    g.applyMatrix4(child.matrixWorld)
    parts.push(g)
  })
  if (!parts.length) throw new Error('No printable meshes were found in this file.')
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)
  if (parts.length > 1) parts.forEach((p) => p.dispose())
  return merged
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d

/** Volume (signed tetrahedra), surface area and bounds, in the file's units (assumed mm). */
export function analyzeGeometry(geometry) {
  const pos = geometry.attributes.position.array
  const index = geometry.index?.array
  const triangles = index ? index.length / 3 : pos.length / 9
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i]
    const y = pos[i + 1]
    const z = pos[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  let volume = 0
  let area = 0
  for (let t = 0; t < triangles; t++) {
    const a = (index ? index[t * 3] : t * 3) * 3
    const b = (index ? index[t * 3 + 1] : t * 3 + 1) * 3
    const c = (index ? index[t * 3 + 2] : t * 3 + 2) * 3
    const ax = pos[a], ay = pos[a + 1], az = pos[a + 2]
    const bx = pos[b], by = pos[b + 1], bz = pos[b + 2]
    const cx = pos[c], cy = pos[c + 1], cz = pos[c + 2]
    volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6
    const ux = bx - ax, uy = by - ay, uz = bz - az
    const vx = cx - ax, vy = cy - ay, vz = cz - az
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    area += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2
  }
  return {
    triangles,
    volumeCm3: round(Math.abs(volume) / 1000, 3),
    surfaceCm2: round(area / 100, 2),
    dimensionsMm: { x: round(maxX - minX, 2), y: round(maxY - minY, 2), z: round(maxZ - minZ, 2) },
  }
}

/** Z-up CAD coordinates → Y-up three.js, centred on the plate with its base at y = 0. */
export function toDisplayGeometry(source) {
  const g = source.clone()
  g.rotateX(-Math.PI / 2)
  g.computeBoundingBox()
  const { min, max } = g.boundingBox
  g.translate(-(min.x + max.x) / 2, -min.y, -(min.z + max.z) / 2)
  if (!g.attributes.normal) g.computeVertexNormals()
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}

export async function loadModelFile(file) {
  const ext = extOf(file.name)
  if (!PREVIEWABLE_EXTS.includes(ext)) return { previewable: false, ext, stats: null, geometry: null }
  const buffer = await file.arrayBuffer()
  let geometry
  if (ext === 'stl') geometry = new STLLoader().parse(buffer)
  else if (ext === 'obj') geometry = groupToGeometry(new OBJLoader().parse(new TextDecoder().decode(buffer)))
  else geometry = groupToGeometry(new ThreeMFLoader().parse(buffer))
  if (!geometry.attributes.position?.count) throw new Error('This file does not contain any geometry.')
  const stats = analyzeGeometry(geometry)
  if (!stats.triangles || !Number.isFinite(stats.volumeCm3)) throw new Error('We could not read this model — is the file valid?')
  const display = toDisplayGeometry(geometry)
  geometry.dispose()
  return { previewable: true, ext, stats, geometry: display }
}

// Procedural sample models (exported as real binary STL files) so anyone can try the full order flow.
export const SAMPLE_MODELS = [
  { key: 'vase', label: 'Spiral vase', geometry: geometries.vase, mmPerUnit: 100 },
  { key: 'gear', label: 'Compound gear', geometry: geometries.gear, mmPerUnit: 100 },
  { key: 'king', label: 'Chess king', geometry: geometries.king, mmPerUnit: 60 },
  { key: 'rocket', label: 'Mini rocket', geometry: geometries.rocket, mmPerUnit: 100 },
]

export function createSampleFile(sample) {
  const g = sample.geometry().clone()
  g.scale(sample.mmPerUnit, sample.mmPerUnit, sample.mmPerUnit)
  g.rotateX(Math.PI / 2) // Y-up → Z-up like CAD exports
  const data = new STLExporter().parse(new THREE.Mesh(g), { binary: true })
  g.dispose()
  return new File([data], `sample-${sample.key}.stl`, { type: 'model/stl' })
}
