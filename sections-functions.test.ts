import { mergePreHeaderContent, parsePreHeaderContent } from './sections-functions';
import { PreHeaderContent, FrontmatterTag, InlineProperty } from './sections-functions';

// Helper function to convert PreHeaderContent back to text
function preHeaderToText(content: PreHeaderContent): string {
    let result = '';
    
    // Add frontmatter if exists
    if (content.frontmatter.length > 0) {
        result += '---\n';
        content.frontmatter.forEach(tag => {
            if (tag.format === 'array') {
                result += `${tag.name}: [${Array.isArray(tag.value) ? tag.value.join(', ') : tag.value}]\n`;
            } else if (tag.format === 'list') {
                result += `${tag.name}:\n${Array.isArray(tag.value) ? tag.value.map(v => `  - ${v}`).join('\n') : `  - ${tag.value}`}\n`;
            } else {
                result += `${tag.name}: ${tag.value}\n`;
            }
        });
        result += '---\n';
    }

    // Add inline properties
    content.inlineProperties.forEach(prop => {
        result += `[${prop.name}:: ${prop.value}]\n`;
    });

    // Add remaining text
    if (content.remainingText) {
        result += content.remainingText + '\n';
    }

    return result.trim();
}

describe('mergePreHeaderContent', () => {
    it('should merge template and target pre-header text content correctly', () => {
        // Arrange
        const templateText = `---
tags: [template-tag]
status: draft
---
[author:: template-author]
Template remaining text`;

        const targetText = `---
tags: [target-tag]
category: test
---
[author:: target-author]
[date:: 2024-01-01]
Target remaining text`;

        // Act
        const templatePreHeader = parsePreHeaderContent(templateText);
        const targetPreHeader = parsePreHeaderContent(targetText);
        const mergedResult = mergePreHeaderContent(templatePreHeader, targetPreHeader);
        const finalText = preHeaderToText(mergedResult);

        // Assert
        const expectedText = `---
tags: [target-tag]
status: draft
category: test
---
[author:: target-author]
[date:: 2024-01-01]
Target remaining text`;

        expect(finalText).toBe(expectedText);
    });

    it('should handle empty or undefined text inputs correctly', () => {
        // Test with empty template
        const emptyTemplate = '';
        const targetText = `---\ntitle: test\n---\nsome content`;
        
        const result1 = mergePreHeaderContent(
            parsePreHeaderContent(emptyTemplate), 
            parsePreHeaderContent(targetText)
        );
        expect(preHeaderToText(result1)).toBe(targetText);

        // Test with empty target
        const templateText = `---\ntitle: template\n---\ntemplate content`;
        const emptyTarget = '';
        
        const result2 = mergePreHeaderContent(
            parsePreHeaderContent(templateText), 
            parsePreHeaderContent(emptyTarget)
        );
        expect(preHeaderToText(result2)).toBe(templateText);

        // Test with both empty
        const result3 = mergePreHeaderContent(
            parsePreHeaderContent(''), 
            parsePreHeaderContent('')
        );
        expect(preHeaderToText(result3)).toBe('');
    });
});
