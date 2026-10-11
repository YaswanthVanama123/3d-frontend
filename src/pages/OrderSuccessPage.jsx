import { View } from '@react-three/drei'
import { ArrowRight, Check, CheckCircle2, Copy } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { formatDate, formatMoney } from '../lib/format.js'
import { Visual } from '../three/visuals/index.jsx'
import '../styles/order.css'

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const { state } = useLocation()
  const order = state?.order
  const email = state?.email
  const [copied, setCopied] = useState(false)
  const firstName = order?.customer?.name?.split(' ')[0]
  const isQuote = order?.pricingMode === 'quote'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const trackHref = `/track?order=${encodeURIComponent(orderNumber)}${email ? `&email=${encodeURIComponent(email)}` : ''}`

  return (
    <section className="page">
      <div className="container">
        <motion.div className="success-card glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="success-visual">
            <View className="view">
              <Visual name={isQuote ? 'quote' : 'ship'} active hovered={false} />
            </View>
          </div>
          <div className="success-body">
            <span className="badge badge-accent" style={{ width: 'fit-content' }}>
              <CheckCircle2 size={14} /> {isQuote ? 'Quote request received' : 'Order placed'}
            </span>
            <h1 className="section-title" style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: 0 }}>
              Thank you{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className="section-sub">
              {isQuote
                ? 'An engineer will review your brief and email you a fixed quote within one business day.'
                : 'Our engineers are reviewing your file now. You’ll receive a confirmation email with a secure payment link shortly.'}
            </p>
            <div>
              <div className="panel-label">Your order number</div>
              <div className="order-number">
                {orderNumber}
                <button type="button" className="icon-btn" style={{ width: 34, height: 34 }} onClick={copy} aria-label="Copy order number">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
            {order && (
              <dl className="stat-list">
                <div>
                  <dt>Service</dt>
                  <dd>{order.service.name}</dd>
                </div>
                <div>
                  <dt>{order.pricing?.estimated ? 'Estimate' : 'Total'}</dt>
                  <dd>
                    {order.pricing?.estimated ? 'from ' : ''}
                    {formatMoney(order.pricing?.total, order.pricing?.currency)}
                    {order.pricing?.estimated ? ' + GST' : ''}
                  </dd>
                </div>
                {order.estimatedShipDate && (
                  <div>
                    <dt>Est. dispatch</dt>
                    <dd>{formatDate(order.estimatedShipDate)}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="hero-ctas" style={{ margin: '6px 0 0' }}>
              <Link to={trackHref} className="btn btn-primary">
                Track this order <ArrowRight size={16} />
              </Link>
              <Link to="/" className="btn btn-glass">
                Back to home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
