// Pure review classification helpers shared by the browser and tests.
export const DEFAULT_SLOW_THRESHOLD_SECONDS = 12;
export const SLOW_THRESHOLD_OPTIONS = [8, 12, 20, 30];
export function validSlowThreshold(value) {
  const n = Number(value);
  return SLOW_THRESHOLD_OPTIONS.includes(n) ? n : DEFAULT_SLOW_THRESHOLD_SECONDS;
}
export function outcomeForSwipe(direction, recallMs, slowThresholdSeconds = DEFAULT_SLOW_THRESHOLD_SECONDS) {
  if (direction === 'left') return 'unknown';
  if (direction !== 'right') throw Error('Only left and right swipes are supported');
  const milliseconds = Number.isFinite(recallMs) ? Math.max(0, recallMs) : Infinity;
  return milliseconds > validSlowThreshold(slowThresholdSeconds) * 1000 ? 'learning' : 'known';
}
