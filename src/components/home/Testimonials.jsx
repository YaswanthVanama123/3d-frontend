import { Star } from 'lucide-react'
import { testimonials } from '../../config/site.js'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

export default function Testimonials() {
  return (
    <section className="section" id="reviews">
      <div className="container">
        <SectionHeading
          eyebrow="Reviews"
          title={
            <>
              Loved by makers, engineers <span className="gradient-text">& studios</span>
            </>
          }
          sub="Rated 4.9 out of 5 across more than 2,400 verified orders."
        />
        <div className="testimonials">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} as="figure" className="testimonial glass" delay={(i % 3) * 0.08} style={{ margin: 0 }}>
              <div className="stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} size={16} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                <span className="avatar" aria-hidden="true">
                  {initials(t.name)}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
