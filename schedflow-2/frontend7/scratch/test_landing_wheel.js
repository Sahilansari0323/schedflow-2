import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Check what element is at 720, 450
  const el = await page.evaluate(() => {
    const e = document.elementFromPoint(720, 450);
    return {
      tag: e?.tagName,
      className: e?.className,
      id: e?.id,
      pointerEvents: e ? window.getComputedStyle(e).pointerEvents : null,
      parentChapter: e?.closest('.chapter')?.id,
      chapterPointerEvents: e?.closest('.chapter') ? window.getComputedStyle(e.closest('.chapter')).pointerEvents : null,
    };
  });
  console.log('Element at (720, 450) on Landing:', el);

  // Wheel scroll at (720, 450)
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(500);
  const scrollY1 = await page.evaluate(() => window.scrollY);
  console.log('ScrollY after wheel on content:', scrollY1);

  // Now test wheel over interactive card
  const ctaBtn = await page.$('#heroCta');
  if (ctaBtn) {
    const box = await ctaBtn.boundingBox();
    console.log('Hero CTA bounding box:', box);
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(500);
      const scrollY2 = await page.evaluate(() => window.scrollY);
      console.log('ScrollY after wheel on hero CTA:', scrollY2);
    }
  }

  await browser.close();
}

run().catch(console.error);
