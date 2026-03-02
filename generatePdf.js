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
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        bufferPages: true
      });

      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      /* ========= SIMPLE CLEAN LAYOUT ========= */

      const PAGE_WIDTH = doc.page.width;

      // COVER
      doc.fontSize(28).text('RUNIQ 5K PERFORMANCE PLAN', {
        align: 'center'
      });

      doc.addPage();

      // OVERVIEW
      doc.fontSize(16).text('Athlete Overview', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Current: ${plan.meta.currentTime}`, { align: 'center' });
      doc.text(`Goal: ${plan.meta.goalTime}`, { align: 'center' });
      doc.text(`Improvement: ${plan.meta.gapPercent}%`, { align: 'center' });

      doc.addPage();

      // ZONES
      doc.fontSize(16).text('Training Zones', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Easy: ${plan.zones.easy}`, { align: 'center' });
      doc.text(`Threshold: ${plan.zones.threshold}`, { align: 'center' });
      doc.text(`VO2: ${plan.zones.vo2}`, { align: 'center' });
      doc.text(`Race: ${plan.zones.race}`, { align: 'center' });

      doc.addPage();

      // WEEKS (3 per page)
      let weekCounter = 0;

      plan.weeks.forEach((week, index) => {

        if (weekCounter === 3) {
          doc.addPage();
          weekCounter = 0;
        }

        doc.moveDown();
        doc.fontSize(14).text(
          `Week ${week.week} — ${week.focus}`,
          { align: 'center' }
        );

        doc.moveDown(0.5);
        doc.fontSize(11).text(
          `Total Volume: ${week.volume} km`,
          { align: 'center' }
        );

        doc.moveDown();

        week.sessions.forEach(s => {
          doc.fontSize(11).text(
            `${s.type} — ${s.totalKm} km`,
            { align: 'center' }
          );
          doc.fontSize(10).text(
            s.description,
            { align: 'center' }
          );
          doc.moveDown(0.5);
        });

        doc.moveDown();
        weekCounter++;
      });

      /* ========= PAGINATION FIX ========= */

      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        if (i === 0) continue;

        doc.fontSize(9)
          .text(
            `Page ${i}`,
            0,
            doc.page.height - 40,
            { align: 'center' }
          );
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      writeStream.on('error', reject);

    } catch (err) {
      reject(err);
    }

  });
}

module.exports = generatePdf;