require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

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
      console.error('❌ Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      console.log('✅ Checkout completed:', event.data.object.id);
      // PDF + mail flow komt hier
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
