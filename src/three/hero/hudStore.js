// Live print state written by the 3D printer every frame and read by the HTML HUD.
export const hud = {
  job: 'Spiral Vase',
  material: 'PLA · Sunset Orange',
  color: '#ff7a45',
  phase: 'heating',
  progress: 0,
  layer: 0,
  layers: 800,
  nozzle: 24,
  bed: 24,
  etaMin: 0,
}

export const PHASE_LABELS = {
  heating: 'Heating nozzle',
  printing: 'Printing',
  done: 'Print complete',
  eject: 'Releasing part',
}
