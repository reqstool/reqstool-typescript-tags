import { expect, test } from 'vitest'
import { toStem } from '../../src/util/stem'
import { classnameTemplate } from '../../vitest.classname-template'

test('toStem_strips_test_suffix_and_dots_separators', () => {
    expect(toStem('TagsProcessor.test.ts')).toBe('TagsProcessor')
    expect(toStem('subdirectory/Foo.test.tsx')).toBe('subdirectory.Foo')
    expect(toStem('src/processors/TagsProcessor.ts')).toBe('src.processors.TagsProcessor')
})

test('classnameTemplate_matches_tagsprocessor_stem_for_the_same_relative_path', () => {
    // Pins classnameTemplate (vitest's view, rooted at the project) to the same stem
    // TagsProcessor computes (rooted at one of self-apply's --inputs dirs) for the same
    // file, so the two can't silently drift apart — see vitest.classname-template.ts.
    expect(classnameTemplate({ filename: 'tests/unit/TagsProcessor.test.ts' })).toBe(toStem('TagsProcessor.test.ts'))
    expect(classnameTemplate({ filename: 'tests/e2e/PackageProcessor.e2e.test.ts' })).toBe(
        toStem('PackageProcessor.e2e.test.ts')
    )
})
