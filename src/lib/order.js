import { UNIT_FACTORS } from './mesh.js'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const INSTANT_STEPS = [
  { key: 'service', label: 'Service' },
  { key: 'model', label: 'Upload' },
  { key: 'configure', label: 'Configure' },
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
]

export const QUOTE_STEPS = [
  { key: 'service', label: 'Service' },
  { key: 'brief', label: 'Project brief' },
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
]

/** Keeps a print configuration valid for the chosen service + material. */
export function reconcileConfig(service, material, catalog, prev = {}) {
  const qualities = catalog.qualitiesFor(material.technology)
  const keep = qualities.find((q) => q.key === prev.quality)
  const preferred = qualities.find((q) => q.key === service.defaultQuality) || qualities.find((q) => q.key === 'standard') || qualities[0]
  const finishKeys = new Set(catalog.finishesFor(material.technology).map((f) => f.key))
  return {
    infill: 0.2,
    scale: 1,
    units: 'mm',
    ...prev,
    material: material.slug,
    color: material.colors.find((c) => c.name === prev.color)?.name || material.colors[0]?.name || '',
    quality: (keep || preferred)?.key || 'standard',
    finishes: (prev.finishes || []).filter((key) => finishKeys.has(key)),
    quantity: Math.max(prev.quantity || 1, service.minQuantity || 1),
  }
}

export function initialConfig(service, catalog, preferredMaterial, prev) {
  const materials = catalog.materialsFor(service)
  const material = materials.find((m) => m.slug === preferredMaterial) || materials.find((m) => m.slug === prev?.material) || materials[0]
  return material ? reconcileConfig(service, material, catalog, { ...prev, quantity: service.minQuantity || 1 }) : null
}

export function scaledDims(stats, config) {
  if (!stats) return null
  const f = (UNIT_FACTORS[config?.units] || 1) * (config?.scale || 1)
  const d = stats.dimensionsMm
  return { x: d.x * f, y: d.y * f, z: d.z * f }
}

export function fitsVolume(dims, volume) {
  if (!dims || !volume) return true
  const a = [dims.x, dims.y, dims.z].sort((p, q) => p - q)
  const b = [volume.x, volume.y, volume.z].sort((p, q) => p - q)
  return a.every((v, i) => v <= b[i])
}

/** "0.20 mm" → 0.2, "50 µm" → 0.05 */
export function layerHeightMm(layer = '') {
  const value = parseFloat(layer)
  if (!Number.isFinite(value)) return 0.2
  return /µm|um/.test(layer) ? value / 1000 : value
}

export function addBusinessDays(from, days) {
  const date = new Date(from)
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) added++
  }
  return date
}

export function validateStep(step, { service, upload, config, brief, customer, shipping, agree }) {
  const e = {}
  if (step === 'service' && !service) e.service = 'Choose a service to continue.'
  if (step === 'model') {
    if (upload.status === 'loading') e.file = 'Hang on — we are still reading your model.'
    else if (!upload.file) e.file = 'Upload a 3D model (or try one of our samples) to continue.'
  }
  if (step === 'configure') {
    if (!config?.material) e.material = 'Choose a material.'
    const min = service?.minQuantity || 1
    if (!Number.isInteger(config?.quantity) || config.quantity < min) e.quantity = `Minimum quantity is ${min}.`
  }
  if (step === 'brief' && (brief.description || '').trim().length < 10) {
    e['brief.description'] = 'Please describe your project in at least 10 characters.'
  }
  if (step === 'details') {
    if ((customer.name || '').trim().length < 2) e['customer.name'] = 'Please enter your full name.'
    if (!EMAIL_RE.test((customer.email || '').trim())) e['customer.email'] = 'Please enter a valid email address.'
    if (shipping.method !== 'pickup') {
      for (const key of ['address', 'city', 'postalCode', 'country']) {
        if (!(shipping[key] || '').trim()) e[`shipping.${key}`] = 'Required for delivery.'
      }
    }
  }
  if (step === 'review' && !agree) e.agree = 'Please accept the terms to place your order.'
  return e
}

/** Which wizard step owns a server-side validation error path. */
export function stepForField(path = '') {
  if (path.startsWith('customer') || path.startsWith('shipping') || path.startsWith('notes')) return 'details'
  if (path.startsWith('brief')) return 'brief'
  if (path.startsWith('config')) return 'configure'
  return null
}
