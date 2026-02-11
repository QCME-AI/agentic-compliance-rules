#!/usr/bin/env node

/**
 * Validates fixture coverage for all rules.
 * Checks that each rule has at least 2 positive and 2 negative fixture files.
 *
 * Usage:
 *   node tools/validate-fixtures.mjs                # warn-only (default)
 *   node tools/validate-fixtures.mjs --threshold 25  # fail if coverage < 25%
 */

import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const threshold = (() => {
  const idx = process.argv.indexOf("--threshold");
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = Number(process.argv[idx + 1]);
    if (isNaN(val) || val < 0 || val > 100) {
      console.error("--threshold must be a number between 0 and 100");
      process.exit(1);
    }
    return val;
  }
  return 0;
})();

function getRuleIds(framework) {
  const rulesDir = join(ROOT, "rules", framework, "rules");
  if (!existsSync(rulesDir)) return [];
  return readdirSync(rulesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

function countFixtures(framework, ruleId, type) {
  const dir = join(ROOT, "fixtures", framework, ruleId, type);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(".txt")).length;
}

function main() {
  const frameworks = readdirSync(join(ROOT, "rules")).filter((f) => {
    try {
      return readdirSync(join(ROOT, "rules", f, "rules")).length > 0;
    } catch {
      return false;
    }
  });

  let totalRules = 0;
  let coveredRules = 0;
  let missingRules = 0;
  const missing = [];

  for (const fw of frameworks) {
    const ruleIds = getRuleIds(fw);
    console.log(`${fw}: ${ruleIds.length} rules`);

    for (const ruleId of ruleIds) {
      totalRules++;
      const pos = countFixtures(fw, ruleId, "positive");
      const neg = countFixtures(fw, ruleId, "negative");

      if (pos >= 2 && neg >= 2) {
        coveredRules++;
      } else {
        missingRules++;
        missing.push({
          framework: fw,
          ruleId,
          positive: pos,
          negative: neg,
        });
      }
    }
  }

  const coverage = totalRules > 0 ? ((coveredRules / totalRules) * 100) : 0;

  console.log(`\nFixture coverage:`);
  console.log(`  Total rules: ${totalRules}`);
  console.log(`  Covered (2+ pos, 2+ neg): ${coveredRules}`);
  console.log(`  Missing: ${missingRules}`);
  console.log(`  Coverage: ${coverage.toFixed(1)}%`);
  console.log(`  Threshold: ${threshold}%`);

  if (missing.length > 0 && missing.length <= 20) {
    console.log(`\nFirst ${Math.min(missing.length, 20)} missing:`);
    for (const m of missing.slice(0, 20)) {
      console.log(
        `  ${m.framework}/${m.ruleId}: ${m.positive} positive, ${m.negative} negative`
      );
    }
  }

  if (threshold > 0 && coverage < threshold) {
    console.error(
      `\nFAILED: Fixture coverage ${coverage.toFixed(1)}% is below threshold ${threshold}%`
    );
    process.exit(1);
  }

  if (missingRules > 0) {
    console.warn(
      `\nWARNING: ${missingRules} rules lack full fixture coverage`
    );
  }
}

main();
