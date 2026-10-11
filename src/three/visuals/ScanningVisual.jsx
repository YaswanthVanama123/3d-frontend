import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'
import { DOWN, UP, setWorldPlane } from '../clip.js'
import { KING_HEIGHT, geometries, shared } from '../geometries.js'
import { Pedestal, useDamped } from '../ViewStage.jsx'
import { VisualFrame } from './common.jsx'

const SCALE = 0.62
const kingPoints = () =>
  shared('king-points', () => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometries.king())).build()
    const count = 3200
    const positions = new Float32Array(count * 3)
    const p = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      sampler.sample(p)
      p.toArray(positions, i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  })

/** 3D scanning: a laser sheet sweeps a rotating object, leaving a point cloud behind. */
export default function ScanningVisual({ active, hovered, accent = '#34d399' }) {
  const scene = useRef(null)
  const turntable = useRef(null)
  const laser = useRef(null)
  const planes = useMemo(() => ({ solid: new THREE.Plane(), cloud: new THREE.Plane() }), [])
  const mats = useMemo(
    () => ({
      solid: new THREE.MeshStandardMaterial({ color: '#4b5263', roughness: 0.55, metalness: 0.2, clippingPlanes: [planes.solid] }),
      cloud: new THREE.PointsMaterial({ color: accent, size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.95, clippingPlanes: [planes.cloud], toneMapped: false }),
    }),
    [accent, planes],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current * 1.2)
    const y = (0.5 - 0.5 * Math.cos(s.t * 1.1)) * KING_HEIGHT * SCALE * 1.02
    laser.current.position.y = y
    // unscanned solid above the laser sheet, captured point cloud below it
    setWorldPlane(planes.solid, UP, -y, scene.current)
    setWorldPlane(planes.cloud, DOWN, y, scene.current)
    turntable.current.rotation.y += dt * (0.7 + hover.current * 0.8)
  })

  return (
    <VisualFrame active={active} camera={[0, 1.25, 3.6]} target={[0, 0.48, 0]} rim={accent}>
      <group ref={scene}>
        <group ref={turntable}>
          <Pedestal radius={0.62} glow={accent} />
          <group scale={SCALE}>
            <mesh geometry={geometries.king()} material={mats.solid} dispose={null} />
            <points geometry={kingPoints()} material={mats.cloud} dispose={null} />
          </group>
        </group>
        <group ref={laser}>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.62, 64]} />
            <meshBasicMaterial color={accent} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.6, 0.625, 64]} />
            <meshBasicMaterial color={accent} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh position={[1.05, 0, 0]}>
            <boxGeometry args={[0.22, 0.12, 0.16]} />
            <meshStandardMaterial color="#20232c" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.93, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </VisualFrame>
  )
}
