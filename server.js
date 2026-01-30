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
// ✅ STRIPE WEBHOOK — MOET HELEMAAL BOVENAAN
// ===================================================
app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send('Webhook Error');
    }

    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    console.log('✅ Stripe webhook received:', event.type);

    try {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log('📦 Metadata:', metadata);

      // 1️⃣ Trainingsschema genereren
      const trainingPlan = generateTrainingPlan({
        distance: metadata.distance,
        goal_time: metadata.goal_time,
        weeks: Number(metadata.weeks),
        sessions: Number(metadata.sessions)
      });

      // 2️⃣ HTML renderen
      const html = renderHtml(trainingPlan);

      // 3️⃣ PDF genereren
      const filename = `training_plan_${Date.now()}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, outputPath);

      console.log('📄 PDF generated:', outputPath);

      // (mailen doen we in stap C3)

    } catch (err) {
      console.error('❌ Error during PDF generation:', err);
    }

    res.json({ received: true });
  }
);


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
        referenceDistance: metadata.distance,
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
