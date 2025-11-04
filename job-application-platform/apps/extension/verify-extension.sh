#!/bin/bash

# JobFlow Extension Verification Script
# Checks that all required files exist and are valid

echo "🔍 Verifying JobFlow Extension..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found${NC}"
    echo "   Please run this script from the apps/extension directory"
    exit 1
fi

echo "✅ Running from correct directory"
echo ""

# Check required files
echo "📁 Checking required files..."
FILES=("manifest.json" "content.js" "popup.html" "popup.js" "README.md")

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file exists"
    else
        echo -e "${RED}❌${NC} $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check manifest.json validity
echo "🔧 Validating manifest.json..."
if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} manifest.json is valid JSON"
    else
        echo -e "${RED}❌${NC} manifest.json has syntax errors"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Node.js not found, skipping JSON validation"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check file sizes (rough validation)
echo "📊 Checking file sizes..."

if [ -f "content.js" ]; then
    SIZE=$(wc -l < content.js | tr -d ' ')
    if [ "$SIZE" -gt 400 ]; then
        echo -e "${GREEN}✅${NC} content.js: $SIZE lines (looks good)"
    else
        echo -e "${YELLOW}⚠️${NC}  content.js: $SIZE lines (seems short)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

if [ -f "popup.js" ]; then
    SIZE=$(wc -l < popup.js | tr -d ' ')
    if [ "$SIZE" -gt 100 ]; then
        echo -e "${GREEN}✅${NC} popup.js: $SIZE lines (looks good)"
    else
        echo -e "${YELLOW}⚠️${NC}  popup.js: $SIZE lines (seems short)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check for key functions in content.js
echo "🔍 Checking content.js functions..."
FUNCTIONS=("detectForms" "isJobApplicationForm" "generateSelector" "recordClick" "startRecording")
for func in "${FUNCTIONS[@]}"; do
    if grep -q "function $func" content.js || grep -q "const $func" content.js; then
        echo -e "${GREEN}✅${NC} Found: $func()"
    else
        echo -e "${RED}❌${NC} Missing: $func()"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check Chrome API usage
echo "🌐 Checking Chrome Extension APIs..."
if grep -q "chrome.runtime.onMessage" content.js; then
    echo -e "${GREEN}✅${NC} Message passing implemented"
else
    echo -e "${RED}❌${NC} Message passing not found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "chrome.tabs.sendMessage" popup.js; then
    echo -e "${GREEN}✅${NC} Popup-to-content communication implemented"
else
    echo -e "${RED}❌${NC} Popup communication not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check for icon files (expected to be missing)
echo "🎨 Checking assets..."
if [ -f "icon16.png" ] || [ -f "icon48.png" ] || [ -f "icon128.png" ]; then
    echo -e "${GREEN}✅${NC} Extension icons found"
else
    echo -e "${YELLOW}⚠️${NC}  Extension icons missing (expected - extension will still work)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Verification Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -le 2 ]; then
    echo -e "${GREEN}✅ Extension is ready to load in Chrome!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode' (top-right toggle)"
    echo "3. Click 'Load unpacked'"
    echo "4. Select this directory: $(pwd)"
    echo ""
    echo "For detailed testing instructions, see TESTING_GUIDE.md"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Extension has minor issues but should work${NC}"
    echo "   Warnings: $WARNINGS"
    echo ""
    echo "You can proceed with loading the extension."
else
    echo -e "${RED}❌ Extension has critical issues${NC}"
    echo "   Errors: $ERRORS"
    echo "   Warnings: $WARNINGS"
    echo ""
    echo "Please fix the errors before loading the extension."
    exit 1
fi

echo ""
echo "Extension directory: $(pwd)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
