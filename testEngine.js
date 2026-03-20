const build5KPlanEngine = require('./build5KPlanEngine');

const result = build5KPlanEngine({
  currentTime: null,
  estimatedAbility: "can_run_5k",
  goalTime: "30:00",
  weeks: 8,
  frequency: 3,
  currentVolume: 10
})

console.log(JSON.stringify(result, null, 2));