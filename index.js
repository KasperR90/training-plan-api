/************************************
 * ENV & IMPORTS
 ************************************/
require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const sgMail = require("@sendgrid/mail");

// Engine
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const generatePdf = require("./generatePdf");

console.log(">>> RUNIQ API starting");

/************************************
 * APP INIT
 ************************************/
const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const OUTPUT_DIR = path.join(__dirname, "output");
const PLANS_DIR = path.join(__dirname, "plans");

/************************************
 * 🚨 HARD CORS FIX (MOET HELEMAAL BOVENAAN)
 ************************************/
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://runiq.run");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/************************************
 * STRIPE WEBHOOK (ABSOLUUT EERST)
 ************************************/
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
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
      console.error("❌ Invalid Stripe signature:", err.message);
      return res.status(400).send("Invalid signature");
    }

    if (event.type !== "checkout.session.completed") {
      return res.json({ ignored: true });
    }

    const session = event.data.object;
    const planId = session.metadata?.plan_id;
    const customerEmail = session.customer_details?.email;

    if (!planId) {
      return res.status(400).json({ error: "Missing plan_id" });
    }

    console.log("✅ Payment completed for", planId);

    try {
      // Load saved form data
      const formData = loadPlanData(planId);

      // Build plan
      const startMonday = getMonday(formData.raceDate);
      const plan = buildPlan({
        startMonday,
        numberOfWeeks: formData.numberOfWeeks,
        sessionsPerWeek: formData.sessionsPerWeek,
        startWeekVolume: formData.startWeekVolume,
        weeklyIncrease: formData.weeklyIncrease,
        referenceDistance: formData.referenceDistance,
        referenceTime: formData.referenceTime
      });

      fs.mkdirSync(OUTPUT_DIR, { recursive: true });

      const html = renderHtml(plan, formData.raceDate);
      const filename = `${planId}.pdf`;
      const filePath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, filePath);

      const pdfUrl = `${process.env.PUBLIC_API_URL}/downloads/${filename}`;
      console.log("📄 PDF generated:", pdfUrl);

      if (customerEmail) {
        await sendPlanEmail(customerEmail, pdfUrl);
        console.log("📧 Email sent to", customerEmail);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("❌ Webhook processing failed:", err);
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

/************************************
 * JSON BODY PARSER (NA WEBHOOK)
 ************************************/
app.use(express.json());

/************************************
 * STATIC FILES
 ************************************/
app.use("/downloads", express.static(OUTPUT_DIR));

/************************************
 * ROUTES
 ************************************/
app.get("/", (_, res) => {
  res.send("RUNIQ API is running");
});

/************************************
 * START STRIPE CHECKOUT (PUBLIEK)
 ************************************/
app.post("/create-checkout-session", async (req, res) => {
  try {
    fs.mkdirSync(PLANS_DIR, { recursive: true });

    const planId = `plan_${Date.now()}`;
    const planFile = path.join(PLANS_DIR, `${planId}.json`);
    fs.writeFileSync(planFile, JSON.stringify(req.body, null, 2));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      // 🔴 DIT WAS DE MISSENDE SCHAKEL
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

      success_url: "https://runiq.run/success",
      cancel_url: "https://runiq.run",
      metadata: { plan_id: planId }
    });

    // 🔴 EXTRA VEILIGHEID
    if (!session.url) {
      console.error("❌ Stripe session created without URL", session);
      return res.status(500).json({ error: "Stripe session has no URL" });
    }

    res.json({ checkoutUrl: session.url });

  } catch (err) {
    // 🔴 DIT WIL JE ZIEN IN RENDER LOGS
    console.error("❌ Stripe checkout failed:", err);
    res.status(500).json({ error: err.message });
  }
});


/************************************
 * HELPERS
 ************************************/
function loadPlanData(planId) {
  const file = path.join(PLANS_DIR, `${planId}.json`);
  if (!fs.existsSync(file)) {
    throw new Error("Plan data not found");
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

async function sendPlanEmail(to, pdfUrl) {
  await sgMail.send({
    to,
    from: process.env.SENDER_EMAIL,
    subject: "Your RUNIQ training plan is ready 🏃‍♂️",
    html: `
      <h2>Your training plan is ready</h2>
      <p><a href="${pdfUrl}" target="_blank">Download your PDF</a></p>
      <p>Train smarter. Automatically.</p>
      <p>— RUNIQ</p>
    `
  });
}

/************************************
 * SERVER START
 ************************************/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 RUNIQ API listening on port ${PORT}`);
});
