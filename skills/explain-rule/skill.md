# Explain Rule

Look up a specific compliance rule by ID and explain the regulation in plain English.

## Usage

```
/explain-rule <rule-id>
```

Example:
```
/explain-rule FTC-255-5-material-connection
```

## Instructions

When invoked, follow these steps:

1. **Parse input**: Extract the rule ID from the argument. If no argument is provided, ask the user for a rule ID.

2. **Load the rule**: Read `dist/index.json` from this repo. Find the rule in the `rules` array where `rule.id` matches the argument (case-sensitive).

3. **If not found**: Report that no rule was found with that ID. List the available framework prefixes from the `packs` array (e.g., FTC, HIPAA, GDPR, SEC-482, SEC-MARKETING, CCPA, COPPA, CAN-SPAM) so the user can try again.

4. **If found, explain the rule**:

   ```
   ## [rule.id] — [rule.title]

   **Framework**: [rule.framework]
   **Severity**: [rule.severity]
   **Jurisdiction**: [rule.metadata.jurisdiction]
   **Tags**: [rule.metadata.tags]

   ### What This Regulation Requires

   [Plain English explanation of what the regulation requires, derived from rule.summary and rule.remediation.guidance. Write for a marketer or developer, not a lawyer.]

   ### What Triggers a Violation

   [Describe the specific language, practices, or omissions that would violate this rule. Use rule.detection.keywords and rule.detection.patterns as examples of triggering language, but explain them in context.]

   ### Examples

   **Non-compliant**: [A realistic example of content that would violate this rule]

   **Compliant**: [The same content rewritten to satisfy the regulation]

   ### How to Fix

   [rule.remediation.guidance]

   ### Source

   [rule.source.citation] — [rule.source.source_url]

   ---
   *This explanation is for educational purposes. Consult your legal team for definitive guidance.*
   ```

## Notes

- This is a reference/educational skill — it explains what a rule means, not whether specific content violates it.
- For content validation, use `/validate-copy` instead.
- Rules tagged `structural` describe organizational requirements (training, policies, audits) — explain this context when the rule has that tag.
