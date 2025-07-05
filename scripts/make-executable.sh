#!/bin/bash

# Make all scripts executable
echo "🔧 Making all scripts executable..."

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Make all shell scripts executable
chmod +x scripts/*.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Available scripts:"
echo "  ./scripts/setup.sh              - Setup backend environment"
echo "  ./scripts/setup-frontend.sh     - Setup frontend environment"
echo "  ./scripts/run-full-stack.sh     - Start both services"
echo "  ./scripts/stop-services.sh      - Stop all services"
echo "  ./scripts/make-executable.sh    - Make scripts executable (this script)"
