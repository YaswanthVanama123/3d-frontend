import { KeyRound, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api/client.js'
import Field from '../ui/Field.jsx'

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '' })

  const submit = async (e) => {
    e.preventDefault()
    setState({ loading: true, error: '' })
    try {
      const { token, admin } = await api.login(form.email, form.password)
      onLogin({ token, admin })
    } catch (err) {
      setState({ loading: false, error: err.message })
    }
  }

  return (
    <section className="page">
      <div className="container">
        <form className="login-card glass" onSubmit={submit}>
          <span className="icon-chip">
            <KeyRound size={20} />
          </span>
          <div>
            <h1>Studio sign in</h1>
            <p className="section-sub" style={{ fontSize: 14.5 }}>
              Manage orders, quotes, messages and your service catalog.
            </p>
          </div>
          <Field id="a-email" label="Email">
            <input id="a-email" type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="username" required />
          </Field>
          <Field id="a-password" label="Password">
            <input
              id="a-password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </Field>
          {state.error && (
            <div className="alert alert-error" role="alert">
              <TriangleAlert size={18} /> {state.error}
            </div>
          )}
          <button className="btn btn-primary" type="submit" disabled={state.loading}>
            {state.loading && <span className="spinner" aria-hidden="true" />} Sign in
          </button>
          <p className="hint" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            The first admin account is created from ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env.
          </p>
        </form>
      </div>
    </section>
  )
}
