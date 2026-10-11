import { useCallback, useMemo, useState } from 'react'
import { useCatalog } from '../../hooks/useCatalog.jsx'
import { SectionHeading } from '../ui/Reveal.jsx'
import ServiceCard from './ServiceCard.jsx'
import ServiceModal from './ServiceModal.jsx'

const FILTERS = [
  { key: 'all', label: 'All services' },
  { key: 'printing', label: '3D printing' },
  { key: 'design', label: 'Design & scanning' },
  { key: 'finishing', label: 'Finishing' },
]

export default function Services() {
  const { services, currency } = useCatalog()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const closeModal = useCallback(() => setSelected(null), [])

  const counts = useMemo(() => {
    const c = { all: services.length }
    for (const s of services) c[s.category] = (c[s.category] || 0) + 1
    return c
  }, [services])
  const list = filter === 'all' ? services : services.filter((s) => s.category === filter)

  return (
    <section className="section" id="services">
      <div className="container">
        <SectionHeading
          eyebrow="Our services"
          title={
            <>
              Everything from <span className="gradient-text">idea to object</span>
            </>
          }
          sub={`${services.length} services under one roof. Every card is a live 3D preview — hover to speed it up, then order online in minutes. Prices in ₹, excluding GST.`}
        />
        <div className="filter-row" role="group" aria-label="Filter services">
          {FILTERS.filter((f) => counts[f.key]).map((f) => (
            <button key={f.key} type="button" className="filter-btn" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="services-grid">
          {list.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} currency={currency} onDetails={setSelected} />
          ))}
        </div>
      </div>
      <ServiceModal service={selected} currency={currency} onClose={closeModal} />
    </section>
  )
}
