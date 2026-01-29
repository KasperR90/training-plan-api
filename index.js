import express from 'express';
import Stripe from 'stripe';
import { generateTrainingPlan } from './trainingPlanGenerator.js';

const app = express();

// =====================================
// ⚠️ BELANGRIJK
// Stripe webhooks vereisen RAW body
// =====================================

// Webhook endpoint MOET vóór express.json()
app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

    // =====================================
    // ✅ Stripe event ontvangen
    // =====================================
    console.log('✅ Stripe webhook received:', event.type);

    // =====================================
    // 🏃 Checkout voltooid → schema maken
    // =====================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

console.log('==============================');
console.log('SESSION KEYS:', Object.keys(session));
console.log('SESSION METADATA:', session.metadata);
console.log('CUSTOMER DETAILS:', session.customer_details);
console.log('PAYMENT INTENT:', session.payment_intent);
console.log('==============================');


      // 🔍 Debug (tijdelijk, mag je later verwijderen)
      console.log('🔍 Volledige session object:');
      console.log(JSON.stringify(session, null, 2));

      // 📦 Metadata
      const metadata = session.metadata || {};
      console.log('📦 Metadata:', metadata);

      // 🧠 Trainingsschema genereren
      const trainingPlan = generateTrainingPlan(metadata);

      console.log('🏃 Trainingsschema gegenereerd:');
      console.log(JSON.stringify(trainingPlan, null, 2));
    }

    // Stripe verwacht ALTIJD een 200-response
    res.json({ received: true });
  }
);

// =====================================
// Overige routes mogen JSON gebruiken
// =====================================
app.use(express.json());

// (optioneel) health check
app.get('/', (req, res) => {
  res.send('RUNIQ Training Plan API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
