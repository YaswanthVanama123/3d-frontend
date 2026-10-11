import { View } from '@react-three/drei'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { iconFor } from '../../lib/icons.js'
import { formatPriceShort } from '../../lib/format.js'
import { Visual } from '../../three/visuals/index.jsx'

/** Card with its own live 3D scene (rendered on the shared canvas) and a pointer-driven tilt. */
export default function ServiceCard({ service, index, currency, onDetails }) {
  const ref = useRef(null)
  const card = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const [hovered, setHovered] = useState(false)
  const Icon = iconFor(service.visual)

  const tilt = (e) => {
    const el = card.current
    if (!el || e.pointerType === 'touch') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${x * 7}deg`)
    el.style.setProperty('--rx', `${-y * 7}deg`)
  }
  const reset = () => {
    setHovered(false)
    card.current?.style.setProperty('--ry', '0deg')
    card.current?.style.setProperty('--rx', '0deg')
  }

  return (
    <motion.div
      ref={ref}
      className="service-cell"
      initial={{ opacity: 0, y: 34 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay: (index % 4) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <article
        ref={card}
        className="service-card glass"
        style={{ '--card-accent': service.accent }}
        onPointerEnter={() => setHovered(true)}
        onPointerMove={tilt}
        onPointerLeave={reset}
      >
        <div className="service-visual">
          <View className="view">
            <Visual name={service.visual} active={inView} hovered={hovered} accent={service.accent} />
          </View>
          {service.popular && <span className="badge badge-accent">Popular</span>}
        </div>
        {/* These five rows are shared with the other cards in the row (CSS subgrid), so they line up. */}
        <div className="service-kicker">
          <Icon size={15} aria-hidden="true" />
          {service.pricingMode === 'instant' ? 'Instant quote' : 'Custom quote'} · {service.turnaround}
        </div>
        <h3>{service.name}</h3>
        <p className="tagline">{service.tagline}</p>
        <ul className="feature-list">
          {service.features.slice(0, 3).map((f) => (
            <li key={f}>
              <Check size={14} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
        <div className="service-foot">
          <div className="price-from">
            From
            <strong>{formatPriceShort(service.startingPrice, currency)}</strong>
            {service.priceUnit} + GST
          </div>
          <button type="button" className="details-btn" onClick={() => onDetails(service)}>
            Details
          </button>
          <Link className="btn btn-glass btn-sm service-order" to={`/order?service=${service.slug}`} aria-label={`Order ${service.name}`}>
            Order now <ArrowRight size={15} />
          </Link>
        </div>
      </article>
    </motion.div>
  )
}
