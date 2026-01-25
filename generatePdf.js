const puppeteer = require('puppeteer');

async function generatePdf(html, outputPath) {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    headless: true
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
}

module.exports = { generatePdf };
