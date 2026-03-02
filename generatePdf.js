// generatePdf.js — RUNIQ 5K Performance Edition (V2 Engine Compatible)

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const LOGO_BASE64 = require('./Base64');

function generatePdf(plan) {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const fileName = `RUNIQ_5K_Training_Plan.pdf`;
      const filePath = path.join(outputDir, fileName);

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 70, bottom: 60, left: 50, right: 50 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* =========================
         FONTS
      ========================= */

      const fontsPath = path.join(__dirname, 'fonts');
      doc.registerFont('Regular', path.join(fontsPath, 'Inter-Regular.otf'));
      doc.registerFont('SemiBold', path.join(fontsPath, 'Inter-SemiBold.otf'));
      doc.registerFont('Bold', path.join(fontsPath, 'Inter-Bold.otf'));

      /* =========================
         COLORS
      ========================= */

      const NAVY = '#06142B';
      const MINT = '#7ED6B2';
      const WHITE = '#FFFFFF';
      const GREY = '#64748B';
      const LIGHT = '#F8FAFC';
      const BORDER = '#E2E8F0';
      const WARNING = '#DC2626';

      const PAGE_WIDTH = doc.page.width;
      const PAGE_HEIGHT = doc.page.height;
      const CONTENT_WIDTH =
        PAGE_WIDTH - doc.page.margins.left - doc.page.margins.right;

      /* =========================
         COVER PAGE
      ========================= */

      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(NAVY);

      const logoBuffer = Buffer.from(LOGO_BASE64, 'base64');
      doc.image(logoBuffer, PAGE_WIDTH / 2 - 150, 120, { fit: [300, 80] });

      doc.moveDown(10);

      doc.font('Bold')
        .fontSize(44)
        .fillColor(WHITE)
        .text('5K', { align: 'center' });

      doc.font('Bold')
        .fontSize(26)
        .fillColor(MINT)
        .text('PERFORMANCE PLAN', { align: 'center' });

      doc.moveDown(2);

      doc.font('Regular')
        .fontSize(14)
        .fillColor('#CBD5E1')
        .text(
          `${plan.meta.weeks} weeks  •  ${plan.meta.frequency} sessions per week`,
          { align: 'center' }
        );

      doc.addPage();

      /* =========================
         ATHLETE OVERVIEW
      ========================= */

      doc.font('Bold').fontSize(18).fillColor(NAVY).text('Athlete Overview');
      doc.moveDown();

      doc.font('Regular').fontSize(12).fillColor('#334155');
      doc.text(`Current 5K Time: ${plan.meta.currentTime}`);
      doc.text(`Goal 5K Time: ${plan.meta.goalTime}`);
      doc.text(`Target Improvement: ${plan.meta.gapPercent}%`);

      if (plan.meta.warning) {
        doc.moveDown();
        doc.fillColor(WARNING).text(plan.meta.warning);
      }

      doc.addPage();

      /* =========================
         TRAINING ZONES
      ========================= */

      doc.font('Bold').fontSize(18).fillColor(NAVY).text('Training Zones');
      doc.moveDown();

      doc.font('Regular').fontSize(12).fillColor('#334155');
      doc.text(`Easy Pace: ${plan.zones.easy} sec/km`);
      doc.text(`Threshold Pace: ${plan.zones.threshold} sec/km`);
      doc.text(`VO2 Pace: ${plan.zones.vo2} sec/km`);
      doc.text(`Race Pace: ${plan.zones.race} sec/km`);

      doc.addPage();

      /* =========================
         WEEK CARDS
      ========================= */

      const colGap = 20;
      const colWidth = (CONTENT_WIDTH - colGap) / 2;
      const cardHeight = 240;

      let xLeft = doc.page.margins.left;
      let xRight = xLeft + colWidth + colGap;
      let y = doc.page.margins.top;

      plan.weeks.forEach((week, index) => {

        const isRight = index % 2 === 1;
        const x = isRight ? xRight : xLeft;

        if (index !== 0 && index % 4 === 0) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        if (index % 2 === 0 && index !== 0) {
          y += cardHeight + 25;
        }

        doc.roundedRect(x, y, colWidth, cardHeight, 12)
          .fillAndStroke(LIGHT, BORDER);

        doc.rect(x, y, colWidth, 38).fill(MINT);

        doc.font('Bold')
          .fontSize(11)
          .fillColor(NAVY)
          .text(`WEEK ${week.week}`, x + 12, y + 12);

        doc.font('Regular')
          .fontSize(9)
          .fillColor('#0F172A')
          .text(`Focus: ${week.focus}`, x + 90, y + 14);

        let innerY = y + 55;

        doc.font('SemiBold')
          .fontSize(10)
          .fillColor(NAVY)
          .text(`Total Volume: ${week.volume} km`, x + 12, innerY);

        innerY += 18;

        week.sessions.forEach((s) => {

          doc.font('SemiBold')
            .fontSize(9)
            .fillColor(NAVY)
            .text(s.type.toUpperCase(), x + 12, innerY);

          doc.font('Regular')
            .fontSize(9)
            .fillColor('#334155')
            .text(
              `${s.totalKm} km`,
              x + colWidth - 50,
              innerY,
              { align: 'right' }
            );

          innerY += 12;

          doc.font('Regular')
            .fontSize(8)
            .fillColor(GREY)
            .text(
              s.description,
              x + 12,
              innerY,
              { width: colWidth - 24 }
            );

          innerY += 20;
        });

      });

      /* =========================
         PAGINATION
      ========================= */

      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        doc.font('Regular')
          .fontSize(9)
          .fillColor('#94A3B8')
          .text(
            `Page ${i + 1} of ${range.count}`,
            0,
            PAGE_HEIGHT - 40,
            { align: 'center' }
          );
      }

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generatePdf;