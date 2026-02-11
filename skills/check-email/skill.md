# Check Email

Review email marketing content for compliance issues against email-specific regulations.

## Usage

```
/check-email [email content]
```

Example:
```
/check-email "Subject: URGENT! Last chance to claim your FREE gift! From: deals@shop.com Body: Click here to get your exclusive offer..."
```

## Instructions

When invoked, follow these steps:

1. **Parse input**: The user will provide email content — ideally including subject line, sender/from address, body, and footer. If only partial content is provided (e.g., just a subject line), note which components are missing and evaluate what you have, flagging that a full review requires the complete email.

2. **Load email-relevant rules**: Read `dist/index.json` from this repo. Load only rules relevant to email marketing:
   - **All CAN-SPAM rules** (framework: `can-spam`) — these are the core email compliance rules
   - **FTC dark pattern rules** — rules with IDs starting with `FTC-DARK-`
   - **FTC free trial rules** — `FTC-FREE-TRIAL` if present
   - **GDPR marketing/consent rules** — rules tagged `marketing` or `consent` in the GDPR framework
   - **CCPA opt-out rules** — rules tagged `opt-out` in the CCPA framework

3. **Evaluate by email component**: Using the loaded rules as your compliance knowledge, evaluate each part of the email:

   - **Subject line**: Deceptive subject lines (CAN-SPAM), misleading urgency, false claims
   - **Sender identification**: From address accuracy, sender identity disclosure
   - **Physical address**: Presence of valid postal address (CAN-SPAM requirement)
   - **Opt-out mechanism**: Clear opt-out/unsubscribe link, no fee for opt-out, honored within 10 business days
   - **Content labeling**: Ad/commercial identification where required
   - **Dark patterns**: Manipulative urgency, hidden information, confirmshaming, pre-selected options
   - **Marketing consent**: GDPR consent requirements for EU audiences, CCPA opt-out rights

   For each component, reason about the content holistically against the relevant rules. Do not just pattern-match — consider context.

4. **Report findings**: Present results grouped by severity:

   ```
   ## Email Compliance Review

   **Content**: [subject line or first 100 chars]
   **Rules evaluated**: [count] rules across CAN-SPAM, FTC, GDPR, CCPA
   **Findings**: [count]

   ### Critical

   - **[rule.id]** [rule.title]
     Component: [Subject / Sender / Body / Footer / Opt-out]
     Concern: [specific explanation of what in the email is problematic and why]
     Regulation: [rule.summary]
     Suggested fix: [rule.remediation.guidance]
     Source: [rule.source.citation] ([rule.source.source_url])

   ### Warning

   [same format]

   ### Info

   [same format]

   ### Missing Components

   [List any email components that were not provided for review — e.g., "No footer/signature was included. CAN-SPAM requires a physical postal address in commercial emails."]

   ---
   *This is a pre-review tool. Findings are potential issues for human review, not definitive violations. Your compliance and legal teams have final authority.*
   ```

5. **If no findings**: Report that no potential violations were detected. Still list any missing components and include the disclaimer.

## Notes

- This skill is specialized for email content. For general marketing copy, use `/validate-copy`.
- CAN-SPAM applies to all commercial email sent to US recipients. GDPR consent rules apply when the audience includes EU residents.
- Rules tagged `structural` are skipped — these are organizational requirements that can't be assessed from email content alone.
- Each rule's `source.citation` and `source_url` point to the actual regulation for verification.
