const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5174/Aurelia-Travel/';
const SCREENSHOT_DIR = path.resolve(__dirname, './Screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting Playwright crawler...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const routes = [
    { name: '01_Home_Page', path: '' },
    { name: '02_About_Page', path: 'about' },
    { name: '03_Contact_Page', path: 'contact' },
    { name: '04_Hotel_Search', path: 'hotel-search' },
    { name: '05_Login_Registration', path: 'auth' },
    { name: '06_Hotels', path: 'hotels' }
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.name}...`);
    try {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 25000 });
      // Wait for any animations
      await page.waitForTimeout(3000);
      
      const screenshotPath = path.join(SCREENSHOT_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved screenshot: ${screenshotPath}`);
    } catch (err) {
      console.error(`Failed to capture ${route.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Crawling completed.');
}

run().catch(console.error);
