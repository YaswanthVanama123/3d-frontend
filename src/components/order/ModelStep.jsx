import { CloudUpload, FileBox, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { formatBytes } from '../../lib/format.js'
import { MODEL_EXTS, SAMPLE_MODELS } from '../../lib/mesh.js'
import { VEHICLES } from '../../three/vehicles/catalog.js'
import Field from '../ui/Field.jsx'

export default function ModelStep({ upload, config, onFile, onSample, onVehicle, onClear, onUnits, maxMb, error }) {
  const input = useRef(null)
  const [dragging, setDragging] = useState(false)
  const stats = upload.stats

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="step-body">
      {!upload.file ? (
        <label
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <CloudUpload size={40} aria-hidden="true" />
          <strong>Drop your 3D model here or click to browse</strong>
          <span>
            {MODEL_EXTS.map((e) => e.toUpperCase()).join(', ')} · up to {maxMb} MB · STL/OBJ/3MF are previewed and priced instantly
          </span>
          <input ref={input} type="file" accept={MODEL_EXTS.map((e) => `.${e}`).join(',')} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="file-card">
          <span className="icon-chip">{upload.status === 'loading' ? <span className="spinner" /> : <FileBox size={20} />}</span>
          <div style={{ minWidth: 0 }}>
            <div className="file-name">{upload.file.name}</div>
            <div className="file-sub">
              {formatBytes(upload.file.size)}
              {upload.status === 'loading' && ' · reading model…'}
              {upload.status === 'ready' && !upload.previewable && ' · preview not available — our engineers will price it by hand'}
              {stats && ` · ${stats.triangles.toLocaleString()} triangles`}
            </div>
          </div>
          <div className="chip-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()}>
              <RefreshCw size={14} /> Replace
            </button>
            <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={onClear} aria-label="Remove file">
              <X size={16} />
            </button>
          </div>
          <input
            ref={input}
            type="file"
            hidden
            accept={MODEL_EXTS.map((e) => `.${e}`).join(',')}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>
      )}

      {(error || upload.error) && (
        <div className="alert alert-error" role="alert">
          <TriangleAlert size={18} /> {upload.error || error}
        </div>
      )}

      <div className="sample-row">
        <span>No file handy? Try a sample:</span>
        {SAMPLE_MODELS.map((s) => (
          <button key={s.key} type="button" className="btn btn-glass btn-sm" onClick={() => onSample(s)}>
            {s.label}
          </button>
        ))}
        <select className="select" style={{ width: 'auto', minHeight: 36, padding: '6px 34px 6px 12px', fontSize: 13.5 }} value="" onChange={(e) => e.target.value && onVehicle(e.target.value)} aria-label="Bike or scooter model">
          <option value="">Bike / scooter model (1:12)…</option>
          {VEHICLES.map((v) => (
            <option key={v.key} value={v.key}>
              {v.brand} {v.name}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <>
          <dl className="stat-list">
            <div>
              <dt>Volume</dt>
              <dd>{stats.volumeCm3.toFixed(2)} cm³</dd>
            </div>
            <div>
              <dt>Surface</dt>
              <dd>{stats.surfaceCm2.toFixed(1)} cm²</dd>
            </div>
            <div>
              <dt>Size in file</dt>
              <dd>
                {stats.dimensionsMm.x.toFixed(0)} × {stats.dimensionsMm.y.toFixed(0)} × {stats.dimensionsMm.z.toFixed(0)}
              </dd>
            </div>
            <div>
              <dt>Triangles</dt>
              <dd>{stats.triangles.toLocaleString()}</dd>
            </div>
          </dl>
          <Field id="units" label="File units" hint="STL files have no units — most CAD tools export millimetres.">
            <div className="segmented" role="group" aria-label="File units">
              {[
                ['mm', 'Millimetres'],
                ['cm', 'Centimetres'],
                ['in', 'Inches'],
              ].map(([key, label]) => (
                <button key={key} type="button" aria-pressed={config?.units === key} onClick={() => onUnits(key)}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}
    </div>
  )
}
