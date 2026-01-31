function generateTrainingPlan(metadata) {
  const weeks = parseInt(metadata.weeks, 10);
  const sessionsPerWeek = parseInt(metadata.sessions, 10);

  const plan = [];

  for (let week = 1; week <= weeks; week++) {
    const weekPlan = {
      week,
      sessions: []
    };

    for (let s = 1; s <= sessionsPerWeek; s++) {
      weekPlan.sessions.push({
        name: `Training ${s}`,
        type: getSessionType(s, sessionsPerWeek),
        duration: getSessionDuration(week, weeks),
        intensity: getIntensity(week, weeks)
      });
    }

    plan.push(weekPlan);
  }

  return {
    meta: {
      distance: metadata.distance,
      goal_time: metadata.goal_time,
      weeks,
      sessions_per_week: sessionsPerWeek
    },
    weeks: plan
  };
}

// ================================
// Helpers
// ================================
function getSessionType(sessionIndex, totalSessions) {
  if (sessionIndex === totalSessions) return 'long run';
  if (sessionIndex === 1) return 'easy';
  if (sessionIndex === 2) return 'tempo';
  return 'interval';
}

function getSessionDuration(currentWeek, totalWeeks) {
  const base = 30;
  const progression = Math.round((currentWeek / totalWeeks) * 60);
  return base + progression; // minuten
}

function getIntensity(currentWeek, totalWeeks) {
  if (currentWeek < totalWeeks * 0.3) return 'low';
  if (currentWeek < totalWeeks * 0.7) return 'moderate';
  return 'high';
}

// ✅ CommonJS export
module.exports = {
  generateTrainingPlan
};
