import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  const initial = await page.evaluate(() => ({
    scrollY: window.scrollY,
    htmlScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
  }));
  console.log('Initial scroll:', initial);

  // Hover over the center of the screen and scroll down
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(1000);

  const afterWheel = await page.evaluate(() => ({
    scrollY: window.scrollY,
    htmlScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
  }));
  console.log('After mouse.wheel(0, 1000):', afterWheel);

  // Now test timetable page
  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(1000);

  const timetableScroll = await page.evaluate(() => ({
    scrollY: window.scrollY,
    htmlScrollTop: document.documentElement.scrollTop,
    bodyScrollTop: document.body.scrollTop,
  }));
  console.log('Timetable after mouse.wheel:', timetableScroll);

  await browser.close();
}

run().catch(console.error);
