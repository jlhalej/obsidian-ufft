import { parsePreHeaderContent, PreHeaderContent } from './pre-header-parser';

describe('Pre-Header Parser', () => {
    describe('parsePreHeaderContent', () => {
        test('should parse empty content', () => {
            const result = parsePreHeaderContent('');
            expect(result).toEqual({
                frontmatter: [],
                inlineProperties: [],
                remainingText: ''
            });
        });

        test('should parse frontmatter with single line tags', () => {
            const content = `---
tags: tag1, tag2, tag3
category: test
---
Some text`;
            const result = parsePreHeaderContent(content);
            expect(result.frontmatter).toContainEqual({
                name: 'tags',
                value: ['tag1', 'tag2', 'tag3'],
                format: 'single'
            });
            expect(result.frontmatter).toContainEqual({
                name: 'category',
                value: ['test'],
                format: 'single'
            });
            expect(result.remainingText).toBe('Some text');
        });

        test('should parse frontmatter with list format', () => {
            const content = `---
tags:
- tag1
- tag2
- tag3
---`;
            const result = parsePreHeaderContent(content);
            expect(result.frontmatter).toContainEqual({
                name: 'tags',
                value: ['tag1', 'tag2', 'tag3'],
                format: 'list'
            });
        });

        test('should parse frontmatter with array format', () => {
            const content = `---
tags: [tag1, tag2, tag3]
---`;
            const result = parsePreHeaderContent(content);
            expect(result.frontmatter).toContainEqual({
                name: 'tags',
                value: ['tag1', 'tag2', 'tag3'],
                format: 'array'
            });
        });

        test('should parse inline properties', () => {
            const content = `prop1:: value1
prop2:: value with spaces
Some regular text
prop3:: another value`;
            const result = parsePreHeaderContent(content);
            expect(result.inlineProperties).toContainEqual({
                name: 'prop1',
                value: 'value1'
            });
            expect(result.inlineProperties).toContainEqual({
                name: 'prop2',
                value: 'value with spaces'
            });
            expect(result.inlineProperties).toContainEqual({
                name: 'prop3',
                value: 'another value'
            });
            expect(result.remainingText).toBe('Some regular text');
        });

        test('should parse mixed content', () => {
            const content = `---
tags: tag1, tag2
category: test
---
prop1:: value1
Some text here
prop2:: value2
More text`;
            const result = parsePreHeaderContent(content);
            
            // Check frontmatter
            expect(result.frontmatter).toContainEqual({
                name: 'tags',
                value: ['tag1', 'tag2'],
                format: 'single'
            });
            expect(result.frontmatter).toContainEqual({
                name: 'category',
                value: ['test'],
                format: 'single'
            });

            // Check inline properties
            expect(result.inlineProperties).toContainEqual({
                name: 'prop1',
                value: 'value1'
            });
            expect(result.inlineProperties).toContainEqual({
                name: 'prop2',
                value: 'value2'
            });

            // Check remaining text
            expect(result.remainingText).toBe('Some text here\nMore text');
        });

        test('should handle malformed frontmatter', () => {
            const content = `---
invalid line
tags: tag1
---`;
            const result = parsePreHeaderContent(content);
            expect(result.frontmatter).toContainEqual({
                name: 'tags',
                value: ['tag1'],
                format: 'single'
            });
        });

        test('should handle malformed inline properties', () => {
            const content = `prop1:: value1
invalid line
prop2:: value2`;
            const result = parsePreHeaderContent(content);
            expect(result.inlineProperties).toContainEqual({
                name: 'prop1',
                value: 'value1'
            });
            expect(result.inlineProperties).toContainEqual({
                name: 'prop2',
                value: 'value2'
            });
            expect(result.remainingText).toBe('invalid line');
        });
    });
});
