import * as THREE from 'three'
import { Parts, TAU, arcSolid, bar, discX, discZ, lerp3, place, profile, rbox, ring, rod, smooth01, spring, tube } from './parts.js'

// Parametric motorcycle. The rear axle sits at x = 0, the front axle at x = wheelbase, the ground at y = 0.
// Material roles: paint, paint2 (accent), chrome, black, rubber, metal, seat, lens, light, tail, amber, gold, plate, glass.

function wheel(P, { x, r, w, style = 'spoke', spokes = 36, knobby = false, rimRole }) {
  const y = r
  const tyre = w / 2
  P.add('rubber', new THREE.TorusGeometry(r - tyre, tyre, 14, 72), { p: [x, y, 0] })
  if (knobby) {
    const n = 46
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU
      P.add('rubber', new THREE.BoxGeometry(0.03, 0.016, w * 0.92), { p: [x + Math.cos(a) * (r - 0.006), y + Math.sin(a) * (r - 0.006), 0], r: [0, 0, a] })
    }
  }
  const role = rimRole ?? (style === 'spoke' ? 'chrome' : 'black')
  const rimR = r - w * 0.9
  P.add(role, ring([x, y], rimR - 0.012, rimR + 0.004, w * 0.62))
  P.add('metal', discZ([x, y, 0], 0.055, w * 0.85, 24))
  if (style === 'spoke') {
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * TAU
      const side = i % 2 ? 1 : -1
      const hub = [x + Math.cos(a + side * 0.28) * 0.045, y + Math.sin(a + side * 0.28) * 0.045, side * 0.03]
      const rim = [x + Math.cos(a) * (rimR - 0.012), y + Math.sin(a) * (rimR - 0.012), side * 0.006]
      P.add('chrome', rod(hub, rim, 0.0024, 0.0024, 4))
    }
  } else {
    const n = style === 'alloy10' ? 10 : style === 'alloy6' ? 6 : 5
    const thick = style === 'alloy10' ? 0.014 : 0.026
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU
      P.add(role, bar([x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05], [x + Math.cos(a) * (rimR - 0.008), y + Math.sin(a) * (rimR - 0.008)], thick, 0.028))
    }
  }
  return { x, y, r }
}

function brakeDisc(P, { x, y, r }, z, caliperRole = 'black') {
  P.add('metal', discZ([x, y, z], r * 0.46, 0.005, 40))
  P.add('black', discZ([x, y, z], r * 0.24, 0.008, 20))
  const a = 2.55
  P.add(caliperRole, rbox(0.075, 0.05, 0.035, 0.01), { p: [x + Math.cos(a) * r * 0.43, y + Math.sin(a) * r * 0.43, z + Math.sign(z) * 0.01], r: [0, 0, a] })
}

function fork(P, top, axle, { type = 'tele', spread = 0.09, gaiter = false, upperRole, lowerRole }) {
  const dx = axle[0] - top[0]
  const dy = axle[1] - top[1]
  const len = Math.hypot(dx, dy)
  const angle = Math.atan2(dx, -dy)
  const topExt = [top[0] - (dx / len) * 0.11, top[1] - (dy / len) * 0.11]
  for (const side of [-1, 1]) {
    const z = side * spread
    const a = [...topExt, z]
    const b = [axle[0], axle[1], z]
    if (type === 'usd') {
      P.add(upperRole ?? 'gold', rod(a, lerp3(a, b, 0.55), 0.031))
      P.add(lowerRole ?? 'chrome', rod(lerp3(a, b, 0.5), lerp3(a, b, 0.97), 0.02))
      P.add('black', rbox(0.06, 0.08, 0.05, 0.012), { p: [axle[0], axle[1] + 0.015, z], r: [0, 0, angle] })
    } else {
      P.add(upperRole ?? 'chrome', rod(a, lerp3(a, b, 0.55), 0.019))
      P.add(lowerRole ?? 'metal', rod(lerp3(a, b, 0.45), b, 0.027, 0.025))
      if (gaiter) P.add('rubber', rod(lerp3(a, b, 0.33), lerp3(a, b, 0.47), 0.026))
    }
  }
  for (const t of [0, -0.1]) {
    const p = [top[0] + (dx / len) * t, top[1] + (dy / len) * t]
    P.add('black', rbox(0.07, 0.032, spread * 2 + 0.07, 0.01), { p: [p[0], p[1], 0], r: [0, 0, angle] })
  }
  P.add('metal', discZ([axle[0], axle[1], 0], 0.012, spread * 2 + 0.05, 10))
  return { angle, topExt }
}

function frame(P, o, pivot) {
  const head = o.fork.top
  const headTop = [head[0] - 0.035, head[1] + 0.1]
  P.add('black', rod([...headTop, 0], [head[0] + 0.02, head[1] - 0.07, 0], 0.034))
  P.add('black', tube([[headTop[0] - 0.02, headTop[1] - 0.03, 0], [o.tank.x0 + 0.12, o.tank.bottom + 0.0, 0], [o.seat.x1 - 0.06, o.seat.y - 0.08, 0], [pivot[0] + 0.03, pivot[1] + 0.12, 0]], 0.022))
  for (const side of [-1, 1]) {
    const z = side * 0.06
    const cx = o.engine.crank[0]
    P.add('black', tube([[head[0], head[1] - 0.05, 0], [head[0] - 0.07, head[1] - 0.3, z], [cx + 0.26, 0.3, z * 1.5], [cx - 0.02, 0.2, z * 1.7], [pivot[0], pivot[1] - 0.05, z * 1.6]], 0.016))
    P.add('black', tube([[pivot[0] + 0.03, pivot[1] + 0.1, z * 1.6], [o.seat.x0 + 0.12, o.seat.y - 0.08, z * 1.75], [o.tail.x + 0.04, o.seat.y - 0.06, z * 1.4]], 0.012))
  }
  P.add('metal', discZ([pivot[0], pivot[1], 0], 0.018, 0.24, 12))
}

function swingarm(P, pivot, rearY, o) {
  for (const side of [-1, 1]) P.add('black', bar(pivot, [0, rearY], 0.036, 0.03, side * 0.085))
  P.add('metal', discZ([0, rearY, 0], 0.013, 0.24, 10))
  // chain guard on the left
  P.add(o.chainGuardRole ?? 'black', bar([pivot[0] - 0.02, pivot[1] + 0.05], [0.06, rearY + 0.06], 0.035, 0.012, 0.115))
}

function shocks(P, o, rear) {
  const springRole = o.springRole ?? 'chrome'
  if (o.shocks === 'mono') {
    const lower = [0.24, rear.r + 0.06, -0.075]
    const upper = [0.4, o.seat.y - 0.1, -0.06]
    P.add('black', rod(lower, upper, 0.016))
    P.add(springRole, spring(lerp3(lower, upper, 0.15), lerp3(lower, upper, 0.8), 0.028, 0.005, 8))
    return
  }
  for (const side of [-1, 1]) {
    const lower = [0.07, rear.r + 0.035, side * 0.11]
    const upper = [0.15, o.seat.y - 0.07, side * 0.115]
    P.add('chrome', rod(lower, upper, 0.013))
    P.add(springRole, spring(lerp3(lower, upper, 0.18), lerp3(lower, upper, 0.86), 0.024, 0.0045, 9))
    P.add('black', rod(lerp3(lower, upper, 0.86), upper, 0.02))
  }
}

function finnedBarrel(P, base, tilt, height, width, depth, fins, role, z = 0) {
  const dir = [Math.sin(tilt), Math.cos(tilt)]
  const top = [base[0] + dir[0] * height, base[1] + dir[1] * height]
  P.add(role, rod([...base, z], [...top, z], Math.min(width, depth) * 0.33))
  for (let i = 0; i < fins; i++) {
    const t = (i + 0.5) / fins
    const k = 1 - t * 0.12
    P.add(role, rbox(width * k, 0.01, depth * k, 0.003, 1), { p: [base[0] + dir[0] * height * t, base[1] + dir[1] * height * t, z], r: [0, 0, -tilt] })
  }
  return top
}

function engine(P, e) {
  const [cx, cy] = e.crank
  const role = e.role ?? 'metal'
  const covers = e.covers ?? 'chrome'
  const tilt = e.tilt ?? 0.15
  const twin = e.type === 'twin'
  const caseW = twin ? 0.3 : 0.25
  P.add(role, rbox(0.4, 0.24, caseW, 0.06), { p: [cx, cy, 0] })
  P.add(role, rbox(0.2, 0.18, caseW - 0.03, 0.04), { p: [cx - 0.2, cy + 0.03, 0] })
  P.add(covers, discZ([cx - 0.04, cy + 0.01, -(caseW / 2 + 0.015)], 0.11, 0.035, 40))
  P.add(covers, place(new THREE.SphereGeometry(0.1, 28, 12, 0, TAU, 0, Math.PI / 2), { s: [1, 0.35, 1] }), { p: [cx + 0.07, cy - 0.01, caseW / 2 - 0.005], r: [Math.PI / 2, 0, 0] })
  const ports = []
  if (e.type === 'liquid') {
    const base = [cx + 0.05, cy + 0.12]
    P.add(role, rbox(0.22, 0.24, 0.22, 0.04), { p: [base[0] + 0.03, base[1] + 0.12, 0], r: [0, 0, -tilt] })
    P.add(covers, rbox(0.16, 0.05, 0.16, 0.02), { p: [base[0] + 0.07, base[1] + 0.27, 0], r: [0, 0, -tilt] })
    P.add('black', rbox(0.05, 0.28, 0.32, 0.012), { p: [cx + 0.33, cy + 0.24, 0], r: [0, 0, 0.12] })
    for (let i = 0; i < 7; i++) P.add('metal', rbox(0.052, 0.008, 0.3, 0.002, 1), { p: [cx + 0.335, cy + 0.13 + i * 0.035, 0], r: [0, 0, 0.12] })
    ports.push([base[0] + 0.15, base[1] + 0.16, 0])
  } else {
    const banks = twin ? [-0.075, 0.075] : [0]
    for (const z of banks) {
      const base = [cx + 0.05, cy + 0.12]
      const top = finnedBarrel(P, base, tilt, e.height ?? 0.24, twin ? 0.15 : 0.21, twin ? 0.13 : 0.2, e.fins ?? 10, role, z)
      P.add(role, rbox(twin ? 0.16 : 0.2, 0.08, twin ? 0.14 : 0.2, 0.025), { p: [top[0], top[1] + 0.03, z], r: [0, 0, -tilt] })
      P.add(covers, rbox(twin ? 0.1 : 0.13, 0.045, twin ? 0.1 : 0.15, 0.02), { p: [top[0] - 0.01, top[1] + 0.08, z], r: [0, 0, -tilt] })
      ports.push([top[0] + 0.08, top[1] - 0.01, z])
    }
  }
  return ports
}

function exhaust(P, x, ports) {
  const role = x.role ?? 'chrome'
  const pipes = x.type === 'twin' ? ports.map((port, i) => ({ port, side: i === 0 ? -1 : 1 })) : [{ port: ports[0], side: -1 }]
  for (const { port, side } of pipes) {
    const z = side * 0.16
    if (x.type === 'peashooter' || x.type === 'twin') {
      P.add(role, tube([[port[0], port[1], port[2]], [port[0] + 0.07, port[1] - 0.1, side * 0.1], [port[0] + 0.03, 0.36, side * 0.15], [port[0] - 0.16, 0.25, z], [0.38, 0.27, z], [0.2, 0.29, z]], 0.021))
      P.add(role, rod([0.24, 0.285, z], [-0.33, 0.37, z], 0.034, 0.047, 24))
      P.add('black', rod([-0.33, 0.37, z], [-0.345, 0.372, z], 0.03, 0.03, 16))
    } else if (x.type === 'upswept') {
      P.add(role, tube([[port[0], port[1], port[2]], [port[0] + 0.05, 0.42, side * 0.1], [0.5, 0.27, z], [0.28, 0.33, z], [0.08, 0.5, z]], 0.024))
      P.add(x.mufflerRole ?? 'black', rod([0.1, 0.49, z], [-0.24, 0.63, z], 0.048, 0.055, 24))
      P.add('chrome', rod([-0.24, 0.63, z], [-0.26, 0.638, z], 0.04, 0.04, 16))
    } else {
      // short low-slung muffler (Ronin / Hunter)
      P.add(role, tube([[port[0], port[1], port[2]], [port[0] + 0.06, port[1] - 0.12, side * 0.08], [port[0] - 0.02, 0.24, side * 0.11], [0.5, 0.21, z * 0.75]], 0.022))
      P.add(x.mufflerRole ?? role, rod([0.5, 0.22, z * 0.8], [0.12, 0.34, z], 0.046, 0.056, 24))
      P.add(x.shieldRole ?? 'metal', rod([0.38, 0.262, z * 0.88 + side * 0.012], [0.18, 0.325, z + side * 0.012], 0.034, 0.04, 20))
    }
  }
}

const tankHf = (t, u) => (t.shape === 'adv' ? 0.8 + 0.2 * smooth01(0, 0.6, u) : 0.5 + 0.5 * smooth01(0.02, 0.7, u))
const tankWf = (t, u) => (t.shape === 'adv' ? 0.85 : 0.7) + 0.3 * smooth01(0, 0.62, u)

/** |z| of the teardrop tank's surface at (x, y) — so badges and stripes sit on the paint, not in the air. */
function tankSurfaceZ(t, x, y) {
  const len = t.x1 - t.x0
  const xs = (x - (t.x0 + len / 2)) / (len / 2)
  const u = (xs + 1) / 2
  const half = (tankHf(t, u) * t.height) / 2
  const local = y - (t.bottom + 0.32 * tankHf(t, 0.5) * (t.height / 2))
  const ys = local >= 0 ? local / half : local / (half * 0.32)
  return Math.sqrt(Math.max(0, 1 - xs * xs - ys * ys)) * tankWf(t, u) * (t.width / 2)
}

function tank(P, t) {
  const len = t.x1 - t.x0
  const role = t.role ?? 'paint'
  const g = new THREE.SphereGeometry(1, 48, 28)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    let y = pos.getY(i)
    const z = pos.getZ(i)
    const u = (x + 1) / 2
    const hf = tankHf(t, u)
    const wf = tankWf(t, u)
    if (y < 0) y *= 0.32
    pos.setXYZ(i, (x * len) / 2, (y * hf * t.height) / 2, (z * wf * t.width) / 2)
  }
  g.computeVertexNormals()
  g.computeBoundingBox()
  g.translate(t.x0 + len / 2, t.bottom - g.boundingBox.min.y, 0)
  P.add(role, g)
  const at = (u, v) => [t.x0 + len * u, t.bottom + t.height * v]
  for (const side of [-1, 1]) {
    if (t.kneePads) {
      const [x, y] = at(0.24, 0.3)
      P.add('rubber', rbox(0.11, 0.07, 0.014, 0.006), { p: [x, y, side * (tankSurfaceZ(t, x, y) - 0.002)], r: [0, side * 0.18, 0] })
    }
    if (t.badge) {
      const [x, y] = at(0.6, 0.38)
      P.add('chrome', discZ([x, y, side * (tankSurfaceZ(t, x, y) + 0.001)], 0.04, 0.008, 24))
    }
    if (t.stripe) {
      // gold pinstripe traced over the curved tank surface
      const [cx, cy] = at(0.56, 0.36)
      const points = []
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * TAU
        const x = cx + Math.cos(a) * len * 0.27
        const y = cy + Math.sin(a) * t.height * 0.24
        points.push(new THREE.Vector3(x, y, side * (tankSurfaceZ(t, x, y) + 0.0015)))
      }
      P.add(t.stripeRole ?? 'gold', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 96, 0.0032, 6, true))
    }
  }
  P.add('chrome', new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24), { p: [t.x0 + len * 0.62, t.bottom + t.height - 0.004, 0] })
}

function seat(P, s) {
  const role = s.role ?? 'seat'
  const { x0, x1, y } = s
  const w = s.width ?? 0.28
  if (s.type === 'split') {
    const mid = x0 + (x1 - x0) * 0.42
    P.add(role, profile([[mid, y - 0.05], [mid + 0.01, y + 0.04], [mid + 0.12, y + 0.0], [x1 - 0.07, y + 0.03], [x1, y + 0.06], [x1 - 0.02, y - 0.04], [mid + 0.1, y - 0.07]], w * 1.05, { bevel: 0.035 }))
    P.add(role, profile([[x0, y - 0.02], [x0 + 0.02, y + 0.045], [mid - 0.05, y + 0.05], [mid - 0.025, y - 0.005], [mid - 0.06, y - 0.045], [x0 + 0.04, y - 0.05]], w * 0.85, { bevel: 0.03 }))
  } else {
    P.add(role, profile([[x0, y - 0.04], [x0 + 0.015, y + 0.035], [x0 + (x1 - x0) * 0.45, y + 0.05], [x1 - 0.06, y + 0.025], [x1, y - 0.035], [x1 - 0.05, y - 0.075], [x0 + 0.05, y - 0.075]], w, { bevel: 0.035 }))
  }
  if (s.grabRail) P.add('black', tube([[x0 + 0.2, y - 0.02, -0.15], [x0 + 0.02, y + 0.0, -0.14], [x0 - 0.06, y + 0.02, 0], [x0 + 0.02, y + 0.0, 0.14], [x0 + 0.2, y - 0.02, 0.15]], 0.011))
}

function fenders(P, o, F, R) {
  const f = o.fenders
  P.add(f.frontRole ?? 'paint', arcSolid([F.x, F.y], F.r + (f.frontGap ?? 0.03), F.r + (f.frontGap ?? 0.03) + 0.012, (o.front.w ?? 0.1) + 0.06, f.front[0], f.front[1]))
  P.add(f.rearRole ?? 'paint', arcSolid([R.x, R.y], R.r + 0.035, R.r + 0.047, (o.rear.w ?? 0.12) + 0.07, f.rear[0], f.rear[1]))
  if (f.stays) {
    for (const side of [-1, 1]) {
      for (const a of [f.front[0] + 0.5, f.front[1] - 0.5]) P.add('chrome', rod([F.x, F.y, side * 0.07], [F.x + Math.cos(a) * (F.r + 0.03), F.y + Math.sin(a) * (F.r + 0.03), side * 0.07], 0.005, 0.005, 6))
      P.add('chrome', rod([R.x, R.y, side * 0.09], [R.x + Math.cos(2.8) * (R.r + 0.04), R.y + Math.sin(2.8) * (R.r + 0.04), side * 0.08], 0.006, 0.006, 6))
    }
  }
}

function headlight(P, h, forkSpread = 0.09) {
  const [x, y] = h.pos
  const r = h.r
  P.add(h.housing ?? 'chrome', new THREE.CylinderGeometry(r, r * 0.82, r * 0.9, 40), { p: [x - r * 0.4, y, 0], r: [0, 0, -Math.PI / 2] })
  P.add('chrome', new THREE.TorusGeometry(r * 0.96, 0.01, 8, 48), { p: [x + 0.004, y, 0], r: [0, Math.PI / 2, 0] })
  P.add('lens', discX([x + 0.004, y, 0], r * 0.9, 0.006, 40))
  if (h.drl === 'ring') {
    P.add('light', new THREE.TorusGeometry(r * 0.72, 0.008, 8, 48), { p: [x + 0.01, y, 0], r: [0, Math.PI / 2, 0] })
  }
  if (h.nacelle) P.add(h.nacelleRole ?? 'paint', rbox(0.2, 0.08, forkSpread * 2 + 0.07, 0.03), { p: [x - r - 0.06, y + r * 0.62, 0], r: [0, 0, 0.12] })
  if (h.pilots) {
    for (const side of [-1, 1]) {
      P.add('chrome', new THREE.CylinderGeometry(0.03, 0.026, 0.05, 20), { p: [x - r * 0.75, y - 0.02, side * (forkSpread + 0.06)], r: [0, 0, -Math.PI / 2] })
      P.add('lens', discX([x - r * 0.75 + 0.027, y - 0.02, side * (forkSpread + 0.06)], 0.026, 0.004, 20))
    }
  }
  for (const side of [-1, 1]) P.add('black', rod([x - r * 0.4, y, side * r * 0.7], [x - r * 1.25, y + 0.02, side * forkSpread], 0.008))
  if (h.indicators !== false) {
    for (const side of [-1, 1]) {
      P.add('black', rod([x - r * 0.9, y - 0.06, side * forkSpread], [x - r * 0.75, y - 0.06, side * (forkSpread + 0.1)], 0.006))
      P.add('amber', place(new THREE.SphereGeometry(0.022, 12, 8), { s: [1.3, 1, 1] }), { p: [x - r * 0.72, y - 0.06, side * (forkSpread + 0.11)] })
    }
  }
}

function handlebar(P, b) {
  const [x, y] = b.pos
  const w = b.width ?? 0.38
  const rise = b.rise ?? 0.05
  const back = b.back ?? 0.08
  const role = b.role ?? 'chrome'
  P.add(role, tube([[x - back, y + rise, -w], [x - back * 0.5, y + rise * 0.8, -w * 0.65], [x, y, -w * 0.22], [x, y, w * 0.22], [x - back * 0.5, y + rise * 0.8, w * 0.65], [x - back, y + rise, w]], 0.011, { segments: 48 }))
  for (const s of [-1, 1]) {
    P.add('rubber', rod([x - back * 0.93, y + rise * 0.97, s * w * 0.84], [x - back * 1.02, y + rise * 1.01, s * w * 1.05], 0.017))
    P.add('black', bar([x - back * 0.75, y + rise * 0.95], [x - back * 0.6 + 0.04, y + rise * 0.9 + 0.01], 0.008, 0.012, s * w * 0.8))
    const base = [x - back * 0.6, y + rise * 0.85, s * w * 0.68]
    const head = [base[0] - 0.035, base[1] + 0.2, s * w * 0.8]
    P.add(b.mirrorRole ?? 'chrome', rod(base, head, 0.0055))
    P.add(b.mirrorRole ?? 'chrome', place(new THREE.CylinderGeometry(0.048, 0.048, 0.018, 24), { s: b.mirrorShape === 'oval' ? [1, 1, 1.4] : 1 }), { p: head, r: [0, 0, Math.PI / 2] })
  }
  P.add('black', rod([x, y - 0.07, 0], [x, y + 0.005, 0], 0.024))
  if (b.speedo) {
    P.add('chrome', new THREE.CylinderGeometry(0.048, 0.048, 0.035, 28), { p: [x + 0.03, y + 0.035, 0], r: [0, 0, 0.55] })
    P.add('lens', new THREE.CylinderGeometry(0.04, 0.04, 0.004, 28), { p: [x + 0.04, y + 0.051, 0], r: [0, 0, 0.55] })
  }
}

function tail(P, t, seatY) {
  P.add('tail', rbox(0.035, 0.04, 0.09, 0.012), { p: [t.x, t.y, 0] })
  P.add('plate', rbox(0.008, 0.1, 0.17, 0.004), { p: [t.x + 0.015, t.y - 0.1, 0], r: [0, 0, -0.18] })
  for (const side of [-1, 1]) {
    P.add('black', rod([t.x + 0.06, t.y + 0.01, side * 0.06], [t.x + 0.04, t.y + 0.01, side * 0.15], 0.006))
    P.add('amber', place(new THREE.SphereGeometry(0.02, 12, 8), { s: [1.3, 1, 1] }), { p: [t.x + 0.035, t.y + 0.01, side * 0.16] })
  }
  P.add('black', rod([t.x + 0.05, seatY - 0.06, 0], [t.x + 0.02, t.y + 0.02, 0], 0.012))
}

export function buildMotorcycle(o) {
  const P = new Parts()
  const R = wheel(P, { x: 0, ...o.rear })
  const F = wheel(P, { x: o.wb, ...o.front })
  brakeDisc(P, F, -((o.front.w ?? 0.1) / 2 + 0.02), o.caliperRole)
  if (o.rearDisc !== false) brakeDisc(P, R, -((o.rear.w ?? 0.12) / 2 + 0.018))

  const pivot = o.pivot ?? [0.44, 0.39]
  fork(P, o.fork.top, [F.x, F.y], o.fork)
  frame(P, o, pivot)
  swingarm(P, pivot, R.y, o)
  shocks(P, o, R)
  const ports = engine(P, o.engine)
  exhaust(P, o.exhaust, ports)
  tank(P, o.tank)
  seat(P, o.seat)
  fenders(P, o, F, R)
  headlight(P, o.headlight, o.fork.spread ?? 0.09)
  handlebar(P, o.bar)
  tail(P, o.tail, o.seat.y)

  // footpegs + side stand stub
  for (const side of [-1, 1]) P.add('rubber', rod([pivot[0] + 0.02, 0.32, side * 0.12], [pivot[0] + 0.02, 0.32, side * 0.22], 0.013))
  // tool box / battery box under the seat
  if (o.extras?.sideBoxes) for (const side of [-1, 1]) P.add('paint', rbox(0.17, 0.14, 0.05, 0.02), { p: [pivot[0] + 0.03, o.seat.y - 0.17, side * 0.12] })
  if (o.extras?.sidePanel) P.add('paint2', profile([[pivot[0] - 0.12, o.seat.y - 0.05], [pivot[0] + 0.12, o.seat.y - 0.04], [pivot[0] + 0.08, o.seat.y - 0.18], [pivot[0] - 0.08, o.seat.y - 0.15]], 0.24, { bevel: 0.02 }))
  if (o.extras?.crashGuard) {
    for (const side of [-1, 1]) P.add('black', tube([[o.fork.top[0] - 0.12, 0.66, side * 0.07], [o.engine.crank[0] + 0.28, 0.52, side * 0.21], [o.engine.crank[0] + 0.25, 0.27, side * 0.22], [o.engine.crank[0] + 0.1, 0.21, side * 0.1]], 0.012))
  }
  if (o.extras?.tankGuard) {
    for (const side of [-1, 1]) P.add('black', tube([[o.tank.x1 + 0.02, o.tank.bottom + 0.14, side * 0.12], [o.tank.x1 - 0.06, o.tank.bottom + 0.2, side * 0.23], [o.tank.x0 + 0.18, o.tank.bottom + 0.08, side * 0.22], [o.tank.x1 - 0.02, o.tank.bottom - 0.12, side * 0.16]], 0.011))
  }
  if (o.extras?.windscreen) {
    const [hx, hy] = o.headlight.pos
    P.add('glass', rbox(0.006, 0.3, 0.26, 0.002), { p: [hx - 0.05, hy + o.headlight.r + 0.16, 0], r: [0, 0, 0.32] })
    P.add('black', rbox(0.04, 0.12, 0.24, 0.015), { p: [hx - 0.08, hy + o.headlight.r + 0.02, 0], r: [0, 0, 0.3] })
  }
  if (o.extras?.rack) {
    const y = o.seat.y + 0.06
    P.add('black', tube([[o.seat.x0 + 0.12, y, -0.11], [o.seat.x0 - 0.12, y + 0.01, -0.12], [o.seat.x0 - 0.2, y + 0.01, 0], [o.seat.x0 - 0.12, y + 0.01, 0.12], [o.seat.x0 + 0.12, y, 0.11]], 0.011))
    for (let i = 0; i < 3; i++) P.add('black', rod([o.seat.x0 - 0.12 + i * 0.1, y, -0.11], [o.seat.x0 - 0.12 + i * 0.1, y, 0.11], 0.007))
  }
  return P.build()
}
