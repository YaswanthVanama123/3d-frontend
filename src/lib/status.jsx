import { Ban, CheckCircle2, CircleDot, Clock, FileText, Paintbrush, PackageCheck, Printer, ScanLine, Send, Truck } from 'lucide-react'

export const STATUS_INFO = {
  received: { label: 'Order received', text: 'We have your order and model file.', icon: Clock, tone: 'warning' },
  quote_requested: { label: 'Quote requested', text: 'An engineer is reviewing your brief.', icon: FileText, tone: 'warning' },
  quoted: { label: 'Quote sent', text: 'Check your inbox to approve the quote.', icon: Send, tone: 'neutral' },
  confirmed: { label: 'Confirmed', text: 'File approved and scheduled for production.', icon: CircleDot, tone: 'neutral' },
  printing: { label: 'Printing', text: 'Your parts are on the build plate.', icon: Printer, tone: 'neutral' },
  post_processing: { label: 'Post-processing', text: 'Support removal, curing and finishing.', icon: Paintbrush, tone: 'neutral' },
  quality_check: { label: 'Quality check', text: 'Dimensional and visual inspection.', icon: ScanLine, tone: 'neutral' },
  shipped: { label: 'Shipped', text: 'On its way to you.', icon: Truck, tone: 'neutral' },
  delivered: { label: 'Delivered', text: 'Enjoy your parts!', icon: PackageCheck, tone: 'good' },
  cancelled: { label: 'Cancelled', text: 'This order was cancelled.', icon: Ban, tone: 'critical' },
}

export const ORDER_STATUSES = Object.keys(STATUS_INFO)

export const FLOWS = {
  instant: ['received', 'confirmed', 'printing', 'post_processing', 'quality_check', 'shipped', 'delivered'],
  quote: ['quote_requested', 'quoted', 'confirmed', 'printing', 'post_processing', 'quality_check', 'shipped', 'delivered'],
}

/** Which 3D scene illustrates a status. */
export function visualForStatus(status) {
  if (['shipped', 'delivered'].includes(status)) return 'ship'
  if (['printing', 'post_processing', 'quality_check', 'confirmed'].includes(status)) return 'print'
  if (['quote_requested', 'quoted'].includes(status)) return 'quote'
  return 'upload'
}

export function StatusPill({ status }) {
  const info = STATUS_INFO[status] || { label: status, icon: CircleDot, tone: 'neutral' }
  const Icon = info.tone === 'good' ? CheckCircle2 : info.icon
  return (
    <span className="status-badge" data-tone={info.tone}>
      <Icon size={14} aria-hidden="true" />
      {info.label}
    </span>
  )
}
