import * as THREE from 'three'
import { Parts, TAU, arcSolid, bar, discX, discZ, place, profile, rbox, ring, rod, spring, tube } from './parts.js'

// Parametric scooter. Rear axle at x = 0, front axle at x = wheelbase, ground at y = 0, +Z = rider's left.

function smallWheel(P, { x, r, w, spokes = 5, rimRole = 'black' }, electricHub = false) {
  const y = r
  P.add('rubber', new THREE.TorusGeometry(r - w / 2, w / 2, 14, 64), { p: [x, y, 0] })
  const rimR = r - w * 0.85
  P.add(rimRole, ring([x, y], rimR - 0.014, rimR + 0.004, w * 0.7))
  P.add('metal', discZ([x, y, 0], electricHub ? 0.085 : 0.045, w * (electricHub ? 0.95 : 0.8), 28))
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU + 0.3
    P.add(rimRole, bar([x + Math.cos(a) * 0.04, y + Math.sin(a) * 0.04], [x + Math.cos(a) * (rimR - 0.01), y + Math.sin(a) * (rimR - 0.01)], 0.024, w * 0.5))
  }
  return { x, y, r }
}

/** Side-profile control points, derived from a handful of body parameters. */
function profiles(b, wb) {
  const ax = wb
  const rear = [
    [0.74, b.floorY + 0.02],
    [0.7, b.floorY + 0.15],
    [0.6, b.seatY - 0.08],
    [0.48, b.seatY],
    [0.15, b.seatY + 0.01],
    [-0.15, b.seatY],
    [b.tailX + 0.08, b.tailY + 0.05],
    [b.tailX, b.tailY - 0.02],
    [b.tailX + 0.06, b.tailY - 0.1],
    [-0.12, b.rearArch],
    [0.12, b.rearArch - 0.03],
    [0.32, 0.3],
    [0.55, b.floorY - 0.02],
  ]
  const apron = [
    [ax - 0.31, b.floorY - 0.01],
    [ax - 0.24, b.floorY + 0.02],
    [ax - 0.17, 0.5],
    [ax - 0.06, b.frontArch],
    [b.apronX - 0.02, b.frontArch + 0.02],
    [b.apronX, b.apronMid],
    [b.apronX - 0.08, b.apronTop - 0.06],
    [ax - 0.16, b.apronTop],
    [ax - 0.24, b.apronTop - 0.08],
    [ax - 0.29, 0.6],
    [ax - 0.32, b.floorY + 0.08],
  ]
  const seat = [
    [0.52, b.seatY - 0.01],
    [0.5, b.seatY + 0.05],
    [0.3, b.seatY + 0.08],
    [0.0, b.seatY + 0.09],
    [-0.18, b.seatY + 0.075],
    [-0.23, b.seatY + 0.015],
    [-0.1, b.seatY - 0.02],
    [0.3, b.seatY - 0.02],
  ]
  return { rear, apron, seat }
}

export function buildScooter(o) {
  const P = new Parts()
  const wb = o.wb
  const b = {
    seatY: 0.72, tailX: -0.4, tailY: 0.6, floorY: 0.31, rearArch: 0.43, frontArch: 0.6,
    apronTop: 1.0, apronMid: 0.76, apronX: wb + 0.05, bodyW: 0.36, apronW: 0.46, angular: false, bevel: 0.07,
    ...o.body,
  }
  const R = smallWheel(P, { x: 0, ...o.rear }, o.electric)
  const F = smallWheel(P, { x: wb, ...o.front })
  P.add('metal', discZ([F.x, F.y, -((o.front.w ?? 0.09) / 2 + 0.018)], F.r * 0.5, 0.005, 32))
  P.add('black', rbox(0.06, 0.045, 0.03, 0.01), { p: [F.x - F.r * 0.42, F.y + F.r * 0.18, -((o.front.w ?? 0.09) / 2 + 0.03)] })

  // front suspension
  const head = [wb - 0.17, b.apronTop + 0.02]
  for (const side of [-1, 1]) {
    P.add('black', rod([head[0], head[1] - 0.05, side * 0.06], [F.x, F.y + 0.12, side * 0.06], 0.022))
    P.add('metal', rod([F.x - 0.02, F.y + 0.16, side * 0.06], [F.x, F.y, side * 0.06], 0.026))
  }
  P.add('metal', discZ([F.x, F.y, 0], 0.012, 0.17, 10))
  P.add(o.fenderRole ?? 'paint', arcSolid([F.x, F.y], F.r + 0.028, F.r + 0.042, (o.front.w ?? 0.09) + 0.06, 0.35, 2.55))

  // body shells
  const { rear, apron, seat } = profiles(b, wb)
  P.add('paint', profile(rear, b.bodyW, { bevel: b.bevel, smooth: !b.angular }))
  P.add('paint', profile(apron, b.apronW, { bevel: b.bevel * 0.85, smooth: !b.angular }))
  P.add(o.floorRole ?? 'black', rbox(0.4, 0.05, b.bodyW - 0.02, 0.02), { p: [0.84, b.floorY + 0.01, 0] })
  P.add(o.skirtRole ?? 'paint2', rbox(0.44, 0.06, b.bodyW + 0.04, 0.025), { p: [0.84, b.floorY - 0.035, 0] })
  P.add('seat', profile(seat, b.bodyW - 0.04, { bevel: 0.035 }))

  // handlebar cowl, grips, mirrors
  P.add(o.cowlRole ?? 'paint', rbox(0.2, 0.09, 0.54, 0.04), { p: [head[0] - 0.03, head[1] + 0.07, 0], r: [0, 0, 0.18] })
  P.add('black', rbox(0.12, 0.03, 0.22, 0.012), { p: [head[0] - 0.08, head[1] + 0.115, 0], r: [0, 0, 0.35] })
  P.add('lens', place(new THREE.BoxGeometry(0.08, 0.004, 0.14), {}), { p: [head[0] - 0.075, head[1] + 0.132, 0], r: [0, 0, 0.35] })
  for (const side of [-1, 1]) {
    P.add('rubber', rod([head[0] - 0.05, head[1] + 0.08, side * 0.27], [head[0] - 0.07, head[1] + 0.085, side * 0.37], 0.018))
    const base = [head[0] - 0.02, head[1] + 0.1, side * 0.2]
    const tip = [head[0] - 0.05, head[1] + 0.24, side * 0.27]
    P.add('black', rod(base, tip, 0.006))
    P.add('black', place(new THREE.CylinderGeometry(0.05, 0.05, 0.016, 24), { s: [1, 1, 1.5] }), { p: tip, r: [0, 0, Math.PI / 2] })
  }

  // headlamp
  const hl = o.headlight ?? 'apron'
  const faceX = b.apronX + b.bevel * 0.7
  if (hl === 'handlebar') {
    P.add('chrome', new THREE.TorusGeometry(0.075, 0.01, 8, 40), { p: [head[0] + 0.08, head[1] + 0.07, 0], r: [0, Math.PI / 2 - 0.2, 0] })
    P.add('lens', discX([head[0] + 0.078, head[1] + 0.07, 0], 0.07, 0.008, 36), { r: [0, 0, 0] })
  } else if (hl === 'twin') {
    for (const side of [-1, 1]) {
      P.add('chrome', place(new THREE.TorusGeometry(0.06, 0.009, 8, 36), { r: [0, Math.PI / 2, 0] }), { p: [faceX - 0.03, b.apronMid + 0.1, side * 0.08], r: [0, 0, 0.4] })
      P.add('lens', discX([0, 0, 0], 0.055, 0.008, 32), { p: [faceX - 0.03, b.apronMid + 0.1, side * 0.08], r: [0, 0, 0.4] })
    }
  } else {
    P.add('lens', rbox(0.03, 0.13, 0.2, 0.012), { p: [faceX - 0.02, b.apronMid + 0.09, 0], r: [0, 0, 0.42] })
    if (o.chrome) P.add('chrome', rbox(0.02, 0.16, 0.25, 0.01), { p: [faceX - 0.035, b.apronMid + 0.09, 0], r: [0, 0, 0.42] })
  }
  if (o.drl) {
    P.add('light', rbox(0.012, 0.012, 0.3, 0.005), { p: [faceX - 0.005, b.apronMid - 0.02, 0], r: [0, 0, 0.42] })
    for (const side of [-1, 1]) P.add('light', rbox(0.012, 0.16, 0.012, 0.005), { p: [faceX - 0.02, b.apronMid + 0.06, side * 0.16], r: [0, 0, 0.42] })
  }
  for (const side of [-1, 1]) P.add('amber', rbox(0.025, 0.03, 0.05, 0.01), { p: [faceX - 0.06, b.apronMid + 0.17, side * 0.2], r: [0, 0, 0.42] })
  if (o.chrome) P.add('chrome', rbox(0.3, 0.012, 0.012, 0.004), { p: [0.3, b.seatY - 0.12, b.bodyW / 2 + 0.035], r: [0, 0, -0.08] })

  // tail, grab rail, number plate
  const tx = b.tailX - b.bevel * 0.6
  P.add('tail', rbox(0.03, 0.05, 0.18, 0.012), { p: [tx, b.tailY, 0] })
  for (const side of [-1, 1]) P.add('amber', rbox(0.025, 0.025, 0.04, 0.008), { p: [tx + 0.01, b.tailY, side * 0.12] })
  P.add('plate', rbox(0.008, 0.09, 0.16, 0.004), { p: [tx + 0.05, b.tailY - 0.14, 0], r: [0, 0, -0.3] })
  P.add(o.railRole ?? 'black', tube([[-0.02, b.seatY + 0.06, -0.15], [-0.26, b.seatY + 0.07, -0.14], [-0.32, b.seatY + 0.08, 0], [-0.26, b.seatY + 0.07, 0.14], [-0.02, b.seatY + 0.06, 0.15]], 0.012))

  // drivetrain
  if (o.electric) {
    P.add('black', bar([0.32, 0.3], [0, R.y], 0.06, 0.04, 0.1))
    P.add('black', rbox(0.34, 0.06, 0.04, 0.015), { p: [0.16, 0.27, 0.13] })
  } else {
    P.add('metal', rbox(0.44, 0.15, 0.09, 0.04), { p: [0.18, 0.26, 0.12], r: [0, 0, 0.12] })
    P.add('black', rbox(0.2, 0.12, 0.1, 0.03), { p: [0.4, 0.36, 0.12] })
    P.add('black', tube([[0.45, 0.2, 0.05], [0.3, 0.18, -0.06], [0.14, 0.2, -0.13]], 0.016))
    P.add('black', rod([0.16, 0.2, -0.13], [-0.2, 0.27, -0.13], 0.045, 0.05, 24))
    P.add('chrome', rod([0.08, 0.24, -0.16], [-0.12, 0.28, -0.16], 0.03, 0.03, 16))
  }
  const lower = [-0.01, 0.31, 0.12]
  const upper = [-0.02, 0.5, 0.12]
  P.add('black', rod(lower, upper, 0.012))
  P.add(o.springRole ?? 'paint2', spring([-0.012, 0.34, 0.12], [-0.019, 0.47, 0.12], 0.022, 0.004, 7))
  return P.build()
}
