import { Box, CheckCircle2, Eye, Grid3x3, Maximize2, Rotate3d, Ruler, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { UNIT_FACTORS } from '../../lib/mesh.js'
import { layerHeightMm } from '../../lib/order.js'
import { geometries } from '../../three/geometries.js'
import ModelViewer from '../../three/ModelViewer.jsx'
import { hasWebGL } from '../../three/pointer.js'
import WebGLBoundary from '../../three/WebGLBoundary.jsx'

const MM = 0.01

export default function ViewerPanel({ upload, config, material, technology, quality, dims, fits, onFile }) {
  const [opts, setOpts] = useState({ autoRotate: true, showVolume: true, showDims: true, wireframe: false })
  const [fit, setFit] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [webgl] = useState(hasWebGL)
  const toggle = (key) => setOpts((o) => ({ ...o, [key]: !o[key] }))

  const hasModel = upload.status === 'ready' && Boolean(upload.geometry)
  // Placeholder: the procedural vase is authored at 100 mm per unit, i.e. already in scene units.
  const geometry = hasModel ? upload.geometry : geometries.vase()
  const scale = hasModel ? (UNIT_FACTORS[config?.units] || 1) * (config?.scale || 1) * MM : 1
  const color = material?.colors.find((c) => c.name === config?.color)?.hex || material?.colors[0]?.hex || '#ff7a45'
  const volume = technology?.buildVolumeMm || { x: 300, y: 300, z: 400 }

  const overlay =
    upload.status === 'loading'
      ? 'Reading your model…'
      : upload.file && !upload.previewable
        ? 'Preview not available for this format — our engineers will review it'
        : !hasModel
          ? 'Drop an STL, OBJ or 3MF here to preview it in 3D'
          : null

  return (
    <div
      className={`viewer-card glass ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onFile(file)
      }}
    >
      <div className="viewer-canvas">
        {webgl ? (
          <WebGLBoundary fallback={<div className="viewer-fallback">3D preview unavailable in this browser</div>}>
            <ModelViewer
              geometry={geometry}
              scale={scale}
              appearance={material?.appearance}
              color={color}
              buildVolume={volume}
              fits={fits}
              showVolume={opts.showVolume && hasModel}
              showDims={opts.showDims && hasModel}
              wireframe={opts.wireframe}
              dims={dims}
              layerHeightMm={layerHeightMm(quality?.layer)}
              autoRotate={opts.autoRotate}
              fitKey={`${geometry.uuid}:${scale.toFixed(5)}:${fit}`}
            />
          </WebGLBoundary>
        ) : (
          <div className="viewer-fallback">
            <Box size={48} />
          </div>
        )}
        {overlay && <div className="viewer-overlay">{overlay}</div>}
      </div>
      <div className="viewer-toolbar">
        <div className="toggle-group" role="group" aria-label="Viewer options">
          <button type="button" className="toggle" aria-pressed={opts.autoRotate} onClick={() => toggle('autoRotate')}>
            <Rotate3d size={14} /> Spin
          </button>
          <button type="button" className="toggle" aria-pressed={opts.showDims} onClick={() => toggle('showDims')}>
            <Ruler size={14} /> Size
          </button>
          <button type="button" className="toggle" aria-pressed={opts.showVolume} onClick={() => toggle('showVolume')}>
            <Grid3x3 size={14} /> Build volume
          </button>
          <button type="button" className="toggle" aria-pressed={opts.wireframe} onClick={() => toggle('wireframe')}>
            <Eye size={14} /> Wireframe
          </button>
          <button type="button" className="toggle" onClick={() => setFit((f) => f + 1)}>
            <Maximize2 size={14} /> Fit
          </button>
        </div>
        {hasModel && (
          <span className={`fit-status ${fits ? 'ok' : 'bad'}`}>
            {fits ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
            {fits ? 'Fits build volume' : 'Exceeds build volume'}
          </span>
        )}
      </div>
    </div>
  )
}
