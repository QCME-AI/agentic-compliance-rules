# validate-copy Claude Skill

A Claude Code skill that reviews marketing content for compliance issues using QCME's open-source regulatory rules as structured knowledge.

## How It Works

The skill loads compliance rule definitions and uses them as context for AI-powered review. Each rule describes a specific regulatory requirement (what it covers, why it matters, how to fix violations). Claude uses these rules as its compliance knowledge base to evaluate your content — not as a regex engine, but as structured regulatory context for intelligent analysis.

## Installation

Copy the skill into your project:

```bash
# From your project root
mkdir -p .claude/skills
cp -r path/to/agentic-compliance-rules/skills/validate-copy .claude/skills/
```

Or clone the full rules repo and reference it:

```bash
git clone https://github.com/QCME-AI/agentic-compliance-rules.git
# The skill references rules relative to the repo root
```

## Usage

In Claude Code, invoke the skill:

```
/validate-copy "Our supplement guarantees 50% weight loss in just 2 weeks!"
```

With a specific framework:

```
/validate-copy --framework ftc "Results not typical. Individual results may vary."
```

## Example Output

```
## Compliance Review

**Content**: "Our supplement guarantees 50% weight loss in just 2 weeks!"
**Frameworks evaluated**: FTC, HIPAA
**Findings**: 2

### Critical

- **FTC-255-1-substantiation** Claim Substantiation
  Concern: "guarantees 50% weight loss" makes a specific health outcome claim that requires competent and reliable scientific evidence to substantiate.
  Regulation: Claims in endorsements must be substantiated by the advertiser.
  Suggested fix: Verify all claims made in endorsements are accurate and can be proven.
  Source: 16 CFR 255.1(b) (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255)

### Warning

- **FTC-255-2-typical** Typical Results Disclosure
  Concern: "50% weight loss in just 2 weeks" presents a specific result without disclosing whether this is typical. If these results are not typical, expected outcomes must be disclosed.
  Regulation: If results are not typical, must clearly disclose expected results or that results may vary.
  Suggested fix: Add "Results not typical" disclaimer with actual expected results.
  Source: 16 CFR 255.2(a) (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255)

---
*This is a pre-review tool. Findings are potential issues for human review, not definitive violations. Your compliance and legal teams have final authority.*
```

## Supported Frameworks

| Framework | Rules | Description |
|-----------|-------|-------------|
| `ftc` | 95 | FTC endorsement, advertising, and green marketing rules |
| `hipaa` | 17 | HIPAA privacy and security rules |
| `gdpr` | 25 | GDPR data protection and privacy rules |
| `sec-482` | 15 | SEC Rule 482 investment company advertising |
| `sec-marketing` | 18 | SEC Marketing Rule for investment advisers |
| `ccpa` | 12 | CCPA/CPRA California privacy rules |
| `coppa` | 12 | COPPA children's online privacy rules |
| `can-spam` | 14 | CAN-SPAM email marketing rules |

## Limitations

- This is a pre-review tool that flags potential issues for human review
- It does not constitute legal advice
- For continuous monitoring and governance, use [QCME Cloud](https://qcme.ai)
