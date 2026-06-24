import { toStem } from './src/util/stem.js'

// Reuses TagsProcessor's own stem logic (src/util/stem.ts) so a JUnit testcase's classname
// matches the fullyQualifiedName prefix recorded for the same test in annotations.yml —
// required for reqstool to match verifying tests by JUnit result. Only the "what is this
// path relative to" part differs from TagsProcessor: vitest's `filename` is relative to the
// project root, so the tests/unit|e2e prefix is stripped here to match self-apply's
// --inputs tests/unit / --inputs tests/e2e scan roots.
export function classnameTemplate({ filename }: { filename: string }): string {
    return toStem(filename.replace(/^tests\/(unit|e2e)\//, ''))
}
