const { getSessionTypes } = require("./sessions");
const { calculateDistance } = require("./distances");
const { getPaceForSession } = require("./paces");

/**
 * Bepaalt de datum van een sessie binnen de week
 * maandag = start van de week
 */
function getSessionDate(monday, sessionType) {
  const date = new Date(monday);

  // vaste dagen per sessietype
  if (sessionType === "Easy Run 1") {
    date.setDate(monday.getDate() + 1); // dinsdag
  }

  if (sessionType === "Tempo Run") {
    date.setDate(monday.getDate() + 3); // donderdag
  }

  if (sessionType === "Easy Run 2") {
    date.setDate(monday.getDate() + 5); // zaterdag
  }

  if (sessionType === "Long Run") {
    date.setDate(monday.getDate() + 6); // zondag
  }

  return date;
}

/**
 * Bouwt één volledige trainingsweek
 */
function buildWeek({
  weekNumber,
  monday,
  sessionsPerWeek,
  weekVolume,
  weekFactor,
  paceZones,
  isRaceWeek = false
}) {
  // sessietypes bepalen (engine-regel)
  const sessionTypes = getSessionTypes(sessionsPerWeek);

  // sessies bouwen
  const sessions = sessionTypes.map((type, index) => {
    // Race Day override
    const finalType =
      isRaceWeek && type === "Long Run" ? "Race Day" : type;

    return {
      sessionIndex: index + 1,
      type: finalType,
      date: getSessionDate(monday, type),
      pace: getPaceForSession(finalType, paceZones),
      distanceKm: calculateDistance({
        sessionType: finalType,
        weekVolume,
        weekFactor,
        sessionsPerWeek
      })
    };
  });

  // weekobject
  return {
    weekNumber,
    startDate: monday,
    weekVolume,
    weekFactor,
    effectiveLoad: weekVolume * weekFactor,
    sessions
  };
}

module.exports = {
  buildWeek
};
