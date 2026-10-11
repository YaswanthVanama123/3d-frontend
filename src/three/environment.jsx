import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// A neutral studio reflection map generated on the GPU — no HDR download needed.
// Cached per renderer so every View on the shared canvas reuses the same texture.
const cache = new WeakMap()

export function getStudioEnvironment(gl) {
  let texture = cache.get(gl)
  if (!texture) {
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    texture = pmrem.fromScene(room, 0.04).texture
    room.dispose?.()
    pmrem.dispose()
    cache.set(gl, texture)
  }
  return texture
}

export function StudioEnvironment({ intensity = 1 }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const previous = scene.environment
    scene.environment = getStudioEnvironment(gl)
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = previous
    }
  }, [gl, scene, intensity])

  return null
}
