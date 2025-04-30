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
connectDatabase();

// Type assertion for Express to fix TypeScript errors
const expressApp = express as any;
const app = expressApp();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    // Add production origins
    'https://streak-web-app.vercel.app',
    'https://streak-web-app-geekyroshan.vercel.app',
    // Dynamically allow the deployment URL from environment
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean), // Filter out null values
  credentials: true
}));
app.use((expressApp as any).json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/github', githubRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Commit scheduler is running in the background');
});

export default app; 