import { Float } from '@react-three/drei'
import { geometries } from './geometries.js'
import { Parallax, ViewStage } from './ViewStage.jsx'

const ITEMS = [
  { shape: 'gear', color: '#ff7a45', position: [-1.15, 0.55, 0], rotation: [0.9, 0.3, 0.2], scale: 0.75, metal: false },
  { shape: 'heart', color: '#fb7185', position: [1.1, 0.75, -0.3], rotation: [0, -0.4, 0.15], scale: 0.7, metal: false },
  { shape: 'rocket', color: '#e63946', position: [0.15, -0.35, 0.4], rotation: [0.2, 0, -0.5], scale: 0.62, metal: false },
  { shape: 'impeller', color: '#f5c76a', position: [-0.6, -0.85, -0.6], rotation: [0.8, 0, 0.3], scale: 0.55, metal: true },
  { shape: 'king', color: '#ece8df', position: [1.25, -0.75, 0.1], rotation: [0.1, 0, 0.25], scale: 0.45, metal: false },
]

/** Floating printed objects beside the final call-to-action. */
export default function CtaStage() {
  return (
    <ViewStage camera={[0, 0, 5.4]} target={[0, -0.05, 0]} fov={32} env={1}>
      <Parallax strength={0.35}>
        {ITEMS.map((item) => (
          <Float key={item.shape} speed={1.6} rotationIntensity={1.1} floatIntensity={1.2}>
            <mesh geometry={geometries[item.shape]()} position={item.position} rotation={item.rotation} scale={item.scale}>
              <meshPhysicalMaterial color={item.color} metalness={item.metal ? 1 : 0} roughness={item.metal ? 0.25 : 0.35} clearcoat={item.metal ? 0 : 0.6} />
            </mesh>
          </Float>
        ))}
      </Parallax>
    </ViewStage>
  )
}
