#!/bin/bash

# Open Camp - Admin Setup Script
# This script helps you set up the admin password for your camp registration system.

echo "==================================="
echo "Open Camp - Admin Setup"
echo "==================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI is not installed."
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Prompt for username
echo "Enter admin username (default: admin):"
read ADMIN_USERNAME
if [ -z "$ADMIN_USERNAME" ]; then
    ADMIN_USERNAME="admin"
fi

# Prompt for password
echo "Enter the admin password you want to set:"
read -s ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Error: Password cannot be empty"
    exit 1
fi

# Generate SHA-256 hash
echo "Generating password hash..."
PASSWORD_HASH=$(echo -n "$ADMIN_PASSWORD" | shasum -a 256 | cut -d' ' -f1)

echo ""
echo "Password hash generated: ${PASSWORD_HASH:0:16}..."
echo ""

# Set the values in KV
echo "Setting admin credentials in KV..."
echo ""

# Set username
echo "Setting admin username to '$ADMIN_USERNAME'..."
wrangler kv:key put --binding=KV "admin_username" "$ADMIN_USERNAME"

# Set password hash
echo "Setting admin password hash..."
wrangler kv:key put --binding=KV "admin_password_hash" "$PASSWORD_HASH"

# Set default max spots
echo "Setting default max_spots to 20..."
wrangler kv:key put --binding=KV "max_spots" "20"

echo ""
echo "==================================="
echo "Admin setup complete!"
echo "==================================="
echo ""
echo "Login credentials:"
echo "  Username: $ADMIN_USERNAME"
echo "  Password: (the password you entered)"
echo ""
echo "You can now access the admin dashboard at /admin"
echo ""
