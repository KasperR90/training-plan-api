/**
 * Training plan generator – volume, tempo, periodisering
 */

function generateTrainingPlan({
  distanceKey,
  distanceLabel,
  distanceMeters,
  goalTime, // bv "1:45:00"
  weeks,
  sessionsPerWeek,
}) {
  if (!distanceKey || !weeks || !sessionsPerWeek) {
    throw new Error('Missing required training plan parameters');
  }

  const racePace = calculateRacePace(goalTime, distanceMeters); // min/km
  const baseWeeklyVolume = getBaseWeeklyVolume(distanceKey);

  const weeksPlan = [];

  for (let week = 1; week <= weeks; week++) {
    const phase = getPhase(week, weeks);
    const volumeFactor = getVolumeFactor(week, weeks, phase);

    const weeklyKm = round(
      baseWeeklyVolume * volumeFactor * progressionFactor(week, weeks)
    );

    const sessions = buildSessions({
      distanceKey,
      sessionsPerWeek,
      weeklyKm,
      racePace,
      phase,
    });

    weeksPlan.push({
      week,
      phase,
      total_km: sumKm(sessions),
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

/* ================================
   Session builder
================================ */

function buildSessions({
  distanceKey,
  sessionsPerWeek,
  weeklyKm,
  racePace,
  phase,
}) {
  const types = getSessionTypes(distanceKey, sessionsPerWeek);

  const distribution = {
    easy: 0.45,
    tempo: 0.25,
    interval: 0.15,
    long: 0.15,
  };

  if (phase === 'recovery') {
    distribution.tempo -= 0.1;
    distribution.interval -= 0.05;
    distribution.easy += 0.15;
  }

  if (phase === 'taper') {
    distribution.long -= 0.1;
    distribution.easy += 0.1;
  }

  return types.map((type) => {
    const km = round(weeklyKm * (distribution[type] || 0.2));
    return {
      type,
      distance_km: km,
      pace: getPaceForType(type, racePace),
    };
  });
}

/* ================================
   Helpers
================================ */

function calculateRacePace(goalTime, meters) {
  if (!goalTime) return null;
  const seconds = parseTimeToSeconds(goalTime);
  const km = meters / 1000;
  return seconds / 60 / km;
}

function getPaceForType(type, racePace) {
  if (!racePace) return null;

  const offsets = {
    easy: [45, 75],
    long: [30, 60],
    tempo: [10, 20],
    interval: [-20, -10],
  };

  const [min, max] = offsets[type];
  return {
    min: formatPace(racePace + min / 60),
    max: formatPace(racePace + max / 60),
  };
}

function getSessionTypes(distanceKey, sessionsPerWeek) {
  const base = ['easy', 'tempo', 'interval', 'long'];
  return base.slice(0, sessionsPerWeek);
}

function getPhase(week, totalWeeks) {
  if (week >= totalWeeks - 1) return 'taper';
  if (week % 4 === 0) return 'recovery';
  return 'build';
}

function getVolumeFactor(week, totalWeeks, phase) {
  if (phase === 'recovery') return 0.75;
  if (phase === 'taper') return week === totalWeeks ? 0.5 : 0.7;
  return 1;
}

function progressionFactor(week, totalWeeks) {
  return 0.7 + (week / totalWeeks) * 0.3;
}

function getBaseWeeklyVolume(distanceKey) {
  return {
    '5k': 25,
    '10k': 35,
    'half': 45,
    'marathon': 55,
  }[distanceKey];
}

function parseTimeToSeconds(time) {
  const parts = time.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function formatPace(minPerKm) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function sumKm(sessions) {
  return round(sessions.reduce((sum, s) => sum + s.distance_km, 0));
}

function round(n) {
  return Math.round(n * 10) / 10;
}

module.exports = {
  generateTrainingPlan,
};