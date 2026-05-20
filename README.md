[![Commit Activity](https://img.shields.io/github/commit-activity/m/reqstool/reqstool-typescript-tags?label=commits&style=for-the-badge)](https://github.com/reqstool/reqstool-typescript-tags/pulse)
[![GitHub Issues](https://img.shields.io/github/issues/reqstool/reqstool-typescript-tags?style=for-the-badge&logo=github)](https://github.com/reqstool/reqstool-typescript-tags/issues)
[![License](https://img.shields.io/github/license/reqstool/reqstool-typescript-tags?style=for-the-badge&logo=opensourceinitiative)](https://opensource.org/license/mit/)
[![Build](https://img.shields.io/github/actions/workflow/status/reqstool/reqstool-typescript-tags/build.yml?style=for-the-badge&logo=github)](https://github.com/reqstool/reqstool-typescript-tags/actions/workflows/build.yml)
[![Documentation](https://img.shields.io/badge/Documentation-blue?style=for-the-badge&link=docs)](https://reqstool.github.io)

# Reqstool TypeScript Tags

A tool for creating [reqstool](https://github.com/reqstool/reqstool-client) `annotations.yml` files from TypeScript and JavaScript projects, and assembling a complete reqstool dataset package for distribution.

## Installation

```bash
npm install --save-dev @reqstool/reqstool-typescript-tags
```

## Usage

### `tags` — generate annotations.yml

Scans source files for JSDoc `@Requirements` and `@SVCs` tags and writes an `annotations.yml` file.

```bash
reqstool-typescript-tags tags --inputs src,tests --output docs/reqstool/annotations.yml
```

Add as a script in `package.json`:

```json
{
  "scripts": {
    "reqstool:tags": "reqstool-typescript-tags tags --inputs src,tests --output docs/reqstool/annotations.yml"
  }
}
```

### `package` — assemble a reqstool dataset package

Assembles a complete reqstool dataset (annotations, requirements, test results) into a publishable npm package.

```bash
reqstool-typescript-tags package \
  --inputs src,tests \
  --dataset docs/reqstool \
  --output build/reqstool-package
```

Options:

| Option | Description |
|---|---|
| `-i, --inputs <paths...>` | Source directories to scan for annotations (comma-separated) |
| `-d, --dataset <dir>` | Directory containing `requirements.yml` and related dataset files |
| `-r, --test-results <globs...>` | Glob patterns for JUnit XML test results (comma-separated) |
| `-o, --output <dir>` | Output directory for the assembled package |
| `-b, --build-tool <tool>` | Build tool to record in `reqstool_config.yml` (`npm`\|`yarn`\|`pnpm`\|`bun`) |
| `-n, --name <string>` | Override the generated package name (default: `<pkg-name>-reqstool`) |
| `-v, --pkg-version <string>` | Override the package version (default: from `package.json`) |

## Documentation

Full documentation can be found [here](https://reqstool.github.io).

## Contributing

See the organization-wide [CONTRIBUTING.md](https://github.com/reqstool/.github/blob/main/CONTRIBUTING.md).

## License

MIT License.
