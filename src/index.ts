#!/usr/bin/env node

import { Command } from 'commander'
import { TagsProcessor } from './processors/TagsProcessor.js'
import packageJson from '../package.json' with { type: 'json' }

function main() {
    const commandLine = new Command()

    commandLine
        .name(packageJson.name)
        .description(packageJson.description)
        .version(packageJson.version)
        .option('-i, --inputs <paths...>', 'Input directories (comma separated)', (value) => value.split(','))
        .option('-o, --output <file>', 'Output file', 'annotations.yml')
        .parse(process.argv)

    const options = commandLine.opts()

    if (!options.inputs) {
        console.error('Error: --inputs option is required.')
        commandLine.help()
        process.exit(1)
    }
    new TagsProcessor().processTagsData(options.inputs, options.output)
}

main()
