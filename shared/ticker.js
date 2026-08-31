export function formatValue(value, unit) {
  switch (unit) {
    case 'usd':
      return '$' + Math.floor(value).toLocaleString('en-US');
    case 'usd-cents':
      return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case 'count':
      return Math.floor(value).toLocaleString('en-US');
    case 'percent':
      return value.toFixed(1) + '%';
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

export function computeCurrentValue(stat, now = new Date()) {
  const asOfMs = new Date(stat.asOf).getTime();
  const secondsElapsed = (now.getTime() - asOfMs) / 1000;
  return stat.baseline + stat.perSecondRate * secondsElapsed;
}

export function startTicker(stat, onUpdate, intervalMs = 1000) {
  const tick = () => onUpdate(formatValue(computeCurrentValue(stat), stat.unit));
  tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
