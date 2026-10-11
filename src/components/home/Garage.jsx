import { View } from '@react-three/drei'
import { ArrowRight, Bike } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import GarageStage from '../../three/GarageStage.jsx'
import { printedLengthMm, VEHICLES } from '../../three/vehicles/catalog.js'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

const TABS = [
  { key: 'motorcycle', label: 'Motorcycles' },
  { key: 'scooter', label: 'Scooters' },
]
const SCALES = [
  { value: 24, label: '1:24', note: 'Desk model' },
  { value: 18, label: '1:18', note: 'Collector' },
  { value: 12, label: '1:12', note: 'Showpiece' },
  { value: 6, label: '1:6', note: 'Display' },
]

export default function Garage() {
  const [tab, setTab] = useState('motorcycle')
  const [picked, setPicked] = useState({ motorcycle: 'tvs-ronin', scooter: 'tvs-jupiter' })
  const [colors, setColors] = useState({})
  const [scale, setScale] = useState(12)

  const list = VEHICLES.filter((v) => v.type === tab)
  const vehicle = list.find((v) => v.key === picked[tab]) ?? list[0]
  const color = vehicle.colors.find((c) => c.name === colors[vehicle.key]) ?? vehicle.colors[0]
  const lengthMm = Math.round(printedLengthMm(vehicle.key, scale))
  const orderHref = `/order?service=miniatures&material=resin-8k&vehicle=${vehicle.key}&scale=${scale}&paint=1`

  return (
    <section className="section" id="garage">
      <div className="container">
        <SectionHeading
          eyebrow="Bikes & scooters"
          title={
            <>
              India’s favourite rides, <span className="gradient-text">3D printed</span>
            </>
          }
          sub="Detailed scale models of iconic motorcycles and scooters — printed in high-detail resin and hand-painted in factory colours. Spin one around, pick a colour and order yours."
        />
        <div className="garage-layout">
          <Reveal className="garage-stage glass">
            <div className="garage-view">
              <View className="view">
                <GarageStage vehicleKey={vehicle.key} color={color} />
              </View>
            </div>
            <div className="garage-info">
              <div>
                <span className="garage-brand">{vehicle.brand}</span>
                <h3>{vehicle.name}</h3>
                <p>{vehicle.tagline}</p>
              </div>
              <div className="chip-row">
                <span className="badge">{vehicle.engine}</span>
                <span className="badge">{vehicle.style}</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="garage-panel glass" delay={0.1}>
            <div className="tech-tabs" role="tablist" aria-label="Vehicle type">
              {TABS.map((t) => (
                <button key={t.key} type="button" role="tab" className="tech-tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="vehicle-list">
              {list.map((v) => (
                <button key={v.key} type="button" className="vehicle-chip" aria-pressed={v.key === vehicle.key} onClick={() => setPicked((p) => ({ ...p, [tab]: v.key }))}>
                  <span>{v.brand}</span>
                  <strong>{v.name}</strong>
                </button>
              ))}
            </div>

            <div>
              <div className="panel-label">Colour · {color.name}</div>
              <div className="swatches" role="group" aria-label="Colour">
                {vehicle.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="swatch"
                    style={{ background: c.hex }}
                    aria-pressed={c.name === color.name}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setColors((p) => ({ ...p, [vehicle.key]: c.name }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="panel-label">Print scale · {lengthMm} mm long</div>
              <div className="segmented" role="group" aria-label="Print scale">
                {SCALES.map((s) => (
                  <button key={s.value} type="button" aria-pressed={scale === s.value} onClick={() => setScale(s.value)}>
                    {s.label}
                    <small>{s.note}</small>
                  </button>
                ))}
              </div>
            </div>

            <ul className="feature-list garage-features" style={{ '--card-accent': 'var(--accent)' }}>
              <li>
                <Bike size={15} aria-hidden="true" /> 8K resin · fine 25 µm layers
              </li>
              <li>
                <Bike size={15} aria-hidden="true" /> Hand-painted in {color.name}
              </li>
              <li>
                <Bike size={15} aria-hidden="true" /> Display base & gift box included
              </li>
            </ul>

            <Link className="btn btn-primary" to={orderHref}>
              Order this model — instant price <ArrowRight size={16} />
            </Link>
            <p className="garage-note">Stylised fan replicas for display. Brand names belong to their respective owners.</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
