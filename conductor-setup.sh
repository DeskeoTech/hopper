#!/bin/bash
set -e

# Install dependencies
npm install

# Copy .env file
cp $CONDUCTOR_ROOT_PATH/.env.local .env.local

# Build the app
npm run build
