import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import AppError from '../utils/appError';
import { format, subDays, formatDistanceToNow } from 'date-fns';

// Get all activities (commits, PRs, issues, reviews, stars)
export const getGithubActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const type = req.query.type as string;
    const repo = req.query.repo as string;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get activities from GitHub
    const activities = await githubService.getActivities(type, repo, skip, limit);
    
    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      repo: activity.repo,
      repoFullName: activity.repoFullName,
      timestamp: activity.timestamp,
      branch: activity.branch,
      url: activity.url
    }));
    
    // Determine if there are more pages
    const hasMore = activities.length === limit;
    
    res.status(200).json({
      status: 'success',
      data: {
        activities: formattedActivities,
        hasMore,
        totalCount: activities.length + (hasMore ? '...' : '')
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get GitHub profile information
export const getGithubProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get user profile from GitHub
    const profileData = await githubService.getUserProfile();
    
    // Get contribution count for the year
    const contributionData = await githubService.getContributionCount();
    
    // Get stars received
    const starsReceived = await githubService.getStarsReceived();
    
    // Format profile for frontend
    const profile = {
      login: profileData.login,
      name: profileData.name || profileData.login,
      avatarUrl: profileData.avatar_url,
      location: profileData.location,
      publicRepos: profileData.public_repos,
      followers: profileData.followers,
      contributions: contributionData.totalContributions || 0,
      starsReceived: starsReceived,
      profileUrl: profileData.html_url
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get contribution statistics
export const getContributionStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Parse query parameters
    const since = req.query.since as string;
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get contribution stats
    const stats = await githubService.getContributionStats(since);
    
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user repositories
export const getRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get repositories from GitHub
    const repositories = await githubService.getRepositories();
    
    res.status(200).json({
      status: 'success',
      data: {
        repositories
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export activity data
export const exportActivityData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Parse query parameters
    const format = req.query.format as 'csv' | 'json' || 'csv';
    const since = req.query.since as string;
    const type = req.query.type as string;
    const repo = req.query.repo as string;
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get activities from GitHub
    const activities = await githubService.getActivities(type, repo);
    
    // Format activities for export
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      repo: activity.repo,
      repoFullName: activity.repoFullName,
      timestamp: activity.timestamp,
      branch: activity.branch,
      url: activity.url
    }));
    
    // Convert to requested format
    let data: string;
    let contentType: string;
    let filename: string;
    
    if (format === 'json') {
      data = JSON.stringify(formattedActivities, null, 2);
      contentType = 'application/json';
      filename = 'github-activity.json';
    } else {
      // Convert to CSV
      const headers = ['id', 'type', 'title', 'repo', 'repoFullName', 'timestamp', 'branch', 'url'];
      const csvRows = [
        headers.join(','),
        ...formattedActivities.map(activity => 
          headers.map(header => {
            const value = activity[header as keyof typeof activity];
            // Handle commas in string values by wrapping in quotes
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value || '';
          }).join(',')
        )
      ];
      
      data = csvRows.join('\n');
      contentType = 'text/csv';
      filename = 'github-activity.csv';
    }
    
    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Send the file data
    res.status(200).send(data);
  } catch (error) {
    next(error);
  }
};

// Get file content from GitHub repository
export const getFileContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, path } = req.query;
    
    if (!owner || !repo || !path) {
      return next(new AppError('Owner, repo, and path are required', 400));
    }
    
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // Get file content
    const fileContent = await githubService.getFileContent(
      owner as string, 
      repo as string, 
      path as string
    );
    
    res.status(200).json({
      status: 'success',
      data: fileContent
    });
  } catch (error) {
    next(error);
  }
};

// Get repository contents (files and directories)
export const getRepoContents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, path } = req.query;
    
    if (!owner || !repo) {
      return next(new AppError('Owner and repo are required', 400));
    }
    
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    // Get GitHub service
    const githubService = new GitHubService(user.accessToken);
    
    // GitHub API endpoint to get contents
    const url = `https://api.github.com/repos/${owner}/${repo}/contents${path ? `/${path}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${user.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return next(new AppError(errorData.message || 'Failed to fetch repository contents', response.status));
    }
    
    const data = await response.json();
    
    // GitHub API returns either an array (for directories) or an object (for files)
    const contents = Array.isArray(data) 
      ? data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          url: item.html_url
        })) 
      : [{
          name: data.name,
          path: data.path,
          type: data.type,
          size: data.size,
          url: data.html_url
        }];
    
    res.status(200).json({
      status: 'success',
      data: contents
    });
  } catch (error) {
    next(error);
  }
}; 