function getPaceForSession(sessionType, paceZones) {
  // Race Day → race pace
  if (sessionType === "Race Day") {
    return paceZones.race;
  }

  // Tempo Run → tempo pace
  if (sessionType === "Tempo Run") {
    return paceZones.tempo;
  }

  // Long Run → long pace (7% sneller dan easy)
  if (sessionType === "Long Run") {
    return paceZones.long;
  }

  // Easy Run 1 / Easy Run 2
  return paceZones.easy;
}

module.exports = {
  getPaceForSession
};
