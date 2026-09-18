import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEBT_TO_GOLD_CHAIN,
  GOLD_THESIS_EXPLAINER,
  GOLD_SOURCES,
  GOLD_PROJECTION_DISCLAIMER,
  computeTrend,
  computeAnnualizedRate,
  projectPrice,
} from './gold.js';

test('DEBT_TO_GOLD_CHAIN has all 8 steps, each a non-empty string', () => {
  assert.equal(DEBT_TO_GOLD_CHAIN.length, 8);
  for (const step of DEBT_TO_GOLD_CHAIN) {
    assert.equal(typeof step, 'string');
    assert.ok(step.length > 0);
  }
});

test('GOLD_THESIS_EXPLAINER frames this as a thesis, not a guarantee', () => {
  assert.ok(GOLD_THESIS_EXPLAINER.length > 0);
  // The whole point of this framing is that it must not read as a certain
  // prediction — assert the hedging language is actually present, so this
  // can't silently regress into an unqualified claim.
  assert.match(GOLD_THESIS_EXPLAINER.toLowerCase(), /narrative|not a guarantee|thesis/);
});

test('GOLD_SOURCES has at least one well-formed https source', () => {
  assert.ok(GOLD_SOURCES.length > 0);
  for (const source of GOLD_SOURCES) {
    assert.ok(source.label.length > 0);
    assert.match(source.url, /^https:\/\//);
  }
});

test('computeTrend finds the historical entry closest to the lookback window and computes percent change', () => {
  const history = [
    { date: '2026-01-01', price: 4000 },
    { date: '2026-02-01', price: 4500 },
    { date: '2026-03-01', price: 5000 },
  ];
  const now = new Date('2026-04-01T00:00:00.000Z');
  // ~60 days back from 2026-04-01 lands closest to 2026-02-01.
  const result = computeTrend(history, 5500, now, 60);
  assert.equal(result.fromDate, '2026-02-01');
  assert.equal(result.fromPrice, 4500);
  assert.ok(Math.abs(result.percentChange - ((5500 - 4500) / 4500) * 100) < 0.001);
});

test('computeTrend reports the actual elapsed days, not the requested lookback, when data is stale', () => {
  const history = [{ date: '2026-01-01', price: 4000 }];
  const now = new Date('2026-06-01T00:00:00.000Z');
  // Only one data point exists, far older than the 30-day lookback requested —
  // the result should describe the real gap (~151 days), not silently claim 30.
  const result = computeTrend(history, 4200, now, 30);
  assert.equal(result.fromDate, '2026-01-01');
  assert.ok(result.actualDaysElapsed > 140 && result.actualDaysElapsed < 160, `unexpected elapsed days: ${result.actualDaysElapsed}`);
});

test('computeTrend returns null for empty history', () => {
  assert.equal(computeTrend([], 4200, new Date(), 30), null);
});

test('computeTrend handles a price decline correctly (negative percent change)', () => {
  const history = [{ date: '2026-01-01', price: 5000 }];
  const now = new Date('2026-02-01T00:00:00.000Z');
  const result = computeTrend(history, 4500, now, 31);
  assert.ok(result.percentChange < 0, `expected a negative change, got ${result.percentChange}`);
  assert.ok(Math.abs(result.percentChange - -10) < 0.001);
});

test('GOLD_PROJECTION_DISCLAIMER explicitly says this is not a forecast', () => {
  assert.ok(GOLD_PROJECTION_DISCLAIMER.length > 0);
  const lower = GOLD_PROJECTION_DISCLAIMER.toLowerCase();
  assert.match(lower, /not.*(predictions?|forecasts?)/);
});

test('computeAnnualizedRate: 10% growth over exactly one year is a 10% annual rate', () => {
  const rate = computeAnnualizedRate(100, 110, 365);
  assert.ok(Math.abs(rate - 0.1) < 0.0001, `expected ~0.1, got ${rate}`);
});

test('computeAnnualizedRate: doubling over 2 years annualizes to ~41.4% (compounding, not 50%)', () => {
  const rate = computeAnnualizedRate(100, 200, 730);
  assert.ok(Math.abs(rate - 0.4142) < 0.001, `expected ~0.4142, got ${rate}`);
});

test('computeAnnualizedRate returns null for zero/negative elapsed days or non-positive fromPrice', () => {
  assert.equal(computeAnnualizedRate(100, 110, 0), null);
  assert.equal(computeAnnualizedRate(100, 110, -5), null);
  assert.equal(computeAnnualizedRate(0, 110, 365), null);
});

test('projectPrice compounds a rate forward the given number of years', () => {
  // 10%/year for 3 years: 100 * 1.1^3 = 133.1
  assert.ok(Math.abs(projectPrice(100, 0.1, 3) - 133.1) < 0.01);
  // 0% rate leaves the price unchanged regardless of horizon.
  assert.equal(projectPrice(4300, 0, 5), 4300);
  // A negative rate (a declining trend) projects a lower future price.
  assert.ok(projectPrice(100, -0.1, 1) < 100);
});
