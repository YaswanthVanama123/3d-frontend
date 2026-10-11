import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { geometries } from '../geometries.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

/** Rapid prototyping: an assembly that explodes into its parts and snaps back together. */
export default function PrototypingVisual({ active, hovered, accent = '#f472b6' }) {
  const parts = {
    base: useRef(null),
    body: useRef(null),
    cap: useRef(null),
    dome: useRef(null),
    gear: useRef(null),
    screws: useRef(null),
  }
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current)
    const local = s.t % 5
    const e = smoothstep(0.6, 1.6, local) * (1 - smoothstep(3.2, 4.3, local)) * (1 + hover.current * 0.3)
    parts.base.current.position.y = 0.09 - e * 0.12
    parts.body.current.position.y = 0.405 + e * 0.12
    parts.body.current.rotation.y = e * 0.8
    parts.cap.current.position.y = 0.67 + e * 0.28
    parts.dome.current.position.y = 0.71 + e * 0.42
    parts.dome.current.rotation.y = -e * 1.2
    parts.gear.current.position.x = 0.62 + e * 0.32
    parts.gear.current.rotation.x = s.t * 1.5
    parts.screws.current.position.y = -e * 0.28
  })

  return (
    <VisualFrame active={active} camera={[0.4, 1.3, 4.2]} target={[0.1, 0.58, 0]} rim={accent}>
      <group rotation-y={-0.5}>
        <group ref={parts.base}>
          <RoundedBox args={[1.1, 0.18, 0.8]} radius={0.04} smoothness={3}>
            <meshStandardMaterial color="#2b2f3a" metalness={0.35} roughness={0.4} />
          </RoundedBox>
        </group>
        <group ref={parts.body}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.45, 48]} />
            <meshStandardMaterial color={accent} roughness={0.4} />
          </mesh>
        </group>
        <group ref={parts.cap}>
          <mesh>
            <cylinderGeometry args={[0.34, 0.34, 0.08, 48]} />
            <meshStandardMaterial color="#f1f1ee" roughness={0.35} />
          </mesh>
        </group>
        <group ref={parts.dome}>
          <mesh>
            <sphereGeometry args={[0.22, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f1f1ee" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 16]} />
            <meshStandardMaterial color={accent} roughness={0.35} />
          </mesh>
        </group>
        <group ref={parts.gear} position={[0.62, 0.42, 0]}>
          <group rotation-z={Math.PI / 2} scale={0.32}>
            <mesh geometry={geometries.spur()} position-y={-0.09}>
              <meshStandardMaterial color="#60a5fa" roughness={0.4} />
            </mesh>
          </group>
        </group>
        <group ref={parts.screws}>
          {[[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
              <meshStandardMaterial color="#d9dde3" metalness={1} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>
    </VisualFrame>
  )
}
