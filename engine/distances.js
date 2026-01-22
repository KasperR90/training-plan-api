function getSessionShare(sessionType, sessionsPerWeek) {
  // Tempo is altijd 25%
  if (sessionType === "Tempo Run") {
    return 0.25;
  }

  // 3 sessies per week
  if (sessionsPerWeek === 3) {
    if (sessionType === "Easy Run 1") return 0.30;
    if (sessionType === "Long Run") return 0.45;
  }

  // 4 sessies per week
  if (sessionsPerWeek === 4) {
    if (sessionType === "Easy Run 1") return 0.20;
    if (sessionType === "Easy Run 2") return 0.15;
    if (sessionType === "Long Run") return 0.40;
  }

  // 5 sessies per week (optioneel, voorlopig simpel)
  if (sessionsPerWeek === 5) {
    if (sessionType.startsWith("Easy Run")) return 0.15;
    if (sessionType === "Long Run") return 0.40;
  }

  return 0;
}

function calculateDistance({
  sessionType,
  weekVolume,
  weekFactor,
  sessionsPerWeek
}) {
  // Race Day override
  if (sessionType === "Race Day") {
    return 21.1;
  }

  const share = getSessionShare(sessionType, sessionsPerWeek);
  const rawKm = weekVolume * weekFactor * share;

  // afronden op hele kilometers
  return Math.round(rawKm);
}

module.exports = {
  calculateDistance
}