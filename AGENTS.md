# AGENTS.md

## Project Context

This repository is a VS Code/Cursor extension project for Connect AI with an active local web app called YOMI AI personal office.

- Main extension entry: `src/extension.ts`
- Build output: `out/extension.js`
- Manifest: `package.json`
- Core source folder: `src/`
- Runtime assets and webviews: `assets/`
- Personal office runtime: `web/personal-office/`
- Personal office server: `web/personal-office/server.mjs`
- Personal office UI: `web/personal-office/index.html`, `web/personal-office/app.js`, `web/personal-office/styles.css`
- Staff/tool metadata: `web/personal-office/skills.json`, `web/personal-office/connections.json`
- Current branch convention: `main` tracking `origin/main`

`src/extension.ts` is large and carries most extension behavior. Treat edits to it as high-risk and keep changes narrowly scoped.

The current personal office direction uses two CLI engines:

- Codex CLI is the default chat/routing/task engine.
- Claude Code CLI is available for long reasoning, writing, research synthesis, and review, and can also be called via `/cc` or `/claude`.
- Do not add local-model engine paths to the YOMI personal office runtime.
- Brave Search is excluded unless explicitly restored.
- Exa/Firecrawl/Tavily are the current research API candidates.
- Vault markdown output is the primary assetization path.

## Standing Rules

- Do not create, modify, delete, stage, commit, or push files unless the user explicitly authorizes that task.
- Do not access `.env` or other secret files unless the user explicitly authorizes it.
- Do not run `npm install`, `npm run`, packaging, release, or publish commands unless the user explicitly authorizes them.
- Do not run Git write operations such as `git add`, `git commit`, `git push`, reset, checkout, rebase, or clean unless explicitly requested.
- Before changing files, inspect the relevant local context first.
- Preserve existing project structure and naming conventions.
- Prefer small, targeted changes over broad refactors.
- Do not modify generated build output such as `out/` unless the user specifically asks.
- Keep reports and task outputs in chat unless the user asks for a file.

## Verification Rules

- For intake or planning tasks, use read-only commands only.
- After file edits, run only the verification commands authorized by the user.
- If the user asks to stop after a specific check, stop after that check.
- Report any command that could not be run and why.

## Personal Office Verification

Useful checks after personal office edits:

```powershell
node --check web\personal-office\server.mjs
node --check web\personal-office\app.js
```

Browser verification can use Playwright when authorized:

```powershell
npx playwright --version
```

Check:

- five tabs load and switch correctly
- console is clean
- office status shows only current work
- staff cards show role-appropriate skills
- Vault recent documents expand by title
- settings page is readable and does not expose secrets

## Handoff Rules

- After a large task, report the current status, changed files, verification results, remaining risks, and next task.
- Suggest updating `docs/HANDOFF.md` when useful.
- Do not create or modify `docs/HANDOFF.md` without user approval.

## Autonomous Safety Rule

For risky or ambiguous work, do not emit a separate escalation block. Instead, run an internal safety check, choose the safest useful path, and continue when the user has already authorized the task.

Use this internal checklist before acting:

- Confirm the action is directly related to the user's latest request.
- Prefer read-only inspection before edits.
- Keep file changes narrow and reversible.
- Never print or commit secrets.
- Avoid destructive filesystem and Git operations unless the user explicitly asked for them.
- If a command can change external state, verify the scope first, then execute only the minimum needed command.
- If the task is truly impossible without user input, ask one concise question in chat.

When the user explicitly asks to commit, push, install, test, or verify, proceed through the safest reasonable sequence without adding a separate GPT confirmation ceremony.
