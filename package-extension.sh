#!/bin/bash

# Package JobFlow Chrome Extension
# This script creates a distributable zip file of the Chrome extension

set -e

EXTENSION_DIR="job-application-platform/apps/extension"
OUTPUT_DIR="client/public/downloads"
ZIP_NAME="jobflow-chrome-extension.zip"

echo "📦 Packaging JobFlow Chrome Extension..."

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Remove old zip if exists
if [ -f "$OUTPUT_DIR/$ZIP_NAME" ]; then
  echo "🗑️  Removing old package..."
  rm "$OUTPUT_DIR/$ZIP_NAME"
fi

# Create zip file with only necessary files
echo "🔧 Creating package..."
cd "$EXTENSION_DIR"

zip -r "../../../$OUTPUT_DIR/$ZIP_NAME" \
  manifest.json \
  popup.html \
  popup.js \
  content.js \
  api.js \
  config.js \
  icon.svg \
  README.md

cd - > /dev/null

# Get file size
FILE_SIZE=$(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)

echo "✅ Extension packaged successfully!"
echo "📍 Location: $OUTPUT_DIR/$ZIP_NAME"
echo "📊 Size: $FILE_SIZE"
echo ""
echo "Users can now download this file at: /downloads/$ZIP_NAME"
