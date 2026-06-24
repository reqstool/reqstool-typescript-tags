import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { classnameTemplate } from './vitest.classname-template.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/unit/**/*.test.ts'],
        exclude: ['tests/fixtures/**', 'tests/e2e/**'],
        reporters: ['default', ['junit', { outputFile: 'build/test-results/junit-unit.xml', classnameTemplate }]],
    },
    resolve: {
        alias: {
            tests: resolve(__dirname, './tests'),
        },
    },
})
