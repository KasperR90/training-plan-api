/************************************
 * ENV & IMPORTS
 ************************************/
require("dotenv").config();

console.log(">>> index.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");
const cors = require("cors");

// Engine & rendering
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const generatePdf = require("./generatePdf");

console.log(">>> modules loaded");

/************************************
 * APP & STRIPE INIT
 ************************************/
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "local-dev-key";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const OUTPUT_DIR = path.join(__dirname, "output");
const PLANS_DIR = path.join(__dirname, "plans");

/************************************
 * STRIPE WEBHOOK (MOET BOVENAAN)
 ************************************/
app.post(
  "/webhook/stripe",
  express.raw({ type: "*/*" }),
  async (req, res) => {
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
      console.error("❌ No plan_id in Stripe metadata");
      return res.status(200).json({ error: "Missing plan_id" });
    }

    console.log("✅ Stripe webhook received for plan:", planId);

    try {
      // 1️⃣ Formulierdata laden
      const formData = loadPlanData(planId);

      // 2️⃣ Trainingsschema bouwen
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

      // 3️⃣ HTML → PDF
      const html = renderHtml(plan, formData.raceDate);

      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
      }

      const filename = `${planId}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, outputPath);

      const pdfUrl = `${process.env.PUBLIC_API_URL}/downloads/${filename}`;

      console.log("📄 PDF generated:", pdfUrl);

      // 4️⃣ (later) mail versturen
      if (customerEmail) {
  	await sendPlanEmail(customerEmail, pdfUrl);
  	console.log(`📧 Email sent to ${customerEmail}`);
	}

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Error in webhook flow:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/************************************
 * JSON MIDDLEWARE (NA WEBHOOK)
 ************************************/
app.use(cors());
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
 * STAP A — Checkout starten + formulierdata opslaan
 */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const planId = `plan_${Date.now()}`;

    if (!fs.existsSync(PLANS_DIR)) {
      fs.mkdirSync(PLANS_DIR);
    }

    // 1️⃣ Formulierdata opslaan
    const planFile = path.join(PLANS_DIR, `${planId}.json`);
    fs.writeFileSync(planFile, JSON.stringify(req.body, null, 2));

    // 2️⃣ Stripe Checkout Session
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
      checkoutUrl: session.url
    });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});

/************************************
 * HELPERS
 ************************************/
function loadPlanData(planId) {
  const filePath = path.join(PLANS_DIR, `${planId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Plan data not found for ${planId}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/************************************
 * SERVER START
 ************************************/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 RUNIQ API listening on port ${PORT}`);
});


/************************************
 * MAIL HELPER
 ************************************/

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendPlanEmail(to, pdfUrl) {
  const msg = {
    to,
    from: process.env.SENDER_EMAIL,
    subject: "Your RUNIQ training plan is ready 🏃‍♂️",
    html: `
      <h2>Your personalized training plan is ready</h2>
      <p>Thanks for using <strong>RUNIQ</strong>.</p>
      <p>You can download your training plan here:</p>
      <p>
        <a href="${pdfUrl}" target="_blank">
          👉 Download your training plan (PDF)
        </a>
      </p>
      <p>Train smarter. Automatically.</p>
      <br/>
      <p>— RUNIQ</p>
    `
  };

  await sgMail.send(msg);
}

