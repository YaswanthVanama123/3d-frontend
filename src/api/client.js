const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }

  /** Field-level validation messages keyed by dotted path, e.g. { 'customer.email': '…' } */
  get fields() {
    return Object.fromEntries((this.data?.fields || []).map((f) => [f.path, f.message]))
  }
}

const OFFLINE_MESSAGE = 'Cannot reach the LayerForge server. Please make sure the backend is running.'

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const isForm = body instanceof FormData
  const headers = {}
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(OFFLINE_MESSAGE, 0)
  }

  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => null) : null
  if (!res.ok) {
    const message = res.status >= 502 && !data ? OFFLINE_MESSAGE : data?.error || `Request failed (${res.status})`
    throw new ApiError(message, res.status, data)
  }
  return data
}

export const api = {
  catalog: (signal) => request('/catalog', { signal }),
  quote: (body, signal) => request('/quotes', { method: 'POST', body, signal }).then((d) => d.quote),
  track: (orderNumber, email) => request(`/orders/track?${new URLSearchParams({ orderNumber, email })}`).then((d) => d.order),
  contact: (body) => request('/contact', { method: 'POST', body }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),
  admin: {
    stats: (token) => request('/admin/stats', { token }),
    orders: (token, params) => request(`/admin/orders?${new URLSearchParams(params)}`, { token }),
    order: (token, id) => request(`/admin/orders/${id}`, { token }).then((d) => d.order),
    updateOrder: (token, id, body) => request(`/admin/orders/${id}`, { method: 'PATCH', body, token }).then((d) => d.order),
    messages: (token) => request('/admin/messages', { token }).then((d) => d.messages),
    updateMessage: (token, id, status) => request(`/admin/messages/${id}`, { method: 'PATCH', body: { status }, token }),
    catalog: (token) => request('/admin/catalog', { token }),
    updateService: (token, id, body) => request(`/admin/services/${id}`, { method: 'PATCH', body, token }).then((d) => d.service),
    updateMaterial: (token, id, body) => request(`/admin/materials/${id}`, { method: 'PATCH', body, token }).then((d) => d.material),
    async downloadFile(token, id, filename) {
      let res
      try {
        res = await fetch(`${BASE}/admin/orders/${id}/file`, { headers: { Authorization: `Bearer ${token}` } })
      } catch {
        throw new ApiError(OFFLINE_MESSAGE)
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new ApiError(data?.error || 'Download failed', res.status, data)
      }
      const url = URL.createObjectURL(await res.blob())
      const link = Object.assign(document.createElement('a'), { href: url, download: filename || 'model' })
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
  },
}

/** Places an order (multipart upload) and reports upload progress from 0 to 1. */
export function submitOrder(payload, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('payload', JSON.stringify(payload))
    if (file) form.append('file', file, file.name)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/orders`)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      const data = xhr.response
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data.order)
      const message = xhr.status >= 502 && !data ? OFFLINE_MESSAGE : data?.error || `Order failed (${xhr.status})`
      reject(new ApiError(message, xhr.status, data))
    }
    xhr.onerror = () => reject(new ApiError(OFFLINE_MESSAGE))
    xhr.send(form)
  })
}
