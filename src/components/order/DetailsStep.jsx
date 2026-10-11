import { CheckCircle2 } from 'lucide-react'
import { formatMoney } from '../../lib/format.js'
import Field from '../ui/Field.jsx'

export default function DetailsStep({ customer, shipping, notes, onCustomer, onShipping, onNotes, delivery, currency, instant, errors }) {
  const input = (group, onChange, key, props = {}) => (
    <input
      id={`${group}-${key}`}
      className="input"
      value={(group === 'customer' ? customer : shipping)[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      aria-invalid={Boolean(errors[`${group}.${key}`])}
      {...props}
    />
  )

  return (
    <div className="step-body">
      <div>
        <p className="group-label">Contact</p>
        <div className="form-grid">
          <Field id="customer-name" label="Full name" error={errors['customer.name']}>
            {input('customer', onCustomer, 'name', { autoComplete: 'name' })}
          </Field>
          <Field id="customer-email" label="Email" error={errors['customer.email']} hint="Order updates and your quote are sent here.">
            {input('customer', onCustomer, 'email', { type: 'email', autoComplete: 'email' })}
          </Field>
          <Field id="customer-phone" label="Phone (optional)">
            {input('customer', onCustomer, 'phone', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })}
          </Field>
          <Field id="customer-company" label="Company / GSTIN (optional)">
            {input('customer', onCustomer, 'company', { autoComplete: 'organization' })}
          </Field>
        </div>
      </div>

      <div>
        <p className="group-label">Delivery</p>
        <fieldset className="option-grid">
          <legend className="visually-hidden">Delivery method</legend>
          {delivery.map((d) => {
            const selected = shipping.method === d.key
            const price = d.price === 0 ? 'Free' : `${formatMoney(d.price, currency)}${d.freeOver ? ` · free over ${formatMoney(d.freeOver, currency)}` : ''}`
            return (
              <label key={d.key} className={`option-card ${selected ? 'selected' : ''}`}>
                <input type="radio" name="delivery" checked={selected} onChange={() => onShipping({ method: d.key })} />
                <strong style={{ gridColumn: '1 / -1' }}>{d.name}</strong>
                <span className="option-sub" style={{ gridColumn: '1 / -1' }}>
                  {d.description}
                </span>
                <span className="option-meta">
                  <span className="badge">{price}</span>
                  {d.surchargeRate > 0 && instant && <span className="badge">+{Math.round(d.surchargeRate * 100)}% priority</span>}
                </span>
                <CheckCircle2 className="check" size={18} aria-hidden="true" />
              </label>
            )
          })}
        </fieldset>
      </div>

      {shipping.method !== 'pickup' && (
        <div className="form-grid">
          <Field id="shipping-address" label="Address (house no., street, area)" error={errors['shipping.address']} className="span-2">
            {input('shipping', onShipping, 'address', { autoComplete: 'street-address' })}
          </Field>
          <Field id="shipping-city" label="City" error={errors['shipping.city']}>
            {input('shipping', onShipping, 'city', { autoComplete: 'address-level2' })}
          </Field>
          <Field id="shipping-state" label="State">
            {input('shipping', onShipping, 'state', { autoComplete: 'address-level1', placeholder: 'e.g. Karnataka' })}
          </Field>
          <Field id="shipping-postalCode" label="PIN code" error={errors['shipping.postalCode']}>
            {input('shipping', onShipping, 'postalCode', { autoComplete: 'postal-code', inputMode: 'numeric', placeholder: '560001' })}
          </Field>
          <Field id="shipping-country" label="Country" error={errors['shipping.country']}>
            {input('shipping', onShipping, 'country', { autoComplete: 'country-name' })}
          </Field>
        </div>
      )}

      <Field id="notes" label="Notes for our engineers (optional)" hint="Critical dimensions, orientation, assembly or packaging requests.">
        <textarea id="notes" className="textarea" rows={4} value={notes} onChange={(e) => onNotes(e.target.value)} />
      </Field>
    </div>
  )
}
