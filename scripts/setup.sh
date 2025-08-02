#!/bin/bash

# Setup script for Sentiment Analysis Project
echo "🚀 Setting up Sentiment Analysis Project..."

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# Check if Python 3.11+ is available
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
if [[ $(echo "$python_version >= 3.9" | bc -l) -eq 0 ]]; then
    echo "❌ Python 3.9+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "✅ Backend setup complete!"
echo ""
echo "To run the backend:"
echo "1. source venv/bin/activate"
echo "2. cd backend && python app.py"
echo ""
echo "Or use the run script:"
echo "  ./scripts/run-full-stack.sh"
echo ""
echo "The API will be available at: http://localhost:8001"
echo "API documentation: http://localhost:8001/docs"
