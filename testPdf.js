const generatePdf = require("./generatePdf");
const build5KPlanEngine = require("./build5KPlanEngine");

async function runTest() {

  console.log("🚀 Generating FULL plan from engine...\n");

  /* =========================
     REAL INPUT (zoals user)
  ========================= */

  const input = {
    currentTime: "25:00",
    goalTime: "22:00",
    weeks: 12,
    frequency: 4,
    currentVolume: 30
  };

  /* =========================
     BUILD PLAN (ENGINE)
  ========================= */

  const plan = build5KPlanEngine(input);

  /* =========================
     DEBUG (BELANGRIJK)
  ========================= */

  console.log("=== SAMPLE WEEK ===");
  console.log(JSON.stringify(plan.weeks[0], null, 2));

  console.log("\n=== SAMPLE SESSION ===");
  console.log(JSON.stringify(plan.weeks[0].sessions[0], null, 2));

  /* =========================
     GENERATE PDF
  ========================= */

  try {

    const result = await generatePdf(plan);

    console.log("\n✅ PDF created:");
    console.log(result.filePath);

  } catch (err) {

    console.error("❌ Test failed:", err);

  }

}

runTest();