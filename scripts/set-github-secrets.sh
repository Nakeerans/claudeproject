i#!/bin/bash

# Set GitHub Secrets from File
# Usage: ./scripts/set-github-secrets.sh updatesecrets.env

set -e

SECRETS_FILE="${1:-updatesecret.env}"

if [ ! -f "$SECRETS_FILE" ]; then
    echo "Error: $SECRETS_FILE not found"
    echo "Usage: ./scripts/set-github-secrets.sh secrets.env"
    exit 1
fi

echo "Setting GitHub secrets from $SECRETS_FILE..."
echo ""

# Read file and set secrets
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue

    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Handle file-based secrets
    if [[ "$key" == *"_FILE" ]]; then
        actual_key="${key%_FILE}"
        file_path="${value/#\~/$HOME}"

        if [ -f "$file_path" ]; then
            echo "Setting $actual_key (from file: $file_path)"
            gh secret set "$actual_key" < "$file_path"
        else
            echo "Warning: File not found: $file_path (skipping $actual_key)"
        fi
    else
        echo "Setting $key"
        echo "$value" | gh secret set "$key"
    fi
done < "$SECRETS_FILE"

echo ""
echo "✅ Done! Secrets set successfully"
echo ""
echo "Next: Run Terraform workflow"
echo "  gh workflow run terraform-create-infrastructure.yml -f action=apply"
