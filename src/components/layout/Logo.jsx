import { Link } from 'react-router'
import { site } from '../../config/site.js'

export function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lf-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a45" />
          <stop offset="0.55" stopColor="#ff4d8d" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0f1119" />
      <path d="M32 10 52 21v22L32 54 12 43V21z" fill="none" stroke="url(#lf-logo)" strokeWidth="4" strokeLinejoin="round" />
      <path d="M12 21l20 11 20-11M32 32v22" fill="none" stroke="url(#lf-logo)" strokeWidth="4" strokeLinejoin="round" opacity="0.7" />
      <path d="M20 38h24M20 44h24" stroke="#ff7a45" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="brand" onClick={onClick} aria-label={`${site.name} home`}>
      <LogoMark />
      <span>
        {site.name}
        <span className="brand-tag">{site.mark}</span>
      </span>
    </Link>
  )
}
