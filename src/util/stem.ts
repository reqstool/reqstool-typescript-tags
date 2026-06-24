// Copyright © LFV

/**
 * Converts a path already relative to some scan root into the dotted "stem" used as the
 * fullyQualifiedName prefix in annotations.yml: strips a .test.ts/.spec.ts/.ts/.tsx suffix
 * and replaces path separators with dots. Shared by TagsProcessor (computing the prefix
 * from a real scan) and vitest.classname-template.ts (computing the same prefix from a
 * JUnit testcase's classname), so the two can't silently drift apart.
 */
export function toStem(relativePath: string): string {
    return relativePath
        .replace(/\.(test|spec)\.(ts|tsx)$/, '')
        .replace(/\.(ts|tsx)$/, '')
        .replace(/[\\/]/g, '.')
}
