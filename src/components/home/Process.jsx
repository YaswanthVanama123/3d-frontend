import { View } from '@react-three/drei'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { processSteps } from '../../config/site.js'
import { Visual } from '../../three/visuals/index.jsx'
import { SectionHeading } from '../ui/Reveal.jsx'

function Step({ step, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.article
      ref={ref}
      className="process-step glass"
      initial={{ opacity: 0, y: 34 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div className="process-visual">
        <View className="view">
          <Visual name={step.visual} active={inView} hovered={hovered} />
        </View>
      </div>
      <div className="process-text">
        <span className="step-num">{index + 1}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </div>
    </motion.article>
  )
}

export default function Process() {
  return (
    <section className="section" id="process">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From upload to doorstep in <span className="gradient-text">four steps</span>
            </>
          }
          sub="No emails back and forth. Upload, configure and pay online — we handle engineering review, printing, finishing and shipping."
        />
        <div className="process-grid">
          {processSteps.map((step, i) => (
            <Step key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
