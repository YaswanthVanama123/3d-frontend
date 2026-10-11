import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { geometries } from './geometries.js'
import { withLayerLines } from './materials.js'
import { Parallax, ViewStage } from './ViewStage.jsx'
import { Robot } from './visuals/MiniaturesVisual.jsx'

const TAU = Math.PI * 2
const RADIUS = 2.45
const SHAPES = {
  vase: geometries.vase,
  gear: geometries.gear,
  king: geometries.king,
  impeller: geometries.impeller,
  rocket: geometries.rocket,
  heart: geometries.heart,
}

function ShowcaseItem({ project, angle, active }) {
  const holder = useRef(null)
  const spinner = useRef(null)
  const geometry = project.shape === 'robot' ? null : SHAPES[project.shape]()

  const { scale, lift } = useMemo(() => {
    if (!geometry) return { scale: 0.5, lift: 0 }
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = 1.05 / Math.max(size.x, size.y, size.z)
    return { scale: s, lift: -box.min.y * s }
  }, [geometry])

  const material = useMemo(() => {
    const metal = project.tech === 'DMLS'
    const resin = project.tech === 'SLA'
    const m = new THREE.MeshPhysicalMaterial({
      color: project.color,
      metalness: metal ? 1 : 0,
      roughness: metal ? 0.25 : resin ? 0.22 : 0.5,
      clearcoat: resin ? 1 : 0.1,
    })
    return project.tech === 'FDM' ? withLayerLines(m, { frequency: 28, strength: 0.3 }) : m
  }, [project])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = active ? 1.18 : 0.78
    holder.current.scale.setScalar(THREE.MathUtils.damp(holder.current.scale.x, target, 5, dt))
    spinner.current.rotation.y += dt * (active ? 0.8 : 0.25)
  })

  return (
    <group position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.005}>
        <ringGeometry args={[0.5, 0.56, 48]} />
        <meshBasicMaterial color={active ? '#ff7a45' : '#3a3f4f'} toneMapped={false} transparent opacity={active ? 0.9 : 0.6} />
      </mesh>
      <group ref={holder} scale={0.82}>
        <Float speed={active ? 2 : 0} rotationIntensity={0.15} floatIntensity={active ? 0.4 : 0} floatingRange={[0, 0.08]}>
          <group ref={spinner}>
            {geometry ? (
              <mesh geometry={geometry} material={material} scale={scale} position-y={lift} />
            ) : (
              <group scale={0.82}>
                <Robot color={project.color} />
              </group>
            )}
          </group>
        </Float>
      </group>
    </group>
  )
}

/** Showcase section: a turntable carousel of printed projects. */
export default function ShowcaseStage({ projects, index }) {
  const ring = useRef(null)
  const target = useRef(0)
  const last = useRef(index)
  const step = TAU / projects.length

  useEffect(() => {
    let diff = index - last.current
    const n = projects.length
    if (diff > n / 2) diff -= n
    if (diff < -n / 2) diff += n
    target.current -= diff * step
    last.current = index
  }, [index, projects.length, step])

  useFrame((_, delta) => {
    ring.current.rotation.y = THREE.MathUtils.damp(ring.current.rotation.y, target.current, 3.5, Math.min(delta, 0.05))
  })

  return (
    <ViewStage camera={[0, 2.3, 7.6]} target={[0, 0.45, 0.7]} fov={30} env={1} rim="#8b9cff">
      <Parallax strength={0.12}>
        <mesh position-y={-0.04}>
          <cylinderGeometry args={[3.25, 3.35, 0.08, 96]} />
          <meshStandardMaterial color="#10121a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
          <ringGeometry args={[3.2, 3.25, 96]} />
          <meshBasicMaterial color="#ff7a45" toneMapped={false} transparent opacity={0.55} />
        </mesh>
        <group ref={ring}>
          {projects.map((project, i) => (
            <ShowcaseItem key={project.name} project={project} angle={i * step} active={i === index} />
          ))}
        </group>
      </Parallax>
    </ViewStage>
  )
}
