import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  // Position 1: over the table (700, 450)
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const s1 = await page.evaluate(() => window.scrollY);
  console.log('ScrollY after wheel over table (700, 450):', s1);

  // Position 2: over the background / margin (50, 450)
  await page.mouse.move(50, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const s2 = await page.evaluate(() => window.scrollY);
  console.log('ScrollY after wheel over margin (50, 450):', s2);

  // Check the table container element's scrollTop / scrollHeight
  const tableContainerScroll = await page.evaluate(() => {
    const tableDiv = document.querySelector('.overflow-x-auto');
    return {
      scrollTop: tableDiv?.scrollTop,
      scrollHeight: tableDiv?.scrollHeight,
      clientHeight: tableDiv?.clientHeight,
      scrollLeft: tableDiv?.scrollLeft,
      scrollWidth: tableDiv?.scrollWidth,
      clientWidth: tableDiv?.clientWidth,
    };
  });
  console.log('Table container scroll values:', tableContainerScroll);

  await browser.close();
}

run().catch(console.error);
