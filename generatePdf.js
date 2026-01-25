const fs = require("fs");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

async function generatePdf(html, outputPath) {
  // Resolve Chromium binary (Render / serverless compatible)
  const executablePath = await chromium.executablePath();

  console.log(">>> Chromium executable path:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  // Write PDF to disk
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(">>> PDF written to:", outputPath);
}

module.exports = generatePdf;
