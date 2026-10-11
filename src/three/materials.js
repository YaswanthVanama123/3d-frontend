import * as THREE from 'three'

/**
 * Adds rounded FDM "bead" shading along object-space Y so parts look layer-printed.
 * Lines fade out automatically when they would be smaller than a pixel (no moiré).
 * `material.userData.layerUniforms.uLayerStrength.value` can be animated at runtime.
 */
export function withLayerLines(material, { frequency = 50, strength = 0.28 } = {}) {
  const uniforms = { uLayerFreq: { value: frequency }, uLayerStrength: { value: strength } }
  material.userData.layerUniforms = uniforms
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvLayerY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerY;\nuniform float uLayerFreq;\nuniform float uLayerStrength;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
	{
		float coord = vLayerY * uLayerFreq;
		float aa = fwidth(coord);
		float wave = abs(fract(coord) - 0.5) * 2.0;
		float bead = sqrt(max(0.0, 1.0 - wave * wave));
		float visible = 1.0 - smoothstep(0.3, 0.75, aa);
		diffuseColor.rgb *= mix(1.0, mix(1.0 - uLayerStrength, 1.0, bead), visible);
	}`,
      )
  }
  material.customProgramCacheKey = () => 'layer-lines'
  return material
}

function radialTexture(stops) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

let glowTexture
let shadowTexture

/** Soft white radial sprite — tint it with the material color for halos and sparks. */
export function getGlowTexture() {
  glowTexture ??= radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.22, 'rgba(255,255,255,0.6)'],
    [0.55, 'rgba(255,255,255,0.12)'],
    [1, 'rgba(255,255,255,0)'],
  ])
  return glowTexture
}

/** Cheap blob shadow for small View scenes. */
export function getShadowTexture() {
  shadowTexture ??= radialTexture([
    [0, 'rgba(0,0,0,0.85)'],
    [0.45, 'rgba(0,0,0,0.35)'],
    [1, 'rgba(0,0,0,0)'],
  ])
  return shadowTexture
}
