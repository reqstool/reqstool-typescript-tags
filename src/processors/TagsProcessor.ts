import fs from 'fs'
import fg from 'fast-glob'
import * as path from 'path'
import { dump } from 'js-yaml'
import { FormattedData, FunctionOrClassInfo, RequirementAnnotations } from '../types.js'
import { NodeWalker } from './NodeWalker.js'

export class TagsProcessor {
    yamlLanguageServer =
        '# yaml-language-server: $schema=https://raw.githubusercontent.com/reqstool/reqstool-client/main/src/reqstool/resources/schemas/v1/annotations.schema.json'

    tagsToSearch = ['Requirements', 'SVCs']

    /**
     * Creates directory of provided filepath if it does not exist
     *
     * @param filepath - Filepath to check and create directory from.
     * @Requirements TAGS_003
     */
    createDirFromPath(filepath: string): void {
        const directory = path.dirname(filepath)
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true })
        }
    }

    /**
     * @Requirements TAGS_002
     */
    async findTSFiles(directory: string): Promise<string[]> {
        return await fg([`${directory}/**/*.{ts,tsx}`])
    }

    /**
     * @Requirements TAGS_002
     */
    formatResults(results: FunctionOrClassInfo[]): FormattedData {
        const implementations: RequirementAnnotations = {}
        const tests: RequirementAnnotations = {}

        const formattedData: FormattedData = {
            requirement_annotations: {
                implementations,
                tests,
            },
        }

        for (const result of results) {
            for (const tag of result.tags) {
                const ids = tag.tagValues
                const targetDict = tag.tagName === 'Requirements' ? implementations : tests

                for (const id of ids) {
                    if (!targetDict[id]) {
                        targetDict[id] = []
                    }

                    targetDict[id].push({
                        elementKind: this.mapType(result.elementKind),
                        fullyQualifiedName: `${result.fullyQualifiedName}.${result.name}`,
                    })
                }
            }
        }

        return formattedData
    }

    /**
     * @Requirements TAGS_002
     */
    private mapType(elementKind: string): string {
        if (elementKind === 'FUNCTION') {
            return 'METHOD'
        }
        return elementKind
    }

    /**
     * Write formatted data to a YAML file.
     *
     * @param outputFile - The path to the output YAML file.
     * @param formattedData - The formatted data to be written to the YAML file.
     * @Requirements TAGS_003
     */
    writeToYaml(outputFile: string, formattedData: FormattedData): void {
        try {
            // Convert the data to YAML format
            const yamlData = dump(formattedData, { noRefs: true })

            // Write the YAML header and data to the file
            this.createDirFromPath(outputFile)
            const fileContent = `${this.yamlLanguageServer}\n${yamlData}`
            fs.writeFileSync(outputFile, fileContent, 'utf8')
        } catch (error) {
            console.error(`Failed to write YAML data: ${error}`)
        }
    }

    /**
     * @Requirements TAGS_002, TAGS_003
     */
    async processTagsData(paths_to_files: string[], outputFile = 'output/annotations.yml') {
        const nodeWalker = new NodeWalker(this.tagsToSearch)
        let data: FunctionOrClassInfo[] = []
        for (const inputPath of paths_to_files) {
            const files = await this.findTSFiles(inputPath)
            for (const filePath of files) {
                // Normalise to a path relative to the input directory so FQNs are
                // portable regardless of whether the input was absolute or relative.
                const resolvedInput = path.resolve(inputPath)
                const resolvedFile = path.resolve(filePath)
                const rel = path.relative(resolvedInput, resolvedFile)
                // Strip test/spec suffix and .ts/.tsx extension, convert separators to dots.
                // e.g. "test_svcs.test.ts" → "test_svcs", "src/utils.ts" → "src.utils"
                const stem = rel
                    .replace(/\.(test|spec)\.(ts|tsx)$/, '')
                    .replace(/\.(ts|tsx)$/, '')
                    .replace(/[/\\]/g, '.')
                data = [...data, ...nodeWalker.walk(filePath, stem)]
            }
        }

        const formattedReqSvcData = this.formatResults(data)

        this.createDirFromPath(outputFile)
        this.writeToYaml(outputFile, formattedReqSvcData)
    }
}
