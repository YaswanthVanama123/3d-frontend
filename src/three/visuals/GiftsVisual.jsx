import { Float, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { geometries } from '../geometries.js'
import { Pedestal, useDamped } from '../ViewStage.jsx'
import { VisualFrame } from './common.jsx'

/** Custom gifts: a glossy heart with a heartbeat, surrounded by sparkles. */
export default function GiftsVisual({ active, hovered, accent = '#fb7185' }) {
  const heart = useRef(null)
  const hover = useDamped(hovered)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const beat = Math.pow(Math.max(0, Math.sin(t * (3.2 + hover.current * 2))), 12)
    heart.current.scale.setScalar(0.72 * (1 + beat * 0.09 + hover.current * 0.06))
    heart.current.rotation.y = Math.sin(t * 0.7) * 0.6 + hover.current * t * 0.8
  })

  return (
    <VisualFrame active={active} camera={[0, 0.7, 3.4]} target={[0, 0.55, 0]} rim={accent}>
      <Pedestal radius={0.6} glow={accent} />
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.04, 0.06]}>
        <group ref={heart} position-y={0.62}>
          <mesh geometry={geometries.heart()}>
            <meshPhysicalMaterial color={accent} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
          </mesh>
        </group>
      </Float>
      <Sparkles count={28} scale={[1.8, 1.4, 1.2]} position={[0, 0.65, 0]} size={2.5} speed={0.5} color="#ffd1dc" />
    </VisualFrame>
  )
}
