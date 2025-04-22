#!/bin/bash
echo "Setting up GitHub Streak Manager..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd server
npm install
cd ..

# Check if MongoDB is installed and running
echo "Checking MongoDB..."
if command -v mongod &> /dev/null; then
  echo "MongoDB is installed."
  # Try to connect to MongoDB
  if mongo --eval "db.version()" &> /dev/null; then
    echo "MongoDB is running."
  else
    echo "MongoDB installed but not running. Please start MongoDB before running the application."
  fi
else
  echo "MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
  echo "Update the MONGODB_URI in server/.env with your connection string."
fi

# Setup complete
echo "Setup complete! Now you can start the application."
echo "To start the frontend: npm run dev"
echo "To start the backend: cd server && npm run dev"
echo "To start both together: npm run dev:all"
echo ""
echo "Access the app at: http://localhost:8080"
echo "Test the backend at: http://localhost:5001/api/auth/test" 