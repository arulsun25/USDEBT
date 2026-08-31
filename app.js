import { STATS, CATEGORIES, CATEGORY_LABELS, CATEGORY_EXPLAINERS, groupByCategory } from './shared/stats.js';
import { STATE_DEBT, STATE_GRID_ROWS, STATE_GRID_COLS, STATE_MAP_EXPLAINER } from './shared/states.js';
import { STATE_PATHS, getPathBounds, getLabelPosition } from './shared/state-paths.js';
import { startTicker, formatValue, computeCurrentValue } from './shared/ticker.js';

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
    tooltip.textContent = `${state.name}: ${formatValue(computeCurrentValue(state), state.unit)}`;
    tooltip.hidden = false;
    positionTooltip(clientX, clientY);
  }

  function previewFocus(state) {
    // Keyboard focus has no cursor position to anchor a floating tooltip to —
    // the always-visible readout panel is this path's feedback instead.
    showInReadout(state);
  }

  function endPreview() {
    tooltip.hidden = true;
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

function setupKeyboardNav(root) {
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const cards = Array.from(root.querySelectorAll('.story-card'));
    const cardHeight = root.clientHeight;
    const currentIndex = Math.round(root.scrollTop / cardHeight);
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, cards.length - 1)
        : Math.max(currentIndex - 1, 0);
    cards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const root = document.getElementById('cards');
const groups = groupByCategory(STATS);

renderCategoryCard(root, 'debt', groups.get('debt'));
renderStateMapCard(root, STATE_DEBT, STATE_PATHS);
for (const category of CATEGORIES) {
  if (category === 'debt') continue;
  renderCategoryCard(root, category, groups.get(category));
}

setupKeyboardNav(root);
