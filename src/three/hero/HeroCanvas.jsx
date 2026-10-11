import { Grid, PresentationControls, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { StudioEnvironment } from '../environment.jsx'
import { pointer } from '../pointer.js'
import Printer from './Printer.jsx'

const TARGET = new THREE.Vector3(0, 1.55, 0)

/** Frames the printer: shifted right on wide screens (text on the left), pulled back on portrait phones. */
function CameraRig() {
  const camera = useThree((s) => s.camera)
  const { width, height } = useThree((s) => s.size)
  const portrait = width < height * 0.95
  const desired = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    // On narrow screens the canvas sits below the copy, so the printer stays centred.
    if (width >= 1000) camera.setViewOffset(width, height, -width * 0.2, 0, width, height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }, [camera, width, height])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const distance = portrait ? 11.8 : width < 1000 ? 10.5 : 11.6
    desired
      .set(4.2 + Math.sin(t * 0.15) * 0.9 + pointer.x * 0.9, 1.7 + Math.sin(t * 0.21) * 0.25 + pointer.y * 0.5, 7.6)
      .normalize()
      .multiplyScalar(distance)
      .add(TARGET)
    camera.position.lerp(desired, 1 - Math.exp(-dt * 2))
    camera.lookAt(TARGET)
  })
  return null
}

function Floor() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[9, 64]} />
        <shadowMaterial transparent opacity={0.42} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[24, 24]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor="#1d2333"
        sectionSize={1.25}
        sectionThickness={1}
        sectionColor="#5a3426"
        fadeDistance={14}
        fadeStrength={2}
        infiniteGrid
      />
    </group>
  )
}

export default function HeroCanvas({ active = true }) {
  const [touch] = useState(() => window.matchMedia?.('(pointer: coarse)').matches)

  return (
    <Canvas
      className="hero-canvas"
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [5.4, 3.6, 8.2], fov: 32, near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <CameraRig />
      <StudioEnvironment intensity={0.55} />
      <ambientLight intensity={0.25} />
      <directionalLight
        castShadow
        position={[4.5, 7.5, 4]}
        intensity={2.3}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 3, -4]} intensity={1.1} color="#6f8cff" />
      <pointLight position={[-3, 1.4, 3]} intensity={14} distance={9} color="#ff7a45" />

      <PresentationControls global snap enabled={!touch} cursor={!touch} speed={1.3} polar={[-0.08, 0.16]} azimuth={[-0.9, 0.9]}>
        <Printer />
        <Floor />
      </PresentationControls>

      <Sparkles count={70} scale={[9, 4.5, 9]} position={[0, 2.2, 0]} size={2.2} speed={0.25} opacity={0.5} color="#ffb38a" />
    </Canvas>
  )
}
