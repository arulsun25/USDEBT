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
