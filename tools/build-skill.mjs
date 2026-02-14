#!/usr/bin/env node

/**
 * Splits dist/index.json into per-framework rule files for the
 * compliance-officer skill's references/ directory.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function main() {
  const indexPath = join(ROOT, "dist", "index.json");
  if (!existsSync(indexPath)) {
    console.error("dist/index.json not found — run `npm run build` first.");
    process.exit(1);
  }

  const index = JSON.parse(readFileSync(indexPath, "utf8"));

  const refsDir = join(ROOT, "skills", "compliance-officer", "references");
  mkdirSync(refsDir, { recursive: true });

  // Group rules by framework
  const byFramework = {};
  for (const rule of index.rules) {
    const fw = rule.framework;
    if (!byFramework[fw]) byFramework[fw] = [];
    byFramework[fw].push(rule);
  }

  let total = 0;
  for (const [fw, rules] of Object.entries(byFramework).sort()) {
    const outPath = join(refsDir, `rules-${fw}.json`);
    writeFileSync(outPath, JSON.stringify(rules, null, 2) + "\n");
    console.log(`${fw}: ${rules.length} rules → references/rules-${fw}.json`);
    total += rules.length;
  }

  console.log(`\nTotal: ${total} rules across ${Object.keys(byFramework).length} frameworks`);
  console.log(`Wrote to skills/compliance-officer/references/`);
}

main();
