// sendMail.js
const sgMail = require('@sendgrid/mail');
const fs = require('fs');

/* =========================
   Config & safety checks
========================= */
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'info@runiq.run';

if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(SENDGRID_API_KEY);

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

  const pdfBuffer = fs.readFileSync(pdfPath);

  const subject = `Your RUNIQ ${distanceLabel} Training Plan is Ready`;

  const textContent = `
Hi,

Thank you for your purchase — your personalized RUNIQ training plan is ready.

Attached to this email you’ll find your ${distanceLabel} training plan as a PDF.
This plan is built to help you train smarter, stay consistent, and arrive at race day confident and prepared.

What to expect:
• Structured weekly progression with recovery and taper phases
• Training by pace zones instead of rigid paces
• Clear guidance for race week
• A plan designed for long-term improvement, not short-term overload

How to use the plan:
• Focus on effort and pace zones rather than exact speed
• If you miss a session, do not try to “make up” for it
• Listen to your body — consistency beats perfection
• Trust the process and enjoy the journey

If you have any questions, feedback, or ideas for improvement, feel free to reply to this email.

Good luck with your training — we’re cheering for you all the way to the finish line.

Train smart, race strong,
RUNIQ
`.trim();

  const htmlContent = `
<p>Hi,</p>

<p>
  Thank you for your purchase — your personalized <strong>RUNIQ training plan</strong> is ready.
</p>

<p>
  Attached to this email you’ll find your <strong>${distanceLabel} training plan</strong> as a PDF.
  This plan is designed to help you train smarter, stay consistent, and arrive at race day confident and prepared.
</p>

<p><strong>What to expect:</strong></p>
<ul>
  <li>Structured weekly progression with recovery and taper phases</li>
  <li>Training by pace zones instead of rigid paces</li>
  <li>Clear guidance for race week</li>
  <li>A plan focused on sustainable improvement</li>
</ul>

<p><strong>How to use the plan:</strong></p>
<ul>
  <li>Focus on effort and pace zones rather than exact speed</li>
  <li>If you miss a session, do not try to compensate</li>
  <li>Listen to your body — consistency beats perfection</li>
  <li>Trust the process and enjoy the journey</li>
</ul>

<p>
  If you have any questions, feedback, or ideas for improvement, simply reply to this email —
  we’d love to hear from you.
</p>

<p>
  Good luck with your training. We’re cheering for you all the way to the finish line.
</p>

<p>
  <strong>Train smart, race strong,</strong><br />
  RUNIQ
</p>
`;

  const msg = {
    to,
    from: {
      email: MAIL_FROM,
      name: 'RUNIQ',
    },
    subject,
    text: textContent,
    html: htmlContent,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: pdfFileName || 'RUNIQ_Training_Plan.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    console.log('📤 Sending training plan email');
    console.log('➡️ To:', to);
    console.log('➡️ Attachment:', pdfFileName);

    await sgMail.send(msg);

    console.log('✅ Email successfully sent to:', to);
  } catch (error) {
    console.error(
      '❌ SendGrid error:',
      JSON.stringify(error.response?.body || error.message, null, 2)
    );
    throw error;
  }
}


/* =========================
   Send abandoned checkout email
========================= */
async function sendAbandonedEmail({ to, step = 1 }) {

  let subject = "";
  let cta = "https://runiq.run/5k-plan/";

  if (step === 1) {
    subject = "Your 5K plan is ready 👀";
  }

  if (step === 2) {
    subject = "Still thinking about your 5K plan?";
  }

  if (step === 3) {
    subject = "Last chance to start your 5K plan";
  }

  const htmlContent = `
<p>Hey,</p>

<p>Your personalized <strong>5K training plan</strong> is waiting.</p>

<p>
Most runners never follow a structured plan.<br/>
That’s exactly why they don’t improve.
</p>

<p>You’re already ahead.</p>

<p>
  <a href="${cta}"
     style="display:inline-block;padding:14px 22px;background:#22C58B;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;">
     Start my 5K plan →
  </a>
</p>

<p style="margin-top:20px;font-size:12px;color:#888;">
  Instant access • €19 • 30-day guarantee
</p>

<p>— RUNIQ</p>
`;

  const msg = {
    to,
    from: {
      email: MAIL_FROM,
      name: 'RUNIQ',
    },
    subject,
    html: htmlContent,
  };

  await sgMail.send(msg);
}


module.exports = {
  sendTrainingPlanMail,
  sendAbandonedEmail,
};