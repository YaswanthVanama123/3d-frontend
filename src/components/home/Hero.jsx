import { ArrowRight, Box } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { heroStats } from '../../config/site.js'
import HeroCanvas from '../../three/hero/HeroCanvas.jsx'
import { hasWebGL } from '../../three/pointer.js'
import WebGLBoundary from '../../three/WebGLBoundary.jsx'
import HeroHud from './HeroHud.jsx'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.2, 0.8, 0.2, 1] } } }

function HeroFallback() {
  return (
    <div className="hero-fallback">
      <Box size={280} strokeWidth={0.6} />
    </div>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px 0px -5% 0px' })
  const [webgl] = useState(hasWebGL)

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero-glow" aria-hidden="true" />

      <div className="container hero-inner">
        <motion.div className="hero-copy" variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="eyebrow">
            <span className="pulse-dot" aria-hidden="true" /> 38 printers online · delivering across India
          </motion.span>
          <motion.h1 variants={item}>
            Print the <span className="gradient-text">impossible.</span>
            <span className="h1-sub">Delivered in days.</span>
          </motion.h1>
          <motion.p variants={item} className="lead">
            From a single prototype to 10,000 production parts — FDM, resin, nylon and metal 3D printing with instant quotes, live 3D
            previews of your model, and engineers who check every file.
          </motion.p>
          <motion.div variants={item} className="hero-ctas">
            <Link to="/order" className="btn btn-primary btn-lg">
              Get an instant quote <ArrowRight size={18} />
            </Link>
            <a href="#services" className="btn btn-glass btn-lg">
              Explore services
            </a>
          </motion.div>
          <motion.ul variants={item} className="hero-stats">
            {heroStats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </motion.ul>
          {webgl && (
            <motion.p variants={item} className="hero-hint">
              Drag the printer to look around · it’s printing live.
            </motion.p>
          )}
        </motion.div>
      </div>

      <div className="hero-stage" aria-hidden="true">
        {webgl ? (
          <WebGLBoundary fallback={<HeroFallback />}>
            <HeroCanvas active={inView} />
          </WebGLBoundary>
        ) : (
          <HeroFallback />
        )}
      </div>

      {webgl && <HeroHud />}

      <a href="#services" className="scroll-cue">
        <span aria-hidden="true" />
        Scroll
      </a>
    </section>
  )
}
