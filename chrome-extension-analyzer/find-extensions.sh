#!/bin/bash

# Script to find and list all installed Chrome extensions
# This helps identify extensions for learning and analysis purposes

echo "=========================================="
echo "Chrome Extension Finder"
echo "=========================================="
echo ""

CHROME_DIR="$HOME/Library/Application Support/Google/Chrome"

# Find all profile directories
echo "Looking for Chrome profiles..."
echo ""

profile_count=0

find "$CHROME_DIR" -type d -name "Extensions" 2>/dev/null | while read ext_dir; do
    profile_name=$(echo "$ext_dir" | sed "s|$CHROME_DIR/||" | sed 's|/Extensions||')

    echo "=== Profile: $profile_name ==="

    # Count extensions in this profile
    ext_count=$(ls -1 "$ext_dir" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$ext_count" -gt 0 ]; then
        echo "Found $ext_count extension(s)"
        echo ""

        # List each extension
        ls -1 "$ext_dir" 2>/dev/null | while read ext_id; do
            # Find the latest version directory
            latest_version=$(ls -1 "$ext_dir/$ext_id" 2>/dev/null | sort -V | tail -1)

            if [ -n "$latest_version" ]; then
                manifest_path="$ext_dir/$ext_id/$latest_version/manifest.json"

                if [ -f "$manifest_path" ]; then
                    # Extract extension name from manifest.json
                    ext_name=$(grep -m 1 '"name"' "$manifest_path" | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
                    ext_version=$(grep -m 1 '"version"' "$manifest_path" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

                    echo "  Extension: $ext_name"
                    echo "  Version: $ext_version"
                    echo "  ID: $ext_id"
                    echo "  Path: $ext_dir/$ext_id/$latest_version"
                    echo ""
                else
                    echo "  Extension ID: $ext_id (no manifest found)"
                    echo "  Path: $ext_dir/$ext_id/$latest_version"
                    echo ""
                fi
            fi
        done
    else
        echo "No extensions found in this profile"
        echo ""
    fi
done

echo "=========================================="
echo "To copy an extension for analysis, use:"
echo "cp -r '<extension_path>' ~/Devops_practise/claudeproject/chrome-extension-analyzer/"
echo "=========================================="
