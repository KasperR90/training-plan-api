// generatePdf.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { renderHtml } = require('./renderHtml');

/**
 * Generate branded PDF from training plan
 */
async function generatePdf(plan) {
  if (!plan || !plan.meta) {
    throw new Error('Invalid plan data for PDF generation');
  }

  const outputDir = path.join(__dirname, 'output');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const distanceLabel = plan.meta.distanceLabel
    .replace(/\s+/g, '_')
    .toUpperCase();

  const weeks = plan.meta.weeks;

  const fileName = `RUNIQ_${distanceLabel}_Training_Plan_${weeks}_Weeks.pdf`;
  const filePath = path.join(outputDir, fileName);

  const html = renderHtml(plan);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new',
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
    });

    return {
      filePath,
      fileName,
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  generatePdf,
};