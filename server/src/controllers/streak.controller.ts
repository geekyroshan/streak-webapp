import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import Commit, { BulkCommitSchedule } from '../models/commit.model';
import AppError from '../utils/appError';
import schedulerService from '../services/scheduler.service';

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
    
    console.log(`[Controller] Creating backdated commit for ${dateTime}`);
    
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
    
    try {
      console.log(`[Controller] Executing backdated commit ${commitRecord._id}`);
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
      
      console.log(`[Controller] Backdated commit ${commitRecord._id} completed successfully`);
      
      res.status(201).json({
        status: 'success',
        data: {
          commit: commitRecord,
          result
        }
      });
    } catch (error: any) {
      console.error(`[Controller] Error executing backdated commit: ${error.message}`);
      
      // Update the commit record with error status
      commitRecord.status = 'failed';
      commitRecord.errorMessage = error.message;
      await commitRecord.save();
      
      // Re-throw the error to be caught by the outer catch block
      throw error;
    }
  } catch (error: any) {
    console.error(`[Controller] Error in createBackdatedCommit: ${error.message}`);
    
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

// Schedule a single commit
export const scheduleCommit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { 
      repository, 
      repositoryUrl, 
      filePath, 
      commitMessage, 
      dateTime, 
      content,
      executeNow // Optional parameter to execute immediately
    } = req.body;
    
    if (!repository || !repositoryUrl || !filePath || !commitMessage || !dateTime) {
      return next(new AppError('Please provide all required fields', 400));
    }
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Parse the date properly with timezone awareness
    const parsedDateTime = new Date(dateTime);
    
    // Ensure we're using a valid date
    if (isNaN(parsedDateTime.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }
    
    console.log(`[Controller] Scheduling commit for ${dateTime} (${parsedDateTime.toISOString()}), isScheduled=true`);
    
    // Create a scheduled commit record
    const commitRecord = await Commit.create({
      user: user._id,
      repository,
      repositoryUrl,
      filePath,
      commitMessage,
      dateTime: parsedDateTime,
      scheduledTime: parsedDateTime,
      status: 'pending',
      isScheduled: true // Ensure this is explicitly set to true
    });
    
    console.log(`[Controller] Created scheduled commit ${commitRecord._id} for ${parsedDateTime.toISOString()}, isScheduled=${commitRecord.isScheduled}`);
    
    // If executeNow is true, process the commit immediately
    if (executeNow) {
      try {
        console.log(`[Controller] Executing scheduled commit immediately as requested`);
        // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
        const result = await schedulerService.processCommitById(commitRecord._id.toString());
        
        return res.status(201).json({
          status: 'success',
          data: {
            // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
            commit: await Commit.findById(commitRecord._id), // Get updated commit
            executionResult: result
          }
        });
      } catch (execError: any) {
        console.error(`[Controller] Error executing commit immediately: ${execError.message}`);
        // We'll still return success since the commit was scheduled
      }
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        commit: commitRecord
      }
    });
  } catch (error) {
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
      dateRange,
      timeRange,
      messageTemplate,
      filesToChange,
      frequency,
      customDays,
      repositoryUrl
    } = req.body;
    
    // Validate required fields
    if (!repository || !repository.name || !repository.owner || 
        !dateRange || !dateRange.start || !dateRange.end || 
        !timeRange || (!timeRange.times && (!timeRange.start || !timeRange.end)) || 
        !messageTemplate || !filesToChange || !frequency) {
      return next(new AppError('Please provide all required fields', 400));
    }
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Construct the repository URL if not provided
    const repoUrl = repositoryUrl || `https://github.com/${repository.owner}/${repository.name}`;
    
    // Use the scheduler service to create the bulk commit schedule
    const result = await schedulerService.scheduleBulkCommits(
      user._id.toString(),
      repository.name,
      repoUrl,
      new Date(dateRange.start),
      new Date(dateRange.end),
      timeRange,
      messageTemplate,
      filesToChange,
      frequency,
      customDays
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        bulkSchedule: result.bulkSchedule,
        totalScheduled: result.totalScheduled
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's bulk schedules
export const getBulkSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    const schedules = await schedulerService.getUserBulkSchedules(user._id.toString());
    
    res.status(200).json({
      status: 'success',
      results: schedules.length,
      data: {
        schedules
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel a bulk schedule
export const cancelBulkSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check if the schedule belongs to the user
    const schedule = await BulkCommitSchedule.findOne({ _id: id, user: user._id });
    
    if (!schedule) {
      return next(new AppError('Bulk schedule not found or not owned by you', 404));
    }
    
    await schedulerService.cancelBulkSchedule(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Bulk schedule cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Cancel a pending commit
export const cancelCommit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check if the commit belongs to the user
    const commit = await Commit.findOne({ _id: id, user: user._id });
    
    if (!commit) {
      return next(new AppError('Commit not found or not owned by you', 404));
    }
    
    // Only pending commits can be cancelled
    if (commit.status !== 'pending') {
      return next(new AppError('Only pending commits can be cancelled', 400));
    }
    
    commit.status = 'failed';
    commit.errorMessage = 'Cancelled by user';
    await commit.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Commit cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Clean up all pending and scheduled commits
export const cleanupPendingCommits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    // Get count before cleanup for reporting
    const pendingCountBefore = await Commit.countDocuments({ 
      user: user._id, 
      status: 'pending'
    });
    
    const scheduledCountBefore = await Commit.countDocuments({
      user: user._id,
      isScheduled: true
    });
    
    // Delete all pending commits for this user
    const deleteResult = await Commit.deleteMany({
      user: user._id,
      status: 'pending'
    });
    
    // Also clean up any bulk schedules that are still active
    const bulkScheduleResult = await BulkCommitSchedule.updateMany(
      { user: user._id, status: 'active' },
      { status: 'cancelled' }
    );
    
    console.log(`[Controller] Cleaned up ${deleteResult.deletedCount} pending commits for user ${user._id}`);
    console.log(`[Controller] Updated ${bulkScheduleResult.modifiedCount} active bulk schedules to cancelled`);
    
    res.status(200).json({
      status: 'success',
      message: 'Cleanup completed successfully',
      data: {
        pendingCommitsBefore: pendingCountBefore,
        scheduledCommitsBefore: scheduledCountBefore,
        commitsDeleted: deleteResult.deletedCount,
        bulkSchedulesCancelled: bulkScheduleResult.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
}; 