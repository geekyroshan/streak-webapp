import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import AppError from '../utils/appError';

// Helper to analyze contributions and calculate streak statistics
const analyzeContributions = (contributionData: any) => {
  // Handle empty data
  if (!contributionData || 
      (!contributionData.contributions && !contributionData.events)) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      contributionsByDate: {},
      dayOfWeekActivity: [0, 0, 0, 0, 0, 0, 0],
      gaps: []
    };
  }
  
  const { contributions, totalContributions, events } = contributionData;
  
  // Build contributions by date map
  const contributionsByDate: Record<string, any> = {};
  
  // Add data from GraphQL contributions
  if (contributions) {
    contributions.forEach((day: any) => {
      contributionsByDate[day.date] = {
        count: day.count,
        color: day.color,
        events: day.events || []
      };
    });
  }
  
  // Make sure to include any additional events not in the GraphQL data
  if (events) {
    events.forEach((event: any) => {
      if (!event.created_at) return;
      
      const date = event.created_at.split('T')[0];
      if (!contributionsByDate[date]) {
        contributionsByDate[date] = {
          count: 0,
          color: '#ebedf0',
          events: []
        };
      }
      
      // Only add the event if it's not already included
      const eventIds = new Set(contributionsByDate[date].events.map((e: any) => e.id));
      if (!eventIds.has(event.id)) {
        contributionsByDate[date].events.push(event);
        contributionsByDate[date].count += 1;
      }
    });
  }
  
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
  const hasContributionToday = !!contributionsByDate[today]?.count;
  
  // Calculate streaks
  for (let i = dates.length - 1; i >= 0; i--) {
    const currentDate = new Date(dates[i]);
    const contributionCount = contributionsByDate[dates[i]]?.count || 0;
    
    // Skip dates with no contributions
    if (contributionCount === 0) continue;
    
    // If this is the first day or consecutive to previous day
    if (currentStreak === 0 || isConsecutiveDay(new Date(dates[i+1]), currentDate)) {
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
    dayOfWeekActivity[dayOfWeek] += contributionsByDate[date]?.count || 0;
  });
  
  // Find missing days (gaps) in the last 30 days
  const gaps = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (let d = new Date(today); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (!contributionsByDate[dateStr] || contributionsByDate[dateStr].count === 0) {
      gaps.push(dateStr);
    }
  }
  
  return {
    currentStreak: hasContributionToday ? currentStreak : 0,
    longestStreak,
    longestStreakStart,
    longestStreakEnd,
    totalContributions: totalContributions || dates.reduce((sum, date) => sum + (contributionsByDate[date]?.count || 0), 0),
    contributionsByDate,
    dayOfWeekActivity,
    gaps
  };
};

// Helper to check if two dates are consecutive
const isConsecutiveDay = (date1: Date, date2: Date) => {
  if (!date1 || !date2) return false;
  
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
    const contributionData = await githubService.getUserContributions(user.username, since as string);
    
    // Analyze contribution data
    const analysis = analyzeContributions(contributionData);
    
    res.status(200).json({
      status: 'success',
      data: {
        events: contributionData.events,
        contributions: contributionData.contributions,
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
    const contributionData = await githubService.getUserContributions(user.username);
    
    // Analyze contribution data
    const analysis = analyzeContributions(contributionData);
    
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