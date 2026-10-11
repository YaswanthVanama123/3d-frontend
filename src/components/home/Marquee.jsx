import { Sparkle } from 'lucide-react'
import { industries } from '../../config/site.js'
import { useCatalog } from '../../hooks/useCatalog.jsx'

export default function Marquee() {
  const { materials } = useCatalog()
  const items = [...materials.map((m) => m.name), ...industries]
  const loop = [...items, ...items]

  return (
    <div className="marquee" aria-label="Materials and industries">
      <div className="marquee-track">
        {loop.map((label, i) => (
          <span className="marquee-item" key={`${label}-${i}`} aria-hidden={i >= items.length}>
            <Sparkle size={14} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
