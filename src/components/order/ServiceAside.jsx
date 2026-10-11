import { View } from '@react-three/drei'
import { formatPriceShort } from '../../lib/format.js'
import { Visual } from '../../three/visuals/index.jsx'

/** Side panel for custom-quote services (design, scanning, finishing). */
export default function ServiceAside({ service, currency }) {
  return (
    <div className="service-aside glass" style={{ '--card-accent': service.accent }}>
      <div className="service-aside-visual">
        <View className="view">
          <Visual name={service.visual} active hovered={false} accent={service.accent} />
        </View>
      </div>
      <div className="service-aside-body">
        <span className="badge badge-accent">Custom quote · from {formatPriceShort(service.startingPrice, currency)} {service.priceUnit}</span>
        <h3>{service.name}</h3>
        <p className="section-sub" style={{ fontSize: 14.5 }}>
          {service.description}
        </p>
        <p className="group-label" style={{ marginTop: 6 }}>
          What happens next
        </p>
        <ol className="timeline-list">
          <li>An engineer reviews your brief and files — usually within a few hours.</li>
          <li>You receive a fixed quote and timeline by email (turnaround {service.turnaround}).</li>
          <li>Approve and pay online; track every step with your order number.</li>
        </ol>
      </div>
    </div>
  )
}
