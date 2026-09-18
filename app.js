import { STATS, CATEGORIES, CATEGORY_LABELS, CATEGORY_EXPLAINERS, CATEGORY_SOURCES, groupByCategory } from './shared/stats.js';
import { STATE_DEBT, STATE_GRID_ROWS, STATE_GRID_COLS, STATE_MAP_EXPLAINER } from './shared/states.js';
import { STATE_PATHS, getPathBounds, getLabelPosition } from './shared/state-paths.js';
import {
  DEBT_TO_GOLD_CHAIN,
  GOLD_THESIS_EXPLAINER,
  GOLD_LIVE_PRICE_URL,
  GOLD_HISTORY_URL,
  GOLD_SOURCES,
  computeTrend,
} from './shared/gold.js';
import { startTicker, formatValue } from './shared/ticker.js';

function renderCategoryCard(root, category, statsForCategory) {
  const card = document.createElement('section');
  card.className = 'story-card';

  const heading = document.createElement('h2');
  heading.textContent = CATEGORY_LABELS[category];
  card.appendChild(heading);

  const [headline, ...rest] = statsForCategory;

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

  const explainer = document.createElement('p');
  explainer.className = 'explainer';
  explainer.textContent = CATEGORY_EXPLAINERS[category];
  card.appendChild(explainer);

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

  const source = CATEGORY_SOURCES[category];
  if (source) {
    const sourceBlock = document.createElement('div');
    sourceBlock.className = 'source-note';

    const link = document.createElement('a');
    link.className = 'source-link';
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Source: ${source.label} ↗`;
    sourceBlock.appendChild(link);

    const note = document.createElement('p');
    note.className = 'source-explanation';
    note.textContent = source.note;
    sourceBlock.appendChild(note);

    card.appendChild(sourceBlock);
  }

  root.appendChild(card);
}

// Sequential single-hue (blue) ramp: colorblind-safe by construction because it
// varies in lightness, not hue — readable under every form of color vision
// deficiency, including full monochromacy. Low debt recedes toward the dark
// page background; high debt stands out as bright blue. Endpoints match the
// documented sequential ramp's steps 700/100.
const STATE_COLOR_LOW = [13, 54, 107]; // #0d366b
const STATE_COLOR_HIGH = [205, 226, 251]; // #cde2fb
const TEXT_DARK_RGB = [11, 15, 20]; // #0b0f14
const TEXT_LIGHT_RGB = [232, 241, 255]; // #e8f1ff

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA, rgbB) {
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

function colorForDebt(value, min, max) {
  const t = (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  const clamped = Math.min(1, Math.max(0, t));
  const rgb = STATE_COLOR_LOW.map((c, i) => Math.round(c + (STATE_COLOR_HIGH[i] - c) * clamped));
  // Pick whichever text color actually contrasts better against this exact
  // background, rather than assuming a fixed lightness threshold — a ramp's
  // midpoint can leave both black and white text short of ideal contrast, so a
  // halo (in the opposite tone) rides along as a legibility floor either way.
  const useLight = contrastRatio(rgb, TEXT_LIGHT_RGB) >= contrastRatio(rgb, TEXT_DARK_RGB);
  return {
    background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    textColor: useLight ? '#e8f1ff' : '#0b0f14',
    haloColor: useLight ? 'rgba(11, 15, 20, 0.85)' : 'rgba(232, 241, 255, 0.85)',
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildGridView(states, min, max, interactions) {
  const wrapper = document.createElement('div');
  wrapper.className = 'state-map-wrapper';
  const grid = document.createElement('div');
  grid.className = 'state-map';
  grid.style.gridTemplateColumns = `repeat(${STATE_GRID_COLS}, 44px)`;
  grid.style.gridTemplateRows = `repeat(${STATE_GRID_ROWS}, 44px)`;

  for (const state of states) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'state-tile';
    tile.textContent = state.code;
    tile.setAttribute('aria-label', `${state.name}: ${state.code}`);
    tile.style.gridRow = String(state.row + 1);
    tile.style.gridColumn = String(state.col + 1);
    const { background, textColor, haloColor } = colorForDebt(state.baseline, min, max);
    tile.style.backgroundColor = background;
    tile.style.color = textColor;
    tile.style.textShadow = `0 0 3px ${haloColor}`;
    interactions.attach(tile, state);
    grid.appendChild(tile);
  }

  wrapper.appendChild(grid);
  return wrapper;
}

function buildMapView(states, paths, min, max, interactions) {
  const wrapper = document.createElement('div');
  wrapper.className = 'state-map-wrapper state-svg-wrapper';

  const bounds = getPathBounds(paths);
  const margin = 4;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'state-svg-map');
  svg.setAttribute(
    'viewBox',
    `${bounds.minX - margin} ${bounds.minY - margin} ${bounds.maxX - bounds.minX + margin * 2} ${bounds.maxY - bounds.minY + margin * 2}`
  );

  // DC has no border geometry in this dataset (the source covers the 50
  // states only) — it appears in the Grid view but not here.
  for (const state of states) {
    const d = paths[state.code];
    if (!d) continue;

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    const { background, textColor, haloColor } = colorForDebt(state.baseline, min, max);
    path.setAttribute('fill', background);
    path.setAttribute('stroke', '#0b0f14');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('tabindex', '0');
    path.setAttribute('role', 'button');
    path.setAttribute('aria-label', `${state.name}: ${state.code}`);
    interactions.attach(path, state);
    svg.appendChild(path);

    const { x, y } = getLabelPosition(d);
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(x));
    label.setAttribute('y', String(y));
    label.setAttribute('class', 'state-svg-label');
    label.setAttribute('fill', textColor);
    label.setAttribute('stroke', haloColor);
    label.textContent = state.code;
    svg.appendChild(label);
  }

  wrapper.appendChild(svg);
  return wrapper;
}

function renderStateMapCard(root, states, paths) {
  const card = document.createElement('section');
  card.className = 'story-card state-map-card';

  const heading = document.createElement('h2');
  heading.textContent = 'State Debt';
  card.appendChild(heading);

  const explainer = document.createElement('p');
  explainer.className = 'explainer';
  explainer.textContent = STATE_MAP_EXPLAINER;
  card.appendChild(explainer);

  const legend = document.createElement('div');
  legend.className = 'state-legend';
  const legendLow = document.createElement('span');
  legendLow.textContent = 'Lower debt';
  const legendBar = document.createElement('div');
  legendBar.className = 'state-legend-bar';
  legendBar.style.background = `linear-gradient(to right, rgb(${STATE_COLOR_LOW.join(', ')}), rgb(${STATE_COLOR_HIGH.join(', ')}))`;
  const legendHigh = document.createElement('span');
  legendHigh.textContent = 'Higher debt';
  legend.appendChild(legendLow);
  legend.appendChild(legendBar);
  legend.appendChild(legendHigh);
  card.appendChild(legend);

  const viewToggle = document.createElement('div');
  viewToggle.className = 'state-view-toggle';
  const gridButton = document.createElement('button');
  gridButton.type = 'button';
  gridButton.className = 'state-view-button active';
  gridButton.textContent = 'Grid';
  const mapButton = document.createElement('button');
  mapButton.type = 'button';
  mapButton.className = 'state-view-button';
  mapButton.textContent = 'Map';
  viewToggle.appendChild(gridButton);
  viewToggle.appendChild(mapButton);
  card.appendChild(viewToggle);

  const readout = document.createElement('div');
  readout.className = 'state-readout';
  const readoutName = document.createElement('div');
  readoutName.className = 'state-readout-name';
  const readoutValue = document.createElement('div');
  readoutValue.className = 'state-readout-value';
  readout.appendChild(readoutName);
  readout.appendChild(readoutValue);

  const tooltip = document.createElement('div');
  tooltip.className = 'state-tooltip';
  tooltip.hidden = true;

  const baselines = states.map((s) => s.baseline);
  const min = Math.min(...baselines);
  const max = Math.max(...baselines);

  const tilesByCode = new Map();
  function registerTile(code, element) {
    if (!tilesByCode.has(code)) tilesByCode.set(code, []);
    tilesByCode.get(code).push(element);
  }

  let stopReadout = null;
  function showInReadout(state) {
    if (stopReadout) stopReadout();
    readoutName.textContent = state.name;
    stopReadout = startTicker(state, (text) => {
      readoutValue.textContent = text;
    });
  }

  let stopTooltip = null;
  function hideTooltip() {
    if (stopTooltip) {
      stopTooltip();
      stopTooltip = null;
    }
    tooltip.hidden = true;
  }

  // Ticks on its own, the same way the readout does — a one-off snapshot
  // taken at mouseenter would go stale the longer the pointer sits still,
  // showing a different number than the (still-ticking) readout beneath it.
  function showTooltipFor(state) {
    if (stopTooltip) stopTooltip();
    tooltip.hidden = false;
    stopTooltip = startTicker(state, (text) => {
      tooltip.textContent = `${state.name}: ${text}`;
    });
  }

  let pinnedState = null;
  function pinState(state) {
    pinnedState = state;
    for (const elements of tilesByCode.values()) {
      for (const el of elements) el.classList.remove('selected');
    }
    for (const el of tilesByCode.get(state.code) ?? []) {
      el.classList.add('selected');
    }
    showInReadout(state);
  }

  function positionTooltip(clientX, clientY) {
    const cardRect = card.getBoundingClientRect();
    tooltip.style.left = `${clientX - cardRect.left + 14}px`;
    tooltip.style.top = `${clientY - cardRect.top + 14}px`;
  }

  function previewHover(state, clientX, clientY) {
    showInReadout(state);
    showTooltipFor(state);
    positionTooltip(clientX, clientY);
  }

  function previewFocus(state) {
    // Keyboard focus has no cursor position to anchor a floating tooltip to,
    // and a mouse hover elsewhere may have left one open — close it so focus
    // and tooltip never show two different states at once. The always-visible
    // readout panel is this path's feedback instead.
    hideTooltip();
    showInReadout(state);
  }

  function endPreview() {
    hideTooltip();
    if (pinnedState) showInReadout(pinnedState);
  }

  const interactions = {
    attach(element, state) {
      registerTile(state.code, element);
      element.addEventListener('click', () => pinState(state));
      element.addEventListener('mouseenter', (event) => previewHover(state, event.clientX, event.clientY));
      element.addEventListener('mousemove', (event) => positionTooltip(event.clientX, event.clientY));
      element.addEventListener('mouseleave', endPreview);
      element.addEventListener('focus', () => previewFocus(state));
      element.addEventListener('blur', endPreview);
      if (element.tagName.toLowerCase() !== 'button') {
        element.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          pinState(state);
        });
      }
    },
  };

  const gridView = buildGridView(states, min, max, interactions);
  const mapView = buildMapView(states, paths, min, max, interactions);
  mapView.hidden = true;

  gridButton.addEventListener('click', () => {
    gridView.hidden = false;
    mapView.hidden = true;
    gridButton.classList.add('active');
    mapButton.classList.remove('active');
  });
  mapButton.addEventListener('click', () => {
    gridView.hidden = true;
    mapView.hidden = false;
    mapButton.classList.add('active');
    gridButton.classList.remove('active');
  });

  card.appendChild(gridView);
  card.appendChild(mapView);
  card.appendChild(tooltip);
  card.appendChild(readout);

  const defaultState = states.reduce((a, b) => (b.baseline > a.baseline ? b : a));
  pinState(defaultState);

  root.appendChild(card);
}

function renderGoldCard(root) {
  const card = document.createElement('section');
  card.className = 'story-card gold-card';

  const heading = document.createElement('h2');
  heading.textContent = 'Debt → Gold';
  card.appendChild(heading);

  const chain = document.createElement('div');
  chain.className = 'gold-chain';
  DEBT_TO_GOLD_CHAIN.forEach((step, index) => {
    if (index > 0) {
      const connector = document.createElement('div');
      connector.className = 'gold-chain-connector';
      connector.textContent = '⌄';
      connector.setAttribute('aria-hidden', 'true');
      chain.appendChild(connector);
    }

    const stepEl = document.createElement('div');
    stepEl.className = 'gold-chain-step';
    if (index === DEBT_TO_GOLD_CHAIN.length - 1) stepEl.classList.add('gold-chain-step-final');

    const label = document.createElement('span');
    label.textContent = step;
    const arrow = document.createElement('span');
    arrow.className = 'gold-chain-arrow';
    arrow.textContent = '↑';
    arrow.setAttribute('aria-hidden', 'true');

    stepEl.appendChild(label);
    stepEl.appendChild(arrow);
    chain.appendChild(stepEl);
  });
  card.appendChild(chain);

  const explainer = document.createElement('p');
  explainer.className = 'explainer';
  explainer.textContent = GOLD_THESIS_EXPLAINER;
  card.appendChild(explainer);

  const priceBlock = document.createElement('div');
  priceBlock.className = 'gold-price-block';

  const priceValue = document.createElement('div');
  priceValue.className = 'headline-value';
  priceValue.textContent = 'Loading live price…';
  priceBlock.appendChild(priceValue);

  const priceLabel = document.createElement('div');
  priceLabel.className = 'headline-label';
  priceLabel.textContent = 'Live Gold Price (XAU/USD)';
  priceBlock.appendChild(priceLabel);

  const trendRow = document.createElement('div');
  trendRow.className = 'gold-trend';
  priceBlock.appendChild(trendRow);

  card.appendChild(priceBlock);

  const sourceBlock = document.createElement('div');
  sourceBlock.className = 'source-note';
  for (const source of GOLD_SOURCES) {
    const link = document.createElement('a');
    link.className = 'source-link';
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `Source: ${source.label} ↗`;
    sourceBlock.appendChild(link);
  }
  card.appendChild(sourceBlock);

  root.appendChild(card);

  loadGoldData(priceValue, priceLabel, trendRow);
}

async function loadGoldData(priceValue, priceLabel, trendRow) {
  let currentPrice;
  try {
    const priceRes = await fetch(GOLD_LIVE_PRICE_URL);
    if (!priceRes.ok) throw new Error(`price fetch failed: ${priceRes.status}`);
    const priceData = await priceRes.json();
    currentPrice = priceData.price;
    const updatedAt = new Date(priceData.updatedAt);

    priceValue.textContent = formatValue(currentPrice, 'usd-cents');
    priceLabel.textContent = `Live Gold Price (XAU/USD) — as of ${updatedAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })}`;
  } catch (priceError) {
    priceValue.textContent = 'Live price unavailable';
    priceLabel.textContent = 'Could not reach the gold price API right now — try refreshing the page.';
    return;
  }

  try {
    const historyRes = await fetch(GOLD_HISTORY_URL);
    if (!historyRes.ok) throw new Error(`history fetch failed: ${historyRes.status}`);
    const history = await historyRes.json();
    const trend = computeTrend(history, currentPrice, new Date(), 30);
    if (!trend) {
      trendRow.textContent = 'Recent trend unavailable right now.';
      return;
    }
    const direction = trend.percentChange >= 0 ? '▲' : '▼';
    const sign = trend.percentChange >= 0 ? '+' : '';
    // trend.fromDate is a date-only string (YYYY-MM-DD), parsed as UTC
    // midnight — format it in UTC too, or a viewer west of UTC would see it
    // displayed as one day earlier than the actual data date.
    const fromDateLabel = new Date(trend.fromDate).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
    trendRow.textContent = `${direction} ${sign}${trend.percentChange.toFixed(1)}% since ${fromDateLabel} (${trend.actualDaysElapsed} days ago)`;
    trendRow.classList.add(trend.percentChange >= 0 ? 'gold-trend-up' : 'gold-trend-down');
  } catch (historyError) {
    trendRow.textContent = 'Recent trend unavailable right now.';
  }
}

function addScrollCue(card) {
  const cue = document.createElement('div');
  cue.className = 'scroll-cue';
  cue.setAttribute('aria-hidden', 'true');

  const chevron = document.createElement('div');
  chevron.className = 'scroll-cue-chevron';
  chevron.textContent = '⌄';

  const label = document.createElement('div');
  label.className = 'scroll-cue-label';
  label.textContent = 'Scroll for more';

  cue.appendChild(chevron);
  cue.appendChild(label);
  card.appendChild(cue);
}

function addScrollCues(root) {
  const cards = Array.from(root.querySelectorAll('.story-card'));
  cards.forEach((card, index) => {
    const isLast = index === cards.length - 1;
    // Skipped on the state-map card (its own internal scroll area — toggle,
    // legend, readout) and the gold card (chain diagram + explainer + price
    // + trend + sources is already a lot in one screen) — a bottom-anchored
    // cue on either would just add clutter on top of their own scrolling.
    if (isLast || card.classList.contains('state-map-card') || card.classList.contains('gold-card')) return;
    addScrollCue(card);
  });
}

function setupKeyboardNav(root) {
  const cards = Array.from(root.querySelectorAll('.story-card'));
  // While a smooth scroll from a previous keypress is still in flight,
  // scrollTop sits partway between cards — a second press before it settles
  // would recompute its target from that in-between position and could
  // re-target the card already being scrolled to instead of advancing.
  // Ignore new presses until 'scrollend' fires (with a timeout fallback for
  // browsers that don't support it).
  let isScrolling = false;
  let fallbackTimer = null;

  root.addEventListener('scrollend', () => {
    isScrolling = false;
    if (fallbackTimer) clearTimeout(fallbackTimer);
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (isScrolling) return;

    const cardHeight = root.clientHeight || 1;
    const currentIndex = Math.round(root.scrollTop / cardHeight);
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, cards.length - 1)
        : Math.max(currentIndex - 1, 0);
    if (nextIndex === currentIndex) return;

    isScrolling = true;
    fallbackTimer = setTimeout(() => {
      isScrolling = false;
    }, 600);
    cards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const root = document.getElementById('cards');
const groups = groupByCategory(STATS);

renderCategoryCard(root, 'debt', groups.get('debt'));
renderStateMapCard(root, STATE_DEBT, STATE_PATHS);
renderGoldCard(root);
for (const category of CATEGORIES) {
  if (category === 'debt') continue;
  renderCategoryCard(root, category, groups.get(category));
}

addScrollCues(root);
setupKeyboardNav(root);
