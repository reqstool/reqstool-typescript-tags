export type TagInfo = {
    tagName: string
    tagValues: string[]
}

export type FunctionOrClassInfo = {
    fullyQualifiedName: string
    elementKind: 'FUNCTION' | 'CLASS'
    name: string
    tags: TagInfo[]
}

export type RequirementAnnotations = {
    [id: string]: { elementKind: string; fullyQualifiedName: string }[]
}

export type FormattedData = {
    requirement_annotations: {
        implementations: RequirementAnnotations
        tests: RequirementAnnotations
    }
}
