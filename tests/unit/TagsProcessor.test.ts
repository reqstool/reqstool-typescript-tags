import { describe, expect, it } from 'vitest'
import fs from 'fs'
import * as yaml from 'js-yaml'
import { TagsProcessor } from '../../src/processors/TagsProcessor'
import { NodeWalker } from '../../src/processors/NodeWalker'
import { FormattedData } from '../../src/types'
import { formatResultsExpected } from 'tests/data/expectedOutput/formatResults.js'
import { walkExpected } from 'tests/data/expectedOutput/walk.js'

// TODO fun problem: Run test -> instance.findTSFiles is not a function. Debug test -> Success

describe('TagsProcessor', () => {
    it('should write data to a YAML file', () => {
        const instance = new TagsProcessor()
        const data: FormattedData = {
            requirement_annotations: {
                implementations: {},
                tests: {},
            },
        }
        const outputFile = 'test_output.yml'

        instance.writeToYaml(outputFile, data)

        // Verify file content
        const fileContent = fs.readFileSync(outputFile, 'utf8')
        const parsedContent = yaml.load(fileContent)

        expect(parsedContent).toEqual(data)

        // Clean up
        fs.unlinkSync(outputFile)
    })

    it('should find all ts and tsx files in a directory tree', async () => {
        const instance = new TagsProcessor()
        const response = await instance.findTSFiles('./tests/data/directoryWithTsFiles')

        expect(response).includes('./tests/data/directoryWithTsFiles/file.ts')
        expect(response).includes('./tests/data/directoryWithTsFiles/subdirectory/subdirectoryFile.tsx')
        expect(response).not.includes('./tests/data/directoryWithTsFiles/file.txt')
    })

    it('should find requirements tags in typescript files', () => {
        const result = new NodeWalker(['Requirements', 'SVCs']).walk('./tests/data/directoryWithTsFiles/file.ts')
        expect(result).toEqual(walkExpected)
    })

    it('should format the results', /**@SVCs REQ_001 */ function test2() {
        const tagsProcessor = new TagsProcessor()
        const unformatted = new NodeWalker(['Requirements', 'SVCs']).walk('./tests/data/directoryWithTsFiles/file.ts')
        const formatted = tagsProcessor.formatResults(unformatted)
        expect(formatted).toEqual(formatResultsExpected)
    })

    it('should process a file completely', async () => {
        const outputFile = 'annotations.yml'
        const tagsProcessor = new TagsProcessor()
        const unformatted = new NodeWalker(['Requirements', 'SVCs']).walk('./tests/data/directoryWithTsFiles/file.ts')

        const formatted = tagsProcessor.formatResults(unformatted)
        tagsProcessor.writeToYaml(outputFile, formatted)

        //Verify file content
        const fileContent = fs.readFileSync(outputFile, 'utf8')
        const parsedContent = yaml.load(fileContent)

        const expectedFileContent = fs.readFileSync('./tests/data/expectedOutput/getFunctionsAndClasses.yml', 'utf8')
        const parsedExpectedContent = yaml.load(expectedFileContent)

        expect(parsedContent).toEqual(parsedExpectedContent)

        // Clean up
        fs.unlinkSync(outputFile)
    })

    it('should process all files in a directory completely', async () => {
        const outputFile = 'annotations.yml'
        const instance = new TagsProcessor()
        await instance.processTagsData(['./tests/data/directoryWithTsFiles'], outputFile)

        //Verify file content
        const fileContent = fs.readFileSync(outputFile, 'utf8')
        const parsedContent = yaml.load(fileContent)

        const expectedFileContent = fs.readFileSync('./tests/data/expectedOutput/processTagsData.yml', 'utf8')
        const parsedExpectedContent = yaml.load(expectedFileContent)

        expect(parsedContent).toEqual(parsedExpectedContent)

        // Clean up
        fs.unlinkSync(outputFile)
    })
})
