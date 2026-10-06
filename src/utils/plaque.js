// Plaque categories estimated from the mean HU of an ROI.
// Thresholds follow commonly cited CCTA values. For illustration only - NOT diagnostic.
export const PLAQUE_TYPES = [
  { id: 'low', label: 'Low-attenuation', range: '< 30 HU', color: '#ff6b6b' },
  { id: 'noncalc', label: 'Non-calcified', range: '30 – 129 HU', color: '#ffb44d' },
  { id: 'calc', label: 'Calcified', range: '≥ 130 HU', color: '#7cc5ff' },
];

export function classifyPlaque(meanHU) {
  if (typeof meanHU !== 'number' || Number.isNaN(meanHU)) return null;
  if (meanHU < 30) return PLAQUE_TYPES[0];
  if (meanHU < 130) return PLAQUE_TYPES[1];
  return PLAQUE_TYPES[2];
}
