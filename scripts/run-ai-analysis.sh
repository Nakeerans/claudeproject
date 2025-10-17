#!/bin/bash

# AI-Guided Huntr.co Analysis Launcher
# This script loads credentials from .credentials file and runs the analysis

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CREDENTIALS_FILE="$PROJECT_DIR/.credentials"

echo "🤖 AI-Guided Huntr.co Analyzer"
echo "================================"
echo ""

# Check if credentials file exists
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Error: Credentials file not found at: $CREDENTIALS_FILE"
    echo ""
    echo "Please create .credentials file with:"
    echo "  ANTHROPIC_API_KEY=your-key-here"
    echo "  HUNTR_EMAIL=your-email@example.com"
    echo "  HUNTR_PASSWORD=your-password"
    exit 1
fi

echo "📄 Loading credentials from: $CREDENTIALS_FILE"

# Load credentials from file
export $(grep -v '^#' "$CREDENTIALS_FILE" | xargs)

# Validate credentials
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set or still has default value"
    echo "Please edit .credentials file with your actual Anthropic API key"
    exit 1
fi

if [ -z "$HUNTR_EMAIL" ] || [ "$HUNTR_EMAIL" = "your-email@example.com" ]; then
    echo "❌ Error: HUNTR_EMAIL not set or still has default value"
    echo "Please edit .credentials file with your actual Huntr.co email"
    exit 1
fi

if [ -z "$HUNTR_PASSWORD" ] || [ "$HUNTR_PASSWORD" = "your-password-here" ]; then
    echo "❌ Error: HUNTR_PASSWORD not set or still has default value"
    echo "Please edit .credentials file with your actual Huntr.co password"
    exit 1
fi

echo "✓ Anthropic API Key loaded"
echo "✓ Huntr.co email: $HUNTR_EMAIL"
echo "✓ Huntr.co password: ********"
echo ""

echo "🚀 Starting AI-Guided Analysis..."
echo ""
echo "This will:"
echo "  1. Open a browser (visible, so you can watch)"
echo "  2. Login to Huntr.co"
echo "  3. Let Claude AI explore and analyze the application"
echo "  4. Capture screenshots and generate reports"
echo ""
echo "Expected duration: 20-40 minutes"
echo "Estimated API cost: $5-10"
echo ""
read -p "Press Enter to start, or Ctrl+C to cancel..."
echo ""

# Run the AI-guided analyzer
cd "$PROJECT_DIR"
node scripts/ai-guided-huntr-analyzer.js "$HUNTR_EMAIL" "$HUNTR_PASSWORD"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Analysis complete!"
    echo "📁 Results saved in: huntr-ai-guided-analysis/"
    echo ""
    echo "Next steps:"
    echo "  1. Review screenshots in: huntr-ai-guided-analysis/screenshots/"
    echo "  2. Read AI decisions in: huntr-ai-guided-analysis/reports/AI-SUMMARY.md"
    echo "  3. Use findings to rebuild the Huntr.co clone"
else
    echo ""
    echo "❌ Analysis failed with exit code: $EXIT_CODE"
    echo "Check the output above for errors"
fi

exit $EXIT_CODE
