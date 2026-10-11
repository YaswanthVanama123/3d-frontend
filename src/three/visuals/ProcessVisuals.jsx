import { Float, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { shared } from '../geometries.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const cubeEdges = () => shared('cube-edges', () => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.5, 0.5)))

/** Process step 1: a model file with a wireframe cube being uploaded. */
export function UploadVisual({ active, hovered }) {
  const cube = useRef(null)
  const arrow = useRef(null)
  const ring = useRef(null)
  const hover = useDamped(hovered)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    cube.current.rotation.x += dt * 0.6
    cube.current.rotation.y += dt * (0.9 + hover.current)
    const k = (t * (0.6 + hover.current * 0.4)) % 1
    arrow.current.position.y = 0.35 + k * 0.9
    arrow.current.children.forEach((m) => (m.material.opacity = 1 - smoothstep(0.6, 1, k)))
    ring.current.scale.setScalar(0.6 + k * 0.9)
    ring.current.material.opacity = (1 - k) * 0.7
  })

  return (
    <VisualFrame active={active} camera={[0, 0.9, 3.6]} target={[0, 0.65, 0]}>
      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.4}>
        <group position={[-0.25, 0.6, 0]} rotation={[0, 0.35, -0.08]}>
          <RoundedBox args={[0.78, 1.0, 0.06]} radius={0.03} smoothness={3}>
            <meshStandardMaterial color="#e8eaef" roughness={0.4} />
          </RoundedBox>
          <mesh position={[-0.12, 0.3, 0.032]}>
            <planeGeometry args={[0.36, 0.11]} />
            <meshBasicMaterial color="#ff7a45" toneMapped={false} />
          </mesh>
          {[0.1, -0.02, -0.14, -0.26].map((y, i) => (
            <mesh key={y} position={[i === 3 ? -0.09 : 0, y, 0.032]}>
              <planeGeometry args={[i === 3 ? 0.42 : 0.6, 0.035]} />
              <meshBasicMaterial color="#b6bcc8" toneMapped={false} />
            </mesh>
          ))}
        </group>
      </Float>
      <lineSegments ref={cube} geometry={cubeEdges()} position={[0.48, 0.95, 0.2]}>
        <lineBasicMaterial color="#22d3ee" toneMapped={false} />
      </lineSegments>
      <group ref={arrow} position={[0.48, 0.4, 0.2]}>
        <mesh position-y={-0.08}>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshBasicMaterial color="#ff7a45" transparent toneMapped={false} />
        </mesh>
        <mesh position-y={0.06}>
          <coneGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#ff7a45" transparent toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={ring} position={[0.48, 0.02, 0.2]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.32, 0.36, 48]} />
        <meshBasicMaterial color="#ff7a45" transparent toneMapped={false} />
      </mesh>
    </VisualFrame>
  )
}

/** Process step 2: coins stacking up into an instant quote. */
export function QuoteVisual({ active, hovered }) {
  const coins = useRef([])
  const top = useRef(null)
  const hover = useDamped(hovered)
  const COINS = 5

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * (1 + hover.current * 0.6)
    const local = t % 5
    coins.current.forEach((coin, i) => {
      if (!coin) return
      const start = i * 0.45
      const k = smoothstep(start, start + 0.45, local)
      const bounce = Math.sin(k * Math.PI) * 0.12
      const rest = 0.04 + i * 0.075
      coin.position.y = rest + (1 - k) * 1.4 + bounce * (k < 1 ? 1 : 0)
      coin.visible = local > start && local < 4.6
      coin.rotation.y = (1 - k) * 4 + i
    })
    top.current.rotation.y += Math.min(delta, 0.05) * (2 + hover.current * 3)
    top.current.position.y = 0.95 + Math.sin(t * 2) * 0.05
  })

  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5c76a', metalness: 1, roughness: 0.25 }), [])

  return (
    <VisualFrame active={active} camera={[0, 1.1, 3.4]} target={[0, 0.45, 0]} rim="#ffd59a" env={1.1}>
      {Array.from({ length: COINS }, (_, i) => (
        <mesh key={i} ref={(el) => (coins.current[i] = el)} material={gold} position-x={-0.25}>
          <cylinderGeometry args={[0.32, 0.32, 0.07, 40]} />
        </mesh>
      ))}
      <group ref={top} position={[0.45, 0.95, 0]}>
        <mesh rotation-x={Math.PI / 2} material={gold}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 48]} />
        </mesh>
        <mesh position-z={0.032}>
          <ringGeometry args={[0.18, 0.22, 40]} />
          <meshStandardMaterial color="#b8892f" metalness={1} roughness={0.35} />
        </mesh>
      </group>
    </VisualFrame>
  )
}

/** Process step 4: a parcel that opens to reveal the finished part. */
export function ShipVisual({ active, hovered }) {
  const box = useRef(null)
  const flaps = useRef([])
  const item = useRef(null)
  const hover = useDamped(hovered)
  const cardboard = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c99a6b', roughness: 0.85 }), [])
  const W = 0.9
  const H = 0.55
  const D = 0.7

  useFrame((state) => {
    const t = state.clock.elapsedTime * (1 + hover.current * 0.5)
    const local = t % 6
    const open = smoothstep(1.2, 1.8, local) * (1 - smoothstep(4.2, 4.8, local))
    const hop = local < 1.2 || local > 4.8 ? Math.abs(Math.sin(local * Math.PI * 1.6)) * 0.06 : 0
    box.current.position.y = hop
    const angles = [open * 2.1, -open * 2.1, -open * 2.0, open * 2.0]
    flaps.current.forEach((f, i) => {
      if (!f) return
      if (i < 2) f.rotation.x = angles[i]
      else f.rotation.z = angles[i]
    })
    item.current.position.y = H - 0.25 + open * 0.55
    item.current.rotation.y = t * 1.5
    item.current.visible = open > 0.02
  })

  const wall = (args, position) => (
    <mesh material={cardboard} position={position}>
      <boxGeometry args={args} />
    </mesh>
  )

  return (
    <VisualFrame active={active} camera={[0.6, 1.5, 3.3]} target={[0, 0.45, 0]}>
      <group ref={box} rotation-y={-0.5}>
        {wall([W, 0.02, D], [0, 0.01, 0])}
        {wall([W, H, 0.02], [0, H / 2, D / 2])}
        {wall([W, H, 0.02], [0, H / 2, -D / 2])}
        {wall([0.02, H, D], [W / 2, H / 2, 0])}
        {wall([0.02, H, D], [-W / 2, H / 2, 0])}
        {/* flaps hinge on the top edges */}
        <group ref={(el) => (flaps.current[0] = el)} position={[0, H, D / 2]}>
          <mesh material={cardboard} position={[0, 0, -D / 4]}>
            <boxGeometry args={[W, 0.02, D / 2]} />
          </mesh>
          <mesh position={[0, 0.012, -D / 4]}>
            <boxGeometry args={[0.14, 0.004, D / 2]} />
            <meshStandardMaterial color="#8a6a45" roughness={0.6} />
          </mesh>
        </group>
        <group ref={(el) => (flaps.current[1] = el)} position={[0, H, -D / 2]}>
          <mesh material={cardboard} position={[0, 0, D / 4]}>
            <boxGeometry args={[W, 0.02, D / 2]} />
          </mesh>
          <mesh position={[0, 0.012, D / 4]}>
            <boxGeometry args={[0.14, 0.004, D / 2]} />
            <meshStandardMaterial color="#8a6a45" roughness={0.6} />
          </mesh>
        </group>
        <group ref={(el) => (flaps.current[2] = el)} position={[W / 2, H - 0.012, 0]}>
          <mesh material={cardboard} position={[-W / 4, 0, 0]}>
            <boxGeometry args={[W / 2, 0.02, D]} />
          </mesh>
        </group>
        <group ref={(el) => (flaps.current[3] = el)} position={[-W / 2, H - 0.012, 0]}>
          <mesh material={cardboard} position={[W / 4, 0, 0]}>
            <boxGeometry args={[W / 2, 0.02, D]} />
          </mesh>
        </group>
        <group ref={item}>
          <mesh>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#ff7a45" roughness={0.35} flatShading />
          </mesh>
        </group>
      </group>
    </VisualFrame>
  )
}
