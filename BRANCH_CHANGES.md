# Branch Changes: `arberx/chennai`

Summary of all changes on this branch for the open-source compliance rules package.

## What This Branch Does

Ships `@qcme/agentic-compliance-rules` — a standalone, open-source package of 208 machine-readable compliance rules across 8 regulatory frameworks. These rules are structured knowledge for AI agents to reason about marketing/content compliance, not a regex engine.

## Change Categories

### 1. New Package Scaffold

**`packages/agentic-compliance-rules/`** — entirely new package.

| File | Purpose |
|------|---------|
| `package.json` | npm package config, zero dependencies, `main: ./dist/index.json` |
| `LICENSE` | Apache-2.0 |
| `README.md` | Quick start, rule packs table, schema docs, agent integration guide |
| `CONTRIBUTING.md` | How to add/modify rules |
| `CHANGELOG.md` | v0.1.0 initial release notes |
| `schemas/rule.schema.json` | JSON Schema for individual rules |
| `schemas/rule-pack.schema.json` | JSON Schema for pack manifests |
| `tools/validate-rules.mjs` | Schema validation for all rule files |
| `tools/validate-fixtures.mjs` | Test fixture validation |
| `tools/build-index.mjs` | Builds `dist/index.json` and `dist/rules.min.json` |
| `tools/check-licensing.mjs` | Verifies source provenance and licensing compliance |
| `tools/migrate-from-backend.mjs` | Migration script from `backend/output/all-rules.json` |
| `.github/workflows/ci.yml` | CI: validate, check licensing, build |
| `.github/workflows/release.yml` | Release pipeline |

### 2. Rule Packs (208 rules total)

| Pack | Rules | Source | Notes |
|------|-------|--------|-------|
| **FTC** | 95 | Migrated from `backend/src/scrapers/` | Endorsements (16 CFR 255), Green Guides (16 CFR 260), Pricing (16 CFR 233/238/251), Dark Patterns, Claims, Reviews, Native Ads, Made in USA. 12 dead rules fixed to `ai-only`. 6 orphaned green rules wired up. 1 rule got keywords added. |
| **HIPAA** | 17 | Migrated from `backend/src/scrapers/privacy.ts` | 2 rules upgraded to hybrid detection with specific patterns/keywords. 8 structural rules tagged. |
| **GDPR** | 25 | 17 migrated + 8 new | 5 migrated rules upgraded to hybrid. 6 structural tagged. **New**: Art.22 automated decisions, Art.9 special categories, Art.8 children, Art.13 recipients/complaints/legitimate interest, Art.7 unbundled consent, Art.14 indirect collection. |
| **SEC 482** | 15 | New from `backend/src/scrapers/ecfr.ts` | Investment company advertising: performance data, fee disclosures, risk statements, FDIC disclaimer, benchmarks, prospectus requirements. |
| **SEC Marketing** | 18 | New from `backend/src/scrapers/ecfr.ts` | Investment adviser marketing: testimonials, endorsements, ratings, hypothetical/backtested performance, predecessor performance. |
| **CCPA** | 12 | New from `backend/src/scrapers/privacy.ts` | California privacy: Do Not Sell link, opt-out of sale, sensitive PI, pre-collection notice, consumer rights, privacy policy. |
| **COPPA** | 12 | New (authored from 16 CFR 312) | Children's online privacy: parental consent, age screening, privacy notices, data retention, safe harbor, ed-tech exception. |
| **CAN-SPAM** | 14 | New (authored from 15 USC 7704 + 16 CFR 316) | Email marketing: sender ID, subject lines, physical address, opt-out mechanism, transactional email classification. |

### 3. Quality Fixes Applied to Migrated Rules

| Fix | Rules Affected | Details |
|-----|---------------|---------|
| Dead rules → `ai-only` | 12 FTC rules | Had `type: "keyword"` with empty keywords array. Changed to `ai-only` and tagged `structural`. |
| Added keywords | FTC-255-5-disclosure-clear | Was dead (no keywords). Added: "fine print", "small print", "terms and conditions apply", etc. |
| Pack deduplication | FTC pack.json | Removed duplicate IDs (FTC-255-1-honest, FTC-255-4-org appeared twice). |
| Build crash fix | `tools/build-index.mjs` | Added `mkdirSync` — build would crash if `dist/` didn't exist. |
| Keyword upgrades | 5 GDPR + 2 HIPAA | Replaced generic keywords (e.g., "controller", "identity", "contact") with specific multi-word phrases and added regex patterns for hybrid detection. |
| Structural tagging | 12 FTC + 6 GDPR + 8 HIPAA | Added `"structural"` tag to organizational/procedural rules that can't be assessed from copy alone. |
| Orphaned green rules | 6 FTC-GREEN-* | `createGreenClaimRules()` in `ftc-marketing.ts` was defined but never called. Created rule files manually. |

### 4. Claude Skill

**`skills/validate-copy/`** — rewritten to use rules as AI context, not regex.

Old approach: Claude manually executes regex patterns and substring matches against text.
New approach: Claude loads rule definitions as structured regulatory knowledge and reasons about compliance holistically. Keywords/patterns serve as signals, not as a standalone detection engine.

### 5. Landing Page

Small changes to `landing_page/` adding an open-rules section and minor copy updates. Not part of the rules package.

### 6. What Was NOT Included

- **FINRA** — copyrighted by a private SRO, not public law. Excluded from OSS.
- **GIPS** — owned by CFA Institute, needs permission. Excluded.
- **GMC** — Google platform rules, `derivative_only` license. Excluded.
- **MCP server** — planned (`@qcme/rules-mcp-adapter`) but not built yet.

## Validation

All checks pass:

```
$ node tools/validate-rules.mjs
Rules: 208, Unique IDs: 208, Errors: 0 — PASSED

$ node tools/build-index.mjs
8 packs, 208 rules — Wrote dist/index.json and dist/rules.min.json

$ node tools/check-licensing.mjs
Rules checked: 208, Errors: 0 — PASSED
```

## Framework Schema

Supported frameworks in `schemas/rule.schema.json`:
`ftc`, `hipaa`, `gdpr`, `sec-482`, `sec-marketing`, `ccpa`, `coppa`, `can-spam`, `finra`, `gips`, `gmc`, `visual-ai`

(finra/gips/gmc/visual-ai are in the schema enum for backend compatibility but have no OSS rule files)

## Next Steps

1. **MCP Server** — `@qcme/rules-mcp-adapter` with `rules.search`, `rules.get`, `rules.frameworks` tools
2. **Additional Skills** — `/explain-rule`, `/check-email`, `/check-privacy-policy`
3. **Test Fixtures** — Currently 10 fixture sets covering 10/208 rules. Need fixtures for remaining rules.
4. **Future Frameworks** — ePrivacy Directive (cookie consent), CASL (Canada email), TCPA (SMS consent)
