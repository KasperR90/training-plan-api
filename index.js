/************************************
 * ENV & IMPORTS
 ************************************/
require("dotenv").config();

console.log(">>> index.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

console.log(">>> core modules loaded");

// Internal logic
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const generatePdf = require("./generatePdf");

console.log(">>> internal modules loaded");

/************************************
 * APP & STRIPE INIT
 ************************************/
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "local-dev-key";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, "output");

/************************************
 * STRIPE WEBHOOK — MOET HELEMAAL BOVENAAN
 ************************************/
app.post(
  "/webhook/stripe",
  express.raw({ type: "*/*" }),
  (req, res) => {
    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature verification failed:", err.message);
      return res.status(403).send("Invalid Stripe signature");
    }

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ ignored: true });
    }

    const session = event.data.object;
    const planId = session.metadata?.plan_id;
    const customerEmail = session.customer_details?.email;

    if (!planId) {
      console.error("❌ No plan_id found in Stripe metadata");
      return res.status(200).json({ error: "Missing plan_id" });
    }

    console.log("✅ Payment confirmed for plan:", planId);

    try {
      const planData = getPlanData(planId);
      const pdfUrl = generateTrainingPlanPdf(planData);

      sendPlanEmail(customerEmail, pdfUrl);

      console.log("📄 Plan generated and emailed:", pdfUrl);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Error generating plan:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/************************************
 * JSON MIDDLEWARE (NA WEBHOOK!)
 ************************************/
app.use(express.json());

/************************************
 * API KEY MIDDLEWARE (STRIPE UITGESLOTEN)
 ************************************/
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

/************************************
 * STATIC FILES
 ************************************/
app.use("/downloads", express.static(OUTPUT_DIR));

/************************************
 * ROUTES
 ************************************/
app.get("/", (req, res) => {
  res.send("RUNIQ API is running");
});

/**
 * 🆕 STAP 3 / A
 * Stripe Checkout Session aanmaken MET plan_id
 */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const planId = `plan_${Date.now()}`;

    // TODO (volgende stap): sla formulierdata op met planId

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "RUNIQ – Personalized Training Plan"
            },
            unit_amount: 1900
          },
          quantity: 1
        }
      ],
      success_url: "https://jouwdomein.nl/success",
      cancel_url: "https://jouwdomein.nl/cancel",
      metadata: {
        plan_id: planId
      }
    });

    res.json({
      checkoutUrl: session.url,
      planId
    });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});

/************************************
 * BESTAANDE PDF-LOGICA (tijdelijk)
 ************************************/
function getPlanData(planId) {
  const raceDate = "2026-04-12";
  const startMonday = getMonday(raceDate);

  return {
    startMonday,
    numberOfWeeks: 12,
    sessionsPerWeek: 3,
    startWeekVolume: 30,
    weeklyIncrease: 5,
    referenceDistance: "10K",
    referenceTime: "45:30"
  };
}

function generateTrainingPlanPdf(planData) {
  const plan = buildPlan(planData);
  return "https://example.com/fake-training-plan.pdf";
}

function sendPlanEmail(email, pdfUrl) {
  console.log(`📧 Sending plan to ${email}: ${pdfUrl}`);
}

/************************************
 * SERVER START
 ************************************/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 RUNIQ API listening on port ${PORT}`);
});
