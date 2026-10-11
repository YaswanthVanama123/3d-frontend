import { CheckCircle2 } from 'lucide-react'
import { formatPriceShort } from '../../lib/format.js'
import { iconFor } from '../../lib/icons.js'

function ServiceOption({ service, selected, currency, onSelect }) {
  const Icon = iconFor(service.visual)
  return (
    <label className={`option-card ${selected ? 'selected' : ''}`} style={{ '--card-accent': service.accent }}>
      <input type="radio" name="service" value={service.slug} checked={selected} onChange={() => onSelect(service.slug)} />
      <span className="option-icon">
        <Icon size={19} aria-hidden="true" />
      </span>
      <strong>{service.name}</strong>
      <span className="option-sub">{service.tagline}</span>
      <span className="option-meta">
        <span className="badge">
          from {formatPriceShort(service.startingPrice, currency)} {service.priceUnit}
        </span>
        <span className="badge">{service.turnaround}</span>
      </span>
      <CheckCircle2 className="check" size={18} aria-hidden="true" />
    </label>
  )
}

export default function ServiceStep({ services, currency, value, onChange, error }) {
  const instant = services.filter((s) => s.pricingMode === 'instant')
  const custom = services.filter((s) => s.pricingMode !== 'instant')
  return (
    <div className="step-body">
      <div>
        <p className="group-label">3D printing · instant online quote</p>
        <fieldset className="option-grid">
          <legend className="visually-hidden">Printing services</legend>
          {instant.map((s) => (
            <ServiceOption key={s.slug} service={s} selected={value === s.slug} currency={currency} onSelect={onChange} />
          ))}
        </fieldset>
      </div>
      {custom.length > 0 && (
        <div>
          <p className="group-label">Design, scanning & finishing · custom quote</p>
          <fieldset className="option-grid">
            <legend className="visually-hidden">Custom-quote services</legend>
            {custom.map((s) => (
              <ServiceOption key={s.slug} service={s} selected={value === s.slug} currency={currency} onSelect={onChange} />
            ))}
          </fieldset>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
