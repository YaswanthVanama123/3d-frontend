import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Pedestal, useDamped } from '../ViewStage.jsx'
import { VisualFrame } from './common.jsx'

/** A little resin-printed robot figurine with an idle animation (waves when hovered). */
export function Robot({ color = '#c084fc', hovered = false, eyes = '#67e8f9' }) {
  const body = useRef(null)
  const head = useRef(null)
  const armL = useRef(null)
  const armR = useRef(null)
  const antenna = useRef(null)
  const hover = useDamped(hovered, 5)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    body.current.position.y = Math.sin(t * 2.2) * 0.015
    head.current.rotation.y = Math.sin(t * 0.8) * 0.45
    head.current.rotation.z = Math.sin(t * 1.3) * 0.05
    const waving = Math.max(hover.current, Math.max(0, Math.sin(t * 0.9) - 0.6) * 2.5)
    armR.current.rotation.z = 0.12 + waving * (2.3 + Math.sin(t * 9) * 0.3)
    armL.current.rotation.z = -0.12 - Math.sin(t * 2.2) * 0.06
    antenna.current.scale.setScalar(1 + Math.sin(t * 4) * 0.15)
  })

  return (
    <group ref={body}>
      {[-0.12, 0.12].map((x) => (
        <group key={x}>
          <RoundedBox args={[0.15, 0.32, 0.17]} radius={0.04} smoothness={3} position={[x, 0.24, 0]}>
            <meshStandardMaterial color="#d4d8e0" roughness={0.45} metalness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.19, 0.08, 0.26]} radius={0.03} smoothness={3} position={[x, 0.05, 0.03]}>
            <meshStandardMaterial color="#3a3f4b" roughness={0.5} />
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[0.5, 0.46, 0.34]} radius={0.08} smoothness={4} position={[0, 0.62, 0]}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0.66, 0.172]}>
        <circleGeometry args={[0.07, 32]} />
        <meshBasicMaterial color={eyes} toneMapped={false} />
      </mesh>
      {[
        [armL, -0.32],
        [armR, 0.32],
      ].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.8, 0]}>
          <RoundedBox args={[0.13, 0.36, 0.14]} radius={0.05} smoothness={3} position={[0, -0.17, 0]}>
            <meshStandardMaterial color="#d4d8e0" roughness={0.45} metalness={0.3} />
          </RoundedBox>
          <mesh position={[0, -0.38, 0]}>
            <sphereGeometry args={[0.075, 20, 16]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <group ref={head} position={[0, 1.0, 0]}>
        <RoundedBox args={[0.42, 0.34, 0.34]} radius={0.09} smoothness={4}>
          <meshStandardMaterial color="#eef0f4" roughness={0.3} metalness={0.1} />
        </RoundedBox>
        <RoundedBox args={[0.34, 0.13, 0.03]} radius={0.04} smoothness={3} position={[0, 0.0, 0.165]}>
          <meshStandardMaterial color="#111318" roughness={0.2} metalness={0.4} />
        </RoundedBox>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, 0.0, 0.185]}>
            <sphereGeometry args={[0.026, 16, 12]} />
            <meshBasicMaterial color={eyes} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh ref={antenna} position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export default function MiniaturesVisual({ active, hovered, accent = '#c084fc' }) {
  return (
    <VisualFrame active={active} camera={[0, 0.95, 3.5]} target={[0, 0.62, 0]} rim={accent}>
      <Pedestal radius={0.5} height={0.1} glow={accent} />
      <Robot color={accent} hovered={hovered} />
    </VisualFrame>
  )
}
