require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ======================
 * CORS CONFIGURATION
 * ======================
 */
app.use(
  cors({
    origin: 'https://runiq.run',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

// Needed for JSON bodies (except webhooks)
app.use(express.json());

/**
 * ======================
 * CHECKOUT ENDPOINT
 * ======================
 */
app.post('/checkout', async (req, res) => {
  try {
    const { email, distance, goal_time, weeks, sessions } = req.body;

    if (!email || !distance || !goal_time || !weeks || !sessions) {
      return res.status(400).json({
        error: 'Missing required training plan parameters',
      });
    }

    console.log('📦 Checkout payload:', req.body);

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
        weeks,
        sessions,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * ======================
 * STRIPE WEBHOOK
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
      console.error('❌ Webhook signature verification failed', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      console.log('✅ Stripe checkout completed');
      // hier komt je PDF + mail flow
    }

    res.json({ received: true });
  }
);

/**
 * ======================
 * START SERVER
 * ======================
 */
app.listen(PORT, () => {
  console.log(`🚀 RUNIQ API running on port ${PORT}`);
});
