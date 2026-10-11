import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DOWN, UP, setWorldPlane } from '../clip.js'
import { geometries } from '../geometries.js'
import { withLayerLines } from '../materials.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const PAINTS = ['#fb923c', '#22d3ee', '#f472b6', '#a3e635', '#facc15']
const HALF = 0.7 // half height of the torus knot in local units
const SCALE = 0.62
const PARTICLES = 90

/** Post-processing: a spray gun sweeps up a raw, layer-lined print and leaves a glossy paint job. */
export default function FinishingVisual({ active, hovered }) {
  const part = useRef(null)
  const gun = useRef(null)
  const mist = useRef(null)
  const planes = useMemo(() => ({ raw: new THREE.Plane(), paint: new THREE.Plane() }), [])
  const mats = useMemo(
    () => ({
      raw: withLayerLines(new THREE.MeshStandardMaterial({ color: '#9aa0aa', roughness: 0.85, clippingPlanes: [planes.raw] }), { frequency: 40, strength: 0.35 }),
      paint: new THREE.MeshPhysicalMaterial({ color: PAINTS[0], roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, clippingPlanes: [planes.paint] }),
      mist: new THREE.PointsMaterial({ color: PAINTS[0], size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.75, depthWrite: false }),
    }),
    [planes],
  )
  const mistGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3))
    return g
  }, [])
  const particles = useMemo(() => Array.from({ length: PARTICLES }, () => ({ life: Math.random(), dy: 0, dz: 0, speed: 0 })), [])
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose())
      mistGeometry.dispose()
    },
    [mats, mistGeometry],
  )
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0, coat: -1 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current * 1.2)
    const cycle = 4.6
    const coat = Math.floor(s.t / cycle)
    const local = s.t % cycle
    if (coat !== s.coat) {
      s.coat = coat
      const color = PAINTS[coat % PAINTS.length]
      mats.paint.color.set(color)
      mats.mist.color.set(color)
    }
    const k = smoothstep(0.2, 3.4, local)
    const yLocal = -HALF + k * HALF * 2
    setWorldPlane(planes.raw, UP, -yLocal, part.current)
    setWorldPlane(planes.paint, DOWN, yLocal, part.current)
    part.current.rotation.y += dt * 0.8

    const spraying = local > 0.2 && local < 3.4
    const gy = 0.55 + yLocal * SCALE
    gun.current.position.y = gy

    const pos = mistGeometry.attributes.position
    for (let i = 0; i < PARTICLES; i++) {
      const p = particles[i]
      p.life += dt * (1.6 + p.speed)
      if (p.life >= 1) {
        p.life = spraying ? 0 : 1
        p.dy = (Math.random() - 0.5) * 0.35
        p.dz = (Math.random() - 0.5) * 0.45
        p.speed = Math.random()
      }
      const visible = p.life < 1
      const l = Math.min(p.life, 1)
      pos.setXYZ(i, 0.7 - l * 0.42, visible ? gy + p.dy * l : -10, p.dz * l)
    }
    pos.needsUpdate = true
    mats.mist.opacity = 0.75 * (spraying ? 1 : Math.max(0, mats.mist.opacity - dt * 3))
  })

  return (
    <VisualFrame active={active} camera={[0, 0.9, 3.7]} target={[0.05, 0.52, 0]}>
      <group position-y={0.55}>
        <group ref={part} scale={SCALE}>
          <mesh geometry={geometries.knot()} material={mats.raw} dispose={null} />
          <mesh geometry={geometries.knot()} material={mats.paint} dispose={null} />
        </group>
      </group>
      <group ref={gun} position-x={0.86}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 0.3, 20]} />
          <meshStandardMaterial color="#2b2f39" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position-x={-0.19} rotation-z={Math.PI / 2}>
          <coneGeometry args={[0.04, 0.09, 16]} />
          <meshStandardMaterial color="#d6a54b" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0.06, -0.14, 0]}>
          <boxGeometry args={[0.06, 0.2, 0.06]} />
          <meshStandardMaterial color="#fb923c" roughness={0.45} />
        </mesh>
      </group>
      <points ref={mist} geometry={mistGeometry} material={mats.mist} frustumCulled={false} />
    </VisualFrame>
  )
}
