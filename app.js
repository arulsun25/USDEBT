import { STATS, CATEGORIES, CATEGORY_LABELS, CATEGORY_EXPLAINERS, groupByCategory } from './shared/stats.js';
import { STATE_DEBT, STATE_GRID_ROWS, STATE_GRID_COLS, STATE_MAP_EXPLAINER } from './shared/states.js';
import { startTicker } from './shared/ticker.js';

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

function colorForDebt(value, min, max) {
  const t = (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  const clamped = Math.min(1, Math.max(0, t));
  const low = [28, 37, 48]; // dark, matches the site's card/border color
  const high = [239, 68, 68]; // vivid red
  const rgb = low.map((c, i) => Math.round(c + (high[i] - c) * clamped));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function renderStateMapCard(root, states) {
  const card = document.createElement('section');
  card.className = 'story-card state-map-card';

  const heading = document.createElement('h2');
  heading.textContent = 'State Debt';
  card.appendChild(heading);

  const explainer = document.createElement('p');
  explainer.className = 'explainer';
  explainer.textContent = STATE_MAP_EXPLAINER;
  card.appendChild(explainer);

  const wrapper = document.createElement('div');
  wrapper.className = 'state-map-wrapper';
  const grid = document.createElement('div');
  grid.className = 'state-map';
  grid.style.gridTemplateColumns = `repeat(${STATE_GRID_COLS}, 44px)`;
  grid.style.gridTemplateRows = `repeat(${STATE_GRID_ROWS}, 44px)`;
  wrapper.appendChild(grid);
  card.appendChild(wrapper);

  const readout = document.createElement('div');
  readout.className = 'state-readout';
  const readoutName = document.createElement('div');
  readoutName.className = 'state-readout-name';
  const readoutValue = document.createElement('div');
  readoutValue.className = 'state-readout-value';
  readout.appendChild(readoutName);
  readout.appendChild(readoutValue);
  card.appendChild(readout);

  const baselines = states.map((s) => s.baseline);
  const min = Math.min(...baselines);
  const max = Math.max(...baselines);

  let stopCurrent = null;
  let selectedTile = null;

  function selectState(state, tile) {
    if (stopCurrent) stopCurrent();
    if (selectedTile) selectedTile.classList.remove('selected');
    selectedTile = tile;
    tile.classList.add('selected');
    readoutName.textContent = state.name;
    stopCurrent = startTicker(state, (text) => {
      readoutValue.textContent = text;
    });
  }

  const tileByCode = new Map();
  for (const state of states) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'state-tile';
    tile.textContent = state.code;
    tile.style.gridRow = String(state.row + 1);
    tile.style.gridColumn = String(state.col + 1);
    tile.style.backgroundColor = colorForDebt(state.baseline, min, max);
    tile.addEventListener('click', () => selectState(state, tile));
    tileByCode.set(state.code, tile);
    grid.appendChild(tile);
  }

  const defaultState = states.reduce((a, b) => (b.baseline > a.baseline ? b : a));
  selectState(defaultState, tileByCode.get(defaultState.code));

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
renderStateMapCard(root, STATE_DEBT);
for (const category of CATEGORIES) {
  if (category === 'debt') continue;
  renderCategoryCard(root, category, groups.get(category));
}

setupKeyboardNav(root);
