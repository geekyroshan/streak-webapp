#!/bin/bash

# Make script exit if any command fails
set -e

# Display ASCII art header
echo "======================================================"
echo "   Starting GitHub Streak Manager Development Servers  "
echo "======================================================"

# Create .env files if they don't exist
echo "Setting up environment files..."

# Create frontend .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating frontend .env file..."
  cat > .env << EOL
# Frontend Environment Configuration
VITE_API_URL=/api
EOL
  echo "Frontend .env created!"
fi

# Create backend .env if it doesn't exist
if [ ! -f "server/.env" ]; then
  echo "Creating backend .env file..."
  cat > server/.env << EOL
# Backend Environment Configuration
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/streakmanager
JWT_SECRET=dev_jwt_secret_key_change_in_production
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8080/api/auth/github/callback
CLIENT_URL=http://localhost:8080
EOL
  echo "Backend .env created! Please update with your GitHub OAuth credentials."
  echo "You need to add your GitHub OAuth credentials to server/.env"
fi

# Kill existing processes if needed
echo "Stopping any existing development servers..."
pkill -f "vite" || true
pkill -f "ts-node-dev" || true

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

if [ ! -d "server/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd server && npm install && cd ..
fi

# Start both servers
echo "Starting development servers..."
npm run dev:all 