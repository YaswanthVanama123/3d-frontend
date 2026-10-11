import { Grid } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DOWN, setWorldPlane } from '../clip.js'
import { GEAR_HEIGHT, geometries, shared } from '../geometries.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const gearEdges = () => shared('gear-edges', () => new THREE.EdgesGeometry(geometries.gear(), 25))

function Axes() {
  const axis = (color, rotation, position) => (
    <group rotation={rotation}>
      <mesh position={position}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[position[0], position[1] + 0.2, position[2]]}>
        <coneGeometry args={[0.03, 0.07, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
  return (
    <group position={[-1.05, 0.01, 0.75]}>
      {axis('#ef4444', [0, 0, -Math.PI / 2], [0, 0.18, 0])}
      {axis('#22c55e', [0, 0, 0], [0, 0.18, 0])}
      {axis('#3b82f6', [Math.PI / 2, 0, 0], [0, 0.18, 0])}
    </group>
  )
}

/** CAD: glowing wireframe model on a blueprint grid, filled in by a sweeping section plane. */
export default function CadVisual({ active, hovered, accent = '#22d3ee' }) {
  const model = useRef(null)
  const slice = useRef(null)
  const plane = useMemo(() => new THREE.Plane(), [])
  const solidMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0e7490', metalness: 0.3, roughness: 0.35, clippingPlanes: [plane], side: THREE.DoubleSide }),
    [plane],
  )
  useEffect(() => () => solidMat.dispose(), [solidMat])
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current)
    const local = s.t % 6
    const k = smoothstep(0.3, 2.8, local) * (1 - smoothstep(4.2, 5.6, local))
    const h = k * GEAR_HEIGHT
    setWorldPlane(plane, DOWN, h, model.current)
    slice.current.position.y = h
    slice.current.visible = k > 0.01 && k < 0.99
    model.current.rotation.y += dt * (0.3 + hover.current * 0.6)
  })

  return (
    <VisualFrame active={active} camera={[0, 1.7, 3.4]} target={[0, 0.25, 0]} rim={accent}>
      <Grid args={[3, 3]} cellSize={0.1} cellThickness={0.6} cellColor="#164e63" sectionSize={0.5} sectionThickness={1} sectionColor={accent} fadeDistance={4.5} fadeStrength={2} />
      <group ref={model} scale={0.95}>
        <mesh geometry={geometries.gear()} material={solidMat} dispose={null} />
        <lineSegments geometry={gearEdges()}>
          <lineBasicMaterial color={accent} transparent opacity={0.95} toneMapped={false} />
        </lineSegments>
        <mesh ref={slice} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial color={accent} transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <Axes />
    </VisualFrame>
  )
}
