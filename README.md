# Connect AI

Connect AI is a VS Code/Cursor extension project with a local-first personal AI office called **YOMI AI**.

The current working direction is no longer "Ollama/LM Studio as the primary chatbot." The practical runtime is:

- **Codex CLI** as the default chat, routing, analysis, and task engine.
- **Claude Code CLI** as an optional manual assistant, called only with `/cc` or `/claude`.
- **Obsidian/Vault markdown output** for reusable reports and work assets.
- **Role-based YOMI staff orchestration** for research, writing, editing, development, design, SNS, video, strategy, operations, and assetization.
- **API/MCP-style tool registry** for Exa, Firecrawl, Tavily, Context7, Playwright, Git, Fetch, and filesystem capabilities.

This project is still local-first, but it is **not 100% offline** when Codex CLI, Claude Code CLI, Exa, Firecrawl, Tavily, or other external tools are enabled.

## Repository Map

| Path | Purpose |
| --- | --- |
| `src/extension.ts` | Main VS Code/Cursor extension entry. Large, high-risk file. Keep edits narrow. |
| `out/extension.js` | Generated extension build output. Do not edit unless explicitly requested. |
| `package.json` | Extension manifest, commands, settings, and scripts. |
| `assets/` | Runtime assets, webview assets, templates, pixel characters, and seeds. |
| `web/personal-office/` | YOMI AI personal office web app and local server. |
| `docs/` | Project direction and handoff-oriented documents. |
| `AGENTS.md` | Working rules for Codex and future agents. |
| `ARCHITECTURE.md` | Current architecture reference. |

## YOMI AI Personal Office

The personal office is the current user-facing operating surface.

It has five main tabs:

- `사무실`: visual office/status board
- `대화`: Codex-first chat and command input
- `직원`: staff roles, skills, and tool toggles
- `저장소`: recent Vault outputs and graph view
- `설정`: Codex, Claude, Vault, API, MCP, and tool status

Run it locally:

```powershell
node web\personal-office\server.mjs
```

Default URL:

```text
http://127.0.0.1:17331
```

If the port is already in use:

```powershell
$env:PORT=17332
node web\personal-office\server.mjs
```

## Runtime Engines

### Default: Codex CLI

Codex CLI is the default route for normal chat, intent classification, code tasks, and office workflow orchestration.

Optional environment variable:

```text
YOMI_AI_CODEX_COMMAND
```

If unset, the server tries to use the installed `codex` command.

### Optional: Claude Code CLI

Claude Code CLI is manual-only. It is not used by the default router.

Use:

```text
/cc your request
/claude your request
```

Optional environment variables:

```text
YOMI_AI_CLAUDE_COMMAND
YOMI_AI_CLAUDE_MODEL
YOMI_AI_CLAUDE_MAX_BUDGET_USD
```

### Legacy Local Models

Ollama and LM Studio were part of earlier experiments and may still appear in older extension code/settings. They are not required for the current YOMI personal office path when Codex CLI is available.

Do not reintroduce Ollama/LM Studio as the default engine unless the product direction explicitly changes.

## Search And Research APIs

Brave Search is no longer the default path.

Current research-oriented keys:

```text
EXA_API_KEY
FIRECRAWL_API_KEY
TAVILY_API_KEY
```

Store keys in `.env` or user environment variables. Do not print, commit, or copy secret values into docs, logs, or connection JSON files.

Current intended usage:

- Exa: semantic/web research
- Firecrawl: webpage extraction and scraping
- Tavily: search fallback
- Codex/Vault: keyless reasoning and local knowledge use

## Skills, MCP, And Permissions

The app separates two ideas:

- **Skill**: instructions for how a staff member should work.
- **MCP/API/tool connection**: what external or local capability can be called.

Important files:

```text
web/personal-office/skills.json
web/personal-office/connections.json
web/personal-office/mcp-servers.safe.json
```

Safety policy:

- Staff should only use tools mapped to their role.
- File writes, Git writes, destructive actions, external sends, and cost-bearing actions require user confirmation.
- Playwright MCP is treated as sensitive because it can control a browser.
- Git MCP is read-only by default: status, diff, log.
- `fetch_mcp` and `git_mcp` may require `uvx`; they are optional candidates, not core requirements.

## Vault Output

YOMI stores reusable outputs as markdown in the personal Vault.

Default Vault path:

```text
C:\Users\a0104\Desktop\MY\obsidian
```

Default output area:

```text
50_Outputs/YOMI AI/
```

The app should automatically save clearly reusable reports and ask the user when filename, location, overwrite, external transfer, cost, or instruction ambiguity makes the next step unsafe.

## Development Notes

Install/build/package commands should be run only when explicitly authorized:

```powershell
npm install
npm run compile
npx vsce package
```

Useful read-only checks:

```powershell
node --check web\personal-office\server.mjs
node --check web\personal-office\app.js
rg "Codex CLI|Claude Code CLI|Exa|Firecrawl|Tavily|Vault" README.md ARCHITECTURE.md web\personal-office docs
```

For browser verification, Playwright Chromium may be installed separately:

```powershell
npx playwright install chromium
```

## Documentation Rules

Keep docs aligned with the current working system:

- Codex CLI is the default engine.
- Claude Code CLI is manual-only.
- Ollama/LM Studio are legacy fallback concepts, not the active primary path.
- Brave Search is excluded unless deliberately restored.
- Exa/Firecrawl/Tavily are the active research API candidates.
- Do not claim "100% offline" while cloud CLIs/APIs are enabled.
