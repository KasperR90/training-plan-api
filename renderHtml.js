// renderHtml.js
const LOGO_BASE64 = require('./Base64');

function renderHtml(plan) {
  if (!plan || !Array.isArray(plan.weeks)) {
    throw new Error('Invalid training plan data');
  }

  const TITLE_MAP = {
    '5k': '5K Training Plan',
    '10k': '10K Training Plan',
    'half': 'Half Marathon Training Plan',
    'marathon': 'Marathon Training Plan',
  };

  const title =
    TITLE_MAP[plan.meta?.distanceKey] || 'Personal Training Plan';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>

<style>
  @page {
    size: A4;
    margin: 22mm;
  }

  :root {
    --dark: #0B1320;
    --accent: #7ED6B2;
    --text: #1F2937;
    --muted: #6B7280;
    --bg-light: #F7F9FB;
    --border: #E5E7EB;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: var(--text);
    background: white;
  }

  h1, h2, h3 {
    color: var(--dark);
    margin: 0;
    font-weight: 600;
  }

  /* =========================
     COVER PAGE
  ========================= */
  .cover {
    page-break-after: always;
  }

  .logo {
    width: 220px;
    margin-bottom: 48px;
  }

  .cover h1 {
    font-size: 30px;
    margin-bottom: 12px;
  }

  .subtitle {
    font-size: 16px;
    color: var(--muted);
    margin-bottom: 48px;
  }

  .meta {
    font-size: 14px;
    max-width: 420px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .meta-row span:first-child {
    color: var(--muted);
  }

  /* =========================
     WEEK SECTIONS
  ========================= */
  .week {
    page-break-inside: avoid;
    margin-bottom: 36px;
  }

  .week-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--accent);
  }

  .week-header h2 {
    font-size: 18px;
  }

  .week-meta {
    font-size: 12px;
    color: var(--muted);
  }

  /* =========================
     TRAINING TABLE
  ========================= */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    font-size: 12px;
  }

  thead th {
    text-align: left;
    padding: 8px;
    background: var(--bg-light);
    border-bottom: 1px solid var(--border);
    color: var(--dark);
    font-weight: 600;
  }

  tbody td {
    padding: 8px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .session-type {
    font-weight: 600;
    color: var(--dark);
  }

  .pace {
    font-family: monospace;
  }

  /* =========================
     FOOTER
  ========================= */
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

<!-- =========================
     COVER
========================= -->
<div class="cover">
  <img
    src="data:image/png;base64,${LOGO_BASE64}"
    alt="RUNIQ logo"
    class="logo"
  />

  <h1>${title}</h1>
  <div class="subtitle">Train Smarter. Automatically.</div>

  <div class="meta">
    <div class="meta-row">
      <span>Distance</span>
      <span>${plan.meta.distanceLabel}</span>
    </div>
    <div class="meta-row">
      <span>Goal time</span>
      <span>${plan.meta.goalTime || '—'}</span>
    </div>
    <div class="meta-row">
      <span>Duration</span>
      <span>${plan.meta.weeks} weeks</span>
    </div>
    <div class="meta-row">
      <span>Sessions per week</span>
      <span>${plan.meta.sessionsPerWeek}</span>
    </div>
  </div>
</div>

<!-- =========================
     TRAINING PLAN
========================= -->
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
          <th style="width: 25%">Session</th>
          <th style="width: 15%">Volume</th>
          <th style="width: 25%">Target pace</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${week.sessions.map(s => `
          <tr>
            <td class="session-type">${formatSessionType(s.type)}</td>
            <td>${s.distance_km} km</td>
            <td class="pace">
              ${s.pace ? `${s.pace.min} – ${s.pace.max}` : '—'}
            </td>
            <td>${s.description || ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
`).join('')}

<div class="footer">
  © RUNIQ · Personalized training, built on science
</div>

</body>
</html>
`;
}

function formatSessionType(type) {
  const map = {
    easy: 'Easy Run',
    tempo: 'Tempo Run',
    interval: 'Interval Training',
    long: 'Long Run',
  };
  return map[type] || type;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  renderHtml,
};