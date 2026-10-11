import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { geometries } from './geometries.js'
import { useAppearanceMaterial } from './useAppearanceMaterial.js'
import { BlobShadow, Parallax, Pedestal, ViewStage } from './ViewStage.jsx'

/** Materials section: a sample vase that morphs into the selected material and color. */
export default function MaterialStage({ material, colorHex }) {
  const turntable = useRef(null)
  const mat = useAppearanceMaterial(material?.appearance, colorHex, { layerFrequency: 42, layerStrength: 0.32 })

  useFrame((_, delta) => {
    turntable.current.rotation.y += Math.min(delta, 0.05) * 0.35
  })

  return (
    <ViewStage camera={[0, 1.35, 4.1]} target={[0, 0.62, 0]} fov={30} env={1.05} rim="#ff9a6a">
      <Parallax strength={0.22}>
        <BlobShadow size={2.4} opacity={0.6} y={-0.075} />
        <Pedestal radius={0.95} height={0.1} glow="#d95926" />
        <group ref={turntable}>
          <mesh geometry={geometries.vase()} material={mat} scale={0.78} />
        </group>
      </Parallax>
    </ViewStage>
  )
}
