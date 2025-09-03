#!/bin/bash
# DeepSeek API Configuration Script for Lotus Development

echo "🔧 Setting up DeepSeek API environment variables..."
echo

# Check if API key is provided
if [ -z "$1" ]; then
    echo "❌ Error: API key required"
    echo "Usage: ./setup-deepseek-env.sh YOUR_API_KEY"
    echo
    echo "Example: ./setup-deepseek-env.sh sk-1234567890abcdef"
    exit 1
fi

# Export environment variables
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=$1
export ANTHROPIC_MODEL=deepseek-chat
export ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat

echo "✅ Environment variables configured:"
echo "ANTHROPIC_BASE_URL=$ANTHROPIC_BASE_URL"
echo "ANTHROPIC_AUTH_TOKEN=***hidden***"
echo "ANTHROPIC_MODEL=$ANTHROPIC_MODEL"
echo "ANTHROPIC_SMALL_FAST_MODEL=$ANTHROPIC_SMALL_FAST_MODEL"
echo

# Add to current shell session
echo "🌿 DeepSeek API ready for Lotus development!"
echo
echo "To persist these settings, add them to your ~/.bashrc or ~/.zshrc:"
echo "echo 'export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic' >> ~/.bashrc"
echo "echo 'export ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY' >> ~/.bashrc"
echo "echo 'export ANTHROPIC_MODEL=deepseek-chat' >> ~/.bashrc"
echo "echo 'export ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat' >> ~/.bashrc"