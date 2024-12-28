# Update Files From Template (UFFT)

This Obsidian plugin allows you to maintain consistency across multiple notes by updating them based on a template file. It's particularly useful when you want to ensure that multiple notes follow the same structure while preserving their unique content.

## Features

- Update multiple files based on a template file
- Preserve existing content while updating the structure
- Support for both level 1 and level 2 headers
- Maintain pre-header content
- Option to include or exclude subfolders
- Multiple template-folder pairs support

## How It Works

1. The plugin uses a template file as a reference for the structure
2. It preserves all existing content under matching headers in the target files
3. Headers from the template that don't exist in the target files will be added
4. Headers in the target files that don't exist in the template will be preserved
5. Pre-header content (content before any level 1 header) is preserved

## Usage

### Setting Up Rules

1. Go to Settings > UFFT
2. Click the '+' button to add a new rule
3. Select a template file
4. Select a target folder
5. Toggle 'Include Subfolders' if you want to process files in subfolders
6. You can add multiple rules for different template-folder pairs

### Updating Files

There are three ways to update your files:

1. Click the ribbon icon (list icon in the left sidebar)
2. Use the command palette and search for "Update Files From Template"
3. Click the "Run" button next to individual rules in the settings

### Example

Template file structure:
```markdown
# Planning
## Goals
## Timeline

# Implementation
## Steps
## Resources
```

If a target file has:
```markdown
Some pre-header content

# Planning
## Goals
My specific goals here

# Implementation
## Resources
My specific resources

# Additional Section
My additional content
```

After updating, it will become:
```markdown
Some pre-header content

# Planning
## Goals
My specific goals here
## Timeline

# Implementation
## Steps
## Resources
My specific resources

# Additional Section
My additional content
```

Note how:
- Pre-header content is preserved
- Existing content under headers is preserved
- Missing headers from the template are added
- Additional headers not in the template are kept

## Installation

### From Obsidian Community Plugins

1. Open Settings > Community plugins
2. Turn off Safe mode if necessary
3. Click Browse and search for "Update Files From Template"
4. Install the plugin
5. Enable the plugin in the Installed plugins tab

### Manual Installation

1. Download the latest release from the GitHub releases page
2. Extract the files into your vault's `.obsidian/plugins/UFFT/` directory
3. Enable the plugin in Obsidian's settings

## Development

If you want to contribute to the plugin or modify it for your own use:

1. Clone this repository
2. Run `npm i` to install dependencies
3. Run `npm run dev` to start compilation in watch mode

### Debugging

For developers, you can enable debug logging by:
1. Opening the Developer Console (Ctrl+Shift+I)
2. Running: `window.UFFT.DEBUG = true`

## Support

If you encounter any issues or have suggestions:
- Open an issue on GitHub
- Visit our discussions page for questions and ideas

## License

MIT License. See [LICENSE](LICENSE) for full text.
