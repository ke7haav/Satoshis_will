#!/bin/bash

# Satoshi's Will - Deployment Script
# This script resets the local DFX environment and deploys all canisters

set -e  # Exit on any error

echo "=========================================="
echo "Satoshi's Will - Deployment Script"
echo "=========================================="
echo ""

# Step 1: Stop DFX
echo "📛 Stopping DFX..."
dfx stop || echo "DFX was not running"
echo "✓ DFX stopped"
echo ""

# Step 2: Remove .dfx directory
echo "🗑️  Removing .dfx directory..."
if [ -d ".dfx" ]; then
  rm -rf .dfx
  echo "✓ .dfx directory removed"
else
  echo "✓ .dfx directory does not exist (already clean)"
fi
echo ""

# Step 3: Start DFX cleanly in background
echo "🚀 Starting DFX (clean, background)..."
dfx start --clean --background
echo "✓ DFX started in background"
echo ""

# Wait a moment for DFX to fully initialize
echo "⏳ Waiting for DFX to initialize..."
sleep 3
echo ""

# Step 4: Deploy Internet Identity
echo "🔐 Deploying Internet Identity canister..."
dfx deploy internet_identity
echo "✓ Internet Identity deployed"
echo ""

# Step 5: Deploy Backend (with testnet Bitcoin network)
echo "⚙️  Deploying Backend canister (Bitcoin Testnet)..."
dfx deploy backend --argument '(variant { testnet })'
echo "✓ Backend deployed"
echo ""
echo "⚠️  NOTE: Bitcoin balance checking only works on IC Mainnet, not local replica."
echo "    For local testing, the balance will show 0 or an error."
echo ""

# Step 6: Generate Backend declarations
echo "📝 Generating Backend declarations..."
dfx generate backend
echo "✓ Backend declarations generated"
echo ""

# Step 7: Generate Internet Identity declarations
echo "📝 Generating Internet Identity declarations..."
dfx generate internet_identity
echo "✓ Internet Identity declarations generated"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Start the frontend: cd src/frontend && npm run dev"
echo "  2. Open http://localhost:5173 in your browser"
echo ""

