import fs from 'fs'
import { FunctionOrClassInfo, TagInfo } from '../types.js'
import ts from 'typescript'

/**
 * Searches the tree of a TypeScript file for specific
 * JSDoc tags and their description text.
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
            }
        }

        if (ts.isClassDeclaration(node) || isFunction(node)) {
            const tags = this.getTags(node)
            if (tags.length > 0) {
                this.results.push({
                    fullyQualifiedName,
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
     * @param filePath
     * @returns
     */
    walk(filePath: string) {
        this.filePath = filePath
        const sourceFile = ts.createSourceFile(
            this.filePath,
            fs.readFileSync(this.filePath, 'utf-8'),
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
    if ((node as any).name?.getText) {
        return (node as any).name.getText() ?? 'undefined'
    }
}
