require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const fs = require('fs');

const build5KPlanEngine = require('./build5KPlanEngine');
const generatePdf = require('./generatePdf');
const { sendTrainingPlanMail } = require('./sendMail');

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ======================
   IDEMPOTENCY STORE
====================== */

const processedSessions = new Set();

/* ======================
   CORS
====================== */

app.use(
  cors({
    origin: 'https://runiq.run',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

/* ======================
   STRIPE WEBHOOK
   (MUST BE BEFORE express.json())
====================== */

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
      console.error('Webhook signature error:', err.message);
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

      // Process async
      processCheckout(session);
      return;
    }

    res.json({ received: true });
  }
);

/* ======================
   BACKGROUND PROCESSING
====================== */

async function processCheckout(session) {
  try {

    const metadata = session.metadata;

    const {
      email,
      currentTime,
      goalTime,
      weeks,
      frequency,
      currentVolume
    } = metadata;

    if (!email || !currentTime || !goalTime || !weeks || !frequency || !currentVolume) {
      throw new Error('Missing metadata fields');
    }

    console.log('Generating 5K plan for:', email);

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

    // Cleanup
    fs.unlink(pdfResult.filePath, () => {});

    console.log('Order completed:', session.id);

  } catch (err) {
    console.error('Background processing error:', err);
  }
}

/* ======================
   JSON PARSER
====================== */

app.use(express.json());

/* ======================
   CHECKOUT ENDPOINT
====================== */

app.post('/checkout', async (req, res) => {

  try {

    const {
      email,
      currentTime,
      goalTime,
      weeks,
      frequency,
      currentVolume
    } = req.body;

    if (!email || !currentTime || !goalTime || !weeks || !frequency || !currentVolume) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
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
    console.error('CHECKOUT ERROR:', err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/* ======================
   HEALTH CHECK
====================== */

app.get('/', (req, res) => {
  res.status(200).send('RUNIQ API is live');
});

/* ======================
   START SERVER
====================== */

app.listen(PORT, () => {
  console.log(`RUNIQ API running on port ${PORT}`);
});