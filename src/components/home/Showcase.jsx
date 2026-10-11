import { View } from '@react-three/drei'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { industries, showcaseProjects } from '../../config/site.js'
import ShowcaseStage from '../../three/ShowcaseStage.jsx'
import { prefersReducedMotion } from '../../three/pointer.js'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

export default function Showcase() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const section = useRef(null)
  const n = showcaseProjects.length
  const project = showcaseProjects[index]
  const inView = useInView(section, { margin: '-20% 0px -20% 0px' })
  const go = (delta) => setIndex((i) => (i + delta + n) % n)

  // Auto-advance only while the turntable is on screen and the visitor isn't interacting with it.
  useEffect(() => {
    if (paused || !inView || prefersReducedMotion()) return
    const id = setInterval(() => setIndex((i) => (i + 1) % n), 5000)
    return () => clearInterval(id)
  }, [paused, inView, n])

  return (
    <section
      className="section"
      id="showcase"
      ref={section}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container">
        <SectionHeading
          eyebrow="Showcase"
          title={
            <>
              Made at <span className="gradient-text">LayerForge</span>
            </>
          }
          sub="A few recent builds from our customers — spin through the turntable to see what each process can do."
        />
        <Reveal>
          <div className="showcase-stage">
            <View className="view">
              <ShowcaseStage projects={showcaseProjects} index={index} />
            </View>
          </div>
          <div className="showcase-caption glass" aria-live="polite">
            <button type="button" className="icon-btn prev" onClick={() => go(-1)} aria-label="Previous project">
              <ChevronLeft size={20} />
            </button>
            <div className="showcase-info">
              <h3>{project.name}</h3>
              <p>for {project.client}</p>
              <div className="showcase-meta">
                <span className="badge badge-accent">{project.tech}</span>
                <span className="badge">{project.material}</span>
                <span className="badge">{project.size}</span>
                <span className="badge">Print time {project.time}</span>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next project">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="showcase-dots" role="group" aria-label="Choose project">
            {showcaseProjects.map((p, i) => (
              <button key={p.name} type="button" aria-label={p.name} aria-current={i === index} onClick={() => setIndex(i)} />
            ))}
          </div>
        </Reveal>

        <Reveal className="section-head" delay={0.1} style={{ marginTop: 88, marginBottom: 24 }}>
          <h3 className="section-title" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
            Trusted across industries
          </h3>
        </Reveal>
        <Reveal className="industries" delay={0.15}>
          {industries.map((name) => (
            <span key={name} className="industry">
              {name}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
