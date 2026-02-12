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

Rule IDs must match `^[A-Z]+-[A-Za-z0-9-]+$`. Use the regulatory section number when possible:
- `FTC-255-5-material-connection`
- `HIPAA-520-notice`
- `GDPR-Art7-consent-conditions`
- `CAN-SPAM-7704-5-opt-out`

Rule IDs are immutable after release. Never reuse a deprecated ID.

## Tags

Rules use tags for filtering. When adding a rule, apply the appropriate tags:

- **`structural`** — Apply this tag to rules that describe organizational or procedural requirements (workforce training, internal audits, policies) rather than content requirements. Rules tagged `structural` are skipped when reviewing marketing copy because they cannot be assessed from content alone.
- **`disclosure`**, **`consent`**, **`endorsement`**, **`dark-pattern`**, **`marketing`**, **`opt-out`**, **`notice`**, **`transparency`** — Content-related tags. Apply whichever are relevant.

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
