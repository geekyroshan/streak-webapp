#!/bin/bash
echo "Stopping existing development servers..."

# Kill any running vite and ts-node-dev processes
pkill -f "vite" || true
pkill -f "ts-node-dev" || true

echo "Servers stopped. Starting application again..."
npm run dev:all 