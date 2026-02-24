# CLAUDE.md

## Project

`@qcme/agentic-compliance-rules` — 208 machine-readable compliance rules across 8 frameworks (FTC, HIPAA, GDPR, SEC 482, SEC Marketing, CCPA, COPPA, CAN-SPAM) for LLM-powered content review.

## Distribution channels

- **npm**: `npm install @qcme/agentic-compliance-rules` (package version in `package.json`)
- **ClawHub**: `npx clawhub install compliance-officer` — latest published: **1.0.8** (`skills/compliance-officer/claw.json` tracks version)
- **Claude skill repo PR**: https://github.com/anthropics/skills/pull/395 (branch: `compliance-officer-skill` on `arberx/skills` fork)
- **GitHub Releases**: auto-published on push to `main` via `.github/workflows/release.yml`

## Key commands

```bash
npm run ci                # validate + build everything
npm run build:all         # build dist + skill reference files
npm run validate          # schema + regex safety checks
npm run validate:fixtures # fixture coverage
npx clawhub publish skills/compliance-officer --version <semver>  # publish to clawhub
```

## Build artifacts

- `dist/index.json` — full compiled rules
- `dist/rules.min.json` — minified
- `skills/compliance-officer/references/` — per-framework JSON files for Claude Code skills

FTC rules are split into 3 files to fit Claude Code token limits:
- `rules-ftc-claims.json` (49 rules)
- `rules-ftc-endorsements.json` (33 rules)
- `rules-ftc-dark-patterns.json` (13 rules)

## Deployment checklist

1. Merge to `main` → auto-releases to npm + GitHub Packages + GitHub Releases
2. `npx clawhub publish skills/compliance-officer --version <next>` → ClawHub
3. Push to `arberx/skills:compliance-officer-skill` → updates anthropics/skills PR #395
