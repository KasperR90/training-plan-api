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
   THRESHOLD WORKOUT FUNCTION
========================= */

function getThresholdWorkout(phase, week, totalWeeks) {

  // early base → altijd rustig
  if (phase === "base" && week <= totalWeeks * 0.25) {
    return "3 x 6 min @ THRESHOLD (90s recovery)";
  }

  let pool;

  if (phase === "base") pool = thresholdBase;
  else if (phase === "build") pool = thresholdBuild;
  else pool = thresholdPeak;

  // progressie binnen fase (simpel)
  const progress = week / totalWeeks;

  if (progress > 0.75) {
    return pool[2]; // zwaarste
  }

  if (progress > 0.5) {
    return pool[1];
  }

  return pool[0];
}

/* =========================
   VO2 WORKOUT FUNCTION
========================= */
function getVO2Workout(week, totalWeeks, gap) {

  const progress = week / totalWeeks;

  if (gap > 0.08 && progress < 0.7) {
    return vo2Short[1];
  }

  if (progress < 0.6) {
    return vo2Short[0];
  }

  if (progress < 0.85) {
    return vo2Medium[0];
  }

  return vo2Long[0];
}


/* =========================
   VOLUME INTENT
========================= */

function getVolumeIntent(gap, currentVolume) {
  if (gap < 0.03) return "low";
  if (gap < 0.07) return "moderate";
  return "high";
}
/* =========================
   VOLUME OPBOUW SCHEMA
========================= */

function getWeeklyMultiplier(week, intent, currentVolume) {

  const cycle = week % 4;

  let build;

  if (intent === "low") build = 1.03;
  if (intent === "moderate") build = 1.06;
  if (intent === "high") build = 1.08;

  // niveau correctie
  if (currentVolume < 30) build += 0.02;
  if (currentVolume > 60) build -= 0.02;

  if (cycle === 1) return 1.0;
  if (cycle === 2) return build;
  if (cycle === 3) return build + 0.03;

  // deload
  if (intent === "high") return 0.88;
  if (intent === "moderate") return 0.85;
  return 0.82;
}

/* =========================
   LONG RUN RATIO
========================= */

function getLongRunRatio(frequency) {
  if (frequency === 3) return 0.35;
  if (frequency === 4) return 0.30;
  return 0.25;
}


/* =========================
   VOLGORDE TRAININGEN
========================= */

function mapToRole(type) {
  const t = type.toLowerCase();

  if (t.includes("long")) return "long";
  if (t.includes("easy")) return "easy";
  if (t.includes("vo2") || t.includes("threshold") || t.includes("tempo")) {
    return "quality";
  }

  return "easy";
}

function orderSessions(sessions) {
  const easy = [];
  const quality = [];
  const long = [];

  sessions.forEach(s => {
    const role = mapToRole(s.type);

    if (role === "easy") easy.push(s);
    if (role === "quality") quality.push(s);
    if (role === "long") long.push(s);
  });

  const result = [];

  // 1. Start met easy (indien mogelijk)
  if (easy.length) result.push(easy.shift());

  // 2. Eerste quality
  if (quality.length) result.push(quality.shift());

  // 3. Recovery day verplicht na quality
  if (easy.length) result.push(easy.shift());

  // 4. Tweede quality (alleen als er genoeg easy is)
  if (quality.length && easy.length) {
    result.push(quality.shift());
    result.push(easy.shift()); // herstel erna
  }

  // 5. Long run altijd op het einde
  if (long.length) result.push(long.shift());

  // fallback
  return result.concat(easy, quality, long);
}


/* =========================
   ZONES (IMPROVED)
========================= */

function buildZones(goalPaceSec) {
  return {
    easy: `${formatPace(goalPaceSec * 1.15)} - ${formatPace(goalPaceSec * 1.30)}/km`,
    moderate: `${formatPace(goalPaceSec * 1.10)} - ${formatPace(goalPaceSec * 1.15)}/km`,
    steady: `${formatPace(goalPaceSec * 1.05)} - ${formatPace(goalPaceSec * 1.10)}/km`,
    threshold: `${formatPace(goalPaceSec * 1.02)} - ${formatPace(goalPaceSec * 1.05)}/km`,
    vo2: `${formatPace(goalPaceSec * 0.95)} - ${formatPace(goalPaceSec * 0.98)}/km`,
    race: `${formatPace(goalPaceSec)}/km`
  };
}

/* =========================
   WORKOUT LIBRARIES 
========================= */

const vo2Short = [
  "10 x 400m @ VO2 (60s recovery)",
  "8 x 400m @ VO2 (60s recovery)"
];

const vo2Medium = [
  "6 x 800m @ VO2 (90s recovery)",
  "5 x 1000m @ VO2 (2 min recovery)"
];

const vo2Long = [
  "4 x 1200m @ VO2 (2 min recovery)",
  "3 x 1600m @ VO2 (2 min recovery)"
];

const thresholdBase = [
  "3 x 6 min @ THRESHOLD (90s recovery)",   // licht
  "2 x 8 min @ THRESHOLD (2 min recovery)", // iets langer
  "3 x 8 min @ THRESHOLD (2 min recovery)"  // stevig
];

const thresholdBuild = [
  "3 x 10 min @ THRESHOLD (2 min recovery)",
  "2 x 12 min @ THRESHOLD (3 min recovery)",
  "20 min continuous @ THRESHOLD"
];

const thresholdPeak = [
  "20 min continuous @ THRESHOLD",
  "25 min continuous @ THRESHOLD",
  "2 x 15 min @ THRESHOLD (3 min recovery)"
];




function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addWarmupCooldown(desc) {
  return `2 km warm-up + drills\n${desc}\n2 km cooldown`;
}

/* =========================
   LONG RUN 
========================= */

function buildLongRun(phase, distance, zones, week) {

  // simpele rotatie
  const variation = week % 3;

  // ------------------
  // BASE
  // ------------------
  if (phase === "base") {

    if (variation === 0) {
      return {
        label: "Aerobic long run",
        description: `${distance} km easy @ ${zones.easy}`,
        totalKm: distance
      };
    }

    if (variation === 1) {
      return {
        label: "Progressive long run",
        description:
          `${Math.round(distance * 0.6)} km easy @ ${zones.easy}\n` +
          `${Math.round(distance * 0.4)} km steady @ ${zones.steady}`,
        totalKm: distance
      };
    }

    return {
      label: "Steady long run",
      description:
        `${Math.round(distance * 0.7)} km easy @ ${zones.easy}\n` +
        `${Math.round(distance * 0.3)} km moderate @ ${zones.moderate}`,
      totalKm: distance
    };
  }

  // ------------------
  // BUILD
  // ------------------
  if (phase === "build") {

    if (variation === 0) {
      return {
        label: "Progressive long run",
        description:
          `${Math.round(distance * 0.5)} km easy @ ${zones.easy}\n` +
          `${Math.round(distance * 0.3)} km steady @ ${zones.steady}\n` +
          `${Math.round(distance * 0.2)} km threshold @ ${zones.threshold}`,
        totalKm: distance
      };
    }

    if (variation === 1) {
      return {
        label: "Fast finish long run",
        description:
          `${Math.round(distance * 0.7)} km easy @ ${zones.easy}\n` +
          `${Math.round(distance * 0.3)} km threshold @ ${zones.threshold}`,
        totalKm: distance
      };
    }

    return {
      label: "Cutdown long run",
      description:
        `${Math.round(distance * 0.4)} km easy @ ${zones.easy}\n` +
        `${Math.round(distance * 0.3)} km steady @ ${zones.steady}\n` +
        `${Math.round(distance * 0.3)} km threshold @ ${zones.threshold}`,
      totalKm: distance
    };
  }

  // ------------------
  // PEAK
  // ------------------
  if (phase === "peak") {

    if (variation === 0) {
      return {
        label: "Race simulation long run",
        description:
          `${Math.round(distance * 0.6)} km easy @ ${zones.easy}\n` +
          `${Math.round(distance * 0.4)} km race pace @ ${zones.race}`,
        totalKm: distance
      };
    }

    if (variation === 1) {
      return {
        label: "Fast finish long run",
        description:
          `${Math.round(distance * 0.7)} km easy @ ${zones.easy}\n` +
          `${Math.round(distance * 0.3)} km threshold @ ${zones.threshold}`,
        totalKm: distance
      };
    }

    return {
      label: "Controlled long run",
      description: `${distance} km relaxed easy @ ${zones.easy}`,
      totalKm: distance
    };
  }
}



/* =========================
   WEEK STRUCTURE
========================= */

function getWeekStructure(phase, frequency) {
  if (frequency === 3) {
    if (phase === "peak") {
      return ["easy", "vo2", "long"];
    }
    return ["easy", "threshold", "long"];
  }

  if (frequency === 4) {
    if (phase === "peak") {
      return ["easy", "vo2", "easy", "long"];
    }
    return ["easy", "threshold", "easy", "long"];
  }

  if (frequency === 5) {
    if (phase === "peak") {
      return ["easy", "vo2", "easy", "easy", "long"];
    }
    return ["easy", "threshold", "easy", "easy", "long"];
  }
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
  const volumeIntent = getVolumeIntent(gap, currentVolume);

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

  const currentPace = currentSec / 5;
  const goalPace = goalSec / 5;

  const blendFactor = Math.min(1, gap * 2.5);
  const effectivePace = currentPace - (currentPace - goalPace) * blendFactor;

  const zones = buildZones(effectivePace);

  let weeklyVolume = currentVolume;
  const planWeeks = [];

  const peakWeek = weeks - 3;

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

   const multiplier = getWeeklyMultiplier(w, volumeIntent, currentVolume);

	let taper;

	if (currentVolume < 30) taper = [0.85, 0.7, 0.5];
	else if (currentVolume < 50) taper = [0.9, 0.8, 0.6];
	else taper = [0.92, 0.85, 0.7];

	if (w === weeks) weeklyVolume *= taper[2];
	else if (w === weeks - 1) weeklyVolume *= taper[1];
	else if (w === weeks - 2) weeklyVolume *= taper[0];
	else weeklyVolume *= multiplier;

        // kleine peak boost voor gevorderden met klein doel
	if (volumeIntent === "low" && w === peakWeek) {
 	weeklyVolume *= 1.05;
	}

	// soft cap op totale groei
	const maxVolume = currentVolume * 1.6;

	if (weeklyVolume > maxVolume) {
 	 weeklyVolume = maxVolume;
	}

	weeklyVolume = Math.round(weeklyVolume);
	const prev = planWeeks[w - 2]?.volume;

	const volumeChange = prev
	  ? Math.round(((weeklyVolume - prev) / prev) * 100)
 	 : 0;

    /* =========================
       WORKOUT SELECTION
    ========================= */
  
const sessions = [];

const isVO2Week = (w % 4 === 0) && phase !== "peak";    
const structure = getWeekStructure(phase, frequency);

   if (isVO2Week) {
  const index = structure.indexOf("threshold");
  if (index !== -1) {
    structure[index] = "vo2";
  }
}

  let longRunDistance = Math.round(
  weeklyVolume * getLongRunRatio(frequency)
);

// taper → long run korter
if (w >= weeks - 1) {
  longRunDistance = Math.round(longRunDistance * 0.7);
}


    const longRun = buildLongRun(phase, longRunDistance, zones, w);
    
   let remaining = weeklyVolume - longRun.totalKm;
   let easyCount = structure.filter(s => s === "easy").length;

   // reserve km voor quality (globaal)
   let qualityKm = Math.min(
  Math.round(weeklyVolume * 0.25),
  12
); 
   remaining -= qualityKm;

   // verdeling easy
   let easyRuns = [];

let easyIndex = 0;

if (easyCount === 1) {
  easyRuns = [remaining];
}

if (easyCount === 2) {
  easyRuns = [
    Math.round(remaining * 0.45),
    Math.round(remaining * 0.55)
  ];
}

if (easyCount === 3) {
  easyRuns = [
    Math.round(remaining * 0.3),
    Math.round(remaining * 0.35),
    Math.round(remaining * 0.35)
  ];

}


structure.forEach(type => {

  if (type === "threshold") {

  let workout;

if (w >= weeks - 1) {
  workout = "2 x 6 min @ THRESHOLD (2 min recovery)";
} else {
  workout = getThresholdWorkout(phase, w, weeks);
}

  sessions.push({
    type: "Threshold",
    description: addWarmupCooldown(
      workout.replace("THRESHOLD", zones.threshold)
    ),
    totalKm: 9
  });
}

if (type === "vo2") {

  let workout;

if (w >= weeks - 1) {
  workout = "4 x 400m @ VO2 (full recovery)";
} else {
  workout = getVO2Workout(w, weeks, gap);
}

  sessions.push({
    type: "VO2 Max",
    description: addWarmupCooldown(
      workout.replace("VO2", zones.vo2)
    ),
    totalKm: 8
  });
}

  if (type === "long") {
    sessions.push({
      type: longRun.label,
      description: longRun.description,
      totalKm: longRun.totalKm
    });
  }

  if (type === "easy") {

  const isStridesRun = (w % 2 === 0) && easyIndex === 0;

const distance = easyRuns[easyIndex] ?? 0;
easyIndex++;

  let description = `${distance} km @ ${zones.easy}`;

  if (isStridesRun) {
    description += `\n+ 4 x 20s strides (full recovery)`;
  }

  sessions.push({
    type: isStridesRun ? "Easy Run + Strides" : "Easy Run",
    description,
    totalKm: distance
  });
}
});


 
    /* =========================
       RACE WEEK
    ========================= */

if (w === weeks) {
  sessions.length = 0;

  const raceKm = 5;
  const sharpeningKm = 6;

  // ===== aantal sessies hard bepalen =====
  const totalSessions = frequency;
  const easyRunsCount = Math.max(0, totalSessions - 2);

  // ===== volume verdeling =====
  let remaining = Math.max(0, weeklyVolume - raceKm - sharpeningKm);
  const easyKm = easyRunsCount > 0
    ? Math.max(3, Math.round(remaining / easyRunsCount))
    : 0;

  // ===== key sessions =====
  const sharpening = {
    type: "Sharpening",
    description:
      `2 km warm-up\n4 x 400m @ ${zones.race} (full recovery)\n1.5 km cooldown`,
    totalKm: sharpeningKm
  };

  const race = {
    type: "Race",
    description: `5K Race @ ${zones.race}`,
    totalKm: raceKm
  };

  // ===== easy runs =====
  const easyRuns = [];

  for (let i = 0; i < easyRunsCount; i++) {
    easyRuns.push({
      type: i === easyRunsCount - 1
        ? "Easy Run + Strides"
        : "Easy Run",
      description:
        i === easyRunsCount - 1
          ? `${easyKm} km @ ${zones.easy}\n+ 4 x 20s strides`
          : `${easyKm} km @ ${zones.easy}`,
      totalKm: easyKm
    });
  }

  // ===== volgorde (vast patroon) =====

  if (totalSessions === 2) {
    sessions.push(sharpening, race);

  } else if (totalSessions === 3) {
    sessions.push(sharpening, easyRuns[0], race);

  } else if (totalSessions === 4) {
    sessions.push(easyRuns[0], sharpening, easyRuns[1], race);

  } else if (totalSessions === 5) {
    sessions.push(easyRuns[0], sharpening, easyRuns[1], easyRuns[2], race);
  }
}

    planWeeks.push({
      week: w,
      phase,
      volume: weeklyVolume,
      volumeChange,
      sessions: w === weeks ? sessions : orderSessions(sessions)
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
      volumeIntent,
      startVolume: currentVolume,
      warning,
      gapPercent: +(gap * 100).toFixed(1)
    },
    zones,
    weeks: planWeeks
  };
}

module.exports = build5KPlanEngine;