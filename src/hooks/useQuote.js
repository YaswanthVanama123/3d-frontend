import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

/**
 * Debounced live quote from the backend. While a new price loads, the previous one stays on
 * screen (dimmed) so the panel never flashes or jumps.
 */
export function useQuote(request, enabled) {
  const [state, setState] = useState({ quote: null, loading: false, error: '' })
  const key = enabled ? JSON.stringify(request) : ''

  useEffect(() => {
    if (!key) {
      setState({ quote: null, loading: false, error: '' })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: '' }))
    const timer = setTimeout(() => {
      api
        .quote(JSON.parse(key), controller.signal)
        .then((quote) => setState({ quote, loading: false, error: '' }))
        .catch((err) => {
          if (err.name !== 'AbortError') setState({ quote: null, loading: false, error: err.message })
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key])

  return state
}
