import { getRenderingEngine } from '@cornerstonejs/core';

export const RENDERING_ENGINE_ID = 'heartviewEngine';
export const VIEWPORT_ID = 'heartviewViewport';

// Typical CT window presets (width / level in HU)
export const WINDOW_PRESETS = [
  { id: 'soft', label: 'Soft tissue', width: 400, level: 40 },
  { id: 'vessel', label: 'Vessel (CTA)', width: 700, level: 200 },
  { id: 'plaque', label: 'Plaque', width: 350, level: 90 },
  { id: 'calcium', label: 'Calcium', width: 1000, level: 300 },
];

export function getViewport() {
  const engine = getRenderingEngine(RENDERING_ENGINE_ID);
  return engine ? engine.getViewport(VIEWPORT_ID) : null;
}

export function setWindowLevel(width, level) {
  const vp = getViewport();
  if (!vp) return;
  vp.setProperties({ voiRange: { lower: level - width / 2, upper: level + width / 2 } });
  vp.render();
}

export function toggleInvert() {
  const vp = getViewport();
  if (!vp) return;
  vp.setProperties({ invert: !vp.getProperties().invert });
  vp.render();
}

export function resetView() {
  const vp = getViewport();
  if (!vp) return;
  if (typeof vp.resetProperties === 'function') vp.resetProperties();
  vp.resetCamera();
  vp.render();
}

export function goToSlice(index) {
  const vp = getViewport();
  if (!vp) return;
  vp.setImageIdIndex(index);
}
