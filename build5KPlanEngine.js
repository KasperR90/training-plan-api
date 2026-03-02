// services/build5KPlanEngine.js
// RUNIQ 5K Engine — Stable Volume Version

function toSeconds(timeStr) {
  const [min, sec] = timeStr.split(':').map(Number);
  return min * 60 + sec;
}

function toPace(secPerKm) {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function buildZones(goalPaceSec) {
  return {
    easy: toPace(goalPaceSec * 1.22),
    threshold: toPace(goalPaceSec * 1.06),
    vo2: toPace(goalPaceSec * 0.95),
    race: toPace(goalPaceSec)
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
  const maxGap = weeks * 0.0065;

  const goalPace = goalSec / 5;
  const zones = buildZones(goalPace);

  let weeklyVolume = currentVolume;
  const planWeeks = [];

  for (let w = 1; w <= weeks; w++) {

    if (w % 4 === 0) {
      weeklyVolume *= 0.9;
    } else {
      weeklyVolume *= 1.05;
    }

    weeklyVolume = Math.round(weeklyVolume);

    const focus =
      w <= weeks * 0.4
        ? "Aerobic Base Development"
        : w <= weeks * 0.75
        ? "Threshold & VO2 Build"
        : "Sharpening & Race Specific";

    const longRun =
      w <= weeks * 0.4
        ? Math.round(weeklyVolume * 0.30)
        : w <= weeks * 0.75
        ? Math.round(weeklyVolume * 0.28)
        : Math.round(weeklyVolume * 0.25);

    const thresholdDesc =
      w <= 3
        ? `3 x 8 min @ ${zones.threshold}`
        : w <= 6
        ? `2 x 12 min @ ${zones.threshold}`
        : w <= 9
        ? `20 min continuous @ ${zones.threshold}`
        : `3 x 6 min @ ${zones.threshold}`;

    const vo2Desc =
      w <= 4
        ? `5 x 600m @ ${zones.vo2}`
        : w <= 8
        ? `6 x 800m @ ${zones.vo2}`
        : `4 x 1000m @ ${zones.vo2}`;

    const qualityKm = 8;

    const sessions = [];

    sessions.push({
      type: "Threshold",
      description: thresholdDesc,
      totalKm: qualityKm
    });

    sessions.push({
      type: "VO2",
      description: vo2Desc,
      totalKm: qualityKm
    });

    sessions.push({
      type: "Long Run",
      description: `${longRun} km easy @ ${zones.easy}`,
      totalKm: longRun
    });

    const remaining = weeklyVolume - (qualityKm * 2) - longRun;
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
      warning:
        gap > maxGap
          ? `Your goal requires ${(gap * 100).toFixed(
              1
            )}% improvement. Based on ${weeks} weeks, ~${(
              maxGap * 100
            ).toFixed(1)}% is realistic.`
          : null
    },
    zones,
    weeks: planWeeks
  };
}

module.exports = build5KPlanEngine;