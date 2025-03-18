#!/bin/bash

# Community Site Production Deployment Script
# This script handles the deployment process on the production server

# Exit on error
set -e

# Configuration
APP_NAME="community-site"
APP_DIR="/path/to/community-site"  # Change this to your application directory
PORT=3001  # Changed from 3000 to 3001
NODE_ENV="production"

echo "🚀 Starting production deployment for $APP_NAME on port $PORT..."

# Step 1: Navigate to application directory
cd $APP_DIR

# Step 2: Pull latest changes (if using Git)
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes from Git..."
  git pull
else
  echo "⚠️ Not a Git repository, skipping Git pull."
fi

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 4: Build the application
echo "🏗️ Building the application..."
npm run build

# Step 5: Check if PM2 is installed, if not install it
if ! command -v pm2 &> /dev/null; then
  echo "🔧 PM2 not found, installing globally..."
  npm install -g pm2
fi

# Step 6: Start/Restart the application with PM2
echo "🚀 Deploying application with PM2 on port $PORT..."
if pm2 list | grep -q "$APP_NAME"; then
  echo "🔄 Restarting existing PM2 process..."
  PORT=$PORT pm2 reload $APP_NAME
else
  echo "🆕 Creating new PM2 process..."
  PORT=$PORT pm2 start npm --name "$APP_NAME" -- start
fi

# Step 7: Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Step 8: Setup PM2 to start on system boot (optional)
echo "🔄 Setting up PM2 to start on system boot..."
pm2 startup

echo "✅ Deployment completed successfully!"
echo "Application is running at http://localhost:$PORT"
echo ""
echo "Important: If you cannot access your site at the specified port, please configure"
echo "your web server (Nginx/Apache) to proxy requests to http://localhost:$PORT"
echo ""
echo "To monitor your application:"
echo "   pm2 logs $APP_NAME"
echo "   pm2 monit"
echo ""
echo "To stop the application:"
echo "   pm2 stop $APP_NAME"
echo ""
echo "Note: Make sure to update the APP_DIR variable in this script with your actual application directory path." 