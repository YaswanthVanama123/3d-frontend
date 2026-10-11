import { Appear, Parallax, ViewStage } from '../ViewStage.jsx'

/** Camera + lights + mouse parallax + scale-in, shared by every card visual. */
export function VisualFrame({ active = true, camera, target, fov, rim, env, keyLight, parallax = 0.28, children }) {
  return (
    <ViewStage camera={camera} target={target} fov={fov} rim={rim} env={env} keyLight={keyLight}>
      <Parallax strength={parallax}>
        <Appear active={active}>{children}</Appear>
      </Parallax>
    </ViewStage>
  )
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
