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
async function sendAbandonedEmail({ to }) {
  if (!to) {
    throw new Error('Recipient email address is required');
  }

  const subject = "Your 5K plan is ready 👀";

  const textContent = `
Hey,

You started creating your personalized 5K training plan, but didn’t finish yet.

Your plan is ready and tailored to your goal.

Most runners never follow a structured plan.
That’s exactly why they don’t improve.

You’re already ahead.

Start your plan here:
https://runiq.run/5k-plan/

— RUNIQ
`.trim();

  const htmlContent = `
<p>Hey,</p>

<p>
  You started creating your personalized <strong>5K training plan</strong>, 
  but didn’t finish yet.
</p>

<p>
  Your plan is ready and tailored to your goal.
</p>

<p>
  Most runners never follow a structured plan.<br/>
  That’s exactly why they don’t improve.
</p>

<p>
  You’re already ahead.
</p>

<p>
  <a href="https://runiq.run/5k-plan/"
     style="display:inline-block;padding:14px 22px;background:#22C58B;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;">
     Start my 5K plan →
  </a>
</p>

<p style="margin-top:20px;font-size:12px;color:#888;">
  Instant access • 30-day guarantee
</p>

<p>
  — RUNIQ
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
  };

  try {
    console.log('📤 Sending abandoned email to:', to);
    await sgMail.send(msg);
    console.log('✅ Abandoned email sent');
  } catch (error) {
    console.error(
      '❌ SendGrid error:',
      JSON.stringify(error.response?.body || error.message, null, 2)
    );
    throw error;
  }
}



module.exports = {
  sendTrainingPlanMail,
  sendAbandonedEmail,
};