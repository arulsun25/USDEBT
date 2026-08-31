# US Debt Clock Clone — Phase 1 (Local, Simulated Data) Design

Date: 2026-08-31
Status: Approved

## Goal

Build a local, mobile-friendly website inspired by usdebtclock.org: a data-dense
dashboard of national debt / economic / population statistics that appears to
tick upward in real time. Ship three distinct UI/navigation prototypes so the
user can compare them side by side before deciding which to develop further
and where (if anywhere) to host it.

## Explicit scope for this phase

- Static site only (HTML/CSS/JS), no backend, no build step, no npm install
- ~45 stats across categories: Debt, Spending, Revenue, Economy, Population,
  Personal Debt Per Citizen
- Data is a **simulated ticker**: realistic baseline values (dated to a stated
  snapshot) plus a per-second growth rate animated client-side — the same
  technique the real usdebtclock.org uses. Not live API data.
- 3 fully separate prototype UIs, linked from a landing page
- Responsive design for mobile/iPhone Safari (no PWA/install step)
- Run locally via a trivial static file server

## Explicitly deferred (future phases, not built now)

- Real live data via free government APIs (US Treasury Fiscal Data API,
  FRED). `shared/stats.js` is structured so this becomes a swap of the data
  source, not a rewrite of the UI layer.
- Hosting platform selection — decided after local testing of all 3
  prototypes.
- PWA / "Add to Home Screen" installability.

## Architecture

```
usdebt-clock/
├── index.html                 landing page — 3 cards linking to each prototype
├── shared/
│   ├── stats.js                single source of truth: ~45 stat definitions
│   │                           { id, label, category, unit, baseline, asOf,
│   │                             perSecondRate, source }
│   └── ticker.js               shared engine: animates a stat upward from its
│                                baseline using perSecondRate, formats numbers
│                                (currency, commas, abbreviations)
├── prototype-a-grid/            dense grid dashboard (usdebtclock-style)
│   ├── index.html, style.css, app.js
├── prototype-b-tabs/            categorized tabs (Debt / Spending / Economy /
│   │                             Population / Personal)
│   ├── index.html, style.css, app.js
├── prototype-c-cards/           swipeable/scrollable story cards
│   ├── index.html, style.css, app.js
└── README.md                    how to run locally, how to refresh baseline data
```

**Key decision:** all stat data lives only in `shared/stats.js`. All three
prototypes import it and share `ticker.js` for animation. This means:
- The three prototypes are guaranteed to show consistent numbers/categories,
  differing only in layout/navigation/information density.
- The future real-API upgrade is a change to `stats.js` (and possibly adding
  a small fetch layer) — the three UI layers don't need to change.

Every baseline value in `stats.js` is commented with its source and snapshot
date so it's obvious what's illustrative and what needs refreshing before any
real deployment.

## The three prototypes

### Prototype A — Grid Dashboard
One packed screen, stats grouped into boxed panels per category, small
labels, large animated numbers — closest to the original site's density. On
mobile, panels stack into a single scrollable column with larger touch-
friendly text instead of a multi-column grid. Targets the "power user, see
everything at once" audience.

### Prototype B — Category Tabs
A tab bar (top on desktop, bottom on mobile — a familiar iOS pattern) with
tabs: Debt · Spending · Economy · Population · Personal. Each tab shows only
that category's stats, larger and less overwhelming than the grid. Best for
someone who wants to focus on one topic at a time.

### Prototype C — Story Cards
Full-screen swipeable/scrollable cards, one per stat group (swipe, scroll, or
arrow keys to advance). Each card has a headline number, 2-3 supporting
stats, and a one-line explainer. Most visually striking and mobile-native
(Instagram-Stories-like), but shows the least data at once — a "quick
glance" experience rather than a data-dense one.

## Mobile / responsive approach

Flexbox/grid CSS layouts with breakpoints, relative units, minimum 44px touch
targets (Apple HIG), no horizontal scrolling anywhere, correct viewport meta
tag. Verified by resizing a desktop browser to mobile widths and, if
available, testing on an actual iPhone in Safari.

## Local testing

Everything is static files, but `stats.js`/`ticker.js` load as ES modules,
which browsers block over a bare `file://` URL — so a trivial local static
server is required (documented in README, e.g. `npx serve` or
`python -m http.server`). `index.html` at the project root is the entry point
and links to all three prototypes for side-by-side comparison.

## Definition of done (this phase)

- All 3 prototypes run locally via a static server
- All show consistent, live-ticking numbers across the ~45 stats/categories
- All are readable and usable at mobile viewport widths
- Landing page allows jumping between all 3 prototypes to compare
- README documents how to run locally and how to update baseline data later
