import { expect, test } from 'vitest'
import fs from 'fs'
import * as yaml from 'js-yaml'
import { TagsProcessor } from '../../src/processors/TagsProcessor'
import { FormattedData } from '../../src/types'

// Test titles below are plain identifiers, not BDD-style sentences — see
// vitest.classname-template.ts for why.

/**
 * @SVCs SVC_TAGS_003
 */
test('should_write_data_to_a_yaml_file', () => {
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

/**
 * @SVCs SVC_TAGS_002
 */
test('should_find_all_ts_and_tsx_files_in_a_directory_tree', async () => {
    const instance = new TagsProcessor()
    const response = await instance.findTSFiles('./tests/data/directoryWithTsFiles')

    expect(response).includes('./tests/data/directoryWithTsFiles/file.ts')
    expect(response).includes('./tests/data/directoryWithTsFiles/subdirectory/subdirectoryFile.tsx')
    expect(response).not.includes('./tests/data/directoryWithTsFiles/file.txt')
})

/**
 * @SVCs SVC_TAGS_001
 */
test('should_process_all_files_in_a_directory_completely', async () => {
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
