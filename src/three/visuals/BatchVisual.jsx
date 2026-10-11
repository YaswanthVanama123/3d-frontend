import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { geometries } from '../geometries.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const GRID = 5
const SPACING = 0.34
const COUNT = GRID * GRID

/** Batch production: a full plate of identical parts pops into existence, then ripples. */
export default function BatchVisual({ active, hovered, accent = '#60a5fa' }) {
  const mesh = useRef(null)
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: accent, roughness: 0.42, metalness: 0.15 }), [accent])
  useEffect(() => () => material.dispose(), [material])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current)
    const local = s.t % 7.5
    const fade = 1 - smoothstep(6.6, 7.4, local)
    for (let i = 0; i < COUNT; i++) {
      const row = Math.floor(i / GRID)
      const col = i % GRID
      const x = (col - (GRID - 1) / 2) * SPACING
      const z = (row - (GRID - 1) / 2) * SPACING
      const appear = smoothstep(i * 0.08, i * 0.08 + 0.35, local)
      const pop = appear + Math.sin(appear * Math.PI) * 0.25
      const dist = Math.hypot(x, z)
      const wave = smoothstep(2.4, 3, local) * Math.sin(s.t * 3.2 - dist * 5) * 0.06
      dummy.position.set(x, 0.03 + Math.max(0, wave), z)
      dummy.rotation.set(0, s.t * (0.6 + (i % 3) * 0.25), 0)
      dummy.scale.setScalar(Math.max(0.001, pop * fade) * 0.28)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <VisualFrame active={active} camera={[0, 2.2, 2.9]} target={[0, 0, 0]} rim={accent}>
      <RoundedBox args={[1.95, 0.06, 1.95]} radius={0.02} smoothness={2} position-y={-0.03}>
        <meshStandardMaterial color="#1b1d24" metalness={0.4} roughness={0.5} />
      </RoundedBox>
      <instancedMesh ref={mesh} args={[geometries.spur(), material, COUNT]} frustumCulled={false} />
    </VisualFrame>
  )
}
