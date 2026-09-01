const SNAPSHOT = '2026-08-31T00:00:00.000Z';
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const ANNUAL_GROWTH_RATE = 0.03;
const SOURCE = 'State government bonded debt (illustrative snapshot)';

export const STATE_GRID_ROWS = 9;
export const STATE_GRID_COLS = 13;

export const STATE_MAP_EXPLAINER =
  "Each state's own bonded debt, not the federal government's — shaded from low (dark) to high (bright blue). Tap a state to see the number.";

// row/col place each state on a stylized grid map (row 0 = north, col 0 = west),
// not a geographically precise outline — a simplified "tile map" like the ones
// news outlets use so every state gets an equally tappable square.
const STATE_DEBT_RAW = [
  { code: 'AL', name: 'Alabama', baseline: 11200000000, row: 5, col: 7 },
  { code: 'AK', name: 'Alaska', baseline: 4750000000, row: 0, col: 0 },
  { code: 'AZ', name: 'Arizona', baseline: 15200000000, row: 4, col: 2 },
  { code: 'AR', name: 'Arkansas', baseline: 5600000000, row: 4, col: 5 },
  { code: 'CA', name: 'California', baseline: 268600000000, row: 3, col: 0 },
  { code: 'CO', name: 'Colorado', baseline: 17100000000, row: 3, col: 3 },
  { code: 'CT', name: 'Connecticut', baseline: 33100000000, row: 3, col: 11 },
  { code: 'DE', name: 'Delaware', baseline: 7500000000, row: 3, col: 10 },
  { code: 'FL', name: 'Florida', baseline: 36200000000, row: 7, col: 8 },
  { code: 'GA', name: 'Georgia', baseline: 20900000000, row: 5, col: 8 },
  { code: 'HI', name: 'Hawaii', baseline: 12000000000, row: 8, col: 1 },
  { code: 'ID', name: 'Idaho', baseline: 2000000000, row: 2, col: 2 },
  { code: 'IL', name: 'Illinois', baseline: 111300000000, row: 2, col: 6 },
  { code: 'IN', name: 'Indiana', baseline: 14500000000, row: 2, col: 7 },
  { code: 'IA', name: 'Iowa', baseline: 5400000000, row: 2, col: 5 },
  { code: 'KS', name: 'Kansas', baseline: 6800000000, row: 4, col: 4 },
  { code: 'KY', name: 'Kentucky', baseline: 20900000000, row: 3, col: 6 },
  { code: 'LA', name: 'Louisiana', baseline: 19800000000, row: 6, col: 5 },
  { code: 'ME', name: 'Maine', baseline: 3600000000, row: 0, col: 11 },
  { code: 'MD', name: 'Maryland', baseline: 26000000000, row: 3, col: 9 },
  { code: 'MA', name: 'Massachusetts', baseline: 69300000000, row: 2, col: 11 },
  { code: 'MI', name: 'Michigan', baseline: 33000000000, row: 1, col: 7 },
  { code: 'MN', name: 'Minnesota', baseline: 15000000000, row: 1, col: 5 },
  { code: 'MS', name: 'Mississippi', baseline: 7100000000, row: 5, col: 6 },
  { code: 'MO', name: 'Missouri', baseline: 12400000000, row: 3, col: 5 },
  { code: 'MT', name: 'Montana', baseline: 2300000000, row: 1, col: 3 },
  { code: 'NE', name: 'Nebraska', baseline: 1800000000, row: 3, col: 4 },
  { code: 'NV', name: 'Nevada', baseline: 5400000000, row: 3, col: 1 },
  { code: 'NH', name: 'New Hampshire', baseline: 3400000000, row: 0, col: 10 },
  { code: 'NJ', name: 'New Jersey', baseline: 88400000000, row: 2, col: 10 },
  { code: 'NM', name: 'New Mexico', baseline: 6300000000, row: 4, col: 3 },
  { code: 'NY', name: 'New York', baseline: 189100000000, row: 1, col: 9 },
  { code: 'NC', name: 'North Carolina', baseline: 20500000000, row: 4, col: 8 },
  { code: 'ND', name: 'North Dakota', baseline: 2000000000, row: 1, col: 4 },
  { code: 'OH', name: 'Ohio', baseline: 31900000000, row: 2, col: 8 },
  { code: 'OK', name: 'Oklahoma', baseline: 8900000000, row: 5, col: 4 },
  { code: 'OR', name: 'Oregon', baseline: 15300000000, row: 2, col: 1 },
  { code: 'PA', name: 'Pennsylvania', baseline: 55900000000, row: 2, col: 9 },
  { code: 'RI', name: 'Rhode Island', baseline: 7600000000, row: 3, col: 12 },
  { code: 'SC', name: 'South Carolina', baseline: 12400000000, row: 5, col: 9 },
  { code: 'SD', name: 'South Dakota', baseline: 1100000000, row: 2, col: 4 },
  { code: 'TN', name: 'Tennessee', baseline: 7100000000, row: 4, col: 6 },
  { code: 'TX', name: 'Texas', baseline: 61000000000, row: 6, col: 4 },
  { code: 'UT', name: 'Utah', baseline: 6500000000, row: 3, col: 2 },
  { code: 'VT', name: 'Vermont', baseline: 1800000000, row: 1, col: 10 },
  { code: 'VA', name: 'Virginia', baseline: 26100000000, row: 3, col: 8 },
  { code: 'WA', name: 'Washington', baseline: 37100000000, row: 1, col: 1 },
  { code: 'WV', name: 'West Virginia', baseline: 5800000000, row: 3, col: 7 },
  { code: 'WI', name: 'Wisconsin', baseline: 15300000000, row: 1, col: 6 },
  { code: 'WY', name: 'Wyoming', baseline: 930000000, row: 2, col: 3 },
  { code: 'DC', name: 'District of Columbia', baseline: 10900000000, row: 4, col: 9 },
];

export const STATE_DEBT = STATE_DEBT_RAW.map((s) => ({
  id: `state-debt-${s.code.toLowerCase()}`,
  code: s.code,
  name: s.name,
  label: `${s.name} State Debt`,
  unit: 'usd',
  baseline: s.baseline,
  asOf: SNAPSHOT,
  perSecondRate: (s.baseline * ANNUAL_GROWTH_RATE) / SECONDS_PER_YEAR,
  source: SOURCE,
  row: s.row,
  col: s.col,
}));

export function validateStateDebt(states) {
  const errors = [];
  const seenCodes = new Set();
  const seenPositions = new Set();
  for (const state of states) {
    if (seenCodes.has(state.code)) errors.push(`Duplicate code: ${state.code}`);
    seenCodes.add(state.code);
    if (typeof state.code !== 'string' || state.code.length !== 2) errors.push(`Invalid code on ${state.name}`);
    const posKey = `${state.row},${state.col}`;
    if (seenPositions.has(posKey)) errors.push(`Duplicate grid position ${posKey} (state ${state.code})`);
    seenPositions.add(posKey);
    if (
      typeof state.row !== 'number' ||
      state.row < 0 ||
      state.row >= STATE_GRID_ROWS
    ) {
      errors.push(`Invalid row on ${state.code}`);
    }
    if (
      typeof state.col !== 'number' ||
      state.col < 0 ||
      state.col >= STATE_GRID_COLS
    ) {
      errors.push(`Invalid col on ${state.code}`);
    }
    if (typeof state.baseline !== 'number' || Number.isNaN(state.baseline)) errors.push(`Invalid baseline on ${state.code}`);
    if (typeof state.perSecondRate !== 'number' || Number.isNaN(state.perSecondRate)) errors.push(`Invalid perSecondRate on ${state.code}`);
    if (Number.isNaN(new Date(state.asOf).getTime())) errors.push(`Invalid asOf on ${state.code}`);
    if (typeof state.label !== 'string' || state.label.length === 0) errors.push(`Invalid label on ${state.code}`);
    if (typeof state.source !== 'string' || state.source.length === 0) errors.push(`Invalid source on ${state.code}`);
  }
  return errors;
}
