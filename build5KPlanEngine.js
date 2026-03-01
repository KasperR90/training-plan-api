// services/build5KPlanEngine.js

function toSeconds(timeStr) {
  const [min, sec] = timeStr.split(':').map(Number);
  return min * 60 + sec;
}

function toPaceString(secPerKm) {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function buildZones(goalPaceSec) {
  return {
    easy: {
      min: toPaceString(goalPaceSec * 1.15),
      max: toPaceString(goalPaceSec * 1.25)
    },
    threshold: {
      min: toPaceString(goalPaceSec * 1.04),
      max: toPaceString(goalPaceSec * 1.07)
    },
    vo2: {
      min: toPaceString(goalPaceSec * 0.93),
      max: toPaceString(goalPaceSec * 0.97)
    },
    race: toPaceString(goalPaceSec)
  };
}

function buildBlockDistribution(weeks, gap) {
  let basePct = 0.25;
  let thresholdPct = 0.25;
  let vo2Pct = 0.25;

  if (gap < 0.03) {
    basePct = 0.15;
    thresholdPct = 0.30;
    vo2Pct = 0.30;
  }

  if (gap > 0.07) {
    basePct = 0.30;
    thresholdPct = 0.25;
    vo2Pct = 0.25;
  }

  const base = Math.round(weeks * basePct);
  const threshold = Math.round(weeks * thresholdPct);
  const vo2 = Math.round(weeks * vo2Pct);
  const race = weeks - (base + threshold + vo2);

  return { base, threshold, vo2, race };
}

function resolvePhase(week, blocks) {
  if (week <= blocks.base) return 'BASE';
  if (week <= blocks.base + blocks.threshold) return 'THRESHOLD';
  if (week <= blocks.base + blocks.threshold + blocks.vo2) return 'VO2';
  return 'RACE';
}

function estimateVolume(week, startVolume, maxVolume, weeks) {
  const progressionRate = 0.06;
  let volume = startVolume * Math.pow(1 + progressionRate, week - 1);

  if (week % 4 === 0) volume *= 0.9; // deload

  return Math.min(Math.round(volume), maxVolume);
}

function buildSessions(phase, frequency, zones) {
  const sessions = [];

  const easy = (km) => ({
    type: 'easy',
    distance_km: km,
    description: `Easy aerobic run (${zones.easy.min} – ${zones.easy.max})`
  });

  const threshold = () => ({
    type: 'threshold',
    distance_km: 0,
    description: `Threshold intervals (${zones.threshold.min} – ${zones.threshold.max})`
  });

  const vo2 = () => ({
    type: 'vo2',
    distance_km: 0,
    description: `VO2 intervals (${zones.vo2.min} – ${zones.vo2.max})`
  });

  const race = () => ({
    type: 'race pace',
    distance_km: 0,
    description: `Race pace work (${zones.race})`
  });

  if (frequency === 3) {
    sessions.push(easy(6));

    if (phase === 'BASE') sessions.push(threshold());
    if (phase === 'THRESHOLD') sessions.push(threshold());
    if (phase === 'VO2') sessions.push(vo2());
    if (phase === 'RACE') sessions.push(race());

    sessions.push(easy(8));
  }

  if (frequency >= 4) {
    sessions.push(easy(6));

    if (phase === 'BASE') sessions.push(threshold());
    if (phase === 'THRESHOLD') sessions.push(threshold());
    if (phase === 'VO2') sessions.push(vo2());
    if (phase === 'RACE') sessions.push(race());

    sessions.push(easy(6));
    sessions.push(easy(10));
  }

  if (frequency === 5) {
    sessions.push(easy(5));
  }

  return sessions;
}

function build5KPlanEngine({
  currentTime,
  goalTime,
  weeks,
  frequency,
  currentVolume
}) {
  const currentSec = toSeconds(currentTime);
  const goalSec = toSeconds(goalTime);

  const gap = (currentSec - goalSec) / currentSec;

  const maxGap = weeks * 0.0065;

  const goalPace = goalSec / 5;

  const zones = buildZones(goalPace);

  const blockStructure = buildBlockDistribution(weeks, gap);

  const startVolume = Math.max(currentVolume * 0.9, 18);
  const maxVolume = currentVolume * 1.4;

  const planWeeks = [];

  for (let i = 1; i <= weeks; i++) {
    const phase = resolvePhase(i, blockStructure);
    const total_km = estimateVolume(i, startVolume, maxVolume, weeks);

    planWeeks.push({
      week: i,
      phase,
      total_km,
      sessions: buildSessions(phase, frequency, zones)
    });
  }

  return {
    meta: {
      distance: '5K',
      currentTime,
      goalTime,
      weeks,
      frequency,
      gapPercent: +(gap * 100).toFixed(1),
      warning:
        gap > maxGap
          ? `Your goal requires a ${(
              gap * 100
            ).toFixed(
              1
            )}% improvement. Based on ${weeks} weeks, ~${(
              maxGap * 100
            ).toFixed(1)}% is typically realistic.`
          : null
    },
    zones,
    weeks: planWeeks
  };
}

module.exports = build5KPlanEngine;