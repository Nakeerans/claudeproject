#!/bin/bash
# Auto-generated SSH connection script

# Connection details
INSTANCE_IP="${instance_ip}"
SSH_KEY="${ssh_key_path}"
SSH_USER="${ssh_user}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Connecting to Job Tracker Instance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "IP Address: $INSTANCE_IP"
echo "User: $SSH_USER"
echo "SSH Key: $SSH_KEY"
echo ""

# Connect
ssh -i "$SSH_KEY" "$SSH_USER@$INSTANCE_IP"
