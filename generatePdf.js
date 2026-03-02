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
        margins: { top: 70, bottom: 60, left: 60, right: 60 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* ========================
         COLORS
      ======================== */

      const NAVY = '#06142B';
      const MINT = '#7ED6B2';
      const GREY = '#64748B';
      const LIGHT = '#F1F5F9';
      const BORDER = '#CBD5E1';

      const PAGE_WIDTH = doc.page.width;
      const PAGE_HEIGHT = doc.page.height;
      const CONTENT_WIDTH =
        PAGE_WIDTH - doc.page.margins.left - doc.page.margins.right;

      /* ========================
         COVER PAGE
      ======================== */

      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(NAVY);

      const logoBuffer = Buffer.from(LOGO_BASE64, 'base64');
      doc.image(logoBuffer, PAGE_WIDTH / 2 - 150, 120, { fit: [300, 80] });

      doc.moveDown(8);

      doc.fontSize(42)
        .fillColor('white')
        .text('5K PERFORMANCE PLAN', { align: 'center' });

      doc.moveDown(2);

      doc.fontSize(14)
        .fillColor('#CBD5E1')
        .text(
          `${plan.meta.weeks} weeks • ${plan.meta.frequency} sessions per week`,
          { align: 'center' }
        );

      doc.addPage();

      /* ========================
         ATHLETE OVERVIEW
      ======================== */

      doc.fillColor(NAVY)
        .fontSize(18)
        .text('Athlete Overview', { align: 'center' });

      doc.moveDown();

      doc.fontSize(12).fillColor('#334155');
      doc.text(`Current 5K: ${plan.meta.currentTime}`, { align: 'center' });
      doc.text(`Goal 5K: ${plan.meta.goalTime}`, { align: 'center' });
      doc.text(`Target Improvement: ${plan.meta.gapPercent}%`, { align: 'center' });

      doc.addPage();

      /* ========================
         TRAINING ZONES
      ======================== */

      doc.fontSize(18)
        .fillColor(NAVY)
        .text('Training Zones', { align: 'center' });

      doc.moveDown();

      doc.fontSize(12).fillColor('#334155');
      doc.text(`Easy: ${plan.zones.easy}`, { align: 'center' });
      doc.text(`Threshold: ${plan.zones.threshold}`, { align: 'center' });
      doc.text(`VO2: ${plan.zones.vo2}`, { align: 'center' });
      doc.text(`Race: ${plan.zones.race}`, { align: 'center' });

      doc.addPage();

      /* ========================
         WEEK CARDS — 3 PER PAGE
      ======================== */

      const cardWidth = CONTENT_WIDTH;
      const cardHeight = 200;

      let weeksOnPage = 0;

      plan.weeks.forEach((week, index) => {

        if (weeksOnPage === 3) {
          doc.addPage();
          weeksOnPage = 0;
        }

        const y = doc.y + 20;
        const x = doc.page.margins.left;

        // Card background
        doc.roundedRect(x, y, cardWidth, cardHeight, 12)
          .fillAndStroke(LIGHT, BORDER);

        // Header bar
        doc.rect(x, y, cardWidth, 35)
          .fill(MINT);

        doc.fillColor(NAVY)
          .fontSize(12)
          .text(
            `WEEK ${week.week} — ${week.focus}`,
            x + 15,
            y + 12
          );

        let innerY = y + 50;

        doc.fontSize(11)
          .fillColor(NAVY)
          .text(`Total Volume: ${week.volume} km`, x + 15, innerY);

        innerY += 18;

        week.sessions.forEach(s => {

          doc.fontSize(10)
            .fillColor(NAVY)
            .text(`${s.type} — ${s.totalKm} km`, x + 15, innerY);

          innerY += 12;

          doc.fontSize(9)
            .fillColor(GREY)
            .text(
              s.description,
              x + 15,
              innerY,
              { width: cardWidth - 30 }
            );

          innerY += 18;
        });

        doc.y = y + cardHeight + 10;

        weeksOnPage++;
      });

      /* ========================
         PAGINATION (START PAGE 2)
      ======================== */

      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        if (i === 0) continue; // skip cover

        doc.fontSize(9)
          .fillColor('#94A3B8')
          .text(
            `Page ${i}`,
            0,
            PAGE_HEIGHT - 40,
            { align: 'center' }
          );
      }

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }

  });
}

module.exports = generatePdf;