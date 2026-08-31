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
