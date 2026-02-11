# QCME Agentic Compliance Rules

Canonical, versioned, machine-readable compliance rules for AI-powered marketing content validation.

## Why This Package?

LLMs already know a lot about regulations — so why package rules as structured data?

- **Completeness** — An LLM may recall major FTC rules but miss COPPA 312.4(d)(3). This package guarantees all 208 rules are evaluated, every time.
- **Traceability** — Every finding cites a specific regulation (e.g., "16 CFR 255.5") with a direct URL to the source text. Not "I think the FTC requires this."
- **Versioning** — Pin to `rules@0.1.0` for audit purposes. Know exactly which rules were applied and when.
- **Consistency** — Same rule set applied every run. No drift from model updates, temperature, or prompt variation.
- **Open source** — Rules are transparent and community-maintained. You can read, fork, and extend them.

## Rule Packs

| Framework | Rules | Jurisdiction | Status |
|-----------|-------|-------------|--------|
| FTC | 95 | US | `allowed` |
| HIPAA | 17 | US | `allowed` |
| GDPR | 25 | EU | `allowed_with_attribution` |
| SEC 482 | 15 | US | `allowed` |
| SEC Marketing | 18 | US | `allowed` |
| CCPA | 12 | US-CA | `allowed` |
| COPPA | 12 | US | `allowed` |
| CAN-SPAM | 14 | US | `allowed` |

## Quick Start

### Claude Code Skills

The fastest way to use these rules:

```
/validate-copy "Our product guarantees 50% weight loss in 2 weeks"
```

Other available skills:

| Skill | Purpose |
|-------|---------|
| `/validate-copy` | General compliance review of marketing content |
| `/check-email` | Email-specific compliance (CAN-SPAM, opt-out, sender ID) |
| `/check-privacy-policy` | Check privacy policy for required disclosures |
| `/explain-rule` | Look up and explain a specific rule |
| `/list-rules` | Browse and filter available rules |
| `/draft-disclosures` | Generate draft compliance language for flagged issues |

To install skills:

```bash
cp -r skills/ .claude/skills/
```

### Programmatic Use

```bash
npm install @qcme/agentic-compliance-rules
```

```javascript
// ESM
import rules from '@qcme/agentic-compliance-rules';
console.log(rules.rules.length); // 208

// Named exports
import { packs, allRules, version } from '@qcme/agentic-compliance-rules';

// Direct JSON access
import index from '@qcme/agentic-compliance-rules/index.json' with { type: 'json' };
```

### From Source

```bash
git clone https://github.com/QCME-AI/agentic-compliance-rules.git
cd agentic-compliance-rules
npm run build
cat dist/index.json | jq '.rules | length'  # 208
```

## Rule Schema

Each rule follows the schema defined in `schemas/rule.schema.json`:

```json
{
  "id": "FTC-255-5-material-connection",
  "version": "1.0.0",
  "framework": "ftc",
  "title": "Material Connection Disclosure Required",
  "severity": "critical",
  "summary": "Material connections between endorsers and advertisers must be clearly and conspicuously disclosed to consumers.",
  "detection": {
    "type": "hybrid",
    "patterns": ["#(ad|sponsored|paid)\\b", "paid\\s+partnership"],
    "keywords": ["#ad", "#sponsored", "paid partnership", "affiliate link", "material connection"]
  },
  "remediation": {
    "guidance": "Add clear and conspicuous disclosure of the material connection, such as #ad or 'Paid partnership' near the endorsement.",
    "examples": []
  },
  "source": {
    "source_type": "public_law",
    "policy_status": "allowed",
    "citation": "16 CFR 255.5",
    "source_url": "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255",
    "retrieved_at": "2026-02-09",
    "attribution_required": false
  },
  "metadata": {
    "tags": ["endorsement", "disclosure", "material-connection"],
    "jurisdiction": ["US"],
    "content_types": ["landing-page", "marketing"],
    "owner": "qcme-core"
  }
}
```

## Agent Integration

These rules are designed as structured knowledge for AI agents — not as a regex engine. The `detection.patterns` and `detection.keywords` fields are signals that help an AI understand what language each rule is about. The AI reasons about compliance using the full rule definition (summary, remediation guidance, source citation) as context.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or modify rules.

## Legal Disclaimer

These rules are informational tools for flagging potential compliance issues. They do not constitute legal advice. Your compliance and legal teams have final authority on all regulatory matters.

## License

Apache-2.0
