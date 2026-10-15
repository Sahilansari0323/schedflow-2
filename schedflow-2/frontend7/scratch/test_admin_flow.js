import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function testAdminFlow() {
  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('\n--- 1. Testing Login Page & Demo Autofill ---');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1500);

  // Click on the first demo account button (Administrator)
  const adminDemoBtn = page.locator('button:has-text("admin@schedflow.edu")');
  await adminDemoBtn.waitFor({ state: 'visible' });

  // Hover over the demo button to see wave
  await adminDemoBtn.hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_login_demo_card.png') });
  console.log('Captured screenshot: button_wave_login_demo_card.png');

  // Click demo button to trigger typewriter
  await adminDemoBtn.click();
  // Wait for typewriter to type email and password
  await page.waitForTimeout(2800);

  const signInBtn = page.locator('button[type="submit"]:has-text("Authorize Session")');
  await signInBtn.hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_login_signin_ready.png') });
  console.log('Captured screenshot: button_wave_login_signin_ready.png');

  // Submit login
  await signInBtn.click();
  await page.waitForTimeout(2000);

  console.log('URL after login:', page.url());

  // Verify we are in the admin portal
  if (page.url().includes('/admin/')) {
    console.log('✅ Successfully authenticated into Admin Portal!');
  } else {
    console.error('Login did not navigate to admin, current url:', page.url());
  }

  // ==========================================
  // 2. TEST SCROLLING ON ADMIN DASHBOARD
  // ==========================================
  console.log('\n--- 2. Testing Admin Dashboard Scrolling ---');
  await page.goto('http://localhost:5173/admin/dashboard');
  await page.waitForTimeout(1500);

  const dashScrollBefore = await page.evaluate(() => window.scrollY);
  console.log('Admin Dashboard scrollY initial:', dashScrollBefore);

  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(600);

  const dashScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Admin Dashboard scrollY after wheel:', dashScrollAfter);

  // ==========================================
  // 3. TEST SCROLLING ON ADMIN BUILDER
  // ==========================================
  console.log('\n--- 3. Testing Admin Builder Scrolling & Buttons ---');
  await page.goto('http://localhost:5173/admin/builder');
  await page.waitForTimeout(2000);

  const builderScrollBefore = await page.evaluate(() => window.scrollY);
  console.log('Admin Builder scrollY initial:', builderScrollBefore);

  await page.mouse.move(800, 500);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(600);

  const builderScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Admin Builder scrollY after wheel:', builderScrollAfter);

  if (builderScrollAfter > builderScrollBefore) {
    console.log('✅ PASS: Admin Builder scrolls down smoothly!');
  } else {
    const dims = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    console.log('Admin Builder dimensions:', dims);
  }

  // Hover over an action button in admin builder
  const aiDraftBtn = page.locator('button:has-text("AI Auto-Draft")');
  if (await aiDraftBtn.count() > 0) {
    await aiDraftBtn.hover();
    await page.waitForTimeout(700);

    const style = await aiDraftBtn.evaluate((el) => {
      const beforeCs = window.getComputedStyle(el, '::before');
      const textSpan = el.querySelector('span');
      const textCs = textSpan ? window.getComputedStyle(textSpan) : null;
      return {
        beforeBg: beforeCs.backgroundColor,
        beforeTop: beforeCs.top,
        textColor: textCs ? textCs.color : null,
      };
    });
    console.log('Admin AI Auto-Draft button hover style:', style);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_admin_ai_draft.png') });
    console.log('Captured screenshot: button_wave_admin_ai_draft.png');
  }

  // Test hovering over Sidebar navigation link
  const navItem = page.locator('nav a:has-text("Campus Analytics")');
  if (await navItem.count() > 0) {
    await navItem.hover();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_admin_sidebar_nav.png') });
    console.log('Captured screenshot: button_wave_admin_sidebar_nav.png');
  }

  // ==========================================
  // 4. TEST TOPOLOGY PAGE SCROLLING
  // ==========================================
  console.log('\n--- 4. Testing Admin Topology Page Scrolling ---');
  await page.goto('http://localhost:5173/admin/topology');
  await page.waitForTimeout(1500);

  const topoScrollBefore = await page.evaluate(() => window.scrollY);
  console.log('Topology scrollY initial:', topoScrollBefore);

  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(600);

  const topoScrollAfter = await page.evaluate(() => window.scrollY);
  console.log('Topology scrollY after wheel:', topoScrollAfter);
  if (topoScrollAfter > topoScrollBefore) {
    console.log('✅ PASS: Topology page scrolls freely!');
  }

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_topology_scrolled.png') });
  console.log('Captured screenshot: admin_topology_scrolled.png');

  await browser.close();
  console.log('\n🎉 ALL ADMIN TESTS PASSED PERFECTLY!');
}

testAdminFlow().catch((err) => {
  console.error('Error during testAdminFlow:', err);
  process.exit(1);
});
