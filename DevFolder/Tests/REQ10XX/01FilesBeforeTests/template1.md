---
Manufacturer: pending
Class: .
Type: computer-inventory
status: active
tags: [template, test, base-template, computer-inventory]
BracketTagFromTemplate: [BracketTagFrom_Template, BracketTag2, BracketTag3]
SharedBracketTag: [SharedBracketTag, SharedTag2, SharedTag3]
version: 1.0
author: template-creator
category: test-templates
empty_tag1:
empty_tag2:
priority: high
last_updated: <% tp.date.now("YYYY-MM-DD") %>
last_modified: 2024-12-29T15:59:35-05:00
custom_nested_from_template:
  - custom_nestedFromTemplateValue1FromTemplate
  - 
  - custom_nestedFromTemplateValue3FromTemplate

custom_nested_Shared:
  - CustomNestedSharedvalue1FromTemplate
  - CustomNestedSharedvalue2FromTemplate
---

InlineTag1BeforeHeaderFromTemplate::  Value of InlineTag1BeforeHeader from Template
SharedInlineTag:: Value from Template
Computer Name:: [Computer Name]
Asset Tag:: [Asset Tag]
Department:: [Department]

This is the pre-header text from template.
This is another pre-header line.

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
