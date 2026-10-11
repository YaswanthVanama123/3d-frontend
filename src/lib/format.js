// Currency formatting follows the currency's home locale — INR uses Indian digit grouping (₹1,23,456.00).
const LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', AED: 'en-AE' }
const DEFAULT_CURRENCY = 'INR'
const cache = new Map()

function formatter(currency, options) {
  const key = `${currency}:${JSON.stringify(options)}`
  let fmt = cache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALES[currency] || 'en-IN', { style: 'currency', currency, ...options })
    cache.set(key, fmt)
  }
  return fmt
}

export function formatMoney(value, currency = DEFAULT_CURRENCY) {
  if (value == null || Number.isNaN(value)) return '—'
  return formatter(currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

/** Whole-number price for marketing copy ("from ₹299"). */
export function formatPriceShort(value, currency = DEFAULT_CURRENCY) {
  if (value == null || Number.isNaN(value)) return '—'
  const decimals = value % 1 ? 2 : 0
  return formatter(currency, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

/** Compact money for stat tiles: ₹4.1L, ₹2.3Cr (INR) or $4.2K (USD). */
export function formatMoneyCompact(value, currency = DEFAULT_CURRENCY) {
  if (value == null || Number.isNaN(value)) return '—'
  if (Math.abs(value) < 100000) return formatPriceShort(Math.round(value), currency)
  return formatter(currency, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export const formatCompact = (value) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'

export function formatDims(d, digits = 1) {
  if (!d) return '—'
  return `${d.x.toFixed(digits)} × ${d.y.toFixed(digits)} × ${d.z.toFixed(digits)} mm`
}

export function formatHours(hours) {
  if (!hours) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`
}

export const pluralize = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
