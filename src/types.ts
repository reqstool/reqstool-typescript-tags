export type TagInfo = {
    tagName: string
    tagValues: string[]
}

export type ReqstoolPackageConfig = {
    sources?: string[]
    dataset_directory?: string
    output_directory?: string
    test_results?: string[]
    build_tool?: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

export type PackageOptions = {
    inputs: string[]
    dataset: string
    output: string
    testResults: string[]
    buildTool: string
    name: string
    pkgVersion: string
}

export type CopiedDatasetFiles = {
    hasSVCs: boolean
    hasMVRs: boolean
    hasTestResults: boolean
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
