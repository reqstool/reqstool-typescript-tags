// Mirrors TagsProcessor's own file-stem derivation (src/processors/TagsProcessor.ts) so a
// JUnit testcase's classname matches the fullyQualifiedName prefix recorded for the same
// test in annotations.yml — required for reqstool to match verifying tests by JUnit result.
export function classnameTemplate({ filename }: { filename: string }): string {
    return filename
        .replace(/^tests\/(unit|e2e)\//, '')
        .replace(/\.(test|spec)\.(ts|tsx)$/, '')
        .replace(/\.(ts|tsx)$/, '')
        .replace(/[\\/]/g, '.')
}
