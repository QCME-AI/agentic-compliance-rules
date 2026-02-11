#!/usr/bin/env node

/**
 * Validates all rules against the JSON schema.
 * Checks for: schema compliance, duplicate IDs, regex safety.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const schema = JSON.parse(
  readFileSync(join(ROOT, "schemas", "rule.schema.json"), "utf8")
);

const VALID_FRAMEWORKS = new Set(schema.properties.framework.enum);
const VALID_SEVERITIES = new Set(schema.properties.severity.enum);
const VALID_DETECTION_TYPES = new Set(
  schema.properties.detection.properties.type.enum
);
const VALID_SOURCE_TYPES = new Set(
  schema.properties.source.properties.source_type.enum
);
const VALID_POLICY_STATUSES = new Set(
  schema.properties.source.properties.policy_status.enum
);
const ID_PATTERN = /^[A-Z]+-[A-Za-z0-9-]+$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

// Heuristic for catastrophic backtracking: nested quantifiers
const BACKTRACK_PATTERNS = [
  /\([^)]*[+*][^)]*\)[+*]/,     // (a+)+ or (a*)*
  /\([^)]*\|[^)]*\)[+*]{2,}/,   // (a|b)** style
];

function findRuleFiles(dir) {
  const files = [];
  for (const fw of readdirSync(join(dir, "rules"))) {
    const rulesDir = join(dir, "rules", fw, "rules");
    try {
      for (const file of readdirSync(rulesDir)) {
        if (file.endsWith(".json")) {
          files.push(join(rulesDir, file));
        }
      }
    } catch {
      // Directory might not exist
    }
  }
  return files;
}

function validateRule(filePath, rule) {
  const errors = [];
  const warnings = [];

  // Required fields
  const required = schema.required;
  for (const field of required) {
    if (rule[field] === undefined || rule[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // ID format
  if (rule.id && !ID_PATTERN.test(rule.id)) {
    errors.push(`Invalid ID format: "${rule.id}" (must match ${ID_PATTERN})`);
  }

  // Version format
  if (rule.version && !VERSION_PATTERN.test(rule.version)) {
    errors.push(`Invalid version: "${rule.version}" (must be semver)`);
  }

  // Framework
  if (rule.framework && !VALID_FRAMEWORKS.has(rule.framework)) {
    errors.push(`Invalid framework: "${rule.framework}"`);
  }

  // Severity
  if (rule.severity && !VALID_SEVERITIES.has(rule.severity)) {
    errors.push(`Invalid severity: "${rule.severity}"`);
  }

  // Title min length
  if (rule.title && rule.title.length < 5) {
    errors.push(`Title too short: "${rule.title}" (min 5 chars)`);
  }

  // Summary min length
  if (rule.summary && rule.summary.length < 10) {
    errors.push(`Summary too short (min 10 chars)`);
  }

  // Detection
  if (rule.detection) {
    if (!VALID_DETECTION_TYPES.has(rule.detection.type)) {
      errors.push(`Invalid detection type: "${rule.detection.type}"`);
    }

    // Validate regex patterns
    if (rule.detection.patterns) {
      for (const pattern of rule.detection.patterns) {
        try {
          new RegExp(pattern, "gi");
        } catch (e) {
          errors.push(`Invalid regex pattern: "${pattern}" - ${e.message}`);
        }

        // Backtracking heuristic
        for (const bt of BACKTRACK_PATTERNS) {
          if (bt.test(pattern)) {
            warnings.push(
              `Possible catastrophic backtracking in pattern: "${pattern}"`
            );
          }
        }
      }
    }
  }

  // Remediation
  if (rule.remediation) {
    if (
      rule.remediation.guidance &&
      rule.remediation.guidance.length < 10
    ) {
      errors.push(`Remediation guidance too short (min 10 chars)`);
    }
  }

  // Source
  if (rule.source) {
    if (!VALID_SOURCE_TYPES.has(rule.source.source_type)) {
      errors.push(`Invalid source_type: "${rule.source.source_type}"`);
    }
    if (!VALID_POLICY_STATUSES.has(rule.source.policy_status)) {
      errors.push(`Invalid policy_status: "${rule.source.policy_status}"`);
    }
    if (rule.source.source_url && !rule.source.source_url.startsWith("http")) {
      errors.push(`Invalid source_url: "${rule.source.source_url}"`);
    }
  }

  return { errors, warnings };
}

function main() {
  const ruleFiles = findRuleFiles(ROOT);
  console.log(`Found ${ruleFiles.length} rule files\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  const seenIds = new Map();

  for (const filePath of ruleFiles) {
    let rule;
    try {
      rule = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (e) {
      console.error(`PARSE ERROR: ${filePath} - ${e.message}`);
      totalErrors++;
      continue;
    }

    // Duplicate ID check
    if (seenIds.has(rule.id)) {
      console.error(
        `DUPLICATE ID: "${rule.id}" in ${filePath} (first seen in ${seenIds.get(rule.id)})`
      );
      totalErrors++;
    } else {
      seenIds.set(rule.id, filePath);
    }

    const { errors, warnings } = validateRule(filePath, rule);

    if (errors.length > 0) {
      console.error(`ERRORS in ${rule.id || filePath}:`);
      for (const e of errors) console.error(`  - ${e}`);
      totalErrors += errors.length;
    }

    if (warnings.length > 0) {
      console.warn(`WARNINGS in ${rule.id || filePath}:`);
      for (const w of warnings) console.warn(`  - ${w}`);
      totalWarnings += warnings.length;
    }
  }

  console.log(`\nValidation complete:`);
  console.log(`  Rules: ${ruleFiles.length}`);
  console.log(`  Unique IDs: ${seenIds.size}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.error("\nValidation FAILED");
    process.exit(1);
  }

  console.log("\nValidation PASSED");
}

main();
