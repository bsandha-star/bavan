# CLAUDE.md — AI Assistant Guide for `bavan`

This file provides guidance for AI assistants (Claude Code and others) working in this repository.

## Repository Overview

- **Name:** bavan
- **Owner:** bsandha-star
- **Status:** Early stage — project structure and conventions are not yet established.
- **Current contents:** A single `README.md` with the project name.

There is no source code, build system, test framework, or tooling configured yet. As the project evolves, update this file to reflect actual conventions.

---

## Git Workflow

### Branches

- `master` — the main branch; treat as the stable baseline.
- Feature/AI work branches use the pattern `claude/<slug>` (e.g. `claude/claude-md-mm71wkdcxm0a7z4n-Db4wI`).
- Always develop on the designated feature branch; never push directly to `master` without explicit permission.

### Commit Style

Write short, imperative commit messages:

```
Add user authentication module
Fix off-by-one error in pagination
Update CLAUDE.md with build instructions
```

- First line: ≤72 characters, imperative mood, no trailing period.
- Leave a blank line before any extended description.
- Reference issue numbers where relevant (e.g. `Closes #42`).

### Push Workflow

```bash
git push -u origin <branch-name>
```

If a push fails due to network errors, retry with exponential backoff: 2 s → 4 s → 8 s → 16 s (max 4 retries).

---

## Development Conventions (to be updated as the project matures)

These sections are placeholders. Fill them in once the corresponding tooling is added.

### Language & Runtime

_Not yet determined._ Update this section when the primary language(s) and runtime versions are chosen.

### Project Structure

_Not yet established._ Document directory layout here once source files are added, e.g.:

```
src/        # application source code
tests/      # test suite
docs/       # documentation
```

### Dependency Management

_Not yet set up._ Note the package manager and any install commands here (e.g. `npm install`, `pip install -r requirements.txt`, `go mod download`).

### Build

_Not yet configured._ Add build commands here once a build system is in place.

### Tests

_Not yet written._ Add how to run tests here (e.g. `npm test`, `pytest`, `go test ./...`).

### Linting & Formatting

_Not yet configured._ Document linters and formatters here along with how to run them (e.g. `eslint .`, `ruff check .`, `gofmt`).

---

## AI Assistant Guidelines

### General Principles

1. **Read before editing.** Always read a file fully before modifying it.
2. **Minimal changes.** Only change what the task requires; do not refactor or tidy unrelated code.
3. **No speculative features.** Do not add error handling, abstractions, or generalisations that are not explicitly requested.
4. **No documentation files** unless the user explicitly asks for them.
5. **Security.** Never introduce SQL injection, XSS, command injection, or other OWASP Top 10 vulnerabilities.
6. **Confirm before destructive actions.** `git reset --hard`, force pushes, file/branch deletion, and any operation visible to other collaborators require explicit user confirmation.

### Working in This Repo Today

Because the project is empty:

- Do not assume any language, framework, or library.
- Ask the user about intended stack/tooling before scaffolding anything.
- Keep files minimal and purposeful — avoid boilerplate unless asked.

### Updating This File

Whenever significant project conventions are established (language chosen, build system added, test framework configured, CI pipeline set up), update the relevant sections of this file so future AI sessions start with accurate context.

---

## Contacts & Links

- GitHub repository: `bsandha-star/bavan`
- Remote: `http://127.0.0.1:60902/git/bsandha-star/bavan`
