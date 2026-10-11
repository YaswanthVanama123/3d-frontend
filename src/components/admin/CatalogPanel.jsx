import { Check, Save, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'

const SERVICE_FIELDS = [
  ['startingPrice', 'From', 0.5],
  ['setupFee', 'Setup', 0.5],
  ['priceMultiplier', 'Rate ×', 0.05],
  ['minQuantity', 'Min qty', 1],
]
const MATERIAL_FIELDS = [
  ['pricePerGram', '$ / g', 0.01],
  ['density', 'g / cm³', 0.01],
]

function EditableRow({ item, fields, toggles, onSave, children }) {
  const [draft, setDraft] = useState(item)
  const [state, setState] = useState('idle')
  useEffect(() => setDraft(item), [item])
  const dirty = [...fields.map(([k]) => k), ...toggles, 'name'].some((k) => draft[k] !== item[k])

  const save = async () => {
    setState('saving')
    const patch = {}
    for (const [k] of fields) if (draft[k] !== item[k]) patch[k] = Number(draft[k])
    for (const k of [...toggles, 'name']) if (draft[k] !== item[k]) patch[k] = draft[k]
    try {
      await onSave(item.id, patch)
      setState('saved')
      setTimeout(() => setState('idle'), 1500)
    } catch {
      setState('error')
    }
  }

  return (
    <tr>
      <td>
        <input className="input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Name" />
        {children}
      </td>
      {fields.map(([key, label, step]) => (
        <td key={key} className="num">
          <input
            className="input"
            type="number"
            step={step}
            min={0}
            value={draft[key]}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
            aria-label={label}
          />
        </td>
      ))}
      {toggles.map((key) => (
        <td key={key}>
          <label className="checkbox">
            <input type="checkbox" checked={Boolean(draft[key])} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))} />
            <span className="visually-hidden">{key}</span>
          </label>
        </td>
      ))}
      <td>
        <button type="button" className="btn btn-glass btn-sm" disabled={!dirty || state === 'saving'} onClick={save}>
          {state === 'saved' ? <Check size={15} /> : state === 'error' ? <TriangleAlert size={15} /> : <Save size={15} />}
          {state === 'saved' ? 'Saved' : state === 'error' ? 'Retry' : 'Save'}
        </button>
      </td>
    </tr>
  )
}

export default function CatalogPanel({ call, onCatalogChanged }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await call((t) => api.admin.catalog(t))
      if (res) setData(res)
    } catch (err) {
      setError(err.message)
    }
  }, [call])

  useEffect(() => {
    load()
  }, [load])

  const saveService = async (id, patch) => {
    const service = await call((t) => api.admin.updateService(t, id, patch))
    if (!service) return
    setData((d) => ({ ...d, services: d.services.map((s) => (s.id === id ? service : s)) }))
    onCatalogChanged?.()
  }
  const saveMaterial = async (id, patch) => {
    const material = await call((t) => api.admin.updateMaterial(t, id, patch))
    if (!material) return
    setData((d) => ({ ...d, materials: d.materials.map((m) => (m.id === id ? material : m)) }))
    onCatalogChanged?.()
  }

  if (error)
    return (
      <div className="alert alert-error">
        <TriangleAlert size={18} /> {error}
      </div>
    )
  if (!data) return <div className="page-loader" style={{ minHeight: 200, paddingTop: 0 }}><span className="spinner" /></div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <figure className="admin-card">
        <header>
          <div>
            <h3>Services</h3>
            <span className="sub">Prices and visibility update on the website immediately. Inactive services are hidden from customers.</span>
          </div>
        </header>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                {SERVICE_FIELDS.map(([k, label]) => (
                  <th key={k} className="num">
                    {label}
                  </th>
                ))}
                <th>Popular</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.services.map((s) => (
                <EditableRow key={s.id} item={s} fields={SERVICE_FIELDS} toggles={['popular', 'active']} onSave={saveService}>
                  <span className="cell-sub">
                    {s.slug} · {s.pricingMode === 'instant' ? 'instant quote' : 'custom quote'}
                  </span>
                </EditableRow>
              ))}
            </tbody>
          </table>
        </div>
      </figure>

      <figure className="admin-card">
        <header>
          <div>
            <h3>Materials</h3>
            <span className="sub">Price per gram and density drive every instant quote.</span>
          </div>
        </header>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                {MATERIAL_FIELDS.map(([k, label]) => (
                  <th key={k} className="num">
                    {label}
                  </th>
                ))}
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.materials.map((m) => (
                <EditableRow key={m.id} item={m} fields={MATERIAL_FIELDS} toggles={['active']} onSave={saveMaterial}>
                  <span className="cell-sub">
                    {m.technology.toUpperCase()} · {m.colors.length} colors
                  </span>
                </EditableRow>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    </div>
  )
}
