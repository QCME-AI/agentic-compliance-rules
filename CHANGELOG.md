# Changelog

## [0.1.0] - 2026-02-10

### Added

**208 compliance rules across 8 regulatory frameworks:**

| Framework | Rules | Jurisdiction |
|-----------|-------|-------------|
| FTC | 95 | US |
| HIPAA | 17 | US |
| GDPR | 25 | EU |
| SEC 482 | 15 | US |
| SEC Marketing | 18 | US |
| CCPA | 12 | US-CA |
| COPPA | 12 | US |
| CAN-SPAM | 14 | US |

**6 Claude Code skills:**
- `/validate-copy` — General compliance review of marketing content
- `/explain-rule` — Look up and explain a specific rule
- `/check-email` — Email-specific compliance review
- `/check-privacy-policy` — Privacy policy disclosure checker
- `/list-rules` — Browse and filter available rules
- `/draft-disclosures` — Generate draft compliance language

**Tooling & infrastructure:**
- JSON Schema for rules (`schemas/rule.schema.json`) and packs (`schemas/rule-pack.schema.json`)
- Validation tools: schema validation, fixture checks, licensing checks, index builder
- CI workflows for validation and automated npm release on git tags
- ESM package with JSON imports and named exports
