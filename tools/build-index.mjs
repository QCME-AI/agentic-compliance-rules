#!/usr/bin/env node

/**
 * Builds dist/index.json and dist/rules.min.json from all rule packs.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadPack(framework) {
  const packFile = join(ROOT, "rules", framework, "pack.json");
  if (!existsSync(packFile)) return null;
  return JSON.parse(readFileSync(packFile, "utf8"));
}

function loadRules(framework) {
  const rulesDir = join(ROOT, "rules", framework, "rules");
  if (!existsSync(rulesDir)) return [];
  return readdirSync(rulesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(rulesDir, f), "utf8")));
}

function main() {
  const frameworks = readdirSync(join(ROOT, "rules")).filter((f) => {
    return existsSync(join(ROOT, "rules", f, "pack.json"));
  });

  const index = {
    version: "0.1.0",
    generated_at: new Date().toISOString(),
    packs: [],
    rules: [],
  };

  for (const fw of frameworks) {
    const pack = loadPack(fw);
    const rules = loadRules(fw);

    if (pack) {
      index.packs.push(pack);
    }

    index.rules.push(...rules);
    console.log(`${fw}: ${rules.length} rules`);
  }

  console.log(`\nTotal: ${index.rules.length} rules in ${index.packs.length} packs`);

  const distDir = join(ROOT, "dist");
  mkdirSync(distDir, { recursive: true });
  writeFileSync(
    join(distDir, "index.json"),
    JSON.stringify(index, null, 2) + "\n"
  );
  writeFileSync(
    join(distDir, "rules.min.json"),
    JSON.stringify(index) + "\n"
  );

  // ESM wrapper so `import rules from '@qcme/agentic-compliance-rules'` works without import attributes
  const wrapper = `import rules from './index.json' with { type: 'json' };
export default rules;
export const { packs, version } = rules;
export const allRules = rules.rules;
`;
  writeFileSync(join(distDir, "index.js"), wrapper);

  console.log(`\nWrote dist/index.json, dist/rules.min.json, and dist/index.js`);
}

main();
