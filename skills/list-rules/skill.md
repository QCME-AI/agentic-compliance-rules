# List Rules

Browse and filter available compliance rules.

## Usage

```
/list-rules [--framework <name>] [--severity <level>] [--tag <tag>] [--search <query>]
```

Examples:
```
/list-rules
/list-rules --framework ftc
/list-rules --severity critical
/list-rules --tag disclosure
/list-rules --framework gdpr --severity critical
/list-rules --search "opt-out"
```

## Instructions

When invoked, follow these steps:

1. **Parse arguments**: Extract any filters from the arguments:
   - `--framework`: filter by framework (ftc, hipaa, gdpr, sec-482, sec-marketing, ccpa, coppa, can-spam)
   - `--severity`: filter by severity (critical, warning, info)
   - `--tag`: filter by metadata tag (e.g., disclosure, consent, endorsement, dark-pattern)
   - `--search`: free-text search across rule titles, summaries, and keywords
   - No arguments: show a summary of all frameworks, then ask what to explore

2. **Load rules**: Read `dist/index.json` from this repo.

3. **Apply filters**: Filter the `rules` array based on provided arguments. Multiple filters are combined with AND logic (e.g., `--framework ftc --severity critical` shows only critical FTC rules).

4. **Display results**:

   **If no filters (summary mode)**:
   ```
   ## Available Compliance Rules

   | Framework | Rules | Critical | Warning | Info |
   |-----------|-------|----------|---------|------|
   | FTC | 95 | X | Y | Z |
   | HIPAA | 17 | X | Y | Z |
   | ... | ... | ... | ... | ... |
   | **Total** | **208** | **X** | **Y** | **Z** |

   Use `--framework`, `--severity`, `--tag`, or `--search` to filter.
   ```

   **If filters applied**:
   ```
   ## Rules: [filter description]

   **Showing**: [count] rules

   | ID | Title | Severity | Framework | Tags |
   |----|-------|----------|-----------|------|
   | FTC-255-5-material-connection | Material Connection Disclosure | critical | ftc | endorsement, disclosure |
   | ... | ... | ... | ... | ... |

   Use `/explain-rule <id>` to learn more about a specific rule.
   ```

5. **If no results match**: Report that no rules matched the filters and suggest broadening the search.

## Notes

- This is a discovery/reference skill — it helps users understand what rules are available.
- For validating content against rules, use `/validate-copy`, `/check-email`, or `/check-privacy-policy`.
- For detailed explanation of a specific rule, use `/explain-rule <id>`.
