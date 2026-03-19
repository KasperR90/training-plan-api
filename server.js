require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

const build5KPlanEngine = require('./build5KPlanEngine');
const generatePdf = require('./generatePdf');
const { sendTrainingPlanMail } = require('./sendMail');
const { sendAbandonedEmail } = require('./sendMail');

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =================================================
   ABANDONED STORE (TEMP DB)
================================================= */

const abandonedStore = {};

/* =================================================
   SIMPLE IDEMPOTENCY STORE (in-memory)
================================================= */

const processedSessions = new Set();

/* =================================================
   CORS CONFIG
================================================= */

app.use(
  cors({
    origin: 'https://runiq.run',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

/* =================================================
   STRIPE WEBHOOK
   MUST BE BEFORE express.json()
================================================= */

app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (processedSessions.has(session.id)) {
        return res.json({ received: true });
      }

      processedSessions.add(session.id);

      // Respond immediately to Stripe
      res.json({ received: true });

      // Process in background
      processCheckout(session).catch((err) => {
        console.error('❌ Background processing failed:', err);
      });

      return;
    }

    res.json({ received: true });
  }
);

/* =================================================
   BACKGROUND CHECKOUT PROCESSING
================================================= */

async function processCheckout(session) {
  const metadata = session.metadata;

  if (!metadata) {
    throw new Error('Missing metadata');
  }

  const {
    email,
    currentTime,
    goalTime,
    weeks,
    frequency,
    currentVolume
  } = metadata;

  if (!email || !currentTime || !goalTime || !weeks || !frequency || !currentVolume) {
    throw new Error('Missing required metadata fields');
  }

  console.log(`🚀 Generating 5K plan for ${email}`);

  const plan = build5KPlanEngine({
    currentTime,
    goalTime,
    weeks: Number(weeks),
    frequency: Number(frequency),
    currentVolume: Number(currentVolume)
  });

  const pdfResult = await generatePdf(plan);

  await sendTrainingPlanMail({
    to: email,
    pdfPath: pdfResult.filePath,
    pdfFileName: pdfResult.fileName,
    distanceLabel: '5K'
  });

  // Cleanup generated file
  try {
    fs.unlinkSync(pdfResult.filePath);
  } catch (err) {
    console.warn('⚠️ Could not delete PDF file:', err.message);
  }

  console.log(`✅ Order completed: ${session.id}`);
}

/* =================================================
   JSON PARSER (AFTER WEBHOOK)
================================================= */

app.use(express.json());

/* =================================================
   CHECKOUT ENDPOINT
================================================= */

app.post("/api/abandoned/start", (req, res) => {
  const { email, planData } = req.body;

  if (!email) {
    return res.status(400).json({ error: "No email" });
  }

  // ❌ voorkom dubbele entries
  if (abandonedStore[email]) {
    return res.json({ status: "already_exists" });
  }

  console.log("📥 Abandoned flow started:", email);

  abandonedStore[email] = {
    email,
    planData,
    hasPurchased: false,
    recoveryStep: 0,
    createdAt: Date.now(),
  };

  // ⏱️ EMAIL 1 (1 uur)
  setTimeout(() => triggerEmailStep(email, 1), 1000 * 60 * 60);

  // ⏱️ EMAIL 2 (24 uur)
  setTimeout(() => triggerEmailStep(email, 2), 1000 * 60 * 60 * 24);

  // ⏱️ EMAIL 3 (48 uur)
  setTimeout(() => triggerEmailStep(email, 3), 1000 * 60 * 60 * 48);

  res.json({ success: true });
});

async function triggerEmailStep(email, step) {
  const user = abandonedStore[email];

  if (!user) return;
  if (user.hasPurchased) return;
  if (user.recoveryStep >= step) return;

  try {
    console.log(`📬 Sending step ${step} to ${email}`);

    await sendAbandonedEmail({
      to: email,
      step,
      planData: user.planData,
    });

    user.recoveryStep = step;

  } catch (err) {
    console.error("❌ Email step failed:", err);
  }
}

// 🔥 STOP abandoned flow
if (abandonedStore[email]) {
  abandonedStore[email].hasPurchased = true;
  console.log("🛑 Abandoned flow stopped (purchase):", email);
}


    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: 'https://runiq.run/success',
      cancel_url: 'https://runiq.run',
      metadata: {
        email,
        currentTime,
        goalTime,
        weeks: String(weeks),
        frequency: String(frequency),
        currentVolume: String(currentVolume)
      },
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error('❌ CHECKOUT ERROR:', err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/* =================================================
   HEALTH CHECK
================================================= */

app.get('/', (req, res) => {
  res.status(200).send('RUNIQ API is live');
});

/* =================================================
   START SERVER
================================================= */

/* =================================================
   TEST ABANDONED EMAIL
================================================= */

app.post("/api/abandoned-test", async (req, res) => {
  const { email } = req.body;

  console.log("📥 Abandoned test trigger:", email);

  if (!email) {
    return res.status(400).json({ error: "No email provided" });
  }

  try {
    await sendAbandonedEmail({ to: email });

    console.log("📬 Abandoned email sent");

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({ error: "failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 RUNIQ API running on port ${PORT}`);
});

/* =================================================
   API CONNECT
================================================= */

const planRoute = require("./api/generate-plan");
app.use("/api", planRoute);