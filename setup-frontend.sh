#!/bin/bash

# Setup script for Next.js Frontend
echo "🚀 Setting up Next.js Frontend with shadcn/ui..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Create Next.js app with TypeScript
echo "📦 Creating Next.js application..."
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git

# Navigate to frontend directory
cd frontend

# Install additional dependencies
echo "📚 Installing additional dependencies..."
npm install @radix-ui/react-icons lucide-react recharts @tanstack/react-query axios date-fns clsx tailwind-merge

# Install shadcn/ui
echo "🎨 Setting up shadcn/ui..."
npx shadcn-ui@latest init --yes

# Add shadcn/ui components
echo "🧩 Adding shadcn/ui components..."
npx shadcn-ui@latest add button card badge progress separator skeleton table tabs tooltip

echo "✅ Frontend setup complete!"
echo ""
echo "To run the frontend:"
echo "1. cd frontend"
echo "2. npm run dev"
echo ""
echo "The frontend will be available at: http://localhost:3000"
