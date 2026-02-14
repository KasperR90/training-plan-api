console.log('>>> server.js starting');

const express = require('express');
const path = require('path');
const fs = require('fs');
const Stripe = require('stripe');

const { sendTrainingPlanMail } = require('./sendMail');
const { generateTrainingPlan } = require('./trainingPlanGenerator');
const { renderHtml } = require('./renderHtml');
const generatePdf = require('./generatePdf');

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

/**
 * Centrale afstandsdefinitie (ENIGE waarheid)
 */
const DISTANCES = {
  '5k': {
    key: '5k',
    label: '5 kilometer',
    meters: 5000,
  },
  '10k': {
    key: '10k',
    label: '10 kilometer',
    meters: 10000,
  },
  'half': {
    key: 'half',
    label: 'Halve marathon',
    meters: 21097,
  },
  'marathon': {
    key: 'marathon',
    label: 'Marathon',
    meters: 42195,
  },
};

// ================================
// STRIPE WEBHOOK
// ================================
app.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).send('Webhook Error');
    }

    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    try {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log('📦 Metadata:', metadata);

      const distanceConfig = DISTANCES[metadata.distance];
      if (!distanceConfig) {
        throw new Error(`Unsupported distance: ${metadata.distance}`);
      }

      // 1️⃣ Trainingsschema genereren
      const trainingPlan = generateTrainingPlan({
        distanceKey: distanceConfig.key,
        distanceLabel: distanceConfig.label,
        distanceMeters: distanceConfig.meters,
        goalTime: metadata.goal_time,
        weeks: Number(metadata.weeks),
        sessionsPerWeek: Number(metadata.sessions),
      });

      // 2️⃣ HTML renderen
      const html = renderHtml(trainingPlan);

      // 3️⃣ PDF genereren
      const filename = `training_plan_${Date.now()}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await generatePdf(html, outputPath);
      console.log('📄 PDF generated:', outputPath);

      // 4️⃣ Mailen
      await sendTrainingPlanMail({
        to: metadata.email,
        pdfPath: outputPath,
      });

      console.log('✉️ Mail sent to:', metadata.email);
    } catch (err) {
      console.error('❌ Error in webhook flow:', err);
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('RUNIQ Training Plan API is running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});