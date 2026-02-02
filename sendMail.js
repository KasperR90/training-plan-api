const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

/**
 * ========== CONFIG CHECKS ==========
 */
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM;

if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

if (!MAIL_FROM) {
  throw new Error('MAIL_FROM environment variable is not set');
}

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * ========== SEND TRAINING PLAN MAIL ==========
 */
async function sendTrainingPlanMail({ to, pdfPath }) {
  if (!to) {
    throw new Error('Recipient email (to) is required');
  }

  if (!pdfPath) {
    throw new Error('pdfPath is required');
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file does not exist at path: ${pdfPath}`);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);

  const msg = {
    to,
    from: {
      email: MAIL_FROM,
      name: 'RUNIQ',
    },
    subject: 'Jouw persoonlijke RUNIQ trainingsschema',
    text: `
Hi!

In de bijlage vind je jouw persoonlijke trainingsschema.
Succes met trainen en veel plezier met RUNIQ 💪

Sportieve groet,
RUNIQ
    `.trim(),
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: 'training-schema.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    console.log('📤 Sending email...');
    console.log('➡️ To:', to);
    console.log('➡️ From:', MAIL_FROM);

    await sgMail.send(msg);

    console.log('✅ Email successfully sent to:', to);
  } catch (err) {
    console.error(
      '❌ SendGrid error:',
      JSON.stringify(err.response?.body || err.message, null, 2)
    );
    throw err;
  }
}

module.exports = {
  sendTrainingPlanMail,
};
