function renderHtml(plan) {
  if (!plan || !plan.weeks?.length) {
    throw new Error('Invalid training plan');
  }

  const TITLE_MAP = {
    '5k': '5K Training Plan',
    '10k': '10K Training Plan',
    'half': 'Half Marathon Training Plan',
    'marathon': 'Marathon Training Plan',
  };

  const title = TITLE_MAP[plan.meta.distanceKey];

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; }
  h1 { margin-bottom: 10px; }
  h2 { margin-top: 30px; }
  .week { margin-bottom: 25px; }
  .session { margin-left: 20px; margin-bottom: 10px; }
</style>
</head>
<body>

<h1>${title}</h1>

<p>
  Distance: <strong>${plan.meta.distanceLabel}</strong><br>
  Goal time: <strong>${plan.meta.goalTime || '—'}</strong><br>
  Duration: <strong>${plan.meta.weeks} weeks</strong>
</p>

${plan.weeks.map(week => `
  <div class="week">
    <h2>
      Week ${week.week} — ${week.total_km} km
      (${capitalize(week.phase)})
    </h2>

    ${week.sessions.map(s => `
      <div class="session">
        <strong>${formatSessionType(s.type)}</strong><br>
        Distance: ${s.distance_km} km<br>
        Target pace: ${s.pace ? `${s.pace.min} – ${s.pace.max}` : '—'}
      </div>
    `).join('')}
  </div>
`).join('')}

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
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  renderHtml,
};