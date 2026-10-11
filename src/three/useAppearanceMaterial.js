import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { withLayerLines } from './materials.js'

/**
 * A physical material that smoothly animates toward a catalog material's look
 * (color, roughness, metalness, clearcoat, opacity, layer lines).
 */
export function useAppearanceMaterial(appearance, color, { layerFrequency = 40, layerStrength = 0.3 } = {}) {
  const material = useMemo(
    () =>
      withLayerLines(
        new THREE.MeshPhysicalMaterial({ color: color || '#cccccc', roughness: 0.5, transparent: true, side: THREE.DoubleSide }),
        { frequency: layerFrequency, strength: 0 },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const target = useMemo(() => ({ color: new THREE.Color(), roughness: 0.5, metalness: 0, clearcoat: 0, opacity: 1, layers: 0 }), [])

  useEffect(() => {
    const a = appearance || {}
    target.color.set(color || '#cccccc')
    target.roughness = a.roughness ?? 0.5
    target.metalness = a.metalness ?? 0
    target.clearcoat = a.clearcoat ?? 0
    target.opacity = a.opacity ?? 1
    target.layers = a.layerLines ? layerStrength : 0
  }, [appearance, color, layerStrength, target])

  useEffect(() => {
    material.userData.layerUniforms.uLayerFreq.value = layerFrequency
  }, [material, layerFrequency])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 6)
    material.color.lerp(target.color, k)
    material.roughness += (target.roughness - material.roughness) * k
    material.metalness += (target.metalness - material.metalness) * k
    material.clearcoat += (target.clearcoat - material.clearcoat) * k
    material.opacity += (target.opacity - material.opacity) * k
    material.depthWrite = material.opacity > 0.9
    const u = material.userData.layerUniforms.uLayerStrength
    u.value += (target.layers - u.value) * k
  })

  return material
}
