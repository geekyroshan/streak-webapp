import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import AppError from '../utils/appError';

// Helper to analyze contributions and calculate streak statistics
const analyzeContributions = (events: any[]) => {
  // Group events by date
  const contributionsByDate = events.reduce((acc: Record<string, any[]>, event: any) => {
    const date = event.created_at.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});
  
  // Get dates sorted
  const dates = Object.keys(contributionsByDate).sort();
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let streakStart = null;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  
  // Check if today has contributions
  const today = new Date().toISOString().split('T')[0];
  const hasContributionToday = !!contributionsByDate[today];
  
  // Calculate streaks
  for (let i = dates.length - 1; i >= 0; i--) {
    const currentDate = new Date(dates[i]);
    
    // If this is the first day or consecutive to previous day
    if (i === dates.length - 1 || isConsecutiveDay(new Date(dates[i + 1]), currentDate)) {
      currentStreak++;
      
      if (currentStreak === 1) {
        streakStart = dates[i];
      }
      
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = streakStart;
        longestStreakEnd = dates[i];
      }
    } else {
      // Break in streak
      currentStreak = 1;
      streakStart = dates[i];
    }
  }
  
  // Calculate activity by day of week
  const dayOfWeekActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  
  dates.forEach(date => {
    const dayOfWeek = new Date(date).getDay();
    dayOfWeekActivity[dayOfWeek] += contributionsByDate[date].length;
  });
  
  // Find missing days (gaps) in the last 30 days
  const gaps = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (let d = new Date(today); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (!contributionsByDate[dateStr]) {
      gaps.push(dateStr);
    }
  }
  
  return {
    currentStreak: hasContributionToday ? currentStreak : 0,
    longestStreak,
    longestStreakStart,
    longestStreakEnd,
    totalContributions: events.length,
    contributionsByDate,
    dayOfWeekActivity,
    gaps
  };
};

// Helper to check if two dates are consecutive
const isConsecutiveDay = (date1: Date, date2: Date) => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

// Get user contribution data
export const getUserContributions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { since } = req.query;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    const githubService = new GitHubService(user.accessToken);
    const eventsData = await githubService.getUserContributions(user.username, since as string);
    
    // Analyze contribution data
    const analysis = analyzeContributions(eventsData);
    
    res.status(200).json({
      status: 'success',
      data: {
        events: eventsData,
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get streak statistics for a user
export const getStreakStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    const githubService = new GitHubService(user.accessToken);
    const eventsData = await githubService.getUserContributions(user.username);
    
    // Analyze contribution data
    const analysis = analyzeContributions(eventsData);
    
    res.status(200).json({
      status: 'success',
      data: {
        currentStreak: analysis.currentStreak,
        longestStreak: analysis.longestStreak,
        totalContributions: analysis.totalContributions,
        dayOfWeekActivity: analysis.dayOfWeekActivity
      }
    });
  } catch (error) {
    next(error);
  }
}; 