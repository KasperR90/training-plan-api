// generatePdf.js — RUNIQ Performance Edition

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

      const fileName = `RUNIQ_${plan.meta.distanceLabel}_Training_Plan.pdf`;
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
         BRAND COLORS
      ========================= */

      const NAVY = '#06142B';
      const MINT = '#7ED6B2';
      const WHITE = '#FFFFFF';
      const GREY = '#94A3B8';
      const BORDER = '#1E293B';

      const PAGE_WIDTH = doc.page.width;
      const PAGE_HEIGHT = doc.page.height;
      const CONTENT_WIDTH =
        PAGE_WIDTH - doc.page.margins.left - doc.page.margins.right;

      /* =========================
         COVER PAGE
      ========================= */

      // Full background
      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(NAVY);

      const logoBuffer = Buffer.from(LOGO_BASE64, 'base64');

      doc.image(logoBuffer, PAGE_WIDTH / 2 - 150, 120, {
        fit: [300, 80]
      });

      doc.moveDown(10);

      doc.font('Bold')
        .fontSize(44)
        .fillColor(WHITE)
        .text(`${plan.meta.distanceLabel}`, {
          align: 'center'
        });

      doc.font('Bold')
        .fontSize(26)
        .fillColor(MINT)
        .text('TRAINING PLAN', { align: 'center' });

      doc.moveDown(2);

      doc.font('Regular')
        .fontSize(14)
        .fillColor(GREY)
        .text(
          `${plan.meta.weeks} weeks  •  ${plan.meta.sessionsPerWeek} sessions per week  •  Goal: ${plan.meta.goalTime}`,
          { align: 'center' }
        );

      doc.moveDown(3);

      doc.font('SemiBold')
        .fontSize(16)
        .fillColor(WHITE)
        .text('Train smarter. Automatically.', { align: 'center' });

      doc.addPage();

      /* =========================
         PERFORMANCE GRID LAYOUT
      ========================= */

      const colGap = 20;
      const colWidth = (CONTENT_WIDTH - colGap) / 2;
      const cardHeight = 220;

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

        /* Card Background */

        doc.roundedRect(x, y, colWidth, cardHeight, 12)
          .fillAndStroke('#0F1F3D', BORDER);

        /* Header */

        doc.rect(x, y, colWidth, 36)
          .fill(MINT);

        doc.font('Bold')
          .fontSize(12)
          .fillColor(NAVY)
          .text(
            `WEEK ${week.week} — ${week.phase.toUpperCase()}`,
            x + 12,
            y + 10
          );

        let innerY = y + 50;

        doc.font('SemiBold')
          .fontSize(10)
          .fillColor(MINT)
          .text(`Total: ${week.total_km} km`, x + 12, innerY);

        innerY += 18;

        /* Sessions Table */

        week.sessions.forEach((s) => {
          const isRace = s.type === 'race';

          doc.font('SemiBold')
            .fontSize(9)
            .fillColor(isRace ? MINT : WHITE)
            .text(
              `${s.type.toUpperCase()}`,
              x + 12,
              innerY
            );

          doc.font('Regular')
            .fontSize(9)
            .fillColor(GREY)
            .text(
              `${s.distance_km} km`,
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

          innerY += 18;
        });
      });

      /* =========================
         PAGINATION (CORRECT FIX)
      ========================= */

      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        doc.font('Regular')
          .fontSize(9)
          .fillColor('#CBD5E1')
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