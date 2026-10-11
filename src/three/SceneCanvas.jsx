import { View } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { hasWebGL } from './pointer.js'
import WebGLBoundary from './WebGLBoundary.jsx'

/**
 * A single fixed, transparent canvas layered over the page. Every <View> placed in the DOM
 * (service cards, process steps, materials, showcase…) is scissor-rendered into it, so the whole
 * site shares one WebGL context instead of creating dozens.
 */
export default function SceneCanvas() {
  const [eventSource] = useState(() => document.getElementById('root'))
  const [supported] = useState(hasWebGL)
  if (!supported) return null

  return (
    <WebGLBoundary>
      <Canvas
        className="scene-canvas"
        eventSource={eventSource}
        eventPrefix="client"
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true
        }}
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 5 }}
      >
        <View.Port />
      </Canvas>
    </WebGLBoundary>
  )
}
