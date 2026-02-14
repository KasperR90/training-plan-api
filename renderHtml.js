function renderHtml(plan) {
  if (!plan || !plan.meta || !plan.weeks?.length) {
    throw new Error('Invalid training plan data');
  }

  const TITLE_MAP = {
    '5k': '5 kilometer trainingsschema',
    '10k': '10 kilometer trainingsschema',
    'half': 'Halve marathon trainingsschema',
    'marathon': 'Marathon trainingsschema',
  };

  const title = TITLE_MAP[plan.meta.distanceKey];
  if (!title) {
    throw new Error(`No title for distance ${plan.meta.distanceKey}`);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { margin-bottom: 10px; }
    h2 { margin-top: 30px; }
    .session { margin-left: 20px; }
  </style>
</head>
<body>
  <h1>${title}</h1>

  <p>
    Doelafstand: <strong>${plan.meta.distanceLabel}</strong><br>
    Doeltijd: <strong>${plan.meta.goalTime || '—'}</strong><br>
    Trainingsduur: <strong>${plan.meta.weeks} weken</strong>
  </p>

  ${plan.weeks
    .map(
      (week) => `
        <h2>Week ${week.week}</h2>
        ${week.sessions
          .map(
            (s) => `
              <div class="session">
                <strong>${s.name}</strong><br>
                Type: ${s.type}<br>
                Duur: ${s.duration} min<br>
                Intensiteit: ${s.intensity}
              </div>
            `
          )
          .join('')}
      `
    )
    .join('')}
</body>
</html>
`;
}

module.exports = {
  renderHtml,
};