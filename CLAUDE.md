# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

`@reqstool/reqstool-typescript-tags` is a CLI tool that:
1. Scans TypeScript/JavaScript source files for JSDoc `@Requirements` and `@SVCs` tags
2. Generates `annotations.yml` for the reqstool traceability system
3. Assembles a complete reqstool dataset package for distribution as an npm package

Package entry point: `dist/index.js` (built from `src/index.ts`)

## Commands

```bash
# Install dependencies
npm install

# Build (required before running CLI or e2e tests)
npm run build

# Run unit tests (fast, no build needed)
npm test

# Run e2e tests (requires build first)
npm run build && npm run test:e2e

# Lint
npm run lint

# Format check
npm run format

# Run CLI in dev mode (no build needed)
NODE_NO_WARNINGS=1 node --loader ts-node/esm ./src/index.ts tags --inputs src --output /tmp/annotations.yml
```

## CLI Usage

```bash
# Generate annotations.yml from source files
reqstool-typescript-tags tags --inputs src,tests --output docs/reqstool/annotations.yml

# Assemble a reqstool dataset package
reqstool-typescript-tags package --inputs src,tests --dataset docs/reqstool --output build/reqstool-package
```

## Architecture

```
src/
  index.ts                   CLI entry point — two subcommands: tags, package
  types.ts                   Shared TypeScript types
  processors/
    NodeWalker.ts            TypeScript AST walker — extracts JSDoc @Requirements/@SVCs tags
    TagsProcessor.ts         Orchestrates scanning + writes annotations.yml
    PackageProcessor.ts      Assembles reqstool dataset package
```

## Testing

### Unit tests (`npm test`)

Located in `tests/unit/`. Run via Vitest. Fast, no build required.

- `TagsProcessor.test.ts` — tests annotation scanning and YAML output
- `PackageProcessor.test.ts` — tests config generation, file copying, glob matching

### E2E tests (`npm run test:e2e`)

Located in `tests/e2e/`. **Requires `npm run build` first** — the e2e test invokes the compiled `dist/index.js` directly.

- `PackageProcessor.e2e.test.ts` — runs the full `package` subcommand CLI against the fixture project in an isolated temp directory, then asserts output files and content

### Fixture project (`tests/fixtures/test_project/`)

A complete minimal TypeScript project used by the e2e test. Do not run `npm test` from inside the fixture directory — Vitest excludes it via `vitest.config.ts`.

Structure:
```
tests/fixtures/test_project/
  package.json                    name=my-ts-package, version=1.2.3, reqstool config
  src/main.ts                     /** @Requirements REQ_001 */ function hello()
  tests/main.test.ts              /** @SVCs SVC_001 */ function test_hello()
  docs/reqstool/
    requirements.yml              REQ_001
    software_verification_cases.yml  SVC_001 → REQ_001
  build/test-results/
    junit.xml                     pre-generated passing test result
```

### Regenerating expected output fixtures

If `PackageProcessor` or `TagsProcessor` output changes intentionally:

1. Run the relevant command against the fixture data:
   ```bash
   node dist/index.js tags --inputs tests/data/directoryWithTsFiles --output /tmp/new-expected.yml
   ```
2. Compare the output with `tests/data/expectedOutput/*.yml`
3. Update the expected output files if the change is intentional

### Vitest config files

- `vitest.config.ts` — unit tests only (`tests/unit/**/*.test.ts`), excludes fixtures and e2e
- `vitest.e2e.config.ts` — e2e tests only (`tests/e2e/**/*.test.ts`), 30s timeout
