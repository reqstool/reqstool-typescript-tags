import fs from 'fs'
import { FunctionOrClassInfo, TagInfo } from '../types.js'
import ts from 'typescript'

/**
 * Searches the tree of a TypeScript file for specific
 * JSDoc tags and their description text.
 *
 * @Requirements TAGS_001
 */
export class NodeWalker {
    private results: FunctionOrClassInfo[] = []
    private filePath: string = ''

    constructor(private readonly tagNames: string[]) {}

    private getTags(node: ts.Node) {
        const matchingTags: TagInfo[] = []

        for (const tag of ts.getJSDocTags(node)) {
            const tagName = tag.tagName.getText()
            if (this.tagNames.includes(tagName) && typeof tag.comment === 'string') {
                const tagValues = tag.comment.split(',').map((value) => value.trim())
                matchingTags.push({ tagName, tagValues })
            }
        }

        return matchingTags
    }

    /**
     * Recursively checks a node and its child nodes for test cases, functions and classes tagged by this.tagNames.
     */
    private checkNode(node: ts.Node) {
        const fullyQualifiedName = this.filePath.replace(/^\.\//, '') // Remove leading './'

        if (isFunctionCall(node, 'test')) {
            const testDescription = firstArgStringLiteral(node)
            const tags = this.getTags(node.parent)
            if (tags.length && testDescription) {
                this.results.push({
                    fullyQualifiedName,
                    name: toMethodNameStyle(testDescription),
                    elementKind: 'FUNCTION',
                    tags,
                })
            }
        }

        if (isFunctionCall(node, 'it')) {
            const describeNode = findAncestor(node, (it) => isFunctionCall(it, 'describe'))
            if (describeNode) {
                const itDescription = firstArgStringLiteral(node)
                const describeDescription = firstArgStringLiteral(describeNode)
                const tags = this.getTags(node.parent).concat(this.getTags(describeNode.parent))
                if (tags.length && itDescription && describeDescription) {
                    this.results.push({
                        fullyQualifiedName,
                        name: toMethodNameStyle(describeDescription + '_' + itDescription),
                        elementKind: 'FUNCTION',
                        tags,
                    })
                }
            } else {
                // Top-level it() without a describe() block (common in vitest)
                const itDescription = firstArgStringLiteral(node)
                const tags = this.getTags(node.parent)
                if (tags.length && itDescription) {
                    this.results.push({
                        fullyQualifiedName,
                        name: toMethodNameStyle(itDescription),
                        elementKind: 'FUNCTION',
                        tags,
                    })
                }
            }
        }

        if (ts.isClassDeclaration(node) || isFunction(node)) {
            const tags = this.getTags(node)
            if (tags.length > 0) {
                // For class members (methods and arrow-function properties), include the
                // class name in the FQN so the path is fileStem.ClassName.member.
                const isClassMember =
                    (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) &&
                    ts.isClassDeclaration(node.parent)
                const enclosingClass = isClassMember ? getNodeName(node.parent) : undefined
                this.results.push({
                    fullyQualifiedName: enclosingClass ? `${fullyQualifiedName}.${enclosingClass}` : fullyQualifiedName,
                    elementKind: ts.isClassDeclaration(node) ? 'CLASS' : 'FUNCTION',
                    name: getNodeName(node),
                    tags,
                })
            }
        }

        ts.forEachChild(node, (child) => this.checkNode(child))
    }

    /**
     * Entry point of the class. Walks the entire tree of a typescript file.
     * @param filePath - Absolute or relative path to the file to read.
     * @param fqnBase - Optional FQN prefix to use instead of the raw filePath.
     *                  When supplied by TagsProcessor it is already a clean
     *                  relative stem (e.g. "test_svcs"), so direct callers
     *                  (unit tests) can omit it and get the legacy behaviour.
     * @returns
     */
    walk(filePath: string, fqnBase?: string) {
        this.filePath = fqnBase ?? filePath
        const sourceFile = ts.createSourceFile(
            filePath,
            fs.readFileSync(filePath, 'utf-8'),
            ts.ScriptTarget.ESNext,
            true
        )
        this.results = []

        // Recursively walk the node tree of the file
        this.checkNode(sourceFile)

        return this.results
    }
}

function findAncestor(node: ts.Node, test: (node: ts.Node) => boolean) {
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
        if (test(ancestor)) {
            return ancestor
        }
    }
}

function isFunction(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        return true
    }
    if (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) {
        if (node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
            return true
        }
    }
    return false
}

function isFunctionCall(
    node: ts.Node,
    functionName: string
): node is ts.CallExpression & { expression: ts.Identifier } {
    return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === functionName
}

function toMethodNameStyle(s: string) {
    // N.B. consecutive matches are replaces by one "_"
    return s.replace(/[^a-zA-Z0-9]+/g, '_')
}

function firstArgStringLiteral(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isStringLiteral(node.arguments[0])) {
        return node.arguments[0].text
    }
}

function getNodeName(node: ts.Node) {
    return (isNamedDeclaration(node) && node.name?.getText()) || 'undefined'
}

function isNamedDeclaration(node: ts.Node): node is ts.NamedDeclaration {
    return 'name' in node
}
