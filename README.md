[![Commit Activity](https://img.shields.io/github/commit-activity/m/reqstool/reqstool-typescript-tags?label=commits&style=for-the-badge)](https://github.com/reqstool/reqstool-typescript-tags/pulse)
[![GitHub Issues](https://img.shields.io/github/issues/reqstool/reqstool-typescript-tags?style=for-the-badge&logo=github)](https://github.com/reqstool/reqstool-typescript-tags/issues)
[![License](https://img.shields.io/github/license/reqstool/reqstool-typescript-tags?style=for-the-badge&logo=opensourceinitiative)](https://opensource.org/license/mit/)
[![Build](https://img.shields.io/github/actions/workflow/status/reqstool/reqstool-typescript-tags/build.yml?style=for-the-badge&logo=github)](https://github.com/reqstool/reqstool-typescript-tags/actions/workflows/build.yml)
[![Documentation](https://img.shields.io/badge/Documentation-blue?style=for-the-badge&link=docs)](https://reqstool.github.io)

# Reqstool TypeScript Tags

A tool for creating [reqstool](https://github.com/reqstool/reqstool-client) `annotation.yml` files from TypeScript and JavaScript projects.

## Installation

```bash
npm install --save-dev @reqstool/reqstool-typescript-tags
```

## Usage

Add a script to your `package.json`:

```json
{
  "scripts": {
    "reqstool": "reqstool-typescript-tags --inputs tests,src --output docs/reqstool/annotations.yml"
  }
}
```

Then run:

```bash
npm run reqstool
```

## Documentation

Full documentation can be found [here](https://reqstool.github.io).

## Contributing

See the organization-wide [CONTRIBUTING.md](https://github.com/reqstool/.github/blob/main/CONTRIBUTING.md).

## License

MIT License.
