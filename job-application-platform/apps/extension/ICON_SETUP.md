# Extension Icon Setup

## Current Status

The extension manifest requires three icon sizes:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)

## Temporary Solution

For development and testing, you can use one of these approaches:

### Option 1: Use Online Icon Generator
1. Visit: https://www.favicon-generator.org/
2. Upload the icon.svg file from this directory
3. Generate and download PNG versions in sizes: 16x16, 48x48, 128x128
4. Save them as icon16.png, icon48.png, icon128.png in this directory

### Option 2: Use Chrome Developer Mode
Chrome allows loading extensions without icons in Developer Mode. The extension will work but show a default icon.

### Option 3: Create with ImageMagick (if available)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Then convert
cd /Users/nakeeransaravanan/Devops_practise/claudeproject/job-application-platform/apps/extension/
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

## Icon Design

The icon.svg represents:
- **Purple gradient**: JobFlow brand color
- **Lightning bolt**: Fast autofill action
- **Document lines**: Form/application representation

This creates a professional look that's recognizable in the Chrome toolbar.

## For Production

Before deploying to Chrome Web Store, ensure:
- All three PNG sizes are created
- Icons are optimized (use tools like TinyPNG)
- Icons look good on both light and dark backgrounds
- Icons meet Chrome Web Store requirements
