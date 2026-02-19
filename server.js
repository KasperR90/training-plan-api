require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const generateTrainingPlan = require('./trainingPlanGenerator');
const generatePdf = require('./generatePdf');
const { sendTrainingPlanMail } = require('./sendMail');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ======================
 * ENV CHECK (CRITICAL)
 * ======================
 */
const REQUIRED_ENVS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
];

REQUIRED_ENVS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV variable: ${key}`);
  }
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * ======================
 * MIDDLEWARE
 * ======================
 */
app.use(
  cors({
    origin: 'https://runiq.run',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

/**
 * ======================
 * STRIPE WEBHOOK
 * (MUST COME BEFORE express.json())
 * ======================
 */
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
      console.error('❌ Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('✅ Checkout completed:', session.id);
      console.log('📦 Metadata:', session.metadata);

      try {
        const email = session.metadata.email;
        const distance = session.metadata.distance;
        const goal_time = session.metadata.goal_time;
        const weeks = Number(session.metadata.weeks);
        const sessions = Number(session.metadata.sessions);

        // 1️⃣ Generate training plan
       const plan = generateTrainingPlan({
	distance,
  	goalTime: goal_time,
  	weeks,
  	sessionsPerWeek: sessions,
	});

        // 2️⃣ Generate PDF
        const pdfResult = await generatePdf(plan);

        // 3️⃣ Send email
        await sendTrainingPlanMail({
  	to: email,
  	pdfPath: pdfResult.filePath,
  	pdfFileName: pdfResult.fileName,
  	distanceLabel: plan.meta.distanceLabel,
	});


        console.log('📧 Email successfully sent to:', email);

      } catch (err) {
        console.error('❌ PDF or Mail error:', err);
      }
    }

    res.json({ received: true });
  }
);

/**
 * ======================
 * JSON PARSER
 * (AFTER WEBHOOK!)
 * ======================
 */
app.use(express.json());

/**
 * ======================
 * CHECKOUT ENDPOINT
 * ======================
 */
app.post('/checkout', async (req, res) => {
  console.log('➡️ /checkout called');
  console.log('📦 Body:', req.body);

  try {
    const { email, distance, goal_time, weeks, sessions } = req.body;

    if (!email || !distance || !goal_time || !weeks || !sessions) {
      console.error('❌ Missing parameters');
      return res.status(400).json({
        error: 'Missing required training plan parameters',
      });
    }

    console.log('💳 Creating Stripe Checkout session…');

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
        distance,
        goal_time,
        weeks: String(weeks),
        sessions: String(sessions),
      },
    });

    console.log('✅ Stripe session created:', session.id);

    res.json({ url: session.url });

  } catch (err) {
    console.error('❌ CHECKOUT ERROR');
    console.error(err);

    if (err.type === 'StripeInvalidRequestError') {
      return res.status(500).json({
        error: 'Stripe configuration error',
        details: err.message,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
});

/**
 * ======================
 * START SERVER
 * ======================
 */
app.listen(PORT, () => {
  console.log(`🚀 RUNIQ API running on port ${PORT}`);
});
