// sendMail.js
const { Resend } = require('resend');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

const MAIL_FROM = process.env.FROM_EMAIL || 'onboarding@runiq.run';

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
<h1>Your 5K Training Plan is Ready 🏃‍♂️</h1>

<p>Hi,</p>

<p>
  Thank you for your purchase — your personalized <strong>RUNIQ 5K training plan</strong> is ready.
</p>

<p>
  You’ll find your full plan attached as a PDF. This plan is designed to help you train with structure, stay consistent, and perform at your best on race day.
</p>

<h3>What makes this plan effective:</h3>
<ul>
  <li>Progressive weekly structure with built-in recovery</li>
  <li>Training based on pace zones — not guesswork</li>
  <li>Balanced mix of easy runs, threshold sessions, and long runs</li>
  <li>A clear taper phase so you peak at the right moment</li>
</ul>

<h3>How to get the most out of it:</h3>
<ul>
  <li>Focus on consistency over perfection</li>
  <li>Run by effort and pacing, not ego</li>
  <li>Don’t try to “make up” missed sessions</li>
  <li>Listen to your body — adjust when needed</li>
</ul>

<p>
  This plan is built for real-world progress — not just theory. Stick with it, trust the process, and you’ll be surprised how much you improve.
</p>

<p>
  If you have any questions or feedback, just reply to this email — we read everything.
</p>

<p>
  Good luck with your training. We’re rooting for you all the way to the finish line.
</p>

<p>
  <strong>Train smart. Race strong.</strong><br/>
  — RUNIQ
</p>
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