import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { UP, setWorldPlane } from '../clip.js'
import { geometries } from '../geometries.js'
import { getGlowTexture } from '../materials.js'
import { useDamped } from '../ViewStage.jsx'
import { VisualFrame, smoothstep } from './common.jsx'

const BED = 1.5
const LASER_ORIGIN = new THREE.Vector3(0, 1.9, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

function usePowder(count = 1600) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (BED - 0.08)
      positions[i * 3 + 1] = 0.004 + Math.random() * 0.012
      positions[i * 3 + 2] = (Math.random() - 0.5) * (BED - 0.08)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [count])
}

/** Powder-bed fusion: a laser scans the powder while a lattice part rises out of the bed. */
export default function SlsVisual({ active, hovered, accent = '#38bdf8' }) {
  const scene = useRef(null)
  const part = useRef(null)
  const beam = useRef(null)
  const spot = useRef(null)
  const blade = useRef(null)
  const powder = usePowder()
  const glowMap = useMemo(getGlowTexture, [])
  const plane = useMemo(() => new THREE.Plane(), [])
  const partMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: 0.95, clippingPlanes: [plane] }), [plane])
  useEffect(
    () => () => {
      partMat.dispose()
      powder.dispose()
    },
    [partMat, powder],
  )
  const hover = useDamped(hovered)
  const sim = useRef({ t: 0 })
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), dir: new THREE.Vector3() }), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = sim.current
    s.t += dt * (1 + hover.current * 1.4)
    const cycle = 7
    const local = s.t % (cycle + 1.5)
    const rise = smoothstep(0.2, cycle, local) - smoothstep(cycle + 1, cycle + 1.5, local)
    part.current.position.y = -0.62 + rise * 0.64
    part.current.rotation.y = 0.6 + s.t * 0.15
    setWorldPlane(plane, UP, 0, scene.current)

    // laser raster
    const { target, dir } = tmp
    target.set(Math.sin(s.t * 3.3) * 0.55, 0.01, Math.sin(s.t * 0.9) * 0.5)
    dir.subVectors(target, LASER_ORIGIN)
    const length = dir.length()
    beam.current.position.copy(LASER_ORIGIN).addScaledVector(dir, 0.5)
    beam.current.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize())
    beam.current.scale.set(1, length, 1)
    spot.current.position.copy(target)
    spot.current.material.opacity = 0.75 + Math.sin(s.t * 40) * 0.2

    // recoater sweep every couple of seconds
    const sweep = (s.t % 2.2) / 2.2
    blade.current.position.z = -0.8 + smoothstep(0, 0.35, sweep) * 1.6
    blade.current.visible = sweep < 0.4
  })

  return (
    <VisualFrame active={active} camera={[0, 1.9, 3.6]} target={[0, 0.35, 0]}>
      <group ref={scene}>
        <mesh position-y={-0.15}>
          <boxGeometry args={[BED, 0.3, BED]} />
          <meshStandardMaterial color="#e9e6df" roughness={1} />
        </mesh>
        <points geometry={powder}>
          <pointsMaterial color="#ffffff" size={0.014} sizeAttenuation transparent opacity={0.8} />
        </points>
        {[[0, BED / 2 + 0.04, BED + 0.16, 0.08], [0, -BED / 2 - 0.04, BED + 0.16, 0.08]].map(([x, z, w, d]) => (
          <mesh key={z} position={[x, -0.1, z]}>
            <boxGeometry args={[w, 0.44, d]} />
            <meshStandardMaterial color="#20232c" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        {[BED / 2 + 0.04, -BED / 2 - 0.04].map((x) => (
          <mesh key={x} position={[x, -0.1, 0]}>
            <boxGeometry args={[0.08, 0.44, BED]} />
            <meshStandardMaterial color="#20232c" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <group ref={part} scale={0.72}>
          <mesh geometry={geometries.lattice()} material={partMat} dispose={null} />
        </group>
        <mesh ref={beam}>
          <cylinderGeometry args={[0.006, 0.006, 1, 8, 1, true]} />
          <meshBasicMaterial color={accent} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <sprite ref={spot} scale={0.32}>
          <spriteMaterial map={glowMap} color={accent} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[0.32, 0.12, 0.32]} />
          <meshStandardMaterial color="#20232c" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh ref={blade} position={[0, 0.04, -0.8]}>
          <boxGeometry args={[BED + 0.1, 0.05, 0.06]} />
          <meshStandardMaterial color="#c4cad3" metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </VisualFrame>
  )
}
