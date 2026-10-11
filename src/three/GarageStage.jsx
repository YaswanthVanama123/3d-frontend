import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getGlowTexture } from './materials.js'
import { Appear, BlobShadow, Parallax, ViewStage } from './ViewStage.jsx'
import { getVehicleGeometry } from './vehicles/catalog.js'
import { VehicleModel } from './vehicles/VehicleModel.jsx'

/** Showroom turntable for the bikes & scooters section. */
export default function GarageStage({ vehicleKey, color, spin = true }) {
  const turntable = useRef(null)
  const glowMap = useMemo(getGlowTexture, [])
  const { center, size } = getVehicleGeometry(vehicleKey)

  useFrame((_, delta) => {
    if (spin) turntable.current.rotation.y += Math.min(delta, 0.05) * 0.28
  })

  return (
    <ViewStage camera={[2.35, 1.12, 3.2]} target={[0, 0.56, 0]} fov={30} env={1.2} rim="#ff9a6a" keyLight={2}>
      <spotLight position={[0, 4, 0.5]} angle={0.55} penumbra={0.8} intensity={30} distance={9} color="#fff1e0" />
      <Parallax strength={0.12}>
        <group ref={turntable} rotation-y={-0.6}>
          <mesh position-y={-0.035}>
            <cylinderGeometry args={[1.55, 1.6, 0.07, 96]} />
            <meshStandardMaterial color="#12141b" metalness={0.25} roughness={0.5} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.001}>
            <ringGeometry args={[1.49, 1.55, 96]} />
            <meshBasicMaterial color="#ff7a45" toneMapped={false} transparent opacity={0.8} />
          </mesh>
          <group scale={[size.x * 0.62, 1, size.z * 0.9]}>
            <BlobShadow size={1.6} opacity={0.65} y={0.003} />
          </group>
          <Appear key={vehicleKey} active speed={6}>
            <group position={[-center.x, 0, -center.z]}>
              <VehicleModel vehicleKey={vehicleKey} color={color} />
            </group>
          </Appear>
        </group>
      </Parallax>
      <sprite position={[0, 2.1, 0]} scale={[3.4, 3.4, 1]}>
        <spriteMaterial map={glowMap} color="#ffb47a" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </ViewStage>
  )
}
