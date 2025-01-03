// Interfaces for Pre-Header Content parsing
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
    console.log('[Pre-Header Parser]', ...args);
}

/**
 * Parses frontmatter content from a string
 * @param content - The content string between --- markers
 * @returns Array of FrontmatterTag objects
 */
function parseFrontmatter(content: string): FrontmatterTag[] {
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
            continue;
        }

        // Handle single value
        tag.value = [value];
        tags.push(tag);
    }

    return tags;
}

/**
 * Parses inline properties from content
 * @param content - The content string
 * @returns Array of InlineProperty objects and remaining text
 */
function parseInlineProperties(content: string): { properties: InlineProperty[], remainingText: string } {
    const properties: InlineProperty[] = [];
    const lines = content.split('\n');
    const remainingLines: string[] = [];

    for (const line of lines) {
        const match = line.match(/^([^:]+)::(.*)$/);
        if (match) {
            properties.push({
                name: match[1].trim(),
                value: match[2].trim()
            });
        } else if (line.trim()) {
            remainingLines.push(line);
        }
    }

    return {
        properties,
        remainingText: remainingLines.join('\n')
    };
}

/**
 * Parses pre-header content into structured format
 * @param content - The full pre-header content string
 * @returns PreHeaderContent object
 */
export function parsePreHeaderContent(content: string): PreHeaderContent {
    const result: PreHeaderContent = {
        frontmatter: [],
        inlineProperties: [],
        remainingText: ''
    };

    if (!content.trim()) {
        return result;
    }

    // Split content into frontmatter and rest
    const parts = content.split('---').map(part => part.trim());
    
    if (parts.length >= 3) {
        // Has frontmatter
        result.frontmatter = parseFrontmatter(parts[1]);
        const restContent = parts.slice(2).join('---').trim();
        const inlineResult = parseInlineProperties(restContent);
        result.inlineProperties = inlineResult.properties;
        result.remainingText = inlineResult.remainingText;
    } else {
        // No frontmatter, just inline properties and text
        const inlineResult = parseInlineProperties(content);
        result.inlineProperties = inlineResult.properties;
        result.remainingText = inlineResult.remainingText;
    }

    debug('Parsed content:', { content, result });
    return result;
}
