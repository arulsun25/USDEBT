import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATE_DEBT, STATE_GRID_ROWS, STATE_GRID_COLS, validateStateDebt } from './states.js';

test('STATE_DEBT has exactly 51 entries (50 states + DC)', () => {
  assert.equal(STATE_DEBT.length, 51);
});

test('all state entries pass validation with no errors', () => {
  assert.deepEqual(validateStateDebt(STATE_DEBT), []);
});

test('every state has a unique grid position', () => {
  const positions = new Set(STATE_DEBT.map((s) => `${s.row},${s.col}`));
  assert.equal(positions.size, STATE_DEBT.length);
});

test('every grid position is within the declared grid bounds', () => {
  for (const state of STATE_DEBT) {
    assert.ok(state.row >= 0 && state.row < STATE_GRID_ROWS, `${state.code} row out of bounds`);
    assert.ok(state.col >= 0 && state.col < STATE_GRID_COLS, `${state.code} col out of bounds`);
  }
});

test('every state code is unique and two letters', () => {
  const codes = new Set();
  for (const state of STATE_DEBT) {
    assert.equal(state.code.length, 2);
    codes.add(state.code);
  }
  assert.equal(codes.size, STATE_DEBT.length);
});

test('validateStateDebt catches a duplicate grid position', () => {
  const bad = [
    { code: 'AA', name: 'A', label: 'A State Debt', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test', row: 0, col: 0 },
    { code: 'BB', name: 'B', label: 'B State Debt', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test', row: 0, col: 0 },
  ];
  const errors = validateStateDebt(bad);
  assert.ok(errors.some((e) => e.includes('Duplicate grid position')));
});

test('validateStateDebt catches a duplicate code', () => {
  const bad = [
    { code: 'AA', name: 'A', label: 'A State Debt', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test', row: 0, col: 0 },
    { code: 'AA', name: 'A2', label: 'A2 State Debt', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test', row: 1, col: 1 },
  ];
  const errors = validateStateDebt(bad);
  assert.ok(errors.some((e) => e.includes('Duplicate code')));
});
