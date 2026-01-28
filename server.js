console.log(">>> server.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

console.log(">>> core modules loaded");

// Internal logic
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");

// PDF generator
const generatePdf = require("./generatePdf");

console.log(">>> internal modules loaded");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "local-dev-key";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, "output");


// ===================================================
// ✅ STRIPE WEBHOOK — MOET HELEMAAL BOVENAAN
// ===================================================
app.post(
  "/webhook/stripe",
  express.raw({ type: "*/*" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature error:", err.message);
      return res.status(403).send("Invalid Stripe signature");
    }

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ ignored: true });
    }

    console.log("✅ Stripe webhook received:", event.type);
    return res.status(200).json({ success: true });
  }
);

// ===================================================
// JSON parsing — PAS NA DE WEBHOOK
// ===================================================
app.use(express.json());

// ===================================================
// API KEY MIDDLEWARE — STRIPE UITGESLOTEN
// ===================================================
app.use((req, res, next) => {
  if (
    req.path === "/" ||
    req.path.startsWith("/downloads") ||
    req.path.startsWith("/webhook")
  ) {
    return next();
  }

  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});

app.use("/downloads", express.static(OUTPUT_DIR));

// ===================================================
// ROUTES
// ===================================================
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

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR);
    }

    const filename = `training_plan_${Date.now()}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    await generatePdf(html, outputPath);

    res.json({
      status: "ok",
      pdfUrl: `${req.protocol}://${req.get("host")}/downloads/${filename}`
    });
  } catch (err) {
    console.error(">>> ERROR in /generate-plan:", err);
    res.status(500).json({
      error: "PDF generation failed",
      details: err.message
    });
  }
});

// ===================================================
// SERVER
// ===================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> API listening on port ${PORT}`);
});
