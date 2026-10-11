import { CheckCircle2, Minus, Plus, TriangleAlert } from 'lucide-react'
import { formatMoney } from '../../lib/format.js'
import { fitsVolume } from '../../lib/order.js'
import Field from '../ui/Field.jsx'

const TECH_NAMES = { fdm: 'FDM', sla: 'Resin', sls: 'Nylon SLS', metal: 'Metal' }

export default function ConfigureStep({ service, catalog, config, onChange, dims, errors }) {
  const materials = catalog.materialsFor(service)
  const material = catalog.materialBySlug[config.material]
  const tech = material?.technology
  const qualities = catalog.qualitiesFor(tech)
  const finishes = catalog.finishesFor(tech)
  const volume = catalog.technologies[tech]?.buildVolumeMm
  const fits = fitsVolume(dims, volume)
  const nextTier = catalog.discountTiers.find((t) => t.min > config.quantity)
  const min = service.minQuantity || 1

  const setQuantity = (q) => onChange({ quantity: Math.max(min, Math.min(10000, Math.round(Number(q) || min))) })
  const toggleFinish = (key) =>
    onChange({ finishes: config.finishes.includes(key) ? config.finishes.filter((k) => k !== key) : [...config.finishes, key] })

  return (
    <div className="step-body">
      <div>
        <p className="group-label">Material</p>
        <fieldset className="option-grid">
          <legend className="visually-hidden">Material</legend>
          {materials.map((m) => {
            const selected = m.slug === config.material
            return (
              <label key={m.slug} className={`option-card ${selected ? 'selected' : ''}`}>
                <input type="radio" name="material" checked={selected} onChange={() => onChange({ material: m.slug })} />
                <span className="option-icon" style={{ background: m.colors[0]?.hex, boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.35)' }} aria-hidden="true" />
                <strong>{m.name}</strong>
                <span className="option-sub">
                  {TECH_NAMES[m.technology]} · {formatMoney(m.pricePerGram, catalog.currency)}/g
                </span>
                <span className="option-meta">
                  {m.bestFor.slice(0, 2).map((b) => (
                    <span key={b} className="badge">
                      {b}
                    </span>
                  ))}
                </span>
                <CheckCircle2 className="check" size={18} aria-hidden="true" />
              </label>
            )
          })}
        </fieldset>
        {errors.material && <p className="field-error">{errors.material}</p>}
      </div>

      {material && (
        <>
          <div className="config-row">
            <Field id="color" label={`Color · ${config.color}`}>
              <div className="swatches" role="group" aria-label="Color">
                {material.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="swatch"
                    style={{ background: c.hex }}
                    aria-pressed={c.name === config.color}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => onChange({ color: c.name })}
                  />
                ))}
              </div>
            </Field>
            <Field id="quality" label="Quality / layer height">
              <div className="segmented" role="group" aria-label="Quality">
                {qualities.map((q) => (
                  <button key={q.key} type="button" aria-pressed={q.key === config.quality} onClick={() => onChange({ quality: q.key })}>
                    {q.name}
                    <small>{q.layer}</small>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="config-row">
            <Field id="quantity" label="Quantity" error={errors.quantity} hint={nextTier ? `Order ${nextTier.min}+ to save ${Math.round(nextTier.rate * 100)}%` : 'Maximum volume discount applied'}>
              <div className="stepper-input">
                <button type="button" onClick={() => setQuantity(config.quantity - 1)} aria-label="Decrease quantity" disabled={config.quantity <= min}>
                  <Minus size={16} />
                </button>
                <input id="quantity" inputMode="numeric" value={config.quantity} onChange={(e) => setQuantity(e.target.value)} aria-label="Quantity" />
                <button type="button" onClick={() => setQuantity(config.quantity + 1)} aria-label="Increase quantity">
                  <Plus size={16} />
                </button>
              </div>
            </Field>
            {tech === 'fdm' ? (
              <Field id="infill" label={`Infill · ${Math.round(config.infill * 100)}%`} hint="Higher infill = stronger, heavier parts.">
                <input id="infill" type="range" min={10} max={100} step={5} value={Math.round(config.infill * 100)} onChange={(e) => onChange({ infill: Number(e.target.value) / 100 })} />
              </Field>
            ) : (
              <Field id="density" label="Density" hint={`${TECH_NAMES[tech]} parts are printed fully dense.`}>
                <span className="badge">100% solid</span>
              </Field>
            )}
          </div>

          <Field id="scale" label={`Scale · ${Math.round(config.scale * 100)}%`}>
            <div className="range-row">
              <input
                id="scale"
                type="range"
                min={10}
                max={400}
                step={5}
                value={Math.round(config.scale * 100)}
                onChange={(e) => onChange({ scale: Number(e.target.value) / 100 })}
              />
              <input
                className="input"
                type="number"
                min={5}
                max={2000}
                value={Math.round(config.scale * 100)}
                onChange={(e) => onChange({ scale: Math.max(0.05, Math.min(20, Number(e.target.value) / 100 || 1)) })}
                aria-label="Scale percent"
              />
            </div>
            {dims && (
              <span className={`fit-status ${fits ? 'ok' : 'bad'}`}>
                {fits ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
                {dims.x.toFixed(1)} × {dims.y.toFixed(1)} × {dims.z.toFixed(1)} mm —{' '}
                {fits ? 'fits our build volume' : 'larger than our build volume, we will print it in sections'}
              </span>
            )}
          </Field>

          {finishes.length > 0 && (
            <div>
              <p className="group-label">Finishing (optional, per part)</p>
              <div className="check-grid">
                {finishes.map((f) => (
                  <label key={f.key} className="check-card">
                    <input type="checkbox" checked={config.finishes.includes(f.key)} onChange={() => toggleFinish(f.key)} />
                    <strong>{f.name}</strong>
                    <span>{f.description}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
