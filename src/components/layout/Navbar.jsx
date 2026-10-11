import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { navLinks } from '../../config/site.js'
import Logo from './Logo.jsx'

export default function Navbar({ minimal = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={`nav ${scrolled || open ? 'scrolled' : ''} ${pathname !== '/' ? 'solid' : ''}`}>
      <nav className="nav-inner" aria-label="Main">
        <Logo />
        {!minimal && (
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        )}
        <div className="nav-actions">
          {minimal ? (
            <Link className="btn btn-ghost btn-sm" to="/">
              View site
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm hide-sm" to="/track">
                Track order
              </Link>
              <Link className="btn btn-primary btn-sm" to="/order">
                Order now
              </Link>
              <button
                type="button"
                className="icon-btn nav-toggle"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link to="/track" onClick={() => setOpen(false)}>
              Track order
            </Link>
            <Link className="btn btn-primary btn-lg" to="/order" onClick={() => setOpen(false)}>
              Start an order
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
