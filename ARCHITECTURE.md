# Connect AI Architecture

This document describes the current architecture of the Connect AI repository and the YOMI AI personal office.

The older Brain-GitHub sync-only architecture is no longer the full system picture. The current system combines:

- VS Code/Cursor extension shell
- local YOMI AI personal office web app
- Codex CLI as the default engine
- Claude Code CLI as the reasoning, writing, research synthesis, and review engine
- Obsidian/Vault markdown assetization
- role-based staff routing and skill/tool permissions
- optional API/MCP-style integrations

## 1. Top-Level Components

```text
connect-ai/
  package.json
  src/
    extension.ts
  out/
    extension.js
  assets/
  web/
    personal-office/
      server.mjs
      app.js
      index.html
      styles.css
      skills.json
      connections.json
      mcp-servers.safe.json
  docs/
  AGENTS.md
  README.md
  ARCHITECTURE.md
```

## 2. Extension Layer

Main files:

- `src/extension.ts`
- `package.json`
- `out/extension.js`

`src/extension.ts` is large and contains much of the legacy and current extension behavior. Treat it as high-risk. Prefer narrow, well-scoped edits.

Responsibilities include:

- VS Code/Cursor command registration
- extension webviews
- local brain/Vault utilities
- auto-capture and assetization flows
- GitHub sync features from earlier versions
- model/tool orchestration features from earlier versions

Important note: generated output in `out/` should not be edited manually unless explicitly requested.

## 3. YOMI Personal Office Layer

Main files:

- `web/personal-office/server.mjs`
- `web/personal-office/app.js`
- `web/personal-office/index.html`
- `web/personal-office/styles.css`

The personal office is a local web app served by `server.mjs`.

Default bind:

```text
127.0.0.1:17331
```

Override:

```powershell
$env:PORT=17332
node web\personal-office\server.mjs
```

Main UI tabs:

- `office`: visual status board
- `chat`: default Codex chat/input surface
- `agents`: staff roles, skills, and toggles
- `vault`: recent markdown reports and graph view
- `settings`: engine, Vault, API, and MCP connection status

## 4. Engine Routing

The active runtime is Codex-first with Claude Code available for selected work.

### Codex CLI

Default responsibilities:

- intent classification
- normal chat
- code/task analysis
- office workflow routing
- staff task capsule generation
- code/file/Git/terminal work

Configuration:

```text
YOMI_AI_CODEX_COMMAND
YOMI_AI_CODEX_TIMEOUT_MS
YOMI_AI_CODEX_PROMPT_TIMEOUT_MS
```

If no command is configured, the app attempts to resolve the installed `codex` command.

### Claude Code CLI

Claude is automatically available for long reasoning, writing, research synthesis, and review.

Direct trigger syntax:

```text
/cc ...
/claude ...
```

Code/file/Git/terminal work remains Codex-first. If Claude execution fails, YOMI uses Codex as an engine fallback.

Configuration:

```text
YOMI_AI_CLAUDE_COMMAND
YOMI_AI_CLAUDE_MODEL
YOMI_AI_CLAUDE_PROMPT_TIMEOUT_MS
YOMI_AI_CLAUDE_MAX_BUDGET_USD
```

Safety stance:

- no automatic file writes
- no automatic Git writes
- no automatic external sends
- no file/Git/external-send actions from Claude output without user confirmation

### Legacy Local Models

The active YOMI personal office runtime uses Codex CLI and Claude Code CLI. Codex is the default for code/files/Git/terminal/default work; Claude Code is used for long reasoning, writing, research synthesis, and review.

## 5. Office Orchestration

The office router classifies user input into broad routes:

- simple conversation
- office workflow
- Vault search/use
- code/project task
- Claude direct call

For workflow tasks, the server builds a task capsule:

```json
{
  "goal": "what the user wants",
  "doneCriteria": ["how completion is judged"],
  "deliverables": ["what should be produced"],
  "staffing": {
    "level": "quick | normal | deep",
    "assigned": ["role ids"]
  }
}
```

Staff should not all work on every task. The router should assign only the roles that match the task. Deep/important tasks can involve more staff and more detailed review.

## 6. Staff Roles

Core staff roles:

| ID | Name | Role |
| --- | --- | --- |
| `ceo` | 요미 | overall routing, decomposition, final judgment |
| `secretary` | 나래 | operations, tickets, checklists |
| `researcher` | 서아 | research, sources, risk/context gathering |
| `business` | 도윤 | strategy, prioritization, metrics |
| `developer` | 태오 | code, files, automation, verification |
| `writer` | 문채 | drafting, documents, knowledge writing |
| `editor` | 하루 | editing, tone, compression, QA |
| `designer` | 이안 | layout, visual references, UI/design checks |
| `youtube` | 유진 | video planning and packaging |
| `instagram` | 리아 | SNS, reels/shorts formatting |
| `archivist` | 아카 | Vault saving, tagging, RAG classification |

Role mappings are maintained in:

```text
web/personal-office/skills.json
web/personal-office/connections.json
```

## 7. Skills And Tool Connections

The system treats skills and tool connections as separate layers.

Skill:

- role instruction
- work method
- checklist or workflow behavior

Tool/MCP/API connection:

- actual capability
- local command
- API key requirement
- permission scope

Important connection candidates:

| Connection | Status | Notes |
| --- | --- | --- |
| Codex CLI | core | default engine |
| Claude Code CLI | core/optional command | long reasoning, writing, research synthesis, review |
| Obsidian Vault | core | markdown output storage |
| Exa | optional API | semantic/research search |
| Firecrawl | optional API | webpage extraction/scraping |
| Tavily | optional API | search fallback |
| Context7 MCP | optional | current library docs |
| Playwright CLI/MCP | optional | browser verification/control; sensitive |
| Fetch MCP | optional | may require `uvx` |
| Git MCP | optional/read-only | may require `uvx`; write actions blocked |
| Filesystem | core/internal | local project/Vault reads and controlled writes |

## 8. Vault And Assetization

Default Vault:

```text
C:\Users\a0104\Desktop\MY\obsidian
```

Default YOMI output folder:

```text
50_Outputs/YOMI AI/
```

Reusable work should be saved as markdown with tags/frontmatter when the save target is clear.

Ask the user before continuing when:

- file location is ambiguous
- filename is ambiguous
- overwrite could happen
- external transfer is involved
- cost may be incurred
- instruction is unclear
- Git write, destructive operation, or deployment is involved

## 9. Security And Safety Boundaries

Do not print or commit secrets.

Secret-bearing inputs include:

- `.env`
- API keys
- tokens
- cookies
- sessions
- passwords
- OAuth files

Default policy:

- read-only checks are safe
- file edits require explicit task authorization
- dependency installs require explicit authorization
- Git writes require explicit authorization
- destructive commands require explicit authorization
- external publishing/deployment requires explicit authorization

## 10. Verification

Low-risk syntax checks:

```powershell
node --check web\personal-office\server.mjs
node --check web\personal-office\app.js
```

Browser verification:

```powershell
npx playwright install chromium
npx playwright --version
```

Then open the local office and inspect:

- DOM
- console
- CSS/responsiveness
- accessibility landmarks and labels
- staff/tool status
- Vault recent document expansion
- settings clarity

## 11. Documentation Drift Checks

Useful checks after major changes:

```powershell
rg "Codex CLI|Claude|Exa|Firecrawl|Tavily|Vault" README.md ARCHITECTURE.md web\personal-office docs
```

Docs should reflect the current default:

- Codex CLI first
- Claude for reasoning/writing/research-review plus direct `/cc` or `/claude`
- Vault markdown output
- Exa/Firecrawl/Tavily for optional research APIs
- Playwright for browser verification
- no Brave dependency
- no claim of full offline operation while cloud tools are enabled
