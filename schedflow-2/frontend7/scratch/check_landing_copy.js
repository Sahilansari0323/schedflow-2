import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/abhij/.gemini/antigravity/brain/0752bbf9-580c-4323-a24d-c6f30e4904bb';

async function checkLandingPageCopy() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Take screenshot of hero
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'landing_ch0_hero_elevated.png') });
  console.log('Saved landing_ch0_hero_elevated.png');

  // Check some key copy strings that were updated
  const content = await page.content();
  const checks = [
    { name: 'Empirically Audited', found: content.includes('Empirically Audited, Proven At Scale') },
    { name: 'Deterministic Heuristic Core', found: content.includes('Deterministic Heuristic Core') },
    { name: 'Institutional Consensus', found: content.includes('Institutional Consensus') },
    { name: 'Collision Detection', found: content.includes('Collision Detection') },
    { name: 'Data Ingestion', found: content.includes('Curated CSV Ingestion') || content.includes('Data Ingestion') },
  ];

  console.log('Copy verification results:');
  for (const c of checks) {
    console.log(`- ${c.name}: ${c.found ? '✅ PASS' : '❌ NOT FOUND'}`);
  }

  // Check that old shallow strings are GONE
  const shallowStrings = [
    "The registrar gossip",
    "CSV archaeology",
    "three fields that's the job",
    "two teachers one room",
    "kills every clash",
    "phones it in",
  ];
  console.log('Shallow strings absence check:');
  for (const s of shallowStrings) {
    const present = content.includes(s);
    console.log(`- "${s}": ${!present ? '✅ GONE' : '❌ STILL PRESENT'}`);
  }

  await browser.close();
}

checkLandingPageCopy().catch(console.error);
