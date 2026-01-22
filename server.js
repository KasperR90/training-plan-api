const express = require("express");
const fs = require("fs");
const path = require("path");

const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const { generatePdf } = require("./generatePdf");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * =========================
 * SECURITY: API KEY
 * =========================
 * In productie zet je API_KEY als environment variable (Render)
 * Lokaal gebruikt hij automatisch "local-dev-key"
 */
const API_KEY = process.env.API_KEY || "local-dev-key";

/**
 * =========================
 * MIDDLEWARE
 * =========================
 */

// JSON body parsing
app.use(express.json());

// API key check
app.use((req, res, next) => {
  const key = req.headers["x-api-key"];

  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

// Static folder voor PDF downloads
app.use("/downloads", express.static(path.join(__dirname, "output")));

/**
 * =========================
 * ROUTES
 * =========================
 */

// Health check
app.get("/", (req, res) => {
  res.send("Training plan API is running");
});

// Generate training plan + PDF
app.post("/generate-plan", async (req, res) => {
  try {
    const {
      raceDate,
      referenceDistance,
      referenceTime,
      sessionsPerWeek,
      startWeekVolume,
      weeklyIncrease,
      numberOfWeeks
    } = req.body;

    // 1. Startdatum bepalen
    const startMonday = getMonday(raceDate);

    // 2. Trainingsschema bouwen
    const plan = buildPlan({
      startMonday,
      numberOfWeeks,
      sessionsPerWeek,
      startWeekVolume,
      weeklyIncrease,
      referenceDistance,
      referenceTime
    });

    // 3. HTML renderen
    const html = renderHtml(plan, raceDate);

    // 4. Output-map garanderen
    if (!fs.existsSync("output")) {
      fs.mkdirSync("output");
    }

    // 5. PDF genereren
    const filename = `training_plan_${Date.now()}.pdf`;
    const outputPath = path.join("output", filename);

    await generatePdf(html, outputPath);

    // 6. Download-link teruggeven
    res.json({
      status: "ok",
      pdfUrl: `${req.protocol}://${req.get("host")}/downloads/${filename}`
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      status: "error",
      message: err.message
    });
  }
});

/**
 * =========================
 * START SERVER
 * =========================
 */
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
