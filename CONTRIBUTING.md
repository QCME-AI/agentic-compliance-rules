# Contributing to QCME Agentic Compliance Rules

## Adding a New Rule

1. Create a JSON file in `rules/{framework}/rules/{RULE-ID}.json`
2. Follow the schema in `schemas/rule.schema.json`
3. Add fixtures in `fixtures/{framework}/{RULE-ID}/`:
   - At least 2 files in `positive/` (text that should trigger the rule)
   - At least 2 files in `negative/` (text that should not trigger the rule)
4. Run `npm run validate` to check your rule
5. Run `npm run validate:fixtures` to check fixture coverage
6. Submit a pull request

## Rule ID Convention

Rule IDs must match `^[A-Z]+-[A-Za-z0-9-]+$`:
- `FTC-ENDORSE-MATERIAL-001`
- `HIPAA-PHI-FORM-001`
- `GDPR-CONSENT-BANNER-001`

Rule IDs are immutable after release. Never reuse a deprecated ID.

## Licensing Requirements

Every rule must include `source` metadata:
- `source_type`: `public_law`, `guidance`, or `contractual`
- `policy_status`: `allowed`, `allowed_with_attribution`, `derivative_only`, or `needs_permission`

Rules from restricted sources (FINRA, GIPS, GMC) require legal review before merge.

## Running Checks

```bash
npm run validate          # Schema + regex safety
npm run validate:fixtures # Fixture coverage
npm run check:licensing   # Source policy checks
npm run build             # Generate dist artifacts
npm run ci                # All checks
```
