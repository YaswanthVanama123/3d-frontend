import { CheckCircle2, Clock, Mail, MapPin, Phone, Send, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client.js'
import { site } from '../../config/site.js'
import { Reveal, SectionHeading } from '../ui/Reveal.jsx'

const EMPTY = { name: '', email: '', phone: '', subject: 'General question', message: '', website: '' }
const SUBJECTS = ['General question', 'Quote for a project', 'Business & volume pricing', 'Order support', 'Partnerships']

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState({ status: 'idle', error: '', fields: {} })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'sending', error: '', fields: {} })
    try {
      await api.contact(form)
      setForm(EMPTY)
      setState({ status: 'sent', error: '', fields: {} })
    } catch (err) {
      setState({ status: 'error', error: err.message, fields: err.fields || {} })
    }
  }

  const fieldClass = (key) => `field ${state.fields[key] ? 'invalid' : ''}`

  return (
    <section className="section" id="contact">
      <div className="container">
        <SectionHeading
          eyebrow="Contact"
          title={
            <>
              Let’s build <span className="gradient-text">something great</span>
            </>
          }
          sub="Questions about a project, materials or volume pricing? Send us a message and an engineer will get back to you today."
        />
        <div className="contact-layout">
          <Reveal className="contact-cards">
            {[
              { icon: Mail, title: 'Email', body: <a href={`mailto:${site.email}`}>{site.email}</a> },
              { icon: Phone, title: 'Phone', body: <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`}>{site.phone}</a> },
              { icon: MapPin, title: 'Studio', body: <span>{site.address}</span> },
              { icon: Clock, title: 'Opening hours', body: <span>{site.hours} · online orders 24/7</span> },
            ].map(({ icon: Icon, title, body }) => (
              <div className="contact-card glass" key={title}>
                <span className="icon-chip">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>{title}</strong>
                  {body}
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal delay={0.08}>
            <form className="contact-form glass" onSubmit={submit} noValidate>
              <h3>Send us a message</h3>
              <div className="form-grid">
                <div className={fieldClass('name')}>
                  <label htmlFor="c-name">Name</label>
                  <input id="c-name" className="input" value={form.name} onChange={set('name')} autoComplete="name" required />
                  {state.fields.name && <span className="field-error">{state.fields.name}</span>}
                </div>
                <div className={fieldClass('email')}>
                  <label htmlFor="c-email">Email</label>
                  <input id="c-email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" required />
                  {state.fields.email && <span className="field-error">{state.fields.email}</span>}
                </div>
                <div className="field">
                  <label htmlFor="c-phone">Phone (optional)</label>
                  <input id="c-phone" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                </div>
                <div className="field">
                  <label htmlFor="c-subject">Topic</label>
                  <select id="c-subject" className="select" value={form.subject} onChange={set('subject')}>
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className={`${fieldClass('message')} span-2`}>
                  <label htmlFor="c-message">Message</label>
                  <textarea id="c-message" className="textarea" rows={5} value={form.message} onChange={set('message')} required />
                  {state.fields.message && <span className="field-error">{state.fields.message}</span>}
                </div>
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="c-website">Website</label>
                <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
              </div>
              {state.status === 'sent' && (
                <div className="alert alert-success" role="status">
                  <CheckCircle2 size={18} /> Thanks! Your message is on its way — we’ll reply within one business day.
                </div>
              )}
              {state.status === 'error' && (
                <div className="alert alert-error" role="alert">
                  <TriangleAlert size={18} /> {state.error}
                </div>
              )}
              <button className="btn btn-primary btn-lg" type="submit" disabled={state.status === 'sending'}>
                {state.status === 'sending' ? <span className="spinner" aria-hidden="true" /> : <Send size={18} />}
                {state.status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
