import { TAbstractFile, TFolder, TFile, App, Notice } from 'obsidian';
import { TextInputSuggest } from 'suggest';
import UFFT from './main';

let DEBUG = false;

// Helper function to log debug messages
function debug(...args: any[]) {
    const plugin = (window as any).UFFT;
    if (plugin?.DEBUG) {
        console.log(...args);
    }
}

// Add the interfaces needed for the settings
interface TemplateFolderStruct {
    Template: string;
    Folder: string;
    IncludeSubFolders: boolean;
}

interface HeaderSection {
    header: string;
    content: string;
    position: number;
    isPreHeaderContent?: boolean;
    level?: number;  // 1 for L1, 2 for L2, undefined for pre-header
    subSections?: HeaderSection[];  // For L2 headers under this L1
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

export function getLevel1Headers(app: App, templatePath: string): string[] {
    const headers: string[] = [];
    const file = app.vault.getAbstractFileByPath(templatePath);

    if (!(file instanceof TFile)) {
        console.error(`Template file not found: ${templatePath}`);
        return headers;
    }

    return headers;
}

function findDuplicateHeaders(sections: HeaderSection[]): { [key: string]: HeaderSection[] } {
    const headerMap: { [key: string]: HeaderSection[] } = {};

    sections.forEach(section => {
        if (!headerMap[section.header]) {
            headerMap[section.header] = [];
        }
        headerMap[section.header].push(section);
    });

    return Object.fromEntries(
        Object.entries(headerMap).filter(([_, sections]) => sections.length > 1)
    );
}

function combineHeaderSections(sections: HeaderSection[]): HeaderSection {
    const combinedContent = sections.map(s => s.content).join('\n\n');
    return {
        header: sections[0].header,
        content: combinedContent,
        position: sections[0].position,
        level: sections[0].level,
        subSections: sections[0].subSections
    };
}

export async function getHeaderSections(app: App, filePath: string): Promise<HeaderSection[]> {
    debug(`\t\tReading sections from: ${filePath}`);
    const file = app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
        debug(`\t\t\tFile not found: ${filePath}`);
        return [];
    }

    const content = await app.vault.read(file);
    const lines = content.split('\n');
    const sections: HeaderSection[] = [];

    // Check for content before first header
    const preHeaderLines = [];
    let i = 0;
    while (i < lines.length && !lines[i].startsWith('# ')) {
        if (lines[i].trim() !== '') {
            preHeaderLines.push(lines[i]);
        }
        i++;
    }

    if (preHeaderLines.length > 0) {
        debug(`\t\t\tFound pre-header content`);
        sections.unshift({
            header: '',
            content: preHeaderLines.join('\n').trim(),
            position: 0,
            isPreHeaderContent: true
        });
    }

    let currentL1Header = '';
    let currentL2Header = '';
    let currentL1Content: string[] = [];
    let currentL2Content: string[] = [];
    let currentL1Section: HeaderSection | null = null;

    const saveL2Section = () => {
        if (currentL2Header && currentL1Section) {
            if (!currentL1Section.subSections) {
                currentL1Section.subSections = [];
            }
            currentL1Section.subSections.push({
                header: currentL2Header,
                content: currentL2Content.filter(l => l.trim() !== '').join('\n').trim(),
                position: currentL1Section.subSections.length,
                level: 2
            });
            currentL2Header = '';
            currentL2Content = [];
        }
    };

    const saveL1Section = () => {
        if (currentL1Section) {
            // Save any pending L2 section first
            saveL2Section();
            
            // Save L1 content if there is any
            if (currentL1Content.length > 0) {
                currentL1Section.content = currentL1Content.filter(l => l.trim() !== '').join('\n').trim();
            }
            
            sections.push(currentL1Section);
            currentL1Content = [];
        }
    };

    for (; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('# ')) {  // L1 header
            // Save previous sections
            saveL1Section();

            // Start new L1 section
            currentL1Header = line.substring(2).trim();
            currentL1Section = {
                header: currentL1Header,
                content: '',
                position: i,
                level: 1,
                subSections: []
            };

        } else if (line.startsWith('## ')) {  // L2 header
            // Save previous L2 section if exists
            saveL2Section();

            // Start new L2 section
            currentL2Header = line.substring(3).trim();

        } else {
            // Add content to appropriate level
            if (currentL2Header) {
                currentL2Content.push(line);
            } else if (currentL1Header) {
                currentL1Content.push(line);
            }
        }
    }

    // Save final sections
    saveL1Section();

    return sections;
}

export async function updateFileWithTemplate(app: App, templatePath: string, targetPath: string): Promise<void> {
    debug(`\n=== Starting updateFileWithTemplate ===`);
    debug(`\tTemplate: ${templatePath}`);
    debug(`\tTarget: ${targetPath}`);
    
    try {
        // Get sections from both files
        debug(`\tReading template file...`);
        const templateInMemory = await getHeaderSections(app, templatePath);
        debug(`\tReading target file...`);
        let targetInMemory = await getHeaderSections(app, targetPath);
        const stagingInMemory: HeaderSection[] = [];

        // Handle pre-header content first
        const preHeaderContent = targetInMemory.find(s => s.isPreHeaderContent);
        if (preHeaderContent) {
            debug(`\t\tCopying pre-header content to staging`);
            stagingInMemory.push(preHeaderContent);
            targetInMemory = targetInMemory.filter(s => !s.isPreHeaderContent);
        }

        // Process L1 headers from template in order
        debug(`\tProcessing template headers in order...`);
        for (const templateL1Section of templateInMemory) {
            if (templateL1Section.isPreHeaderContent) continue;

            debug(`\t\tProcessing L1 header: "${templateL1Section.header}"`);
            // Find matching L1 header in target
            const matchingL1Sections = targetInMemory.filter(s => s.header === templateL1Section.header);
            
            if (matchingL1Sections.length > 0) {
                debug(`\t\t\tFound ${matchingL1Sections.length} matching L1 section(s) in target`);
                
                const stagingL1Section: HeaderSection = {
                    header: templateL1Section.header,
                    content: matchingL1Sections[0].content || '',  // Keep any direct L1 content
                    position: stagingInMemory.length,
                    level: 1,
                    subSections: []  // Initialize empty array
                };

                // Process L2 headers from template in order
                if (templateL1Section.subSections && templateL1Section.subSections.length > 0) {
                    debug(`\t\t\tProcessing ${templateL1Section.subSections.length} L2 headers from template`);
                    for (const templateL2Section of templateL1Section.subSections) {
                        debug(`\t\t\t\tProcessing L2 header: "${templateL2Section.header}"`);
                        
                        // Find ALL matching L2 headers in target's matching L1 section
                        const matchingL2Sections = matchingL1Sections[0].subSections?.filter(
                            s => s.header === templateL2Section.header
                        ) || [];
                        
                        if (matchingL2Sections.length > 0) {
                            debug(`\t\t\t\t\tFound ${matchingL2Sections.length} matching L2 section(s) in target`);
                            // Combine content from all matching L2 sections
                            const combinedContent = matchingL2Sections
                                .map(section => section.content.trim())
                                .filter(content => content !== '')
                                .join('\n');
                            
                            if (!stagingL1Section.subSections) {
                                stagingL1Section.subSections = [];
                            }
                            stagingL1Section.subSections.push({
                                header: templateL2Section.header,
                                content: combinedContent,
                                position: stagingL1Section.subSections.length,
                                level: 2
                            });
                        } else {
                            debug(`\t\t\t\t\tNo matching L2 section found, using template content`);
                            // Use content from template's L2
                            if (!stagingL1Section.subSections) {
                                stagingL1Section.subSections = [];
                            }
                            stagingL1Section.subSections.push({
                                header: templateL2Section.header,
                                content: templateL2Section.content.trim(),
                                position: stagingL1Section.subSections.length,
                                level: 2
                            });
                        }
                    }

                    // Add remaining L2 headers from target that weren't in template
                    const remainingL2Sections = matchingL1Sections[0].subSections?.filter(
                        targetL2 => !templateL1Section.subSections?.some(
                            templateL2 => templateL2.header === targetL2.header
                        )
                    ) || [];

                    if (remainingL2Sections.length > 0) {
                        debug(`\t\t\t\tAdding ${remainingL2Sections.length} remaining L2 headers from target`);
                        for (const remainingL2 of remainingL2Sections) {
                            if (!stagingL1Section.subSections) {
                                stagingL1Section.subSections = [];
                            }
                            stagingL1Section.subSections.push({
                                header: remainingL2.header,
                                content: remainingL2.content.trim(),
                                position: stagingL1Section.subSections.length,
                                level: 2
                            });
                        }
                    }
                }
                
                stagingInMemory.push(stagingL1Section);
                
                // Remove processed L1 section from targetInMemory
                targetInMemory = targetInMemory.filter(s => s.header !== templateL1Section.header);
                
            } else {
                debug(`\t\t\tNo matching L1 section found, using template content`);
                // No matching L1 header, use template content including all L2 headers
                const stagingL1Section: HeaderSection = {
                    header: templateL1Section.header,
                    content: templateL1Section.content.trim(),
                    position: stagingInMemory.length,
                    level: 1,
                    subSections: []  // Initialize empty array
                };

                // Copy L2 sections from template
                if (templateL1Section.subSections && templateL1Section.subSections.length > 0) {
                    stagingL1Section.subSections = templateL1Section.subSections.map(s => ({
                        header: s.header,
                        content: s.content.trim(),
                        position: stagingL1Section.subSections?.length || 0,
                        level: 2
                    }));
                }

                stagingInMemory.push(stagingL1Section);
            }
        }

        // Add remaining L1 headers from target that weren't in template
        if (targetInMemory.length > 0) {
            debug(`\tAdding ${targetInMemory.length} remaining L1 headers from target`);
            targetInMemory.forEach(section => {
                debug(`\t\tAdding remaining L1 header: "${section.header}"`);
                const stagingL1Section: HeaderSection = {
                    header: section.header,
                    content: section.content.trim(),
                    position: stagingInMemory.length,
                    level: 1,
                    subSections: []  // Initialize empty array
                };

                // Copy L2 sections if they exist
                if (section.subSections && section.subSections.length > 0) {
                    stagingL1Section.subSections = section.subSections.map(s => ({
                        header: s.header,
                        content: s.content.trim(),
                        position: stagingL1Section.subSections?.length || 0,
                        level: 2
                    }));
                }

                stagingInMemory.push(stagingL1Section);
            });
        }

        // Convert staging to final content
        debug(`\tGenerating final content...`);
        const finalContent = stagingInMemory
            .map(section => {
                if (section.isPreHeaderContent) {
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
                if (section.subSections && section.subSections.length > 0) {
                    const l2Content = section.subSections
                        .map(subSection => {
                            if (subSection.content && subSection.content.trim()) {
                                return `## ${subSection.header}\n${subSection.content.trim()}`;
                            }
                            return `## ${subSection.header}`;
                        })
                        .join('\n');
                    parts.push(l2Content);
                }
                
                return parts.join('\n');
            })
            .filter(content => content.trim() !== '')
            .join('\n');

        // Write back to file
        debug(`\tWriting to target file...`);
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
            new Notice(`Skipped ${targetPath} from ${templatePath}`);
            debug(`\t- No changes needed`);
        }
        
        debug(`=== Finished updateFileWithTemplate ===\n`);

    } catch (error) {
        console.error(`\t✗ Error in updateFileWithTemplate:`, error);
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

    // Get level 1 headers from the template file
    const templateHeaders = getLevel1Headers(app, template);

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
