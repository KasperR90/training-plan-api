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
  if (t.includes("easy")) return "Easy Run";

  return type;
}

const phaseMap = {
  base: "Building your endurance base",
  build: "Improving speed & stamina",
  peak: "Sharpening for race day"
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


 //FOCUS TEKST//

function getWeekContent(weekNumber, phase) {

  const baseWeeks = [
    {
      title: "Foundation",
      intro: "This week is about building your aerobic base and creating a consistent running routine.",
      focus: "Consistency > Speed"
    },
    {
      title: "Routine",
      intro: "Your body is adapting to the rhythm. We gradually increase your workload.",
      focus: "Build the habit"
    },
    {
      title: "Endurance",
      intro: "We extend your endurance with slightly longer and steady efforts.",
      focus: "Stay relaxed"
    },
    {
      title: "Stability",
      intro: "Your base is getting stronger. We stabilize volume and reinforce consistency.",
      focus: "Control & rhythm"
    }
  ];

  const buildWeeks = [
    {
      title: "Intensity",
      intro: "We introduce more speed and start working closer to your goal pace.",
      focus: "Controlled intensity"
    },
    {
      title: "Progression",
      intro: "Workouts become more challenging while staying manageable.",
      focus: "Push, but smart"
    },
    {
      title: "Strength",
      intro: "We combine endurance and speed to build race-specific strength.",
      focus: "Strong & steady"
    },
    {
      title: "Peak Build",
      intro: "You are approaching peak fitness. We fine-tune your performance.",
      focus: "Race rhythm"
    }
  ];

  const peakWeeks = [
    {
      title: "Sharpen",
      intro: "We reduce volume while keeping intensity sharp.",
      focus: "Fresh & fast"
    },
    {
      title: "Taper",
      intro: "Your body recovers and stores energy for race day.",
      focus: "Trust the process"
    },
    {
      title: "Race Ready",
      intro: "Everything comes together. You are ready to perform.",
      focus: "Execute with confidence"
    }
  ];

  let pool;

  if (phase === "base") pool = baseWeeks;
  else if (phase === "build") pool = buildWeeks;
  else pool = peakWeeks;

  const index = (weekNumber - 1) % pool.length;

  return pool[index];
}

// TRAINING ZONES

function getZone(plan, zoneKey) {
  if (!plan || !plan.zones) return "—";

  const entry = Object.entries(plan.zones).find(
    ([key]) => key.toLowerCase() === zoneKey.toLowerCase()
  );

  return entry ? entry[1] : "—";
}


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

	// INHOUD PDF
   drawCover(doc, plan);

	// Intro
renderIntroPage(doc, plan);
doc.addPage();

	// Profile
drawProfileAndZones(doc, plan);

	// Training types page
renderTrainingTypesPage(doc, plan);
doc.addPage();

	// Weeks
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

} 

/* =========================
   WELCOME & HOW-TO
========================= */

function renderIntroPage(doc, athlete) {

  drawBackground(doc);
  
  const pageWidth = doc.page.width;
  const margin = MARGIN;
  const width = CONTENT_WIDTH;


  let y = 80;

  // ===== TITLE =====
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor("#FFFFFF")
    .text("Welcome to your 5K Plan", margin, y);

  y += 40;

  // ===== INTRO TEXT =====
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#B0B0B0")
    .text(
      "This isn’t just a schedule. It’s a structured path designed to help you run stronger, faster, and with confidence on race day.",
      margin,
      y,
      { width }
    );

  y += 60;

  // ===== CARD HELPER =====
  function drawCard(title, lines) {
    const cardPadding = 20;
    const cardWidth = CONTENT_WIDTH;
    let cardY = y;

    // Calculate height
    let textHeight = 0;
    lines.forEach(() => {
      textHeight += 16;
    });

    const cardHeight = cardPadding * 2 + 20 + textHeight;

    // Background
    doc.save();
	doc.fillOpacity(0.85);
	doc.roundedRect(margin, cardY, cardWidth, cardHeight, 12)
	.fill(CARD_BG);
    doc.restore();

    // Accent bar
    doc.rect(margin, cardY + 6, 3, cardHeight - 12).fill(ACCENT);

    // Title
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(title, margin + 20, cardY + 15);

    // Content
    let textY = cardY + 40;

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#B0B0B0");

    lines.forEach((line) => {
      doc.text("• " + line, margin + 20, textY);
      textY += 16;
    });

    y += cardHeight + 20;
  }

  // ===== CARDS =====

  drawCard("How this plan works", [
    "Each week builds progressively towards your 5K race",
    "You’ll balance easy runs, quality sessions, and recovery",
    "Consistency matters more than any single workout"
  ]);

  drawCard("How to schedule your week", [
    "Place sessions on days that fit your lifestyle",
    "Avoid stacking hard workouts back-to-back",
    "Keep at least one easy or rest day between quality sessions"
  ]);

  drawCard("What to focus on", [
    "Run easy days truly easy to support recovery",
    "Execute quality sessions with intent, not exhaustion",
    "Trust the process — progress comes from consistency"
  ]);
}


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
   ATHLETE NAME (FOCUS)
========================= */

doc.fillColor(TEXT_SECONDARY)
  .fontSize(10)
  .text("ATHLETE", LEFT, y);

y += 12;

doc.fillColor(TEXT_PRIMARY)
  .fontSize(20)
  .text(plan.meta.name || "Runner", LEFT, y);

y += 30;

/* =========================
   METRIC CARDS (GRID)
========================= */

const CARD_HEIGHT = 50;
const GAP = 10;
const COL_WIDTH = (CONTENT_WIDTH - GAP) / 2;

function drawCard(label, value, x, y) {
  doc.save();
  doc.fillOpacity(0.9);
  doc.roundedRect(x, y, COL_WIDTH, CARD_HEIGHT, 12).fill(CARD_BG);
  doc.restore();

  // 🔥 Accent bar (consistent met rest)
  doc.rect(x, y + 6, 3, CARD_HEIGHT - 12).fill(ACCENT);

  doc.fillColor(TEXT_SECONDARY)
    .fontSize(9)
    .text(label.toUpperCase(), x + 14, y + 10);

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(13)
    .text(value, x + 14, y + 24);
}

/* ROW 1 */
drawCard("Current 5K", plan.meta.currentTime, LEFT, y);
drawCard("Goal 5K", plan.meta.goalTime, LEFT + COL_WIDTH + GAP, y);

y += CARD_HEIGHT + GAP;

/* ROW 2 */
drawCard("Weekly Sessions", `${plan.meta.frequency}`, LEFT, y);
drawCard("Current Weekly Volume", `${plan.meta.startVolume || plan.meta.currentVolume} km`, LEFT + COL_WIDTH + GAP, y);

y += CARD_HEIGHT + GAP;

/* ROW 3 */
drawCard("Duration", `${plan.meta.weeks} weeks`, LEFT, y);

y += CARD_HEIGHT + 30;

 
  /* =========================
     PERFORMANCE INSIGHT
  ========================= */

  doc.fillColor(TEXT_PRIMARY)
    .fontSize(16)
    .text("Performance Insight", LEFT, y);

  y += 20;

  const INSIGHT_HEIGHT = 60;

doc.save();
doc.fillOpacity(0.85);
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, INSIGHT_HEIGHT, 12)
  .fill(CARD_BG);
doc.restore();

// Accent bar
doc.rect(MARGIN, y + 6, 3, INSIGHT_HEIGHT - 12).fill(ACCENT);

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
	doc.roundedRect(LEFT, y, CONTENT_WIDTH, ROW_HEIGHT, 12).fill(CARD_BG);
	doc.restore();

	doc.rect(LEFT, y + 6, 3, ROW_HEIGHT - 12).fill(ACCENT);

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
     TRAINING TYPES PAGE
  ========================= */

function renderTrainingTypesPage(doc, plan) {

  drawBackground(doc);

  const margin = MARGIN;
  const width = CONTENT_WIDTH;
  let y = 70;

  // ===== TITLE =====
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(TEXT_PRIMARY)
    .text("Understanding your training", margin, y);

  y += 40;

  // ===== INTRO =====
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(TEXT_SECONDARY)
    .text(
      "Each session in your plan has a specific purpose. Use your training zones as a guide to execute each workout correctly.",
      margin,
      y,
      { width }
    );

  y += 60;

  function drawCard(title, lines) {

    const PADDING = 16;
    const LINE_HEIGHT = 14;
    const cardWidth = CONTENT_WIDTH;

    const contentHeight = lines.length * LINE_HEIGHT;
    const cardHeight = contentHeight + 40;

    if (y + cardHeight > doc.page.height - 60) {
      doc.addPage();
      drawBackground(doc);
      y = MARGIN;
    }

    // Card bg
    doc.save();
    doc.fillOpacity(0.85);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 12)
      .fill(CARD_BG);
    doc.restore();

    // Accent
    doc.rect(margin, y + 6, 3, cardHeight - 12).fill(ACCENT);

    // Title
    doc.fillColor(TEXT_PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(title, margin + PADDING, y + 12);

    // Content
    let textY = y + 30;

    doc.font("Helvetica")
      .fontSize(11)
      .fillColor(TEXT_PRIMARY);

    lines.forEach(line => {
      doc.text(line, margin + PADDING, textY);
      textY += LINE_HEIGHT;
    });

    y += cardHeight + 12;
  }



// ===== CARDS =====

drawCard("Easy Run", [
  `Zone: ${getZone(plan, "easy")}`,
"",
  "Builds aerobic fitness and supports recovery",
  "Keep effort low and conversational"
]);

drawCard("Long Run", [
  `Zone: ${getZone(plan, "easy")}`,
"",
  "Builds endurance and fatigue resistance",
  "Stay relaxed — duration matters more than pace"
]);

drawCard("Threshold / Tempo Blocks", [
  `Zone: ${getZone(plan, "threshold")}`,
"",
  "Sustained efforts at a challenging but controlled pace",
  "Focus on rhythm, breathing, and control"
]);

drawCard("VO2 Intervals", [
  `Zone: ${getZone(plan, "vo2")}`,
"",
  "Short, intense efforts to improve speed and capacity",
  "Run hard, but maintain good form"
]);

drawCard("Warm-up & drills", [
  "Start every quality session with 10–15 min easy running",
  "Add dynamic drills (e.g. skips, high knees)",
  "Finish with 2–3 short strides"
]);

drawCard("Cooldown", [
  "Finish sessions with 5–10 min easy running",
  "Allow heart rate to gradually decrease",
  "Supports recovery and adaptation"
]);

 }

/* =========================
     RACE DAY PAGE
  ========================= */


function renderRaceDayPage(doc) {

  drawBackground(doc);

  const margin = MARGIN;
  const width = CONTENT_WIDTH;
  let y = 80;

  // ===== TITLE =====
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(TEXT_PRIMARY)
    .text("Race Day Strategy", margin, y);

  y += 40;

  // ===== INTRO =====
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(TEXT_SECONDARY)
    .text(
      "This is where everything comes together. Stay controlled, trust your training, and execute your race with confidence.",
      margin,
      y,
      { width }
    );

  y += 60;

  function drawCard(title, lines) {

    const PADDING = 16;
    const LINE_HEIGHT = 16;
    const cardWidth = CONTENT_WIDTH;

    const contentHeight = lines.length * LINE_HEIGHT;
    const cardHeight = contentHeight + 40;

    // Page safety
    if (y + cardHeight > doc.page.height - 60) {
      doc.addPage();
      drawBackground(doc);
      y = MARGIN;
    }

    // Card bg
    doc.save();
    doc.fillOpacity(0.85);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 12)
      .fill(CARD_BG);
    doc.restore();

    // Accent
    doc.rect(margin, y + 6, 3, cardHeight - 12).fill(ACCENT);

    // Title
    doc.fillColor(TEXT_PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(title, margin + PADDING, y + 12);

    // Content
    let textY = y + 30;

    doc.font("Helvetica")
      .fontSize(11)
      .fillColor(TEXT_PRIMARY);

    lines.forEach(line => {
      doc.text(line, margin + PADDING, textY);
      textY += LINE_HEIGHT;
    });

    y += cardHeight + 16;
  }

  // ===== CARDS =====

  drawCard("Before the race", [
    "Keep your routine simple and familiar",
    "Eat a light, proven pre-race meal",
    "Arrive early and stay relaxed"
  ]);

  drawCard("Warm-up", [
    "10–15 min easy running",
    "Add a few short strides",
    "You should feel ready, not tired"
  ]);

  drawCard("Pacing strategy", [
    "Start controlled — don’t go out too fast",
    "Settle into your goal pace after 1 km",
    "Focus on rhythm and breathing"
  ]);

  drawCard("Final kilometers", [
    "Expect discomfort — this is normal",
    "Stay focused and maintain form",
    "Push when it counts"
  ]);

  drawCard("Mindset", [
    "Trust the work you've done",
    "Stay present, kilometer by kilometer",
    "You are ready for this"
  ]);
}

/* =========================
   WEEKS
========================= */

function drawWeeks(doc, plan) {

  plan.weeks.forEach((week, index) => {

    // 👇 Race Day pagina vóór laatste week
if (index === plan.weeks.length - 1) {
  renderRaceDayPage(doc);
  doc.addPage();
}

    drawBackground(doc);

    const phase = week.phase || "base";
    const change = week.volumeChange ?? 0;

    /* HEADER */

// TITLE
const content = getWeekContent(week.week, phase);

doc.fillColor(TEXT_PRIMARY)
  .font("Helvetica-Bold")
  .fontSize(24)
  .text(`Week ${week.week} — ${content.title}`);

doc.fillColor(ACCENT)
  .fontSize(12)
  .text(phaseMap[phase]);

doc.fillColor(TEXT_SECONDARY)
  .fontSize(11)
  .text(content.intro, {
    width: CONTENT_WIDTH
  });

let y = doc.y + 10;

		// ===== VOLUME BLOCK =====

const VOLUME_HEIGHT = 50;

doc.save();
doc.fillOpacity(0.85);
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, VOLUME_HEIGHT, 12)
  .fill(CARD_BG);
doc.restore();

// Accent bar
doc.rect(MARGIN, y + 6, 3, VOLUME_HEIGHT - 12).fill(ACCENT);

// Volume text
doc.fillColor(TEXT_SECONDARY)
  .fontSize(10)
  .text("WEEKLY VOLUME", MARGIN + 14, y + 10);

// Format delta
const delta = week.volumeChange;
const deltaText =
  delta > 0 ? `+${delta}%` :
  delta < 0 ? `${delta}%` :
  "—";
const deltaColor =
  delta > 0 ? "#7ED6B2" :   // groen
  delta < 0 ? "#F87171" :   // rood (deload)
  TEXT_PRIMARY;

// Main line
doc.fillColor(deltaColor)
  .font("Helvetica-Bold")
  .fontSize(14)
  .text(
    `${week.volume} km (${deltaText})`,
    MARGIN + 14,
    y + 24
  );

y += VOLUME_HEIGHT + 20;


    	/* SESSIONS */

    	doc.moveDown();

	doc.fillColor(TEXT_SECONDARY)
	 .fontSize(12)
	 .text("Your sessions this week:", MARGIN + 16, y);

	y += 28; // 🔥 spacing naar eerste card

	doc.moveDown(0.5);

      week.sessions.forEach((session, i) => {

      const type = normalizeType(session.type);
      const description = session.description || "";
      

/* CARD*/

  
const PADDING = 16;
const LINE_HEIGHT = 16;

const lines = description.split("\n");
const contentHeight = lines.length * LINE_HEIGHT;
const cardHeight = contentHeight + 40;

// 🔥 page check VOOR render
if (y + cardHeight > doc.page.height - 60) {
  doc.addPage();
  drawBackground(doc);
  y = MARGIN;
}

// CARD
doc.save();
doc.fillOpacity(0.85);
doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 12)
  .fill(CARD_BG);
doc.restore();

// ACCENT BAR
doc.rect(MARGIN, y + 6, 3, cardHeight - 12).fill(ACCENT);

// TITLE
doc.fillColor(TEXT_PRIMARY)
  .font("Helvetica-Bold")
  .fontSize(13)
  .text(type, MARGIN + PADDING, y + 12);

// DESCRIPTION
let textY = y + 30;

doc.font("Helvetica")
  .fontSize(11)
  .fillColor(TEXT_PRIMARY);

lines.forEach(line => {
  doc.text(line, MARGIN + PADDING, textY);
  textY += LINE_HEIGHT;
});

// spacing
y += cardHeight + 16;

  });

 if (index < plan.weeks.length - 1) {
      doc.addPage();
    }

  });

}

/* =========================
   EXPORT
========================= */

module.exports = generatePdf;