const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");

/**
 * =========================
 * TEST-INPUT (zoals straks uit WordPress)
 * =========================
 */

// A. Trainingsdoel
const goalDistance = "HM";          // "5K" | "10K" | "15K" | "HM"
const raceDate = "2026-04-12";      // YYYY-MM-DD

// B. Prestatie-invoer
const referenceDistance = "10K";    // "5K" | "10K" | "15K" | "HM"
const referenceTime = "45:30";      // mm:ss

// C. Trainingsstructuur
const sessionsPerWeek = 3;          // 3 / 4 / 5

// D. Volume & progressie
const startWeekVolume = 30;         // km in week 1
const weeklyIncrease = 5;           // km per week
const numberOfWeeks = 12;           // totale duur schema

/**
 * =========================
 * ENGINE
 * =========================
 */

// startdatum schema = maandag van week 1
const startMonday = getMonday(raceDate);

// bouw het volledige schema
const plan = buildPlan({
  startMonday,
  numberOfWeeks,
  sessionsPerWeek,
  startWeekVolume,
  weeklyIncrease,
  referenceDistance,
  referenceTime
});

/**
 * =========================
 * OUTPUT (console)
 * =========================
 */

console.log("");
console.log("TRAININGSSCHEMA");
console.log("==============================");
console.log("Doelafstand:", goalDistance);
console.log("Racedatum:", raceDate);
console.log("Sessies per week:", sessionsPerWeek);
console.log("");

plan.forEach(week => {
  console.log(
    `Week ${week.weekNumber} | ${week.weekType.toUpperCase()} | ` +
    `Omvang: ${week.weekVolume} km | Factor: ${week.weekFactor}`
  );

  week.sessions.forEach(session => {
    console.log(
      " ",
      session.date.toDateString(),
      "-",
      session.type,
      "→",
      session.distanceKm,
      "km @",
      session.pace
    );
  });

  console.log("");
});
