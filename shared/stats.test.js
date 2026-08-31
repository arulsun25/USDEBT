import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATS, CATEGORIES, CATEGORY_LABELS, CATEGORY_EXPLAINERS, CATEGORY_SOURCES, groupByCategory, validateStats } from './stats.js';

test('STATS has exactly 45 entries', () => {
  assert.equal(STATS.length, 45);
});

test('all stats pass validation with no errors', () => {
  assert.deepEqual(validateStats(STATS), []);
});

test('every category has a display label', () => {
  for (const category of CATEGORIES) {
    assert.ok(CATEGORY_LABELS[category], `missing label for ${category}`);
  }
});

test('every category has a one-line explainer', () => {
  for (const category of CATEGORIES) {
    assert.ok(CATEGORY_EXPLAINERS[category], `missing explainer for ${category}`);
  }
});

test('CATEGORY_SOURCES.debt links to a real, well-formed https URL', () => {
  const source = CATEGORY_SOURCES.debt;
  assert.ok(source, 'expected a debt source entry');
  assert.ok(source.label.length > 0);
  assert.match(source.url, /^https:\/\//);
  assert.ok(source.note.length > 0);
});

test('groupByCategory buckets every stat under its own category and covers all categories', () => {
  const groups = groupByCategory(STATS);
  assert.equal(groups.size, CATEGORIES.length);
  let total = 0;
  for (const category of CATEGORIES) {
    const bucket = groups.get(category);
    assert.ok(Array.isArray(bucket));
    for (const stat of bucket) {
      assert.equal(stat.category, category);
    }
    total += bucket.length;
  }
  assert.equal(total, STATS.length);
});

test('validateStats catches a duplicate id', () => {
  const bad = [
    { id: 'x', label: 'X', category: 'debt', unit: 'count', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test' },
    { id: 'x', label: 'X2', category: 'debt', unit: 'count', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test' },
  ];
  const errors = validateStats(bad);
  assert.ok(errors.some((e) => e.includes('Duplicate id')));
});

test('validateStats catches an invalid unit', () => {
  const bad = [
    { id: 'y', label: 'Y', category: 'debt', unit: 'bogus', baseline: 1, asOf: '2026-01-01T00:00:00.000Z', perSecondRate: 0, source: 'test' },
  ];
  const errors = validateStats(bad);
  assert.ok(errors.some((e) => e.includes('Invalid unit')));
});
