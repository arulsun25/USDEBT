// The debt -> gold thesis card is presented as a narrative/framework, not a
// forecast — these are the user's exact 8 steps, each one an "X rises"
// claim. The card must not present this as settled fact or a guarantee.
export const DEBT_TO_GOLD_CHAIN = [
  'US Debt',
  'Treasury Bond Supply',
  'Bond Yields',
  'Interest Burden',
  'Pressure to Suppress Yields',
  'Financial Repression / YCC Risk',
  'Dollar Purchasing Power Concerns',
  'Gold Demand',
];

export const GOLD_THESIS_EXPLAINER =
  "One narrative connecting rising government debt to gold: more borrowing pressures bond markets, which raises the temptation to suppress yields artificially — steps that erode confidence in the dollar's purchasing power and often coincide with rising gold demand. This is a widely discussed thesis, not a guaranteed forecast; real gold prices are volatile and driven by many other factors too.";

// There is no free public API that provides an actual gold price *forecast*
// — real forecasts are proprietary analyst opinions, not open data. This
// projection block is instead a naive extrapolation of a real historical
// rate, and must say so explicitly wherever it's shown.
export const GOLD_PROJECTION_DISCLAIMER =
  'These are simple compounding extrapolations of real historical price changes — not predictions, forecasts, or investment advice. Gold is volatile and driven by many factors; past performance does not determine future results.';

// Both endpoints are genuinely live and CORS-enabled (access-control-allow-origin: *),
// confirmed by direct request before use — no API key, no backend proxy needed.
export const GOLD_LIVE_PRICE_URL = 'https://api.gold-api.com/price/XAU';
export const GOLD_HISTORY_URL = 'https://freegoldapi.com/data/latest.json';

export const GOLD_SOURCES = [
  { label: 'Live gold price — Gold-API.com', url: 'https://gold-api.com/' },
  { label: 'Historical gold prices — FreeGoldAPI.com (via Yahoo Finance)', url: 'https://freegoldapi.com/' },
];

// Finds the historical entry closest to (now - lookbackDays) and computes the
// percent change from that entry's price to currentPrice. Returns the ACTUAL
// elapsed days to that entry rather than assuming the lookback window was hit
// exactly — the historical dataset isn't guaranteed to be perfectly current,
// so the label shown to the user should describe what was actually compared,
// not what was requested.
export function computeTrend(historyEntries, currentPrice, now, lookbackDays) {
  if (!Array.isArray(historyEntries) || historyEntries.length === 0) return null;

  const targetTime = now.getTime() - lookbackDays * 24 * 60 * 60 * 1000;
  let closest = null;
  let closestDiff = Infinity;

  for (const entry of historyEntries) {
    const entryTime = new Date(entry.date).getTime();
    if (Number.isNaN(entryTime)) continue;
    const diff = Math.abs(entryTime - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = entry;
    }
  }

  if (!closest) return null;

  const fromTime = new Date(closest.date).getTime();
  const actualDaysElapsed = Math.round((now.getTime() - fromTime) / (24 * 60 * 60 * 1000));
  const percentChange = ((currentPrice - closest.price) / closest.price) * 100;

  return {
    fromPrice: closest.price,
    fromDate: closest.date,
    actualDaysElapsed,
    percentChange,
  };
}

// The annualized (CAGR-style) rate implied by moving from fromPrice to
// toPrice over daysElapsed. Used to extrapolate forward at "the pace of the
// last N years" rather than compounding a single, possibly noisy, short-term
// rate over a multi-year horizon.
export function computeAnnualizedRate(fromPrice, toPrice, daysElapsed) {
  if (!(daysElapsed > 0) || !(fromPrice > 0)) return null;
  return Math.pow(toPrice / fromPrice, 365 / daysElapsed) - 1;
}

// Naive compounding extrapolation: currentPrice grown at annualRate for the
// given number of years. Explicitly NOT a forecast — see
// GOLD_PROJECTION_DISCLAIMER, which must accompany this wherever it's shown.
export function projectPrice(currentPrice, annualRate, years) {
  return currentPrice * Math.pow(1 + annualRate, years);
}
