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

  // FTC rules are split into 3 files to stay under Claude Code's token limit
  const FTC_SPLITS = {
    "ftc-claims": /^FTC-(233|238|251|260|CLAIM|FREE|GREEN|USA|bait|hidden|truth)/,
    "ftc-endorsements": /^FTC-(255|REVIEW|NATIVE)/,
    "ftc-dark-patterns": /^FTC-(DARK|SCARCITY|CANCEL|NEGATIVE|RECURRING)/,
  };

  let total = 0;
  for (const [fw, rules] of Object.entries(byFramework).sort()) {
    if (fw === "ftc") {
      // Split FTC into smaller files
      for (const [splitName, pattern] of Object.entries(FTC_SPLITS)) {
        const splitRules = rules.filter((r) => pattern.test(r.id));
        const outPath = join(refsDir, `rules-${splitName}.json`);
        writeFileSync(outPath, JSON.stringify(splitRules, null, 2) + "\n");
        console.log(
          `${splitName}: ${splitRules.length} rules → references/rules-${splitName}.json`
        );
        total += splitRules.length;
      }
    } else {
      const outPath = join(refsDir, `rules-${fw}.json`);
      writeFileSync(outPath, JSON.stringify(rules, null, 2) + "\n");
      console.log(`${fw}: ${rules.length} rules → references/rules-${fw}.json`);
      total += rules.length;
    }
  }

  console.log(`\nTotal: ${total} rules across ${Object.keys(byFramework).length} frameworks`);
  console.log(`Wrote to skills/compliance-officer/references/`);
}

main();
