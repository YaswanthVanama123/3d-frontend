import Contact from '../components/home/Contact.jsx'
import CtaBand from '../components/home/CtaBand.jsx'
import Faq from '../components/home/Faq.jsx'
import Garage from '../components/home/Garage.jsx'
import Hero from '../components/home/Hero.jsx'
import Marquee from '../components/home/Marquee.jsx'
import Materials from '../components/home/Materials.jsx'
import Pricing from '../components/home/Pricing.jsx'
import Process from '../components/home/Process.jsx'
import Services from '../components/home/Services.jsx'
import Showcase from '../components/home/Showcase.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import '../styles/home.css'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Services />
      <Process />
      <Materials />
      <Garage />
      <Showcase />
      <Pricing />
      <Testimonials />
      <Faq />
      <CtaBand />
      <Contact />
    </>
  )
}
