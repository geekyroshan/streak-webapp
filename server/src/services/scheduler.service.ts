import cron from 'node-cron';
import Commit from '../models/commit.model';
import { BulkCommitSchedule } from '../models/commit.model';
import { GitHubService } from './github.service';
import User from '../models/user.model';
import mongoose from 'mongoose';

/**
 * Generate a random time within a specified range for a given date
 */
function generateRandomTimeInRange(date: Date, startTime: string, endTime: string): Date {
  // Parse start and end times
  const parseTimeString = (timeString: string): { hours: number, minutes: number } => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  };
  
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);
  
  // Calculate start and end minutes since midnight
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  
  // Handle case where end time is earlier than start time (next day)
  const totalMinutes = endMinutes > startMinutes 
    ? endMinutes - startMinutes 
    : (24 * 60 - startMinutes) + endMinutes;
  
  // Generate random number of minutes to add to start time
  const randomMinutes = Math.floor(Math.random() * totalMinutes);
  
  // Create a new date object to avoid modifying the original
  const scheduledTime = new Date(date);
  
  // Set the hours and minutes
  const finalMinutes = (startMinutes + randomMinutes) % (24 * 60);
  const hours = Math.floor(finalMinutes / 60);
  const minutes = finalMinutes % 60;
  
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  return scheduledTime;
}

class SchedulerService {
  private schedulerJob: cron.ScheduledTask | null = null;

  constructor() {
    // Initialize the scheduler
    this.init();
  }

  /**
   * Initialize the scheduler
   */
  init(): void {
    console.log('Initializing commit scheduler service...');
    
    // Run every minute to check for scheduled commits
    this.schedulerJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledCommits();
    });
    
    console.log('Commit scheduler service initialized');
  }

  /**
   * Process all scheduled commits that are due
   */
  async processScheduledCommits(): Promise<void> {
    try {
      const now = new Date();
      console.log(`[Scheduler] Starting scheduled commit processing at ${now.toISOString()}`);
      
      // Get all pending commits with isScheduled flag, regardless of scheduledTime first
      const allPendingScheduledCommits = await Commit.find({
        status: 'pending',
        isScheduled: true
      }).sort({ scheduledTime: 1 }).limit(20);
      
      console.log(`[Scheduler] Found ${allPendingScheduledCommits.length} total pending scheduled commits`);
      
      // Include timezone adjustment for IST (UTC+5:30)
      const ISTOffsetMinutes = 330; // 5 hours and 30 minutes
      const adjustedTimeForIST = new Date(now.getTime() + (ISTOffsetMinutes * 60 * 1000));
      console.log(`[Scheduler] Current UTC time: ${now.toISOString()}, Adjusted for IST: ${adjustedTimeForIST.toISOString()}`);
      
      // Filter due commits based on the current time - with timezone awareness
      // Use BOTH the UTC now and the IST adjusted time for maximum compatibility
      const pendingCommits = allPendingScheduledCommits.filter(commit => {
        if (!commit.scheduledTime) return false;
        
        // Convert times to UTC strings for comparison
        const nowUtc = now.toISOString();
        const scheduledTimeUtc = commit.scheduledTime.toISOString();
        
        // Check if due by UTC time
        const isDueByUtc = scheduledTimeUtc <= nowUtc;
        
        // Check if due by IST adjusted time
        const isDueByIST = commit.scheduledTime <= adjustedTimeForIST;
        
        // Log the comparison to help with debugging
        console.log(`[Scheduler] Commit ${commit._id}: Scheduled for ${scheduledTimeUtc}, Now UTC: ${nowUtc}, Now IST: ${adjustedTimeForIST.toISOString()}`);
        console.log(`[Scheduler] Commit ${commit._id}: Is due by UTC: ${isDueByUtc}, Is due by IST: ${isDueByIST}`);
        
        // Consider due if either check passes
        return isDueByUtc || isDueByIST;
      });
      
      console.log(`[Scheduler] After timezone-aware filtering, found ${pendingCommits.length} due commits to process`);
      
      // Log overall query results for debugging
      const allPendingCount = await Commit.countDocuments({ status: 'pending' });
      const scheduledCount = await Commit.countDocuments({ isScheduled: true });
      console.log(`[Scheduler] Debug stats - All pending: ${allPendingCount}, isScheduled: ${scheduledCount}`);
      
      if (pendingCommits.length === 0) {
        console.log('[Scheduler] No pending commits to process');
        return;
      }
      
      // Log details of commits to be processed
      pendingCommits.forEach((commit, index) => {
        console.log(`[Scheduler] Commit #${index + 1} - ID: ${commit._id}, Repository: ${commit.repository}, Path: ${commit.filePath}, DateTime: ${commit.dateTime.toISOString()}, ScheduledTime: ${commit.scheduledTime?.toISOString()}`);
      });
      
      // Process each commit
      for (const commit of pendingCommits) {
        try {
          console.log(`[Scheduler] Processing commit ${commit._id}`);
          
          // Find the user who owns this commit to get their access token
          const user = await User.findById(commit.user);
          
          if (!user) {
            console.error(`[Scheduler] User not found for commit ${commit._id}, user ID: ${commit.user}`);
            commit.status = 'failed';
            commit.errorMessage = 'User not found';
            await commit.save();
            continue;
          }
          
          if (!user.accessToken) {
            console.error(`[Scheduler] No access token found for user ${user._id}`);
            commit.status = 'failed';
            commit.errorMessage = 'User access token not found';
            await commit.save();
            continue;
          }
          
          console.log(`[Scheduler] Found user ${user._id} with access token for commit ${commit._id}`);
          
          // Create GitHub service with user's token
          const githubService = new GitHubService(user.accessToken);
          
          // Mark commit as being processed
          commit.processedAt = new Date();
          await commit.save();
          console.log(`[Scheduler] Marked commit ${commit._id} as being processed at ${commit.processedAt.toISOString()}`);
          
          // Execute the commit
          console.log(`[Scheduler] Executing commit to GitHub: ${commit.repositoryUrl}, path: ${commit.filePath}`);
          const result = await githubService.createBackdatedCommit(
            commit.repositoryUrl,
            commit.filePath,
            commit.commitMessage,
            commit.dateTime.toISOString(),
            '' // Content will be generated by the GitHub service
          );
          
          console.log(`[Scheduler] Successfully executed commit ${commit._id}, GitHub result:`, result);
          
          // Update commit status
          commit.status = 'completed';
          await commit.save();
          
          console.log(`[Scheduler] Successfully processed commit ${commit._id}`);
        } catch (error: any) {
          console.error(`[Scheduler] Error processing commit ${commit._id}:`, error);
          console.error(`[Scheduler] Error stack:`, error.stack);
          
          // Update commit with error
          commit.status = 'failed';
          commit.errorMessage = error.message || 'Unknown error during commit processing';
          await commit.save();
          
          console.error(`[Scheduler] Marked commit ${commit._id} as failed with error: ${commit.errorMessage}`);
        }
      }
      
      console.log(`[Scheduler] Completed scheduled commit processing at ${new Date().toISOString()}`);
      
      // Check if any bulk schedules need to be marked as completed
      await this.updateBulkScheduleStatuses();
      
    } catch (error: any) {
      console.error('[Scheduler] Error in processScheduledCommits:', error);
      console.error('[Scheduler] Error stack:', error.stack);
    }
  }
  
  /**
   * Update the status of bulk schedules based on their commits
   */
  async updateBulkScheduleStatuses(): Promise<void> {
    try {
      // Find active bulk schedules
      const activeSchedules = await BulkCommitSchedule.find({ 
        status: 'active'
      });
      
      for (const schedule of activeSchedules) {
        // Check if all commits for this schedule are completed or failed
        const pendingCommits = await Commit.countDocuments({
          _id: { $in: schedule.commits },
          status: 'pending'
        });
        
        if (pendingCommits === 0) {
          // All commits have been processed
          schedule.status = 'completed';
          await schedule.save();
          console.log(`Bulk schedule ${schedule._id} marked as completed`);
        }
      }
    } catch (error) {
      console.error('Error in updateBulkScheduleStatuses:', error);
    }
  }
  
  /**
   * Generate scheduled commit dates based on criteria
   */
  generateCommitDates(
    startDate: Date,
    endDate: Date,
    frequency: 'daily' | 'weekdays' | 'weekends' | 'custom',
    customDays?: number[]
  ): Date[] {
    const dates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure dates are set to midnight for consistent comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
      
      let includeDate = false;
      
      switch (frequency) {
        case 'daily':
          includeDate = true;
          break;
        case 'weekdays':
          // Monday-Friday (1-5)
          includeDate = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'weekends':
          // Saturday and Sunday (0 and 6)
          includeDate = dayOfWeek === 0 || dayOfWeek === 6;
          break;
        case 'custom':
          // Use custom days array
          includeDate = customDays ? customDays.includes(dayOfWeek) : false;
          break;
      }
      
      if (includeDate) {
        dates.push(new Date(date));
      }
    }
    
    return dates;
  }
  
  /**
   * Schedule bulk commits
   */
  async scheduleBulkCommits(
    userId: string,
    repository: string,
    repositoryUrl: string,
    startDate: Date,
    endDate: Date,
    timeRange: { start?: string, end?: string, times?: string[] },
    messageTemplates: string[],
    filesToChange: string[],
    frequency: 'daily' | 'weekdays' | 'weekends' | 'custom',
    customDays?: number[]
  ): Promise<any> {
    try {
      // Generate dates based on frequency and custom days
      const commitDates = this.generateCommitDates(
        startDate,
        endDate,
        frequency,
        customDays
      );
      
      if (commitDates.length === 0) {
        throw new Error('No valid dates found for the given criteria');
      }
      
      // Create a bulk schedule record
      const bulkSchedule = await BulkCommitSchedule.create({
        user: userId,
        repository,
        repositoryUrl,
        startDate,
        endDate,
        timeRange,
        messageTemplates,
        filesToChange,
        frequency,
        customDays,
        status: 'active',
        commits: []
      });
      
      // Create individual commit records for each date
      const commitPromises = commitDates.map(async (date) => {
        // Generate a time based on the timeRange configuration
        let scheduledTime: Date;
        
        if (timeRange.times && timeRange.times.length > 0) {
          // Select a random time from the array of times
          const randomTimeIndex = Math.floor(Math.random() * timeRange.times.length);
          const randomTime = timeRange.times[randomTimeIndex];
          scheduledTime = this.applyTimeToDate(date, randomTime);
        } else if (timeRange.start && timeRange.end) {
          // Generate random time between the specified range
          scheduledTime = generateRandomTimeInRange(date, timeRange.start, timeRange.end);
        } else {
          // Fallback to noon
          scheduledTime = new Date(date);
          scheduledTime.setHours(12, 0, 0, 0);
        }
        
        // Select a random message template from the array
        const randomTemplateIndex = Math.floor(Math.random() * messageTemplates.length);
        const messageTemplate = messageTemplates[randomTemplateIndex];
        
        // Generate a commit message from the template
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const commitMessage = messageTemplate
          .replace('{date}', formattedDate)
          .replace('{random}', Math.random().toString(36).substring(2, 8));
        
        // Select a random file from the list to change
        const randomFileIndex = Math.floor(Math.random() * filesToChange.length);
        const filePath = filesToChange[randomFileIndex];
        
        // Create the commit record
        const commit = await Commit.create({
          user: userId,
          repository,
          repositoryUrl,
          filePath,
          commitMessage,
          dateTime: date,
          scheduledTime,
          status: 'pending',
          // @ts-ignore - Type issue with mongoose model
          bulkScheduleId: bulkSchedule._id.toString(),
          isScheduled: true
        });
        
        return commit;
      });
      
      const commits = await Promise.all(commitPromises);
      
      // Add commits to the bulk schedule
      // @ts-ignore - Type issue with mongoose model
      bulkSchedule.commits = commits.map(commit => commit._id);
      await bulkSchedule.save();
      
      return {
        bulkSchedule,
        commits,
        totalScheduled: commits.length
      };
    } catch (error: any) {
      console.error('Error in scheduleBulkCommits:', error);
      throw error;
    }
  }
  
  /**
   * Apply a time string to a date
   */
  private applyTimeToDate(date: Date, timeStr: string): Date {
    const result = new Date(date);
    
    // Parse the time string (format: HH:MM:SS)
    const [hours, minutes, seconds] = timeStr.split(':').map(part => parseInt(part, 10));
    
    result.setHours(hours || 0);
    result.setMinutes(minutes || 0);
    result.setSeconds(seconds || 0);
    result.setMilliseconds(0);
    
    return result;
  }
  
  /**
   * Cancel a bulk schedule and all its pending commits
   */
  async cancelBulkSchedule(scheduleId: string): Promise<void> {
    try {
      const schedule = await BulkCommitSchedule.findById(scheduleId);
      
      if (!schedule) {
        throw new Error('Bulk schedule not found');
      }
      
      // Update schedule status
      schedule.status = 'cancelled';
      await schedule.save();
      
      // Cancel all pending commits
      await Commit.updateMany(
        { 
          _id: { $in: schedule.commits },
          status: 'pending'
        },
        {
          $set: {
            status: 'failed',
            errorMessage: 'Cancelled by user'
          }
        }
      );
      
      console.log(`Bulk schedule ${scheduleId} cancelled`);
    } catch (error) {
      console.error('Error in cancelBulkSchedule:', error);
      throw error;
    }
  }
  
  /**
   * Get all bulk schedules for a user
   */
  async getUserBulkSchedules(userId: string): Promise<any[]> {
    try {
      const schedules = await BulkCommitSchedule.find({ user: userId })
        .sort({ createdAt: -1 });
      
      return schedules;
    } catch (error) {
      console.error('Error in getUserBulkSchedules:', error);
      throw error;
    }
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.schedulerJob) {
      this.schedulerJob.stop();
      this.schedulerJob = null;
      console.log('Commit scheduler stopped');
    }
  }

  /**
   * Check if the scheduler is running
   */
  isRunning(): boolean {
    return this.schedulerJob !== null;
  }

  /**
   * Process a specific commit by ID
   */
  async processCommitById(commitId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[Scheduler] Manually processing commit ID: ${commitId}`);
      
      // Find the commit
      const commit = await Commit.findById(commitId);
      
      if (!commit) {
        console.error(`[Scheduler] Commit not found: ${commitId}`);
        return { success: false, message: 'Commit not found' };
      }
      
      if (commit.status !== 'pending') {
        console.log(`[Scheduler] Commit ${commitId} is not pending (current status: ${commit.status})`);
        return { success: false, message: `Commit is already ${commit.status}` };
      }
      
      console.log(`[Scheduler] Found commit ${commitId} for repository ${commit.repository}`);
      
      // Find the user who owns this commit to get their access token
      const user = await User.findById(commit.user);
      
      if (!user) {
        console.error(`[Scheduler] User not found for commit ${commit._id}, user ID: ${commit.user}`);
        commit.status = 'failed';
        commit.errorMessage = 'User not found';
        await commit.save();
        return { success: false, message: 'User not found' };
      }
      
      if (!user.accessToken) {
        console.error(`[Scheduler] No access token found for user ${user._id}`);
        commit.status = 'failed';
        commit.errorMessage = 'User access token not found';
        await commit.save();
        return { success: false, message: 'User access token not found' };
      }
      
      console.log(`[Scheduler] Found user ${user._id} with access token for commit ${commit._id}`);
      
      // Create GitHub service with user's token
      const githubService = new GitHubService(user.accessToken);
      
      // Mark commit as being processed
      commit.processedAt = new Date();
      await commit.save();
      console.log(`[Scheduler] Marked commit ${commit._id} as being processed at ${commit.processedAt.toISOString()}`);
      
      // Execute the commit
      console.log(`[Scheduler] Executing commit to GitHub: ${commit.repositoryUrl}, path: ${commit.filePath}`);
      const result = await githubService.createBackdatedCommit(
        commit.repositoryUrl,
        commit.filePath,
        commit.commitMessage,
        commit.dateTime.toISOString(),
        '' // Content will be generated by the GitHub service
      );
      
      console.log(`[Scheduler] Successfully executed commit ${commit._id}`);
      
      // Update commit status
      commit.status = 'completed';
      await commit.save();
      
      return { success: true, message: 'Commit processed successfully' };
    } catch (error: any) {
      console.error(`[Scheduler] Error manually processing commit ${commitId}:`, error);
      console.error(`[Scheduler] Error stack:`, error.stack);
      return { 
        success: false, 
        message: `Error processing commit: ${error.message}` 
      };
    }
  }

  /**
   * Get suggested file paths that are typically not in .gitignore
   */
  getSuggestedFilePaths(): string[] {
    return [
      'README.md',
      'CONTRIBUTING.md',
      'docs/README.md',
      'documentation/README.md',
      'docs/index.md',
      'docs/guide.md',
      'docs/usage.md',
      'docs/examples.md',
      'LICENSE',
      'CHANGELOG.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE.md',
      '.github/workflows/config.yml'
    ];
  }
}

// Create a singleton instance
const schedulerService = new SchedulerService();

export default schedulerService; 