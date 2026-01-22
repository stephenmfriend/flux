#!/bin/bash
# Install system dependencies for Playwright browser testing

echo "Installing Playwright system dependencies..."
echo "This requires sudo access."
echo ""

sudo apt-get update && sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libgtk-3-0 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libpango-1.0-0 \
  libcairo2

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Dependencies installed successfully!"
  echo ""
  echo "Now run: bun run test:run"
else
  echo ""
  echo "❌ Installation failed. Please check errors above."
  exit 1
fi
