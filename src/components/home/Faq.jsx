import { Plus } from 'lucide-react'
import { faqs } from '../../config/site.js'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

export default function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" sub="Can’t find what you’re looking for? Our engineers reply within a few hours." />
        <div className="faq-list">
          {faqs.map((item, i) => (
            <Reveal key={item.q} delay={Math.min(i, 4) * 0.05}>
              <details className="faq-item glass" name="faq">
                <summary>
                  {item.q}
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
