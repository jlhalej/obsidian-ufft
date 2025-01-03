---
CustomManufacturer: This is the Custom Manufacturer
estado: Jalisco
status: draft
tags: [note, custom, target-specific]
version: 2.0
author: note-creator
category: test-notes
BracketTagAlreadyInTarget: [BracketTagAlreadyInTarget, BracketTag2, BracketTag3]

empty_tag1: 
empty_tag3:
priority: low
last_modified: 2024-12-29T15:59:35-05:00
customNestedAlreadyInTarget:
  - valueAlreadyInTarget1
  - valueAlreadyInTarget2
  - valueAlreadyInTarget3

custom_nested_Shared:
  - ValueFromTargetShouldBePreserved1
  - ValueFromTargetShouldBePreserved2
---
CustomInlineTag:: Value of the customInlineTag
SharedInlineTag:: Value from Target (should be preserved)
InlineTagOnlyInTarget:: InlineTagOnlyInTargetValue should be preserved


# Header 1 from Target
This is the content under header 1 from the target file.

## Subheader 1.1
Custom content under subheader 1.1

## New Subheader 1.3
Additional content in a new subheader

# Header 3 from Target
This is a completely new header section in the target file.

## Subheader 3.1
Content under the new header's subheader
