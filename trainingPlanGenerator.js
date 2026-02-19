// trainingPlanGenerator.js

function generateTrainingPlan({
  distance,        // '5k' | '10k' | 'half' | 'marathon'
  weeks,
  sessionsPerWeek,
  goalTime,
}) {
  const DISTANCE_LABELS = {
    '5k': '5K',
    '10k': '10K',
    'half': 'Half Marathon',
    'marathon': 'Marathon',
  };

  const BASE_WEEKLY_KM = {
    '5k': 25,
    '10k': 35,
    'half': 45,
    'marathon': 55,
  };

  const plan = {
    meta: {
      distanceKey: distance,
      distanceLabel: DISTANCE_LABELS[distance],
      weeks,
      sessionsPerWeek,
      goalTime,
    },
    weeks: [],
  };

  for (let week = 1; week <= weeks; week++) {
    const isRecoveryWeek = week % 4 === 0;
    const isTaperWeek = week >= weeks - 1;
    const isRaceWeek = week === weeks;

    let phase = 'build';
    if (isTaperWeek) phase = 'taper';
    else if (isRecoveryWeek) phase = 'recovery';

    let volumeFactor = 1;
    if (phase === 'recovery') volumeFactor = 0.75;
    if (phase === 'taper') volumeFactor = isRaceWeek ? 0.4 : 0.6;

    const baseKm = BASE_WEEKLY_KM[distance];
    const progression = 1 + week * 0.03;
    const totalKm = Math.round(baseKm * progression * volumeFactor);

    const sessions = generateSessions({
      sessionsPerWeek,
      totalKm,
      phase,
      isRaceWeek,
      distance,
    });

    plan.weeks.push({
      week,
      phase,
      total_km: totalKm,
      isRaceWeek,
      sessions,
    });
  }

  return plan;
}

/* =========================
   Sessions
========================= */
function generateSessions({
  sessionsPerWeek,
  totalKm,
  phase,
  isRaceWeek,
  distance,
}) {
  const sessions = [];
  const longRunKm = Math.round(totalKm * 0.35);
  const remainingKm = totalKm - longRunKm;
  const baseKm = Math.round(remainingKm / (sessionsPerWeek - 1));

  for (let i = 1; i <= sessionsPerWeek; i++) {
    // Race day
    if (isRaceWeek && i === sessionsPerWeek) {
      sessions.push({
        type: 'race',
        distance_km: raceDistanceKm(distance),
        description: 'Race day. Execute your plan and trust your training.',
      });
      continue;
    }

    if (i === sessionsPerWeek) {
      sessions.push({
        type: 'long',
        distance_km: longRunKm,
        description: longRunDescription(phase),
      });
    } else if (phase === 'build' && i === 2) {
      sessions.push({
        type: 'tempo',
        distance_km: baseKm,
        description: 'Controlled sustained effort.',
      });
    } else if (phase === 'build' && i === 3) {
      sessions.push({
        type: 'interval',
        distance_km: baseKm,
        description: 'Shorter repetitions with full recovery.',
      });
    } else {
      sessions.push({
        type: 'easy',
        distance_km: baseKm,
        description: 'Relaxed, conversational effort.',
      });
    }
  }

  return sessions;
}

/* =========================
   Helpers
========================= */
function raceDistanceKm(distance) {
  return {
    '5k': 5,
    '10k': 10,
    'half': 21.1,
    'marathon': 42.2,
  }[distance];
}

function longRunDescription(phase) {
  if (phase === 'taper') return 'Reduced long run to stay fresh.';
  if (phase === 'recovery') return 'Comfortable long run with reduced volume.';
  return 'Steady aerobic long run.';
}

module.exports = generateTrainingPlan;
