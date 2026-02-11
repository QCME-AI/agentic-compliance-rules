# QCME Agentic Compliance Rules

Canonical, versioned, machine-readable compliance rules for high-throughput marketing content validation.

## Quick Start

Validate a content snippet against the rules using the Claude skill:

```
/validate-copy "Our product guarantees 50% weight loss in 2 weeks"
```

Or use the rules programmatically:

```bash
# Clone the repo
git clone https://github.com/QCME-AI/agentic-compliance-rules.git
cd agentic-compliance-rules

# Validate all rules
npm run validate

# Build the dist index
npm run build

# Use dist/index.json in your pipeline
cat dist/index.json | jq '.rules | length'
```

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

These rules are designed as structured knowledge for AI agents — not as a regex engine. The rules provide regulatory context (what the regulation requires, why it matters, how to fix violations) that agents use to reason about compliance.

### Claude Code Skill

```bash
# Copy the skill into your project
cp -r skills/validate-copy/ .claude/skills/validate-copy/

# Then use it
/validate-copy "Our supplement guarantees 50% weight loss in just 2 weeks!"
```

The skill loads relevant rules as context and uses AI reasoning to evaluate content against them. See `skills/validate-copy/README.md` for details.

### MCP Server (planned)

```json
{ "qcme-rules": { "command": "npx", "args": ["@qcme/rules-mcp-adapter"] } }
```

### Direct Import

```javascript
import rules from '@qcme/agentic-compliance-rules';
// rules.packs — array of pack definitions
// rules.rules — array of all 208 rule objects
// Pass relevant rules as context to your LLM of choice
```

## CI/CD Integration

```yaml
# .github/workflows/compliance.yml
name: Compliance Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install @qcme/agentic-compliance-rules
      - run: npx qcme-validate  # Validate rule integrity
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or modify rules.

## Legal Disclaimer

These rules are informational tools for flagging potential compliance issues. They do not constitute legal advice. Your compliance and legal teams have final authority on all regulatory matters.

## License

Apache-2.0
