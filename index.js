/************************************
 * IMPORTS
 ************************************/
require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");

const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");

/************************************
 * APP & STRIPE INIT
 ************************************/
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/************************************
 * MIDDLEWARE
 ************************************/

// Normale JSON parsing voor andere routes (bijv. AJAX vanuit WordPress)
app.use("/api", express.json());

// Stripe webhook heeft RAW body nodig
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

/************************************
 * STRIPE WEBHOOK HANDLER
 ************************************/
async function stripeWebhookHandler(req, res) {
  const signature = req.headers["stripe-signature"];
  let event;

  // 1️⃣ Verifieer dat dit echt van Stripe komt
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return res.status(400).send("Invalid webhook signature");
  }

  // 2️⃣ Alleen reageren op succesvolle checkout
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ ignored: true });
  }

  // 3️⃣ Haal Stripe session op
  const session = event.data.object;

  const planId = session.metadata?.plan_id;
  const customerEmail = session.customer_details?.email;

  if (!planId) {
    console.error("❌ No plan_id found in Stripe metadata");
    return res.status(400).json({ error: "Missing plan_id" });
  }

  console.log("✅ Payment confirmed for plan:", planId);

  try {
    // 4️⃣ HIER GAAT JOUW BESTAANDE LOGICA STARTEN
    const planData = getPlanData(planId);

    const pdfUrl = await generateTrainingPlanPdf(planData);

    await sendPlanEmail(customerEmail, pdfUrl);

    console.log("📄 Plan generated and emailed:", pdfUrl);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error generating plan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/************************************
 * DUMMY IMPLEMENTATIES (tijdelijk)
 * Deze vervang je later
 ************************************/
function getPlanData(planId) {
  // Tijdelijk: jouw huidige test-input
  const goalDistance = "HM";
  const raceDate = "2026-04-12";

  const referenceDistance = "10K";
  const referenceTime = "45:30";

  const sessionsPerWeek = 3;
  const startWeekVolume = 30;
  const weeklyIncrease = 5;
  const numberOfWeeks = 12;

  const startMonday = getMonday(raceDate);

  return {
    startMonday,
    numberOfWeeks,
    sessionsPerWeek,
    startWeekVolume,
    weeklyIncrease,
    referenceDistance,
    referenceTime
  };
}

async function generateTrainingPlanPdf(planData) {
  const plan = buildPlan(planData);

  // Hier komt later Puppeteer
  // Nu doen we alsof er een PDF is
  return "https://example.com/fake-training-plan.pdf";
}

async function sendPlanEmail(email, pdfUrl) {
  console.log(`📧 Sending plan to ${email}: ${pdfUrl}`);
}

/************************************
 * SERVER START
 ************************************/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 RUNIQ API listening on port ${PORT}`);
});
