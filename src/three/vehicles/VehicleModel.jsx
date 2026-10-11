import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { getVehicleGeometry, vehicleByKey } from './catalog.js'

function createMaterials() {
  const ds = THREE.DoubleSide
  return {
    paint: new THREE.MeshPhysicalMaterial({ color: '#888888', metalness: 0.45, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, side: ds }),
    paint2: new THREE.MeshPhysicalMaterial({ color: '#1b1c20', metalness: 0.4, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08, side: ds }),
    chrome: new THREE.MeshStandardMaterial({ color: '#f1f3f6', metalness: 1, roughness: 0.08, side: ds }),
    black: new THREE.MeshStandardMaterial({ color: '#141518', metalness: 0.35, roughness: 0.55, side: ds }),
    rubber: new THREE.MeshStandardMaterial({ color: '#111113', metalness: 0, roughness: 0.92 }),
    metal: new THREE.MeshStandardMaterial({ color: '#a9aeb5', metalness: 0.85, roughness: 0.35 }),
    engine: new THREE.MeshStandardMaterial({ color: '#2d2f35', metalness: 0.6, roughness: 0.42 }),
    steel: new THREE.MeshStandardMaterial({ color: '#80858c', metalness: 0.9, roughness: 0.48 }),
    reflector: new THREE.MeshStandardMaterial({ color: '#4a4f57', metalness: 1, roughness: 0.22 }),
    screen: new THREE.MeshStandardMaterial({ color: '#0d1a1f', emissive: '#4fd1e8', emissiveIntensity: 0.18, metalness: 0.3, roughness: 0.15 }),
    seat: new THREE.MeshStandardMaterial({ color: '#1d1d20', metalness: 0, roughness: 0.72 }),
    lens: new THREE.MeshStandardMaterial({ color: '#e6eef8', emissive: '#d6e6ff', emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.1 }),
    light: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    tail: new THREE.MeshStandardMaterial({ color: '#b3121b', emissive: '#ff1e2d', emissiveIntensity: 0.9 }),
    amber: new THREE.MeshStandardMaterial({ color: '#d97706', emissive: '#ff9d1c', emissiveIntensity: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: '#d4a017', metalness: 1, roughness: 0.25 }),
    plate: new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#6f8496', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: ds }),
  }
}

/** Renders one procedural vehicle (one mesh per material role). Paint changes ease in smoothly. */
export function VehicleModel({ vehicleKey, color }) {
  const { roles } = getVehicleGeometry(vehicleKey)
  const vehicle = vehicleByKey(vehicleKey)
  const mats = useMemo(createMaterials, [])
  const target = useMemo(() => ({ paint: new THREE.Color(), accent: new THREE.Color(), roughness: 0.3 }), [])

  useEffect(() => {
    target.paint.set(color.hex)
    target.accent.set(color.accent ?? '#1b1c20')
    target.roughness = color.matte ? 0.62 : 0.3
    mats.seat.color.set(color.seat ?? vehicle.seat ?? '#1d1d20')
  }, [color, vehicle, mats, target])

  // Start at the right colour instead of fading in from grey.
  useEffect(() => {
    mats.paint.color.set(color.hex)
    mats.paint2.color.set(color.accent ?? '#1b1c20')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mats])

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 6)
    mats.paint.color.lerp(target.paint, k)
    mats.paint2.color.lerp(target.accent, k)
    mats.paint.roughness += (target.roughness - mats.paint.roughness) * k
    mats.paint.clearcoat = 1 - Math.min(1, Math.max(0, (mats.paint.roughness - 0.3) / 0.32))
  })

  return (
    <group>
      {Object.entries(roles).map(([role, geometry]) => (
        <mesh key={role} geometry={geometry} material={mats[role] ?? mats.black} renderOrder={role === 'glass' ? 2 : 0} />
      ))}
    </group>
  )
}
