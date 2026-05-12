import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawnSync } from 'child_process'
import * as yaml from 'js-yaml'

const FIXTURE_PROJECT = path.resolve('./tests/fixtures/test_project')
const CLI = path.resolve('./dist/index.js')

describe('PackageProcessor e2e', () => {
    let tmpDir: string
    let projectDir: string

    beforeAll(() => {
        if (!fs.existsSync(CLI)) {
            throw new Error('dist/index.js not found — run `npm run build` before running e2e tests')
        }

        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reqstool-e2e-'))
        projectDir = path.join(tmpDir, 'test_project')

        // Copy fixture project, excluding any leftover build/reqstool-package artefacts
        copyDir(FIXTURE_PROJECT, projectDir, ['build/reqstool-package'])
    })

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('should assemble a complete reqstool package from the fixture project', async () => {
        const result = spawnSync(
            'node',
            [
                CLI,
                'package',
                '--inputs',
                'src,tests',
                '--dataset',
                'docs/reqstool',
                '--test-results',
                'build/test-results/**/*.xml',
                '--output',
                'build/reqstool-package',
            ],
            { cwd: projectDir, encoding: 'utf8' },
        )

        expect(result.status, `stderr: ${result.stderr}`).toBe(0)

        const outDir = path.join(projectDir, 'build/reqstool-package')

        // All expected files must exist
        for (const file of ['reqstool_config.yml', 'package.json', 'index.js', 'requirements.yml', 'annotations.yml']) {
            expect(fs.existsSync(path.join(outDir, file)), `missing: ${file}`).toBe(true)
        }
        expect(fs.existsSync(path.join(outDir, 'software_verification_cases.yml'))).toBe(true)

        // annotations.yml contains expected IDs
        const annotations = fs.readFileSync(path.join(outDir, 'annotations.yml'), 'utf8')
        expect(annotations).toContain('REQ_001')
        expect(annotations).toContain('SVC_001')

        // reqstool_config.yml is valid YAML with expected structure
        const config = yaml.load(
            fs.readFileSync(path.join(outDir, 'reqstool_config.yml'), 'utf8'),
        ) as Record<string, unknown>
        expect(config.language).toBe('typescript')
        expect(config.build).toBe('npm')
        const resources = config.resources as Record<string, unknown>
        expect(resources.requirements).toBe('requirements.yml')
        expect(resources.annotations).toBe('annotations.yml')
        expect(resources.software_verification_cases).toBe('software_verification_cases.yml')
        expect(resources.test_results).toEqual(['test_results/**/*.xml'])

        // sub-package package.json is correct
        const subPkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'))
        expect(subPkg.name).toBe('my-ts-package-reqstool')
        expect(subPkg.version).toBe('1.2.3')
        expect(subPkg.type).toBe('module')
        expect(subPkg.main).toBe('index.js')

        // test results were copied
        const testResultsDir = path.join(outDir, 'test_results')
        expect(fs.existsSync(testResultsDir)).toBe(true)
        const xmlFiles = fs.readdirSync(testResultsDir).filter((f) => f.endsWith('.xml'))
        expect(xmlFiles.length).toBeGreaterThan(0)

        // package can be packed by npm
        const packResult = spawnSync('npm', ['pack', '--dry-run', outDir], { cwd: tmpDir, encoding: 'utf8' })
        expect(packResult.status, `npm pack failed: ${packResult.stderr}`).toBe(0)
    })

    it('should fail with a clear error when requirements.yml is missing', () => {
        const emptyDataset = path.join(tmpDir, 'empty-dataset')
        fs.mkdirSync(emptyDataset)

        const result = spawnSync(
            'node',
            [CLI, 'package', '--inputs', 'src', '--dataset', emptyDataset, '--output', path.join(tmpDir, 'out')],
            { cwd: projectDir, encoding: 'utf8' },
        )

        expect(result.status).not.toBe(0)
        expect(result.stderr).toContain('requirements.yml not found')
    })
})

function copyDir(src: string, dest: string, exclude: string[] = []) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        const relative = path.relative(src, srcPath)
        if (exclude.some((e) => relative.startsWith(e))) continue
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, exclude)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}
