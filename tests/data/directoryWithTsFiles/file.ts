/**
 * @Requirements REQ001, REQ002
 */
function regularFunction() {
    /**
     * @Requirements REQ001
     */
    const nestedArrowFunction = () => {}

    /**
     * @Requirements REQ001
     */
    function nestedFunction() {
        nestedArrowFunction()
    }

    return nestedFunction()
}

/**
 * @SVCs SVC003
 */
const arrowFunction = () => {}

/**
 * @SVCs SVC0031
 */
const functionFunction = function () {}

/**
 * @Requirements REQ005
 */
class RegularClass {
    /**
     * @Requirements REQ005
     */
    functionInClass() {
        return
    }
    /**
     * @Requirements REQ005
     */
    arrowFunctionInClass = () => {}
}

/**
 * @Requirements REQ005
 */
async function asyncRegularFunction() {
    return
}

/**
 * @SVCs SVC004
 */
test('Name of test', () => {})

describe('some function', () => {
    /**
     * @SVCs SVC005
     */
    it('should do amazing things', () => {})
})

function test(name: string, func: unknown) {
    return
}

function describe(name: string, func: unknown) {
    return
}

function it(name: string, func: unknown) {
    return
}
