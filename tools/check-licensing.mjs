#!/usr/bin/env node

/**
 * Validates licensing policy compliance for all rules.
 * Ensures source metadata is present and policy constraints are met.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const VALID_STATUSES = new Set([
  "allowed",
  "allowed_with_attribution",
  "derivative_only",
  "needs_permission",
]);

const RESTRICTED_FRAMEWORKS = new Set(["finra", "gips", "gmc"]);

function findRuleFiles() {
  const files = [];
  const rulesRoot = join(ROOT, "rules");
  for (const fw of readdirSync(rulesRoot)) {
    const rulesDir = join(rulesRoot, fw, "rules");
    try {
      for (const file of readdirSync(rulesDir)) {
        if (file.endsWith(".json")) {
          files.push({ path: join(rulesDir, file), framework: fw });
        }
      }
    } catch {
      // skip
    }
  }
  return files;
}

function main() {
  const ruleFiles = findRuleFiles();
  console.log(`Checking licensing for ${ruleFiles.length} rules\n`);

  let errors = 0;
  let warnings = 0;

  for (const { path, framework } of ruleFiles) {
    const rule = JSON.parse(readFileSync(path, "utf8"));

    // Must have source metadata
    if (!rule.source) {
      console.error(`ERROR [${rule.id}]: Missing source metadata`);
      errors++;
      continue;
    }

    // Must have valid policy_status
    if (!VALID_STATUSES.has(rule.source.policy_status)) {
      console.error(
        `ERROR [${rule.id}]: Invalid policy_status: "${rule.source.policy_status}"`
      );
      errors++;
    }

    // Must have source_url
    if (!rule.source.source_url) {
      console.error(`ERROR [${rule.id}]: Missing source_url`);
      errors++;
    }

    // GDPR must have attribution_required = true
    if (
      rule.framework === "gdpr" &&
      rule.source.attribution_required !== true
    ) {
      console.error(
        `ERROR [${rule.id}]: GDPR rules must have attribution_required: true`
      );
      errors++;
    }

    // Restricted frameworks must not include bulk source text
    if (RESTRICTED_FRAMEWORKS.has(rule.framework)) {
      if (rule.source.policy_status === "needs_permission") {
        // Check for large text fields that might contain verbatim source
        const textFields = [rule.summary, rule.rationale].filter(Boolean);
        for (const text of textFields) {
          if (text.length > 500) {
            console.error(
              `ERROR [${rule.id}]: Restricted framework rule has text field > 500 chars (possible verbatim source)`
            );
            errors++;
          }
        }
      }
    }

    // Warn if needs_permission rules are included
    if (rule.source.policy_status === "needs_permission") {
      console.warn(
        `WARNING [${rule.id}]: Rule has policy_status "needs_permission" - requires legal review`
      );
      warnings++;
    }
  }

  console.log(`\nLicensing check complete:`);
  console.log(`  Rules checked: ${ruleFiles.length}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Warnings: ${warnings}`);

  if (errors > 0) {
    console.error("\nLicensing check FAILED");
    process.exit(1);
  }

  console.log("\nLicensing check PASSED");
}

main();
