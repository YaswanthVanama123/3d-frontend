import {
  Boxes,
  Building2,
  Calculator,
  CloudUpload,
  Cog,
  Droplets,
  Gift,
  Layers,
  Paintbrush,
  PenTool,
  Printer,
  Rocket,
  ScanLine,
  Shapes,
  Sparkles,
  Truck,
} from 'lucide-react'

export const SERVICE_ICONS = {
  fdm: Layers,
  sla: Droplets,
  sls: Sparkles,
  metal: Cog,
  cad: PenTool,
  scanning: ScanLine,
  prototyping: Rocket,
  batch: Boxes,
  finishing: Paintbrush,
  miniatures: Shapes,
  architecture: Building2,
  gifts: Gift,
  upload: CloudUpload,
  quote: Calculator,
  print: Printer,
  ship: Truck,
}

export const iconFor = (visual) => SERVICE_ICONS[visual] || Layers
