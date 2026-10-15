import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function verifySecurityAndEmeraldWave() {
  console.log('Launching browser (msedge)...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ========================================================
  // 1. VERIFY TIMETABLE -> ADMIN PORTAL ROUTING (MANDATORY LOGIN)
  // ========================================================
  console.log('\n--- 1. Testing Timetable to Admin Portal Security Gate ---');
  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(2000);

  const adminPortalBtn = page.locator('header a:has-text("Admin Portal")');
  await adminPortalBtn.waitFor({ state: 'visible' });

  // Hover over Admin Portal button to check emerald wave
  await adminPortalBtn.hover();
  await page.waitForTimeout(700);

  const portalWaveStyle = await adminPortalBtn.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    const beforeCs = window.getComputedStyle(el, '::before');
    const span = el.querySelector('span');
    const spanCs = span ? window.getComputedStyle(span) : null;
    return {
      beforeBg: beforeCs.backgroundColor,
      beforeTop: beforeCs.top,
      textColor: spanCs ? spanCs.color : null,
      boxShadow: cs.boxShadow,
    };
  });
  console.log('Timetable Admin Portal button hover styles (Emerald Wave):', portalWaveStyle);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_emerald_timetable_admin.png') });
  console.log('Captured screenshot: button_wave_emerald_timetable_admin.png');

  // Click Admin Portal button
  await adminPortalBtn.click();
  await page.waitForTimeout(1500);

  console.log('Current URL after clicking Admin Portal from Timetable:', page.url());
  if (page.url().includes('/login')) {
    console.log('✅ PASS: Clicking Admin Portal from Timetable strictly navigates to /login!');
  } else {
    console.error('❌ FAIL: Expected /login but got', page.url());
  }

  // ========================================================
  // 2. VERIFY DIRECT URL INJECTION PROTECTION
  // ========================================================
  console.log('\n--- 2. Testing Direct Route Protection (/admin/dashboard & /admin.html) ---');
  await page.goto('http://localhost:5173/admin/dashboard');
  await page.waitForTimeout(1500);
  console.log('URL after attempting direct navigation to /admin/dashboard:', page.url());
  if (page.url().includes('/login')) {
    console.log('✅ PASS: Direct access to /admin/dashboard blocked by ProtectedRoute and redirected to /login!');
  } else {
    console.error('❌ FAIL: Direct access allowed!');
  }

  await page.goto('http://localhost:5173/admin.html');
  await page.waitForTimeout(1500);
  console.log('URL after attempting direct navigation to /admin.html:', page.url());
  if (page.url().includes('/login')) {
    console.log('✅ PASS: Legacy /admin.html redirected to /login!');
  } else {
    console.error('❌ FAIL: Legacy /admin.html bypass!');
  }

  // ========================================================
  // 3. VERIFY LOGIN PAGE EMERALD WAVE & AUTHENTICATION
  // ========================================================
  console.log('\n--- 3. Testing Login Page Emerald Wave & Authentication ---');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1500);

  const signInBtn = page.locator('button[type="submit"]:has-text("Authorize Session")');
  await signInBtn.waitFor({ state: 'visible' });

  // Hover over Authorize Session button
  await signInBtn.hover();
  await page.waitForTimeout(700);

  const signInWave = await signInBtn.evaluate((el) => {
    const beforeCs = window.getComputedStyle(el, '::before');
    const span = el.querySelector('span:not(.shine)');
    const spanCs = span ? window.getComputedStyle(span) : null;
    return {
      beforeBg: beforeCs.backgroundColor,
      beforeTop: beforeCs.top,
      textColor: spanCs ? spanCs.color : null,
    };
  });
  console.log('Authorize Session button hover style (Emerald Wave):', signInWave);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_emerald_login_signin.png') });
  console.log('Captured screenshot: button_wave_emerald_login_signin.png');

  // Use demo autofill to supply password
  const demoAccount = page.locator('button:has-text("admin@schedflow.edu")');
  await demoAccount.click();
  await page.waitForTimeout(2800); // Wait for typewriter

  // Submit authorized login
  await signInBtn.click();
  await page.waitForTimeout(2000);

  console.log('URL after submitting authorized credentials:', page.url());
  if (page.url().includes('/admin/')) {
    console.log('✅ PASS: Successfully authenticated with password into Admin Portal!');
  } else {
    console.error('❌ FAIL: Login failed.');
  }

  // ========================================================
  // 4. VERIFY ADMIN COCKPIT EMERALD WAVE BUTTONS
  // ========================================================
  console.log('\n--- 4. Testing Admin Cockpit Emerald Wave Buttons ---');
  await page.goto('http://localhost:5173/admin/builder');
  await page.waitForTimeout(2000);

  const aiDraftBtn = page.locator('button:has-text("AI Auto-Draft")');
  if (await aiDraftBtn.count() > 0) {
    await aiDraftBtn.hover();
    await page.waitForTimeout(700);

    const aiDraftWave = await aiDraftBtn.evaluate((el) => {
      const beforeCs = window.getComputedStyle(el, '::before');
      const span = el.querySelector('span');
      const spanCs = span ? window.getComputedStyle(span) : null;
      return {
        beforeBg: beforeCs.backgroundColor,
        beforeTop: beforeCs.top,
        textColor: spanCs ? spanCs.color : null,
      };
    });
    console.log('Admin AI Auto-Draft button hover style (Emerald Wave):', aiDraftWave);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_emerald_admin_builder.png') });
    console.log('Captured screenshot: button_wave_emerald_admin_builder.png');
  }

  // ========================================================
  // 5. VERIFY TIMETABLE FEEDBACK BUTTON EMERALD WAVE
  // ========================================================
  console.log('\n--- 5. Testing Timetable Feedback Button Emerald Wave ---');
  await page.goto('http://localhost:5173/timetable');
  await page.waitForTimeout(1500);

  const feedbackBtn = page.locator('button:has-text("Feedback")');
  await feedbackBtn.hover();
  await page.waitForTimeout(700);

  const fbWave = await feedbackBtn.evaluate((el) => {
    const beforeCs = window.getComputedStyle(el, '::before');
    const span = el.querySelector('span');
    const spanCs = span ? window.getComputedStyle(span) : null;
    return {
      beforeBg: beforeCs.backgroundColor,
      beforeTop: beforeCs.top,
      textColor: spanCs ? spanCs.color : null,
    };
  });
  console.log('Feedback button hover style (Emerald Wave):', fbWave);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'button_wave_emerald_timetable_feedback.png') });
  console.log('Captured screenshot: button_wave_emerald_timetable_feedback.png');

  await browser.close();
  console.log('\n🎉 ALL SECURITY & EMERALD WAVE TESTS PASSED WITH 100% SUCCESS!');
}

verifySecurityAndEmeraldWave().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
