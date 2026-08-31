# US Debt Clock Clone — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, mobile-friendly static website with three separate UI/navigation prototypes over the same ~45 simulated-live economic/debt stats, inspired by usdebtclock.org.

**Architecture:** A shared data module (`shared/stats.js`) holds all stat definitions (baseline value, snapshot date, per-second growth rate). A shared ticker engine (`shared/ticker.js`) animates any stat upward from its baseline and formats it for display. Three independent static prototypes (`prototype-a-grid`, `prototype-b-tabs`, `prototype-c-cards`) import both shared modules and render the same data with different navigation/layout. A root `index.html` links to all three. No backend, no build step.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (ES modules), Node.js built-in test runner (`node:test`) for unit tests on the two shared modules. Zero npm dependencies.

## Global Constraints

- Static site only — no backend, no build step, no npm install required to *view* the site (spec: "Explicit scope for this phase")
- Data is a simulated ticker (baseline + per-second growth rate animated client-side), not live API data (spec: "Data model")
- All stat data lives only in `shared/stats.js`; all three prototypes import it and `shared/ticker.js` — no duplicated stat data (spec: "Key decision")
- Exactly 3 fully separate prototype UIs, linked from a landing page (spec: "The three prototypes")
- Responsive/mobile support required: no horizontal scroll, 44px minimum touch targets, correct viewport meta tag (spec: "Mobile / responsive approach")
- No PWA / installability in this phase (spec: "Explicitly deferred")
- Every baseline value must carry its `asOf` snapshot date and `source` string (spec: "Architecture")

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test` runnable from project root via `node --test`, discovering any `*.test.js` file under the project.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "usdebt-clock-clone",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Create a smoke test at `tests/smoke.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('project scaffolding runs tests', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 4: Run the test suite to verify scaffolding works**

Run: `npm test`
Expected: output shows `tests 1`, `pass 1`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore tests/smoke.test.js
git commit -m "Scaffold project with package.json and test runner"
```

---

### Task 2: Ticker Engine

**Files:**
- Create: `shared/ticker.js`
- Test: `shared/ticker.test.js`

**Interfaces:**
- Produces:
  - `formatValue(value: number, unit: 'usd' | 'usd-cents' | 'count' | 'percent'): string`
  - `computeCurrentValue(stat: { baseline: number, asOf: string, perSecondRate: number }, now?: Date): number`
  - `startTicker(stat: { baseline: number, asOf: string, perSecondRate: number, unit: string }, onUpdate: (text: string) => void, intervalMs?: number): () => void` (the returned function stops the ticker)

- [ ] **Step 1: Write the failing tests at `shared/ticker.test.js`**

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './ticker.js'` (file doesn't exist yet).

- [ ] **Step 3: Implement `shared/ticker.js`**

```js
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: output shows `tests 8`, `pass 8`, `fail 0` (7 from this task + the Task 1 smoke test).

- [ ] **Step 5: Commit**

```bash
git add shared/ticker.js shared/ticker.test.js
git commit -m "Add shared ticker engine with formatting and animation"
```

---

### Task 3: Stats Data Module

**Files:**
- Create: `shared/stats.js`
- Test: `shared/stats.test.js`

**Interfaces:**
- Consumes: nothing (leaf data module)
- Produces:
  - `CATEGORIES: string[]` — `['debt', 'spending', 'revenue', 'economy', 'population', 'personal']`
  - `CATEGORY_LABELS: Record<string, string>`
  - `STATS: Array<{ id: string, label: string, category: string, unit: 'usd'|'usd-cents'|'count'|'percent', baseline: number, asOf: string, perSecondRate: number, source: string }>` — 45 entries
  - `groupByCategory(stats: typeof STATS): Map<string, typeof STATS>`
  - `validateStats(stats: typeof STATS): string[]` — list of error messages, empty if valid

- [ ] **Step 1: Write the failing tests at `shared/stats.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATS, CATEGORIES, CATEGORY_LABELS, groupByCategory, validateStats } from './stats.js';

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './stats.js'` (file doesn't exist yet).

- [ ] **Step 3: Implement `shared/stats.js`**

```js
const SNAPSHOT = '2026-08-31T00:00:00.000Z';

export const CATEGORIES = ['debt', 'spending', 'revenue', 'economy', 'population', 'personal'];

export const CATEGORY_LABELS = {
  debt: 'Debt',
  spending: 'Spending',
  revenue: 'Revenue',
  economy: 'Economy',
  population: 'Population',
  personal: 'Personal Debt',
};

const VALID_UNITS = new Set(['usd', 'usd-cents', 'count', 'percent']);

export const STATS = [
  // Debt
  { id: 'total-national-debt', label: 'Total National Debt', category: 'debt', unit: 'usd', baseline: 37300000000000, asOf: SNAPSHOT, perSecondRate: 85000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'debt-held-by-public', label: 'Debt Held by the Public', category: 'debt', unit: 'usd', baseline: 28500000000000, asOf: SNAPSHOT, perSecondRate: 60000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'intragovernmental-holdings', label: 'Intragovernmental Holdings', category: 'debt', unit: 'usd', baseline: 8800000000000, asOf: SNAPSHOT, perSecondRate: 25000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'debt-per-citizen', label: 'Debt Per Citizen', category: 'debt', unit: 'usd-cents', baseline: 108963.75, asOf: SNAPSHOT, perSecondRate: 0.25, source: 'Derived: total debt / US population (illustrative snapshot)' },
  { id: 'debt-per-taxpayer', label: 'Debt Per Taxpayer', category: 'debt', unit: 'usd-cents', baseline: 231677.02, asOf: SNAPSHOT, perSecondRate: 0.53, source: 'Derived: total debt / US taxpayers (illustrative snapshot)' },
  { id: 'debt-to-gdp-ratio', label: 'Debt to GDP Ratio', category: 'debt', unit: 'percent', baseline: 124.5, asOf: SNAPSHOT, perSecondRate: 0, source: 'FRED (illustrative snapshot)' },
  { id: 'fiscal-year-interest-paid', label: 'Interest Paid This Fiscal Year', category: 'debt', unit: 'usd', baseline: 950000000000, asOf: SNAPSHOT, perSecondRate: 34880, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Spending
  { id: 'total-federal-spending-fy', label: 'Total Federal Spending (FY)', category: 'spending', unit: 'usd', baseline: 6800000000000, asOf: SNAPSHOT, perSecondRate: 215000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'medicare-spending', label: 'Medicare Spending', category: 'spending', unit: 'usd', baseline: 1020000000000, asOf: SNAPSHOT, perSecondRate: 32300, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'social-security-spending', label: 'Social Security Spending', category: 'spending', unit: 'usd', baseline: 1520000000000, asOf: SNAPSHOT, perSecondRate: 48200, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'defense-spending', label: 'Defense Spending', category: 'spending', unit: 'usd', baseline: 880000000000, asOf: SNAPSHOT, perSecondRate: 27900, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'medicaid-spending', label: 'Medicaid Spending', category: 'spending', unit: 'usd', baseline: 620000000000, asOf: SNAPSHOT, perSecondRate: 19600, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'net-interest-spending', label: 'Net Interest on Debt', category: 'spending', unit: 'usd', baseline: 950000000000, asOf: SNAPSHOT, perSecondRate: 30100, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'income-security-spending', label: 'Income Security Spending', category: 'spending', unit: 'usd', baseline: 720000000000, asOf: SNAPSHOT, perSecondRate: 22800, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'other-discretionary-spending', label: 'Other Discretionary Spending', category: 'spending', unit: 'usd', baseline: 1090000000000, asOf: SNAPSHOT, perSecondRate: 34500, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Revenue
  { id: 'total-federal-revenue-fy', label: 'Total Federal Revenue (FY)', category: 'revenue', unit: 'usd', baseline: 5100000000000, asOf: SNAPSHOT, perSecondRate: 161700, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'individual-income-tax-revenue', label: 'Individual Income Tax Revenue', category: 'revenue', unit: 'usd', baseline: 2650000000000, asOf: SNAPSHOT, perSecondRate: 84000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'payroll-tax-revenue', label: 'Payroll Tax Revenue', category: 'revenue', unit: 'usd', baseline: 1700000000000, asOf: SNAPSHOT, perSecondRate: 53900, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'corporate-tax-revenue', label: 'Corporate Tax Revenue', category: 'revenue', unit: 'usd', baseline: 530000000000, asOf: SNAPSHOT, perSecondRate: 16800, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'federal-budget-deficit-fy', label: 'Federal Budget Deficit (FY)', category: 'revenue', unit: 'usd', baseline: 1700000000000, asOf: SNAPSHOT, perSecondRate: 53900, source: 'Derived: spending minus revenue (illustrative snapshot)' },
  { id: 'excise-and-other-revenue', label: 'Excise & Other Revenue', category: 'revenue', unit: 'usd', baseline: 220000000000, asOf: SNAPSHOT, perSecondRate: 6970, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Economy
  { id: 'gdp-nominal', label: 'Nominal GDP', category: 'economy', unit: 'usd', baseline: 29300000000000, asOf: SNAPSHOT, perSecondRate: 27870, source: 'FRED / BEA (illustrative snapshot)' },
  { id: 'gdp-per-capita', label: 'GDP Per Capita', category: 'economy', unit: 'usd-cents', baseline: 85600.0, asOf: SNAPSHOT, perSecondRate: 0.08, source: 'Derived: GDP / population (illustrative snapshot)' },
  { id: 'unemployment-rate', label: 'Unemployment Rate', category: 'economy', unit: 'percent', baseline: 4.2, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },
  { id: 'inflation-rate-cpi', label: 'Inflation Rate (CPI)', category: 'economy', unit: 'percent', baseline: 2.9, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },
  { id: 'federal-funds-rate', label: 'Federal Funds Rate', category: 'economy', unit: 'percent', baseline: 4.25, asOf: SNAPSHOT, perSecondRate: 0, source: 'FRED (illustrative snapshot)' },
  { id: 'm2-money-supply', label: 'M2 Money Supply', category: 'economy', unit: 'usd', baseline: 21700000000000, asOf: SNAPSHOT, perSecondRate: 13400, source: 'FRED (illustrative snapshot)' },
  { id: 'trade-deficit-ytd', label: 'Trade Deficit (YTD)', category: 'economy', unit: 'usd', baseline: 780000000000, asOf: SNAPSHOT, perSecondRate: 24700, source: 'US Census Bureau (illustrative snapshot)' },
  { id: 'labor-force-participation-rate', label: 'Labor Force Participation Rate', category: 'economy', unit: 'percent', baseline: 62.6, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },

  // Population
  { id: 'us-population', label: 'US Population', category: 'population', unit: 'count', baseline: 342300000, asOf: SNAPSHOT, perSecondRate: 0.054, source: 'US Census Bureau (illustrative snapshot)' },
  { id: 'us-taxpayers', label: 'US Taxpayers', category: 'population', unit: 'count', baseline: 161000000, asOf: SNAPSHOT, perSecondRate: 0.02, source: 'IRS (illustrative snapshot)' },
  { id: 'world-population', label: 'World Population', category: 'population', unit: 'count', baseline: 8230000000, asOf: SNAPSHOT, perSecondRate: 2.6, source: 'UN Population Division (illustrative snapshot)' },
  { id: 'us-births-this-year', label: 'US Births This Year', category: 'population', unit: 'count', baseline: 2400000, asOf: SNAPSHOT, perSecondRate: 0.114, source: 'CDC (illustrative snapshot)' },
  { id: 'us-deaths-this-year', label: 'US Deaths This Year', category: 'population', unit: 'count', baseline: 2050000, asOf: SNAPSHOT, perSecondRate: 0.099, source: 'CDC (illustrative snapshot)' },
  { id: 'us-households', label: 'US Households', category: 'population', unit: 'count', baseline: 132000000, asOf: SNAPSHOT, perSecondRate: 0.02, source: 'US Census Bureau (illustrative snapshot)' },

  // Personal Debt
  { id: 'total-consumer-debt', label: 'Total US Consumer Debt', category: 'personal', unit: 'usd', baseline: 18200000000000, asOf: SNAPSHOT, perSecondRate: 41200, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'mortgage-debt-total', label: 'Total Mortgage Debt', category: 'personal', unit: 'usd', baseline: 12900000000000, asOf: SNAPSHOT, perSecondRate: 22800, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'student-loan-debt-total', label: 'Total Student Loan Debt', category: 'personal', unit: 'usd', baseline: 1780000000000, asOf: SNAPSHOT, perSecondRate: 5100, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'credit-card-debt-total', label: 'Total Credit Card Debt', category: 'personal', unit: 'usd', baseline: 1320000000000, asOf: SNAPSHOT, perSecondRate: 4600, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'auto-loan-debt-total', label: 'Total Auto Loan Debt', category: 'personal', unit: 'usd', baseline: 1660000000000, asOf: SNAPSHOT, perSecondRate: 4100, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'avg-credit-card-debt-per-household', label: 'Avg Credit Card Debt / Household', category: 'personal', unit: 'usd-cents', baseline: 10990.0, asOf: SNAPSHOT, perSecondRate: 0.01, source: 'Derived (illustrative snapshot)' },
  { id: 'avg-student-loan-debt-per-borrower', label: 'Avg Student Loan Debt / Borrower', category: 'personal', unit: 'usd-cents', baseline: 39075.0, asOf: SNAPSHOT, perSecondRate: 0.01, source: 'Derived (illustrative snapshot)' },
  { id: 'avg-mortgage-debt-per-household', label: 'Avg Mortgage Debt / Household', category: 'personal', unit: 'usd-cents', baseline: 244500.0, asOf: SNAPSHOT, perSecondRate: 0.02, source: 'Derived (illustrative snapshot)' },
  { id: 'personal-savings-rate', label: 'Personal Savings Rate', category: 'personal', unit: 'percent', baseline: 4.6, asOf: SNAPSHOT, perSecondRate: 0, source: 'BEA (illustrative snapshot)' },
  { id: 'unfunded-liabilities-total', label: 'Total Unfunded Liabilities', category: 'personal', unit: 'usd', baseline: 212000000000000, asOf: SNAPSHOT, perSecondRate: 605000, source: 'Trustees reports methodology (illustrative snapshot)' },
];

export function groupByCategory(stats) {
  const groups = new Map();
  for (const category of CATEGORIES) {
    groups.set(category, []);
  }
  for (const stat of stats) {
    groups.get(stat.category).push(stat);
  }
  return groups;
}

export function validateStats(stats) {
  const errors = [];
  const seenIds = new Set();
  for (const stat of stats) {
    if (seenIds.has(stat.id)) errors.push(`Duplicate id: ${stat.id}`);
    seenIds.add(stat.id);
    if (!CATEGORIES.includes(stat.category)) errors.push(`Invalid category "${stat.category}" on ${stat.id}`);
    if (!VALID_UNITS.has(stat.unit)) errors.push(`Invalid unit "${stat.unit}" on ${stat.id}`);
    if (typeof stat.baseline !== 'number' || Number.isNaN(stat.baseline)) errors.push(`Invalid baseline on ${stat.id}`);
    if (typeof stat.perSecondRate !== 'number' || Number.isNaN(stat.perSecondRate)) errors.push(`Invalid perSecondRate on ${stat.id}`);
    if (Number.isNaN(new Date(stat.asOf).getTime())) errors.push(`Invalid asOf on ${stat.id}`);
    if (typeof stat.label !== 'string' || stat.label.length === 0) errors.push(`Invalid label on ${stat.id}`);
    if (typeof stat.source !== 'string' || stat.source.length === 0) errors.push(`Invalid source on ${stat.id}`);
  }
  return errors;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: output shows `tests 14`, `pass 14`, `fail 0` (6 from this task + 7 from Task 2 + 1 smoke test).

- [ ] **Step 5: Commit**

```bash
git add shared/stats.js shared/stats.test.js
git commit -m "Add shared stats data module with 45 illustrative stats"
```

---

### Task 4: Landing Page

**Files:**
- Create: `index.html`
- Create: `style.css`

**Interfaces:**
- Consumes: nothing (pure markup, links to the three prototype directories created in later tasks)

- [ ] **Step 1: Create `style.css`**

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0b0f14;
  color: #e8f1ff;
  padding: 1.5rem;
}
h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
p.intro { color: #9fb3c8; margin-top: 0; margin-bottom: 1.5rem; }
.prototype-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.prototype-card {
  display: block;
  background: #121821;
  border: 1px solid #223040;
  border-radius: 10px;
  padding: 1.25rem;
  color: inherit;
  text-decoration: none;
}
.prototype-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #4ade80;
}
.prototype-card p {
  margin: 0;
  color: #9fb3c8;
  font-size: 0.9rem;
}
@media (max-width: 480px) {
  body { padding: 1rem; }
}
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>US Debt Clock Clone</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>US Debt Clock Clone</h1>
  <p class="intro">Three navigation prototypes over the same ~45 live-ticking stats. Pick one to explore.</p>
  <div class="prototype-grid">
    <a class="prototype-card" href="prototype-a-grid/index.html">
      <h2>A &mdash; Grid Dashboard</h2>
      <p>Dense, all-at-once panel grid, closest to the original usdebtclock.org.</p>
    </a>
    <a class="prototype-card" href="prototype-b-tabs/index.html">
      <h2>B &mdash; Category Tabs</h2>
      <p>Browse one category at a time via a tab bar &mdash; less overwhelming.</p>
    </a>
    <a class="prototype-card" href="prototype-c-cards/index.html">
      <h2>C &mdash; Story Cards</h2>
      <p>Full-screen swipeable cards, one headline stat per category.</p>
    </a>
  </div>
</body>
</html>
```

- [ ] **Step 3: Manually verify the landing page**

Run: `python -m http.server 8000` from the project root, then open `http://localhost:8000` in a browser.
Expected:
- Page loads with title "US Debt Clock Clone" and three cards
- Resizing the browser to ~375px wide (iPhone width) stacks the cards into a single column with no horizontal scrollbar
- The three links point to `prototype-a-grid/index.html`, `prototype-b-tabs/index.html`, `prototype-c-cards/index.html` (they will 404 until Tasks 5-7 are done — that's expected at this point)

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "Add landing page linking to the three prototypes"
```

---

### Task 5: Prototype A — Grid Dashboard

**Files:**
- Create: `prototype-a-grid/index.html`
- Create: `prototype-a-grid/style.css`
- Create: `prototype-a-grid/app.js`

**Interfaces:**
- Consumes: `STATS`, `CATEGORIES`, `CATEGORY_LABELS`, `groupByCategory` from `../shared/stats.js`; `startTicker` from `../shared/ticker.js`

- [ ] **Step 1: Create `prototype-a-grid/style.css`**

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0b0f14;
  color: #e8f1ff;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #223040;
}
.top-bar h1 { font-size: 1rem; margin: 0; }
.back-link { color: #9fb3c8; text-decoration: none; font-size: 0.85rem; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
.panel {
  background: #121821;
  border: 1px solid #223040;
  border-radius: 8px;
  padding: 0.75rem;
}
.panel h2 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7fb3ff;
  margin: 0 0 0.5rem;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid #1c2530;
  font-variant-numeric: tabular-nums;
}
.stat-row:last-child { border-bottom: none; }
.stat-label { color: #9fb3c8; font-size: 0.78rem; }
.stat-value { color: #4ade80; font-weight: 600; font-size: 0.9rem; text-align: right; }
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; padding: 0.75rem; }
}
```

- [ ] **Step 2: Create `prototype-a-grid/app.js`**

```js
import { STATS, CATEGORIES, CATEGORY_LABELS, groupByCategory } from '../shared/stats.js';
import { startTicker } from '../shared/ticker.js';

function renderDashboard(root, stats) {
  const groups = groupByCategory(stats);

  for (const category of CATEGORIES) {
    const section = document.createElement('section');
    section.className = 'panel';

    const heading = document.createElement('h2');
    heading.textContent = CATEGORY_LABELS[category];
    section.appendChild(heading);

    for (const stat of groups.get(category)) {
      const row = document.createElement('div');
      row.className = 'stat-row';

      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = stat.label;

      const value = document.createElement('span');
      value.className = 'stat-value';

      row.appendChild(label);
      row.appendChild(value);
      section.appendChild(row);

      startTicker(stat, (text) => {
        value.textContent = text;
      });
    }

    root.appendChild(section);
  }
}

const root = document.getElementById('dashboard');
renderDashboard(root, STATS);
```

- [ ] **Step 3: Create `prototype-a-grid/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>US Debt Clock — Grid Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="top-bar">
    <a href="../index.html" class="back-link">&larr; All prototypes</a>
    <h1>Grid Dashboard</h1>
  </header>
  <div id="dashboard" class="grid"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Manually verify Prototype A**

Run: `python -m http.server 8000` from the project root (if not already running), then open `http://localhost:8000/prototype-a-grid/index.html`.
Expected:
- 6 panels appear (Debt, Spending, Revenue, Economy, Population, Personal Debt), each with the correct number of stat rows (7, 8, 6, 8, 6, 10)
- Every value updates at least once per second and keeps climbing (usd/count values), while percent values (e.g. Unemployment Rate) stay fixed
- At ~375px width, panels stack into a single column with no horizontal scrollbar
- "All prototypes" link returns to the landing page

- [ ] **Step 5: Commit**

```bash
git add prototype-a-grid/
git commit -m "Add prototype A: grid dashboard"
```

---

### Task 6: Prototype B — Category Tabs

**Files:**
- Create: `prototype-b-tabs/index.html`
- Create: `prototype-b-tabs/style.css`
- Create: `prototype-b-tabs/app.js`

**Interfaces:**
- Consumes: `STATS`, `CATEGORIES`, `CATEGORY_LABELS`, `groupByCategory` from `../shared/stats.js`; `startTicker` from `../shared/ticker.js`

- [ ] **Step 1: Create `prototype-b-tabs/style.css`**

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding-bottom: 4.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0b0f14;
  color: #e8f1ff;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #223040;
}
.top-bar h1 { font-size: 1rem; margin: 0; }
.back-link { color: #9fb3c8; text-decoration: none; font-size: 0.85rem; }
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  max-width: 640px;
  margin: 0 auto;
}
.stat-card {
  background: #121821;
  border: 1px solid #223040;
  border-radius: 10px;
  padding: 1rem;
}
.stat-label { color: #9fb3c8; font-size: 0.85rem; margin-bottom: 0.35rem; }
.stat-value { color: #4ade80; font-weight: 700; font-size: 1.4rem; font-variant-numeric: tabular-nums; }
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  overflow-x: auto;
  background: #121821;
  border-top: 1px solid #223040;
}
.tab-button {
  flex: 1 0 auto;
  min-width: 96px;
  padding: 0.9rem 0.5rem;
  background: none;
  border: none;
  color: #9fb3c8;
  font-size: 0.75rem;
  border-top: 2px solid transparent;
}
.tab-button.active { color: #4ade80; border-top-color: #4ade80; }
@media (min-width: 700px) {
  .tab-bar { position: static; border-top: none; border-bottom: 1px solid #223040; }
  body { padding-bottom: 0; }
}
```

- [ ] **Step 2: Create `prototype-b-tabs/app.js`**

```js
import { STATS, CATEGORIES, CATEGORY_LABELS, groupByCategory } from '../shared/stats.js';
import { startTicker } from '../shared/ticker.js';

function renderTabs(tabBar, panelRoot, stats) {
  const groups = groupByCategory(stats);
  let activeStops = [];

  function renderPanel(category) {
    for (const stop of activeStops) stop();
    activeStops = [];
    panelRoot.innerHTML = '';

    for (const stat of groups.get(category)) {
      const card = document.createElement('div');
      card.className = 'stat-card';

      const label = document.createElement('div');
      label.className = 'stat-label';
      label.textContent = stat.label;

      const value = document.createElement('div');
      value.className = 'stat-value';

      card.appendChild(label);
      card.appendChild(value);
      panelRoot.appendChild(card);

      activeStops.push(
        startTicker(stat, (text) => {
          value.textContent = text;
        })
      );
    }
  }

  for (const category of CATEGORIES) {
    const button = document.createElement('button');
    button.textContent = CATEGORY_LABELS[category];
    button.className = 'tab-button';
    button.dataset.category = category;
    if (category === CATEGORIES[0]) button.classList.add('active');

    button.addEventListener('click', () => {
      for (const btn of tabBar.children) {
        btn.classList.toggle('active', btn.dataset.category === category);
      }
      renderPanel(category);
    });

    tabBar.appendChild(button);
  }

  renderPanel(CATEGORIES[0]);
}

const tabBar = document.getElementById('tab-bar');
const panelRoot = document.getElementById('panel');
renderTabs(tabBar, panelRoot, STATS);
```

- [ ] **Step 3: Create `prototype-b-tabs/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>US Debt Clock — Category Tabs</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="top-bar">
    <a href="../index.html" class="back-link">&larr; All prototypes</a>
    <h1>Category Tabs</h1>
  </header>
  <div id="panel" class="panel"></div>
  <nav id="tab-bar" class="tab-bar"></nav>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Manually verify Prototype B**

Run: `python -m http.server 8000` from the project root (if not already running), then open `http://localhost:8000/prototype-b-tabs/index.html`.
Expected:
- The "Debt" tab is active by default and shows 7 stat cards, each ticking
- Clicking "Spending" swaps the panel to 8 stat cards for spending and marks that tab active
- At <700px width the tab bar sits fixed at the bottom of the screen (thumb-reachable, iOS-style); at >=700px it sits at the top
- Switching tabs repeatedly does not cause the page to slow down over time (confirms old tickers are being stopped, not leaked)

- [ ] **Step 5: Commit**

```bash
git add prototype-b-tabs/
git commit -m "Add prototype B: category tabs"
```

---

### Task 7: Prototype C — Story Cards

**Files:**
- Create: `prototype-c-cards/index.html`
- Create: `prototype-c-cards/style.css`
- Create: `prototype-c-cards/app.js`

**Interfaces:**
- Consumes: `STATS`, `CATEGORIES`, `CATEGORY_LABELS`, `groupByCategory` from `../shared/stats.js`; `startTicker` from `../shared/ticker.js`

- [ ] **Step 1: Create `prototype-c-cards/style.css`**

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0b0f14;
  color: #e8f1ff;
}
.back-link {
  position: fixed;
  top: 0.75rem;
  left: 1rem;
  z-index: 10;
  color: #9fb3c8;
  text-decoration: none;
  font-size: 0.85rem;
  background: rgba(18, 24, 33, 0.85);
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
}
.cards-root {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}
.story-card {
  scroll-snap-align: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #223040;
}
.story-card h2 {
  color: #7fb3ff;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.headline-value {
  color: #4ade80;
  font-weight: 800;
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-variant-numeric: tabular-nums;
}
.headline-label { color: #9fb3c8; margin-top: 0.5rem; font-size: 1rem; }
.supporting-stats { margin-top: 2rem; width: 100%; max-width: 420px; }
.supporting-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #1c2530;
  font-size: 0.85rem;
}
.supporting-row span:first-child { color: #9fb3c8; }
.supporting-row span:last-child { color: #e8f1ff; font-weight: 600; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 2: Create `prototype-c-cards/app.js`**

```js
import { STATS, CATEGORIES, CATEGORY_LABELS, groupByCategory } from '../shared/stats.js';
import { startTicker } from '../shared/ticker.js';

function renderCards(root, stats) {
  const groups = groupByCategory(stats);

  for (const category of CATEGORIES) {
    const card = document.createElement('section');
    card.className = 'story-card';

    const heading = document.createElement('h2');
    heading.textContent = CATEGORY_LABELS[category];
    card.appendChild(heading);

    const [headline, ...rest] = groups.get(category);

    const headlineValue = document.createElement('div');
    headlineValue.className = 'headline-value';
    card.appendChild(headlineValue);
    startTicker(headline, (text) => {
      headlineValue.textContent = text;
    });

    const headlineLabel = document.createElement('div');
    headlineLabel.className = 'headline-label';
    headlineLabel.textContent = headline.label;
    card.appendChild(headlineLabel);

    const supporting = document.createElement('div');
    supporting.className = 'supporting-stats';
    for (const stat of rest.slice(0, 3)) {
      const row = document.createElement('div');
      row.className = 'supporting-row';

      const label = document.createElement('span');
      label.textContent = stat.label;
      const value = document.createElement('span');

      row.appendChild(label);
      row.appendChild(value);
      supporting.appendChild(row);

      startTicker(stat, (text) => {
        value.textContent = text;
      });
    }
    card.appendChild(supporting);

    root.appendChild(card);
  }
}

const root = document.getElementById('cards');
renderCards(root, STATS);
```

- [ ] **Step 3: Create `prototype-c-cards/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>US Debt Clock — Story Cards</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <a href="../index.html" class="back-link">&larr; All prototypes</a>
  <div id="cards" class="cards-root"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Manually verify Prototype C**

Run: `python -m http.server 8000` from the project root (if not already running), then open `http://localhost:8000/prototype-c-cards/index.html`.
Expected:
- 6 full-screen cards, one per category, each with one large ticking headline number and up to 3 smaller supporting stats
- Scrolling (mouse wheel, trackpad, or touch swipe) snaps cleanly from one card to the next
- At ~375px width the headline number shrinks to fit without wrapping or overflowing (via the `clamp()` font size)

- [ ] **Step 5: Commit**

```bash
git add prototype-c-cards/
git commit -m "Add prototype C: story cards"
```

---

### Task 8: README and Final Local Verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (documentation only)

- [ ] **Step 1: Create `README.md`**

```markdown
# US Debt Clock Clone (Phase 1 — Simulated Data)

Three navigation prototypes over the same ~45 economic/debt stats, each
animated as a live-ticking counter client-side (baseline value + per-second
growth rate — the same technique the real usdebtclock.org uses). No backend,
no build step, no npm install required to view the site.

## Run it locally

Serve the project root with any static file server (required because the
prototypes load `shared/stats.js` / `shared/ticker.js` as ES modules, which
browsers block over a bare `file://` URL):

    python -m http.server 8000
    # or, if you have Node:
    npx serve .

Then open http://localhost:8000 and pick one of the three prototypes.

## Run the tests

Requires Node.js 18+.

    npm test

This runs `node --test`, which discovers `shared/*.test.js` and `tests/*.test.js`.

## The three prototypes

- **A — Grid Dashboard** (`prototype-a-grid/`): dense, all-categories-at-once
  panel grid, closest to the original usdebtclock.org.
- **B — Category Tabs** (`prototype-b-tabs/`): one category at a time via a
  tab bar (bottom on mobile, top on desktop).
- **C — Story Cards** (`prototype-c-cards/`): full-screen swipeable cards,
  one headline stat plus supporting stats per category.

## Updating the stats

All stat data lives in `shared/stats.js`. Each entry has:

- `baseline` — the value as of `asOf`
- `asOf` — ISO timestamp the baseline was accurate
- `perSecondRate` — how much the value changes per second (`0` for stats
  that don't continuously grow, like rates/percentages)
- `source` — where the figure conceptually comes from

To refresh: update `baseline`, `asOf`, and `perSecondRate` for each stat you
want current, then run `npm test` to confirm `validateStats` still passes.
All three prototypes pick up the change automatically since they all import
from this one file.

## What's deferred

- Real live data via government APIs (Treasury Fiscal Data, FRED) —
  `stats.js` is structured so this becomes a data-source swap, not a UI
  rewrite
- Hosting platform choice
- PWA / "Add to Home Screen" support
```

- [ ] **Step 2: Run the full test suite one final time**

Run: `npm test`
Expected: output shows `tests 14`, `pass 14`, `fail 0`, `duration` reasonable (no hangs).

- [ ] **Step 3: Full manual walkthrough**

Run: `python -m http.server 8000` from the project root, then in a browser:
1. Open `http://localhost:8000` — confirm all 3 cards link out correctly (no more 404s)
2. Visit each of the 3 prototypes and confirm numbers are ticking
3. Resize the window to ~375x667 (iPhone SE size) on each of the 3 prototypes and confirm no horizontal scrollbar appears anywhere and all text/buttons remain legible and tappable
4. If a physical iPhone or iOS simulator is available, open the same URL there (device and computer must be on the same network, using the computer's LAN IP instead of `localhost`) and repeat step 3

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add README with run/test/update instructions"
```
