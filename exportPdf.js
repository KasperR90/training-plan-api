const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  // 1. Start een headless Chrome
  const browser = await puppeteer.launch();

  // 2. Open een nieuwe pagina
  const page = await browser.newPage();

  // 3. Pad naar jouw HTML-bestand
  const htmlPath = path.resolve(__dirname, "output/schema.html");

  // 4. Laad de HTML
  await page.goto(`file://${htmlPath}`, {
    waitUntil: "networkidle0"
  });

  // 5. Exporteer naar PDF (A4)
  await page.pdf({
    path: "output/schema.pdf",
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      right: "15mm",
      bottom: "20mm",
      left: "15mm"
    }
  });

  // 6. Sluit Chrome
  await browser.close();

  console.log("PDF gegenereerd: output/schema.pdf");
})();
