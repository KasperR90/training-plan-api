const generatePdf = require("./generatePdf");

async function runTest(){

const testPlan = {

meta: {
currentTime: "25:00",
goalTime: "22:00",
frequency: 4,
weeks: 12
},

zones: {
easy: "6:00 – 7:00 /km",
threshold: "4:40 – 4:50 /km",
vo2: "4:05 – 4:20 /km",
race: "4:24 /km"
},

weeks: [
{
week: 1,
focus: "Base",
volume: 32,
sessions: [
{
day: "Tuesday",
type: "Easy Run",
description: "6 km easy pace"
},
{
day: "Thursday",
type: "Threshold",
description: "5 × 5 min threshold with 2 min recovery"
},
{
day: "Sunday",
type: "Long Run",
description: "10 km comfortable pace"
}
]
},
{
week: 2,
focus: "Progression",
volume: 35,
sessions: [
{
day: "Tuesday",
type: "Easy Run",
description: "7 km easy"
},
{
day: "Thursday",
type: "VO₂ Workout",
description: "6 × 3 min VO₂ pace"
},
{
day: "Sunday",
type: "Long Run",
description: "12 km steady"
}
]
}
]

};

try{

const result = await generatePdf(testPlan);

console.log("✅ PDF created:");
console.log(result.filePath);

}catch(err){

console.error("❌ Test failed:", err);

}

}

runTest();