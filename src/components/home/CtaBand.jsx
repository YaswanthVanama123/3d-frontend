import { View } from '@react-three/drei'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import CtaStage from '../../three/CtaStage.jsx'
import { Reveal } from '../ui/Reveal.jsx'

export default function CtaBand() {
  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <Reveal className="cta-band">
          <div>
            <h2>
              Ready to hold your idea <span className="gradient-text">in your hands?</span>
            </h2>
            <p>Upload a model and get a price in seconds — or tell us what you need and we’ll design it for you.</p>
            <div className="hero-ctas">
              <Link to="/order" className="btn btn-light btn-lg">
                Start your order <ArrowRight size={18} />
              </Link>
              <Link to="/track" className="btn btn-glass btn-lg">
                Track an order
              </Link>
            </div>
          </div>
          <div className="cta-visual" aria-hidden="true">
            <View className="view">
              <CtaStage />
            </View>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
