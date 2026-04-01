// sendMail.js
const { Resend } = require('resend');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

const MAIL_FROM = process.env.FROM_EMAIL || 'onboarding@send.runiq.run';

/* =========================
   Send training plan email
========================= */
async function sendTrainingPlanMail({
  to,
  pdfPath,
  pdfFileName,
  distanceLabel,
}) {
  if (!to) {
    throw new Error('Recipient email address is required');
  }

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found at path: ${pdfPath}`);
  }

  const pdfBuffer = await fs.promises.readFile(pdfPath);

  const subject = `Your RUNIQ ${distanceLabel} Training Plan is Ready`;

  const htmlContent = `
<p>Hi,</p>
<p>Thank you for your purchase — your <strong>${distanceLabel} training plan</strong> is ready.</p>
<p>See attachment.</p>
<p><strong>Train smart, race strong,</strong><br/>RUNIQ</p>
`;

  try {
    console.log('📤 Sending training plan email');
    console.log('➡️ To:', to);

    const response = await resend.emails.send({
      from: `RUNIQ <${MAIL_FROM}>`,
      to,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFileName || 'RUNIQ_Training_Plan.pdf',
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Email sent:', response.id);

  } catch (error) {
    console.error('❌ Resend error:', error);
    throw error;
  }
}


/* =========================
   Send abandoned checkout email
========================= */
async function sendAbandonedEmail({ to, step = 1 }) {

  let subject = "";
  let cta = "https://runiq.run/5k-plan/";

  if (step === 1) subject = "Your 5K plan is ready 👀";
  if (step === 2) subject = "Still thinking about your 5K plan?";
  if (step === 3) subject = "Last chance to start your 5K plan";

  const htmlContent = `
<p>Hey,</p>
<p>Your personalized <strong>5K training plan</strong> is waiting.</p>
<p>
  <a href="${cta}" style="padding:14px 22px;background:#22C58B;color:#fff;border-radius:10px;text-decoration:none;">
    Start my 5K plan →
  </a>
</p>
<p>— RUNIQ</p>
`;

  try {
    await resend.emails.send({
      from: `RUNIQ <${MAIL_FROM}>`,
      to,
      subject,
      html: htmlContent,
    });

  } catch (error) {
    console.error('❌ Resend error:', error);
    throw error;
  }
}

module.exports = {
  sendTrainingPlanMail,
  sendAbandonedEmail,
};