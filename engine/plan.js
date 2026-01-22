const { buildWeek } = require("./week");
const { getWeekType, getWeekFactor } = require("./weekFactors");
const { buildPaceZones } = require("./paceCalculator");

/**
 * Hulpfunctie: telt dagen op bij een datum
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Bouwt een volledig trainingsschema (meerdere weken)
 */
function buildPlan({
  startMonday,
  numberOfWeeks,
  sessionsPerWeek,
  startWeekVolume,
  weeklyIncrease,
  referenceDistance,
  referenceTime
}) {
  // Pace zones één keer berekenen (centraal!)
  const paceZones = buildPaceZones({
    referenceDistance,
    referenceTime
  });

  const weeks = [];

  for (let i = 0; i < numberOfWeeks; i++) {
    const weekNumber = i + 1;

    // maandag van deze week
    const monday = addDays(startMonday, i * 7);

    // progressieve weekomvang (J)
    const weekVolume = startWeekVolume + i * weeklyIncrease;

    // periodisering (I)
    const weekType = getWeekType(weekNumber, numberOfWeeks);
    const weekFactor = getWeekFactor(weekType);

    // week bouwen
    const week = buildWeek({
      weekNumber,
      monday,
      sessionsPerWeek,
      weekVolume,
      weekFactor,
      paceZones,
      isRaceWeek: weekNumber === numberOfWeeks
    });

    // metadata toevoegen (handig voor output / PDF)
    week.weekType = weekType;
    week.weekFactor = weekFactor;

    weeks.push(week);
  }

  return weeks;
}

module.exports = {
  buildPlan
};
