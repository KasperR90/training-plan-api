function toSeconds(timeStr) {
  const [min, sec] = timeStr.split(':').map(Number);
  return min * 60 + sec;
}

function formatPace(sec) {
  const min = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${min}:${s.toString().padStart(2, '0')}`;
}

function buildZones(goalPaceSec) {

  const easyMin = goalPaceSec * 1.15;
  const easyMax = goalPaceSec * 1.30;

  const thresholdMin = goalPaceSec * 1.02;
  const thresholdMax = goalPaceSec * 1.05;

  const vo2Min = goalPaceSec * 0.95;
  const vo2Max = goalPaceSec * 0.98;

  return {
    easy: `${formatPace(easyMin)} - ${formatPace(easyMax)}/km`,
    threshold: `${formatPace(thresholdMin)} - ${formatPace(thresholdMax)}/km`,
    vo2: `${formatPace(vo2Min)} - ${formatPace(vo2Max)}/km`,
    race: `${formatPace(goalPaceSec)}/km`
  };
}

/* WORKOUT LIBRARIES */

const thresholdLibrary = [
  "3 x 8 min @ THRESHOLD",
  "4 x 6 min @ THRESHOLD",
  "20 min continuous @ THRESHOLD",
  "2 x 12 min @ THRESHOLD",
  "3 x 10 min @ THRESHOLD"
];

const vo2Library = [
  "8 x 400m @ VO2",
  "6 x 800m @ VO2",
  "5 x 1000m @ VO2",
  "4 x 1200m @ VO2",
  "5 x 600m @ VO2"
];

const raceLibrary = [
  "3 x 1600m @ RACE PACE",
  "5 x 1km @ RACE PACE",
  "6 x 800m slightly faster than race pace",
  "4 x 1200m @ RACE PACE"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addWarmupCooldown(desc) {
  return `2 km warm-up + drills\n${desc}\n2 km cooldown`;
}

/* SMART LONG RUN BUILDER */

function buildLongRun(phase, distance, zones) {

  if (phase === "Aerobic Base Development") {
    return {
      description: `${distance} km easy aerobic @ ${zones.easy}`,
      totalKm: distance
    };
  }

  if (phase === "Threshold & VO2 Build") {

    if (Math.random() > 0.5) {

      const steady = Math.round(distance * 0.3);
      const easy = distance - steady;

      return {
        description:
          `${easy} km easy @ ${zones.easy}\n` +
          `${steady} km steady finish`,
        totalKm: distance
      };

    } else {

      return {
        description: `${distance} km steady aerobic @ ${zones.easy}`,
        totalKm: distance
      };
    }
  }

  const fastFinish = Math.round(distance * 0.25);
  const easy = distance - fastFinish;

  return {
    description:
      `${easy} km easy @ ${zones.easy}\n` +
      `${fastFinish} km fast finish @ ${zones.threshold}`,
    totalKm: distance
  };
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

  let warning = null;

  if (gap > 0.10) {
    warning = `Your goal requires a ${(gap * 100).toFixed(1)}% improvement. Improvements above ~10% within ${weeks} weeks are uncommon.`;
  }

  const goalPace = goalSec / 5;
  const zones = buildZones(goalPace);

  let weeklyVolume = currentVolume;

  const planWeeks = [];

  for (let w = 1; w <= weeks; w++) {

    /* TAPER */

    if (w === weeks) {
      weeklyVolume *= 0.6;
    }
    else if (w === weeks - 1) {
      weeklyVolume *= 0.7;
    }
    else if (w % 4 === 0) {
      weeklyVolume *= 0.9;
    }
    else {
      weeklyVolume *= 1.05;
    }

    weeklyVolume = Math.round(weeklyVolume);

    /* PHASE */

    let focus;

    if (w <= weeks * 0.4) {
      focus = "Aerobic Base Development";
    }
    else if (w <= weeks * 0.75) {
      focus = "Threshold & VO2 Build";
    }
    else {
      focus = "Race Specific Sharpening";
    }

    const longRunDistance =
      w <= weeks * 0.4
        ? Math.round(weeklyVolume * 0.30)
        : w <= weeks * 0.75
        ? Math.round(weeklyVolume * 0.28)
        : Math.round(weeklyVolume * 0.25);

    const sessions = [];

    /* RACE WEEK */

    if (w === weeks) {

      sessions.push({
        type: "Race Sharpening",
        description:
          `2 km warm-up\n` +
          `4 x 400m @ ${zones.race}\n` +
          `full recovery\n` +
          `1.5 km cooldown`,
        totalKm: 6
      });

      sessions.push({
        type: "5K Race",
        description: `Race day — target pace ${zones.race}`,
        totalKm: 5
      });

      planWeeks.push({
        week: w,
        focus: "Race Week",
        volume: weeklyVolume,
        sessions
      });

      continue;
    }

    /* WORKOUT SELECTION */

    let thresholdWorkout;
    let vo2Workout;

    if (focus === "Aerobic Base Development") {

      thresholdWorkout = pick(thresholdLibrary.slice(0,3));
      vo2Workout = pick(["6 x 400m @ VO2", "5 x 600m @ VO2"]);

    }
    else if (focus === "Threshold & VO2 Build") {

      thresholdWorkout = pick(thresholdLibrary);
      vo2Workout = pick(vo2Library);

    }
    else {

      thresholdWorkout = pick([
        "15 min tempo @ THRESHOLD",
        "2 x 10 min @ THRESHOLD"
      ]);

      vo2Workout = pick(raceLibrary);
    }

    /* THRESHOLD */

    sessions.push({
      type: "Threshold",
      description: addWarmupCooldown(
        thresholdWorkout.replace("THRESHOLD", zones.threshold)
      ),
      totalKm: 9
    });

    /* VO2 */

    sessions.push({
      type: "VO2",
      description: addWarmupCooldown(
        vo2Workout
          .replace("VO2", zones.vo2)
          .replace("RACE PACE", zones.race)
      ),
      totalKm: 8
    });

    /* LONG RUN */

    const longRun = buildLongRun(
      focus,
      longRunDistance,
      zones
    );

    sessions.push({
      type: "Long Run",
      description: longRun.description,
      totalKm: longRun.totalKm
    });

    /* EASY RUNS */

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
        type: "Easy",
        description: `${km} km easy @ ${zones.easy}`,
        totalKm: km
      });
    }

    planWeeks.push({
      week: w,
      focus,
      volume: weeklyVolume,
      sessions
    });
  }

  return {
    meta: {
      distance: "5K",
      currentTime,
      goalTime,
      weeks,
      frequency,
      gapPercent: +(gap * 100).toFixed(1),
      warning
    },
    zones,
    weeks: planWeeks
  };
}

module.exports = build5KPlanEngine;