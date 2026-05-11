#!/usr/bin/env node

import { Command } from 'commander'
import { TagsProcessor } from './processors/TagsProcessor.js'
import { PackageProcessor } from './processors/PackageProcessor.js'
import packageJson from '../package.json' with { type: 'json' }

function main() {
    const program = new Command()

    program.name(packageJson.name).description(packageJson.description).version(packageJson.version)

    program
        .command('tags')
        .description('Scan source files for JSDoc @Requirements/@SVCs tags and generate annotations.yml')
        .option('-i, --inputs <paths...>', 'Input directories (comma separated)', (value) => value.split(','))
        .option('-o, --output <file>', 'Output file', 'annotations.yml')
        .action((options) => {
            if (!options.inputs) {
                console.error('Error: --inputs option is required.')
                process.exit(1)
            }
            new TagsProcessor().processTagsData(options.inputs, options.output)
        })

    program
        .command('package')
        .description('Assemble reqstool dataset and generate a publishable -reqstool npm package')
        .option('-i, --inputs <paths...>', 'Source directories to scan for annotations (comma separated)', (value) =>
            value.split(','),
        )
        .option('-d, --dataset <dir>', 'Directory containing requirements.yml and related dataset files')
        .option('-r, --test-results <globs...>', 'Glob patterns for JUnit XML test results (comma separated)', (value) =>
            value.split(','),
        )
        .option('-o, --output <dir>', 'Output directory for the assembled package')
        .option('-b, --build-tool <tool>', 'Build tool to record in reqstool_config.yml (npm|yarn|pnpm|bun)')
        .option('-n, --name <string>', 'Override the generated package name (default: <pkg-name>-reqstool)')
        .option('-v, --pkg-version <string>', 'Override the package version (default: from package.json)')
        .action(async (options) => {
            const processor = new PackageProcessor()
            const resolved = processor.resolveOptions({
                inputs: options.inputs,
                dataset: options.dataset,
                testResults: options.testResults,
                output: options.output,
                buildTool: options.buildTool,
                name: options.name,
                pkgVersion: options.pkgVersion,
            })
            await processor.process(resolved)
        })

    program.parse(process.argv)

    if (process.argv.length <= 2) {
        program.help()
    }
}

main()
