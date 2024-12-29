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
