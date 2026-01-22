const DISTANCES_IN_KM = {
  "5K": 5,
  "10K": 10,
  "15K": 15,
  "HM": 21.1
};

function timeStringToSeconds(timeString) {
  const [m, s] = timeString.split(":").map(Number);
  return m * 60 + s;
}

function secondsToPaceString(secondsPerKm) {
  const rounded = Math.round(secondsPerKm);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

function buildPaceZones({ referenceDistance, referenceTime }) {
  const distanceKm = DISTANCES_IN_KM[referenceDistance];
  if (!distanceKm) {
    throw new Error("Onbekende referentieafstand");
  }

  const totalSeconds = timeStringToSeconds(referenceTime);
  const basePace = totalSeconds / distanceKm;

  const easy = basePace + 60;
  const long = easy * 0.93;
  const tempo = basePace + 10;
  const race = basePace + 15;

  return {
    easy: secondsToPaceString(easy),
    long: secondsToPaceString(long),
    tempo: secondsToPaceString(tempo),
    race: secondsToPaceString(race)
  };
}

module.exports = { buildPaceZones };
