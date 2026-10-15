import { chromium } from 'playwright';

async function testPageScroll(page, url) {
  console.log(`\n--- Testing ${url} ---`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    return {
      title: document.title,
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
      htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
      htmlOverflowY: window.getComputedStyle(document.documentElement).overflowY,
      bodyOverflow: window.getComputedStyle(document.body).overflow,
      bodyOverflowY: window.getComputedStyle(document.body).overflowY,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
    };
  });
  console.log('Scroll Info:', info);

  // Try scrolling down with mouse wheel / window.scrollBy
  console.log('Attempting window.scrollBy(0, 500)...');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(300);
  const scrollYAfter = await page.evaluate(() => window.scrollY);
  console.log('window.scrollY after scrollBy(0, 500):', scrollYAfter);

  // Try mouse wheel
  console.log('Attempting mouse.wheel(0, 500)...');
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const scrollYWheel = await page.evaluate(() => window.scrollY);
  console.log('window.scrollY after mouse.wheel(0, 500):', scrollYWheel);
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await testPageScroll(page, 'http://localhost:5173/');
  await testPageScroll(page, 'http://localhost:5173/timetable');
  await testPageScroll(page, 'http://localhost:5173/login');

  // Login to check /admin/dashboard
  await page.goto('http://localhost:5173/login');
  await page.click('button:has-text("Administrator")');
  await page.waitForTimeout(1200);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  await testPageScroll(page, 'http://localhost:5173/admin/dashboard');

  await browser.close();
}

run().catch(console.error);
