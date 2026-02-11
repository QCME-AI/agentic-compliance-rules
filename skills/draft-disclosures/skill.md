# Draft Disclosures

Generate draft compliance disclosure language for marketing content.

## Usage

```
/draft-disclosures [marketing content]
```

Examples:
```
/draft-disclosures "Check out this amazing protein powder! I've been using it for 3 months and lost 20 pounds!"
/draft-disclosures "As a doctor, I recommend Brand X supplements for all my patients."
```

## Instructions

When invoked, follow these steps:

1. **Parse input**: The user will provide marketing content that needs compliance disclosures. If no argument is provided, ask the user for the content.

2. **Load rules**: Read `dist/index.json` from this repo. Determine which frameworks are relevant based on the content:
   - Health claims → HIPAA, FTC
   - Investment/financial → SEC 482, SEC Marketing
   - EU audience → GDPR
   - Email → CAN-SPAM
   - Children → COPPA
   - California audience → CCPA
   - General marketing/advertising → FTC
   - If unclear, default to FTC (applies to most US marketing)

3. **Identify compliance gaps**: Using the loaded rules as your compliance knowledge, identify where the content needs disclosures or modifications. Focus on rules that require specific language, disclaimers, or disclosures — not just general best practices.

4. **Draft disclosure language**: For each identified gap, generate specific, ready-to-use disclosure text:
   - Match the tone and style of the original content where possible
   - Keep disclosures clear and conspicuous (not buried in fine print)
   - Follow the rule's `remediation.guidance` for what the disclosure should convey
   - Provide the disclosure text itself, not just a description of what's needed

5. **Present results**:

   ```
   ## Draft Disclosures

   **Original content**: [first 100 chars]...
   **Frameworks evaluated**: [list]
   **Disclosures needed**: [count]

   ### 1. [rule.title] ([rule.id])

   **Why**: [Brief explanation of what regulation requires this]

   **Draft disclosure**:
   > [The actual disclosure text to add]

   **Placement**: [Where in the content this should appear — e.g., "Immediately after the testimonial", "In the email footer", "At the top of the landing page"]

   **Source**: [rule.source.citation]

   ### 2. [next disclosure]

   ...

   ### Revised Content

   Here is the original content with all disclosures inserted:

   > [Full content with disclosures added in the appropriate positions, marked with **bold** so they're easy to spot]

   ---
   *These are draft disclosures for review. Your legal and compliance teams should approve all disclosure language before publication.*
   ```

6. **If no disclosures needed**: Report that no specific disclosure requirements were identified for the evaluated frameworks. Include the disclaimer.

## Notes

- This skill goes beyond flagging issues — it drafts the actual language needed.
- Disclosures are drafts for human review, not final legal text. Compliance teams should approve all language.
- For just identifying issues without drafted fixes, use `/validate-copy`.
- Rules tagged `structural` are skipped — these are organizational requirements, not content disclosures.
- The "Revised Content" section shows where disclosures fit contextually. It is a suggestion, not a prescription.
