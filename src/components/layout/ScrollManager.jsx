import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Scrolls to the top on page changes, or to the #section in the URL once it has rendered. */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    let tries = 0
    let timer
    const tryScroll = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else if (tries++ < 20) timer = setTimeout(tryScroll, 60)
    }
    tryScroll()
    return () => clearTimeout(timer)
  }, [pathname, hash])

  return null
}
