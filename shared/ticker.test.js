import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatValue, computeCurrentValue, startTicker } from './ticker.js';

test('formatValue formats usd with a dollar sign and commas, no decimals', () => {
  assert.equal(formatValue(37345678901234, 'usd'), '$37,345,678,901,234');
});

test('formatValue formats usd-cents with two decimals', () => {
  assert.equal(formatValue(109065.5, 'usd-cents'), '$109,065.50');
});

test('formatValue formats count with commas and no decimals', () => {
  assert.equal(formatValue(342300000.7, 'count'), '342,300,000');
});

test('formatValue formats percent with one decimal and a percent sign', () => {
  assert.equal(formatValue(4.2, 'percent'), '4.2%');
});

test('formatValue throws on an unknown unit', () => {
  assert.throws(() => formatValue(1, 'bogus'));
});

test('computeCurrentValue adds elapsed seconds times the per-second rate', () => {
  const stat = { baseline: 100, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 2 };
  const now = new Date('2026-01-01T00:00:10.000Z');
  assert.equal(computeCurrentValue(stat, now), 120);
});

test('computeCurrentValue returns the baseline unchanged when rate is 0', () => {
  const stat = { baseline: 4.2, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0 };
  const now = new Date('2026-06-01T00:00:00.000Z');
  assert.equal(computeCurrentValue(stat, now), 4.2);
});

test('startTicker calls onUpdate immediately and again on each interval, then stop() halts it', () => {
  const stat = { baseline: 0, asOf: new Date().toISOString(), perSecondRate: 1, unit: 'count' };
  const calls = [];
  const stop = startTicker(stat, (text) => calls.push(text), 10);
  assert.equal(calls.length, 1);

  return new Promise((resolve) => {
    setTimeout(() => {
      stop();
      const countAfterStop = calls.length;
      assert.ok(countAfterStop >= 2, `expected at least 2 calls, got ${countAfterStop}`);
      setTimeout(() => {
        assert.equal(calls.length, countAfterStop);
        resolve();
      }, 30);
    }, 25);
  });
});
