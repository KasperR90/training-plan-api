const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const LOGO_BASE64 = require("./Base64");

function generatePdf(plan){

return new Promise((resolve,reject)=>{

try{

const outputDir = path.join(__dirname,"output");
if(!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const fileName="RUNIQ_5K_Training_Plan.pdf";
const filePath=path.join(outputDir,fileName);

const doc=new PDFDocument({
size:"A4",
margins:{top:70,bottom:60,left:60,right:60}
});

const stream=fs.createWriteStream(filePath);
doc.pipe(stream);

////////////////////////////////////////////////////
//// COLORS
////////////////////////////////////////////////////

const NAVY="#06142B";
const GREY="#CBD5E1";
const LIGHT="#F1F5F9";
const BORDER="#CBD5E1";
const MINT="#7ED6B2";
const ORANGE="#F59E0B";
const TEXT="#475569";

const PAGE_WIDTH=doc.page.width;
const PAGE_HEIGHT=doc.page.height;

const CONTENT_WIDTH=
PAGE_WIDTH-doc.page.margins.left-doc.page.margins.right;

const logoBuffer=Buffer.from(LOGO_BASE64,"base64");

////////////////////////////////////////////////////
//// BACKGROUND
////////////////////////////////////////////////////

function drawBackground(){

doc.save();

doc.rect(
0,
0,
PAGE_WIDTH,
PAGE_HEIGHT
).fill(NAVY);

doc.restore();

}

////////////////////////////////////////////////////
//// COVER
////////////////////////////////////////////////////

drawBackground();

doc.image(logoBuffer,PAGE_WIDTH/2-140,140,{fit:[280,70]});

doc.fillColor("white")
.fontSize(36)
.text("5K PERFORMANCE BLUEPRINT",0,260,{align:"center"});

doc.moveDown();

doc.fontSize(14)
.fillColor("#CBD5E1")
.text(`${plan.meta.weeks} Week Plan • ${plan.meta.frequency} Sessions / Week`,{align:"center"});

////////////////////////////////////////////////////
//// ATHLETE PROFILE
////////////////////////////////////////////////////

doc.addPage();
drawBackground();

doc.fillColor("white")
.fontSize(22)
.text("Athlete Profile");

doc.moveDown();

doc.fontSize(12)
.fillColor(GREY);

doc.text(`Current 5K Time: ${plan.meta.currentTime}`);
doc.text(`Goal 5K Time: ${plan.meta.goalTime}`);
doc.text(`Target Improvement: ${plan.meta.gapPercent}%`);

if(plan.meta.warning){
doc.moveDown();
doc.fillColor("#FCA5A5").text(plan.meta.warning);
}

////////////////////////////////////////////////////
//// TRAINING ZONES
////////////////////////////////////////////////////

doc.addPage();
drawBackground();

doc.fillColor("white")
.fontSize(22)
.text("Training Zones");

doc.moveDown();

doc.fontSize(12)
.fillColor(GREY);

doc.text(`Easy Pace: ${plan.zones.easy}`);
doc.text(`Threshold Pace: ${plan.zones.threshold}`);
doc.text(`VO2 Pace: ${plan.zones.vo2}`);
doc.text(`Race Pace: ${plan.zones.race}`);

////////////////////////////////////////////////////
//// HOW TO USE PLAN
////////////////////////////////////////////////////

doc.addPage();
drawBackground();

doc.fillColor("white")
.fontSize(22)
.text("How to Use This Plan");

doc.moveDown();

doc.fontSize(11)
.fillColor(GREY)
.text("Easy runs should feel relaxed and conversational.");
doc.text("Threshold workouts should feel comfortably hard.");
doc.text("VO2 workouts develop maximal aerobic capacity.");
doc.text("Long runs build endurance and durability.");

////////////////////////////////////////////////////
//// WEEKLY PLAN
////////////////////////////////////////////////////

for(let i=0;i<plan.weeks.length;i+=2){

doc.addPage();
drawBackground();

const left=plan.weeks[i];
const right=plan.weeks[i+1];

const colWidth=CONTENT_WIDTH/2-20;

drawWeek(doc,left,doc.page.margins.left,colWidth);

if(right){
drawWeek(
doc,
right,
doc.page.margins.left+colWidth+40,
colWidth
);
}

}

doc.end();

stream.on("finish",()=>resolve({filePath,fileName}));
stream.on("error",reject);

}catch(err){
reject(err);
}

});

}

////////////////////////////////////////////////////
//// COACH TIP ENGINE
////////////////////////////////////////////////////

function getCoachTip(week){

if(week.focus.includes("Aerobic"))
return "Focus on building aerobic endurance. Keep easy runs relaxed.";

if(week.focus.includes("Threshold"))
return "Threshold workouts improve sustained speed. Try to keep intervals evenly paced.";

if(week.focus.includes("Race Specific"))
return "Race pace workouts develop rhythm and efficiency.";

if(week.focus.includes("Race"))
return "Reduce fatigue and stay fresh. Trust the training.";

return "";

}

////////////////////////////////////////////////////
//// WEEK CARD
////////////////////////////////////////////////////

function drawWeek(doc,week,x,width){

const CARD="#F1F5F9";
const BORDER="#CBD5E1";
const NAVY="#06142B";
const TEXT="#475569";
const MINT="#7ED6B2";
const ORANGE="#F59E0B";

let y=doc.y;

const cardHeight=300;

doc.roundedRect(x,y,width,cardHeight,12)
.fillAndStroke(CARD,BORDER);

////////////////////////////////////////////////////
//// HEADER BAR
////////////////////////////////////////////////////

doc.rect(x,y,width,32)
.fill(week.focus==="Race Week"?ORANGE:MINT);

doc.fillColor(NAVY)
.fontSize(12)
.text(`Week ${week.week}`,x+12,y+10);

y+=45;

////////////////////////////////////////////////////
//// WEEK INFO
////////////////////////////////////////////////////

doc.fontSize(10)
.fillColor(TEXT)
.text(`Focus: ${week.focus}`,x+15,y);

y+=14;

doc.text(`Volume: ${week.volume} km`,x+15,y);

y+=18;

////////////////////////////////////////////////////
//// SESSIONS
////////////////////////////////////////////////////

week.sessions.forEach(s=>{

doc.fillColor(NAVY)
.fontSize(10)
.text(`${s.type} — ${s.totalKm} km`,x+15,y);

y+=12;

doc.strokeColor("#E2E8F0")
.moveTo(x+15,y)
.lineTo(x+width-15,y)
.stroke();

y+=6;

doc.fillColor(TEXT)
.fontSize(9)
.text(s.description,x+15,y,{width:width-30});

const h=doc.heightOfString(
s.description,
{width:width-30}
);

y+=h+12;

});

////////////////////////////////////////////////////
//// COACH TIP BOX
////////////////////////////////////////////////////

y+=6;

doc.roundedRect(x+15,y,width-30,40,6)
.fill("#E2E8F0");

doc.fillColor("#0F172A")
.fontSize(9)
.text(`Coach Tip: ${getCoachTip(week)}`,x+20,y+10,{
width:width-40
});

}

module.exports=generatePdf;