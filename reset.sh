#!/bin/bash

echo "🛑 Stopping DFX..."
dfx stop
killall dfx replica

echo "🧹 Cleaning State..."
rm -rf .dfx
rm -rf dist
rm -rf src/declarations

echo "🚀 Starting Local Replica..."
dfx start --clean --background

echo "🆔 Deploying Internet Identity (Stable)..."
dfx deploy internet_identity

echo "🧠 Deploying Backend..."
# Ensure target is installed
rustup target add wasm32-unknown-unknown
dfx deploy backend

echo "🔗 Generating Bridges..."
dfx generate

echo "✅ DONE! Now follow these steps:"
echo "1. Close your current browser tabs."
echo "2. Open a NEW Incognito Window (Crucial to clear cache)."
echo "3. Run 'npm run dev' in src/frontend"
