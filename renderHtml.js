// renderHtml.js
const LOGO_BASE64 = require('./Base64');

/* =========================
   Pace zones & helpers
========================= */
const PACE_ZONES = {
  Z1: 'Very easy / recovery',
  Z2: 'Easy aerobic',
  Z3: 'Moderate / steady',
  Z4: 'Threshold / tempo',
  Z5: 'VO2 max / intervals',
};

function getZonesForSession(type) {
  switch (type) {
    case 'easy':
      return ['Z1', 'Z2'];
    case 'long':
      return ['Z2'];
    case 'tempo':
      return ['Z3', 'Z4'];
    case 'interval':
      return ['Z4', 'Z5'];
    case 'race':
      return ['Race'];
    default:
      return [];
  }
}

function getSessionIcon(type) {
  return {
    easy: '🟢',
    long: '🔵',
    tempo: '🟠',
    interval: '🔴',
    race: '🏁',
  }[type] || '⚪';
}

function formatSessionType(type) {
  return {
    easy: 'Easy Run',
    long: 'Long Run',
    tempo: 'Tempo Run',
    interval: 'Interval Training',
    race: 'Race',
  }[type] || type;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* =========================
   Distance-specific race tips
========================= */
const RACE_TIPS = {
  '5k': [
    'Start controlled — the first kilometer should feel comfortable.',
    'Focus on cadence and relaxed breathing.',
    'Expect discomfort in the final third and stay mentally strong.',
  ],
  '10k': [
    'Run the first half conservatively.',
    'Stay relaxed through the middle kilometers.',
    'Gradually increase effort after halfway.',
  ],
  'half': [
    'Fuel and hydrate early, even if you don’t feel thirsty.',
    'Stay patient — the race starts after 15 km.',
    'Maintain rhythm and avoid pace spikes.',
  ],
  'marathon': [
    'Stick to your fueling plan from the start.',
    'Keep effort low in the first half.',
    'Focus on efficiency and form when fatigue sets in.',
    'Break the race into small mental segments.',
  ],
};

/* =========================
   Main renderer
========================= */
function renderHtml(plan) {
  if (!plan || !Array.isArray(plan.weeks)) {
    throw new Error('Invalid training plan');
  }

  const TITLE_MAP = {
    '5k': '5K Training Plan',
    '10k': '10K Training Plan',
    'half': 'Half Marathon Training Plan',
    'marathon': 'Marathon Training Plan',
  };

  const title =
    TITLE_MAP[plan.meta.distanceKey] || 'Personal Training Plan';

  const hasRaceWeek = plan.weeks.some(w => w.isRaceWeek);
  const raceTips = RACE_TIPS[plan.meta.distanceKey] || [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>

<style>
  @page { size: A4; margin: 22mm; }

  :root {
    --dark: #0B1320;
    --accent: #7ED6B2;
    --text: #1F2937;
    --muted: #6B7280;
    --bg: #F7F9FB;
    --border: #E5E7EB;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    color: var(--text);
    line-height: 1.5;
  }

  h1, h2 {
    color: var(--dark);
    margin: 0;
    font-weight: 600;
  }

  h1 { font-size: 30px; }
  h2 { font-size: 18px; }

  .page { page-break-after: always; }

  .logo {
    width: 220px;
    margin-bottom: 48px;
  }

  .subtitle {
    font-size: 16px;
    color: var(--muted);
    margin-bottom: 48px;
  }

  .meta {
    max-width: 420px;
    font-size: 14px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }

  th, td {
    padding: 8px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  th {
    background: var(--bg);
    text-align: left;
    font-weight: 600;
  }

  .week {
    margin-bottom: 36px;
    page-break-inside: avoid;
  }

  .week-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid var(--accent);
    margin-bottom: 8px;
    padding-bottom: 4px;
  }

  .week-meta {
    font-size: 12px;
    color: var(--muted);
  }

  ul {
    margin-top: 16px;
    padding-left: 18px;
  }

  li {
    margin-bottom: 8px;
  }

  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--muted);
    text-align: center;
  }
</style>
</head>

<body>

<!-- COVER -->
<section class="page">
  <img src="data:image/png;base64,${LOGO_BASE64}" class="logo" />
  <h1>${title}</h1>
  <div class="subtitle">Train Smarter. Automatically.</div>

  <div class="meta">
    <div class="meta-row"><span>Distance</span><span>${plan.meta.distanceLabel}</span></div>
    <div class="meta-row"><span>Goal time</span><span>${plan.meta.goalTime || '—'}</span></div>
    <div class="meta-row"><span>Duration</span><span>${plan.meta.weeks} weeks</span></div>
    <div class="meta-row"><span>Sessions per week</span><span>${plan.meta.sessionsPerWeek}</span></div>
  </div>
</section>

<!-- HOW TO USE -->
<section class="page">
  <h1>How to Use This Plan</h1>
  <ul>
    <li>Train by effort using pace zones, not exact speed.</li>
    <li>If you miss a session, do not try to compensate.</li>
    <li>Respect recovery and taper weeks.</li>
    <li>Consistency matters more than perfection.</li>
    <li>Adjust when needed — pain is not part of progress.</li>
  </ul>
</section>

<!-- PACE ZONES -->
<section class="page">
  <h1>Pace Zones Explained</h1>
  <table>
    <thead>
      <tr>
        <th>Zone</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(PACE_ZONES).map(([z, d]) => `
        <tr>
          <td><strong>${z}</strong></td>
          <td>${d}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</section>

<!-- TRAINING WEEKS -->
${plan.weeks.map(week => `
  <section class="week">
    <div class="week-header">
      <h2>Week ${week.week}</h2>
      <div class="week-meta">
        ${week.total_km} km · ${capitalize(week.phase)}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30%">Session</th>
          <th style="width: 15%">Volume</th>
          <th style="width: 20%">Pace zone</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${week.sessions.map(s => `
          <tr>
            <td>${getSessionIcon(s.type)} ${formatSessionType(s.type)}</td>
            <td>${s.distance_km} km</td>
            <td>${getZonesForSession(s.type).join(' / ')}</td>
            <td>${s.description || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
`).join('')}

<!-- RACE WEEK (ONLY IF PRESENT) -->
${hasRaceWeek ? `
<section class="page">
  <h1>Race Week</h1>
  <ul>
    ${raceTips.map(tip => `<li>${tip}</li>`).join('')}
  </ul>
  <p>
    Your training is complete. Focus on recovery, preparation and confidence.
    Trust the process and enjoy race day.
  </p>
</section>
` : ''}

<div class="footer">
  © RUNIQ · Personalized training, built on science
</div>

</body>
</html>
`;
}

module.exports = {
  renderHtml,
};