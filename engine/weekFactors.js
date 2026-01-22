function getWeekType(weekNumber, totalWeeks) {
  // laatste 2 weken = taper
  if (weekNumber >= totalWeeks - 1) {
    return "taper";
  }

  // elke 4e week = recovery
  if (weekNumber % 4 === 0) {
    return "recovery";
  }

  return "build";
}

function getWeekFactor(weekType) {
  if (weekType === "build") return 1.0;
  if (weekType === "recovery") return 0.8;
  if (weekType === "taper") return 0.6;

  return 1.0;
}

module.exports = {
  getWeekType,
  getWeekFactor
};
