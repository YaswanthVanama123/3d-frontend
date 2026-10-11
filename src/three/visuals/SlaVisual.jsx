import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { UP, setWorldPlane } from '../clip.js'
import { geometries } from '../geometries.js'
import { getGlowTexture } from '../materials.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const LIQUID_Y = 0.16
const PART_SCALE = 0.5
const PART_HALF = 0.695 * PART_SCALE // half-height of the torus knot at this scale

/** Inverted resin printing: the build plate lifts a glossy part out of a glowing resin vat. */
export default function SlaVisual({ active, hovered, accent = '#a78bfa' }) {
  const plate = useRef(null)
  const part = useRef(null)
  const scene = useRef(null)
  const screen = useRef(null)
  const drop = useRef(null)
  const plane = useMemo(() => new THREE.Plane(), [])
  const glowMap = useMemo(getGlowTexture, [])
  const partMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#d9ccff',
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.9,
        clippingPlanes: [plane],
      }),
    [plane],
  )
  useEffect(() => () => partMat.dispose(), [partMat])
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current * 1.2)
    const cycle = 6
    const local = s.t % (cycle + 1.6)
    const lift = smoothstep(0, cycle, local) * (PART_HALF * 2 + 0.12) - smoothstep(cycle + 1.1, cycle + 1.6, local) * (PART_HALF * 2 + 0.12)
    plate.current.position.y = LIQUID_Y + 0.04 + lift
    part.current.rotation.y += dt * 0.6
    setWorldPlane(plane, UP, -LIQUID_Y, scene.current)

    screen.current.material.opacity = 0.35 + 0.35 * Math.abs(Math.sin(s.t * 9))
    const dropT = (s.t * 0.8) % 1
    drop.current.position.y = plate.current.position.y - PART_HALF * 2 - 0.05 - dropT * 0.5
    drop.current.visible = drop.current.position.y > LIQUID_Y + 0.02 && local < cycle
    scene.current.rotation.y = Math.sin(s.t * 0.3) * 0.5
  })

  return (
    <VisualFrame active={active} camera={[0, 1.55, 4.1]} target={[0, 0.5, 0]}>
      <group ref={scene}>
        {/* vat */}
        <mesh position-y={0.06}>
          <boxGeometry args={[1.5, 0.22, 1.1]} />
          <meshStandardMaterial color="#1a1c24" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position-y={LIQUID_Y - 0.03}>
          <boxGeometry args={[1.38, 0.06, 0.98]} />
          <meshPhysicalMaterial color={accent} roughness={0.08} clearcoat={1} transparent opacity={0.75} />
        </mesh>
        <mesh ref={screen} position-y={LIQUID_Y + 0.001} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.3, 0.9]} />
          <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
        </mesh>
        {/* Z column */}
        <mesh position={[0, 0.72, -0.62]}>
          <boxGeometry args={[0.14, 1.45, 0.14]} />
          <meshStandardMaterial color="#2b2f39" metalness={0.65} roughness={0.38} />
        </mesh>
        {/* build plate + part hanging underneath */}
        <group ref={plate}>
          <mesh position-y={0.03}>
            <boxGeometry args={[0.9, 0.06, 0.7]} />
            <meshStandardMaterial color="#c4cad3" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.06, -0.38]}>
            <boxGeometry args={[0.12, 0.08, 0.5]} />
            <meshStandardMaterial color="#2b2f39" metalness={0.65} roughness={0.38} />
          </mesh>
          <group ref={part} position-y={-PART_HALF - 0.01} scale={PART_SCALE}>
            <mesh geometry={geometries.knot()} material={partMat} dispose={null} />
          </group>
        </group>
        <mesh ref={drop}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshPhysicalMaterial color="#d9ccff" roughness={0.05} clearcoat={1} transparent opacity={0.85} />
        </mesh>
        <sprite position-y={LIQUID_Y + 0.02} scale={[2.2, 0.9, 1]}>
          <spriteMaterial map={glowMap} color={accent} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      </group>
    </VisualFrame>
  )
}
