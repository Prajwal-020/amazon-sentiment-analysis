#!/bin/bash

# Setup script for Sentiment Analysis Project
echo "🚀 Setting up Sentiment Analysis Project..."

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
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo ""
echo "To run the backend:"
echo "1. source venv/bin/activate"
echo "2. python app.py"
echo ""
echo "The API will be available at: http://localhost:8000"
echo "API documentation: http://localhost:8000/docs"
