function getSessionTypes(sessionsPerWeek) {
  if (sessionsPerWeek === 3) {
    return ["Easy Run 1", "Tempo Run", "Long Run"];
  }

  if (sessionsPerWeek === 4) {
    return ["Easy Run 1", "Tempo Run", "Easy Run 2", "Long Run"];
  }

  if (sessionsPerWeek === 5) {
    return [
      "Easy Run 1",
      "Tempo Run",
      "Easy Run 2",
      "Easy Run 3",
      "Long Run"
    ];
  }

  throw new Error("Ongeldig aantal sessies per week");
}

module.exports = { getSessionTypes };
