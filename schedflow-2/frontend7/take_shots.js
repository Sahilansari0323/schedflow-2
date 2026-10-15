import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  console.log('1. Testing route guard on /admin ...');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('   Current URL:', page.url());
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_redirect_verified.png') });
  console.log('   Saved admin_redirect_verified.png');

  console.log('2. Authenticating as admin ...');
  // Fill login form
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@schedflow.edu');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('   Current URL after login:', page.url());
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_dashboard_react.png') });
  console.log('   Saved admin_dashboard_react.png');

  console.log('3. Navigating to Topology & AI Room Finder ...');
  await page.goto('http://localhost:5173/admin/topology', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click AI Room & Faculty Finder tab
  const finderTab = page.locator('button:has-text("AI Room & Faculty Finder")');
  if (await finderTab.isVisible()) {
    await finderTab.click();
    console.log('   Clicked AI Room & Faculty Finder tab');
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_ai_finder_react.png') });
  console.log('   Saved admin_ai_finder_react.png');

  console.log('4. Navigating to Public Timetable and opening Feedback modal ...');
  await page.goto('http://localhost:5173/timetable', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const feedbackBtn = page.locator('button:has-text("FEEDBACK")');
  if (await feedbackBtn.isVisible()) {
    await feedbackBtn.click();
    console.log('   Clicked FEEDBACK button');
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'timetable_feedback_modal.png') });
  console.log('   Saved timetable_feedback_modal.png');

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED CLEANLY!');
}

main().catch(err => {
  console.error('Error running playwright:', err);
  process.exit(1);
});
