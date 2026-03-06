const build5KPlanEngine = require('./build5KPlanEngine');
const generatePdf = require('./generatePdf');
const path = require('path');

async function runTest() {

  try {

    const plan = build5KPlanEngine({
      currentTime: "24:30",
      goalTime: "21:00",
      weeks: 12,
      frequency: 4,
      currentVolume: 35
    });

    const result = await generatePdf(plan);

    console.log("✅ PDF generated successfully");
    console.log("📄 Location:", result.filePath);

  } catch (err) {

    console.error("❌ Test failed:", err);

  }

}

runTest();