function generateTrainingPlan({
  distanceKey,
  distanceLabel,
  distanceMeters,
  goalTime,
  weeks,
  sessionsPerWeek,
}) {
  if (!distanceKey || !distanceLabel || !distanceMeters) {
    throw new Error('Distance information is incomplete');
  }

  if (!weeks || !sessionsPerWeek) {
    throw new Error('Weeks and sessionsPerWeek are required');
  }

  const weeksPlan = [];

  for (let week = 1; week <= weeks; week++) {
    const sessions = [];

    for (let s = 1; s <= sessionsPerWeek; s++) {
      sessions.push({
        name: `Training ${s}`,
        type: getSessionType(s, sessionsPerWeek),
        duration: getSessionDuration(distanceKey, week, weeks),
        intensity: getIntensity(week, weeks),
      });
    }

    weeksPlan.push({
      week,
      sessions,
    });
  }

  return {
    meta: {
      distanceKey,
      distanceLabel,
      distanceMeters,
      goalTime,
      weeks,
      sessionsPerWeek,
    },
    weeks: weeksPlan,
  };
}

// ================================
// Helpers
// ================================
function getSessionType(index, total) {
  if (index === total) return 'Long run';
  if (index === 1) return 'Easy';
  if (index === 2) return 'Tempo';
  return 'Intervals';
}

function getSessionDuration(distanceKey, currentWeek, totalWeeks) {
  const BASES = {
    '5k': 25,
    '10k': 30,
    'half': 40,
    'marathon': 50,
  };

  const base = BASES[distanceKey];
  if (!base) throw new Error(`No base duration for ${distanceKey}`);

  const progression = Math.round((currentWeek / totalWeeks) * base);
  return base + progression;
}

function getIntensity(currentWeek, totalWeeks) {
  if (currentWeek < totalWeeks * 0.3) return 'Low';
  if (currentWeek < totalWeeks * 0.7) return 'Moderate';
  return 'High';
}

module.exports = {
  generateTrainingPlan,
};