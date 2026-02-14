#!/usr/bin/env node

/**
 * Generate PNG screenshots from HTML test samples using Playwright.
 * These images can be used to test the compliance-officer skill's image review capability.
 *
 * Prerequisites:
 *   npx playwright install chromium
 *
 * Run from project root:
 *   node test-integration/generate-screenshots.mjs
 */

import { readdirSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const samplesDir = new URL('./samples', import.meta.url).pathname;
const outputDir = join(samplesDir, 'screenshots');
mkdirSync(outputDir, { recursive: true });

const htmlFiles = readdirSync(samplesDir).filter(f => f.endsWith('.html'));

if (htmlFiles.length === 0) {
  console.log('No HTML files found in samples/');
  process.exit(0);
}

console.log(`=== Generating screenshots from ${htmlFiles.length} HTML samples ===\n`);

let chromium;
try {
  const pw = await import('playwright');
  chromium = pw.chromium;
} catch {
  console.error('Playwright not installed. Run: npx playwright install chromium');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

let generated = 0;

for (const file of htmlFiles) {
  const filePath = join(samplesDir, file);
  const outputPath = join(outputDir, basename(file, '.html') + '.png');

  try {
    const page = await context.newPage();
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.close();
    console.log(`  ✓ ${file} → screenshots/${basename(file, '.html')}.png`);
    generated++;
  } catch (e) {
    console.error(`  ✗ ${file}: ${e.message}`);
  }
}

await browser.close();

console.log(`\n=== Generated ${generated}/${htmlFiles.length} screenshots in ${outputDir} ===`);
process.exit(generated === htmlFiles.length ? 0 : 1);
