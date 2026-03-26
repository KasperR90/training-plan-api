function toSeconds(timeStr) {
  const [min, sec] = timeStr.split(':').map(Number);
  return min * 60 + sec;
}

function formatPace(sec) {
  const min = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${min}:${s.toString().padStart(2, '0')}`;
}

/* =========================
   ZONES (IMPROVED)
========================= */

function buildZones(goalPaceSec) {
  return {
    easy: `${formatPace(goalPaceSec * 1.15)} - ${formatPace(goalPaceSec * 1.30)}/km`,
    threshold: `${formatPace(goalPaceSec * 1.02)} - ${formatPace(goalPaceSec * 1.05)}/km`,
    vo2: `${formatPace(goalPaceSec * 0.95)} - ${formatPace(goalPaceSec * 0.98)}/km`,
    race: `${formatPace(goalPaceSec)}/km`
  };
}

/* =========================
   WORKOUT LIBRARIES (UPGRADED)
========================= */

const thresholdLibrary = [
  "3 x 8 min @ THRESHOLD (2 min jog recovery)",
  "4 x 6 min @ THRESHOLD (90s recovery)",
  "20 min continuous @ THRESHOLD",
  "2 x 12 min @ THRESHOLD (3 min recovery)",
  "3 x 10 min @ THRESHOLD (2 min recovery)"
];

const vo2Library = [
  "8 x 400m @ VO2 (60s recovery)",
  "6 x 800m @ VO2 (90s recovery)",
  "5 x 1000m @ VO2 (2 min recovery)",
  "4 x 1200m @ VO2 (2 min recovery)",
  "5 x 600m @ VO2 (75s recovery)"
];

const raceLibrary = [
  "3 x 1600m @ RACE PACE (2 min recovery)",
  "5 x 1km @ RACE PACE (90s recovery)",
  "6 x 800m slightly faster than race pace (90s recovery)",
  "4 x 1200m @ RACE PACE (2 min recovery)"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addWarmupCooldown(desc) {
  return `2 km warm-up + drills\n${desc}\n2 km cooldown`;
}

/* =========================
   LONG RUN (SMARTER)
========================= */

function buildLongRun(phase, distance, zones) {

  if (phase === "base") {
    return {
      label: "Aerobic long run",
      description: `${distance} km easy @ ${zones.easy}`,
      totalKm: distance,
      purpose: "Builds endurance and aerobic capacity"
    };
  }

  if (phase === "build") {
    return {
      label: "Steady long run",
      description:
        `${Math.round(distance * 0.7)} km easy @ ${zones.easy}\n` +
        `${Math.round(distance * 0.3)} km steady finish`,
      totalKm: distance,
      purpose: "Improves fatigue resistance"
    };
  }

  return {
    label: "Fast finish long run",
    description:
      `${Math.round(distance * 0.75)} km easy @ ${zones.easy}\n` +
      `${Math.round(distance * 0.25)} km @ ${zones.threshold}`,
    totalKm: distance,
    purpose: "Prepares you for finishing strong"
  };
}

/* =========================
   ENGINE
========================= */

function build5KPlanEngine({
  name,  
  currentTime,
  goalTime,
  weeks,
  frequency,
  currentVolume
}) {

  const currentSec = toSeconds(currentTime);
  const goalSec = toSeconds(goalTime);

  const gap = (currentSec - goalSec) / currentSec;

  /* =========================
     CONFIDENCE
  ========================= */

  let confidence;
  if (gap < 0.03) {
    confidence = "Highly achievable based on your current level";
  } else if (gap < 0.07) {
    confidence = "Challenging but realistic with consistent training";
  } else {
    confidence = "Ambitious goal — consistency will be key";
  }

  let warning = null;
  if (gap > 0.10) {
    warning = `Your goal requires a ${(gap * 100).toFixed(1)}% improvement.`;
  }

  const goalPace = goalSec / 5;
  const zones = buildZones(goalPace);

  let weeklyVolume = currentVolume;
  const planWeeks = [];

  for (let w = 1; w <= weeks; w++) {

    /* =========================
       PERIODISATION
    ========================= */

    let phase;

    if (w <= weeks * 0.4) phase = "base";
    else if (w <= weeks * 0.75) phase = "build";
    else phase = "peak";

    /* =========================
       VOLUME PROGRESSION
    ========================= */

    if (w === weeks) weeklyVolume *= 0.6;
    else if (w === weeks - 1) weeklyVolume *= 0.75;
    else if (w % 4 === 0) weeklyVolume *= 0.9;
    else weeklyVolume *= 1.05;

    weeklyVolume = Math.round(weeklyVolume);

    const prev = planWeeks[w - 2]?.volume;
    const volumeChange = prev
      ? Math.round(((weeklyVolume - prev) / prev) * 100)
      : 0;

    const sessions = [];

    /* =========================
       WORKOUT SELECTION
    ========================= */

    let thresholdWorkout = pick(thresholdLibrary);
    let vo2Workout = pick(vo2Library);

    if (gap > 0.08) {
      vo2Workout = pick(vo2Library.slice(0, 2)); // easier
    }

    /* =========================
       THRESHOLD
    ========================= */

    sessions.push({
      type: "Threshold",
      description: addWarmupCooldown(
        thresholdWorkout.replace("THRESHOLD", zones.threshold)
      ),
      purpose: "Improves your ability to sustain race pace",
      totalKm: 9
    });

    /* =========================
       VO2
    ========================= */

    sessions.push({
      type: "VO2 Max",
      description: addWarmupCooldown(
        vo2Workout.replace("VO2", zones.vo2)
      ),
      purpose: "Increases your aerobic power and speed",
      totalKm: 8
    });

    /* =========================
       LONG RUN
    ========================= */

    const longRunDistance = Math.round(weeklyVolume * 0.28);

    const longRun = buildLongRun(phase, longRunDistance, zones);

    sessions.push({
      type: longRun.label,
      description: longRun.description,
      purpose: longRun.purpose,
      totalKm: longRun.totalKm
    });

    /* =========================
       EASY RUNS
    ========================= */

    const remaining = weeklyVolume - longRun.totalKm - 17;
    const easyRuns = frequency - 3;

    let allocated = 0;

    for (let i = 0; i < easyRuns; i++) {

      let km =
        i === easyRuns - 1
          ? remaining - allocated
          : Math.round(remaining / easyRuns);

      allocated += km;

      sessions.push({
        type: "Easy Run",
        description: `${km} km easy @ ${zones.easy}`,
        purpose: "Supports recovery and builds aerobic base",
        totalKm: km
      });
    }

    /* =========================
       RACE WEEK
    ========================= */

    if (w === weeks) {
      sessions.length = 0;

      sessions.push({
        type: "Sharpening",
        description:
          `2 km warm-up\n4 x 400m @ ${zones.race} (full recovery)\n1.5 km cooldown`,
        purpose: "Prepares your legs for race pace",
        totalKm: 6
      });

      sessions.push({
        type: "Race",
        description: `5K Race @ ${zones.race}`,
        purpose: "Execute your goal performance",
        totalKm: 5
      });
    }

    planWeeks.push({
      week: w,
      phase,
      volume: weeklyVolume,
      volumeChange,
      sessions
    });
  }

  return {
    meta: {
      name: name || "Runner",
      currentTime,
      goalTime,
      weeks,
      frequency,
      confidence,
      warning,
      gapPercent: +(gap * 100).toFixed(1)
    },
    zones,
    weeks: planWeeks
  };
}

module.exports = build5KPlanEngine;