import { FileText, X } from 'lucide-react'
import { formatBytes } from '../../lib/format.js'
import { MODEL_EXTS, REFERENCE_EXTS } from '../../lib/mesh.js'
import Field from '../ui/Field.jsx'

const BUDGETS = ['Not sure yet', 'Under ₹2,000', '₹2,000–5,000', '₹5,000–15,000', '₹15,000–50,000', '₹50,000+']
const DEADLINES = ['Flexible', 'Within 1 week', 'Within 2 weeks', 'Within a month', 'Specific date (add in notes)']
const ACCEPT = [...MODEL_EXTS, ...REFERENCE_EXTS].map((e) => `.${e}`).join(',')

export default function BriefStep({ service, brief, onChange, file, onFile, errors }) {
  return (
    <div className="step-body">
      <Field
        id="brief-description"
        label="Describe your project"
        error={errors['brief.description']}
        hint={`What should we ${service.slug === 'scanning' ? 'scan' : service.slug === 'finishing' ? 'finish' : 'design'}? Sizes, materials, quantities, how it will be used…`}
      >
        <textarea
          id="brief-description"
          className="textarea"
          rows={7}
          value={brief.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="e.g. A wall-mounted holder for 3 drones with cable routing, around 40 × 20 cm, matte black, 2 units."
        />
      </Field>
      <div className="form-grid">
        <Field id="brief-budget" label="Budget">
          <select id="brief-budget" className="select" value={brief.budget} onChange={(e) => onChange({ budget: e.target.value })}>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field id="brief-deadline" label="Deadline">
          <select id="brief-deadline" className="select" value={brief.deadline} onChange={(e) => onChange({ deadline: e.target.value })}>
            {DEADLINES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="brief-file" label="Reference file (optional)" hint="Sketch, photo, PDF drawing, ZIP or an existing model.">
        {file ? (
          <div className="file-card">
            <span className="icon-chip">
              <FileText size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="file-name">{file.name}</div>
              <div className="file-sub">{formatBytes(file.size)}</div>
            </div>
            <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => onFile(null)} aria-label="Remove file">
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="dropzone" style={{ padding: 20 }}>
            <strong style={{ fontSize: 15 }}>Attach a file</strong>
            <span>{[...MODEL_EXTS, ...REFERENCE_EXTS].map((e) => e.toUpperCase()).join(' · ')}</span>
            <input id="brief-file" type="file" accept={ACCEPT} onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </label>
        )}
      </Field>
    </div>
  )
}
