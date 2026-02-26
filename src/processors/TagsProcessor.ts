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

    createDirFromPath(filepath: string): void {
        /**
         * Creates directory of provided filepath if it does not exist
         *
         * @param filepath - Filepath to check and create directory from.
         */
        const directory = path.dirname(filepath)
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true })
        }
    }

    async findTSFiles(directory: string): Promise<string[]> {
        return await fg([`${directory}/**/*.{ts,tsx}`])
    }

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

    async processTagsData(paths_to_files: string[], outputFile = 'output/annotations.yml') {
        const nodeWalker = new NodeWalker(this.tagsToSearch)
        let data: FunctionOrClassInfo[] = []
        for (const path of paths_to_files) {
            const files = await this.findTSFiles(path)
            for (const filePath of files) {
                data = [...data, ...nodeWalker.walk(filePath)]
            }
        }

        const formattedReqSvcData = this.formatResults(data)

        this.createDirFromPath(outputFile)
        this.writeToYaml(outputFile, formattedReqSvcData)
    }
}
