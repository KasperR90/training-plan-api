const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
console.clear();

/* =========================
   LAYOUT
========================= */

const MARGIN = 60;
const CONTENT_WIDTH = 480;

/* =========================
   COLORS (DARK THEME)
========================= */

const TEXT_PRIMARY = "#FFFFFF";
const TEXT_SECONDARY = "#CBD5E1";
const ACCENT = "#7ED6B2";
const CARD_BG = "#1E293B";

/* =========================
   HELPERS
========================= */

function normalizeType(type) {
  if (!type) return "";
  const t = type.toLowerCase();

  if (t.includes("vo2")) return "VO2 Workout";
  if (t.includes("long")) return "Long Run";
  if (t.includes("easy")) return "Easy Run";

  return type;
}

const phaseMap = {
  base: "Building your endurance base",
  build: "Improving speed & stamina",
  peak: "Sharpening for race day"
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* =========================
   BACKGROUND
========================= */

function drawBackground(doc) {
  const bgPath = path.join(__dirname, "bg-gradient.png");

  doc.image(bgPath, 0, 0, {
    width: doc.page.width,
    height: doc.page.height
  });
}

/* =========================
   MAIN
========================= */

function generatePdf(plan) {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.join(__dirname, "output");

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const fileName = "RUNIQ_5K_Training_Plan.pdf";
      const filePath = path.join(outputDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      drawCover(doc, plan);
      drawProfileAndZones(doc, plan);
      drawWeeks(doc, plan);

      doc.end();

      const { exec } = require("child_process");

stream.on("finish", () => {

  console.log("✅ PDF created:", filePath);

  // 🔥 opent automatisch
  exec(`start "" "${filePath}"`);

  resolve({ filePath, fileName });

});

      stream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
}


/* =========================
   COVERPAGE
========================= */


function drawCover(doc, plan) {

  const coverPath = path.join(__dirname, "cover.png");
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  /* BACKGROUND IMAGE */

  doc.image(coverPath, 0, 0, {
    width: pageWidth,
    height: pageHeight
  });

  /* DARK OVERLAY (voor contrast) */

  doc.save();
  doc.fillOpacity(0.15);
  doc.rect(0, 0, pageWidth, pageHeight).fill("#000000");
  doc.restore();

  /* INFO BAND */

  const bandY = pageHeight - 140;

  doc.save();

  doc.fillOpacity(0.65);
  doc.roundedRect(40, bandY, pageWidth - 80, 80, 12)
    .fill("#1E293B");

  doc.restore();

  /* BAND CONTENT */

  const colWidth = (pageWidth - 80) / 3;

  const items = [
    ["Duration", `${plan.meta.weeks} weeks`],
    ["Frequency", `${plan.meta.frequency} runs/week`],
    ["Goal", plan.meta.goalTime]
  ];

  items.forEach((item, i) => {

    const x = 40 + i * colWidth;

    doc.fillColor("#CBD5E1")
      .fontSize(11)
      .text(item[0], x, bandY + 18, {
        width: colWidth,
        align: "center"
      });

    doc.fillColor("#FFFFFF")
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(item[1], x, bandY + 38, {
        width: colWidth,
        align: "center"
      });

  });

   const bandHeight = 80;

doc.fillColor("#94A3B8")
  .fontSize(10)
  .text(
    "Built specifically for your current level and goal",
    40,
    bandY + 65,
    { width: pageWidth - 80, align: "center" }
  );

doc.addPage();

} // 🔥 DEZE ONTBREEKT → sluit drawCover

/* =========================
   PROFILE + ZONES
========================= */

function drawProfileAndZones(doc, plan) {

  drawBackground(doc);

  /* =========================
     GRID SYSTEM
  ========================= */

  const LEFT = MARGIN;
  const RIGHT = MARGIN + CONTENT_WIDTH;
  const CENTER = MARGIN + CONTENT_WIDTH / 2;

  const CARD_PADDING_X = 15;
  const CARD_PADDING_Y = 10;

  let y = MARGIN;

  /* =========================
     TITLE
  ========================= */

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(24)
    .text("Athlete Profile", LEFT, y);

  y += 40;

  /* =========================
     SNAPSHOT CARD
  ========================= */

  const SNAP_HEIGHT = 70;

  doc.save();
  doc.fillOpacity(0.9);
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, SNAP_HEIGHT, 12).fill(CARD_BG);
  doc.restore();

  const snapY = y + CARD_PADDING_Y;

  // Athlete
  doc.fillColor(TEXT_SECONDARY)
    .fontSize(10)
    .text("ATHLETE", LEFT + CARD_PADDING_X, snapY);

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(14)
    .text(plan.meta.name || "Runner", LEFT + CARD_PADDING_X, snapY + 14);

  // Goal
  doc.fillColor(TEXT_SECONDARY)
    .fontSize(10)
    .text("GOAL", CENTER - 60, snapY);

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(14)
    .text(`Sub ${plan.meta.goalTime}`, CENTER - 60, snapY + 14);

  // Plan
  doc.fillColor(TEXT_SECONDARY)
    .fontSize(10)
    .text("PLAN", RIGHT - 100, snapY);

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(14)
    .text(`${plan.meta.weeks} weeks`, RIGHT - 100, snapY + 14, {
      width: 80,
      align: "right"
    });

  y += SNAP_HEIGHT + 30;

  /* =========================
     PERFORMANCE INSIGHT
  ========================= */

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(16)
    .text("Performance Insight", LEFT, y);

  y += 20;

  const INSIGHT_HEIGHT = 60;

  doc.roundedRect(LEFT, y, CONTENT_WIDTH, INSIGHT_HEIGHT, 10)
    .fill("#0F172A");

  const insightText =
    plan.meta.insight ||
    "You have a solid aerobic base and strong potential to improve your 5K performance significantly within this cycle.";

  doc.fillColor(TEXT_SECONDARY)
    .fontSize(12)
    .text(
      insightText,
      LEFT + CARD_PADDING_X,
      y + 18,
      { width: CONTENT_WIDTH - CARD_PADDING_X * 2 }
    );

  y += INSIGHT_HEIGHT + 30;

  /* =========================
     PROGRESS
  ========================= */

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(16)
    .text("Projected Progress", LEFT, y);

  y += 20;

  const PROGRESS_HEIGHT = 60;

  doc.save();
  doc.fillOpacity(0.9);
  doc.roundedRect(LEFT, y, CONTENT_WIDTH, PROGRESS_HEIGHT, 10)
    .fill(CARD_BG);
  doc.restore();

  const progY = y + 18;

  // Current
  doc.fillColor(TEXT_SECONDARY)
    .fontSize(10)
    .text("CURRENT", LEFT + CARD_PADDING_X, progY - 10);

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(16)
    .text(plan.meta.currentTime, LEFT + CARD_PADDING_X, progY);

  // Arrow PERFECT CENTER
  doc.fillColor(ACCENT)
    .fontSize(18)
    .text("→", CENTER - 5, progY);

  // Goal
  doc.fillColor(TEXT_SECONDARY)
    .fontSize(10)
    .text("GOAL", RIGHT - 100, progY - 10, {
      width: 80,
      align: "right"
    });

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(16)
    .text(plan.meta.goalTime, RIGHT - 100, progY, {
      width: 80,
      align: "right"
    });

  y += PROGRESS_HEIGHT + 30;

  /* =========================
     TRAINING ZONES
  ========================= */

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(18)
    .text("Training Zones", LEFT, y);

  y += 20;

  Object.entries(plan.zones).forEach(([key, value]) => {

    const labelMap = {
      zone1: "Easy",
      zone2: "Endurance",
      zone3: "Tempo",
      zone4: "Threshold",
      zone5: "Interval"
    };

    const label = labelMap[key.toLowerCase()] || "";

    const ROW_HEIGHT = 32;

    doc.save();
    doc.fillOpacity(0.85);
    doc.roundedRect(LEFT, y, CONTENT_WIDTH, ROW_HEIGHT, 8).fill(CARD_BG);
    doc.restore();

    // Zone name
    doc.fillColor(TEXT_SECONDARY)
      .fontSize(10)
      .text(key.toUpperCase(), LEFT + CARD_PADDING_X, y + 9);

    // Label (center-ish)
    doc.fillColor(TEXT_PRIMARY)
      .fontSize(11)
      .text(label, LEFT + 110, y + 9);

    // Pace (right aligned)
    doc.fillColor(TEXT_PRIMARY)
      .text(value, RIGHT - 100, y + 9, {
        width: 80,
        align: "right"
      });

    y += ROW_HEIGHT + 12;

  });

  doc.addPage();
}

/* =========================
   WEEKS
========================= */

function drawWeeks(doc, plan) {

  plan.weeks.forEach((week, index) => {

    drawBackground(doc);

    const phase = week.phase || "base";
    const change = week.volumeChange ?? 0;

    /* HEADER */

    doc.fillColor(TEXT_PRIMARY)
  .fontSize(26)
  .text(`Week ${week.week}`);

doc.fillColor(ACCENT)
  .fontSize(12)
  .text(phaseMap[phase]);

doc.fillColor(TEXT_SECONDARY)
  .text(
    `Volume: ${week.volume} km (${change > 0 ? '+' : ''}${change}%)`
  );	




    /* SESSIONS */

    doc.moveDown();

	doc.fillColor(TEXT_SECONDARY)
 	 .fontSize(10)
 	 .text("Your sessions this week:");

	doc.moveDown(0.5);

        let y = doc.y;

    week.sessions.forEach((session, i) => {

      const type = normalizeType(session.type);
      const description = session.description || "";
      const purpose = session.purpose || "";

      const DETAILS_WIDTH = CONTENT_WIDTH - 40;

      const descHeight = doc.heightOfString(description, {
        width: DETAILS_WIDTH
      });

      const purposeHeight = doc.heightOfString(purpose, {
        width: DETAILS_WIDTH
      });

      const ROW_HEIGHT = descHeight + purposeHeight + 50;

      /* CARD */

      doc.save();
      doc.fillOpacity(0.85);

      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT, 12)
        .fill(CARD_BG);

      doc.restore();

      /* ACCENT BAR */

      doc.rect(MARGIN, y + 4, 3, ROW_HEIGHT - 8).fill(ACCENT);

      /* TEXT */

      doc.fillColor(TEXT_PRIMARY)
        .fontSize(12)
        .text(`${days[i % 7]} — ${type}`, MARGIN + 12, y + 10);

      doc.fontSize(11)
        .text(description, MARGIN + 12, y + 28, {
          width: DETAILS_WIDTH
        });

      doc.fillColor(TEXT_SECONDARY)
        .fontSize(10)
        .text(
          `→ ${purpose}`,
          MARGIN + 12,
          y + 28 + descHeight + 6,
          { width: DETAILS_WIDTH }
        );

      y += ROW_HEIGHT + 12;

      if (y + ROW_HEIGHT > doc.page.height - 60) {
  doc.addPage();
  drawBackground(doc);
  y = MARGIN;
}

    });

    doc.addPage();

  });

}

/* =========================
   EXPORT
========================= */

module.exports = generatePdf;