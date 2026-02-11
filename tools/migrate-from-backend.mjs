#!/usr/bin/env node

/**
 * One-time migration script: converts rules from backend/output/all-rules.json
 * into the new normalized schema for FTC, HIPAA, and GDPR frameworks.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BACKEND_RULES = join(ROOT, "..", "..", "backend", "output", "all-rules.json");

const FRAMEWORK_MAP = {
  FTC: {
    id: "ftc",
    source_type: "public_law",
    policy_status: "allowed",
    attribution_required: false,
    jurisdiction: ["US"],
    description:
      "FTC Endorsement Guides and advertising rules covering endorsements, claims, disclosures, and consumer protection",
  },
  HIPAA: {
    id: "hipaa",
    source_type: "public_law",
    policy_status: "allowed",
    attribution_required: false,
    jurisdiction: ["US"],
    description:
      "HIPAA Privacy and Security rules covering PHI protection, consent requirements, and privacy notices",
  },
  GDPR: {
    id: "gdpr",
    source_type: "public_law",
    policy_status: "allowed_with_attribution",
    attribution_required: true,
    jurisdiction: ["EU"],
    description:
      "GDPR rules covering consent, privacy policies, data subject rights, and international transfers",
  },
};

const TARGET_FRAMEWORKS = new Set(Object.keys(FRAMEWORK_MAP));

function detectDetectionType(rule) {
  const hasPatterns = rule.patterns && rule.patterns.length > 0;
  const hasKeywords = rule.keywords && rule.keywords.length > 0;
  if (hasPatterns && hasKeywords) return "hybrid";
  if (hasPatterns) return "pattern";
  return "keyword";
}

function deriveTag(rule) {
  const tags = [];
  const text = `${rule.name} ${rule.description}`.toLowerCase();
  if (text.includes("endorsement") || text.includes("testimonial"))
    tags.push("endorsement");
  if (text.includes("disclosure") || text.includes("disclose"))
    tags.push("disclosure");
  if (text.includes("consent")) tags.push("consent");
  if (text.includes("privacy")) tags.push("privacy");
  if (text.includes("claim") || text.includes("substantiat"))
    tags.push("claims");
  if (text.includes("phi") || text.includes("health")) tags.push("health-data");
  if (text.includes("cookie")) tags.push("cookies");
  if (text.includes("data") && text.includes("right")) tags.push("data-rights");
  if (text.includes("transfer")) tags.push("data-transfer");
  if (text.includes("fee") || text.includes("price")) tags.push("pricing");
  if (tags.length === 0) tags.push("general");
  return tags;
}

function transformRule(rule, fwConfig) {
  return {
    id: rule.id,
    version: "1.0.0",
    framework: fwConfig.id,
    title: rule.name,
    severity: rule.severity,
    summary: rule.description,
    rationale: "",
    detection: {
      type: detectDetectionType(rule),
      ...(rule.patterns && rule.patterns.length > 0
        ? { patterns: rule.patterns }
        : {}),
      ...(rule.keywords && rule.keywords.length > 0
        ? { keywords: rule.keywords }
        : {}),
    },
    remediation: {
      guidance: rule.suggestion,
      examples: [],
    },
    source: {
      source_type: fwConfig.source_type,
      policy_status: fwConfig.policy_status,
      citation: rule.section,
      source_url: rule.referenceUrl,
      retrieved_at: "2026-02-09",
      attribution_required: fwConfig.attribution_required,
    },
    metadata: {
      tags: deriveTag(rule),
      jurisdiction: fwConfig.jurisdiction,
      content_types: ["landing-page", "marketing"],
      owner: "qcme-core",
    },
  };
}

function main() {
  console.log("Reading backend rules from:", BACKEND_RULES);

  if (!existsSync(BACKEND_RULES)) {
    console.error("Source file not found:", BACKEND_RULES);
    process.exit(1);
  }

  const allRules = JSON.parse(readFileSync(BACKEND_RULES, "utf8"));
  console.log(`Total rules in source: ${allRules.length}`);

  const stats = {};

  for (const [fwName, fwConfig] of Object.entries(FRAMEWORK_MAP)) {
    const fwRules = allRules.filter((r) => r.framework === fwName);
    console.log(`\n${fwName}: ${fwRules.length} rules`);
    stats[fwConfig.id] = fwRules.length;

    const rulesDir = join(ROOT, "rules", fwConfig.id, "rules");
    mkdirSync(rulesDir, { recursive: true });

    const ruleIds = [];

    for (const rule of fwRules) {
      const transformed = transformRule(rule, fwConfig);
      ruleIds.push(transformed.id);

      const ruleFile = join(rulesDir, `${transformed.id}.json`);
      writeFileSync(ruleFile, JSON.stringify(transformed, null, 2) + "\n");
    }

    // Write pack.json
    const pack = {
      pack_id: fwConfig.id,
      pack_version: "0.1.0",
      framework: fwConfig.id,
      description: fwConfig.description,
      rule_ids: ruleIds,
    };

    const packFile = join(ROOT, "rules", fwConfig.id, "pack.json");
    writeFileSync(packFile, JSON.stringify(pack, null, 2) + "\n");
    console.log(`  Wrote ${ruleIds.length} rules + pack.json`);

    // Create fixture directories
    for (const ruleId of ruleIds) {
      const fixtureDir = join(ROOT, "fixtures", fwConfig.id, ruleId);
      mkdirSync(join(fixtureDir, "positive"), { recursive: true });
      mkdirSync(join(fixtureDir, "negative"), { recursive: true });
    }
    console.log(`  Created fixture directories`);
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  console.log(`\nMigration complete: ${total} rules across ${Object.keys(stats).length} frameworks`);
  console.log(stats);
}

main();
