#!/bin/bash

echo "=========================================="
echo "Simplify.jobs AI-Guided Analyzer"
echo "=========================================="
echo ""

# Check for .credentials file
if [ ! -f "../.credentials" ]; then
    echo "❌ Error: .credentials file not found"
    echo ""
    echo "Please create .credentials file in parent directory with:"
    echo "  ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo "  SIMPLIFY_EMAIL=your-email@example.com"
    echo "  SIMPLIFY_PASSWORD=your-password"
    exit 1
fi

# Check if ANTHROPIC_API_KEY exists in .credentials
if ! grep -q "ANTHROPIC_API_KEY" "../.credentials"; then
    echo "❌ Error: ANTHROPIC_API_KEY not found in .credentials file"
    echo ""
    echo "Please add to .credentials file:"
    echo "  ANTHROPIC_API_KEY=sk-ant-api03-..."
    exit 1
fi

echo "✅ Credentials file found with API key"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check for credentials file
if [ ! -f "../.credentials" ]; then
    echo "⚠️  No .credentials file found"
    echo "You will need to login manually when the browser opens"
    echo ""
    echo "To create .credentials file for auto-login:"
    echo "  cd .."
    echo "  echo 'SIMPLIFY_EMAIL=your-email@example.com' > .credentials"
    echo "  echo 'SIMPLIFY_PASSWORD=your-password' >> .credentials"
    echo ""
else
    echo "✅ Credentials file found - will attempt auto-login"
    echo ""
fi

echo "🚀 Starting AI-guided exploration..."
echo ""
echo "The tool will:"
echo "  1. Open a browser window"
echo "  2. Navigate to Simplify.jobs"
if [ -f "../.credentials" ]; then
    echo "  3. Login automatically using credentials"
else
    echo "  3. Wait for you to login manually"
fi
echo "  4. Start AI-guided exploration"
echo "  5. Save all discoveries to simplify-analysis/"
echo ""
echo "Press Ctrl+C to stop at any time"
echo ""

sleep 2

# Run the analyzer
node ai-guided-simplify-analyzer.js

EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Analysis complete!"
    echo ""
    echo "📊 Results saved to: simplify-analysis/"
    echo ""
    echo "Check these files:"
    echo "  - FINAL_SUMMARY.json       (Overall summary)"
    echo "  - feature-inventory.json   (Discovered features)"
    echo "  - screenshots/             (Page screenshots)"
    echo "  - html/                    (HTML snapshots)"
    echo "  - ai-decisions.json        (AI decision log)"
else
    echo "❌ Analysis failed with exit code: $EXIT_CODE"
    echo ""
    echo "Check execution-errors.json for details"
fi
echo "=========================================="
