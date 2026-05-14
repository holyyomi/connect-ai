# AGENTS.md

## Project Context

This repository is a VS Code/Cursor extension project for Connect AI.

- Main extension entry: `src/extension.ts`
- Build output: `out/extension.js`
- Manifest: `package.json`
- Core source folder: `src/`
- Runtime assets and webviews: `assets/`
- Current branch convention: `main` tracking `origin/main`

`src/extension.ts` is large and carries most extension behavior. Treat edits to it as high-risk and keep changes narrowly scoped.

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

## Current Intake Notes

- `AGENTS.md` was absent before TASK-01.
- `package.json`, `README.md`, `ARCHITECTURE.md`, `src/extension.ts`, `src/`, and `.gitignore` exist.
- `git status --porcelain` was clean before TASK-01.
- The repository remote is `https://github.com/holyyomi/connect-ai.git`.
