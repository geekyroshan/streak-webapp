import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import repoRoutes from './routes/repository.routes';
import streakRoutes from './routes/streak.routes';
import contributionRoutes from './routes/contribution.routes';
import githubRoutes from './routes/github.routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase } from './config/database';
import './services/scheduler.service'; // Initialize the scheduler

// Load environment variables
dotenv.config();

// Debug GitHub OAuth credentials
console.log('GitHub OAuth Debug:');
console.log('Client ID:', process.env.GITHUB_CLIENT_ID);
console.log('Redirect URI:', process.env.GITHUB_REDIRECT_URI);
console.log('Client ID from config:', require('./config/github').githubConfig.clientId);

// Connect to MongoDB
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDatabase();
    dbConnected = true;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Setup allowed origins for CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // Allow all origins in production for now
      if (process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Connect to database before handling routes
app.use(async (req, res, next) => {
  await ensureDbConnection();
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/github', githubRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
    console.log('Commit scheduler is running in the background');
  });
}

// For serverless function compatibility
export default async (req: any, res: any, next?: any) => {
  await ensureDbConnection();
  return app(req, res, next);
}; 