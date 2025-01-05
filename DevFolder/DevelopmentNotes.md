This file contains development notes and is kept locally but not pushed to GitHub.

# 1. Requirements

## 1.1. File Update Process

### 1.1.1. Pre-Header Handling

| ReqNo | Status         | Desc                                                | Jest test name |
| ----- | -------------- | --------------------------------------------------- | -------------- |
| 1010  | master 87d74e8 | Target content has priority over template content   | |
| 1020  | master 87d74e8 | All frontmatter tags must be preserved from both files | `REQ1020`<br>Subtests:<br>- `REQ1020.1: preserve-all-tags`<br>- `REQ1020.2: preserve-nested-structures`<br>- `REQ1020.3: preserve-array-tags`<br>- `REQ1020.4: preserve-empty-tags` |
| 1030  | master 87d74e8 | All inline properties must be preserved from both files | |
| 1040  | master 87d74e8 | Remaining text from target is used if it exists, otherwise template text is used | |
| 1050  | partially implemented | Final pre-header should follow template's ordering where possible | |

### 1.1.2. L1 Headers Processing

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 2000  | pending review | When processing L1 headers |
| 2010  | pending review | Template L1 headers set the base structure |
| 2020  | pending review | Target L1 content has priority over template content |
| 2030  | pending review | All L1 headers from target that don't exist in template must be preserved |
| 2040  | pending review | L1 header order should follow template where possible |
| 2050  | pending review | Empty L1 sections should be preserved if they exist in target |

### 1.1.3. L2 Headers Processing

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 3000  | pending review | When processing L2 headers |
| 3010  | pending review | L2 headers must be processed within their parent L1 context |
| 3020  | pending review | Same L2 header can exist under different L1s |
| 3030  | pending review | Target L2 content has priority over template content |
| 3040  | pending review | All L2 headers from target that don't exist in template must be preserved |
| 3050  | pending review | L2 header order should follow template where possible |
| 3060  | pending review | Empty L2 sections should be preserved if they exist in target |

### 1.1.4. Content Preservation Rules

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 4000  | pending review | No content should be lost during merging |
| 4010  | pending review | All frontmatter tags must be preserved |
| 4020  | pending review | All inline properties must be preserved |
| 4030  | pending review | All L1 headers must be preserved |
| 4040  | pending review | All L2 headers must be preserved |
| 4050  | pending review | All section content must be preserved |
| 4100  | pending review | Content priority |
| 4110  | pending review | Target content always has priority when it exists |
| 4120  | pending review | Template content is only used to fill gaps |
| 4130  | pending review | No content should be discarded without being checked |

### 1.1.5. File Structure Constraints

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 5000  | pending review | Headers must maintain their hierarchy |
| 5010  | pending review | L1 headers start with single '#' |
| 5020  | pending review | L2 headers start with '##' |
| 5030  | pending review | Pre-header must be at the start of the file |
| 5040  | pending review | Frontmatter must be between '---' markers |
| 5050  | pending review | Inline properties must use '::' syntax |

## 1.2. Plugin Constraints

### 1.2.1. File Operations

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 6000  | pending review | Must handle files of any size |
| 6010  | pending review | Must preserve file encoding |
| 6020  | pending review | Must handle both Unix and Windows line endings |
| 6030  | pending review | Must not modify files outside the target path |

### 1.2.2. Error Handling

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 7000  | master 87d74e8 | Must validate template file exists |
| 7010  | master 87d74e8 | Must validate target file exists |

### 1.2.3. Performance Requirements

| ReqNo | Status         | Desc                                               |
| ----- | -------------- | -------------------------------------------------- |
| 8000  | pending review | File operations should be asynchronous |
| 8010  | pending review | Large files should be processed in chunks |
| 8020  | pending review | Memory usage should be optimized for large files |
| 8030  | pending review | Should provide progress feedback for long operations |

# 2. Next Development Steps

[Waiting for next development task...]

# 3. Implementation Notes

## 3.1. File Update Process

### 3.1.1. Process Flow

1. **File Loading and Parsing**
   - `getHeaderSections(app, filePath)` is called for both template and target files
   - Files are read line by line to identify sections
   - Pre-header content, L1 headers, and L2 headers are parsed into `HeaderSection` objects
   - Each `HeaderSection` contains:
     - header: The section header text
     - content: The section content
     - position: Original position in file
     - level: 1 for L1 headers, 2 for L2 headers, undefined for pre-header
     - subSections: Array of L2 HeaderSections (for L1 headers)
     - preHeaderContent: Structured pre-header content (for pre-header only)

2. **Pre-Header Processing**
   - Pre-header sections are identified by content before first L1 header
   - `parsePreHeaderContent()` extracts:
     - Frontmatter tags (between --- markers)
     - Inline properties (using :: syntax)
     - Remaining text
   - `mergePreHeaderContent()` combines template and target pre-headers:
     - Target tags override template tags with same name
     - All unique tags are preserved
     - Tag ordering follows template where possible
     - Empty tags and arrays are preserved

3. **L1 Header Processing**
   - Template L1 headers are processed in order
   - For each template L1 header:
     - Find all matching L1 sections in target
     - Combine content from all matching target sections
     - If no target content exists, use template content
     - Process L2 headers within the L1 context

4. **L2 Header Processing**
   - L2 headers are processed within their parent L1 context
   - For each template L2 header:
     - Find matching L2 headers in target under same L1
     - Use target content if exists, else template content
   - Additional target L2 headers are preserved
   - L2 header order follows template where possible

5. **Content Assembly**
   - Final document is assembled in order:
     1. Pre-header content (if exists)
     2. Template L1 headers with merged content
     3. Additional target L1 headers
   - Within each L1 section:
     1. L1 content
     2. Template L2 headers with merged content
     3. Additional target L2 headers

### 3.1.2 Main Method Flow

```typescript
function updateFileWithTemplate(app, templatePath, targetPath):

    // A. INITIALIZATION
    // Parse both files into HeaderSection objects with hierarchy
    templateInMemory = getHeaderSections(templatePath)    // Array<HeaderSection>
    targetInMemory = getHeaderSections(targetPath)        // Array<HeaderSection>
    stagingInMemory = []                                 // Final array to build result

    // B. PRE-HEADER PROCESSING
    // Get pre-header content from both files
    templatePreHeader = findPreHeaderContent(templateInMemory)
    targetPreHeader = findPreHeaderContent(targetInMemory)
    
    // Merge pre-header content preserving all data
    mergedPreHeader = mergePreHeaderContent(templatePreHeader, targetPreHeader)
    // Data loss prevention: target content has priority, template fills gaps
    
    if (mergedPreHeader) {
        stagingInMemory.push(mergedPreHeader)
        removePreHeaderFromMemory(targetInMemory)  // Avoid duplicating content
    }

    // C. L1 HEADER PROCESSING
    // Process each L1 header from template first
    for each templateL1Section in templateInMemory:
        // Skip pre-header as it's already processed
        if (isPreHeaderContent(templateL1Section)) continue
        
        // Find matching L1 headers in target
        matchingL1Sections = findMatchingL1Sections(targetInMemory, templateL1Section)
        
        if (matchingL1Sections exists):
            // D. CONTENT MERGING FOR L1
            // Combine content from all matching sections
            combinedL1Content = mergeL1Content(matchingL1Sections)
            // Data loss prevention: keep target content if exists, else template
            
            // Create new section for staging
            stagingL1Section = createL1Section(
                header: templateL1Section.header,
                content: combinedL1Content || templateL1Section.content,
                position: stagingInMemory.length
            )
            
            // E. L2 HEADER PROCESSING
            if (templateL1Section has subSections):
                // Track processed L2s per L1 to prevent data loss
                processedL2Headers = new Map<string, Set<string>>()
                
                // Process template L2s first
                for each templateL2Section in templateL1Section.subSections:
                    // Track L2 under its L1 parent
                    trackProcessedL2Header(processedL2Headers, 
                                        templateL1Section.header, 
                                        templateL2Section.header)
                    
                    // Find matching L2s in target
                    matchingL2Sections = findMatchingL2Sections(
                        matchingL1Sections, 
                        templateL2Section
                    )
                    
                    if (matchingL2Sections exists):
                        // F. CONTENT MERGING FOR L2
                        // Combine content from matching L2s
                        combinedL2Content = mergeL2Content(matchingL2Sections)
                        // Data loss prevention: keep target content if exists
                        
                        addToStagingL2Section(
                            stagingL1Section,
                            header: templateL2Section.header,
                            content: combinedL2Content || templateL2Section.content
                        )
                    else:
                        // Use template L2 as is
                        addToStagingL2Section(
                            stagingL1Section,
                            templateL2Section
                        )
                
                // G. REMAINING L2 PROCESSING
                // Add L2s from target that weren't in template
                for each l1Section in matchingL1Sections:
                    if (l1Section has subSections):
                        // Get processed L2s for this specific L1
                        processedL2s = processedL2Headers.get(l1Section.header)
                        
                        // Find L2s not yet processed under this L1
                        remainingL2s = findUnprocessedL2Sections(
                            l1Section.subSections, 
                            processedL2s
                        )
                        
                        // Add each remaining L2 to staging
                        for each l2Section in remainingL2s:
                            addToStagingL2Section(
                                stagingL1Section,
                                l2Section
                            )
            
            add stagingL1Section to stagingInMemory
            removeProcessedSections(targetInMemory, matchingL1Sections)
        
        else:
            // No match in target, use template section as is
            add templateL1Section copy to stagingInMemory
    
    // H. REMAINING L1 PROCESSING
    // Add remaining L1s from target that weren't in template
    for each remainingSection in targetInMemory:
        add remainingSection to stagingInMemory
    
    // I. FINAL ASSEMBLY
    return convertToMarkdown(stagingInMemory)

### 4.1.2 Key Data Loss Prevention Mechanisms

####     **Pre-Header Merging**:
   - Preserves all frontmatter tags from both files
   - Keeps all inline properties from both files
   - Uses target's remaining text if exists, else template's

#### **L1 Content Merging**

   - Combines content from all matching sections
   - Prioritizes target content over template
   - Preserves all L1 sections from both files

#### **L2 Header Tracking**

   - Uses Map<string, Set<string>> to track L2s per L1
   - Prevents loss when same L2 header exists under different L1s
   - Preserves all L2 content from both files

#### **Content Priority**

   - Target content always has priority when it exists
   - Template content used only to fill gaps
   - No content is ever discarded without being checked

# 4. Notes about Sintax, APIs, and other information for development

## 4.1. Sintaxis information about Frontmatter tags

### 4.1.1. Frontmatter in Obsidian: 

Obsidian supports YAML frontmatter, which allows you to add metadata to your notes. Here's a description of valid frontmatter in Obsidian and its syntax:

#### 4.1.1.1 Standard Frontmatter Structure

Frontmatter in Obsidian must be placed at the very top of the note and enclosed within three dashes (---) on both sides. The basic structure looks like this:

```yaml
---
key1: value1
key2: value2
---
```

#### 4.1.1.2 Commonly Used Frontmatter Tags

1. **tags**: Used to add tags to your note
   ```yaml
   tags:
     - tag1
     - tag2
     - tag3/subtag
   ```
   Alternatively: `tags: [tag1, tag2, tag3/subtag]`

2. **aliases**: Used to create alternative names for your note
   ```yaml
   aliases:
     - Alias1
     - Alias2
   ```

3. **cssclass**: Used to apply custom CSS classes to the note
   ```yaml
   cssclass: custom-class
   ```

4. **publish**: Used to control whether a note should be published (for Obsidian Publish)
   ```yaml
   publish: true
   ```

#### 4.1.2.3 Additional Frontmatter Options

5. **date**: Often used to specify the creation or last modified date of the note
   ```yaml
   date: 2024-12-29
   ```

6. **title**: Can be used to specify a custom title for the note
   ```yaml
   title: "My Custom Note Title"
   ```

7. **author**: Used to specify the author of the note
   ```yaml
   author: John Doe
   ```

#### 4.1.1.4 Syntax Rules

1. Use lowercase for keys (e.g., `tags`, not `Tags`).
2. For single values, use `key: value` format.
3. For multiple values, use either a list format with hyphens or an array format with square brackets.
4. String values containing special characters should be enclosed in quotes.
5. Do not use the hash symbol (#) for tags in frontmatter; it's not valid in YAML syntax.
6. Indentation is important for nested structures.
