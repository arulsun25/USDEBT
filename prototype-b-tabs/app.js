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
