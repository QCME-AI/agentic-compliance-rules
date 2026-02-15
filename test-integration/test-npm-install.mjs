#!/usr/bin/env node

/**
 * Integration test: Install the npm package from local tarball and validate all import paths.
 *
 * Run from project root:
 *   node test-integration/test-npm-install.mjs
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const pkgJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
const pkgVersion = pkgJson.version;
const tarball = join(projectRoot, `qcme-agentic-compliance-rules-${pkgVersion}.tgz`);

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

console.log('=== npm install integration test ===\n');

// Setup: create temp project and install the tarball
console.log('Setting up temp project...');
tempDir = mkdtempSync(join(tmpdir(), 'qcme-test-'));
execSync(`cd "${tempDir}" && npm init -y --silent 2>/dev/null`);

// Set to ESM
const pkg = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
pkg.type = 'module';
const { writeFileSync } = await import('node:fs');
writeFileSync(join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));

console.log(`Installing from ${tarball}...`);
execSync(`cd "${tempDir}" && npm install "${tarball}" --silent 2>&1`, { stdio: 'pipe' });
console.log('Installed.\n');

// Test 1: Default import
console.log('--- Import paths ---');
test('default import returns object with rules array', () => {
  const script = `
    import rules from '@qcme/agentic-compliance-rules';
    const out = { type: typeof rules, hasRules: Array.isArray(rules.rules), count: rules.rules.length };
    process.stdout.write(JSON.stringify(out));
  `;
  writeFileSync(join(tempDir, 'test1.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test1.mjs')}"`, { encoding: 'utf8' }));
  assert(result.type === 'object', `Expected object, got ${result.type}`);
  assert(result.hasRules === true, 'rules should be an array');
  assert(result.count === 208, `Expected 208 rules, got ${result.count}`);
});

// Test 2: Named exports
test('named exports: allRules, version, packs', () => {
  const script = `
    import { allRules, version, packs } from '@qcme/agentic-compliance-rules';
    const out = {
      rulesCount: allRules.length,
      version,
      packsCount: packs.length,
      packIds: packs.map(p => p.pack_id).sort()
    };
    process.stdout.write(JSON.stringify(out));
  `;
  writeFileSync(join(tempDir, 'test2.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test2.mjs')}"`, { encoding: 'utf8' }));
  assert(result.rulesCount === 208, `Expected 208 allRules, got ${result.rulesCount}`);
  assert(result.version === pkgVersion, `Expected version ${pkgVersion}, got ${result.version}`);
  assert(result.packsCount === 8, `Expected 8 packs, got ${result.packsCount}`);
  const expected = ['can-spam', 'ccpa', 'coppa', 'ftc', 'gdpr', 'hipaa', 'sec-482', 'sec-marketing'];
  assert(JSON.stringify(result.packIds) === JSON.stringify(expected), `Packs mismatch: ${result.packIds}`);
});

// Test 3: Direct JSON import
test('direct JSON import path works', () => {
  const script = `
    import index from '@qcme/agentic-compliance-rules/index.json' with { type: 'json' };
    process.stdout.write(JSON.stringify({ count: index.rules.length, version: index.version }));
  `;
  writeFileSync(join(tempDir, 'test3.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test3.mjs')}"`, { encoding: 'utf8' }));
  assert(result.count === 208, `Direct JSON: Expected 208 rules, got ${result.count}`);
});

// Test 4: Framework filtering
console.log('\n--- Framework filtering ---');
const frameworks = {
  ftc: 95,
  hipaa: 17,
  gdpr: 25,
  'sec-482': 15,
  'sec-marketing': 18,
  ccpa: 12,
  coppa: 12,
  'can-spam': 14,
};

for (const [fw, expected] of Object.entries(frameworks)) {
  test(`filter ${fw} → ${expected} rules`, () => {
    const script = `
      import { allRules } from '@qcme/agentic-compliance-rules';
      const filtered = allRules.filter(r => r.framework === '${fw}');
      process.stdout.write(String(filtered.length));
    `;
    writeFileSync(join(tempDir, 'test_fw.mjs'), script);
    const count = parseInt(execSync(`node "${join(tempDir, 'test_fw.mjs')}"`, { encoding: 'utf8' }));
    assert(count === expected, `Expected ${expected} ${fw} rules, got ${count}`);
  });
}

// Test 5: Rule schema validation
console.log('\n--- Rule schema spot checks ---');
test('every rule has required fields: id, version, framework, title, severity, summary, detection, remediation, source, metadata', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const required = ['id', 'version', 'framework', 'title', 'severity', 'summary', 'detection', 'remediation', 'source', 'metadata'];
    const missing = [];
    for (const rule of allRules) {
      for (const field of required) {
        if (!(field in rule)) missing.push(rule.id + ':' + field);
      }
    }
    process.stdout.write(JSON.stringify(missing));
  `;
  writeFileSync(join(tempDir, 'test5.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test5.mjs')}"`, { encoding: 'utf8' }));
  assert(result.length === 0, `Missing fields: ${result.join(', ')}`);
});

test('every rule.source has citation and source_url', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const issues = [];
    for (const rule of allRules) {
      if (!rule.source.citation) issues.push(rule.id + ':citation');
      if (!rule.source.source_url) issues.push(rule.id + ':source_url');
    }
    process.stdout.write(JSON.stringify(issues));
  `;
  writeFileSync(join(tempDir, 'test6.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test6.mjs')}"`, { encoding: 'utf8' }));
  assert(result.length === 0, `Missing source fields: ${result.join(', ')}`);
});

test('no duplicate rule IDs', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const ids = allRules.map(r => r.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    process.stdout.write(JSON.stringify(dupes));
  `;
  writeFileSync(join(tempDir, 'test7.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test7.mjs')}"`, { encoding: 'utf8' }));
  assert(result.length === 0, `Duplicate IDs: ${result.join(', ')}`);
});

test('severity is always critical, warning, or info', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const valid = ['critical', 'warning', 'info'];
    const bad = allRules.filter(r => !valid.includes(r.severity)).map(r => r.id + ':' + r.severity);
    process.stdout.write(JSON.stringify(bad));
  `;
  writeFileSync(join(tempDir, 'test8.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test8.mjs')}"`, { encoding: 'utf8' }));
  assert(result.length === 0, `Invalid severities: ${result.join(', ')}`);
});

// Test 6: Realistic usage - build LLM context
console.log('\n--- Realistic usage ---');
test('build LLM compliance context (filter + serialize)', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const ftcRules = allRules
      .filter(r => r.framework === 'ftc' && !r.metadata.tags.includes('structural'))
      .map(r => ({ id: r.id, summary: r.summary, severity: r.severity }));
    const context = JSON.stringify(ftcRules);
    const out = { ruleCount: ftcRules.length, contextBytes: context.length, hasContent: context.length > 1000 };
    process.stdout.write(JSON.stringify(out));
  `;
  writeFileSync(join(tempDir, 'test9.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test9.mjs')}"`, { encoding: 'utf8' }));
  assert(result.ruleCount > 50, `Expected >50 non-structural FTC rules, got ${result.ruleCount}`);
  assert(result.hasContent, 'Context should be >1000 bytes');
});

test('filter by tag (endorsement)', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const endorsementRules = allRules.filter(r => r.metadata.tags.includes('endorsement'));
    process.stdout.write(JSON.stringify({ count: endorsementRules.length, ids: endorsementRules.map(r => r.id) }));
  `;
  writeFileSync(join(tempDir, 'test10.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test10.mjs')}"`, { encoding: 'utf8' }));
  assert(result.count > 0, 'Should have endorsement tagged rules');
});

test('filter by content type (email)', () => {
  const script = `
    import { allRules } from '@qcme/agentic-compliance-rules';
    const emailRules = allRules.filter(r => r.metadata.content_types && r.metadata.content_types.includes('email'));
    process.stdout.write(JSON.stringify({ count: emailRules.length }));
  `;
  writeFileSync(join(tempDir, 'test11.mjs'), script);
  const result = JSON.parse(execSync(`node "${join(tempDir, 'test11.mjs')}"`, { encoding: 'utf8' }));
  assert(result.count > 0, 'Should have email content type rules');
});

// Cleanup
console.log('\n--- Cleanup ---');
rmSync(tempDir, { recursive: true, force: true });
console.log('  Temp directory cleaned up.\n');

// Summary
console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
