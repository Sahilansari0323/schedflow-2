import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  // Monitor wheel events
  await page.evaluate(() => {
    window._wheelEvents = [];
    window.addEventListener('wheel', (e) => {
      window._wheelEvents.push({
        targetTag: e.target.tagName,
        targetClass: e.target.className,
        deltaY: e.deltaY,
        defaultPrevented: e.defaultPrevented,
        bubbles: e.bubbles,
      });
    }, { passive: false });
  });

  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);

  const events = await page.evaluate(() => window._wheelEvents);
  console.log('Wheel events captured:', events);

  await browser.close();
}

run().catch(console.error);
