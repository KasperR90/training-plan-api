function formatDateEnglish(date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderWeek(week) {
  let html = `
    <div class="week">
      <h2>Week ${week.weekNumber} – ${week.weekType.toUpperCase()}</h2>
      <p class="meta">
        Weekly volume: ${week.weekVolume} km · Load factor: ${week.weekFactor}
      </p>
      <table>
        <tr>
          <th>Date</th>
          <th>Session</th>
          <th>Distance</th>
          <th>Pace</th>
        </tr>
  `;

  week.sessions.forEach(s => {
    html += `
      <tr>
        <td>${formatDateEnglish(s.date)}</td>
        <td>${s.type}</td>
        <td>${s.distanceKm} km</td>
        <td>${s.pace}</td>
      </tr>
    `;
  });

  html += `
      </table>
    </div>
  `;

  return html;
}

function renderHtml(plan, raceDate) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Training Plan</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 40px;
      color: #222;
    }
    .page {
      page-break-after: always;
    }
    h1 { font-size: 28px; }
    h2 { font-size: 20px; margin-bottom: 2px; }
    .meta {
      font-size: 13px;
      color: #555;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px;
    }
    th {
      background: #f2f2f2;
    }
    td:last-child,
    td:nth-child(3) {
      text-align: right;
    }
  </style>
</head>
<body>

<h1>Half Marathon Training Plan</h1>
<p><strong>Race date:</strong> ${raceDate}</p>
`;

  for (let i = 0; i < plan.length; i += 2) {
    html += `<div class="page">`;
    html += renderWeek(plan[i]);
    if (plan[i + 1]) html += renderWeek(plan[i + 1]);
    html += `</div>`;
  }

  html += `
</body>
</html>
`;

  return html;
}

module.exports = { renderHtml };
