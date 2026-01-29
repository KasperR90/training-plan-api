console.log(">>> server.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

console.log(">>> core modules loaded");

// ===============================
// Interne logica
// ===============================
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const generatePdf = require("./generatePdf");

console.log(">>> internal modules loaded");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "local-dev-key";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, "output");

// ===================================================
// 🔧 Helper: referentieafstand normaliseren
// ===================================================
function normalizeReferenceDistance(distance) {
  if (!distance) return "marathon";

  const d = distance.toString().toLowerCase();

  if (d === "42" || d === "42.2" || d.includes("marathon")) return "marathon";
  if (d === "21" || d.includes("half")) return "half";
  if (d === "10" || d.includes("10")) return "10k";
  if (d === "5" || d.includes("5")) return "5k";

  // Speciaal geval: 30 km → marathon-pace
  if (d === "30") return "marathon";

  throw new Error(`Onbekende referentieafstand: ${distance}`);
}

// ===================================================
// ✅ STRIPE WEBHOOK — MOET HELEMAAL BOVENAAN
// ===================================================
app.post(
  "/webhook/stripe",
  express.raw({ type: "*/*" }),
  async (req, res) => {
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

    // Alleen checkout afrondingen verwerken
    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ ignored: true });
    }

    console.log("✅ Stripe webhook received:", event.type);

    try {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log("📦 Metadata:", metadata);

      // ===============================
      // Trainingsschema bouwen
      // ===============================
      const startMonday = getMonday(new Date());

      const plan = buildPlan({
        startMonday,
        numberOfWeeks: parseInt(metadata.weeks, 10),
        sessionsPerWeek: parseInt(metadata.sessions, 10),
        startWeekVolume: 30,     // tijdelijk vaste waarde
        weeklyIncrease: 10,      // tijdelijk vaste waarde
        referenceDistance: normalizeReferenceDistance(metadata.distance),
        referenceTime: metadata.goal_time
      });

      // ===============================
      // HTML → PDF
      // ===============================
      const html = renderHtml(plan);

      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
      }

      const filename = `training_plan_${session.id}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, outputPath);

      console.log("📄 PDF generated:", outputPath);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Error during PDF generation:", err.message);
      return res.status(500).json({ error: "PDF generation failed" });
    }
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

// ===================================================
// Static downloads (PDF’s)
// ===================================================
app.use("/downloads", express.static(OUTPUT_DIR));

// ===================================================
// Health check
// ===================================================
app.get("/", (req, res) => {
  res.send("Training plan API is running");
});

// ===================================================
// SERVER
// ===================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> API listening on port ${PORT}`);
});
