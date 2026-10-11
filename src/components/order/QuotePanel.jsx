import { CalendarDays, Clock, Package, TriangleAlert, Weight } from 'lucide-react'
import { formatDate, formatHours, formatMoney, formatPriceShort } from '../../lib/format.js'
import { addBusinessDays } from '../../lib/order.js'

const Line = ({ label, value, good }) => (
  <div className={good ? 'good' : undefined}>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
)

/** Live instant quote. Keeps the last price on screen (dimmed) while recalculating. */
export default function QuotePanel({ quote, loading, error, service, currency, hasModel, manual }) {
  if (manual) {
    return (
      <div className="quote-panel glass">
        <div className="quote-head">
          <span className="panel-label">Engineer quote</span>
        </div>
        <p className="quote-empty">
          This file format can’t be analysed in the browser, so an engineer will price it by hand — usually within a few hours.
          {service && (
            <>
              {' '}
              {service.name} starts at <strong>{formatPriceShort(service.startingPrice, currency)}</strong> {service.priceUnit}.
            </>
          )}
        </p>
      </div>
    )
  }
  if (!hasModel) {
    return (
      <div className="quote-panel glass">
        <div className="quote-head">
          <span className="panel-label">Instant quote</span>
        </div>
        <p className="quote-empty">
          Upload a model to see your exact price, broken down line by line.
          {service && (
            <>
              {' '}
              {service.name} starts at <strong>{formatPriceShort(service.startingPrice, currency)}</strong> {service.priceUnit} + GST.
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="quote-panel glass" aria-live="polite" aria-busy={loading}>
      <div className="quote-head">
        <span className="panel-label">Instant quote</span>
        {loading && <span className="spinner" aria-label="Updating price" />}
      </div>

      {error && !quote && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 10 }}>
          <TriangleAlert size={18} /> {error}
        </div>
      )}
      {!quote && !error && <p className="quote-empty">Calculating your price…</p>}

      {quote && (
        <div className={`quote-body ${loading ? 'is-stale' : ''}`}>
          <div className="quote-total">{formatMoney(quote.total, quote.currency)}</div>
          <p className="quote-sub">
            Order total · {quote.quantity} {quote.quantity === 1 ? 'part' : 'parts'}
            {quote.tax > 0 ? ` · incl. ${Math.round(quote.taxRate * 100)}% ${quote.taxLabel}` : ''}
          </p>
          <dl className="quote-lines">
            <Line label={`${formatMoney(quote.perUnit.unitPrice, quote.currency)} × ${quote.quantity}`} value={formatMoney(quote.production, quote.currency)} />
            {quote.discount > 0 && (
              <Line label={`Volume discount −${Math.round(quote.discountRate * 100)}%`} value={`−${formatMoney(quote.discount, quote.currency)}`} good />
            )}
            {quote.setupFee > 0 && <Line label="Setup & file review" value={formatMoney(quote.setupFee, quote.currency)} />}
            {quote.expressSurcharge > 0 && <Line label="Express priority" value={formatMoney(quote.expressSurcharge, quote.currency)} />}
            <Line label={quote.delivery.name} value={quote.shipping ? formatMoney(quote.shipping, quote.currency) : 'Free'} />
            {quote.tax > 0 && <Line label={`${quote.taxLabel} (${Math.round(quote.taxRate * 100)}%)`} value={formatMoney(quote.tax, quote.currency)} />}
          </dl>
          <div className="quote-meta">
            <div>
              <Clock size={15} aria-hidden="true" />
              <span>
                <strong>
                  {quote.leadTimeDays} business {quote.leadTimeDays === 1 ? 'day' : 'days'}
                </strong>
                Production time
              </span>
            </div>
            <div>
              <CalendarDays size={15} aria-hidden="true" />
              <span>
                <strong>{formatDate(addBusinessDays(new Date(), quote.leadTimeDays))}</strong>
                Estimated dispatch
              </span>
            </div>
            <div>
              <Package size={15} aria-hidden="true" />
              <span>
                <strong>{formatHours(quote.printHours)}</strong>
                Total print time
              </span>
            </div>
            <div>
              <Weight size={15} aria-hidden="true" />
              <span>
                <strong>{quote.model.massG.toLocaleString()} g</strong>
                Weight per part
              </span>
            </div>
          </div>
          <details className="quote-breakdown">
            <summary>Per-part cost breakdown</summary>
            <dl>
              <div>
                <dt>Material</dt>
                <dd>{formatMoney(quote.perUnit.materialCost, quote.currency)}</dd>
              </div>
              <div>
                <dt>Machine time</dt>
                <dd>{formatMoney(quote.perUnit.machineCost, quote.currency)}</dd>
              </div>
              {quote.finishes.map((f) => (
                <div key={f.key}>
                  <dt>{f.name}</dt>
                  <dd>{formatMoney(f.cost, quote.currency)}</dd>
                </div>
              ))}
              <div>
                <dt>Unit price{service?.priceMultiplier !== 1 ? ` (incl. ${service.name} rate)` : ''}</dt>
                <dd>{formatMoney(quote.perUnit.unitPrice, quote.currency)}</dd>
              </div>
            </dl>
          </details>
          {quote.warnings.length > 0 && (
            <div className="quote-warnings">
              {quote.warnings.map((w) => (
                <div key={w} className="alert alert-warning">
                  <TriangleAlert size={16} /> {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
