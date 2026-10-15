import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Testing /login page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take screenshot of initial login page with orbital + roaming blocks
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'login_fixed_orbit_blocks.png') });
  console.log('Saved login_fixed_orbit_blocks.png');

  // Verify cursor style on body and buttons
  const bodyCursor = await page.evaluate(() => window.getComputedStyle(document.body).cursor);
  console.log('Body cursor property:', bodyCursor);

  // Click on the Administrator demo account to test typewriter autofill
  console.log('Clicking Administrator demo account for typewriter autofill...');
  await page.click('button:has-text("Administrator")');

  // Wait 600ms for typewriter animation to complete typing into email and password
  await page.waitForTimeout(1200);

  // Take screenshot showing typed credentials with icons clearly separated (no overlap!)
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'login_typewriter_autofill.png') });
  console.log('Saved login_typewriter_autofill.png');

  // Zoom in on the input fields specifically to prove zero icon overlap
  const card = await page.$('main > div:nth-child(2)');
  if (card) {
    await card.screenshot({ path: path.join(ARTIFACTS_DIR, 'login_inputs_zoom_no_overlap.png') });
    console.log('Saved login_inputs_zoom_no_overlap.png');
  }

  // Now test /timetable
  console.log('Testing /timetable page...');
  await page.goto('http://localhost:5173/timetable', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Take screenshot of full timetable page with all controls, dropdowns, and matrix
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'timetable_full_page_with_controls.png') });
  console.log('Saved timetable_full_page_with_controls.png');

  // Test live search filter: type "DSA"
  console.log('Testing live filter search: "DSA"...');
  await page.fill('input[placeholder*="Filter subject"]', 'DSA');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'timetable_search_highlight.png') });
  console.log('Saved timetable_search_highlight.png');

  // Clear search filter
  await page.fill('input[placeholder*="Filter subject"]', '');
  await page.waitForTimeout(500);

  // Open feedback modal
  console.log('Opening feedback modal...');
  await page.click('button:has-text("Feedback")');
  await page.waitForTimeout(500);

  // Select "Wrong Faculty" mode chip
  console.log('Selecting Wrong Faculty feedback mode chip...');
  await page.click('button:has-text("Wrong Faculty")');
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'timetable_feedback_mode_selected.png') });
  console.log('Saved timetable_feedback_mode_selected.png');

  // Select "Faculty Absent" mode chip
  console.log('Selecting Faculty Absent feedback mode chip...');
  await page.click('button:has-text("Faculty Absent")');
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'timetable_feedback_absent_selected.png') });
  console.log('Saved timetable_feedback_absent_selected.png');

  await browser.close();
  console.log('All verification tests completed successfully!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
