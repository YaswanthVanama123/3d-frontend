import { TriangleAlert } from 'lucide-react'
import { formatBytes, formatMoney, formatPriceShort } from '../../lib/format.js'

function Card({ title, onEdit, children, wide }) {
  return (
    <section className={`review-card ${wide ? 'span-2' : ''}`} style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <header>
        <h4>{title}</h4>
        {onEdit && (
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        )}
      </header>
      <dl>{children}</dl>
    </section>
  )
}

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
)

export default function ReviewStep({ instant, service, catalog, config, upload, dims, brief, briefFile, customer, shipping, notes, quote, quoteError, manualPricing, agree, onAgree, onEdit, errors, submit }) {
  const material = catalog.materialBySlug[config?.material]
  const color = material?.colors.find((c) => c.name === config.color)
  const quality = catalog.qualitiesFor(material?.technology).find((q) => q.key === config?.quality)
  const finishNames = (config?.finishes || []).map((k) => catalog.finishes.find((f) => f.key === k)?.name).filter(Boolean)
  const delivery = catalog.delivery.find((d) => d.key === shipping.method)

  return (
    <div className="step-body">
      <div className="review-grid">
        <Card title="Service" onEdit={() => onEdit('service')}>
          <Row label="Service">{service.name}</Row>
          <Row label="Turnaround">{service.turnaround}</Row>
        </Card>

        {instant ? (
          <Card title="Model" onEdit={() => onEdit('model')}>
            <Row label="File">{upload.file?.name}</Row>
            <Row label="Size">{upload.file ? formatBytes(upload.file.size) : '—'}</Row>
            {dims && (
              <Row label="Printed size">
                {dims.x.toFixed(0)} × {dims.y.toFixed(0)} × {dims.z.toFixed(0)} mm
              </Row>
            )}
          </Card>
        ) : (
          <Card title="Project brief" onEdit={() => onEdit('brief')}>
            <Row label="Budget">{brief.budget}</Row>
            <Row label="Deadline">{brief.deadline}</Row>
            <Row label="Attachment">{briefFile?.name || 'None'}</Row>
          </Card>
        )}

        {instant && material && (
          <Card title="Configuration" onEdit={() => onEdit('configure')} wide>
            <Row label="Material">{material.name}</Row>
            <Row label="Color">
              <span className="color-dot" style={{ background: color?.hex }} aria-hidden="true" />
              {color?.name}
            </Row>
            <Row label="Quality">
              {quality?.name} · {quality?.layer}
            </Row>
            {material.technology === 'fdm' && <Row label="Infill">{Math.round(config.infill * 100)}%</Row>}
            <Row label="Quantity">{config.quantity}</Row>
            <Row label="Scale">{Math.round(config.scale * 100)}%</Row>
            <Row label="Finishing">{finishNames.length ? finishNames.join(', ') : 'None'}</Row>
          </Card>
        )}

        {!instant && (
          <Card title="Description" onEdit={() => onEdit('brief')} wide>
            <p style={{ color: 'var(--text-2)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{brief.description}</p>
          </Card>
        )}

        <Card title="Contact" onEdit={() => onEdit('details')}>
          <Row label="Name">{customer.name}</Row>
          <Row label="Email">{customer.email}</Row>
          {customer.phone && <Row label="Phone">{customer.phone}</Row>}
          {customer.company && <Row label="Company">{customer.company}</Row>}
        </Card>

        <Card title="Delivery" onEdit={() => onEdit('details')}>
          <Row label="Method">{delivery?.name}</Row>
          {shipping.method !== 'pickup' && (
            <Row label="Address">
              {shipping.address}, {shipping.postalCode} {shipping.city}
              {shipping.state ? `, ${shipping.state}` : ''}, {shipping.country}
            </Row>
          )}
          {notes && <Row label="Notes">{notes.length > 60 ? `${notes.slice(0, 60)}…` : notes}</Row>}
        </Card>

        <Card title="Price" wide>
          {instant ? (
            quote ? (
              <>
                <Row label={quote.tax > 0 ? `Order total (incl. ${quote.taxLabel})` : 'Order total'}>
                  <strong>{formatMoney(quote.total, quote.currency)}</strong>
                </Row>
                <Row label="Estimated production">
                  {quote.leadTimeDays} business {quote.leadTimeDays === 1 ? 'day' : 'days'}
                </Row>
              </>
            ) : (
              <Row label="Order total">{manualPricing || quoteError ? 'Confirmed by email after engineering review' : 'Calculating…'}</Row>
            )
          ) : (
            <Row label="Estimate">
              From {formatPriceShort(service.startingPrice, catalog.currency)} {service.priceUnit} + GST · exact quote within 1 business day
            </Row>
          )}
          <Row label="Payment">After engineering review — secure link for UPI, card or net banking</Row>
        </Card>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={agree} onChange={(e) => onAgree(e.target.checked)} />
        <span>
          I confirm the details above and agree to the terms of service. My files are used only to produce this order.
        </span>
      </label>
      {errors.agree && <p className="field-error">{errors.agree}</p>}

      {submit.status === 'sending' && (
        <div className="upload-progress" role="status">
          <span>{submit.progress < 1 ? `Uploading ${Math.round(submit.progress * 100)}%…` : 'Creating your order…'}</span>
          <div className="meter">
            <span className="meter-fill" style={{ transform: `scaleX(${Math.max(0.03, submit.progress)})` }} />
          </div>
        </div>
      )}
      {submit.status === 'error' && (
        <div className="alert alert-error" role="alert">
          <TriangleAlert size={18} /> {submit.error}
        </div>
      )}
    </div>
  )
}
