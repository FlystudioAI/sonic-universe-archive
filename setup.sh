#!/bin/bash

# TunesDB Setup Script
# This script helps you set up TunesDB for development

echo "🎵 Setting up TunesDB - The World's Smartest Music Database"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/en/download/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ "$MAJOR_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "🔧 Creating environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your API keys:"
    echo "   - OPENAI_API_KEY (required for AI features)"
    echo "   - LASTFM_API_KEY (required for music data)"
    echo "   - GENIUS_ACCESS_TOKEN (optional for lyrics)"
    echo "   - Supabase credentials"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo ""
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Supabase CLI. Please install it manually:"
        echo "   npm install -g supabase"
        echo "   or visit: https://supabase.com/docs/guides/cli"
    else
        echo "✅ Supabase CLI installed"
    fi
else
    echo "✅ Supabase CLI detected"
fi

# Check if Docker is running (needed for Supabase local development)
if ! docker info &> /dev/null; then
    echo ""
    echo "⚠️  Docker is not running. Supabase local development requires Docker."
    echo "   Please start Docker Desktop or install Docker if not available."
    echo "   Visit: https://docs.docker.com/get-docker/"
else
    echo "✅ Docker is running"
fi

echo ""
echo "🎉 TunesDB setup completed!"
echo ""
echo "🚀 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start Supabase: npm run supabase:start"
echo "3. Import sample data: npm run import:data 20 10"
echo "4. Start development server: npm run dev"
echo ""
echo "📚 For detailed instructions, see README.md"
echo "🎵 Happy music exploring!"