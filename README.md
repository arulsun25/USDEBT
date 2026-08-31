# US Debt Clock Clone (Phase 1 — Simulated Data)

Full-screen, swipeable story cards over ~45 economic/debt stats, each
animated as a live-ticking counter client-side (baseline value + per-second
growth rate — the same technique the real usdebtclock.org uses). No backend,
no build step, no npm install required to view the site.

One card per category (Debt, Spending, Revenue, Economy, Population,
Personal Debt), each with a headline stat, a one-line explainer, and up to 3
supporting stats. Navigate by scrolling/swiping, or with the Up/Down arrow
keys once the page has focus.

This was narrowed down from three UI prototypes (a grid dashboard, category
tabs, and these story cards) after comparing them locally — story cards won.

## Run it locally

Serve the project root with any static file server (required because the
site loads `shared/stats.js` / `shared/ticker.js` as ES modules, which
browsers block over a bare `file://` URL):

    python -m http.server 8000
    # or, if you have Node:
    npx serve .

Then open http://localhost:8000.

## Run the tests

Requires Node.js 18+.

    npm test

This runs `node --test`, which discovers `shared/*.test.js` and `tests/*.test.js`.

## Updating the stats

All stat data lives in `shared/stats.js`. Each entry has:

- `baseline` — the value as of `asOf`
- `asOf` — ISO timestamp the baseline was accurate
- `perSecondRate` — how much the value changes per second (`0` for stats
  that don't continuously grow, like rates/percentages)
- `source` — where the figure conceptually comes from

To refresh: update `baseline`, `asOf`, and `perSecondRate` for each stat you
want current, then run `npm test` to confirm `validateStats` still passes.

Each category's one-line explainer lives in `CATEGORY_EXPLAINERS`, also in
`shared/stats.js`.

## What's deferred

- Real live data via government APIs (Treasury Fiscal Data, FRED) —
  `stats.js` is structured so this becomes a data-source swap, not a UI
  rewrite
- Hosting platform choice
- PWA / "Add to Home Screen" support
