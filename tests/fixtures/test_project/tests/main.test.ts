import { hello } from '../src/main.js'

/**
 * @SVCs SVC_001
 */
function test_hello() {
    const result = hello()
    if (result !== 'hello') throw new Error('Expected hello')
}

test_hello()
