import express from 'express';
import { 
  createBackdatedCommit,
  getCommitHistory,
  scheduleBulkCommits,
  scheduleCommit,
  getBulkSchedules,
  cancelBulkSchedule,
  cancelCommit
} from '../controllers/streak.controller';
import { protect } from '../middleware/auth.middleware';
import schedulerService from '../services/scheduler.service';
import Commit from '../models/commit.model';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.post('/backdated-commit', createBackdatedCommit);
router.post('/schedule-commit', scheduleCommit);
router.get('/history', getCommitHistory);

// Bulk commit scheduling routes
router.post('/schedule-bulk-commits', scheduleBulkCommits);
router.get('/bulk-schedules', getBulkSchedules);
router.delete('/bulk-schedules/:id', cancelBulkSchedule);

// Cancel a pending commit
router.delete('/commits/:id', cancelCommit);

// Debug route to manually trigger scheduler processing
router.post('/debug/process-scheduled-commits', async (req, res) => {
  try {
    // Count pending commits before processing
    const pendingCommitsBefore = await Commit.find({
      status: 'pending',
      isScheduled: true,
      scheduledTime: { $lte: new Date() }
    }).countDocuments();
    
    // Manually trigger the scheduler
    await schedulerService.processScheduledCommits();
    
    // Count pending commits after processing
    const pendingCommitsAfter = await Commit.find({
      status: 'pending',
      isScheduled: true,
      scheduledTime: { $lte: new Date() }
    }).countDocuments();
    
    res.status(200).json({
      status: 'success',
      message: 'Manually triggered scheduler processing',
      before: pendingCommitsBefore,
      after: pendingCommitsAfter,
      processed: pendingCommitsBefore - pendingCommitsAfter
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to check scheduler status
router.get('/debug/scheduler-status', async (req, res) => {
  try {
    const now = new Date();
    
    // Check for pending commits
    const pendingCommits = await Commit.find({
      status: 'pending',
      isScheduled: true
    }).sort({ scheduledTime: 1 }).limit(10);
    
    // Get scheduler service status
    const schedulerStatus = {
      isRunning: schedulerService.isRunning(),
      currentTime: now.toISOString(),
      pendingCommitsCount: await Commit.countDocuments({
        status: 'pending',
        isScheduled: true
      }),
      dueCommitsCount: await Commit.countDocuments({
        status: 'pending',
        isScheduled: true,
        scheduledTime: { $lte: now }
      }),
      recentCommits: pendingCommits.map(c => ({
        id: c._id?.toString() || '',
        repository: c.repository || '',
        filePath: c.filePath || '',
        scheduledTime: c.scheduledTime?.toISOString(),
        isDue: c.scheduledTime ? c.scheduledTime <= now : false
      }))
    };
    
    res.status(200).json({
      status: 'success',
      data: schedulerStatus
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to manually process a specific commit
router.post('/debug/process-commit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Commit ID is required'
      });
    }
    
    const result = await schedulerService.processCommitById(id);
    
    res.status(result.success ? 200 : 400).json({
      status: result.success ? 'success' : 'error',
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to restart the scheduler
router.post('/debug/restart-scheduler', async (req, res) => {
  try {
    // Get the current status
    const wasRunning = schedulerService.isRunning();
    
    // Stop the scheduler if it's running
    if (wasRunning) {
      schedulerService.stop();
    }
    
    // Re-initialize the scheduler
    schedulerService.init();
    
    // Check if it's running now
    const isRunningNow = schedulerService.isRunning();
    
    res.status(200).json({
      status: 'success',
      message: 'Scheduler restarted',
      wasRunning,
      isRunningNow
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to check and clean temp directories
router.post('/debug/cleanup-temp', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');
    
    // Path to temp directory
    const tempDirPath = path.join(__dirname, '../../temp');
    let existingDirs = [];
    
    if (fs.existsSync(tempDirPath)) {
      // List existing temp directories
      try {
        existingDirs = fs.readdirSync(tempDirPath);
        console.log(`[Debug] Found ${existingDirs.length} temp directories`);
      } catch (readError) {
        console.error(`[Debug] Error reading temp directory: ${readError}`);
      }
    } else {
      // Create temp directory if it doesn't exist
      try {
        fs.mkdirSync(tempDirPath, { recursive: true });
        console.log(`[Debug] Created temp directory: ${tempDirPath}`);
      } catch (mkdirError) {
        console.error(`[Debug] Error creating temp directory: ${mkdirError}`);
      }
    }
    
    // Clean up any existing temp directories
    const cleanupResults = [];
    for (const dir of existingDirs) {
      const fullPath = path.join(tempDirPath, dir);
      try {
        const cleanupCommand = process.platform === 'win32' 
          ? `rmdir /s /q "${fullPath}"` 
          : `rm -rf "${fullPath}"`;
        
        exec(cleanupCommand);
        cleanupResults.push({ dir, status: 'cleanup_initiated' });
      } catch (cleanupError: any) {
        cleanupResults.push({ dir, status: 'cleanup_failed', error: cleanupError.message });
      }
    }
    
    // Check for write permissions on temp directory
    let writePermissionStatus = 'unknown';
    try {
      const testFile = path.join(tempDirPath, 'test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      writePermissionStatus = 'writable';
    } catch (permError: any) {
      writePermissionStatus = `not_writable: ${permError.message}`;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        tempDirPath,
        exists: fs.existsSync(tempDirPath),
        writePermissionStatus,
        dirCount: existingDirs.length,
        cleanupResults
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to fix stuck scheduled commits
router.post('/debug/fix-scheduled-commits', async (req, res) => {
  try {
    // Find all scheduled commits that are stuck in pending status
    const pendingCommits = await Commit.find({
      status: 'pending'
    });
    
    console.log(`[Debug] Found ${pendingCommits.length} pending commits to fix`);
    
    // Fix each commit
    const results = [];
    for (const commit of pendingCommits) {
      try {
        // Make sure isScheduled is true and scheduledTime is set
        const updates: any = { };
        let needsUpdate = false;
        
        if (commit.isScheduled !== true) {
          updates.isScheduled = true;
          needsUpdate = true;
        }
        
        if (!commit.scheduledTime) {
          updates.scheduledTime = commit.dateTime;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          await Commit.updateOne({ _id: commit._id }, { $set: updates });
          results.push({
            // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
            id: commit._id.toString(),
            fixed: true,
            updates
          });
        } else {
          results.push({
            // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
            id: commit._id.toString(),
            fixed: false,
            message: 'No fixes needed'
          });
        }
      } catch (error: any) {
        results.push({
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          id: commit._id.toString(),
          fixed: false,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        total: pendingCommits.length,
        fixed: results.filter(r => r.fixed).length,
        results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to manually process commits by date
router.post('/debug/process-by-date', async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        status: 'error',
        message: 'Date is required in the request body (YYYY-MM-DD format)'
      });
    }
    
    // Ensure date is in the correct format
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }
    
    // Set the date range to cover the entire day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`[Debug] Processing commits scheduled for: ${date}, from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    // Find all commits scheduled for the target date
    const pendingCommits = await Commit.find({
      status: 'pending',
      dateTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    console.log(`[Debug] Found ${pendingCommits.length} pending commits for ${date}`);
    
    // Process each commit
    const results = [];
    let successCount = 0;
    
    for (const commit of pendingCommits) {
      try {
        // Process the commit using the scheduler service
        // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
        const result = await schedulerService.processCommitById(commit._id.toString());
        
        if (result.success) {
          successCount++;
        }
        
        results.push({
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          id: commit._id.toString(),
          repository: commit.repository,
          filePath: commit.filePath,
          result
        });
      } catch (error: any) {
        results.push({
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          id: commit._id.toString(),
          repository: commit.repository,
          filePath: commit.filePath,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        date,
        total: pendingCommits.length,
        success: successCount,
        results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to analyze timezone issues
router.get('/debug/timezone-analysis', async (req, res) => {
  try {
    // Check current server time
    const serverNow = new Date();
    
    // Get some test commits
    const pendingCommits = await Commit.find({
      status: 'pending',
      isScheduled: true
    }).sort({ dateTime: 1 }).limit(10);
    
    // Analyze each commit's timestamps
    const commitAnalysis = pendingCommits.map(commit => {
      // Calculate various time formats
      const dateTime = commit.dateTime;
      const scheduledTime = commit.scheduledTime;
      
      // Normalize date format for comparing
      const dateTimeStr = dateTime ? dateTime.toISOString() : 'not set';
      const scheduledTimeStr = scheduledTime ? scheduledTime.toISOString() : 'not set';
      
      // Check if it's due based on various methods
      const isDueByDirectCompare = scheduledTime && scheduledTime <= serverNow;
      const isDueByISOCompare = scheduledTimeStr && scheduledTimeStr <= serverNow.toISOString();
      const isDueByTimestamp = scheduledTime && scheduledTime.getTime() <= serverNow.getTime();
      
      return {
        // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
        id: commit._id.toString(),
        repository: commit.repository,
        filePath: commit.filePath,
        isScheduled: commit.isScheduled,
        dateTime: dateTimeStr,
        scheduledTime: scheduledTimeStr,
        timeUntilScheduled: scheduledTime ? 
          `${Math.round((scheduledTime.getTime() - serverNow.getTime()) / 1000 / 60)} minutes` : 
          'unknown',
        isDue: {
          byDirectCompare: isDueByDirectCompare,
          byISOCompare: isDueByISOCompare,
          byTimestamp: isDueByTimestamp
        }
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        serverTime: {
          now: serverNow.toISOString(),
          localString: serverNow.toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: serverNow.getTimezoneOffset() // Minutes difference from UTC
        },
        commits: commitAnalysis
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Debug route to process commits with IST timezone adjustment
router.post('/debug/process-with-timezone-offset', async (req, res) => {
  try {
    // Get the IST offset in minutes (UTC+5:30 = 330 minutes)
    const ISTOffsetMinutes = 330; 
    
    // Current time in UTC
    const utcNow = new Date();
    console.log(`[Debug] Current UTC time: ${utcNow.toISOString()}`);
    
    // Adjust time to simulate IST
    const simulatedIST = new Date(utcNow.getTime() + (ISTOffsetMinutes * 60 * 1000));
    console.log(`[Debug] Simulated IST time: ${simulatedIST.toISOString()}`);
    
    // Find all pending scheduled commits
    const pendingCommits = await Commit.find({
      status: 'pending',
      isScheduled: true
    }).sort({ scheduledTime: 1 });
    
    console.log(`[Debug] Found ${pendingCommits.length} total pending scheduled commits`);
    
    // Process commits that are due in IST time
    const dueCommits = pendingCommits.filter(commit => {
      if (!commit.scheduledTime) return false;
      return commit.scheduledTime <= simulatedIST;
    });
    
    console.log(`[Debug] Found ${dueCommits.length} commits that are due in IST time`);
    
    // Process each commit
    const results = [];
    let successCount = 0;
    
    for (const commit of dueCommits) {
      try {
        // Process the commit using the scheduler service
        // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
        const result = await schedulerService.processCommitById(commit._id.toString());
        
        if (result.success) {
          successCount++;
        }
        
        results.push({
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          id: commit._id.toString(),
          repository: commit.repository,
          filePath: commit.filePath,
          scheduledTime: commit.scheduledTime?.toISOString(),
          result
        });
      } catch (error: any) {
        results.push({
          // @ts-ignore - TypeScript doesn't recognize _id type from Mongoose
          id: commit._id.toString(),
          repository: commit.repository,
          filePath: commit.filePath,
          scheduledTime: commit.scheduledTime?.toISOString(),
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        utcTime: utcNow.toISOString(),
        istTime: simulatedIST.toISOString(),
        total: dueCommits.length,
        success: successCount,
        results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router; 