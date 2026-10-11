import { QuadraticBezierLine, RoundedBox, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { DOWN, UP, setWorldPlane } from '../clip.js'
import { getGlowTexture, withLayerLines } from '../materials.js'
import { hud, PHASE_LABELS } from './hudStore.js'
import { PRINT_JOBS } from './printJobs.js'

// A procedural "bed-slinger" FDM printer: the bed moves in Z, the X gantry rides up the frame,
// and the print head moves along X. The part grows layer by layer via a clipping plane.
const BED_TOP = 0.386
const FRAME_Z = -0.2
const BAND = 0.022
const PARK = { x: -0.8, bedZ: 0.45 }
const HEAT_TIME = 1.6
const DONE_TIME = 2.8
const EJECT_TIME = 1.1
const COOL = new THREE.Color('#5a3a22')
const HOT = new THREE.Color('#ffc27a')

const lerp = THREE.MathUtils.lerp
const ease = (t) => t * t * (3 - 2 * t)

function createBedTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1c1d22'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 9000; i++) {
    const v = 30 + Math.random() * 40
    ctx.fillStyle = `rgba(${v + 22},${v + 12},${v},0.35)`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.4, 1.4)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  for (let i = 1; i < 10; i++) {
    const p = (i / 10) * size
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, size)
    ctx.moveTo(0, p)
    ctx.lineTo(size, p)
    ctx.stroke()
  }
  ctx.fillStyle = '#ff7a45'
  const m = 18
  const l = 46
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [size - m, m, -1, 1], [m, size - m, 1, -1], [size - m, size - m, -1, -1]]) {
    ctx.fillRect(x, y, l * sx, 4 * sy)
    ctx.fillRect(x, y, 4 * sx, l * sy)
  }
  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.textAlign = 'center'
  ctx.fillText('LAYERFORGE · TEXTURED PEI', size / 2, size - 24)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function useMaterials() {
  const mats = useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({ color: '#2b2f39', metalness: 0.65, roughness: 0.38 }),
      dark: new THREE.MeshStandardMaterial({ color: '#15161b', metalness: 0.2, roughness: 0.55 }),
      accent: new THREE.MeshStandardMaterial({ color: '#ff7a45', metalness: 0.1, roughness: 0.45 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.16 }),
      alu: new THREE.MeshStandardMaterial({ color: '#aab1bb', metalness: 0.9, roughness: 0.32 }),
      brass: new THREE.MeshStandardMaterial({ color: '#d6a54b', metalness: 1, roughness: 0.28 }),
      smoke: new THREE.MeshStandardMaterial({ color: '#2a2f3a', metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.55 }),
      bed: new THREE.MeshStandardMaterial({ map: createBedTexture(), metalness: 0.25, roughness: 0.6 }),
      tip: new THREE.MeshBasicMaterial({ color: '#ffb066', toneMapped: false }),
      filament: withLayerLines(new THREE.MeshStandardMaterial({ color: '#ff7a45', roughness: 0.42 }), { frequency: 120, strength: 0.4 }),
    }),
    [],
  )
  useEffect(
    () => () =>
      Object.values(mats).forEach((m) => {
        m.map?.dispose()
        m.dispose()
      }),
    [mats],
  )
  return mats
}

function useLcd() {
  const [lcd] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 150
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return { canvas, ctx: canvas.getContext('2d'), texture }
  })
  useEffect(() => () => lcd.texture.dispose(), [lcd])

  const draw = (progress, title, phase, color) => {
    const { ctx, canvas } = lcd
    ctx.fillStyle = '#071019'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#7dd3fc'
    ctx.font = '600 22px Inter, system-ui, sans-serif'
    ctx.fillText(phase.toUpperCase(), 18, 38)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '500 20px Inter, system-ui, sans-serif'
    ctx.fillText(title, 18, 68)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(18, 92, 284, 14)
    ctx.fillStyle = color
    ctx.fillRect(18, 92, 284 * progress, 14)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 22px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(progress * 100)}%`, 302, 136)
    lcd.texture.needsUpdate = true
  }
  return { texture: lcd.texture, draw }
}

function Base({ mats, lcd }) {
  return (
    <group>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} material={mats.frame} castShadow receiveShadow>
          <boxGeometry args={[0.12, 0.18, 2.5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 1.25]} material={mats.dark} castShadow receiveShadow>
        <boxGeometry args={[2.02, 0.34, 0.1]} />
      </mesh>
      <mesh position={[0, 0.15, -1.25]} material={mats.dark} castShadow>
        <boxGeometry args={[2.02, 0.24, 0.1]} />
      </mesh>
      <mesh position={[0.42, 0.21, 1.302]}>
        <planeGeometry args={[0.52, 0.24]} />
        <meshBasicMaterial map={lcd} toneMapped={false} />
      </mesh>
      <mesh position={[0.86, 0.21, 1.325]} rotation-x={Math.PI / 2} material={mats.accent}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 24]} />
      </mesh>
      <mesh position={[-0.5, 0.21, 1.302]}>
        <planeGeometry args={[0.62, 0.035]} />
        <meshBasicMaterial color="#ff7a45" toneMapped={false} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.27, 0]} rotation-x={Math.PI / 2} material={mats.chrome}>
          <cylinderGeometry args={[0.022, 0.022, 2.4, 12]} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -1.1]} material={mats.dark} castShadow>
        <boxGeometry args={[0.24, 0.24, 0.2]} />
      </mesh>
      {[[-0.95, -1.15], [0.95, -1.15], [-0.95, 1.15], [0.95, 1.15]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.03, z]} material={mats.dark}>
          <cylinderGeometry args={[0.08, 0.09, 0.06, 20]} />
        </mesh>
      ))}
    </group>
  )
}

function Frame({ mats, screwL, screwR }) {
  return (
    <group position-z={FRAME_Z}>
      {[-1.12, 1.12].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.6, 0]} material={mats.frame} castShadow receiveShadow>
            <boxGeometry args={[0.14, 2.95, 0.14]} />
          </mesh>
          <mesh position={[x, 0.32, 0]} material={mats.dark} castShadow>
            <boxGeometry args={[0.26, 0.24, 0.26]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.05, 0]} material={mats.frame} castShadow>
        <boxGeometry args={[2.38, 0.14, 0.14]} />
      </mesh>
      <mesh ref={screwL} position={[-0.98, 1.65, 0]} material={mats.brass}>
        <cylinderGeometry args={[0.02, 0.02, 2.6, 6]} />
      </mesh>
      <mesh ref={screwR} position={[0.98, 1.65, 0]} material={mats.brass}>
        <cylinderGeometry args={[0.02, 0.02, 2.6, 6]} />
      </mesh>
    </group>
  )
}

function XAxis({ mats }) {
  return (
    <group position-z={FRAME_Z}>
      {[0.26, 0.46].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-z={Math.PI / 2} material={mats.chrome} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 2.1, 12]} />
        </mesh>
      ))}
      {[-1.04, 1.04].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} material={mats.dark} castShadow>
          <boxGeometry args={[0.3, 0.45, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, 0.36, 0.06]} material={mats.dark}>
        <boxGeometry args={[2, 0.03, 0.01]} />
      </mesh>
    </group>
  )
}

function PrintHead({ mats, fanRef, tipRef, spriteRef, lightRef, glowMap }) {
  return (
    <group>
      <mesh position-y={0.035} material={mats.brass} castShadow>
        <cylinderGeometry args={[0.04, 0.012, 0.07, 18]} />
      </mesh>
      <mesh position-y={0.1} material={mats.alu} castShadow>
        <boxGeometry args={[0.14, 0.07, 0.12]} />
      </mesh>
      <mesh position-y={0.19} material={mats.chrome} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.11, 14]} />
      </mesh>
      <RoundedBox args={[0.36, 0.36, 0.3]} radius={0.04} smoothness={3} position={[0, 0.42, 0]} material={mats.dark} castShadow />
      <mesh position={[0, 0.52, 0.152]} material={mats.accent}>
        <boxGeometry args={[0.3, 0.08, 0.01]} />
      </mesh>
      <group position={[0, 0.36, 0.16]}>
        <mesh material={mats.frame}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
        </mesh>
        <group ref={fanRef} position-z={0.015}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation-z={(i / 5) * Math.PI} material={mats.alu}>
              <boxGeometry args={[0.03, 0.17, 0.005]} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh position={[0.16, 0.08, 0.04]} rotation-z={0.5} material={mats.accent} castShadow>
        <boxGeometry args={[0.07, 0.12, 0.12]} />
      </mesh>
      <mesh position={[0, 0.36, -0.17]} material={mats.frame}>
        <boxGeometry args={[0.38, 0.44, 0.04]} />
      </mesh>
      <mesh ref={tipRef} material={mats.tip}>
        <sphereGeometry args={[0.014, 12, 12]} />
      </mesh>
      <sprite ref={spriteRef} scale={0.32}>
        <spriteMaterial map={glowMap} color="#ff9450" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <pointLight ref={lightRef} position-y={-0.02} color="#ff8a3d" intensity={0} distance={1.6} decay={2} />
      <Sparkles count={14} scale={0.3} size={1.6} speed={0.9} color="#ffb070" opacity={0.8} />
    </group>
  )
}

function Spool({ mats, spoolRef }) {
  return (
    <group position={[0, 3.62, FRAME_Z]}>
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[0, -0.27, z]} material={mats.frame} castShadow>
          <boxGeometry args={[0.06, 0.5, 0.06]} />
        </mesh>
      ))}
      <mesh rotation-x={Math.PI / 2} material={mats.chrome}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 12]} />
      </mesh>
      <group ref={spoolRef}>
        <mesh rotation-x={Math.PI / 2} material={mats.filament} castShadow>
          <cylinderGeometry args={[0.37, 0.37, 0.25, 56, 1]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} material={mats.dark}>
          <cylinderGeometry args={[0.12, 0.12, 0.27, 24]} />
        </mesh>
        {[-0.135, 0.135].map((z) => (
          <mesh key={z} position-z={z} rotation-x={Math.PI / 2} material={mats.smoke}>
            <cylinderGeometry args={[0.44, 0.44, 0.022, 56]} />
          </mesh>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position-z={0.148} rotation-z={(i / 3) * Math.PI} material={mats.accent}>
            <boxGeometry args={[0.8, 0.04, 0.008]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Printer() {
  const mats = useMaterials()
  const lcd = useLcd()
  const glowMap = useMemo(getGlowTexture, [])
  const [jobIndex, setJobIndex] = useState(0)
  const job = PRINT_JOBS[jobIndex]
  const geometry = job.geometry()

  const bed = useRef(null)
  const gantry = useRef(null)
  const head = useRef(null)
  const part = useRef(null)
  const band = useRef(null)
  const spool = useRef(null)
  const fan = useRef(null)
  const screwL = useRef(null)
  const screwR = useRef(null)
  const filament = useRef(null)
  const tip = useRef(null)
  const sprite = useRef(null)
  const light = useRef(null)

  const planes = useMemo(() => ({ part: new THREE.Plane(), bandTop: new THREE.Plane(), bandBottom: new THREE.Plane() }), [])
  const printMat = useMemo(
    () =>
      withLayerLines(
        new THREE.MeshStandardMaterial({ color: PRINT_JOBS[0].color, roughness: 0.5, side: THREE.DoubleSide, clippingPlanes: [planes.part], clipShadows: true }),
        { frequency: 55, strength: 0.3 },
      ),
    [planes],
  )
  const bandMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffb46b', toneMapped: false, side: THREE.DoubleSide, transparent: true, clippingPlanes: [planes.bandTop, planes.bandBottom] }),
    [planes],
  )
  useEffect(
    () => () => {
      printMat.dispose()
      bandMat.dispose()
    },
    [printMat, bandMat],
  )
  useEffect(() => {
    printMat.color.set(job.color)
    printMat.userData.layerUniforms.uLayerFreq.value = job.layerFreq
    mats.filament.color.set(job.color)
  }, [job, printMat, mats])

  const sim = useRef({ phase: 'heating', time: 0, theta: 0, progress: 0, lastY: 0, lcdTimer: 1, from: { x: PARK.x, y: BED_TOP + 0.6, z: PARK.bedZ } })
  const pts = useMemo(() => ({ start: new THREE.Vector3(0.3, 3.36, -0.05), end: new THREE.Vector3(), mid: new THREE.Vector3() }), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const s = sim.current
    const H = job.height
    s.time += dt
    let x = PARK.x
    let y = BED_TOP + H + 0.4
    let z = PARK.bedZ
    let h = 0
    let heat = 0

    if (s.phase === 'heating') {
      const k = ease(Math.min(1, s.time / HEAT_TIME))
      x = lerp(s.from.x, job.radiusAt(0, 0), k)
      y = lerp(s.from.y, BED_TOP + 0.004, k)
      z = lerp(s.from.z, 0, k)
      heat = k
      if (s.time >= HEAT_TIME) Object.assign(s, { phase: 'printing', time: 0, theta: 0 })
    } else if (s.phase === 'printing') {
      s.progress = Math.min(1, s.time / job.seconds)
      h = s.progress * H
      s.theta += dt * job.speed
      const r = job.radiusAt(s.theta, s.progress)
      x = Math.cos(s.theta) * r
      z = -Math.sin(s.theta) * r // the bed moves so the outline point sits under the nozzle
      y = BED_TOP + h + 0.004
      heat = 1
      if (s.progress >= 1) Object.assign(s, { phase: 'done', time: 0, from: { x, y, z } })
    } else if (s.phase === 'done') {
      const k = ease(Math.min(1, s.time / 1.3))
      h = H
      x = lerp(s.from.x, PARK.x, k)
      y = lerp(s.from.y, BED_TOP + H + 0.4, k)
      z = lerp(s.from.z, PARK.bedZ, k)
      heat = 1 - k
      if (s.time >= DONE_TIME) Object.assign(s, { phase: 'eject', time: 0 })
    } else {
      const k = Math.min(1, s.time / EJECT_TIME)
      const e = ease(k)
      h = H
      part.current.scale.setScalar(Math.max(0.001, 1 - e))
      part.current.position.y = BED_TOP + e * 0.5
      if (k >= 1) {
        Object.assign(s, { phase: 'heating', time: 0, progress: 0, from: { x, y, z } })
        part.current.scale.setScalar(1)
        part.current.position.y = BED_TOP
        h = 0
        setJobIndex((i) => (i + 1) % PRINT_JOBS.length)
      }
    }

    head.current.position.x = x
    gantry.current.position.y = y
    bed.current.position.z = z
    screwL.current.rotation.y += (y - s.lastY) * 40
    screwR.current.rotation.y = screwL.current.rotation.y
    s.lastY = y

    // Grow the part: keep everything below the nozzle, plus a hot band of fresh layers.
    part.current.visible = h > 0.002
    setWorldPlane(planes.part, DOWN, h - 1e-3, part.current)
    setWorldPlane(planes.bandTop, DOWN, h, part.current)
    setWorldPlane(planes.bandBottom, UP, -(h - BAND), part.current)
    bandMat.opacity = s.phase === 'printing' ? 1 : s.phase === 'done' ? Math.max(0, 1 - s.time / 1.2) : 0
    band.current.visible = bandMat.opacity > 0.01

    mats.tip.color.lerpColors(COOL, HOT, heat)
    sprite.current.material.opacity = heat * 0.95
    light.current.intensity = heat * 1.8
    fan.current.rotation.z -= dt * (6 + 24 * heat)
    spool.current.rotation.z += dt * (s.phase === 'printing' ? 0.9 : 0.04)

    pts.end.set(x, y + 0.6, 0)
    pts.mid.set((pts.start.x + x) / 2, Math.max(y + 1.05, 3.2), 0.3)
    filament.current?.setPoints(pts.start, pts.end, pts.mid)

    hud.job = job.name
    hud.material = job.material
    hud.color = job.color
    hud.phase = s.phase
    hud.progress = s.phase === 'heating' ? 0 : s.phase === 'printing' ? s.progress : 1
    hud.layers = Math.round((H * 100) / 0.2)
    hud.layer = Math.round(hud.progress * hud.layers)
    hud.nozzle = Math.round(lerp(170, job.nozzle, heat) + (s.phase === 'printing' ? Math.sin(state.clock.elapsedTime * 2.3) * 0.8 : 0))
    hud.bed = job.bed
    hud.etaMin = (1 - hud.progress) * job.minutes

    s.lcdTimer += dt
    if (s.lcdTimer > 0.25) {
      s.lcdTimer = 0
      lcd.draw(hud.progress, job.name, PHASE_LABELS[s.phase], job.color)
    }
  })

  return (
    <group>
      <Base mats={mats} lcd={lcd.texture} />

      <group ref={bed}>
        <mesh position={[0, 0.33, 0]} material={mats.alu} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.04, 1.5]} />
        </mesh>
        <mesh position={[0, 0.37, 0]} material={mats.bed} receiveShadow>
          <boxGeometry args={[1.7, 0.03, 1.7]} />
        </mesh>
        <group ref={part} position-y={BED_TOP}>
          <mesh geometry={geometry} material={printMat} castShadow receiveShadow dispose={null} />
          <mesh ref={band} geometry={geometry} material={bandMat} scale={[1.008, 1, 1.008]} dispose={null} />
        </group>
      </group>

      <Frame mats={mats} screwL={screwL} screwR={screwR} />

      <group ref={gantry} position-y={BED_TOP + 0.6}>
        <XAxis mats={mats} />
        <group ref={head} position-x={PARK.x}>
          <PrintHead mats={mats} fanRef={fan} tipRef={tip} spriteRef={sprite} lightRef={light} glowMap={glowMap} />
        </group>
      </group>

      <Spool mats={mats} spoolRef={spool} />
      <QuadraticBezierLine ref={filament} start={[0.3, 3.36, -0.05]} end={[PARK.x, 1.6, 0]} mid={[0, 3.2, 0.3]} color={job.color} lineWidth={2.4} />
    </group>
  )
}
