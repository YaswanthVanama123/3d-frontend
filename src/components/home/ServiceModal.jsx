import { Canvas } from '@react-three/fiber'
import { ArrowRight, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { formatPriceShort } from '../../lib/format.js'
import { Visual } from '../../three/visuals/index.jsx'
import WebGLBoundary from '../../three/WebGLBoundary.jsx'

/** Service details dialog. It sits above the shared canvas, so it renders its scene in its own small canvas. */
export default function ServiceModal({ service, currency, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!service) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [service, onClose])

  return createPortal(
    <AnimatePresence>
      {service && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            style={{ '--card-accent': service.accent }}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <button ref={closeRef} type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close details">
              <X size={18} />
            </button>
            <div className="modal-visual">
              <WebGLBoundary>
                <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => (gl.localClippingEnabled = true)}>
                  <Visual name={service.visual} active hovered={false} accent={service.accent} />
                </Canvas>
              </WebGLBoundary>
            </div>
            <div className="modal-body">
              <span className="badge badge-accent">{service.pricingMode === 'instant' ? 'Instant online quote' : 'Custom quote in 24 h'}</span>
              <h3 id="service-modal-title">{service.name}</h3>
              <p className="section-sub">{service.description}</p>
              <dl className="modal-stats">
                <div>
                  <dt>From</dt>
                  <dd>
                    {formatPriceShort(service.startingPrice, currency)} <small>{service.priceUnit}</small>
                  </dd>
                </div>
                <div>
                  <dt>Turnaround</dt>
                  <dd>{service.turnaround}</dd>
                </div>
                <div>
                  <dt>Min. quantity</dt>
                  <dd>{service.minQuantity}</dd>
                </div>
              </dl>
              <ul className="feature-list" style={{ '--card-accent': service.accent }}>
                {service.features.map((f) => (
                  <li key={f}>
                    <Check size={15} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link className="btn btn-primary" to={`/order?service=${service.slug}`} onClick={onClose}>
                {service.pricingMode === 'instant' ? 'Get an instant quote' : 'Request a quote'} <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
