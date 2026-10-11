import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { geometries } from '../geometries.js'
import { Pedestal, useDamped } from '../ViewStage.jsx'
import { VisualFrame } from './common.jsx'

/** Laser-fused metal: a polished impeller spinning over a glowing build plate with sparks. */
export default function MetalVisual({ active, hovered, accent = '#f5c76a' }) {
  const impeller = useRef(null)
  const hover = useDamped(hovered)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    impeller.current.rotation.y += dt * (0.6 + hover.current * 3.5)
    impeller.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 1.4) * 0.03
  })

  return (
    <VisualFrame active={active} camera={[0, 1.6, 3.4]} target={[0, 0.25, 0]} env={1.2} rim="#ffd59a">
      <Pedestal radius={0.95} glow={accent} color="#1b1d24" />
      <group ref={impeller} scale={0.95}>
        <mesh geometry={geometries.impeller()}>
          <meshStandardMaterial color={accent} metalness={1} roughness={0.22} />
        </mesh>
      </group>
      <Sparkles count={36} scale={[1.8, 0.8, 1.8]} position={[0, 0.35, 0]} size={2.4} speed={0.9} color="#ffb067" opacity={0.9} />
    </VisualFrame>
  )
}
