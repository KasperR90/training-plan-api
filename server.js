console.log(">>> server.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");

console.log(">>> core modules loaded");

// Internal logic
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");

// PDF generator (CORRECT import)
const generatePdf = require("./generatePdf");

console.log(">>> internal modules loaded");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY || "local-dev-key";

// ---------- Middleware ----------
app.use(express.json());

// API key middleware (health check allowed)
app.use((req, res, next) => {
  if (req.path === "/") return next();

  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

// Static downloads
const OUTPUT_DIR = path.join(__dirname, "output");
app.use("/downloads", express.static(OUTPUT_DIR));

// ---------- Routes ----------

app.get("/", (req, res) => {
  res.send("Training plan API is running");
});

app.post("/generate-plan", async (req, res) => {
  console.log(">>> /generate-plan called");

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

    // 1️⃣ Calculate start date
    const startMonday = getMonday(raceDate);

    // 2️⃣ Build training plan
    const plan = buildPlan({
      startMonday,
      numberOfWeeks,
      sessionsPerWeek,
      startWeekVolume,
      weeklyIncrease,
      referenceDistance,
      referenceTime
    });

    // 3️⃣ Render HTML
    const html = renderHtml(plan, raceDate);

    // 4️⃣ Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    // 5️⃣ Generate PDF
    const filename = `training_plan_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    await gen
