import { Check } from 'lucide-react'

export default function Stepper({ steps, current, maxReachable, onJump }) {
  return (
    <ol className="stepper" aria-label="Order progress">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <li key={step.key}>
            <button
              type="button"
              data-state={state}
              disabled={i > maxReachable}
              aria-current={state === 'current' ? 'step' : undefined}
              onClick={() => onJump(i)}
            >
              <span className="num">{state === 'done' ? <Check size={13} /> : i + 1}</span>
              {step.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
