import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  // Before fix
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  console.log('Scroll BEFORE fix:', scrollBefore);

  // Apply the fix in browser
  await page.evaluate(() => {
    document.body.style.overscrollBehavior = 'auto';
    document.body.style.overflow = 'visible';
    document.body.style.overflowX = 'visible';
    document.body.style.overflowY = 'visible';
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.overflowY = 'auto';
  });

  // Try scrolling again
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Scroll AFTER fix:', scrollAfter);

  await browser.close();
}

run().catch(console.error);
