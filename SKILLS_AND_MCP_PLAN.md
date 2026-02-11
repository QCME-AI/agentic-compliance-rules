# Skills & MCP Server Plan

**Date:** February 10, 2026
**Status:** Planning
**Package:** `@qcme/agentic-compliance-rules`

## Core Principle

Rules are **structured regulatory knowledge for AI agents** — not a regex engine. The `detection.patterns` and `detection.keywords` fields are signals that help an AI understand what language each rule is about. The AI reasons about compliance using the full rule definition (summary, remediation guidance, source citation) as context.

## Current State

- **208 rules** across 8 frameworks (FTC, HIPAA, GDPR, SEC 482, SEC Marketing, CCPA, COPPA, CAN-SPAM)
- **1 skill**: `validate-copy` — loads rules as context, Claude reasons about compliance
- **No MCP server** — planned as `@qcme/rules-mcp-adapter`

---

## Skills

### `/validate-copy` (exists, rewritten)

General-purpose compliance review. Loads relevant rule definitions as context and uses AI reasoning to evaluate content.

**How it works:**
1. User provides text or URL
2. Skill determines relevant frameworks (health → HIPAA, EU audience → GDPR, email → CAN-SPAM, investment → SEC, children → COPPA) or user specifies `--framework`
3. Loads rule JSON files as context — the AI reads and understands the regulatory requirements
4. AI evaluates content against rules holistically, considering context (not just pattern matching)
5. Reports findings grouped by severity with specific explanations, rule citations, and fix guidance

**Key design decisions:**
- Rules tagged `structural` are skipped (organizational requirements can't be assessed from copy)
- `ai-only` rules work the same as any other — the AI reasons about all rules equally
- Keywords/patterns are hints for relevance, not a detection engine

### `/explain-rule` (planned)

Look up a specific rule and explain the regulation in plain English.

```
/explain-rule FTC-255-5-material-connection
```

**How it works:**
1. Read the rule JSON file by ID
2. Explain what the regulation requires, why it exists, what triggers a violation
3. Give practical examples of compliant and non-compliant content
4. Cite the source regulation

**Value:** Developers often see a rule ID in a scan result and want to understand it without reading legal text.

### `/check-email` (planned)

Specialized email compliance review. Auto-selects email-relevant rules.

```
/check-email "Subject: Limited time offer! ..."
```

**How it works:**
1. Loads only email-relevant rules: all CAN-SPAM, GDPR Art.21 marketing, CCPA opt-out, FTC dark patterns
2. Evaluates the email content (subject line, body, footer, opt-out mechanism, sender identification)
3. Reports findings specific to email marketing compliance

**Why separate from validate-copy:** Email has a distinct set of requirements (physical address, opt-out, sender ID, subject line rules) that are different from website/landing page compliance. A focused skill gives better results.

### `/check-privacy-policy` (planned)

Reviews a privacy policy page against disclosure requirements.

```
/check-privacy-policy https://example.com/privacy
```

**How it works:**
1. Fetches the privacy policy page
2. Loads disclosure-focused rules: GDPR Art.12-14 (all disclosure requirements), CCPA 1798.135, HIPAA 520, COPPA 312.4
3. Checks what's present and what's missing (this is an absence-detection problem — the AI checks whether required disclosures exist)
4. Reports missing disclosures and incomplete sections

**Why separate:** Privacy policy review is fundamentally different from marketing copy review. It's about checking for the *presence* of required information, not the *absence* of violations.

---

## MCP Server: `@qcme/rules-mcp-adapter`

The MCP server's job is to **serve rules as context to any AI agent** — Claude Desktop, Claude Code, or third-party agents. It is not a compliance scanner itself. The agent calling the MCP server is the one that reasons about compliance.

### Tools

#### `rules.search`

Find relevant rules for a given context. The agent asks "what rules apply here?" and gets the right subset to load into its context.

```typescript
// Input
{
  framework?: string,       // "ftc", "gdpr", etc.
  severity?: string,        // "critical", "warning", "info"
  tags?: string[],          // ["disclosure", "consent"]
  jurisdiction?: string,    // "US", "EU", "US-CA"
  content_type?: string,    // "landing-page", "email", "marketing"
  query?: string,           // free-text search across title/summary/keywords
  limit?: number            // default 20
}

// Output
{
  rules: Rule[],            // array of matching rule objects
  total: number,            // total matches
  frameworks: string[]      // frameworks represented in results
}
```

#### `rules.get`

Get full details for a specific rule by ID. Used when an agent needs to cite a specific regulation or explain a finding.

```typescript
// Input
{ id: string }             // e.g. "FTC-255-5-material-connection"

// Output
Rule                        // full rule object with all fields
```

#### `rules.frameworks`

List available frameworks with metadata. Discovery tool for agents to understand what's available.

```typescript
// Input
{}

// Output
{
  frameworks: [
    {
      id: "ftc",
      rules: 95,
      description: "FTC endorsement, advertising, and green marketing rules",
      jurisdiction: ["US"],
      tags: ["endorsement", "disclosure", "green", "dark-pattern", ...]
    },
    ...
  ],
  total_rules: 208
}
```

### Why No `rules.validate` Tool

The old plan included a `rules.validate-snippet` tool that would run regex/keyword matching. This is wrong for the same reason the old skill was wrong — the AI agent calling the MCP server is already capable of reasoning about compliance. It just needs the rules as context.

The workflow is:
1. Agent calls `rules.search` to find relevant rules
2. Agent reads the returned rules as context
3. Agent reasons about the content using its understanding of the regulations
4. Agent reports findings

The MCP server is a **knowledge retrieval** layer, not a **scanning engine**.

### Resources

The MCP server also exposes rules as MCP resources that agents can read directly:

| Resource URI | Description |
|-------------|-------------|
| `qcme://frameworks` | List of all frameworks |
| `qcme://frameworks/{id}` | All rules for a framework |
| `qcme://rules/{id}` | Single rule by ID |
| `qcme://index` | Full rule index (dist/index.json) |

### Architecture

```
@qcme/rules-mcp-adapter/
  package.json              # @modelcontextprotocol/sdk + @qcme/agentic-compliance-rules
  src/
    index.ts                # Entry point — stdio transport
    tools/
      search.ts             # rules.search — filter/query rules
      get.ts                # rules.get — single rule lookup
      frameworks.ts         # rules.frameworks — list frameworks
    resources.ts            # MCP resource handlers
    loader.ts               # Load rules from dist/index.json at startup
  tsconfig.json
```

**Key decisions:**
- Reads `dist/index.json` at startup — all 208 rules in memory for fast lookups
- Stdio transport — standard MCP pattern, works with Claude Desktop and Claude Code
- Only dependency beyond MCP SDK is `@qcme/agentic-compliance-rules` (the rules data)
- No AI/LLM calls — the server is pure data retrieval

### Distribution

```bash
# npm install
npm install @qcme/rules-mcp-adapter

# Run as MCP server
npx @qcme/rules-mcp-adapter
```

Claude Desktop config (`.claude/mcp.json`):
```json
{
  "mcpServers": {
    "qcme-rules": {
      "command": "npx",
      "args": ["@qcme/rules-mcp-adapter"]
    }
  }
}
```

---

## Integration Matrix

| Consumer | Integration | How Rules Are Used |
|----------|------------|-------------------|
| Claude Code | `/validate-copy` skill | Skill reads rule files directly, passes as context |
| Claude Code | MCP server | Agent calls `rules.search`, gets rules as context |
| Claude Desktop | MCP server | Same — `rules.search` for discovery, `rules.get` for details |
| Third-party agents | MCP server | Any MCP-compatible agent can search/read rules |
| Custom apps | Direct npm import | `import rules from '@qcme/agentic-compliance-rules'` |
| CI/CD | npm package | Load `dist/index.json`, pass rules to LLM API |

---

## Implementation Priority

| Priority | Deliverable | Effort |
|----------|------------|--------|
| **Done** | `/validate-copy` skill rewrite | Complete |
| **P0** | MCP server with `rules.search`, `rules.get`, `rules.frameworks` | ~1 day |
| **P1** | `/explain-rule` skill | ~2 hours |
| **P1** | `/check-email` skill | ~2 hours |
| **P2** | `/check-privacy-policy` skill | ~3 hours |
| **P2** | MCP resource URIs | ~2 hours |
