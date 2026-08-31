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
