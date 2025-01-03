---
Manufacturer: pending
Class: .
Type: computer-inventory
status: draft
tags:
- note
- custom
- target-specific
BracketTagFromTemplate: [BracketTagFrom_Template, BracketTag2, BracketTag3]
SharedBracketTag: [SharedBracketTag, SharedTag2, SharedTag3]
version: 2
author: note-creator
category: test-notes
empty_tag1:
empty_tag1:
empty_tag2:
empty_tag2:
priority: low
last_updated: <% tp.date.now("YYYY-MM-DD") %>
last_modified: 2024-12-29T15:59:35-05:00
custom_nested_from_template:
- custom_nestedFromTemplateValue1FromTemplate
-
- custom_nestedFromTemplateValue3FromTemplate
custom_nested_Shared:
- ValueFromTargetShouldBePreserved1
- ValueFromTargetShouldBePreserved2
CustomManufacturer: This is the Custom Manufacturer
estado: Jalisco
BracketTagAlreadyInTarget:
- BracketTagAlreadyInTarget
- BracketTag2
- BracketTag3
empty_tag3:
empty_tag3:
customNestedAlreadyInTarget:
- valueAlreadyInTarget1
- valueAlreadyInTarget2
- valueAlreadyInTarget3
---
InlineTag1BeforeHeaderFromTemplate:: Value of InlineTag1BeforeHeader from Template
SharedInlineTag:: Value from Target (should be preserved)
Computer Name:: [Computer Name]
Asset Tag:: [Asset Tag]
Department:: [Department]
CustomInlineTag:: Value of the customInlineTag
InlineTagOnlyInTarget:: InlineTagOnlyInTargetValue should be preserved
hfdas
no pasa nada carnal

# Header 1 from Template
Content under header 1 from template

## Subheader 1.1
Content under subheader 1.1 from template

## Subheader 1.2
Content under subheader 1.2 from template

# Header 2 from Template
Content under header 2 from template

## Subheader 2.1
Content under subheader 2.1 from template

# Hardware Specifications

## Processor
- Model:: [CPU Model]
- Speed:: [CPU Speed]
- Cores:: [Core Count]

## Memory
- Total RAM:: [RAM Size]
- Type:: [RAM Type]
- Speed:: [RAM Speed]
### Memory Slots
- Slot 1:: [Slot 1 Details]
- Slot 2:: [Slot 2 Details]
- Slot 3:: [Slot 3 Details]
- Slot 4:: [Slot 4 Details]

## Storage
- Primary Drive:: [Primary Drive]
- Capacity:: [Drive Capacity]
- Type:: [Drive Type]
### Additional Storage
- Secondary Drive:: [Secondary Drive]
- Backup Drive:: [Backup Drive]

## Graphics
- GPU Model:: [GPU Model]
- VRAM:: [VRAM Size]
- Driver Version:: [Driver Version]

# Software Information

## Operating System
- Name:: [OS Name]
- Version:: [OS Version]
- Build:: [OS Build]
- License:: [License Key]

## Installed Software
### Critical Applications
- Antivirus:: [AV Name]
- Firewall:: [Firewall Name]
- Backup Solution:: [Backup Software]
### Business Applications
- Office Suite:: [Office Version]
- Email Client:: [Email Client]
- Other Tools:: [Additional Tools]

# Network Configuration

## Connection Details
- IP Address:: [IP Address]
- MAC Address:: [MAC Address]
- Subnet Mask:: [Subnet Mask]
- Gateway:: [Gateway]

## Network Services
- Domain:: [Domain Name]
- DNS Servers:: [DNS Servers]
- DHCP Status:: [DHCP Status]

# Maintenance Records

## Last Service
- Date:: [Last Service Date]
- Technician:: [Technician Name]
- Work Done:: [Service Details]

## Scheduled Maintenance
- Next Date:: [Next Service Date]
- Type:: [Maintenance Type]
- Notes:: [Maintenance Notes]

# Security Status

## Access Control
- Local Admin:: [Admin Name]
- Domain Access:: [Domain Permissions]
- Security Group:: [Security Groups]

## Compliance
- Last Audit:: [Audit Date]
- Compliance Status:: [Compliance Level]
- Required Actions:: [Action Items]

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