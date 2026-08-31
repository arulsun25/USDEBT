import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATE_PATHS, getPathBounds, getLabelPosition, validateStatePaths } from './state-paths.js';

const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

test('STATE_PATHS has exactly 50 entries (50 states, no DC — not covered by the source data)', () => {
  assert.equal(Object.keys(STATE_PATHS).length, 50);
});

test('STATE_PATHS covers exactly the 50 US state codes', () => {
  const errors = validateStatePaths(STATE_PATHS, US_STATE_CODES);
  assert.deepEqual(errors, []);
});

test('every path starts with a moveto command', () => {
  for (const [code, d] of Object.entries(STATE_PATHS)) {
    assert.match(d, /^M/, `${code} path should start with M`);
  }
});

test('getPathBounds returns a bounding box with a plausible US-map aspect ratio', () => {
  const { minX, minY, maxX, maxY } = getPathBounds(STATE_PATHS);
  const width = maxX - minX;
  const height = maxY - minY;
  assert.ok(width > 0 && height > 0, 'bounds should have positive width and height');
  const aspectRatio = width / height;
  // The continental US (plus AK/HI insets) is wider than it is tall.
  assert.ok(aspectRatio > 1.2 && aspectRatio < 2.2, `unexpected aspect ratio ${aspectRatio}`);
});

test('Wyoming and Montana share a border coordinate (internal consistency check)', () => {
  assert.ok(STATE_PATHS.WY.includes('253.6,129.8'));
  assert.ok(STATE_PATHS.MT.includes('253.6,129.8'));
});

test('getLabelPosition returns a point inside each state\'s own bounding box', () => {
  for (const [code, d] of Object.entries(STATE_PATHS)) {
    const { x, y } = getLabelPosition(d);
    const numbers = d.match(/-?\d+\.?\d*/g).map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    assert.ok(x >= Math.min(...xs) && x <= Math.max(...xs), `${code} label x out of bounds`);
    assert.ok(y >= Math.min(...ys) && y <= Math.max(...ys), `${code} label y out of bounds`);
  }
});

test('getLabelPosition for Wyoming (a near-rectangle) lands near its visual center', () => {
  // Wyoming's path: M360.3,143.2 L253.6,129.8 L239.5,218.2 L352.8,231.8 z
  const { x, y } = getLabelPosition(STATE_PATHS.WY);
  assert.ok(Math.abs(x - 296) < 15, `x=${x} not near expected ~296`);
  assert.ok(Math.abs(y - 174) < 15, `y=${y} not near expected ~174`);
});
