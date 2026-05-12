import { hello } from '../src/main.js'

/**
 * @SVCs SVC_001
 */
function test_hello() {
    const result = hello()
    if (result !== 'hello') throw new Error('Expected hello')
}

// Note: test_hello is NOT called here intentionally.
// This file is a fixture scanned for @SVCs JSDoc tags.
// The JUnit XML in build/test-results/ is pre-generated and not produced by running this file.
