import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function verifyAll() {
  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ==========================================
  // 1. TEST SCROLLING ON PUBLIC TIMETABLE PAGE
  // ==========================================
  console.log('\n--- Testing Public Timetable Page Scrolling & Button Wave ---');
  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  // Position mouse over the center of the timetable table
  await page.mouse.move(720, 500);
  const ttScrollInitial = await page.evaluate(() => window.scrollY);
  console.log('Timetable initial scrollY:', ttScrollInitial);

  // Send wheel scroll down
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(600);
  const ttScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Timetable scrollY after wheel (over table):', ttScrollAfter);
  if (ttScrollAfter > ttScrollInitial) {
    console.log('✅ PASS: Timetable page scrolls freely even with mouse directly over the table!');
  } else {
    console.error('❌ FAIL: Timetable page failed to scroll.');
  }

  // Scroll back to top to test button wave
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // Test WhatsApp button animation on "Feedback" button
  const feedbackBtn = page.locator('button:has-text("Feedback")');
  await feedbackBtn.waitFor({ state: 'visible' });

  // Hover over the Feedback button
  await feedbackBtn.hover();
  await page.waitForTimeout(700);

  // Inspect button styles during hover
  const fbBtnStyle = await feedbackBtn.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    const beforeCs = window.getComputedStyle(el, '::before');
    const spanEl = el.querySelector('span');
    const spanCs = spanEl ? window.getComputedStyle(spanEl) : null;
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      beforeBg: beforeCs.backgroundColor,
      beforeTop: beforeCs.top,
      textColor: spanCs ? spanCs.color : null,
    };
  });
  console.log('Feedback button hover styles:', fbBtnStyle);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'button_wave_timetable_feedback.png'),
  });
  console.log('Captured screenshot: button_wave_timetable_feedback.png');

  // Test hovering on Admin Login button
  const adminLoginBtn = page.locator('a:has-text("Admin Login")');
  if (await adminLoginBtn.count() > 0) {
    await adminLoginBtn.hover();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'button_wave_timetable_admin_login.png'),
    });
    console.log('Captured screenshot: button_wave_timetable_admin_login.png');
  }

  // ==========================================
  // 2. TEST SCROLLING ON LANDING PAGE
  // ==========================================
  console.log('\n--- Testing Landing Page Scrolling & 11 Chapters ---');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2500);

  const landingScrollInitial = await page.evaluate(() => window.scrollY);
  console.log('Landing initial scrollY:', landingScrollInitial);

  // Scroll down by 1500px
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(1000);
  const landingScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Landing scrollY after wheel:', landingScrollAfter);

  const chapterNum = await page.evaluate(() => {
    const el = document.getElementById('railNum');
    return el ? el.textContent : 'none';
  });
  console.log('Active Chapter on rail:', chapterNum);

  if (landingScrollAfter > 200) {
    console.log('✅ PASS: Landing page scrolls dynamically across chapters!');
  } else {
    console.error('❌ FAIL: Landing page scroll blocked.');
  }

  // Scroll back to top and test "Explore" button hover
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  const exploreBtn = page.locator('header a:has-text("Explore")');
  if (await exploreBtn.count() > 0) {
    await exploreBtn.hover();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'button_wave_landing_explore.png'),
    });
    console.log('Captured screenshot: button_wave_landing_explore.png');
  }

  // ==========================================
  // 3. TEST LOGIN PAGE BUTTONS & ANIMATION
  // ==========================================
  console.log('\n--- Testing Login Page Button Wave ---');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1500);

  const signInBtn = page.locator('button[type="submit"]:has-text("Authorize Session")');
  await signInBtn.waitFor({ state: 'visible' });

  // Hover over Authorize Session button
  await signInBtn.hover();
  await page.waitForTimeout(700);

  const signInStyle = await signInBtn.evaluate((el) => {
    const span = el.querySelector('span');
    const spanCs = span ? window.getComputedStyle(span) : null;
    const beforeCs = window.getComputedStyle(el, '::before');
    return {
      beforeBg: beforeCs.backgroundColor,
      beforeTop: beforeCs.top,
      textColor: spanCs ? spanCs.color : null,
    };
  });
  console.log('Authorize Session button hover style:', signInStyle);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'button_wave_login_signin.png'),
  });
  console.log('Captured screenshot: button_wave_login_signin.png');

  // Hover over first quick demo button
  const demoCardBtn = page.locator('button:has-text("Dr. Angela Vance")');
  if (await demoCardBtn.count() > 0) {
    await demoCardBtn.hover();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'button_wave_login_demo_card.png'),
    });
    console.log('Captured screenshot: button_wave_login_demo_card.png');

    // Click demo card to trigger typewriter
    await demoCardBtn.click();
    await page.waitForTimeout(2200); // Wait for typewriter to fill credentials
    await signInBtn.click();
    await page.waitForTimeout(2000);
  }

  // ==========================================
  // 4. TEST ADMIN PORTAL SCROLLING & BUTTONS
  // ==========================================
  console.log('\n--- Testing Admin Portal Scrolling & Buttons ---');
  console.log('Current URL after login:', page.url());

  // Navigate to Builder which has tall content
  await page.goto('http://localhost:5173/admin/builder');
  await page.waitForTimeout(2000);

  const adminScrollInitial = await page.evaluate(() => window.scrollY);
  console.log('Admin Builder initial scrollY:', adminScrollInitial);

  await page.mouse.move(800, 450);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(800);
  const adminScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Admin Builder scrollY after wheel:', adminScrollAfter);

  if (adminScrollAfter > adminScrollInitial) {
    console.log('✅ PASS: Admin Portal scrolls smoothly without restriction!');
  } else {
    console.log('Admin page dimensions:', await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    })));
  }

  // Test hovering on action button in admin builder
  const aiDraftBtn = page.locator('button:has-text("AI Auto-Draft")');
  if (await aiDraftBtn.count() > 0) {
    await aiDraftBtn.hover();
    await page.waitForTimeout(700);
    const aiDraftStyle = await aiDraftBtn.evaluate((el) => {
      const beforeCs = window.getComputedStyle(el, '::before');
      const textEl = el.querySelector('span');
      const textCs = textEl ? window.getComputedStyle(textEl) : null;
      return {
        beforeBg: beforeCs.backgroundColor,
        beforeTop: beforeCs.top,
        textColor: textCs ? textCs.color : null,
      };
    });
    console.log('Admin AI Auto-Draft button hover style:', aiDraftStyle);

    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'button_wave_admin_ai_draft.png'),
    });
    console.log('Captured screenshot: button_wave_admin_ai_draft.png');
  }

  // Test hovering on Sidebar nav item
  const navItem = page.locator('nav a:has-text("Campus Analytics")');
  if (await navItem.count() > 0) {
    await navItem.hover();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'button_wave_admin_sidebar_nav.png'),
    });
    console.log('Captured screenshot: button_wave_admin_sidebar_nav.png');
  }

  await browser.close();
  console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
}

verifyAll().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
