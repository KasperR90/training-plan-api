const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

////////////////////////////////////////////////////
//// LAYOUT
////////////////////////////////////////////////////

const MARGIN = 60;
const CONTENT_WIDTH = 480;

const LABEL_X = MARGIN + 20;
const VALUE_X = MARGIN + CONTENT_WIDTH - 120;

////////////////////////////////////////////////////
//// MAIN GENERATOR
////////////////////////////////////////////////////

function generatePdf(plan){

return new Promise((resolve,reject)=>{

try{

const outputDir = path.join(__dirname,"output");

if(!fs.existsSync(outputDir)){
fs.mkdirSync(outputDir);
}

const fileName = "RUNIQ_5K_Training_Plan.pdf";
const filePath = path.join(outputDir,fileName);

const doc = new PDFDocument({
size:"A4",
margins:{
top:MARGIN,
bottom:MARGIN,
left:MARGIN,
right:MARGIN
}
});

const stream = fs.createWriteStream(filePath);

doc.pipe(stream);

////////////////////////////////////////////////////
//// PAGE FLOW
////////////////////////////////////////////////////

drawCover(doc,plan);

drawProfileAndZones(doc,plan);

drawWeeks(doc,plan);

doc.end();

stream.on("finish",()=>{
resolve({filePath,fileName});
});

stream.on("error",reject);

}catch(err){
reject(err);
}

});

}

////////////////////////////////////////////////////
//// COVER
////////////////////////////////////////////////////

function drawCover(doc,plan){

const coverPath = path.join(__dirname,"cover.png");

const pageWidth = doc.page.width;
const pageHeight = doc.page.height;

doc.image(
coverPath,
0,
0,
{
width:pageWidth,
height:pageHeight
}
);

////////////////////////////////////////////////////
//// BOTTOM BAND
////////////////////////////////////////////////////

const bandHeight = 70;
const bandY = pageHeight - 140;

doc.save();

doc.fillOpacity(0.9);

doc.rect(
0,
bandY,
pageWidth,
bandHeight
).fill("#E5E7EB");

doc.restore();

////////////////////////////////////////////////////
//// TEXT
////////////////////////////////////////////////////

const text = `${plan.meta.weeks} Week Plan • ${plan.meta.frequency} Sessions / Week`;

doc.fillColor("#0F172A")
.fontSize(18)
.font("Helvetica-Bold")
.text(
text,
0,
bandY + 25,
{
align:"center"
}
);

doc.addPage();

}

////////////////////////////////////////////////////
//// PAGE 2
////////////////////////////////////////////////////

function drawProfileAndZones(doc,plan){

////////////////////////////////////////////////////
//// ATHLETE PROFILE
////////////////////////////////////////////////////

doc.fontSize(24)
.fillColor("#0F172A")
.text("Athlete Profile",MARGIN);

doc.moveDown();

const rows = [
["Current 5K Time", plan.meta.currentTime],
["Goal 5K Time", plan.meta.goalTime],
["Weekly Sessions", plan.meta.frequency],
["Plan Duration", `${plan.meta.weeks} weeks`]
];

let y = doc.y;

rows.forEach(row=>{

doc.roundedRect(MARGIN,y,CONTENT_WIDTH,34,6)
.fillAndStroke("#F8FAFC","#E2E8F0");

doc.fillColor("#0F172A")
.fontSize(11)
.text(row[0],LABEL_X,y+10);

doc.text(row[1],VALUE_X,y+10,{
width:120,
align:"right",
lineBreak:false
});

y+=40;

});

doc.moveDown(2);

////////////////////////////////////////////////////
//// TRAINING ZONES
////////////////////////////////////////////////////

doc.fontSize(20)
.fillColor("#0F172A")
.text("Training Zones",MARGIN);

doc.moveDown();

const zoneRows = [
["Easy Pace",plan.zones.easy],
["Threshold Pace",plan.zones.threshold],
["VO2 Pace",plan.zones.vo2],
["Race Pace",plan.zones.race]
];

let zy = doc.y;

zoneRows.forEach(row=>{

doc.roundedRect(MARGIN,zy,CONTENT_WIDTH,34,6)
.fillAndStroke("#F8FAFC","#E2E8F0");

doc.fillColor("#0F172A")
.fontSize(11)
.text(row[0],LABEL_X,zy+10);

doc.text(row[1],VALUE_X,zy+10,{
width:120,
align:"right",
lineBreak:false
});

zy+=40;

});

doc.moveDown(3);

////////////////////////////////////////////////////
//// EXPLANATION
////////////////////////////////////////////////////

doc.fontSize(20)
.fillColor("#0F172A")
.text("How Your Training Zones Were Calculated",MARGIN);

doc.moveDown();

doc.fontSize(11)
.fillColor("#334155")
.text(
"Your personalized training zones are calculated based on your current 5K performance and your goal time. The system estimates your current fitness level and determines the appropriate training intensities needed to gradually progress toward your target performance.",
MARGIN,
doc.y,
{width:CONTENT_WIDTH}
);

doc.moveDown();

doc.text(
"The zones are designed to balance aerobic development, threshold improvement and race-specific preparation. Easy runs build endurance and recovery capacity, threshold sessions improve sustainable speed, and VO2 workouts increase maximal aerobic power.",
MARGIN,
doc.y,
{width:CONTENT_WIDTH}
);

}

////////////////////////////////////////////////////
//// EXPORT
////////////////////////////////////////////////////

module.exports = generatePdf;



////////////////////////////////////////////////////
//// PAGE 3 
////////////////////////////////////////////////////

////////////////////////////////////////////////////
//// WEEK PAGES
////////////////////////////////////////////////////

function drawWeeks(doc,plan){

const workoutColors = {
"Easy Run":"#BBF7D0",
"Threshold":"#FEF08A",
"VO2 Workout":"#FCA5A5",
"Long Run":"#BFDBFE"
};

const coachTips = [
"Consistency is the most important factor during the first phase of training. Focus on completing all sessions at the correct intensity rather than pushing the pace. Easy runs should feel relaxed and conversational, allowing your body to adapt gradually to the workload.",

"This week begins to introduce slightly more intensity. During threshold sessions, focus on controlled breathing and smooth running mechanics. The goal is not maximal effort but sustained, controlled discomfort that improves your lactate threshold.",

"As volume gradually increases, pay close attention to recovery. Sleep, hydration, and nutrition become increasingly important. Long runs should remain controlled and comfortable even as distance increases.",

"By this stage your aerobic system is becoming stronger. Try to maintain consistent pacing during threshold intervals. Avoid starting too fast—controlled pacing is key to building sustainable race fitness.",

"This week may start to feel more demanding. Remember that easy runs are essential recovery tools. Keeping these runs slow allows you to perform better during your quality workouts.",

"Your body is adapting to the training load. Focus on relaxed form during longer efforts. Keep your shoulders relaxed and cadence smooth to maintain efficiency as fatigue builds.",

"This phase of training often produces noticeable improvements. Continue to trust the process and avoid the temptation to run harder than prescribed during easy sessions.",

"As workouts become more race-specific, focus on pacing discipline. Running the correct pace is more important than simply completing the session.",

"Fatigue may accumulate during this phase. Prioritize recovery between sessions and avoid adding unnecessary extra mileage.",

"This week focuses on sharpening your race fitness. Quality sessions should feel controlled but challenging. Stay relaxed and maintain efficient form.",

"Training volume may slightly decrease to allow your body to absorb the training load. Focus on maintaining rhythm and confidence during workouts.",

"This is your final preparation week. Keep runs controlled and avoid unnecessary fatigue. Trust the training you’ve completed and arrive at race day feeling fresh and confident."
];

plan.weeks.forEach((week,index)=>{

doc.addPage();

////////////////////////////////////////////////////
//// WEEK HEADER
////////////////////////////////////////////////////

doc.fontSize(24)
.fillColor("#0F172A")
.text(`Week ${week.week}`,MARGIN);

doc.moveDown();

doc.fontSize(11)
.fillColor("#64748B")
.text(`Focus: ${week.focus}`);

doc.text(`Volume: ${week.volume} km`);

////////////////////////////////////////////////////
//// WEEK LOAD SUMMARY
////////////////////////////////////////////////////

const qualitySessions = week.sessions.filter(s =>
/threshold|vo2|interval/i.test(s.type)
).length;

doc.moveDown(0.5);

doc.fontSize(10)
.fillColor("#94A3B8")
.text(
`Estimated weekly load: ${week.volume} km • ${qualitySessions} quality sessions`
);

doc.moveDown();

////////////////////////////////////////////////////
//// PROGRESS BAR
////////////////////////////////////////////////////

const totalWeeks = plan.meta.weeks || plan.weeks.length;

const progressWidth = CONTENT_WIDTH * (week.week / totalWeeks);

doc.roundedRect(MARGIN,doc.y,CONTENT_WIDTH,8,4)
.fill("#E5E7EB");

doc.roundedRect(MARGIN,doc.y,progressWidth,8,4)
.fill("#7ED6B2");

doc.moveDown(2);

////////////////////////////////////////////////////
//// TABLE HEADER (FIXED ALIGNMENT)
////////////////////////////////////////////////////

const DAY_COL = MARGIN + 12;
const WORKOUT_COL = MARGIN + 110;
const DETAILS_COL = MARGIN + 260;

doc.fontSize(11)
.fillColor("#64748B");

doc.text("Day",DAY_COL,doc.y);
doc.text("Workout",WORKOUT_COL,doc.y);
doc.text("Details",DETAILS_COL,doc.y);

doc.moveDown();

doc.moveTo(MARGIN,doc.y)
.lineTo(MARGIN+CONTENT_WIDTH,doc.y)
.stroke("#E2E8F0");

doc.moveDown();

////////////////////////////////////////////////////
//// SESSIONS
////////////////////////////////////////////////////

let y = doc.y;

week.sessions.forEach(session=>{

const color = workoutColors[session.type] || "#F1F5F9";

doc.roundedRect(MARGIN,y,CONTENT_WIDTH,34,6)
.fillAndStroke("#F8FAFC","#E2E8F0");

doc.rect(MARGIN,y,6,34)
.fill(color);

////////////////////////////////////////////////////
//// PACE ZONE REPLACEMENT
////////////////////////////////////////////////////

let description = session.description;

// Easy pace
description = description.replace(
"easy pace",
`@ ${plan.zones.easy}`
);

// Comfortable pace
description = description.replace(
"comfortable pace",
`@ ${plan.zones.easy}`
);

// Threshold pace
description = description.replace(
"threshold pace",
`@ ${plan.zones.threshold}`
);

// VO2 pace
description = description.replace(
"VO2 pace",
`@ ${plan.zones.vo2}`
);

// Race pace
description = description.replace(
"race pace",
`@ ${plan.zones.race}`
);

// Fix VO2 formatting
if(session.type.includes("VO")){
session.type = "VO2 Workout";
}

if(description.includes("VO")){
description = description.replace("VO", "VO2");
}

if(description.includes("VO2 ,")){
description = description.replace("VO2 ,", "VO2");
}

if(description.includes("VO2 pace")){
description = description.replace("VO2 pace", plan.zones.vo2);
}

doc.fillColor("#0F172A")
.fontSize(11)
.lineGap(1);

doc.text(session.day,DAY_COL,y+11);

doc.text(session.type,WORKOUT_COL,y+11);

doc.text(description,DETAILS_COL,y+11,{
width:CONTENT_WIDTH - 260
});

y += 40;

});

////////////////////////////////////////////////////
//// COACH TIP
////////////////////////////////////////////////////

doc.moveDown(2);

doc.roundedRect(MARGIN,doc.y,CONTENT_WIDTH,90,8)
.fill("#ECFEFF");

doc.fillColor("#0F172A")
.fontSize(11)
.text(
`Coach Tip: ${coachTips[index % coachTips.length]}`,
MARGIN+20,
doc.y+18,
{width:440}
);

});

}


////////////////////////////////////////////////////
//// HELPER
////////////////////////////////////////////////////

function timeToSeconds(time){

if(!time) return 0;

const parts = time.split(":");

return parseInt(parts[0])*60 + parseInt(parts[1]);

}