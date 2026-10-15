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

  // Log in
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@schedflow.edu');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 1. Topology -> AI Room & Slot Finder Tab
  console.log('1. Capturing AI Room & Slot Finder ...');
  await page.goto('http://localhost:5173/admin/topology', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const finderTab = page.locator('button:has-text("AI Room & Slot Finder")');
  if (await finderTab.isVisible()) {
    await finderTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_ai_finder_active.png') });
  console.log('   Saved admin_ai_finder_active.png');

  // 2. Timetable Builder
  console.log('2. Capturing Timetable Builder ...');
  await page.goto('http://localhost:5173/admin/builder', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_builder_react.png') });
  console.log('   Saved admin_builder_react.png');

  // 3. User Directory (RBAC)
  console.log('3. Capturing User Directory ...');
  await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_users_react.png') });
  console.log('   Saved admin_users_react.png');

  await browser.close();
  console.log('EXTRA SCREENSHOTS COMPLETED!');
}

main().catch(err => {
  console.error('Error in extra shots:', err);
  process.exit(1);
});
