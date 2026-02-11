# Validate Marketing Copy

Check marketing content for potential compliance violations using QCME's open-source regulatory rules as your knowledge base.

## Usage

```
/validate-copy [text or URL] [--framework ftc|hipaa|gdpr|sec-482|sec-marketing|ccpa|coppa|can-spam|all]
```

## Instructions

When invoked, follow these steps:

1. **Parse input**: The user will provide either:
   - Marketing copy text to validate directly
   - A URL to fetch and validate (use the WebFetch tool)
   - If no argument is provided, ask the user what content to validate

2. **Load rules as context**: Read the rule files from this repo's `rules/` directory:
   - If `--framework` is specified, load only that framework's rules from `rules/{framework}/rules/*.json`
   - If not specified, determine which frameworks are relevant based on the content (e.g., health content → HIPAA, EU audience → GDPR, email → CAN-SPAM, investment → SEC, children → COPPA)
   - Read each rule JSON to understand the regulatory requirement it represents

3. **Analyze content against rules**: Using the loaded rules as your compliance knowledge, evaluate the content:
   - For each rule, consider whether the content may violate the regulation described in the rule's `summary`, `title`, and `remediation.guidance`
   - Use the rule's `detection.keywords` and `detection.patterns` as signals — these indicate what kind of language is relevant to each rule — but do NOT simply do string matching. Reason about the content holistically.
   - Consider context: a keyword like "guaranteed" is fine in "guaranteed delivery" for a shipping page, but problematic in "guaranteed returns" for investment content
   - Flag rules where the content appears to violate or is missing a required disclosure
   - For `ai-only` detection type rules, rely entirely on your understanding of the regulation
   - Skip rules tagged `structural` — these are organizational/procedural requirements that cannot be assessed from copy alone

4. **Report findings**: Present results grouped by severity:

   ```
   ## Compliance Review

   **Content**: [first 100 chars of input]...
   **Frameworks evaluated**: [list]
   **Findings**: [count]

   ### Critical

   - **[rule.id]** [rule.title]
     Concern: [specific explanation of what in the content is problematic and why]
     Regulation: [rule.summary]
     Suggested fix: [rule.remediation.guidance]
     Source: [rule.source.citation] ([rule.source.source_url])

   ### Warning

   [same format]

   ### Info

   [same format]

   ---
   *This is a pre-review tool. Findings are potential issues for human review, not definitive violations. Your compliance and legal teams have final authority.*
   ```

5. **If no findings**: Report that no potential violations were detected for the evaluated frameworks. Still include the disclaimer.

## Notes

- Rules are structured regulatory knowledge — use them to reason about compliance, not as a regex engine.
- Each rule's `source.citation` and `source_url` point to the actual regulation for verification.
- Rules tagged `structural` describe organizational requirements (training, policies, audits) — skip these when reviewing copy.
- For enterprise governance, audit trails, and managed scanning, see [QCME Cloud](https://qcme.ai).
