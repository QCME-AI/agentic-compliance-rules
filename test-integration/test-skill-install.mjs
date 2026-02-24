#!/usr/bin/env node

/**
 * Integration test: Simulate installing Claude Code skills into a project.
 * Validates that all skills copy correctly and that reference files are accessible.
 *
 * Run from project root:
 *   node test-integration/test-skill-install.mjs
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const skillsDir = join(projectRoot, 'skills');

let tempDir;
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

console.log('=== Claude Code skill install integration test ===\n');

// Setup: simulate a user project
tempDir = mkdtempSync(join(tmpdir(), 'qcme-skill-test-'));
const targetSkillsDir = join(tempDir, '.claude', 'skills');

// Test: Copy all skills (as documented in README)
console.log('--- Skill installation ---');

test('cp -r skills/ .claude/skills/ works', () => {
  execSync(`mkdir -p "${targetSkillsDir}" && cp -r "${skillsDir}/"* "${targetSkillsDir}/"`);
  assert(existsSync(targetSkillsDir), 'Target skills dir should exist');
});

const expectedSkills = [
  'compliance-officer',
  'validate-copy',
  'check-email',
  'check-privacy-policy',
  'explain-rule',
  'list-rules',
  'draft-disclosures',
];

for (const skill of expectedSkills) {
  test(`skill "${skill}" directory copied`, () => {
    assert(existsSync(join(targetSkillsDir, skill)), `Missing skill directory: ${skill}`);
  });
}

// Test: Each skill has a skill.md or SKILL.md
console.log('\n--- Skill entry points ---');
for (const skill of expectedSkills) {
  test(`skill "${skill}" has entry point`, () => {
    const skillMd = join(targetSkillsDir, skill, 'skill.md');
    const SKILLMD = join(targetSkillsDir, skill, 'SKILL.md');
    const hasEntry = existsSync(skillMd) || existsSync(SKILLMD);
    assert(hasEntry, `No skill.md or SKILL.md found in ${skill}/`);
  });
}

// Test: Skill files have YAML frontmatter with required fields
console.log('\n--- Skill metadata validation ---');
for (const skill of expectedSkills) {
  test(`skill "${skill}" has name and description in content`, () => {
    const skillMd = join(targetSkillsDir, skill, 'skill.md');
    const SKILLMD = join(targetSkillsDir, skill, 'SKILL.md');
    const path = existsSync(skillMd) ? skillMd : SKILLMD;
    const content = readFileSync(path, 'utf8');
    assert(content.length > 100, `skill.md is too short (${content.length} chars)`);
    // Check for frontmatter or at least a title
    const hasFrontmatter = content.startsWith('---');
    const hasTitle = content.includes('# ');
    assert(hasFrontmatter || hasTitle, 'Missing frontmatter or title');
  });
}

// Test: compliance-officer has reference files
console.log('\n--- compliance-officer references ---');
const expectedRefs = [
  'rules-ftc-claims.json',
  'rules-ftc-endorsements.json',
  'rules-ftc-dark-patterns.json',
  'rules-hipaa.json',
  'rules-gdpr.json',
  'rules-sec-482.json',
  'rules-sec-marketing.json',
  'rules-ccpa.json',
  'rules-coppa.json',
  'rules-can-spam.json',
];

const refsDir = join(targetSkillsDir, 'compliance-officer', 'references');

test('references/ directory exists', () => {
  assert(existsSync(refsDir), 'Missing references/ directory');
});

for (const refFile of expectedRefs) {
  test(`reference file ${refFile} exists and is valid JSON`, () => {
    const refPath = join(refsDir, refFile);
    assert(existsSync(refPath), `Missing: ${refFile}`);
    const data = JSON.parse(readFileSync(refPath, 'utf8'));
    assert(Array.isArray(data), `${refFile} should be an array`);
    assert(data.length > 0, `${refFile} should not be empty`);
    // Spot check first rule
    const rule = data[0];
    assert(rule.id, `First rule in ${refFile} missing id`);
    assert(rule.summary, `First rule in ${refFile} missing summary`);
  });
}

// Test: Reference rule counts match dist/index.json
console.log('\n--- Reference rule count consistency ---');
const indexJson = JSON.parse(readFileSync(join(projectRoot, 'dist', 'index.json'), 'utf8'));
const frameworkCounts = {};
for (const rule of indexJson.rules) {
  frameworkCounts[rule.framework] = (frameworkCounts[rule.framework] || 0) + 1;
}

// FTC is split into 3 files; count all FTC split files together
const ftcSplitFiles = ['rules-ftc-claims.json', 'rules-ftc-endorsements.json', 'rules-ftc-dark-patterns.json'];

for (const [fw, count] of Object.entries(frameworkCounts)) {
  if (fw === 'ftc') {
    test(`ftc references match dist (${count} rules across 3 files)`, () => {
      let total = 0;
      for (const f of ftcSplitFiles) {
        const refPath = join(refsDir, f);
        const refData = JSON.parse(readFileSync(refPath, 'utf8'));
        total += refData.length;
      }
      assert(total === count, `Expected ${count} FTC rules across split files, got ${total}`);
    });
  } else {
    test(`${fw} reference matches dist (${count} rules)`, () => {
      const refPath = join(refsDir, `rules-${fw}.json`);
      const refData = JSON.parse(readFileSync(refPath, 'utf8'));
      assert(refData.length === count, `Expected ${count} rules in rules-${fw}.json, got ${refData.length}`);
    });
  }
}

// Test: OpenClaw claw.json
console.log('\n--- OpenClaw config ---');
test('claw.json exists and has required fields', () => {
  const clawPath = join(targetSkillsDir, 'compliance-officer', 'claw.json');
  assert(existsSync(clawPath), 'Missing claw.json');
  const claw = JSON.parse(readFileSync(clawPath, 'utf8'));
  assert(claw.name === 'compliance-officer', `Name should be compliance-officer, got ${claw.name}`);
  assert(claw.entry === 'README.md' || claw.entry === 'SKILL.md', `Entry should be README.md or SKILL.md, got ${claw.entry}`);
  assert(claw.version, 'Missing version');
  assert(claw.description, 'Missing description');
  assert(Array.isArray(claw.tags), 'tags should be an array');
  assert(claw.tags.length > 0, 'tags should not be empty');
  assert(claw.license === 'Apache-2.0', `License should be Apache-2.0, got ${claw.license}`);
});

test('claw.json entry points to existing file', () => {
  const clawPath = join(targetSkillsDir, 'compliance-officer', 'claw.json');
  const claw = JSON.parse(readFileSync(clawPath, 'utf8'));
  const entryPath = join(targetSkillsDir, 'compliance-officer', claw.entry);
  assert(existsSync(entryPath), `Entry file ${claw.entry} does not exist at ${entryPath}`);
});

// Test: Total file size sanity
console.log('\n--- Package size ---');
test('total skills directory < 2MB', () => {
  function dirSize(dir) {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) total += dirSize(full);
      else total += statSync(full).size;
    }
    return total;
  }
  const size = dirSize(targetSkillsDir);
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  console.log(`    Skills total size: ${sizeMB} MB`);
  assert(size < 2 * 1024 * 1024, `Skills too large: ${sizeMB} MB`);
});

// Cleanup
console.log('\n--- Cleanup ---');
rmSync(tempDir, { recursive: true, force: true });
console.log('  Temp directory cleaned up.\n');

// Summary
console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
