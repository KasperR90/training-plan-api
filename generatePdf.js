// generatePdf.js
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
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        bufferPages: true
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* =========================
         FONTS
      ========================= */

      const fontsPath = path.join(__dirname, 'fonts');
      doc.registerFont('Inter-Regular', path.join(fontsPath, 'Inter-Regular.otf'));
      doc.registerFont('Inter-SemiBold', path.join(fontsPath, 'Inter-SemiBold.otf'));
      doc.registerFont('Inter-Bold', path.join(fontsPath, 'Inter-Bold.otf'));

      /* =========================
         DESIGN SYSTEM
      ========================= */

      const COLORS = {
        dark: '#0B1320',
        accent: '#0A84FF',
        muted: '#6B7280',
        lightBorder: '#E5E7EB',
        raceBg: '#F5F9FF'
      };

      const SPACING = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32
      };

      const CONTENT_WIDTH =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      /* =========================
         COVER PAGE
      ========================= */

      const logoBuffer = Buffer.from(LOGO_BASE64, 'base64');

      doc.image(logoBuffer, doc.page.width / 2 - 90, 120, {
        fit: [180, 80]
      });

      doc.moveDown(8);

      doc
        .font('Inter-Bold')
        .fontSize(32)
        .fillColor(COLORS.dark)
        .text(`${plan.meta.distanceLabel} Training Plan`, {
          align: 'center'
        });

      doc.moveDown(1);

      doc
        .font('Inter-Regular')
        .fontSize(14)
        .fillColor(COLORS.muted)
        .text(`Duration: ${plan.meta.weeks} weeks`, { align: 'center' })
        .text(`Sessions per week: ${plan.meta.sessionsPerWeek}`, { align: 'center' })
        .text(`Goal time: ${plan.meta.goalTime}`, { align: 'center' });

      doc.moveDown(2);

      // Accent divider
      doc
        .moveTo(doc.page.margins.left + 100, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right - 100, doc.y)
        .lineWidth(2)
        .strokeColor(COLORS.accent)
        .stroke();

      doc.moveDown(2);

      doc
        .font('Inter-SemiBold')
        .fontSize(12)
        .fillColor(COLORS.accent)
        .text('Train smart. Race strong.', { align: 'center' });

      doc.addPage();

      /* =========================
         WEEK PAGES
      ========================= */

      plan.weeks.forEach((week, weekIndex) => {
        // Week title
        doc
          .font('Inter-Bold')
          .fontSize(20)
          .fillColor(COLORS.dark)
          .text(`Week ${week.week}`, { continued: true });

        doc
          .font('Inter-SemiBold')
          .fontSize(14)
          .fillColor(COLORS.muted)
          .text(`  (${week.phase.toUpperCase()})`);

        doc.moveDown(0.5);

        // Divider
        doc
          .lineWidth(1)
          .strokeColor(COLORS.lightBorder)
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown(1);

        doc
          .font('Inter-Regular')
          .fontSize(12)
          .fillColor(COLORS.accent)
          .text(`Total distance: ${week.total_km} km`);

        doc.moveDown(1.5);

        /* Sessions */

        week.sessions.forEach((session, index) => {
          const isRace = session.type === 'race';

          if (isRace) {
            const boxHeight = 60;

            doc
              .roundedRect(
                doc.page.margins.left,
                doc.y,
                CONTENT_WIDTH,
                boxHeight,
                8
              )
              .fillAndStroke(COLORS.raceBg, COLORS.accent);

            doc
              .fillColor(COLORS.dark)
              .font('Inter-Bold')
              .fontSize(13)
              .text(
                `🏁 RACE — ${session.distance_km} km`,
                doc.page.margins.left + 15,
                doc.y - boxHeight + 15
              );

            doc
              .font('Inter-Regular')
              .fontSize(11)
              .fillColor(COLORS.muted)
              .text(
                session.description,
                doc.page.margins.left + 15,
                doc.y - boxHeight + 35,
                { width: CONTENT_WIDTH - 30 }
              );

            doc.moveDown(2);
          } else {
            doc
              .font('Inter-SemiBold')
              .fontSize(13)
              .fillColor(COLORS.dark)
              .text(
                `${index + 1}. ${session.type.toUpperCase()} — ${session.distance_km} km`
              );

            doc.moveDown(0.3);

            doc
              .font('Inter-Regular')
              .fontSize(11)
              .fillColor(COLORS.muted)
              .text(session.description, {
                width: CONTENT_WIDTH
              });

            doc.moveDown(1);
          }

          // Prevent overflow
          if (doc.y > doc.page.height - 120) {
            doc.addPage();
          }
        });

        if (weekIndex < plan.weeks.length - 1) {
          doc.addPage();
        }
      });

      /* =========================
         FOOTER + PAGE NUMBERS
      ========================= */

      const range = doc.bufferedPageRange();

      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        doc
          .font('Inter-Regular')
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(
            `Generated by RUNIQ — Structured endurance training built for long-term progress.`,
            0,
            doc.page.height - 60,
            { align: 'center' }
          );

        doc
          .fontSize(9)
          .text(
            `Page ${i + 1} of ${range.count}`,
            0,
            doc.page.height - 45,
            { align: 'center' }
          );
      }

      doc.end();

      stream.on('finish', () => {
        resolve({
          filePath,
          fileName
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generatePdf;