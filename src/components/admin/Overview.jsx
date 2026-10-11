import { formatCompact, formatDate, formatMoney, formatMoneyCompact } from '../../lib/format.js'
import { ORDER_STATUSES, STATUS_INFO, StatusPill } from '../../lib/status.jsx'
import OrdersChart from './OrdersChart.jsx'

function Kpi({ label, value, context }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {context && <div className="context">{context}</div>}
    </div>
  )
}

function StatusBars({ counts }) {
  const max = Math.max(1, ...ORDER_STATUSES.map((s) => counts[s] || 0))
  return (
    <figure className="admin-card">
      <header>
        <div>
          <h3>Orders by status</h3>
          <span className="sub">All time</span>
        </div>
      </header>
      <ul className="hbar-list">
        {ORDER_STATUSES.map((s) => {
          const count = counts[s] || 0
          return (
            <li key={s}>
              <span>{STATUS_INFO[s].label}</span>
              <div className="hbar-track">
                {count > 0 && <span className="hbar" style={{ width: `calc((100% - 40px) * ${count / max})` }} />}
                <b>{count}</b>
              </div>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

export default function Overview({ stats, currency, onOpenOrder }) {
  const last7 = stats.ordersByDay.slice(-7).reduce((n, d) => n + d.count, 0)
  return (
    <>
      <div className="kpi-row">
        <Kpi label="Total orders" value={formatCompact(stats.totalOrders)} context={`${last7} in the last 7 days`} />
        <Kpi label="Awaiting review" value={stats.awaitingReview} context="New orders + quote requests" />
        <Kpi label="In production" value={stats.inProduction} context="Confirmed → quality check" />
        <Kpi label="Revenue" value={formatMoneyCompact(stats.revenue, currency)} context={`Avg. order ${formatMoney(stats.averageOrder, currency)} · incl. GST`} />
        <Kpi label="New messages" value={stats.newMessages} context="From the contact form" />
      </div>

      <div className="admin-grid">
        <OrdersChart data={stats.ordersByDay} />
        <StatusBars counts={stats.statusCounts} />
      </div>

      <figure className="admin-card" style={{ marginTop: 16 }}>
        <header>
          <h3>Latest orders</h3>
        </header>
        {stats.recentOrders.length === 0 ? (
          <p className="empty">No orders yet — they will appear here as soon as customers check out.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
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
          </div>
        )}
      </figure>
    </>
  )
}
