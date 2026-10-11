import { ChevronLeft, ChevronRight, Search, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { formatDate, formatMoney } from '../../lib/format.js'
import { ORDER_STATUSES, STATUS_INFO, StatusPill } from '../../lib/status.jsx'

const LIMIT = 15

export default function OrdersPanel({ call, onOpenOrder, refreshKey }) {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = { page, limit: LIMIT }
    if (debouncedQ) params.q = debouncedQ
    if (status) params.status = status
    try {
      const res = await call((token) => api.admin.orders(token, params))
      if (res) setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [call, page, debouncedQ, status])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  return (
    <div className="admin-card">
      <div className="toolbar">
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 15, color: 'var(--muted)' }} aria-hidden="true" />
          <input className="input" style={{ paddingLeft: 36, maxWidth: 'none' }} placeholder="Search order #, name, email or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        </div>
        <select
          className="select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_INFO[s].label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
          <TriangleAlert size={18} /> {error}
        </div>
      )}

      <div className="table-wrap" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Details</th>
              <th>Status</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="clickable" tabIndex={0} onClick={() => onOpenOrder(o)} onKeyDown={(e) => e.key === 'Enter' && onOpenOrder(o)}>
                <td>
                  <span className="mono">{o.orderNumber}</span>
                  <span className="cell-sub">{formatDate(o.createdAt)}</span>
                </td>
                <td>
                  {o.customer.name}
                  <span className="cell-sub">{o.customer.email}</span>
                </td>
                <td>{o.service.name}</td>
                <td>
                  {o.pricingMode === 'instant' ? (
                    <>
                      {o.config?.material?.name} × {o.config?.quantity}
                      <span className="cell-sub">{o.file?.originalName}</span>
                    </>
                  ) : (
                    <span className="cell-sub" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.brief?.description}
                    </span>
                  )}
                </td>
                <td>
                  <StatusPill status={o.status} />
                </td>
                <td className="num">
                  {o.pricing?.estimated ? 'from ' : ''}
                  {formatMoney(o.pricing?.total, o.pricing?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.orders.length === 0 && <p className="empty">No orders match your filters.</p>}
      </div>

      <div className="pagination">
        <span>
          {data.total} {data.total === 1 ? 'order' : 'orders'} · page {page} of {data.pages}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="icon-btn" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
            <ChevronRight size={18} />
          </button>
        </span>
      </div>
    </div>
  )
}
