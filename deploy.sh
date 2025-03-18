#!/bin/bash

# Community Site Deployment Script
# This script automates the deployment process for the community site

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Check if running in production
if [ "$NODE_ENV" != "production" ]; then
  echo "⚠️  Warning: NODE_ENV is not set to production"
  echo "Setting NODE_ENV to production..."
  export NODE_ENV=production
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checks..."
npm run typecheck

# Build the application
echo "🏗️  Building the application..."
npm run build

# Run database migrations if needed
if [ -f "prisma/schema.prisma" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
fi

# Clear existing dist directory
echo "🧹 Cleaning up dist directory..."
rm -rf dist

# Compile server-side TypeScript files
echo "📝 Compiling server-side TypeScript files..."
npm run tsc -p tsconfig.server.json

# Copy necessary files to dist
echo "📋 Copying configuration files..."
cp package.json dist/
cp package-lock.json dist/
cp server.mjs dist/

# Install production dependencies in dist
echo "📦 Installing production dependencies..."
cd dist
npm ci --only=production
cd ..

echo "✅ Deployment build completed successfully!"
echo "You can now start the server using:"
echo "  cd dist && NODE_ENV=production npm run start"

# Step 5: Run tests (if available)
if [ -f "package.json" ] && grep -q "\"test\":" "package.json"; then
  echo "🧪 Running tests..."
  npm test
else
  echo "⚠️ No tests found, skipping test step."
fi

# Step 6: Prepare for deployment
echo "🔧 Preparing for deployment..."

# Create necessary directories
mkdir -p .deploy

# Copy build artifacts
cp -r .next .deploy/
cp -r public .deploy/
cp package.json .deploy/
cp package-lock.json .deploy/
cp next.config.js .deploy/

# Step 7: Create deployment package
echo "📦 Creating deployment package..."
cd .deploy
tar -czf ../deploy-package.tar.gz .
cd ..

# Step 8: Deploy to server (customize this part based on your hosting provider)
echo "🚀 Deploying to server..."
# Uncomment and modify the following lines based on your deployment method
# scp deploy-package.tar.gz user@your-server:/path/to/deployment/
# ssh user@your-server "cd /path/to/deployment/ && tar -xzf deploy-package.tar.gz && npm install --production && pm2 restart community-site"

# For Vercel deployment
# vercel --prod

# For Netlify deployment
# netlify deploy --prod

echo "✅ Deployment package created successfully!"
echo "Manual steps to complete deployment:"
echo "1. Upload deploy-package.tar.gz to your server"
echo "2. Extract the package on your server"
echo "3. Install production dependencies: npm install --production"
echo "4. Start or restart your application using your process manager (PM2, systemd, etc.)"

# Clean up
echo "🧹 Cleaning up..."
rm -rf .deploy

echo "✅ Deployment process completed successfully!" 