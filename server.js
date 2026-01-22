console.log(">>> server.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");

console.log(">>> modules loaded");

const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const { generatePdf } = require("./generatePdf");

console.log(">>> internal modules loaded");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY || "local-dev-key";

app.use(express.json());

// API key middleware (health check allowed)
app.use((req, res, next) => {
  if (req.path === "/") {
    return next();
  }

  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

app.use("/downloads", express.static(path.join(__dirname, "output")));

app.get("/", (req, res) => {
  res.send("Training plan API is running");
});

app.post("/generate-plan", async (req, res) => {
  try {
    console.log(">>> /generate-plan called");

    const {
      raceDate,
      referenceDistance,
      referenceTime,
      sessionsPerWeek,
      startWeekVolume,
      weeklyIncrease,
      numberOfWeeks
    } = req.body;

    const startMonday = getMonday(raceDate);

    const plan = buildPlan({
      startMonday,
      numberOfWeeks,
      sessionsPerWeek,
      startWeekVolume,
      weeklyIncrease,
      referenceDistance,
      referenceTime
    });

    const html = renderHtml(plan, raceDate);

    if (!fs.existsSync("output")) {
      fs.mkdirSync("output");
    }

    const filename = `training_plan_${Date.now()}.pdf`;
    const outputPath = path.join("output", filename);

    await generatePdf(html, outputPath);

    res.json({
      status: "ok",
      pdfUrl: `${req.protocol}://${req.get("host")}/downloads/${filename}`
    });
  } catch (err) {
    console.error(">>> ERROR in generate-plan:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> API listening on port ${PORT}`);
});

// extra safety logs
process.on("exit", code => {
  console.log(">>> Process exiting with code", code);
});
process.on("uncaughtException", err => {
  console.error(">>> Uncaught exception:", err);
});
process.on("unhandledRejection", err => {
  console.error(">>> Unhandled rejection:", err);
});
