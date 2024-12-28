# Release Instructions for UFFT Plugin

This document outlines the step-by-step process for creating new releases of the Update Files From Template (UFFT) plugin for Obsidian.

## 1. Pre-release Steps
1. Update version numbers in:
   ```bash
   # Check these files and update version numbers
   manifest.json
   package.json
   versions.json
   ```

2. Build the production version:
   ```bash
   npm run build
   ```

3. Test the plugin locally to ensure everything works

## 2. Prepare Release Files
1. Create release directory structure:
   ```powershell
   # Create directory with correct structure (replace X.X.X with version number)
   New-Item -ItemType Directory -Path "UFFT-X.X.X/UFFT"

   # Copy required files
   Copy-Item main.js,manifest.json,styles.css -Destination "UFFT-X.X.X/UFFT"
   ```

2. Create the release zip:
   ```powershell
   # Create zip file (replace X.X.X with version number)
   Compress-Archive -Path "UFFT-X.X.X/UFFT" -DestinationPath "UFFT-X.X.X.zip" -Force
   ```

## 3. GitHub Release
1. Commit and push all changes:
   ```bash
   git add .
   git commit -m "release: version X.X.X"
   git push
   ```

2. Create new release on GitHub:
   - Go to: https://github.com/jlhalej/obsidian-ufft/releases
   - Click "Create a new release"
   - Set tag version: "X.X.X"
   - Title: "Version X.X.X - [Brief Description]"
   - Description template:
     ```markdown
     Version X.X.X of the Update Files From Template (UFFT) plugin.

     Changes:
     - [List major changes]
     - [List bug fixes]
     - [List improvements]

     Installation:
     1. Download the zip file from this release
     2. Extract it to your vault's `.obsidian/plugins/` directory
     3. Make sure the files are in the correct path: `.obsidian/plugins/UFFT/main.js`
     4. Enable the plugin in Obsidian's Community Plugins settings
     ```
   - Upload the `UFFT-X.X.X.zip` file

## 4. Post-release Cleanup
```powershell
# Remove temporary directories and files
Remove-Item -Recurse -Force "UFFT-X.X.X"
Remove-Item "UFFT-X.X.X.zip"
```

## Important Notes
1. Always ensure the plugin ID folder is exactly `UFFT` in the release zip
2. The release zip should contain:
   - main.js
   - manifest.json
   - styles.css
3. Test the release by:
   - Installing it on a fresh Obsidian vault
   - Verifying all features work
   - Checking console for any errors

## Version Numbering
- Use semantic versioning (X.Y.Z):
  - X: Major version (breaking changes)
  - Y: Minor version (new features)
  - Z: Patch version (bug fixes)

## Common Issues and Solutions
1. **Plugin fails to load**: Check that the folder structure is correct (must be `.obsidian/plugins/UFFT/`)
2. **Missing dependencies**: Make sure to run `npm install` before building
3. **Build errors**: Check that all TypeScript files compile correctly
4. **Version mismatch**: Ensure version numbers are consistent across all files
