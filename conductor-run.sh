#!/bin/bash

# Kill any existing Next.js dev processes for this workspace
pkill -f "next dev" 2>/dev/null || true

# Remove the lock file if it exists
rm -f .next/dev/lock 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 1

# Start the dev server
npm run dev
