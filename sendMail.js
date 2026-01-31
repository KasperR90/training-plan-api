const sgMail = require('@sendgrid/mail');
const fs = require('fs');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendTrainingPlanMail({ to, pdfPath }) {
  const pdfBuffer = fs.readFileSync(pdfPath);

  const msg = {
    to,
    from: process.env.MAIL_FROM,
    subject: 'Jouw persoonlijke RUNIQ trainingsschema',
    text: `
Hi!

In de bijlage vind je jouw persoonlijke trainingsschema.
Succes met trainen en veel plezier met RUNIQ 💪

Sportieve groet,
RUNIQ
    `,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: 'training-schema.pdf',
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  };

  await sgMail.send(msg);
}

module.exports = { sendTrainingPlanMail };
