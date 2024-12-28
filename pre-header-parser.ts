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

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line === '---') continue;

        debug('Processing line:', line);
        // Check for key-value format
        const [name, ...valueParts] = line.split(':').map(part => part.trim());
        const valueStr = valueParts.join(':').trim();

        // Skip if no valid key-value pair
        if (!name || !valueStr) {
            debug('Found potential list header:', name);
            // Handle list format with dashes on next lines
            const listItems: string[] = [];
            while (i + 1 < lines.length && lines[i + 1].trim().startsWith('-')) {
                i++;
                const item = lines[i].trim().slice(1).trim();
                debug('Found list item:', item);
                if (item) listItems.push(item);
            }
            if (listItems.length > 0) {
                debug('Adding list format tag:', { name, items: listItems });
                tags.push({
                    name,
                    value: listItems,
                    format: 'list'
                });
            }
            continue;
        }

        // Handle array format [tag1, tag2, tag3]
        if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
            tags.push({
                name,
                value: valueStr.slice(1, -1).split(',').map(tag => tag.trim()),
                format: 'array'
            });
            continue;
        }

        // Handle single line, comma-separated format
        tags.push({
            name,
            value: valueStr.split(',').map(tag => tag.trim()),
            format: 'single'
        });
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
