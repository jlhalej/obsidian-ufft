import { TAbstractFile, TFolder, TFile, App, Notice } from 'obsidian';
import { TextInputSuggest } from 'suggest';
import { 
    parsePreHeaderContent, 
    PreHeaderContent, 
    FrontmatterTag, 
    InlineProperty,
    ContentSection,
    L1HeaderSection,
    L2HeaderSection,
    PreHeaderSection,
    findDuplicateHeaders,
    combineHeaderSections,
    getHeaderSections,
    mergePreHeaderContent
} from './sections-functions';

let DEBUG = false;

function debug(...args: any[]) {
    console.log('[File Operations]', ...args);
}

// Add the interfaces needed for the settings
export interface TemplateFolderStruct {
    Template: string;
    Folder: string;
    IncludeSubFolders: boolean;
}

export class FolderSuggest extends TextInputSuggest<TFolder> {
    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (folder instanceof TFolder) {
                if (folder.path.toLowerCase().contains(lowerCaseInputStr)) {
                    folders.push(folder);
                }
            }
        });

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement) {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder) {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

export class FileSuggest extends TextInputSuggest<TAbstractFile> {
    getSuggestions(inputStr: string): TAbstractFile[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const files: TAbstractFile[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((file: TAbstractFile) => {
            if (file instanceof TFile) {
                if (file.path.toLowerCase().contains(lowerCaseInputStr)) {
                    files.push(file);
                }
            }
        });

        return files;
    }

    renderSuggestion(file: TAbstractFile, el: HTMLElement) {
        el.setText(file.path);
    }

    selectSuggestion(file: TAbstractFile) {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

export function getFilesInFolder(app: App, folderPath: string, includeSubFolders: boolean): TFile[] {
    const files: TFile[] = [];
    const folder = app.vault.getAbstractFileByPath(folderPath);

    if (!(folder instanceof TFolder)) {
        console.error(`Folder not found: ${folderPath}`);
        return files;
    }

    function processFolder(folder: TFolder) {
        for (const child of folder.children) {
            if (child instanceof TFile) {
                files.push(child);
            } else if (includeSubFolders && child instanceof TFolder) {
                processFolder(child);
            }
        }
    }

    processFolder(folder);
    return files;
}

export async function updateFileWithTemplate(app: App, templatePath: string, targetPath: string): Promise<void> {
    debug(`\n=== Starting updateFileWithTemplate ===`);
    debug(`\tTemplate: ${templatePath}`);
    debug(`\tTarget: ${targetPath}`);
    
    try {
        // Get sections from both files
        debug(`\tReading template file...`);
        const templateSections = await getHeaderSections(app, templatePath);
        debug(`\tReading target file...`);
        let targetSections = await getHeaderSections(app, targetPath);
        const stagingSections: ContentSection[] = [];

        // Handle pre-header content first
        const templatePreHeader = templateSections.find(s => s.type === 'pre-header')?.preHeaderContent;
        const targetPreHeader = targetSections.find(s => s.type === 'pre-header')?.preHeaderContent;

        if (templatePreHeader || targetPreHeader) {
            debug(`\t\tMerging pre-header content`);
            const mergedPreHeader = mergePreHeaderContent(templatePreHeader, targetPreHeader);
            debug(`\t\tMerged pre-header:`, mergedPreHeader);

            // Convert merged pre-header back to text format
            let preHeaderText = '';

            // Add frontmatter if exists
            if (mergedPreHeader.frontmatter.length > 0) {
                preHeaderText += '---\n';
                for (const tag of mergedPreHeader.frontmatter) {
                    if (tag.format === 'list') {
                        preHeaderText += `${tag.name}:\n`;
                        const values = Array.isArray(tag.value) ? tag.value : [tag.value];
                        if (values.length === 0) {
                            // If array is empty, just add the key
                            preHeaderText += `${tag.name}:\n`;
                        } else {
                            // Add each value as a list item
                            for (const value of values) {
                                if (value.trim() === '') {
                                    preHeaderText += `-\n`;  // Empty item
                                } else {
                                    preHeaderText += `- ${value.trim()}\n`;  // Non-empty item
                                }
                            }
                        }
                    } else if (tag.format === 'array') {
                        const values = Array.isArray(tag.value) ? tag.value : [tag.value];
                        preHeaderText += `${tag.name}: [${values.join(', ')}]\n`;
                    } else {
                        const value = Array.isArray(tag.value) ? tag.value[0] : tag.value;
                        preHeaderText += `${tag.name}: ${value}\n`;
                    }
                }
                preHeaderText += '---\n';
            }

            // Add inline properties
            for (const prop of mergedPreHeader.inlineProperties) {
                preHeaderText += `${prop.name}:: ${prop.value}\n`;
            }

            // Add remaining text
            if (mergedPreHeader.remainingText) {
                preHeaderText += mergedPreHeader.remainingText + '\n';
            }

            stagingSections.push({
                type: 'pre-header',
                header: '',
                content: preHeaderText.trim(),
                position: 0,
                preHeaderContent: mergedPreHeader
            });
        }

        // Remove pre-header sections from both arrays
        let templateInMemory = templateSections.filter(s => s.type !== 'pre-header');
        targetSections = targetSections.filter(s => s.type !== 'pre-header');

        // Process L1 headers from template in order
        debug(`\tProcessing template headers in order...`);
        for (const templateL1Section of templateInMemory as L1HeaderSection[]) {
            debug(`\t\tProcessing L1 header: "${templateL1Section.header}"`);
            // Find ALL matching L1 headers in target
            const matchingL1Sections = targetSections.filter(s => s.type === 'l1' && s.header === templateL1Section.header) as L1HeaderSection[];
            
            if (matchingL1Sections.length > 0) {
                debug(`\t\t\tFound ${matchingL1Sections.length} matching L1 section(s) in target`);
                // Combine content from all matching L1 sections in target only
                const combinedL1Content = matchingL1Sections
                    .map(s => s.content.trim())
                    .filter(content => content !== '')
                    .join('\n');

                // If no content in target sections, use template content
                const finalContent = combinedL1Content || templateL1Section.content.trim();

                // Initialize stagingL1Section with subSections array
                const stagingL1Section: L1HeaderSection = {
                    type: 'l1',
                    header: templateL1Section.header,
                    content: finalContent,
                    position: stagingSections.length,
                    subSections: []
                };

                // Process L2 headers from template
                if (templateL1Section.subSections && templateL1Section.subSections.length > 0) {
                    debug(`\t\t\t\tProcessing ${templateL1Section.subSections.length} L2 headers from template`);
                    // Keep track of processed L2 headers and their parent L1s
                    const processedL2Headers = new Map<string, Set<string>>();
                    
                    for (const templateL2Section of templateL1Section.subSections) {
                        debug(`\t\t\t\t\tProcessing L2 header: "${templateL2Section.header}"`);
                        // Track this L2 header under current L1
                        if (!processedL2Headers.has(templateL1Section.header)) {
                            processedL2Headers.set(templateL1Section.header, new Set());
                        }
                        processedL2Headers.get(templateL1Section.header)?.add(templateL2Section.header);
                        
                        // Find matching L2 header in target
                        const matchingL2Sections = matchingL1Sections
                            .filter(s => s.subSections)
                            .flatMap(s => s.subSections)
                            .filter(s => s.header === templateL2Section.header);

                        if (matchingL2Sections.length > 0) {
                            debug(`\t\t\t\t\tFound ${matchingL2Sections.length} matching L2 section(s) in target`);
                            // Combine content from all matching L2 sections in target only
                            const combinedContent = matchingL2Sections
                                .map(s => s.content.trim())
                                .filter(content => content !== '')
                                .join('\n');

                            // If no content in target sections, use template content
                            const finalContent = combinedContent || templateL2Section.content.trim();
                            
                            if (!stagingL1Section.subSections) {
                                stagingL1Section.subSections = [];
                            }
                            
                            stagingL1Section.subSections.push({
                                type: 'l2',
                                header: templateL2Section.header,
                                content: finalContent,
                                position: stagingL1Section.subSections.length
                            });
                        } else {
                            debug(`\t\t\t\t\tNo matching L2 section found, using template content`);
                            // Use content from template's L2
                            if (!stagingL1Section.subSections) {
                                stagingL1Section.subSections = [];
                            }
                            
                            stagingL1Section.subSections.push({
                                type: 'l2',
                                header: templateL2Section.header,
                                content: templateL2Section.content.trim(),
                                position: stagingL1Section.subSections.length
                            });
                        }
                    }
                    
                    // Add remaining L2 headers from target that weren't in template
                    for (const l1Section of matchingL1Sections) {
                        if (!l1Section.subSections) continue;
                        
                        const l1Header = l1Section.header;
                        const processedHeaders = processedL2Headers.get(l1Header) || new Set();
                        
                        const remainingL2Sections = l1Section.subSections
                            .filter(s => !processedHeaders.has(s.header));
                        
                        if (remainingL2Sections.length > 0) {
                            debug(`\t\t\t\tAdding ${remainingL2Sections.length} remaining L2 headers from target under L1: "${l1Header}"`);
                            for (const l2Section of remainingL2Sections) {
                                if (!stagingL1Section.subSections) {
                                    stagingL1Section.subSections = [];
                                }
                                
                                stagingL1Section.subSections.push({
                                    type: 'l2',
                                    header: l2Section.header,
                                    content: l2Section.content.trim(),
                                    position: stagingL1Section.subSections.length
                                });
                            }
                        }
                    }
                }
                
                stagingSections.push(stagingL1Section);
                
                // Remove processed L1 section from targetSections
                targetSections = targetSections.filter(s => s.header !== templateL1Section.header);
                
            } else {
                debug(`\t\t\tNo matching L1 section found, using template content`);
                // Use content from template's L1
                const stagingL1Section: L1HeaderSection = {
                    type: 'l1',
                    header: templateL1Section.header,
                    content: templateL1Section.content.trim(),
                    position: stagingSections.length,
                    subSections: []
                };

                // Copy L2 sections from template
                if (templateL1Section.subSections && templateL1Section.subSections.length > 0) {
                    templateL1Section.subSections.forEach(s => {
                        if (!stagingL1Section.subSections) {
                            stagingL1Section.subSections = [];
                        }
                        
                        stagingL1Section.subSections.push({
                            type: 'l2',
                            header: s.header,
                            content: s.content.trim(),
                            position: stagingL1Section.subSections.length
                        });
                    });
                }

                stagingSections.push(stagingL1Section);
            }
        }

        // Add remaining L1 headers from target that weren't in template
        if (targetSections.length > 0) {
            debug(`\tAdding ${targetSections.length} remaining L1 headers from target`);
            targetSections.forEach(section => {
                debug(`\t\tAdding remaining L1 header: "${section.header}"`);
                // Initialize stagingL1Section with subSections array
                const stagingL1Section: L1HeaderSection = {
                    type: 'l1',
                    header: section.header,
                    content: section.content.trim(),
                    position: stagingSections.length,
                    subSections: []
                };

                // Add any L2 headers from the target section
                if (section.type === 'l1') {
                    section.subSections.forEach(l2 => {
                        stagingL1Section.subSections.push({
                            type: 'l2',
                            header: l2.header,
                            content: l2.content.trim(),
                            position: stagingL1Section.subSections.length
                        });
                    });
                }

                stagingSections.push(stagingL1Section);
            });
        }

        // Convert staging to final content
        debug(`\tGenerating final content...`);
        const finalContent = stagingSections
            .map(section => {
                if (section.type === 'pre-header') {
                    return section.content.trim();
                }
                
                const parts: string[] = [];
                
                // Add L1 header
                parts.push(`# ${section.header}`);
                
                // Add L1 content if exists
                if (section.content && section.content.trim()) {
                    parts.push(section.content.trim());
                }
                
                // Add L2 sections if they exist
                if (section.type === 'l1' && section.subSections) {
                    for (const l2Section of section.subSections) {
                        parts.push(`\n## ${l2Section.header}`);
                        if (l2Section.content && l2Section.content.trim()) {
                            parts.push(l2Section.content.trim());
                        }
                    }
                }
                
                return parts.join('\n');
            })
            .join('\n\n');

        // Write final content to target file
        debug(`\tWriting final content to target file...`);
        const targetFile = app.vault.getAbstractFileByPath(targetPath);
        if (!(targetFile instanceof TFile)) {
            throw new Error(`Target file not found: ${targetPath}`);
        }

        const currentContent = await app.vault.read(targetFile);
        if (currentContent !== finalContent) {
            await app.vault.modify(targetFile, finalContent);
            new Notice(`Updated ${targetPath} from ${templatePath}`);
            debug(`\t✓ Successfully updated file`);
        } else {
            new Notice(`No changes needed for ${targetPath}`);
            debug(`\t- File content unchanged`);
        }

        debug(`=== Finished updateFileWithTemplate ===\n`);
    } catch (error) {
        console.error('Error in updateFileWithTemplate:', error);
        new Notice(`Error updating file: ${error.message}`);
        throw error;
    }
}

export async function RunUpdate(app: App, template: string, folder: string, includeSubFolders: boolean): Promise<void> {
    debug(`\n\t=== Starting RunUpdate Method === Template: ${template}, Folder: ${folder}, IncludeSubFolders: ${includeSubFolders} ===`);

    // Get all files in the target folder (excluding the template)
    const allFiles = getFilesInFolder(app, folder, includeSubFolders);
    const files = allFiles.filter(file => file.path !== template);

    if (files.length === 0) {
        debug("\n\t\tNo files to process (excluding template)");
        debug(`\n\t=== FINISHED RunUpdate Method === Template: ${template}, Folder: ${folder}, IncludeSubFolders: ${includeSubFolders} ===`);
        return;
    }

    debug(`\n\t\tFound ${files.length} files to process:`, files.map(file => file.path));

    // Process each file
    for (const file of files) {
        debug(`\n\t\t Processing Note: ${file.path}`);
        try {
            await updateFileWithTemplate(app, template, file.path);
            debug(`✓ Successfully updated ${file.path}`);
        } catch (error) {
            console.error(`✗ Error updating ${file.path}:`, error);
        }
    }

    debug(`\n\t=== FINISHED RunUpdate Method === Template: ${template}, Folder: ${folder}, IncludeSubFolders: ${includeSubFolders} ===`);
}

export async function RunAllRules(app: App, templateFolderArray: TemplateFolderStruct[]): Promise<void> {
    debug(`\n=== Starting RunAllRules Method ===`);
    for (let i = 0; i < templateFolderArray.length; i++) {
        debug(`\n=== Launching RunUpdate Method === TemplateFolderArray index: ${i} ===`);
        const { Template, Folder, IncludeSubFolders } = templateFolderArray[i];
        await RunUpdate(app, Template, Folder, IncludeSubFolders);
    }
    debug(`\n=== FINISHED RunAllRules Method ===`);
}
