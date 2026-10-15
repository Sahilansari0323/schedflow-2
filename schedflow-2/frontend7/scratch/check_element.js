import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  const elInfo = await page.evaluate(() => {
    const el = document.elementFromPoint(700, 450);
    let curr = el;
    const path = [];
    while (curr && curr !== document.body) {
      const style = window.getComputedStyle(curr);
      path.push({
        tag: curr.tagName,
        className: curr.className,
        id: curr.id,
        overflow: style.overflow,
        overflowY: style.overflowY,
        position: style.position,
        pointerEvents: style.pointerEvents,
      });
      curr = curr.parentElement;
    }
    return {
      elementUnderPointer: el ? el.tagName + '.' + el.className : null,
      path,
      totalScrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });
  console.log('Element under pointer (700, 450):', JSON.stringify(elInfo, null, 2));

  await browser.close();
}

run().catch(console.error);
