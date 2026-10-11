import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="page">
      <div className="container page-head">
        <span className="eyebrow">404</span>
        <h1>
          This part didn’t <span className="gradient-text">print</span>.
        </h1>
        <p>The page you’re looking for doesn’t exist or has moved.</p>
        <div className="hero-ctas">
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <Link to="/order" className="btn btn-glass">
            Start an order
          </Link>
        </div>
      </div>
    </section>
  )
}
