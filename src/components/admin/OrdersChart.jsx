import { useState } from 'react'

function niceMax(value) {
  if (value <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(value))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

const dayLabel = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

/**
 * Orders-per-day column chart. Single series → one color and no legend; thin capped columns with
 * rounded data ends; the peak day is labelled; per-column hover/focus tooltip; table view toggle.
 */
export default function OrdersChart({ data }) {
  const [active, setActive] = useState(null)
  const [showTable, setShowTable] = useState(false)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = niceMax(Math.max(0, ...data.map((d) => d.count)))
  const ticks = max % 2 === 0 ? [0, max / 2, max] : [0, max]
  const peak = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0)

  return (
    <figure className="admin-card">
      <header>
        <div>
          <h3>Orders per day</h3>
          <span className="sub">Last 14 days · {total} orders</span>
        </div>
        <button type="button" className="link-btn" onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </header>

      {showTable ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Orders</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day}>
                  <td>{dayLabel(d.day)}</td>
                  <td className="num">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="col-chart">
          <div className="y-axis" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ bottom: `${(t / max) * 100}%` }}>
                {t.toLocaleString()}
              </span>
            ))}
          </div>
          <div className="plot" role="list" aria-label="Orders per day, last 14 days">
            {ticks.slice(1).map((t) => (
              <span key={t} className="gridline" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
            ))}
            {data.map((d, i) => (
              <div
                key={d.day}
                className="slot"
                role="listitem"
                tabIndex={0}
                aria-label={`${dayLabel(d.day)}: ${d.count} ${d.count === 1 ? 'order' : 'orders'}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {d.count > 0 && (
                  <div className="bar" style={{ height: `${(d.count / max) * 100}%` }}>
                    {i === peak && active !== i && <span className="cap">{d.count}</span>}
                  </div>
                )}
                {active === i && (
                  <div className="chart-tooltip" role="tooltip">
                    <strong>
                      {d.count} {d.count === 1 ? 'order' : 'orders'}
                    </strong>
                    <span>{dayLabel(d.day)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="x-axis" aria-hidden="true">
            {data.map((d, i) => (
              <span key={d.day}>{(data.length - 1 - i) % 2 === 0 ? new Date(`${d.day}T00:00:00`).getDate() : ''}</span>
            ))}
          </div>
        </div>
      )}
    </figure>
  )
}
