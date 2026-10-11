import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { plans } from '../../config/site.js'
import { useCatalog } from '../../hooks/useCatalog.jsx'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

export default function Pricing() {
  const { discountTiers, tax } = useCatalog()
  const best = discountTiers[discountTiers.length - 1]

  return (
    <section className="section" id="pricing">
      <div className="container">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Transparent pricing, <span className="gradient-text">no surprises</span>
            </>
          }
          sub="Every order is priced from your model’s real volume, material and finish. Members and high-volume orders save more."
        />
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08} className={`plan glass ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <span className="badge badge-accent">Most popular</span>}
              <h3>{plan.name}</h3>
              <div className="plan-price">
                {plan.price}
                {plan.period && <span> {plan.period}</span>}
              </div>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={16} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link className={`btn ${plan.featured ? 'btn-primary' : 'btn-glass'}`} to={plan.href}>
                {plan.cta}
              </Link>
            </Reveal>
          ))}
        </div>
        {best && (
          <p className="pricing-note">
            Automatic volume discounts on every order: {discountTiers.map((t) => `${t.min}+ parts −${Math.round(t.rate * 100)}%`).join(' · ')}.
            <br />
            All prices are in Indian Rupees (₹){tax?.rate ? ` and exclude ${Math.round(tax.rate * 100)}% ${tax.label}` : ''}.
          </p>
        )}
      </div>
    </section>
  )
}
