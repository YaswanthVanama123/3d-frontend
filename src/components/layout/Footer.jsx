import { Link } from 'react-router'
import { site } from '../../config/site.js'
import { useCatalog } from '../../hooks/useCatalog.jsx'
import Logo from './Logo.jsx'

const STATUS_TEXT = {
  live: 'All systems online',
  loading: 'Connecting…',
  offline: 'Ordering service offline',
}

export default function Footer() {
  const { services, status } = useCatalog()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="footer-blurb">
              {site.tagline} FDM, resin, nylon and metal 3D printing with instant quotes, expert finishing and fast, tracked delivery.
            </p>
            <span className="status-pill" data-status={status}>
              <span className="dot" aria-hidden="true" />
              {STATUS_TEXT[status]}
            </span>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              {services.slice(0, 7).map((s) => (
                <li key={s.slug}>
                  <Link to={`/order?service=${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <Link to="/#process">How it works</Link>
              </li>
              <li>
                <Link to="/#materials">Materials</Link>
              </li>
              <li>
                <Link to="/#showcase">Showcase</Link>
              </li>
              <li>
                <Link to="/#pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/admin">Staff login</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li>
                <Link to="/track">Track an order</Link>
              </li>
              <li>
                <Link to="/#faq">FAQ</Link>
              </li>
              <li>
                <Link to="/#contact">Contact us</Link>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`}>{site.phone}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </span>
          <span className="chip-row">
            {site.socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  )
}
