import { describe, expect, it } from 'vitest'
import fs from 'fs'
import * as yaml from 'js-yaml'
import { TagsProcessor } from '../../src/processors/TagsProcessor'
import { FormattedData } from '../../src/types'

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

        const fileContent = fs.readFileSync(outputFile, 'utf8')
        const parsedContent = yaml.load(fileContent)

        expect(parsedContent).toEqual(data)

        fs.unlinkSync(outputFile)
    })

    it('should find all ts and tsx files in a directory tree', async () => {
        const instance = new TagsProcessor()
        const response = await instance.findTSFiles('./tests/data/directoryWithTsFiles')

        expect(response).includes('./tests/data/directoryWithTsFiles/file.ts')
        expect(response).includes('./tests/data/directoryWithTsFiles/subdirectory/subdirectoryFile.tsx')
        expect(response).not.includes('./tests/data/directoryWithTsFiles/file.txt')
    })

    it('should process all files in a directory completely', async () => {
        const outputFile = 'annotations.yml'
        const instance = new TagsProcessor()
        await instance.processTagsData(['./tests/data/directoryWithTsFiles'], outputFile)

        const fileContent = fs.readFileSync(outputFile, 'utf8')
        const parsedContent = yaml.load(fileContent)

        const expectedFileContent = fs.readFileSync('./tests/data/expectedOutput/processTagsData.yml', 'utf8')
        const parsedExpectedContent = yaml.load(expectedFileContent)

        expect(parsedContent).toEqual(parsedExpectedContent)

        fs.unlinkSync(outputFile)
    })
})
