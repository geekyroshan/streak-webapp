import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import Commit from '../models/commit.model';
import AppError from '../utils/appError';

// Create a backdated commit
export const createBackdatedCommit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { 
      repository, 
      repositoryUrl, 
      filePath, 
      commitMessage, 
      dateTime, 
      content 
    } = req.body;
    
    if (!repository || !repositoryUrl || !filePath || !commitMessage || !dateTime) {
      return next(new AppError('Please provide all required fields', 400));
    }
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Create commit record
    const commitRecord = await Commit.create({
      user: user._id,
      repository,
      repositoryUrl,
      filePath,
      commitMessage,
      dateTime: new Date(dateTime),
      status: 'pending'
    });
    
    // Execute the backdated commit
    const githubService = new GitHubService(user.accessToken);
    const result = await githubService.createBackdatedCommit(
      repositoryUrl,
      filePath,
      commitMessage,
      dateTime,
      content || ''
    );
    
    // Update commit record
    commitRecord.status = 'completed';
    await commitRecord.save();
    
    res.status(201).json({
      status: 'success',
      data: {
        commit: commitRecord,
        result
      }
    });
  } catch (error: any) {
    // If there was an error during commit creation, update the record
    if (req.body.commitId) {
      const commitRecord = await Commit.findById(req.body.commitId);
      if (commitRecord) {
        commitRecord.status = 'failed';
        commitRecord.errorMessage = error.message;
        await commitRecord.save();
      }
    }
    
    next(error);
  }
};

// Get user's commit history
export const getCommitHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    const commits = await Commit.find({ user: user._id })
      .sort({ dateTime: -1 });
    
    res.status(200).json({
      status: 'success',
      results: commits.length,
      data: {
        commits
      }
    });
  } catch (error) {
    next(error);
  }
};

// Schedule bulk commits
export const scheduleBulkCommits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { 
      repository, 
      repositoryUrl, 
      filePath, 
      commitMessage, 
      startDate, 
      endDate,
      daysOfWeek, // array of days to commit on (0-6, where 0 is Sunday)
      content
    } = req.body;
    
    if (!repository || !repositoryUrl || !filePath || !commitMessage || !startDate || !endDate) {
      return next(new AppError('Please provide all required fields', 400));
    }
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Generate dates between start and end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      // If daysOfWeek specified, only include those days
      if (daysOfWeek && daysOfWeek.length > 0) {
        if (daysOfWeek.includes(dt.getDay())) {
          dates.push(new Date(dt));
        }
      } else {
        dates.push(new Date(dt));
      }
    }
    
    // Create commit records for each date
    const commitPromises = dates.map(date => {
      return Commit.create({
        user: user._id,
        repository,
        repositoryUrl,
        filePath,
        commitMessage,
        dateTime: date,
        status: 'pending'
      });
    });
    
    const commitRecords = await Promise.all(commitPromises);
    
    // Respond with scheduled commits
    res.status(201).json({
      status: 'success',
      results: commitRecords.length,
      data: {
        commits: commitRecords
      }
    });
    
    // Process each commit asynchronously (no await to prevent blocking)
    const githubService = new GitHubService(user.accessToken);
    
    commitRecords.forEach(async (commitRecord, index) => {
      try {
        // Add a small delay between requests to avoid rate limiting
        setTimeout(async () => {
          await githubService.createBackdatedCommit(
            repositoryUrl,
            filePath,
            commitMessage,
            dates[index].toISOString(),
            content || ''
          );
          
          commitRecord.status = 'completed';
          await commitRecord.save();
        }, index * 5000); // 5 second delay between commits
      } catch (error: any) {
        commitRecord.status = 'failed';
        commitRecord.errorMessage = error.message;
        await commitRecord.save();
      }
    });
    
  } catch (error) {
    next(error);
  }
}; 