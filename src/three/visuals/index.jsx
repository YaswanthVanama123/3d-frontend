import ArchitectureVisual from './ArchitectureVisual.jsx'
import BatchVisual from './BatchVisual.jsx'
import CadVisual from './CadVisual.jsx'
import FdmVisual, { PrintVisual } from './FdmVisual.jsx'
import FinishingVisual from './FinishingVisual.jsx'
import GiftsVisual from './GiftsVisual.jsx'
import MetalVisual from './MetalVisual.jsx'
import MiniaturesVisual from './MiniaturesVisual.jsx'
import { QuoteVisual, ShipVisual, UploadVisual } from './ProcessVisuals.jsx'
import PrototypingVisual from './PrototypingVisual.jsx'
import ScanningVisual from './ScanningVisual.jsx'
import SlaVisual from './SlaVisual.jsx'
import SlsVisual from './SlsVisual.jsx'

// `visual` keys stored on each service in MongoDB map to these animated scenes.
export const VISUALS = {
  fdm: FdmVisual,
  sla: SlaVisual,
  sls: SlsVisual,
  metal: MetalVisual,
  cad: CadVisual,
  scanning: ScanningVisual,
  prototyping: PrototypingVisual,
  batch: BatchVisual,
  finishing: FinishingVisual,
  miniatures: MiniaturesVisual,
  architecture: ArchitectureVisual,
  gifts: GiftsVisual,
  upload: UploadVisual,
  quote: QuoteVisual,
  print: PrintVisual,
  ship: ShipVisual,
}

export function Visual({ name, ...props }) {
  const Component = VISUALS[name] || FdmVisual
  return <Component {...props} />
}
