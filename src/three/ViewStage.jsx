import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { MathUtils } from 'three'
import { StudioEnvironment } from './environment.jsx'
import { getShadowTexture } from './materials.js'
import { pointer } from './pointer.js'

/** Camera + studio lighting shared by every small scene. */
export function ViewStage({
  children,
  camera = [0, 0.9, 4.4],
  target = [0, 0.45, 0],
  fov = 30,
  env = 0.85,
  keyLight = 1.7,
  rim = '#7c9cff',
  ambient = 0.35,
}) {
  const cam = useRef(null)
  const [tx, ty, tz] = target
  const [cx, cy, cz] = camera

  useLayoutEffect(() => {
    cam.current?.lookAt(tx, ty, tz)
  }, [tx, ty, tz, cx, cy, cz])

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault position={[cx, cy, cz]} fov={fov} near={0.1} far={60} />
      <StudioEnvironment intensity={env} />
      <ambientLight intensity={ambient} />
      <directionalLight position={[3, 5, 4]} intensity={keyLight} />
      <directionalLight position={[-4, 2, -3]} intensity={1} color={rim} />
      {children}
    </>
  )
}

/** Tilts its children toward the mouse for a subtle 3D parallax. */
export function Parallax({ children, strength = 0.28, speed = 3 }) {
  const ref = useRef(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.x * strength, speed, dt)
    g.rotation.x = MathUtils.damp(g.rotation.x, -pointer.y * strength * 0.35, speed, dt)
  })
  return <group ref={ref}>{children}</group>
}

/** Scales its children in from nothing once `active` turns true (e.g. when a card scrolls into view). */
export function Appear({ active = true, children, speed = 4.5 }) {
  const ref = useRef(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.scale.setScalar(MathUtils.damp(g.scale.x, active ? 1 : 0.001, speed, dt))
  })
  return (
    <group ref={ref} scale={0.001}>
      {children}
    </group>
  )
}

/** A value that eases toward 1 while `on` is true and back to 0 otherwise (read `.current` in useFrame). */
export function useDamped(on, lambda = 6) {
  const value = useRef(on ? 1 : 0)
  useFrame((_, dt) => {
    value.current = MathUtils.damp(value.current, on ? 1 : 0, lambda, dt)
  })
  return value
}

export function BlobShadow({ size = 2, opacity = 0.5, y = 0.002 }) {
  const map = useMemo(getShadowTexture, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={map} color="#000000" transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** Thin glowing disc used as a pedestal / build plate under objects. */
export function Pedestal({ radius = 0.95, height = 0.08, color = '#151821', glow = '#ff7a45' }) {
  return (
    <group>
      <mesh position-y={-height / 2}>
        <cylinderGeometry args={[radius, radius * 1.04, height, 64]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001}>
        <ringGeometry args={[radius * 0.96, radius, 64]} />
        <meshBasicMaterial color={glow} toneMapped={false} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}
