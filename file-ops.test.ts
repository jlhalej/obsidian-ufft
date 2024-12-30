import { App, TFile } from 'obsidian';
import { getHeaderSections, updateFileWithTemplate } from './file-ops';
import { PreHeaderContent } from './pre-header-parser';

// Mock the TFile class
class MockTFile extends TFile {
    content: string;

    constructor(content: string) {
        super();
        this.content = content;
    }
}

// Mock the App class
const mockApp = {
    vault: {
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn(),
    }
} as unknown as App;

// Fix TypeScript errors by properly typing the mock functions
const mockGetAbstractFileByPath = mockApp.vault.getAbstractFileByPath as jest.Mock;
const mockRead = mockApp.vault.read as jest.Mock;
const mockModify = mockApp.vault.modify as jest.Mock;

describe('getHeaderSections', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should parse file with pre-header content', async () => {
        const mockContent = `---
tags: tag1, tag2
category: test
---
prop1:: value1
Some text here

# Header 1
Content 1

## Subheader 1
Subcontent 1`;

        const mockFile = new MockTFile(mockContent);
        mockGetAbstractFileByPath.mockReturnValue(mockFile);
        mockRead.mockResolvedValue(mockContent);

        const sections = await getHeaderSections(mockApp, 'test.md');
        console.log('Mock file content:', mockContent);
        console.log('Parsed sections:', sections);

        expect(sections.length).toBeGreaterThan(0);
        const preHeader = sections.find(s => s.isPreHeaderContent);
        expect(preHeader).toBeTruthy();
        expect(preHeader?.preHeaderContent).toBeTruthy();
        expect(preHeader?.preHeaderContent?.frontmatter).toContainEqual({
            name: 'tags',
            value: ['tag1', 'tag2'],
            format: 'array'
        });
        expect(preHeader?.preHeaderContent?.frontmatter).toContainEqual({
            name: 'category',
            value: 'test',
            format: 'single'
        });
        expect(preHeader?.preHeaderContent?.inlineProperties).toContainEqual({
            name: 'prop1',
            value: 'value1'
        });

        // Check L1 header
        const l1Section = sections.find(s => s.level === 1);
        expect(l1Section).toBeTruthy();
        expect(l1Section?.header).toBe('Header 1');
        expect(l1Section?.content.trim()).toBe('Content 1');

        // Check L2 header
        expect(l1Section?.subSections).toBeTruthy();
        expect(l1Section?.subSections?.length).toBe(1);
        const l2Section = l1Section?.subSections?.[0];
        expect(l2Section?.header).toBe('Subheader 1');
        expect(l2Section?.content.trim()).toBe('Subcontent 1');
    });

    it('should handle file without pre-header content', async () => {
        const mockContent = `# Header 1
Content 1

## Subheader 1
Subcontent 1`;

        const mockFile = new MockTFile(mockContent);
        mockGetAbstractFileByPath.mockReturnValue(mockFile);
        mockRead.mockResolvedValue(mockContent);

        const sections = await getHeaderSections(mockApp, 'test.md');
        console.log('Mock file content:', mockContent);
        console.log('Parsed sections:', sections);

        expect(sections.length).toBe(1);
        expect(sections.find(s => s.isPreHeaderContent)).toBeFalsy();

        // Check L1 header
        const l1Section = sections.find(s => s.level === 1);
        expect(l1Section).toBeTruthy();
        expect(l1Section?.header).toBe('Header 1');
        expect(l1Section?.content.trim()).toBe('Content 1');

        // Check L2 header
        expect(l1Section?.subSections).toBeTruthy();
        expect(l1Section?.subSections?.length).toBe(1);
        const l2Section = l1Section?.subSections?.[0];
        expect(l2Section?.header).toBe('Subheader 1');
        expect(l2Section?.content.trim()).toBe('Subcontent 1');
    });

    it('should handle file with only frontmatter', async () => {
        const mockContent = `---
tags: tag1, tag2
---`;

        const mockFile = new MockTFile(mockContent);
        mockGetAbstractFileByPath.mockReturnValue(mockFile);
        mockRead.mockResolvedValue(mockContent);

        const sections = await getHeaderSections(mockApp, 'test.md');
        console.log('Mock file content:', mockContent);
        console.log('Parsed sections:', sections);

        expect(sections.length).toBe(1);
        const preHeader = sections.find(s => s.isPreHeaderContent);
        expect(preHeader).toBeTruthy();
        expect(preHeader?.preHeaderContent?.frontmatter).toContainEqual({
            name: 'tags',
            value: ['tag1', 'tag2'],
            format: 'array'
        });
    });

    it('should handle file with only inline properties', async () => {
        const mockContent = `prop1:: value1
prop2:: value2`;

        const mockFile = new MockTFile(mockContent);
        mockGetAbstractFileByPath.mockReturnValue(mockFile);
        mockRead.mockResolvedValue(mockContent);

        const sections = await getHeaderSections(mockApp, 'test.md');
        console.log('Mock file content:', mockContent);
        console.log('Parsed sections:', sections);

        expect(sections.length).toBe(1);
        const preHeader = sections.find(s => s.isPreHeaderContent);
        expect(preHeader).toBeTruthy();
        expect(preHeader?.preHeaderContent?.inlineProperties).toHaveLength(2);
        expect(preHeader?.preHeaderContent?.inlineProperties).toContainEqual({
            name: 'prop1',
            value: 'value1'
        });
        expect(preHeader?.preHeaderContent?.inlineProperties).toContainEqual({
            name: 'prop2',
            value: 'value2'
        });
    });
});

describe('updateFileWithTemplate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should merge pre-header content from template and target', async () => {
        const templateContent = `---
tags: [tag1, tag2]
category: template
---
prop1:: template-value1

# Header 1
Template content 1

## Subheader 1
Template subcontent 1`;

        const targetContent = `---
tags: [tag2, tag3]
status: active
---
prop1:: target-value1
prop2:: target-value2

# Header 1
Target content 1

## Subheader 1
Target subcontent 1

## Subheader 2
Target subcontent 2`;

        const expectedContent = `---
tags: [tag1, tag2, tag3]
category: template
status: active
---
prop1:: target-value1
prop2:: target-value2

# Header 1
Target content 1

## Subheader 1
Target subcontent 1

## Subheader 2
Target subcontent 2`;

        const mockTemplateFile = new MockTFile(templateContent);
        const mockTargetFile = new MockTFile(targetContent);

        mockGetAbstractFileByPath
            .mockImplementation((path: string) => {
                if (path === 'template.md') return mockTemplateFile;
                if (path === 'target.md') return mockTargetFile;
                return null;
            });

        mockRead
            .mockImplementation((file: TFile) => {
                if (file === mockTemplateFile) return Promise.resolve(templateContent);
                if (file === mockTargetFile) return Promise.resolve(targetContent);
                return Promise.reject(new Error('File not found'));
            });

        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        expect(mockModify).toHaveBeenCalledWith(
            mockTargetFile,
            expectedContent
        );
    });

    it('should preserve target content when no matching sections in template', async () => {
        const templateContent = `---
tags: [tag1]
---
# Template Header
Template content`;

        const targetContent = `---
tags: [tag2]
---
# Target Header
Target content`;

        const expectedContent = `---
tags: [tag1, tag2]
---
# Template Header
Template content

# Target Header
Target content`;

        const mockTemplateFile = new MockTFile(templateContent);
        const mockTargetFile = new MockTFile(targetContent);

        mockGetAbstractFileByPath
            .mockImplementation((path: string) => {
                if (path === 'template.md') return mockTemplateFile;
                if (path === 'target.md') return mockTargetFile;
                return null;
            });

        mockRead
            .mockImplementation((file: TFile) => {
                if (file === mockTemplateFile) return Promise.resolve(templateContent);
                if (file === mockTargetFile) return Promise.resolve(targetContent);
                return Promise.reject(new Error('File not found'));
            });

        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        expect(mockModify).toHaveBeenCalledWith(
            mockTargetFile,
            expectedContent
        );
    });

    it('should handle empty target file', async () => {
        const templateContent = `---
tags: [tag1]
---
# Template Header
Template content`;

        const targetContent = '';

        const expectedContent = `---
tags: [tag1]
---
# Template Header
Template content`;

        const mockTemplateFile = new MockTFile(templateContent);
        const mockTargetFile = new MockTFile(targetContent);

        mockGetAbstractFileByPath
            .mockImplementation((path: string) => {
                if (path === 'template.md') return mockTemplateFile;
                if (path === 'target.md') return mockTargetFile;
                return null;
            });

        mockRead
            .mockImplementation((file: TFile) => {
                if (file === mockTemplateFile) return Promise.resolve(templateContent);
                if (file === mockTargetFile) return Promise.resolve(targetContent);
                return Promise.reject(new Error('File not found'));
            });

        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        expect(mockModify).toHaveBeenCalledWith(
            mockTargetFile,
            expectedContent
        );
    });
});

describe('REQ1020: Frontmatter Tag Preservation', () => {
    // Mock the necessary functions and setup
    const mockGetAbstractFileByPath = jest.fn();
    const mockRead = jest.fn();
    const mockModify = jest.fn();

    const mockApp = {
        vault: {
            getAbstractFileByPath: mockGetAbstractFileByPath,
            read: mockRead,
            modify: mockModify,
        }
    } as unknown as App;

    beforeEach(() => {
        jest.clearAllMocks();
        // Set up default mock behavior
        mockGetAbstractFileByPath.mockImplementation((path: string) => {
            return new MockTFile(path === 'template.md' ? templateContent : targetContent);
        });
        mockRead.mockImplementation((file: TFile) => {
            return Promise.resolve(file instanceof MockTFile ? file.content : '');
        });
        mockModify.mockResolvedValue(undefined);
    });

    const templateContent = `---
Manufacturer: pending
Class: .
Type:
status: template
tags: [template, test, base-template]
metadata:
  version: 1.0
  author: template-creator
  category: test-templates
empty_tag1:
empty_tag2:
priority: high
last_modified: 2024-12-29T15:51:30-05:00
---
InlineTag1BeforeHeader::  Value of InlineTag1BeforeHeader from Template`;

    const targetContent = `---
CustomManufacturer: This is the Custom Manufacturer
estado: Jalisco
status: draft
tags: [note, custom, target-specific]
metadata:
  version: 2.0
  author: note-creator
  category: test-notes
empty_tag1: 
empty_tag3:
priority: low
last_modified: 2024-12-29T15:51:30-05:00
custom_nested:
  field1: value1
  field2:
  field3: value3
---
CustomInlineTag:: Value of the customInlineTag`;

    test('REQ1020.1: preserve-all-tags', async () => {
        // Act
        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        // Assert
        const modifyCallArg = mockModify.mock.calls[0][1];
        const expectedTags = [
            'Manufacturer', 'Class', 'Type', 'status', 'tags', 'metadata',
            'empty_tag1', 'empty_tag2', 'priority', 'last_modified',
            'CustomManufacturer', 'estado', 'empty_tag3', 'custom_nested'
        ];

        expectedTags.forEach(tag => {
            expect(modifyCallArg).toContain(tag);
        });
    });

    test('REQ1020.2: preserve-nested-structures', async () => {
        // Act
        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        // Assert
        const modifyCallArg = mockModify.mock.calls[0][1];
        expect(modifyCallArg).toContain('metadata:');
        expect(modifyCallArg).toContain('version: 2.0'); // Target version should be preserved
        expect(modifyCallArg).toContain('author: note-creator'); // Target author should be preserved
        expect(modifyCallArg).toContain('category: test-notes'); // Target category should be preserved
        expect(modifyCallArg).toContain('custom_nested:');
        expect(modifyCallArg).toContain('field1: value1');
        expect(modifyCallArg).toContain('field2:');
        expect(modifyCallArg).toContain('field3: value3');
    });

    test('REQ1020.3: preserve-array-tags', async () => {
        // Act
        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        // Assert
        const modifyCallArg = mockModify.mock.calls[0][1];
        const expectedArrayValues = ['note', 'custom', 'target-specific'];
        expectedArrayValues.forEach(value => {
            expect(modifyCallArg).toContain(value);
        });
    });

    test('REQ1020.4: preserve-empty-tags', async () => {
        // Act
        await updateFileWithTemplate(mockApp, 'template.md', 'target.md');

        // Assert
        const modifyCallArg = mockModify.mock.calls[0][1];
        expect(modifyCallArg).toMatch(/empty_tag1:\s/);
        expect(modifyCallArg).toMatch(/empty_tag2:\s/);
        expect(modifyCallArg).toMatch(/empty_tag3:\s/);
        expect(modifyCallArg).toMatch(/field2:\s/);
    });
});
