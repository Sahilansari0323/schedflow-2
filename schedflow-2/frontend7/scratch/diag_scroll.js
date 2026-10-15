import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  const diag = await page.evaluate(() => {
    // Test if window.scrollTo works
    window.scrollTo(0, 200);
    const scrolled = window.scrollY;

    // Check styles on html, body, root, and main
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);
    const rootEl = document.getElementById('root');
    const rootStyle = rootEl ? window.getComputedStyle(rootEl) : null;
    const firstDiv = rootEl?.firstElementChild;
    const firstDivStyle = firstDiv ? window.getComputedStyle(firstDiv) : null;

    return {
      windowScrollYAfterScrollTo: scrolled,
      html: {
        overflow: htmlStyle.overflow,
        overflowX: htmlStyle.overflowX,
        overflowY: htmlStyle.overflowY,
        height: htmlStyle.height,
        maxHeight: htmlStyle.maxHeight,
        position: htmlStyle.position,
      },
      body: {
        overflow: bodyStyle.overflow,
        overflowX: bodyStyle.overflowX,
        overflowY: bodyStyle.overflowY,
        height: bodyStyle.height,
        maxHeight: bodyStyle.maxHeight,
        position: bodyStyle.position,
        overscrollBehavior: bodyStyle.overscrollBehavior,
      },
      root: rootStyle ? {
        overflow: rootStyle.overflow,
        height: rootStyle.height,
        position: rootStyle.position,
      } : null,
      firstDiv: firstDivStyle ? {
        overflow: firstDivStyle.overflow,
        height: firstDivStyle.height,
        minHeight: firstDivStyle.minHeight,
        position: firstDivStyle.position,
        classes: firstDiv.className,
      } : null,
      docHeight: document.documentElement.scrollHeight,
      winHeight: window.innerHeight,
    };
  });

  console.log('Diagnostic result:', JSON.stringify(diag, null, 2));

  await browser.close();
}

run().catch(console.error);
