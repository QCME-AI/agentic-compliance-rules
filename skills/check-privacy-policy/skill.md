# Check Privacy Policy

Review a privacy policy for required disclosures across GDPR, CCPA, HIPAA, and COPPA frameworks.

## Usage

```
/check-privacy-policy [URL or text]
```

Examples:
```
/check-privacy-policy https://example.com/privacy
/check-privacy-policy "We collect your name and email to provide our services..."
```

## Instructions

When invoked, follow these steps:

1. **Parse input**: The user will provide either:
   - A URL to a privacy policy page — use the WebFetch tool to retrieve it
   - Pasted privacy policy text
   - If no argument is provided, ask the user for the privacy policy content

2. **Load disclosure-focused rules**: Read `dist/index.json` from this repo. Load only rules relevant to privacy policy disclosures:
   - **GDPR disclosure rules** — rules in the `gdpr` framework tagged `disclosure`, `transparency`, or `notice`, particularly Art.12-14 rules
   - **CCPA disclosure rules** — rules in the `ccpa` framework tagged `disclosure` or `privacy-policy`
   - **HIPAA notice rules** — rules in the `hipaa` framework tagged `notice` or `disclosure`
   - **COPPA notice rules** — rules in the `coppa` framework tagged `notice` or `parental`

3. **Evaluate for PRESENCE of required information**: This is fundamentally different from `/validate-copy`. Instead of looking for violations in what's written, check whether each required disclosure EXISTS in the policy:
   - For each disclosure rule, determine: is this information present, missing, or incomplete?
   - "Present" means the policy clearly addresses the requirement
   - "Missing" means the policy does not mention or address the requirement at all
   - "Incomplete" means the policy touches on the topic but lacks required specifics

4. **Report findings as a disclosure checklist**:

   ```
   ## Privacy Policy Review

   **Source**: [URL or "Pasted text"]
   **Frameworks evaluated**: [list relevant frameworks based on content/jurisdiction signals]
   **Required disclosures checked**: [count]

   ### Disclosure Checklist

   | Status | Requirement | Rule | Details |
   |--------|-------------|------|---------|
   | FOUND | Controller/company identity | GDPR-Art13-identity | Found in "About Us" section |
   | MISSING | Data retention periods | GDPR-Art13-retention | No retention period information found |
   | INCOMPLETE | Purpose of data processing | GDPR-Art13-purposes | Some purposes listed but data categories not mapped to purposes |
   | FOUND | Right to opt out | CCPA-120-opt-out | "Do Not Sell" link described in section 5 |

   ### Missing Disclosures

   **GDPR**:
   - [rule.id] — [rule.title]: [what's missing and why it's required]
   - Source: [rule.source.citation] ([rule.source.source_url])

   **CCPA**:
   - [same format]

   ### Recommendations

   1. [Highest priority missing disclosure and how to add it]
   2. [Next priority]
   ...

   ---
   *This is a pre-review tool. Privacy policy requirements vary by jurisdiction, audience, and data practices. Your legal team should review the final policy.*
   ```

5. **Determine relevant frameworks**: Not all frameworks apply to every organization:
   - GDPR: if the policy mentions EU, EEA, UK users, or international data transfers
   - CCPA: if the policy mentions California, US consumers, or data selling
   - HIPAA: if the policy mentions health data, medical records, or covered entities
   - COPPA: if the policy mentions children, age restrictions, or parental consent
   - If unclear, evaluate against all frameworks and note which may not apply

## Notes

- This skill checks for the PRESENCE of required information — the opposite of violation detection.
- A "FOUND" status means the information exists; it does not verify the information is legally sufficient. Legal review is still needed.
- Rules tagged `structural` are skipped — these are organizational requirements, not disclosure requirements.
- For content violation checking (marketing copy, ads), use `/validate-copy` instead.
