console.log('>>> server.js starting');

const express = require('express');
const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');

// ================================
// Interne modules
// ================================
const { generateTrainingPlan } = require('./trainingPlanGenerator');
const { renderHtml } = require('./renderHtml');
const generatePdf = require('./generatePdf');

// ================================
// App setup
// ================================
const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, 'output');

// Zorg dat output map bestaat
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// ================================
// STRIPE WEBHOOK
// ⚠️ MOET vóór express.json()
// ================================
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
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send('Webhook Error');
    }

    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    console.log('✅ Stripe webhook received:', event.type);

    try {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log('📦 Metadata:', metadata);

      // ================================
      // 1️⃣ Trainingsschema genereren
      // ================================
      const trainingPlan = generateTrainingPlan({
        distance: metadata.distance,
        goal_time: metadata.goal_time,
        weeks: Number(metadata.weeks),
        sessions: Number(metadata.sessions)
      });

      // ================================
      // 2️⃣ HTML renderen
      // ================================
      const html = renderHtml(trainingPlan);

      // ================================
      // 3️⃣ PDF genereren
      // ================================
      const filename = `training_plan_${Date.now()}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, outputPath);

      console.log('📄 PDF generated:', outputPath);

      // (Mailen doen we in C3)

    } catch (err) {
      console.error('❌ Error during PDF generation:', err);
    }

    res.json({ received: true });
  }
);

// ================================
// JSON middleware (NA webhook)
// ================================
app.use(express.json());

// ================================
// Health check
// ================================
app.get('/', (req, res) => {
  res.send('RUNIQ Training Plan API is running');
});

// ================================
// Server start
// ================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
