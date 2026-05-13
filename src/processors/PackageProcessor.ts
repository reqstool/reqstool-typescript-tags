import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { dump } from 'js-yaml'
import { TagsProcessor } from './TagsProcessor.js'
import { BuildTool, CopiedDatasetFiles, PackageOptions, ReqstoolPackageConfig } from '../types.js'
import nodeProcess from 'node:process'

const REQSTOOL_CONFIG_SCHEMA =
    'https://raw.githubusercontent.com/reqstool/reqstool-client/main/src/reqstool/resources/schemas/v1/reqstool_config.schema.json'

const VALID_BUILD_TOOLS: BuildTool[] = ['npm', 'yarn', 'pnpm', 'bun']

export class PackageProcessor {
    resolveOptions(cliOptions: Partial<PackageOptions>): PackageOptions {
        let pkgConfig: ReqstoolPackageConfig = {}
        let defaultName = 'unnamed-reqstool'
        let defaultVersion = '0.0.0'

        try {
            const pkgJsonPath = path.join(process.cwd(), 'package.json')
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8') as string)
            pkgConfig = pkgJson.reqstool ?? {}
            defaultName = `${pkgJson.name}-reqstool`
            defaultVersion = pkgJson.version
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.warn(`Warning: could not read package.json: ${err}`)
            }
        }

        const rawBuildTool = cliOptions.buildTool ?? pkgConfig.build_tool ?? 'npm'
        const buildTool: BuildTool = (VALID_BUILD_TOOLS as string[]).includes(rawBuildTool)
            ? (rawBuildTool as BuildTool)
            : 'npm'

        return {
            inputs: cliOptions.inputs ?? pkgConfig.sources ?? [],
            dataset: cliOptions.dataset ?? pkgConfig.dataset_directory ?? 'docs/reqstool',
            output: cliOptions.output ?? pkgConfig.output_directory ?? 'build/reqstool-package',
            testResults: cliOptions.testResults ?? pkgConfig.test_results ?? [],
            buildTool,
            name: cliOptions.name ?? defaultName,
            pkgVersion: cliOptions.pkgVersion ?? defaultVersion,
        }
    }

    async process(options: PackageOptions): Promise<void> {
        if (options.inputs.length === 0) {
            throw new Error(
                'No source inputs specified. Use --inputs or set "sources" in package.json reqstool config.'
            )
        }

        const outputDir = options.output
        fs.mkdirSync(outputDir, { recursive: true })

        try {
            const annotationsPath = path.join(outputDir, 'annotations.yml')
            await new TagsProcessor().processTagsData(options.inputs, annotationsPath)

            const copiedFiles = this.copyDatasetFiles(options.dataset, outputDir)

            if (options.testResults.length > 0) {
                copiedFiles.hasTestResults = await this.copyTestResults(options.testResults, outputDir)
            }

            const configYaml = this.generateReqstoolConfig(options.buildTool, copiedFiles)
            fs.writeFileSync(path.join(outputDir, 'reqstool_config.yml'), configYaml, 'utf8')

            const subPkg = this.generateSubPackageJson(options.name, options.pkgVersion)
            fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(subPkg, null, 4) + '\n', 'utf8')

            const shim = `import { fileURLToPath } from 'node:url';\nexport const reqstoolConfigPath = fileURLToPath(new URL('./reqstool_config.yml', import.meta.url));\n`
            fs.writeFileSync(path.join(outputDir, 'index.js'), shim, 'utf8')
        } catch (err) {
            fs.rmSync(outputDir, { recursive: true, force: true })
            throw err
        }
    }

    copyDatasetFiles(datasetDir: string, outputDir: string): CopiedDatasetFiles {
        const reqFile = path.join(datasetDir, 'requirements.yml')
        if (!fs.existsSync(reqFile)) {
            throw new Error(`requirements.yml not found in dataset directory: ${datasetDir}`)
        }
        fs.copyFileSync(reqFile, path.join(outputDir, 'requirements.yml'))

        const copiedFiles: CopiedDatasetFiles = { hasSVCs: false, hasMVRs: false, hasTestResults: false }

        const svcsFile = path.join(datasetDir, 'software_verification_cases.yml')
        if (fs.existsSync(svcsFile)) {
            fs.copyFileSync(svcsFile, path.join(outputDir, 'software_verification_cases.yml'))
            copiedFiles.hasSVCs = true
        }

        const mvrsFile = path.join(datasetDir, 'manual_verification_results.yml')
        if (fs.existsSync(mvrsFile)) {
            fs.copyFileSync(mvrsFile, path.join(outputDir, 'manual_verification_results.yml'))
            copiedFiles.hasMVRs = true
        }

        return copiedFiles
    }

    async copyTestResults(globs: string[], outputDir: string): Promise<boolean> {
        const files = await fg(globs)
        if (files.length === 0) return false

        const cwd = nodeProcess.cwd()
        const testResultsDir = path.join(outputDir, 'test_results')

        for (const file of files) {
            const absFile = path.resolve(file)
            // Reject paths that escape the project root
            if (!absFile.startsWith(cwd + path.sep) && absFile !== cwd) {
                console.warn(`Skipping test result outside project root: ${file}`)
                continue
            }
            // Preserve relative path structure to avoid basename collisions
            const relPath = path.relative(cwd, absFile)
            const dest = path.join(testResultsDir, relPath)
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.copyFileSync(absFile, dest)
        }

        return fs.existsSync(testResultsDir)
    }

    generateReqstoolConfig(buildTool: BuildTool, copiedFiles: CopiedDatasetFiles): string {
        const resources: Record<string, unknown> = {
            requirements: 'requirements.yml',
        }
        if (copiedFiles.hasSVCs) resources.software_verification_cases = 'software_verification_cases.yml'
        if (copiedFiles.hasMVRs) resources.manual_verification_results = 'manual_verification_results.yml'
        resources.annotations = 'annotations.yml'
        if (copiedFiles.hasTestResults) resources.test_results = ['test_results/**/*.xml']

        const config = { language: 'typescript', build: buildTool, resources }
        return `# yaml-language-server: $schema=${REQSTOOL_CONFIG_SCHEMA}\n${dump(config, { lineWidth: -1 })}`
    }

    generateSubPackageJson(name: string, version: string): object {
        return {
            name,
            version,
            type: 'module',
            main: 'index.js',
            files: ['*'],
        }
    }
}
