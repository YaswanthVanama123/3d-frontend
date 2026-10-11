import { Vector3 } from 'three'

export const UP = new Vector3(0, 1, 0)
export const DOWN = new Vector3(0, -1, 0)

/**
 * Clipping planes live in world space. This expresses a plane defined in `object`'s local space
 * (points with normal·p + constant < 0 are clipped) in world space, so clipping follows the object
 * even when it moves, floats, or is tilted by parallax.
 */
export function setWorldPlane(plane, normal, constant, object) {
  object.updateWorldMatrix(true, false)
  return plane.set(normal, constant).applyMatrix4(object.matrixWorld)
}
