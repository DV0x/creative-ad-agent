#!/bin/bash
# Art Style Image Generator - Wrapper Script
# Handles NODE_PATH for module resolution

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

cd "$SERVER_DIR" && NODE_PATH=./node_modules npx tsx --env-file=../.env "$SCRIPT_DIR/generate-images.ts" "$@"
