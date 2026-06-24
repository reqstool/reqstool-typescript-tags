import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { classnameTemplate } from './vitest.classname-template.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/e2e/**/*.test.ts'],
        testTimeout: 30000,
        reporters: ['default', ['junit', { outputFile: 'build/test-results/junit-e2e.xml', classnameTemplate }]],
    },
    resolve: {
        alias: {
            tests: resolve(__dirname, './tests'),
        },
    },
})
