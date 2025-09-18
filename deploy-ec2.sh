#!/bin/bash

# EC2 Deployment Script for Stream Scene
# This script helps deploy the updated ES module changes to your EC2 instance

echo "Starting EC2 deployment process..."

# Check if we're running on EC2 (you can modify this check as needed)
if [[ ! -f /home/ubuntu/stream-scene/package.json ]]; then
    echo "ERROR: This script should be run on your EC2 instance"
    echo "Please SSH into your EC2 instance first:"
    echo "ssh -i macKey.pem ubuntu@ec2-3-141-195-187.us-east-2.compute.amazonaws.com"
    exit 1
fi

# Navigate to project directory
cd /home/ubuntu/stream-scene

echo "Pulling latest changes from upstream Project Vision repository..."
git fetch upstream
git pull upstream main

echo "Installing/updating dependencies..."
npm install

echo "Building the project with increased memory..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed. Deployment aborted."
    exit 1
fi

echo "Setting up database schema..."
echo "Running database seed script to ensure proper schema..."
npm run seed:production || {
    echo "WARNING: Database seed failed. This might be expected if database is already seeded."
    echo "Continuing with deployment..."
}

echo "Stopping existing PM2 processes..."
pm2 stop stream-scene 2>/dev/null || echo "No existing process to stop"
pm2 delete stream-scene 2>/dev/null || echo "No existing process to delete"

echo "Starting the application with PM2..."
pm2 start dist/server/app.js --name stream-scene --env production

# Save PM2 configuration for auto-restart on reboot
pm2 save

echo "Checking PM2 status..."
pm2 status

echo "Checking PM2 logs..."
pm2 logs stream-scene --lines 20

echo "Deployment complete!"
echo ""
echo "Useful commands for monitoring:"
echo "  pm2 status                    - Check process status"
echo "  pm2 logs stream-scene         - View real-time logs"
echo "  pm2 restart stream-scene      - Restart the application"
echo "  pm2 monit                     - Real-time monitoring dashboard"
echo ""
echo "Your application should be accessible at:"
echo "  http://ec2-3-141-195-187.us-east-2.compute.amazonaws.com:8000"
