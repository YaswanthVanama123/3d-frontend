import { View } from '@react-three/drei'
import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCatalog } from '../../hooks/useCatalog.jsx'
import { formatMoney } from '../../lib/format.js'
import MaterialStage from '../../three/MaterialStage.jsx'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

const TECH_ORDER = ['fdm', 'sla', 'sls', 'metal']
const TECH_LABELS = { fdm: 'FDM plastics', sla: 'Resins', sls: 'Nylon', metal: 'Metals' }
const PROPERTIES = [
  ['strength', 'Strength'],
  ['flexibility', 'Flexibility'],
  ['heatResistance', 'Heat resistance'],
  ['detail', 'Detail'],
]

export default function Materials() {
  const { materials, services, technologies, currency } = useCatalog()
  const techs = TECH_ORDER.filter((t) => materials.some((m) => m.technology === t))
  const [tech, setTech] = useState(techs[0] || 'fdm')
  const [picked, setPicked] = useState({})
  const [colorPick, setColorPick] = useState({})

  const list = materials.filter((m) => m.technology === tech)
  const material = list.find((m) => m.slug === picked[tech]) || list[0]
  const color = material?.colors.find((c) => c.name === colorPick[material.slug]) || material?.colors[0]

  const orderService = useMemo(
    () => services.find((s) => s.pricingMode === 'instant' && s.slug === tech) || services.find((s) => s.pricingMode === 'instant' && s.technologies.includes(tech)),
    [services, tech],
  )

  if (!material) return null

  return (
    <section className="section" id="materials">
      <div className="container">
        <SectionHeading
          eyebrow="Materials lab"
          title={
            <>
              {materials.length} engineering materials, <span className="gradient-text">one click away</span>
            </>
          }
          sub="Pick a material and color — the sample morphs in real time so you can see the finish before you order."
        />
        <div className="materials-layout">
          <Reveal className="material-stage glass">
            <div className="material-stage-view">
              <View className="view">
                <MaterialStage material={material} colorHex={color?.hex} />
              </View>
            </div>
            <div className="material-stage-info">
              <div>
                <h3>{material.name}</h3>
                <p>
                  {technologies[tech]?.fullName} · {color?.name}
                </p>
              </div>
              <div className="price-from">
                From
                <strong>{formatMoney(material.pricePerGram, currency)}</strong>
                per gram
              </div>
            </div>
          </Reveal>

          <Reveal className="material-panel glass" delay={0.1}>
            <div className="tech-tabs" role="tablist" aria-label="Technology">
              {techs.map((t) => (
                <button key={t} type="button" role="tab" className="tech-tab" aria-selected={tech === t} onClick={() => setTech(t)}>
                  {TECH_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="material-list">
              {list.map((m) => (
                <button
                  key={m.slug}
                  type="button"
                  className="material-chip"
                  aria-pressed={m.slug === material.slug}
                  onClick={() => setPicked((p) => ({ ...p, [tech]: m.slug }))}
                >
                  <strong>{m.name}</strong>
                  <span>
                    {formatMoney(m.pricePerGram, currency)}/g · {m.colors.length} {m.colors.length === 1 ? 'color' : 'colors'}
                  </span>
                </button>
              ))}
            </div>

            <p className="material-desc">{material.description}</p>

            <div>
              <div className="panel-label">Properties</div>
              <div className="prop-meters">
                {PROPERTIES.map(([key, label]) => {
                  const value = material.properties?.[key] ?? 0
                  return (
                    <div className="prop-row" key={key}>
                      <span id={`prop-${key}`}>{label}</span>
                      <div className="rating-meter" role="meter" aria-labelledby={`prop-${key}`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={value}>
                        <span style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <b>{value}/5</b>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="panel-label">Best for</div>
              <div className="chip-row">
                {material.bestFor.map((b) => (
                  <span key={b} className="badge">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="panel-label">Colors · {color?.name}</div>
              <div className="swatches" role="group" aria-label="Colors">
                {material.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="swatch"
                    style={{ background: c.hex }}
                    aria-pressed={c.name === color?.name}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setColorPick((p) => ({ ...p, [material.slug]: c.name }))}
                  />
                ))}
              </div>
            </div>

            {orderService && (
              <Link className="btn btn-primary" to={`/order?service=${orderService.slug}&material=${material.slug}`}>
                Order in {material.name} <ArrowRight size={16} />
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
