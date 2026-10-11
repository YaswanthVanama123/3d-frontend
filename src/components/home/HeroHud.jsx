import { useEffect, useRef } from 'react'
import { hud, PHASE_LABELS } from '../../three/hero/hudStore.js'

const fmtEta = (min) => {
  if (min < 1) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h} h ${m.toString().padStart(2, '0')} m` : `${m} m`
}

/** Glass "printer status" panel synced to the hero printer (reads the shared store, no React re-renders). */
export default function HeroHud() {
  const job = useRef(null)
  const material = useRef(null)
  const swatch = useRef(null)
  const phase = useRef(null)
  const pct = useRef(null)
  const bar = useRef(null)
  const layer = useRef(null)
  const nozzle = useRef(null)
  const bed = useRef(null)
  const eta = useRef(null)

  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 120 || !job.current) return
      last = now
      job.current.textContent = hud.job
      material.current.textContent = hud.material
      swatch.current.style.background = hud.color
      phase.current.textContent = PHASE_LABELS[hud.phase]
      phase.current.dataset.phase = hud.phase
      pct.current.textContent = `${Math.round(hud.progress * 100)}%`
      bar.current.style.transform = `scaleX(${hud.progress})`
      layer.current.textContent = `${hud.layer} / ${hud.layers}`
      nozzle.current.textContent = `${hud.nozzle}°C`
      bed.current.textContent = `${hud.bed}°C`
      eta.current.textContent = fmtEta(hud.etaMin)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <aside className="hero-hud glass" aria-label="Live printer status (animation)">
      <div className="hud-head">
        <span className="hud-live">
          <span className="pulse-dot" aria-hidden="true" /> Live
        </span>
        <span ref={phase} className="hud-phase" />
      </div>
      <div className="hud-job">
        <span ref={swatch} className="hud-swatch" aria-hidden="true" />
        <div>
          <strong ref={job} />
          <span ref={material} className="hud-material" />
        </div>
        <span ref={pct} className="hud-pct" />
      </div>
      <div className="meter" aria-hidden="true">
        <span ref={bar} className="meter-fill" />
      </div>
      <dl className="hud-stats">
        <div>
          <dt>Layer</dt>
          <dd ref={layer} />
        </div>
        <div>
          <dt>Nozzle</dt>
          <dd ref={nozzle} />
        </div>
        <div>
          <dt>Bed</dt>
          <dd ref={bed} />
        </div>
        <div>
          <dt>Time left</dt>
          <dd ref={eta} />
        </div>
      </dl>
    </aside>
  )
}
