# QCME Agentic Compliance Rules

Canonical, versioned, machine-readable compliance rules for AI-powered marketing content validation.

## How It Works

**This package is structured knowledge for LLMs — not a regex engine or scanning tool.**

You feed these rules to an AI model (Claude, GPT, etc.) as context alongside marketing content. The AI reads the rule definitions — what the regulation requires, what to look for, how to fix violations — and reasons about whether the content complies. The AI does the analysis, not pattern matching.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Marketing Copy  │────▶│   LLM + Rules    │────▶│ Compliance      │
│ (your content)  │     │   (as context)   │     │ Findings        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

The `detection.keywords` and `detection.patterns` fields in each rule are **hints for the AI** — they help the model understand what language a rule is about. They are not meant to be compiled or executed as regex.

## Why This Package?

LLMs already know a lot about regulations — so why package rules as structured data?

- **Completeness** — An LLM may recall major FTC rules but miss COPPA 312.4(d)(3). This package guarantees all 208 rules are evaluated, every time.
- **Traceability** — Every finding cites a specific regulation (e.g., "16 CFR 255.5") with a direct URL to the source text. Not "I think the FTC requires this."
- **Versioning** — Pin to a specific version for audit purposes. Know exactly which rules were applied and when.
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

> **Status** indicates the redistribution license of the source regulatory text: `allowed` = public law, freely usable; `allowed_with_attribution` = requires attribution when redistributing.

## Quick Start

### Claude Code Skills

The fastest way to use these rules. Requires [Claude Code](https://claude.ai/code).

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

To install skills in your project:

```bash
cp -r skills/ .claude/skills/
```

### Programmatic Use (AI Pipeline)

This package is ESM-only. Requires Node.js 20+.

```bash
npm install @qcme/agentic-compliance-rules
```

Load the rules and pass them to your LLM as compliance context:

```javascript
import { allRules } from '@qcme/agentic-compliance-rules';
import Anthropic from '@anthropic-ai/sdk';

// Filter to relevant frameworks
const rules = allRules.filter(r =>
  ['ftc', 'can-spam'].includes(r.framework)
);

// Feed rules + content to the LLM
const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: `Review this marketing copy for compliance issues.

Use these compliance rules as your knowledge base. For each rule,
reason about whether the content violates the regulation described
in the rule's summary and remediation guidance. Do NOT regex match —
use the rules as context for your analysis.

Rules:
${JSON.stringify(rules, null, 2)}

Content to review:
"Get 50% off! This supplement is clinically proven to cure diabetes.
Results guaranteed or your money back! - Dr. Smith, Board Certified"`
  }]
});

console.log(response.content[0].text);
```

Other import options:

```javascript
// Default import (full index with packs + rules)
import rules from '@qcme/agentic-compliance-rules';

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

Each rule follows the schema defined in `schemas/rule.schema.json`. Example from `rules/ftc/rules/FTC-255-5-material-connection.json`:

```json
{
  "id": "FTC-255-5-material-connection",
  "version": "1.0.0",
  "framework": "ftc",
  "title": "Material Connection Disclosure Required",
  "severity": "critical",
  "summary": "When there is a material connection between an endorser and seller that would affect the weight of the endorsement, it must be disclosed.",
  "detection": {
    "type": "hybrid",
    "patterns": ["#?ad\\b", "#?sponsored", "#?partner(ship)?", "paid\\s+(partnership|promotion|ad)", "in\\s+collaboration\\s+with"],
    "keywords": ["#ad", "#sponsored", "paid partnership", "affiliate", "material connection"]
  },
  "remediation": {
    "guidance": "Disclose all material connections: payments, free products, employment, family relationships, equity stakes.",
    "examples": []
  },
  "source": {
    "source_type": "public_law",
    "policy_status": "allowed",
    "citation": "16 CFR 255.5",
    "source_url": "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255#255.5",
    "retrieved_at": "2026-02-09",
    "attribution_required": false
  },
  "metadata": {
    "tags": ["endorsement", "disclosure"],
    "jurisdiction": ["US"],
    "content_types": ["landing-page", "marketing"],
    "owner": "qcme-core"
  }
}
```

> **Note on `detection` fields:** The `patterns` and `keywords` are **not meant to be executed as regex**. They describe what language is relevant to the rule so an LLM can understand its scope. The LLM uses the full rule definition — `summary`, `remediation`, `source` — to reason about compliance.

### Tags

Rules are tagged to support filtering. Key tags:

- **`structural`** — Organizational/procedural requirements (training programs, internal policies, audits) that cannot be assessed from marketing content alone. Filter these out when building content-review pipelines.
- **`disclosure`**, **`consent`**, **`endorsement`**, **`dark-pattern`**, **`marketing`**, **`opt-out`** — Content-related tags for narrowing rule sets.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or modify rules.

## Legal Disclaimer

These rules are informational tools for flagging potential compliance issues. They do not constitute legal advice. Your compliance and legal teams have final authority on all regulatory matters.

## License

Apache-2.0
