import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { StudioEnvironment } from './environment.jsx'
import { useAppearanceMaterial } from './useAppearanceMaterial.js'

const MM = 0.01 // scene units per millimetre

function BuildPlate({ volume, fits, showVolume }) {
  // CAD X → scene X, CAD Y (depth) → scene Z, CAD Z (height) → scene Y
  const w = volume.x * MM
  const h = volume.z * MM
  const d = volume.y * MM
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d])
  useEffect(() => () => edges.dispose(), [edges])
  return (
    <group>
      <mesh position-y={-0.015} receiveShadow>
        <boxGeometry args={[w + 0.08, 0.03, d + 0.08]} />
        <meshStandardMaterial color="#14161d" metalness={0.45} roughness={0.5} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[w, d]}
        cellSize={0.1}
        cellThickness={0.6}
        cellColor="#262b3a"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor={fits ? '#3d4660' : '#7f1d1d'}
        fadeDistance={60}
        fadeStrength={0}
      />
      {showVolume && (
        <lineSegments geometry={edges} position-y={h / 2}>
          <lineBasicMaterial color={fits ? '#4b5675' : '#ef4444'} transparent opacity={0.75} />
        </lineSegments>
      )}
    </group>
  )
}

function DimensionLabels({ size, dims }) {
  const pad = Math.max(0.06, Math.max(size.x, size.z) * 0.08)
  return (
    <group>
      <Html position={[0, 0.01, size.z / 2 + pad]} center zIndexRange={[20, 0]}>
        <span className="dim-chip">X {dims.x.toFixed(1)} mm</span>
      </Html>
      <Html position={[size.x / 2 + pad, 0.01, 0]} center zIndexRange={[20, 0]}>
        <span className="dim-chip">Y {dims.y.toFixed(1)} mm</span>
      </Html>
      <Html position={[size.x / 2 + pad * 0.6, size.y / 2, size.z / 2 + pad * 0.6]} center zIndexRange={[20, 0]}>
        <span className="dim-chip">Z {dims.z.toFixed(1)} mm</span>
      </Html>
    </group>
  )
}

/** Smoothly frames the camera + orbit target around the model whenever it (or its scale) changes. */
function AutoFit({ radius, centerY, fitKey }) {
  const camera = useThree((s) => s.camera)
  const get = useThree((s) => s.get)
  const anim = useRef(null)

  useEffect(() => {
    const fov = THREE.MathUtils.degToRad(camera.fov)
    const distance = Math.max(0.5, (radius / Math.sin(fov / 2)) * 1.2)
    const target = new THREE.Vector3(0, centerY, 0)
    const dir = new THREE.Vector3(1, 0.72, 1.3).normalize()
    const controls = get().controls
    anim.current = {
      from: camera.position.clone(),
      to: target.clone().addScaledVector(dir, distance),
      targetFrom: controls ? controls.target.clone() : target.clone(),
      targetTo: target,
      t: 0,
    }
    camera.near = distance / 200
    camera.far = distance * 40
    camera.updateProjectionMatrix()
  }, [camera, get, radius, centerY, fitKey])

  useFrame((state, delta) => {
    const a = anim.current
    if (!a) return
    a.t = Math.min(1, a.t + Math.min(delta, 0.05) * 1.8)
    const k = 1 - (1 - a.t) ** 3
    camera.position.lerpVectors(a.from, a.to, k)
    const controls = state.controls
    if (controls) {
      controls.target.lerpVectors(a.targetFrom, a.targetTo, k)
      controls.update()
    } else {
      camera.lookAt(a.targetTo)
    }
    if (a.t >= 1) anim.current = null
  })
  return null
}

function Scene({ geometry, scale, appearance, color, buildVolume, fits, showVolume, showDims, wireframe, dims, layerHeightMm, fitKey }) {
  // Layer lines in object space: file units → mm → one line per layer.
  const layerFrequency = scale / MM / (layerHeightMm || 0.2)
  const material = useAppearanceMaterial(appearance, color, { layerFrequency, layerStrength: 0.35 })
  useEffect(() => {
    material.wireframe = wireframe
  }, [material, wireframe])

  const { size, radius } = useMemo(() => {
    geometry.computeBoundingBox()
    const s = new THREE.Vector3()
    geometry.boundingBox.getSize(s).multiplyScalar(scale)
    return { size: s, radius: Math.max(0.05, s.length() / 2) }
  }, [geometry, scale])

  return (
    <>
      <mesh geometry={geometry} material={material} scale={scale} castShadow receiveShadow />
      <BuildPlate volume={buildVolume} fits={fits} showVolume={showVolume} />
      {showDims && dims && <DimensionLabels size={size} dims={dims} />}
      <ContactShadows position={[0, 0.002, 0]} scale={Math.max(2, radius * 4)} far={Math.max(1, size.y * 1.2)} blur={2.2} opacity={0.55} resolution={512} frames={Infinity} />
      <AutoFit radius={radius} centerY={size.y / 2} fitKey={fitKey} />
    </>
  )
}

export default function ModelViewer({ autoRotate = true, ...props }) {
  return (
    <Canvas
      className="model-canvas"
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.8, 3], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
    >
      <StudioEnvironment intensity={0.9} />
      <ambientLight intensity={0.3} />
      <directionalLight castShadow position={[3, 6, 4]} intensity={2} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
      <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#7c9cff" />
      <Scene {...props} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={1.1} minDistance={0.2} maxDistance={40} />
    </Canvas>
  )
}
