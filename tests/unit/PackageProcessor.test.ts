import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import * as yaml from 'js-yaml'
import { PackageProcessor } from '../../src/processors/PackageProcessor'
import { CopiedDatasetFiles } from '../../src/types'

const FIXTURE_DATASET = './tests/fixtures/test_project/docs/reqstool'

describe('PackageProcessor', () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reqstool-test-'))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    describe('generateReqstoolConfig', () => {
        it('should include only requirements and annotations when no optional files', () => {
            const processor = new PackageProcessor()
            const copied: CopiedDatasetFiles = { hasSVCs: false, hasMVRs: false, hasTestResults: false }
            const result = yaml.load(
                processor.generateReqstoolConfig('npm', copied).replace(/^#.*\n/, ''),
            ) as Record<string, unknown>

            expect(result.language).toBe('typescript')
            expect(result.build).toBe('npm')
            const resources = result.resources as Record<string, unknown>
            expect(resources.requirements).toBe('requirements.yml')
            expect(resources.annotations).toBe('annotations.yml')
            expect(resources.software_verification_cases).toBeUndefined()
            expect(resources.manual_verification_results).toBeUndefined()
            expect(resources.test_results).toBeUndefined()
        })

        it('should include optional files when present', () => {
            const processor = new PackageProcessor()
            const copied: CopiedDatasetFiles = { hasSVCs: true, hasMVRs: true, hasTestResults: true }
            const result = yaml.load(
                processor.generateReqstoolConfig('yarn', copied).replace(/^#.*\n/, ''),
            ) as Record<string, unknown>

            expect(result.build).toBe('yarn')
            const resources = result.resources as Record<string, unknown>
            expect(resources.software_verification_cases).toBe('software_verification_cases.yml')
            expect(resources.manual_verification_results).toBe('manual_verification_results.yml')
            expect(resources.test_results).toEqual(['test_results/**/*.xml'])
        })

        it('should include yaml-language-server schema comment', () => {
            const processor = new PackageProcessor()
            const result = processor.generateReqstoolConfig('npm', { hasSVCs: false, hasMVRs: false, hasTestResults: false })
            expect(result).toMatch(/^# yaml-language-server: \$schema=/)
        })
    })

    describe('generateSubPackageJson', () => {
        it('should generate a valid npm package.json', () => {
            const processor = new PackageProcessor()
            const result = processor.generateSubPackageJson('my-pkg-reqstool', '1.2.3') as Record<string, unknown>

            expect(result.name).toBe('my-pkg-reqstool')
            expect(result.version).toBe('1.2.3')
            expect(result.type).toBe('module')
            expect(result.main).toBe('index.js')
            expect(result.files).toEqual(['*'])
        })
    })

    describe('copyDatasetFiles', () => {
        it('should copy requirements.yml and return correct flags', () => {
            const processor = new PackageProcessor()
            const result = processor.copyDatasetFiles(FIXTURE_DATASET, tmpDir)

            expect(fs.existsSync(path.join(tmpDir, 'requirements.yml'))).toBe(true)
            expect(fs.existsSync(path.join(tmpDir, 'software_verification_cases.yml'))).toBe(true)
            expect(result.hasSVCs).toBe(true)
            expect(result.hasMVRs).toBe(false)
        })

        it('should throw when requirements.yml is missing', () => {
            const processor = new PackageProcessor()
            expect(() => processor.copyDatasetFiles('/nonexistent/dir', tmpDir)).toThrow('requirements.yml not found')
        })

        it('should silently skip missing optional files', () => {
            const processor = new PackageProcessor()
            const minimalDataset = path.join(tmpDir, 'dataset')
            const outDir = path.join(tmpDir, 'out')
            fs.mkdirSync(minimalDataset)
            fs.mkdirSync(outDir)
            fs.writeFileSync(path.join(minimalDataset, 'requirements.yml'), 'metadata:\n  urn: test\n')

            const result = processor.copyDatasetFiles(minimalDataset, outDir)
            expect(result.hasSVCs).toBe(false)
            expect(result.hasMVRs).toBe(false)
        })
    })

    describe('copyTestResults', () => {
        it('should glob and copy matching XML files', async () => {
            const processor = new PackageProcessor()
            const globPattern = './tests/fixtures/test_project/build/test-results/**/*.xml'
            const outDir = path.join(tmpDir, 'out')
            fs.mkdirSync(outDir)

            const hadResults = await processor.copyTestResults([globPattern], outDir)

            expect(hadResults).toBe(true)
            const testResultsDir = path.join(outDir, 'test_results')
            expect(fs.existsSync(testResultsDir)).toBe(true)
            const files = fs.readdirSync(testResultsDir)
            expect(files.some((f) => f.endsWith('.xml'))).toBe(true)
        })

        it('should return false when no files match the glob', async () => {
            const processor = new PackageProcessor()
            const result = await processor.copyTestResults(['./nonexistent/**/*.xml'], tmpDir)
            expect(result).toBe(false)
        })
    })

    describe('resolveOptions', () => {
        it('should read reqstool block from package.json in cwd', () => {
            const pkgJson = {
                name: 'my-pkg',
                version: '1.0.0',
                reqstool: {
                    sources: ['src', 'tests'],
                    dataset_directory: 'docs/reqstool',
                    output_directory: 'build/out',
                    test_results: ['build/**/*.xml'],
                    build_tool: 'yarn' as const,
                },
            }
            vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(pkgJson))

            const result = new PackageProcessor().resolveOptions({})

            expect(result.inputs).toEqual(['src', 'tests'])
            expect(result.dataset).toBe('docs/reqstool')
            expect(result.output).toBe('build/out')
            expect(result.testResults).toEqual(['build/**/*.xml'])
            expect(result.buildTool).toBe('yarn')
            expect(result.name).toBe('my-pkg-reqstool')
            expect(result.pkgVersion).toBe('1.0.0')

            vi.restoreAllMocks()
        })

        it('should use CLI options as overrides over package.json', () => {
            const pkgJson = { name: 'my-pkg', version: '1.0.0', reqstool: { sources: ['src'], build_tool: 'npm' as const } }
            vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(pkgJson))

            const result = new PackageProcessor().resolveOptions({
                inputs: ['custom-src'],
                buildTool: 'pnpm',
                name: 'override-name',
            })

            expect(result.inputs).toEqual(['custom-src'])
            expect(result.buildTool).toBe('pnpm')
            expect(result.name).toBe('override-name')

            vi.restoreAllMocks()
        })

        it('should use defaults when no package.json exists', () => {
            vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
                throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
            })

            const result = new PackageProcessor().resolveOptions({ inputs: ['src'] })

            expect(result.inputs).toEqual(['src'])
            expect(result.dataset).toBe('docs/reqstool')
            expect(result.output).toBe('build/reqstool-package')
            expect(result.buildTool).toBe('npm')

            vi.restoreAllMocks()
        })
    })

    describe('process', () => {
        it('should throw when inputs is empty', async () => {
            const processor = new PackageProcessor()
            const options = processor.resolveOptions({ inputs: [] })
            // force empty even if package.json provides sources
            options.inputs = []

            await expect(processor.process(options)).rejects.toThrow('No source inputs specified')
        })

        it('should write index.js shim with correct content', async () => {
            const outDir = path.join(tmpDir, 'pkg-out')
            const processor = new PackageProcessor()

            // Minimal dataset with just requirements.yml
            const datasetDir = path.join(tmpDir, 'dataset')
            fs.mkdirSync(datasetDir)
            fs.writeFileSync(path.join(datasetDir, 'requirements.yml'), 'metadata:\n  urn: test\n')

            await processor.process({
                inputs: ['tests/fixtures/test_project/src'],
                dataset: datasetDir,
                output: outDir,
                testResults: [],
                buildTool: 'npm',
                name: 'test-reqstool',
                pkgVersion: '0.1.0',
            })

            const shim = fs.readFileSync(path.join(outDir, 'index.js'), 'utf8')
            expect(shim).toContain('reqstoolConfigPath')
            expect(shim).toContain('reqstool_config.yml')
        })

        it('should skip copyTestResults when testResults is empty', async () => {
            const outDir = path.join(tmpDir, 'pkg-out')
            const processor = new PackageProcessor()
            const copyTestResultsSpy = vi.spyOn(processor, 'copyTestResults')

            const datasetDir = path.join(tmpDir, 'dataset')
            fs.mkdirSync(datasetDir)
            fs.writeFileSync(path.join(datasetDir, 'requirements.yml'), 'metadata:\n  urn: test\n')

            await processor.process({
                inputs: ['tests/fixtures/test_project/src'],
                dataset: datasetDir,
                output: outDir,
                testResults: [],
                buildTool: 'npm',
                name: 'test-reqstool',
                pkgVersion: '0.1.0',
            })

            expect(copyTestResultsSpy).not.toHaveBeenCalled()
            expect(fs.existsSync(path.join(outDir, 'test_results'))).toBe(false)

            vi.restoreAllMocks()
        })
    })
})
