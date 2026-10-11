import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import fallback from '../data/catalog.fallback.json'

const CatalogContext = createContext(null)

/**
 * Loads services, materials and pricing options from the backend.
 * Until (or unless) the API answers, a bundled snapshot keeps the landing page fully populated.
 */
export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(fallback)
  const [status, setStatus] = useState('loading') // loading | live | offline

  const load = useCallback((signal) => {
    setStatus('loading')
    return api
      .catalog(signal)
      .then((data) => {
        setCatalog(data)
        setStatus('live')
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('offline')
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const value = useMemo(() => {
    const serviceBySlug = Object.fromEntries(catalog.services.map((s) => [s.slug, s]))
    const materialBySlug = Object.fromEntries(catalog.materials.map((m) => [m.slug, m]))
    return {
      ...catalog,
      status,
      reload: () => load(),
      serviceBySlug,
      materialBySlug,
      materialsFor: (service) => catalog.materials.filter((m) => service?.technologies?.includes(m.technology)),
      finishesFor: (technology) => catalog.finishes.filter((f) => f.technologies.includes(technology)),
      qualitiesFor: (technology) => catalog.qualities[technology] || [],
    }
  }, [catalog, status, load])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return ctx
}
