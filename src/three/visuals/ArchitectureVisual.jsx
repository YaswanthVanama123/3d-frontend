import { Edges, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

// [x, z, width, depth, height, glass?]
const BUILDINGS = [
  [-0.68, -0.42, 0.42, 0.5, 0.7],
  [0.02, -0.44, 0.36, 0.5, 1.15, true],
  [0.52, -0.5, 0.36, 0.36, 0.55],
  [0.86, -0.32, 0.18, 0.3, 0.32],
  [-0.7, 0.46, 0.4, 0.46, 0.4],
  [-0.02, 0.44, 0.3, 0.4, 0.5],
  [0.45, 0.42, 0.36, 0.46, 0.85],
  [0.86, 0.5, 0.2, 0.3, 0.26],
]
const TREES = [[-0.5, 0.22], [-0.12, 0.24], [0.28, 0.22], [0.7, 0.24], [-0.14, -0.14], [-0.44, -0.12]]

/** Architectural model: a white city block rises from the plate, building by building. */
export default function ArchitectureVisual({ active, hovered, accent = '#2dd4bf' }) {
  const turntable = useRef(null)
  const buildings = useRef([])
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current * 0.8)
    const local = s.t % 8
    buildings.current.forEach((mesh, i) => {
      if (!mesh) return
      const grow = smoothstep(0.3 + i * 0.22, 0.9 + i * 0.22, local) * (1 - smoothstep(7.1, 7.8, local))
      mesh.scale.y = Math.max(0.001, grow * BUILDINGS[i][4])
    })
    turntable.current.rotation.y += dt * (0.18 + hover.current * 0.5)
  })

  return (
    <VisualFrame active={active} camera={[0, 2.1, 3.7]} target={[0, 0.3, 0]} rim={accent}>
      <group ref={turntable} scale={0.85}>
        <RoundedBox args={[2.05, 0.08, 1.65]} radius={0.03} smoothness={2} position-y={-0.04}>
          <meshStandardMaterial color="#e7e5e0" roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, 0.002, 0.05]}>
          <boxGeometry args={[2.0, 0.006, 0.16]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.9} />
        </mesh>
        <mesh position={[-0.3, 0.003, 0]}>
          <boxGeometry args={[0.16, 0.006, 1.6]} />
          <meshStandardMaterial color="#3a3d45" roughness={0.9} />
        </mesh>
        {BUILDINGS.map(([x, z, w, d, , glass], i) => (
          <group key={i} position={[x, 0, z]} scale={[w, 1, d]}>
            <mesh ref={(el) => (buildings.current[i] = el)} geometry={unitBox} scale-y={0.001}>
              {glass ? (
                <meshStandardMaterial color={accent} metalness={0.3} roughness={0.15} transparent opacity={0.88} />
              ) : (
                <meshStandardMaterial color="#f4f2ee" roughness={0.7} />
              )}
              <Edges color={glass ? '#0f766e' : '#9aa3b5'} threshold={15} />
            </mesh>
          </group>
        ))}
        {TREES.map(([x, z]) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position-y={0.04}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
              <meshStandardMaterial color="#8b8f98" />
            </mesh>
            <mesh position-y={0.11}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color="#86efac" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </VisualFrame>
  )
}
