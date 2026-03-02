// services/build5KPlanEngine.js
// RUNIQ 5K Performance Engine — V2 Professional Edition

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

  const getFocus = (week) => {
    if (week <= weeks * 0.4) return "Aerobic Base Development";
    if (week <= weeks * 0.75) return "Threshold & VO2 Build";
    return "Sharpening & Race Specific";
  };

  const getLongRun = (weekVolume, week) => {
    if (week <= weeks * 0.4) return Math.round(weekVolume * 0.30);
    if (week <= weeks * 0.75) return Math.round(weekVolume * 0.28);
    return Math.round(weekVolume * 0.25);
  };

  const buildThreshold = (week) => {
    if (week <= 3) return "3 x 8 min @ Threshold (90s jog)";
    if (week <= 6) return "2 x 12 min @ Threshold (2 min jog)";
    if (week <= 9) return "20 min continuous Threshold";
    return "3 x 6 min @ Threshold (90s jog)";
  };

  const buildVO2 = (week) => {
    if (week <= 4) return "5 x 600m @ VO2 (90s jog)";
    if (week <= 8) return "6 x 800m @ VO2 (2 min jog)";
    return "4 x 1000m @ VO2 (2 min jog)";
  };

  for (let w = 1; w <= weeks; w++) {

    // Volume progression (5%) + deload every 4th week
    if (w % 4 === 0) {
      weeklyVolume *= 0.9;
    } else {
      weeklyVolume *= 1.05;
    }

    weeklyVolume = Math.round(weeklyVolume);

    const longRunKm = getLongRun(weeklyVolume, w);

    const thresholdDesc = buildThreshold(w);
    const vo2Desc = buildVO2(w);

    const qualityKm = 8; // standardized for now
    const remaining = weeklyVolume - longRunKm - (qualityKm * 2);

    const easyKm = Math.max(
      5,
      Math.round(remaining / Math.max(1, frequency - 3))
    );

    const sessions = [];

    // Threshold session
    sessions.push({
      type: "Threshold",
      description: thresholdDesc,
      totalKm: qualityKm
    });

    // VO2 session
    sessions.push({
      type: "VO2",
      description: vo2Desc,
      totalKm: qualityKm
    });

    // Long run
    sessions.push({
      type: "Long Run",
      description: `${longRunKm} km easy (${zones.easy})`,
      totalKm: longRunKm
    });

    // Easy sessions
    for (let i = 0; i < frequency - 3; i++) {
      sessions.push({
        type: "Easy",
        description: `${easyKm} km aerobic (${zones.easy})`,
        totalKm: easyKm
      });
    }

    planWeeks.push({
      week: w,
      focus: getFocus(w),
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
          ? `Your goal requires a ${(gap * 100).toFixed(
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