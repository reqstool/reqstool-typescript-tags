import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/e2e/**/*.test.ts'],
        testTimeout: 30000,
    },
    resolve: {
        alias: {
            tests: resolve(__dirname, './tests'),
        },
    },
})
