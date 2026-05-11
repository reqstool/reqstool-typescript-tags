import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
})
