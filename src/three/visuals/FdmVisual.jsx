import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DOWN, UP, setWorldPlane } from '../clip.js'
import { GEAR_HEIGHT, KING_HEIGHT, VASE, gearRadiusAt, geometries, kingRadiusAt, vaseRadius } from '../geometries.js'
import { getGlowTexture, withLayerLines } from '../materials.js'
import { Pedestal, useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const SHAPES = {
  vase: { geometry: geometries.vaseLite, height: VASE.height, radiusAt: vaseRadius, speed: 7, scale: 0.62 },
  gear: { geometry: geometries.gear, height: GEAR_HEIGHT, radiusAt: gearRadiusAt, speed: 2.6, scale: 0.95 },
  king: { geometry: geometries.king, height: KING_HEIGHT, radiusAt: kingRadiusAt, speed: 7, scale: 0.62 },
}

/** A hot-end tracing the outline of a part while it grows layer by layer. */
export function MiniPrint({ shape = 'vase', color = '#ff7a45', hovered = false, cycle = 7 }) {
  const job = SHAPES[shape]
  const geometry = job.geometry()
  const turntable = useRef(null)
  const part = useRef(null)
  const nozzle = useRef(null)
  const glowMap = useMemo(getGlowTexture, [])
  const planes = useMemo(() => ({ main: new THREE.Plane(), top: new THREE.Plane(), bottom: new THREE.Plane() }), [])
  const mats = useMemo(
    () => ({
      part: withLayerLines(new THREE.MeshStandardMaterial({ color, roughness: 0.5, side: THREE.DoubleSide, clippingPlanes: [planes.main] }), { frequency: 32, strength: 0.32 }),
      band: new THREE.MeshBasicMaterial({ color: '#ffc27a', toneMapped: false, side: THREE.DoubleSide, transparent: true, clippingPlanes: [planes.top, planes.bottom] }),
    }),
    [color, planes],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const hover = useDamped(hovered)
  const sim = useRef({ t: Math.random() * cycle, theta: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    const boost = 1 + hover.current * 1.3
    s.t += dt * boost
    s.theta += dt * job.speed * boost
    const local = s.t % (cycle + 1.8)
    const progress = Math.min(1, local / cycle)
    const h = progress * job.height
    const r = job.radiusAt(s.theta, progress)

    const lift = smoothstep(cycle, cycle + 0.6, local) * 0.6
    nozzle.current.position.set(Math.cos(s.theta) * r * (1 - lift), h + 0.01 + lift, Math.sin(s.theta) * r * (1 - lift))
    part.current.scale.setScalar(1 - smoothstep(cycle + 1.3, cycle + 1.8, local) * 0.999)

    part.current.visible = h > 0.002
    setWorldPlane(planes.main, DOWN, h - 1e-3, part.current)
    setWorldPlane(planes.top, DOWN, h, part.current)
    setWorldPlane(planes.bottom, UP, -(h - 0.035), part.current)
    mats.band.opacity = progress < 1 ? 1 : Math.max(0, 1 - (local - cycle) * 2)

    turntable.current.rotation.y += dt * (0.25 + hover.current * 0.5)
  })

  return (
    <group ref={turntable}>
      <Pedestal radius={0.85} glow={color} />
      <group scale={job.scale}>
        <group ref={part}>
          <mesh geometry={geometry} material={mats.part} dispose={null} />
          <mesh geometry={geometry} material={mats.band} scale={[1.01, 1, 1.01]} dispose={null} />
        </group>
        <group ref={nozzle}>
          <mesh position-y={0.26}>
            <boxGeometry args={[0.26, 0.26, 0.26]} />
            <meshStandardMaterial color="#1d1f26" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position-y={0.42}>
            <boxGeometry args={[0.2, 0.06, 0.2]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          <mesh position-y={0.09}>
            <boxGeometry args={[0.13, 0.07, 0.11]} />
            <meshStandardMaterial color="#aab1bb" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position-y={0.03}>
            <cylinderGeometry args={[0.04, 0.012, 0.06, 16]} />
            <meshStandardMaterial color="#d6a54b" metalness={1} roughness={0.28} />
          </mesh>
          <sprite scale={0.34}>
            <spriteMaterial map={glowMap} color="#ff9a52" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      </group>
    </group>
  )
}

export default function FdmVisual({ active, hovered, accent = '#ff7a45', shape = 'vase' }) {
  return (
    <VisualFrame active={active} camera={[0, 1.25, 3.7]} target={[0, 0.5, 0]}>
      <MiniPrint shape={shape} color={accent} hovered={hovered} />
    </VisualFrame>
  )
}

/** "We print" step of the process section. */
export function PrintVisual({ active, hovered }) {
  return (
    <VisualFrame active={active} camera={[0, 1.4, 3.5]} target={[0, 0.42, 0]}>
      <MiniPrint shape="gear" color="#4f9fe8" hovered={hovered} cycle={5} />
    </VisualFrame>
  )
}
