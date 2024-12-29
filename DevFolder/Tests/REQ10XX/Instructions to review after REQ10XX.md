# Test Review Instructions for REQ10XX

After running the plugin using `template1.md` on `targetnote1.md`, verify the following aspects in the resulting `targetnote1.md` file:

## REQ1020: Frontmatter Tag Preservation

### 1. Template Tags Should Be Added
- [ ] `Manufacturer: pending` should be added
- [ ] `Class: .` should be added
- [ ] `Type:` (empty tag) should be added
- [ ] `empty_tag2:` should be added

### 2. Target Tags Should Be Preserved
- [ ] `CustomManufacturer: This is the Custom Manufacturer` should remain
- [ ] `estado: Jalisco` should remain
- [ ] `empty_tag3:` should remain
- [ ] `custom_nested` property should be preserved exactly as it appears in the target file (since it only exists in target)

### 3. Shared Tags Should Use Target's Values
- [ ] `status:` should remain "draft" (not "template")
- [ ] `tags:` should remain `[note, custom, target-specific]`
- [ ] `priority:` should remain "low"
- [ ] `metadata:` structure should preserve target's values:
  ```yaml
  metadata:
    version: 2.0
    author: note-creator
    category: test-notes
  ```

### 4. Empty Tags Should Be Preserved
- [ ] `empty_tag1:` from both files should be preserved
- [ ] `empty_tag2:` from template should be added
- [ ] `empty_tag3:` from target should remain

## REQ1030: Inline Properties Preservation

### 1. Template Inline Properties Should Be Added
- [ ] `InlineTag1BeforeHeader:: Value of InlineTag1BeforeHeader from Template` should be added

### 2. Target Inline Properties Should Be Preserved
- [ ] `CustomInlineTag:: Value of the customInlineTag` should remain

### 3. Shared Inline Properties Should Use Target's Values
- [ ] `SharedInlineTag` should keep the target's value: "Value from Target (should be preserved)"

## REQ1040: Content Structure Preservation

### 1. Pre-Header Text Behavior
- [ ] First plugin run: Template's pre-header text should be copied to target if target has no pre-header text
- [ ] Second plugin run: Target's pre-header text should be preserved, ignoring template's pre-header text

### 2. Headers from Template Should Be Added
- [ ] "Header 2 from Template" and its content should be added
- [ ] "Subheader 2.1" and its content should be added

### 3. Target Headers Should Be Preserved
- [ ] "Header 3 from Target" and its content should remain
- [ ] "Subheader 3.1" and its content should remain

### 4. Shared Headers Should Use Target's Content
- [ ] Under "Header 1", content should remain from target
- [ ] Under "Subheader 1.1", content should remain from target
- [ ] "Subheader 1.3" from target should remain

## Expected Final Structure
The final file should have this general structure:
```markdown
---
[All frontmatter tags as described above]
---
[All inline properties]

[All headers and content merged as described]
```

## Common Issues to Watch For
1. Indentation in nested structures should be preserved
2. Empty tags should not be removed or filled with default values
3. Array-type tags should maintain their format
4. Order of elements within each section should be logical
5. No duplicate tags or properties should exist
6. Properties that only exist in target should be preserved exactly as they appear in target

## Test Pass/Fail Criteria
- The test passes if ALL checkboxes above can be checked
- Any missing or incorrectly modified element constitutes a test failure
- The structure and formatting of the file should remain clean and consistent
