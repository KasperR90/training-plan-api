// server.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const path = require('path');

const { generateTrainingPlan } = require('./trainingPlanGenerator');
const { generatePdf } = require('./generatePdf');
const { sendTrainingPlanMail } = require('./sendMail');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// =====================================================
// Middleware
// =====================================================

// Stripe webhook requires raw body
app.post(
  '/webhook/stripe',
  bodyParser.raw({ type: 'application/json' }),
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
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // =================================================
    // Handle successful checkout
    // =================================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};

      try {
        console.log('✅ Stripe checkout completed');
        console.log('📦 Metadata:', metadata);

        // ---------------------------------------------
        // Normalize distance
        // ---------------------------------------------
        const DISTANCE_MAP = {
          '5k': '5k',
          '10k': '10k',
          'half': 'half',
          'marathon': 'marathon',
        };

        const distanceKey = DISTANCE_MAP[metadata.distance];

        if (!distanceKey) {
          throw new Error(`Unsupported distance: ${metadata.distance}`);
        }

        // ---------------------------------------------
        // 1️⃣ Generate training plan
        // ---------------------------------------------
        const trainingPlan = generateTrainingPlan({
          distance: distanceKey,
          goalTime: metadata.goal_time,
          weeks: Number(metadata.weeks),
          sessionsPerWeek: Number(metadata.sessions),
        });

        console.log('📊 Training plan generated');

        // ---------------------------------------------
        // 2️⃣ Generate PDF
        // ---------------------------------------------
        const { filePath, fileName } = await generatePdf(trainingPlan);

        console.log('📄 PDF generated:', filePath);

        // ---------------------------------------------
        // 3️⃣ Send email
        // ---------------------------------------------
        await sendTrainingPlanMail({
          to: metadata.email,
          pdfPath: filePath,
          pdfFileName: fileName,
          distanceLabel: trainingPlan.meta.distanceLabel,
        });

        console.log('✉️ Email sent to:', metadata.email);

        res.status(200).json({ received: true });
      } catch (err) {
        console.error('❌ Error processing checkout:', err);
        res.status(500).json({ error: err.message });
      }
    } else {
      // Other events we do not process
      res.status(200).json({ received: true });
    }
  }
);

// =====================================================
// Health check (optional but recommended)
// =====================================================
app.get('/', (req, res) => {
  res.send('RUNIQ training plan API is running');
});

// =====================================================
// Start server
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});