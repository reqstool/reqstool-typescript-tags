# Contributing to reqstool-typescript-tags

Thank you for your interest in contributing!

For DCO sign-off, commit conventions, and code review process, see the organization-wide [CONTRIBUTING.md](https://github.com/reqstool/.github/blob/main/CONTRIBUTING.md).

## Prerequisites

- Node.js 18+
- npm
- [reqstool](https://github.com/reqstool/reqstool-client) (`pipx install reqstool`)
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) (`npm install -g @fission-ai/openspec`)

## Setup

```bash
git clone https://github.com/reqstool/reqstool-typescript-tags.git
cd reqstool-typescript-tags
npm install
```

If using Claude Code, opening this repo will prompt you to confirm adding the `reqstool-ai`
marketplace and enabling the `reqstool`/`reqstool-openspec` plugins (configured in
`.claude/settings.json`) — accept the prompt.

Then regenerate the `opsx` slash commands and OpenSpec skills
(`.claude/commands/opsx/`, `.claude/skills/openspec-*`) — they're CLI-generated tool scaffolding,
not committed to the repo:

```bash
openspec update   # or: openspec init --tools claude --force
```

## Development

```bash
npm run dev -- --inputs src,tests --output output/annotations.yml
```

## Self-applied traceability (`docs/reqstool/`)

This project dogfoods itself: `npm run reqstool:self-apply` scans its own `src`/`tests/unit`/
`tests/e2e` for `@Requirements`/`@SVCs` JSDoc tags and writes `build/reqstool/annotations.yml`.
Check status with:

```bash
npm run build && npm test && npm run test:e2e && npm run reqstool:self-apply
reqstool status --check-all-reqs-met local -p docs/reqstool
```
