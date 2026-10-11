import { View } from '@react-three/drei'
import { Check, Search, TriangleAlert } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../api/client.js'
import Field from '../components/ui/Field.jsx'
import { formatDate, formatDateTime, formatMoney } from '../lib/format.js'
import { FLOWS, STATUS_INFO, StatusPill, visualForStatus } from '../lib/status.jsx'
import { Visual } from '../three/visuals/index.jsx'
import '../styles/order.css'

function OrderStatus({ order }) {
  const flow = FLOWS[order.pricingMode] || FLOWS.instant
  const current = flow.indexOf(order.status)
  const history = new Map(order.statusHistory.map((h) => [h.status, h]))
  const notes = order.statusHistory.filter((h) => h.note)

  return (
    <motion.div className="track-result glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <header>
        <div>
          <div className="panel-label">Order {order.orderNumber}</div>
          <h2>{order.service.name}</h2>
          <p className="section-sub" style={{ fontSize: 14 }}>
            Placed {formatDate(order.createdAt)}
            {order.estimatedShipDate && order.status !== 'delivered' ? ` · estimated dispatch ${formatDate(order.estimatedShipDate)}` : ''}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      {order.status === 'cancelled' ? (
        <div className="alert alert-error">
          <TriangleAlert size={18} /> This order was cancelled. Contact us if you think this is a mistake.
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 200 }}>
            <View className="view">
              <Visual name={visualForStatus(order.status)} active hovered={false} />
            </View>
          </div>
          <div className="progress-track" style={{ '--steps': flow.length }} role="img" aria-label={`Step ${current + 1} of ${flow.length}: ${STATUS_INFO[order.status]?.label}`}>
            {flow.map((s, i) => (
              <span key={s} data-done={i <= current} />
            ))}
          </div>
          <ol className="timeline">
            {flow.map((s, i) => {
              const state = i < current ? 'done' : i === current ? 'current' : 'todo'
              const entry = history.get(s)
              const Icon = STATUS_INFO[s].icon
              return (
                <li key={s} data-state={state}>
                  <span className="marker">{state === 'done' ? <Check size={14} /> : <Icon size={14} />}</span>
                  <div>
                    <strong>{STATUS_INFO[s].label}</strong>
                    <span>{entry ? formatDateTime(entry.at) : STATUS_INFO[s].text}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}

      {order.shipping?.trackingNumber && (
        <div className="alert alert-info">
          <Check size={18} /> Shipped with {order.shipping.carrier || 'our courier'} · tracking number <strong>{order.shipping.trackingNumber}</strong>
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <div className="panel-label">Updates from our team</div>
          <ul className="note-list">
            {notes.map((n) => (
              <li key={`${n.status}-${n.at}`}>
                <span>{formatDateTime(n.at)}</span>
                {n.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="stat-list">
        <div>
          <dt>{order.pricing?.estimated ? 'Estimate' : 'Total'}</dt>
          <dd>
            {order.pricing?.estimated ? 'from ' : ''}
            {formatMoney(order.pricing?.total, order.pricing?.currency)}
            {order.pricing?.estimated ? ' + GST' : ''}
          </dd>
        </div>
        {order.config?.material?.name && (
          <div>
            <dt>Material</dt>
            <dd>
              {order.config.material.name}
              {order.config.color?.name ? ` · ${order.config.color.name}` : ''}
            </dd>
          </div>
        )}
        <div>
          <dt>Quantity</dt>
          <dd>{order.config?.quantity ?? 1}</dd>
        </div>
        {order.file?.originalName && (
          <div>
            <dt>File</dt>
            <dd style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.file.originalName}</dd>
          </div>
        )}
      </dl>
    </motion.div>
  )
}

export default function TrackPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ orderNumber: params.get('order') || '', email: params.get('email') || '' })
  const [state, setState] = useState({ status: 'idle', order: null, error: '' })

  const lookup = async (e) => {
    e?.preventDefault()
    if (!form.orderNumber.trim() || !form.email.trim()) {
      setState({ status: 'error', order: null, error: 'Enter your order number and the email you ordered with.' })
      return
    }
    setState((s) => ({ ...s, status: 'loading', error: '' }))
    try {
      const order = await api.track(form.orderNumber.trim(), form.email.trim())
      setState({ status: 'done', order, error: '' })
    } catch (err) {
      setState({ status: 'error', order: null, error: err.message })
    }
  }

  useEffect(() => {
    if (params.get('order') && params.get('email')) lookup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="page">
      <div className="container">
        <div className="page-head">
          <span className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" /> Order tracking
          </span>
          <h1>
            Where’s my <span className="gradient-text">print?</span>
          </h1>
          <p>Enter the order number from your confirmation and the email you ordered with.</p>
        </div>
        <div className="track-layout">
          <form className="track-form glass" onSubmit={lookup}>
            <Field id="t-order" label="Order number">
              <input
                id="t-order"
                className="input"
                placeholder="LF-7K2M9Q"
                value={form.orderNumber}
                onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value.toUpperCase() }))}
                autoComplete="off"
              />
            </Field>
            <Field id="t-email" label="Email">
              <input id="t-email" type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" />
            </Field>
            {state.status === 'error' && (
              <div className="alert alert-error" role="alert">
                <TriangleAlert size={18} /> {state.error}
              </div>
            )}
            <button className="btn btn-primary" type="submit" disabled={state.status === 'loading'}>
              {state.status === 'loading' ? <span className="spinner" aria-hidden="true" /> : <Search size={16} />} Track order
            </button>
          </form>
          {state.order ? (
            <OrderStatus order={state.order} />
          ) : (
            <div className="track-result glass" style={{ minHeight: 320 }}>
              <div style={{ position: 'relative', height: 240 }}>
                <View className="view">
                  <Visual name="print" active hovered={false} />
                </View>
              </div>
              <p className="section-sub" style={{ textAlign: 'center', fontSize: 15 }}>
                Your order’s live status, timeline and tracking number will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
