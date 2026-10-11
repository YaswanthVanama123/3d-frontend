import { Download, Save, TriangleAlert, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../api/client.js'
import { formatBytes, formatDateTime, formatDims, formatMoney } from '../../lib/format.js'
import { ORDER_STATUSES, STATUS_INFO, StatusPill } from '../../lib/status.jsx'
import Field from '../ui/Field.jsx'

const KV = ({ items }) => (
  <dl className="kv">
    {items
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
  </dl>
)

export default function OrderDrawer({ order, token, call, onClose, onUpdated }) {
  const [form, setForm] = useState({ status: order.status, note: '', carrier: order.shipping?.carrier || '', trackingNumber: order.shipping?.trackingNumber || '', quotedTotal: '' })
  const [state, setState] = useState({ saving: false, error: '', saved: false })
  const money = (v) => formatMoney(v, order.pricing?.currency)
  const c = order.config || {}
  const p = order.pricing || {}

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (e) => {
    e.preventDefault()
    setState({ saving: true, error: '', saved: false })
    const body = { note: form.note }
    if (form.status !== order.status) body.status = form.status
    if (form.carrier !== (order.shipping?.carrier || '')) body.carrier = form.carrier
    if (form.trackingNumber !== (order.shipping?.trackingNumber || '')) body.trackingNumber = form.trackingNumber
    if (form.quotedTotal !== '') body.quotedTotal = Number(form.quotedTotal)
    try {
      const updated = await call((t) => api.admin.updateOrder(t, order.id, body))
      if (!updated) return
      onUpdated(updated)
      setForm((f) => ({ ...f, note: '', quotedTotal: '', status: updated.status }))
      setState({ saving: false, error: '', saved: true })
    } catch (err) {
      setState({ saving: false, error: err.message, saved: false })
    }
  }

  const download = async () => {
    try {
      await api.admin.downloadFile(token, order.id, order.file?.originalName)
    } catch (err) {
      setState((s) => ({ ...s, error: err.message }))
    }
  }

  return createPortal(
    <>
      <motion.div className="drawer-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderNumber}`}
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <header>
          <div>
            <div className="panel-label mono">{order.orderNumber}</div>
            <h2>{order.service.name}</h2>
            <span className="cell-sub">Placed {formatDateTime(order.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill status={order.status} />
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <div className="form-grid">
            <Field id="d-status" label="Status">
              <select id="d-status" className="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_INFO[s].label}
                  </option>
                ))}
              </select>
            </Field>
            {(order.pricingMode === 'quote' || p.estimated) && (
              <Field id="d-quote" label="Quoted total" hint="Sends the final price; moves the request to “Quote sent”.">
                <input id="d-quote" type="number" min={0} step="0.01" className="input" value={form.quotedTotal} onChange={(e) => setForm((f) => ({ ...f, quotedTotal: e.target.value }))} placeholder={String(p.total ?? '')} />
              </Field>
            )}
            {(form.status === 'shipped' || form.status === 'delivered' || order.shipping?.trackingNumber) && (
              <>
                <Field id="d-carrier" label="Carrier">
                  <input id="d-carrier" className="input" value={form.carrier} onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))} />
                </Field>
                <Field id="d-tracking" label="Tracking number">
                  <input id="d-tracking" className="input" value={form.trackingNumber} onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))} />
                </Field>
              </>
            )}
            <Field id="d-note" label="Note to customer (shown on tracking page)" className="span-2">
              <textarea id="d-note" className="textarea" rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
          </div>
          {state.error && (
            <div className="alert alert-error" role="alert">
              <TriangleAlert size={18} /> {state.error}
            </div>
          )}
          {state.saved && (
            <div className="alert alert-success" role="status">
              Order updated.
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={state.saving}>
            {state.saving ? <span className="spinner" aria-hidden="true" /> : <Save size={16} />} Save update
          </button>
        </form>

        <section>
          <h3 className="panel-label">Customer</h3>
          <KV
            items={[
              ['Name', order.customer.name],
              ['Email', <a key="e" href={`mailto:${order.customer.email}`}>{order.customer.email}</a>],
              ['Phone', order.customer.phone],
              ['Company', order.customer.company],
              ['Delivery', order.shipping?.method],
              ['Address', order.shipping?.method !== 'pickup' ? [order.shipping?.address, order.shipping?.postalCode, order.shipping?.city, order.shipping?.state, order.shipping?.country].filter(Boolean).join(', ') : null],
            ]}
          />
        </section>

        {order.pricingMode === 'instant' ? (
          <section>
            <h3 className="panel-label">Print configuration</h3>
            <KV
              items={[
                ['Material', c.material?.name],
                ['Color', c.color?.name],
                ['Quality', c.quality ? `${c.quality.name} · ${c.quality.layer}` : null],
                ['Infill', c.infill != null ? `${Math.round(c.infill * 100)}%` : null],
                ['Quantity', c.quantity],
                ['Scale / units', `${Math.round((c.scale || 1) * 100)}% · ${c.units}`],
                ['Finishing', c.finishes?.length ? c.finishes.map((f) => f.name).join(', ') : 'None'],
                ['Volume', order.model?.volumeCm3 != null ? `${order.model.volumeCm3} cm³ (file, ${order.model.source})` : null],
                ['Size in file', order.model?.dimensionsMm ? formatDims(order.model.dimensionsMm) : null],
                ['Triangles', order.model?.triangles?.toLocaleString()],
              ]}
            />
          </section>
        ) : (
          <section>
            <h3 className="panel-label">Project brief</h3>
            <p style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap', fontSize: 14.5 }}>{order.brief?.description}</p>
            <KV
              items={[
                ['Budget', order.brief?.budget],
                ['Deadline', order.brief?.deadline],
              ]}
            />
          </section>
        )}

        {order.file?.originalName && (
          <section>
            <h3 className="panel-label">File</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ overflowWrap: 'anywhere' }}>
                {order.file.originalName}
                {order.file.size ? <span className="cell-sub">{formatBytes(order.file.size)}</span> : null}
              </span>
              {order.file.storedName && (
                <button type="button" className="btn btn-glass btn-sm" onClick={download}>
                  <Download size={15} /> Download
                </button>
              )}
            </div>
          </section>
        )}

        <section>
          <h3 className="panel-label">Pricing {p.estimated && '(estimate)'}</h3>
          <KV
            items={[
              ['Unit price', p.unitPrice != null ? money(p.unitPrice) : null],
              ['Production', p.production != null ? money(p.production) : null],
              ['Discount', p.discount ? `−${money(p.discount)} (${Math.round(p.discountRate * 100)}%)` : null],
              ['Setup fee', p.setupFee ? money(p.setupFee) : null],
              ['Express', p.expressSurcharge ? money(p.expressSurcharge) : null],
              ['Shipping', p.shipping != null ? money(p.shipping) : null],
              [`${p.taxLabel || 'Tax'} (${Math.round((p.taxRate || 0) * 100)}%)`, p.tax ? money(p.tax) : null],
              ['Total', <strong key="t">{money(p.total)}</strong>],
              ['Print time', p.printHours != null ? `${p.printHours} h` : null],
              ['Lead time', order.leadTimeDays ? `${order.leadTimeDays} business days` : null],
            ]}
          />
          {order.warnings?.map((w) => (
            <div key={w} className="alert alert-warning">
              <TriangleAlert size={16} /> {w}
            </div>
          ))}
        </section>

        {order.notes && (
          <section>
            <h3 className="panel-label">Customer notes</h3>
            <p style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap', fontSize: 14.5 }}>{order.notes}</p>
          </section>
        )}

        <section>
          <h3 className="panel-label">History</h3>
          <ul className="note-list">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`}>
                <span>
                  {formatDateTime(h.at)} · {STATUS_INFO[h.status]?.label} · {h.by}
                </span>
                {h.note || '—'}
              </li>
            ))}
          </ul>
        </section>
      </motion.aside>
    </>,
    document.body,
  )
}
