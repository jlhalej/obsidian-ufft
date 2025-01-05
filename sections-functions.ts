// Interfaces for Pre-Header Content parsing
import { App, TFile } from 'obsidian';

// Base interface for common properties
export interface BaseSection {
    content: string;
    position: number;
}

// Interface for pre-header sections
export interface PreHeaderSection extends BaseSection {
    type: 'pre-header';
    header: '';
    preHeaderContent: PreHeaderContent;
}

// Interface for L1 header sections
export interface L1HeaderSection extends BaseSection {
    type: 'l1';
    header: string;
    subSections: L2HeaderSection[];
}

// Interface for L2 header sections
export interface L2HeaderSection extends BaseSection {
    type: 'l2';
    header: string;
}

// Union type for all section types
export type ContentSection = PreHeaderSection | L1HeaderSection | L2HeaderSection;

export interface FrontmatterTag {
    name: string;
    value: string | string[];
    format: 'single' | 'list' | 'array';
}

export interface InlineProperty {
    name: string;
    value: string;
}

export interface PreHeaderContent {
    frontmatter: FrontmatterTag[];
    inlineProperties: InlineProperty[];
    remainingText: string;
}

function debug(...args: any[]) {
    console.log('[UFFT]', ...args);
}

/**
 * Parses frontmatter content from a string
 * @param content - The content string between --- markers
 * @returns Array of FrontmatterTag objects
 */
export function parseFrontmatter(content: string): FrontmatterTag[] {
    debug('Parsing frontmatter:', content);
    const tags: FrontmatterTag[] = [];
    const lines = content.split('\n');
    let currentArrayTag: FrontmatterTag | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line === '---') continue;

        debug('Processing line:', line);
        
        // Calculate indentation level
        const indent = lines[i].search(/\S/);

        // If we're currently processing an array and this line is indented
        if (currentArrayTag && indent > 0) {
            // Handle array item (remove leading dash and any trailing colon)
            if (line.startsWith('-')) {
                let value = line.slice(1).trim();
                if (value === '') {
                    // Empty array item
                    if (Array.isArray(currentArrayTag.value)) {
                        currentArrayTag.value.push('');
                    }
                } else {
                    // Non-empty array item
                    value = value.replace(/:$/, '').trim();
                    if (Array.isArray(currentArrayTag.value)) {
                        currentArrayTag.value.push(value);
                    }
                }
            }
            continue;
        }

        // Reset currentArrayTag if we're back to root level
        if (indent === 0) {
            currentArrayTag = null;
        }

        // Handle normal key-value pairs
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const name = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();

        // Create tag object
        const tag: FrontmatterTag = {
            name,
            value: [],
            format: 'single'
        };

        // Handle empty tags
        if (!value) {
            tag.format = 'list';
            tag.value = [];
            currentArrayTag = tag;
            tags.push(tag);
            continue;
        }

        // Handle array format [tag1, tag2, tag3]
        if (value.startsWith('[') && value.endsWith(']')) {
            tag.value = value.slice(1, -1).split(',').map(t => t.trim());
            tag.format = 'array';
            tags.push(tag);
            continue;
        }

        // Handle multi-line array
        if (value === '') {
            tag.format = 'list';
            tag.value = [];
            currentArrayTag = tag;
            tags.push(tag);
        } else {
            // Handle single value
            tag.value = value;
            tag.format = 'single';
            tags.push(tag);
        }
    }

    return tags;
}

/**
 * Parses inline properties from content
 * @param content - The content string
 * @returns Array of InlineProperty objects and remaining text
 */
export function parseInlineProperties(content: string): { properties: InlineProperty[], remainingText: string } {
    const properties: InlineProperty[] = [];
    let remainingText = content;

    // Match inline properties in the format [key:: value]
    const regex = /\[([^\]]+?)::([^\]]*?)\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [fullMatch, name, value] = match;
        properties.push({
            name: name.trim(),
            value: value.trim()
        });

        // Remove the matched property from remainingText
        remainingText = remainingText.replace(fullMatch, '');
    }

    return {
        properties,
        remainingText: remainingText.trim()
    };
}

/**
 * Parses pre-header content into structured format
 * @param content - The full pre-header content string
 * @returns PreHeaderContent object
 */
export function parsePreHeaderContent(content: string): PreHeaderContent {
    debug('Parsing pre-header content:', content);
    const result: PreHeaderContent = {
        frontmatter: [],
        inlineProperties: [],
        remainingText: ''
    };

    // Split content into frontmatter and remaining text
    const parts = content.split(/^---$/m);
    
    if (parts.length >= 3) {
        // Has frontmatter
        const frontmatterContent = parts[1].trim();
        result.frontmatter = parseFrontmatter(frontmatterContent);
        
        // Join remaining parts and parse inline properties
        const remainingContent = parts.slice(2).join('---').trim();
        const { properties, remainingText } = parseInlineProperties(remainingContent);
        result.inlineProperties = properties;
        result.remainingText = remainingText;
    } else {
        // No frontmatter, just parse inline properties
        const { properties, remainingText } = parseInlineProperties(content);
        result.inlineProperties = properties;
        result.remainingText = remainingText;
    }

    debug('Parsed result:', result);
    return result;
}

/**
 * Finds duplicate headers in a list of sections
 * @param sections List of sections to check
 * @returns Map of header to array of sections with that header
 */
export function findDuplicateHeaders(sections: ContentSection[]): { [key: string]: ContentSection[] } {
    const headerMap: { [key: string]: ContentSection[] } = {};
    
    sections.forEach(section => {
        if (section.type === 'l1' || section.type === 'l2') {
            if (!headerMap[section.header]) {
                headerMap[section.header] = [];
            }
            headerMap[section.header].push(section);
        }
    });

    // Filter out headers that don't have duplicates
    return Object.fromEntries(
        Object.entries(headerMap).filter(([_, sections]) => sections.length > 1)
    );
}

/**
 * Combines multiple sections with the same header into one
 * @param sections List of sections to combine
 * @returns Combined section
 */
export function combineHeaderSections(sections: L1HeaderSection[]): L1HeaderSection {
    const combinedContent = sections.map(s => s.content).join('\n\n');
    return {
        type: 'l1',
        header: sections[0].header,
        content: combinedContent,
        position: sections[0].position,
        subSections: sections[0].subSections
    };
}

/**
 * Gets all sections from a file
 * @param app Obsidian app instance
 * @param filePath Path to file
 * @returns List of sections
 */
export async function getHeaderSections(app: App, filePath: string): Promise<ContentSection[]> {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        return [];
    }

    const content = await app.vault.read(file);
    const sections: ContentSection[] = [];
    let currentContent = '';
    let currentHeader = '';
    let currentLevel = 0;
    let currentL1Section: L1HeaderSection | null = null;
    let position = 0;

    // First, handle pre-header content (content before first header)
    const lines = content.split('\n');
    let preHeaderContent = '';
    let i = 0;

    // Collect all content until first header
    while (i < lines.length && !lines[i].match(/^#+\s/)) {
        preHeaderContent += lines[i] + '\n';
        i++;
    }

    // If there was pre-header content, create a pre-header section
    if (preHeaderContent.trim()) {
        const parsedPreHeader = parsePreHeaderContent(preHeaderContent.trim());
        sections.push({
            type: 'pre-header' as const,
            header: '',
            content: preHeaderContent.trim(),
            position: position++,
            preHeaderContent: parsedPreHeader
        });
    }

    // Process remaining lines
    for (; i < lines.length; i++) {
        const line = lines[i];
        const headerMatch = line.match(/^#+\s/);
        
        if (headerMatch) {  // Check if we found a header
            // Count number of # to determine header level
            const levelMatch = line.match(/^#+/);
            const level = levelMatch ? levelMatch[0].length : 0;
            const header = line.replace(/^#+\s*/, '').trim();

            // If we have accumulated content, save it to the current section
            if (currentHeader) {
                const trimmedContent = currentContent.trim();
                if (currentLevel === 1) {
                    if (currentL1Section) {
                        currentL1Section.content = trimmedContent;
                        sections.push(currentL1Section);
                    }
                } else if (currentLevel === 2 && currentL1Section) {
                    currentL1Section.subSections.push({
                        type: 'l2',
                        header: currentHeader,
                        content: trimmedContent,
                        position: currentL1Section.subSections.length
                    });
                }
            }

            // Reset for new section
            currentContent = '';
            currentHeader = header;
            currentLevel = level;

            // Create new L1 section if needed
            if (level === 1) {
                currentL1Section = {
                    type: 'l1',
                    header,
                    content: '',
                    position: position++,
                    subSections: []
                };
            }
        } else {
            currentContent += line + '\n';
        }
    }

    // Handle last section
    if (currentHeader) {
        const trimmedContent = currentContent.trim();
        if (currentLevel === 1) {
            if (currentL1Section) {
                currentL1Section.content = trimmedContent;
                sections.push(currentL1Section);
            }
        } else if (currentLevel === 2 && currentL1Section) {
            currentL1Section.subSections.push({
                type: 'l2',
                header: currentHeader,
                content: trimmedContent,
                position: currentL1Section.subSections.length
            });
        }
    }

    return sections;
}

/**
 * Merges pre-header content from template and target files
 * @param templatePreHeader Template pre-header content
 * @param targetPreHeader Target pre-header content
 * @returns Merged pre-header content
 */
export function mergePreHeaderContent(templatePreHeader: PreHeaderContent | undefined, targetPreHeader: PreHeaderContent | undefined): PreHeaderContent {
    const result: PreHeaderContent = {
        frontmatter: [],
        inlineProperties: [],
        remainingText: ''
    };

    // If no template pre-header, use target if it exists
    if (!templatePreHeader) {
        return targetPreHeader || result;
    }

    // If no target pre-header, use template
    if (!targetPreHeader) {
        return templatePreHeader;
    }

    // Create a map of all tags from both sources
    const allTags = new Map<string, FrontmatterTag>();

    // First add template tags
    templatePreHeader.frontmatter.forEach(tag => {
        allTags.set(tag.name, { ...tag });
    });

    // Then add/override with target tags
    targetPreHeader.frontmatter.forEach(tag => {
        if (!allTags.has(tag.name)) {
            // If tag doesn't exist in template, add it
            allTags.set(tag.name, { ...tag });
        } else {
            // If tag exists in template, use target's value and format
            const existingTag = allTags.get(tag.name)!;
            existingTag.value = tag.value;
            existingTag.format = tag.format;
        }
    });

    // Convert map back to array while preserving order
    const templateOrder = new Set(templatePreHeader.frontmatter.map(t => t.name));
    const targetOrder = new Set(targetPreHeader.frontmatter.map(t => t.name));
    
    // Add template tags first
    templateOrder.forEach(name => {
        const tag = allTags.get(name);
        if (tag) {
            result.frontmatter.push(tag);
            allTags.delete(name);
        }
    });

    // Then add remaining target tags
    targetOrder.forEach(name => {
        const tag = allTags.get(name);
        if (tag) {
            result.frontmatter.push(tag);
            allTags.delete(name);
        }
    });

    // Process inline properties similarly
    const allProps = new Map<string, InlineProperty>();

    // First add template properties
    templatePreHeader.inlineProperties.forEach(prop => {
        allProps.set(prop.name, { ...prop });
    });

    // Then add/override with target properties
    targetPreHeader.inlineProperties.forEach(prop => {
        allProps.set(prop.name, { ...prop });
    });

    // Convert map back to array while preserving order
    result.inlineProperties = Array.from(allProps.values());

    // Use target's remaining text if it exists, otherwise use template's
    result.remainingText = targetPreHeader.remainingText.trim() || templatePreHeader.remainingText.trim();

    return result;
}
