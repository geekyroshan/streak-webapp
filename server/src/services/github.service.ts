import axios from 'axios';
import { githubConfig } from '../config/github';
import AppError from '../utils/appError';
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

export class GitHubService {
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }

  /**
   * Get authenticated user profile
   */
  async getUserProfile() {
    try {
      const response = await axios.get(`${githubConfig.apiUrl}/user`, {
        headers: {
          Authorization: `token ${this.token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch user profile',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get user repositories
   */
  async getRepositories() {
    try {
      const response = await axios.get(`${githubConfig.apiUrl}/user/repos?per_page=100`, {
        headers: {
          Authorization: `token ${this.token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch repositories',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string) {
    try {
      const response = await axios.get(`${githubConfig.apiUrl}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${this.token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch repository details',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get user contribution data
   * Uses both REST API (events) and GraphQL API (contribution calendar)
   * for comprehensive contribution data
   */
  async getUserContributions(username: string, since?: string) {
    const sinceDate = since || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // 1. Get user events from REST API (public events like commits, PRs, issues)
      const eventsResponse = await axios.get(
        `${githubConfig.apiUrl}/users/${username}/events?per_page=100`, 
        {
          headers: {
            Authorization: `token ${this.token}`
          }
        }
      );
      
      // 2. Get contribution calendar data from GraphQL API (gives complete contribution history)
      const contributionData = await this.getContributionCalendar(username);
      
      // 3. Combine the data
      const combinedData = this.mergeContributionData(eventsResponse.data, contributionData);
      
      return combinedData;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch user contributions',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get user contribution calendar using GraphQL API
   * This provides better contribution data than the REST API
   */
  private async getContributionCalendar(username: string) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    color
                  }
                }
              }
            }
          }
        }
      `;
      
      const variables = { username };
      
      const response = await axios.post(
        'https://api.github.com/graphql',
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.errors) {
        throw new AppError(
          `GraphQL Error: ${response.data.errors[0].message}`,
          400
        );
      }
      
      return response.data.data.user.contributionsCollection.contributionCalendar;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch contribution calendar',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Merge REST API events with GraphQL contribution calendar data
   */
  private mergeContributionData(events: any[], calendarData: any) {
    // Extract contribution days from calendar weeks
    const contributionDays: any[] = [];
    
    if (calendarData && calendarData.weeks) {
      calendarData.weeks.forEach((week: any) => {
        if (week.contributionDays) {
          week.contributionDays.forEach((day: any) => {
            contributionDays.push({
              date: day.date,
              count: day.contributionCount,
              color: day.color
            });
          });
        }
      });
    }
    
    // Convert events to a date-based map for easy lookup
    const eventsByDate: Record<string, any[]> = {};
    events.forEach(event => {
      if (event.created_at) {
        const date = event.created_at.split('T')[0];
        if (!eventsByDate[date]) {
          eventsByDate[date] = [];
        }
        eventsByDate[date].push(event);
      }
    });
    
    // Add event details to contribution days
    contributionDays.forEach(day => {
      day.events = eventsByDate[day.date] || [];
    });
    
    // Add any events that might not be in the contribution calendar
    const calendarDates = new Set(contributionDays.map(day => day.date));
    Object.keys(eventsByDate).forEach(date => {
      if (!calendarDates.has(date)) {
        contributionDays.push({
          date,
          count: eventsByDate[date].length,
          color: '#ebedf0', // Default color
          events: eventsByDate[date]
        });
      }
    });
    
    // Sort by date (newest first)
    contributionDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Combine both data sources
    return {
      contributions: contributionDays,
      totalContributions: calendarData?.totalContributions || events.length,
      events
    };
  }

  /**
   * Get user's verified emails from GitHub
   */
  async getUserEmails() {
    try {
      const response = await axios.get(`${githubConfig.apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${this.token}`
        }
      });
      return response.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch user emails',
        error.response?.status || 500
      );
    }
  }

  /**
   * Create a backdated commit on a repository
   */
  async createBackdatedCommit(
    repoUrl: string,
    filePath: string,
    commitMessage: string,
    dateTime: string,
    content: string
  ) {
    try {
      console.log(`[GitHub] Starting backdated commit process for ${repoUrl}, filePath: ${filePath}`);
      console.log(`[GitHub] Commit message: "${commitMessage}", dateTime: ${dateTime}`);
      
      // Get the user's GitHub profile
      const userProfile = await this.getUserProfile();
      
      // Get the user's verified emails to ensure commits are counted
      const userEmails = await this.getUserEmails();
      console.log(`[GitHub] Found ${userEmails.length} email addresses for user`);
      
      // Find primary email or a verified email
      let userEmail;
      const primaryEmail = userEmails.find((email: any) => email.primary && email.verified);
      const verifiedEmail = userEmails.find((email: any) => email.verified);
      
      if (primaryEmail) {
        userEmail = primaryEmail.email;
        console.log(`[GitHub] Using primary verified email: ${userEmail}`);
      } else if (verifiedEmail) {
        userEmail = verifiedEmail.email;
        console.log(`[GitHub] Using verified email: ${userEmail}`);
      } else {
        // Fallback to profile email or GitHub's no-reply email format
        userEmail = userProfile.email || `${userProfile.id}+${userProfile.login}@users.noreply.github.com`;
        console.log(`[GitHub] Using fallback email: ${userEmail}`);
      }
      
      // Create a temporary directory for git operations
      const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
      console.log(`[GitHub] Creating temp directory: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      const git = simpleGit(tempDir);
      
      // Ensure the repository URL is in the correct format for cloning
      // If it's not a full git URL, construct it
      let cloneUrl = repoUrl;
      if (!repoUrl.endsWith('.git') && !repoUrl.includes('@')) {
        // Extract owner and repo name from URL
        let owner, repo;
        
        if (repoUrl.includes('github.com')) {
          const urlParts = repoUrl.split('/');
          // Handle both https://github.com/owner/repo and github.com/owner/repo
          const ownerIndex = urlParts.indexOf('github.com') + 1;
          if (ownerIndex < urlParts.length) {
            owner = urlParts[ownerIndex];
            repo = urlParts[ownerIndex + 1]?.replace('.git', '');
          }
        }
        
        if (!owner || !repo) {
          // Try to extract from simple owner/repo format
          const parts = repoUrl.split('/');
          if (parts.length >= 2) {
            owner = parts[parts.length - 2];
            repo = parts[parts.length - 1].replace('.git', '');
          }
        }
        
        if (!owner || !repo) {
          throw new AppError('Invalid repository URL format', 400);
        }
        
        // Construct the Git URL using the token for authentication
        cloneUrl = `https://${this.token}@github.com/${owner}/${repo}.git`;
        console.log(`[GitHub] Constructed clone URL for ${owner}/${repo}`);
      } else if (repoUrl.startsWith('https://github.com/')) {
        // Convert HTTPS URL to authenticated URL
        cloneUrl = repoUrl.replace('https://github.com/', `https://${this.token}@github.com/`);
        console.log('[GitHub] Converted HTTPS URL to authenticated URL');
      }
      
      console.log(`[GitHub] Cloning repository to ${tempDir}`);
      await git.clone(cloneUrl, tempDir);
      console.log('[GitHub] Clone successful');
      
      // Determine the full path to the file
      const fullFilePath = path.join(tempDir, filePath);
      const fileDir = path.dirname(fullFilePath);
      
      // Ensure the directory exists
      console.log(`[GitHub] Creating directory if needed: ${fileDir}`);
      fs.mkdirSync(fileDir, { recursive: true });
      
      // Determine if file exists and get current content if it does
      let currentContent = '';
      const fileExists = fs.existsSync(fullFilePath);
      
      if (fileExists) {
        console.log(`[GitHub] File exists: ${filePath}`);
        currentContent = fs.readFileSync(fullFilePath, 'utf8');
      } else {
        console.log(`[GitHub] File does not exist: ${filePath}, will create it`);
      }
      
      // If no content was provided, generate something based on current content or create new
      if (!content) {
        if (fileExists) {
          // Modify existing content
          const timestamp = new Date().toISOString();
          if (filePath.endsWith('.md')) {
            content = `${currentContent}\n\n<!-- Updated: ${timestamp} -->\n`;
          } else if (filePath.endsWith('.txt')) {
            content = `${currentContent}\n\nUpdated: ${timestamp}\n`;
          } else if (filePath.endsWith('.html')) {
            content = `${currentContent}\n\n<!-- Updated: ${timestamp} -->\n`;
          } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            content = `${currentContent}\n\n// Updated: ${timestamp}\n`;
          } else {
            content = `${currentContent}\n\n// Updated: ${timestamp}\n`;
          }
        } else {
          // Create new file with default content
          const timestamp = new Date().toISOString();
          if (filePath.endsWith('.md')) {
            content = `# Automated Update\n\nThis file was created or updated by the GitHub Streak Manager.\n\n<!-- Created: ${timestamp} -->\n`;
          } else if (filePath.endsWith('.txt')) {
            content = `Automated Update\n\nThis file was created or updated by the GitHub Streak Manager.\n\nCreated: ${timestamp}\n`;
          } else if (filePath.endsWith('.html')) {
            content = `<!-- Automated Update -->\n<!-- This file was created or updated by the GitHub Streak Manager -->\n<!-- Created: ${timestamp} -->\n`;
          } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            content = `/**\n * Automated Update\n * This file was created or updated by the GitHub Streak Manager.\n * Created: ${timestamp}\n */\n`;
          } else {
            content = `// Automated Update\n// This file was created or updated by the GitHub Streak Manager.\n// Created: ${timestamp}\n`;
          }
        }
      }
      
      console.log(`[GitHub] Writing content to file: ${fullFilePath}`);
      fs.writeFileSync(fullFilePath, content);
      
      // Configure git with the user's name and email for the commit to ensure it counts for GitHub contributions
      console.log('[GitHub] Configuring git user for commit');
      await git.addConfig('user.name', userProfile.name || userProfile.login);
      await git.addConfig('user.email', userEmail);
      
      // Stage the changes - use -f flag to force add even if the file is in .gitignore
      console.log(`[GitHub] Staging changes for file: ${filePath}`);
      try {
        await git.add(filePath);
      } catch (addError: any) {
        // If the file is ignored by .gitignore, try force adding it
        if (addError.message && addError.message.includes('ignored by one of your .gitignore files')) {
          console.log(`[GitHub] File is in .gitignore, attempting to force add with -f flag`);
          await git.raw(['add', '-f', filePath]);
        } else {
          throw addError;
        }
      }
      
      // Set environment variables for backdating
      console.log(`[GitHub] Setting commit date to: ${dateTime}`);
      const env = {
        GIT_AUTHOR_DATE: dateTime,
        GIT_COMMITTER_DATE: dateTime
      };
      
      // Create the commit
      console.log(`[GitHub] Creating commit with message: "${commitMessage}"`);
      const commitOptions = { '--date': dateTime };
      await git.env(env).commit(commitMessage, filePath, commitOptions);
      
      // Push the changes
      console.log('[GitHub] Pushing changes to remote repository');
      await git.push();
      console.log('[GitHub] Push successful');
      
      // Extract the owner and repo from the URL for verification
      let owner, repo;
      if (repoUrl.includes('github.com')) {
        const urlParts = repoUrl.split('/');
        const ownerIndex = urlParts.indexOf('github.com') + 1;
        if (ownerIndex < urlParts.length) {
          owner = urlParts[ownerIndex];
          repo = urlParts[ownerIndex + 1]?.replace('.git', '');
        }
      }
      
      if (owner && repo) {
        // Verify the commit was recorded by checking recent commits
        try {
          console.log(`[GitHub] Verifying commit was recorded for ${owner}/${repo}`);
          const recentCommitsResponse = await axios.get(
            `${githubConfig.apiUrl}/repos/${owner}/${repo}/commits`, 
            {
              headers: {
                Authorization: `token ${this.token}`
              }
            }
          );
          
          const recentCommits = recentCommitsResponse.data;
          const matchingCommit = recentCommits.find((c: any) => 
            c.commit.message === commitMessage && 
            c.commit.author && 
            c.commit.author.name === (userProfile.name || userProfile.login)
          );
          
          if (matchingCommit) {
            console.log(`[GitHub] Commit verified and found in GitHub's records`);
          } else {
            console.warn(`[GitHub] Commit pushed but not immediately found in GitHub's records. This may be due to API caching.`);
          }
        } catch (verifyError: any) {
          console.warn(`[GitHub] Could not verify commit was recorded: ${verifyError.message}`);
        }
      }
      
      // Cleanup the temporary directory
      try {
        console.log(`[GitHub] Cleaning up temporary directory: ${tempDir}`);
        // Use a more robust directory removal approach
        if (fs.existsSync(tempDir)) {
          try {
            // Use a more cross-platform approach to remove the directory
            const { exec } = require('child_process');
            const cleanupCommand = process.platform === 'win32' 
              ? `rmdir /s /q "${tempDir}"` 
              : `rm -rf "${tempDir}"`;
            
            exec(cleanupCommand, (cleanupError: any) => {
              if (cleanupError) {
                console.error(`[GitHub] Exec cleanup error in catch: ${cleanupError.message}`);
              }
            });
          } catch (execError) {
            console.error(`[GitHub] Error executing cleanup command in catch: ${execError}`);
            // Fallback to fs methods
            try {
              fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (rmError) {
              console.error(`[GitHub] Fallback cleanup also failed in catch: ${rmError}`);
            }
          }
        }
      } catch (cleanupError) {
        console.error(`[GitHub] Error cleaning up after failure: ${cleanupError}`);
      }
      
      console.log('[GitHub] Backdated commit process completed successfully');
      return { success: true, message: 'Commit created successfully' };
      
    } catch (error: any) {
      console.error('[GitHub] Error in createBackdatedCommit:', error);
      console.error('[GitHub] Error stack:', error.stack);
      
      // Clean up the temp directory if it exists
      try {
        const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
        if (fs.existsSync(tempDir)) {
          try {
            // Use the same cross-platform cleanup approach
            const { exec } = require('child_process');
            const cleanupCommand = process.platform === 'win32' 
              ? `rmdir /s /q "${tempDir}"` 
              : `rm -rf "${tempDir}"`;
            
            exec(cleanupCommand, (cleanupError: any) => {
              if (cleanupError) {
                console.error(`[GitHub] Exec cleanup error in catch: ${cleanupError.message}`);
              }
            });
          } catch (execError) {
            console.error(`[GitHub] Error executing cleanup command in catch: ${execError}`);
            // Fallback to fs methods
            try {
              fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (rmError) {
              console.error(`[GitHub] Fallback cleanup also failed in catch: ${rmError}`);
            }
          }
        }
      } catch (cleanupError) {
        console.error(`[GitHub] Error cleaning up after failure: ${cleanupError}`);
      }
      
      throw new AppError(`GitHub commit error: ${error.message}`, 500);
    }
  }

  /**
   * Get user's activity streams (commits, PRs, issues, reviews, stars)
   * Combines data from different GitHub API endpoints
   */
  async getActivities(type?: string, repo?: string, skip: number = 0, limit: number = 20) {
    try {
      const activities: any[] = [];
      
      // Get different types of activities based on the filter
      if (!type || type === 'commit') {
        const commits = await this.getCommitActivity(repo);
        activities.push(...commits.map(commit => ({
          id: commit.sha || commit.id,
          type: 'commit',
          title: commit.commit?.message || 'Commit',
          repo: commit.repository?.name || repo || '',
          repoFullName: commit.repository?.full_name || '',
          timestamp: commit.commit?.author?.date || commit.created_at,
          branch: commit.branch || 'main',
          url: commit.html_url
        })));
      }
      
      if (!type || type === 'pr') {
        const prs = await this.getPullRequestActivity(repo);
        activities.push(...prs.map(pr => ({
          id: `pr-${pr.id}`,
          type: 'pr',
          title: pr.title || 'Pull Request',
          repo: pr.head?.repo?.name || repo || '',
          repoFullName: pr.head?.repo?.full_name || '',
          timestamp: pr.created_at,
          url: pr.html_url
        })));
      }
      
      if (!type || type === 'issue') {
        const issues = await this.getIssueActivity(repo);
        activities.push(...issues.map(issue => ({
          id: `issue-${issue.id}`,
          type: 'issue',
          title: issue.title || 'Issue',
          repo: issue.repository?.name || repo || '',
          repoFullName: issue.repository_url?.split('/').slice(-2).join('/') || '',
          timestamp: issue.created_at,
          url: issue.html_url
        })));
      }
      
      if (!type || type === 'review') {
        const reviews = await this.getReviewActivity(repo);
        activities.push(...reviews.map(review => ({
          id: `review-${review.id}`,
          type: 'review',
          title: `Code review: ${review.pull_request?.title || ''}`,
          repo: review.repository?.name || repo || '',
          repoFullName: review.repository_url?.split('/').slice(-2).join('/') || '',
          timestamp: review.submitted_at || review.created_at,
          url: review.html_url || review.pull_request?.html_url
        })));
      }
      
      if (!type || type === 'star') {
        const stars = await this.getStarredActivity(repo);
        activities.push(...stars.map(star => ({
          id: `star-${star.repo?.id || Math.random().toString(36).substring(2, 9)}`,
          type: 'star',
          title: `Starred repository ${star.repo?.name || star.full_name || ''}`,
          repo: star.repo?.name || star.name || '',
          repoFullName: star.repo?.full_name || star.full_name || '',
          timestamp: star.created_at,
          url: star.repo?.html_url || star.html_url
        })));
      }
      
      // Sort by timestamp (newest first)
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Apply pagination
      return activities.slice(skip, skip + limit);
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch activities',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get commit activity
   */
  private async getCommitActivity(repo?: string) {
    try {
      let commits: any[] = [];
      
      if (repo) {
        // Get commits for a specific repository
        const repoOwner = repo.includes('/') ? repo.split('/')[0] : '';
        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        
        const response = await axios.get(
          `${githubConfig.apiUrl}/repos/${repoOwner}/${repoName}/commits?author=${await this.getAuthenticatedUsername()}`,
          {
            headers: {
              Authorization: `token ${this.token}`
            }
          }
        );
        commits = response.data;
      } else {
        // Get commit events across all repositories
        const events = await this.getUserEvents('PushEvent');
        commits = events
          .filter((event: any) => event.type === 'PushEvent')
          .flatMap((event: any) => event.payload.commits.map((commit: any) => ({
            ...commit,
            repository: {
              name: event.repo.name.split('/')[1],
              full_name: event.repo.name
            },
            created_at: event.created_at,
            html_url: `https://github.com/${event.repo.name}/commit/${commit.sha}`
          })));
      }
      
      return commits;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch commit activity',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get pull request activity
   */
  private async getPullRequestActivity(repo?: string) {
    try {
      let prs: any[] = [];
      
      if (repo) {
        // Get PRs for a specific repository
        const repoOwner = repo.includes('/') ? repo.split('/')[0] : '';
        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        
        const response = await axios.get(
          `${githubConfig.apiUrl}/repos/${repoOwner}/${repoName}/pulls?state=all&creator=${await this.getAuthenticatedUsername()}`,
          {
            headers: {
              Authorization: `token ${this.token}`
            }
          }
        );
        prs = response.data;
      } else {
        // Get PR events across all repositories
        const events = await this.getUserEvents('PullRequestEvent');
        prs = events
          .filter((event: any) => 
            event.type === 'PullRequestEvent' && 
            event.payload.action === 'opened'
          )
          .map((event: any) => ({
            id: event.payload.pull_request.id,
            title: event.payload.pull_request.title,
            created_at: event.created_at,
            html_url: event.payload.pull_request.html_url,
            head: {
              repo: {
                name: event.repo.name.split('/')[1],
                full_name: event.repo.name
              }
            }
          }));
      }
      
      return prs;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch pull request activity',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get issue activity
   */
  private async getIssueActivity(repo?: string) {
    try {
      let issues: any[] = [];
      
      if (repo) {
        // Get issues for a specific repository
        const repoOwner = repo.includes('/') ? repo.split('/')[0] : '';
        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        
        const response = await axios.get(
          `${githubConfig.apiUrl}/repos/${repoOwner}/${repoName}/issues?state=all&creator=${await this.getAuthenticatedUsername()}`,
          {
            headers: {
              Authorization: `token ${this.token}`
            }
          }
        );
        issues = response.data.filter((issue: any) => !issue.pull_request); // Filter out PRs
      } else {
        // Get issue events across all repositories
        const events = await this.getUserEvents('IssuesEvent');
        issues = events
          .filter((event: any) => 
            event.type === 'IssuesEvent' && 
            event.payload.action === 'opened'
          )
          .map((event: any) => ({
            id: event.payload.issue.id,
            title: event.payload.issue.title,
            created_at: event.created_at,
            html_url: event.payload.issue.html_url,
            repository: {
              name: event.repo.name.split('/')[1]
            },
            repository_url: `https://api.github.com/repos/${event.repo.name}`
          }));
      }
      
      return issues;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch issue activity',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get review activity
   */
  private async getReviewActivity(repo?: string) {
    try {
      // GitHub doesn't have a direct API for fetching all reviews
      // We need to use events and then fetch details
      const events = await this.getUserEvents('PullRequestReviewEvent');
      const reviews = events
        .filter((event: any) => event.type === 'PullRequestReviewEvent')
        .map((event: any) => ({
          id: `${event.id}-review`,
          created_at: event.created_at,
          submitted_at: event.payload.review.submitted_at,
          pull_request: {
            title: event.payload.pull_request.title,
            html_url: event.payload.pull_request.html_url
          },
          html_url: event.payload.review.html_url,
          repository: {
            name: event.repo.name.split('/')[1]
          },
          repository_url: `https://api.github.com/repos/${event.repo.name}`
        }));
      
      // Filter by repo if specified
      if (repo) {
        return reviews.filter((review: {repository: {name: string}}) => 
          review.repository.name.toLowerCase() === repo.toLowerCase()
        );
      }
      
      return reviews;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch review activity',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get starred repositories activity
   */
  private async getStarredActivity(repo?: string) {
    try {
      // GitHub API doesn't provide a way to get when a user starred a repo
      // We can only get the list of currently starred repos
      const response = await axios.get(
        `${githubConfig.apiUrl}/user/starred?per_page=100`, 
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3.star+json' // This header is needed to get starred_at
          }
        }
      );
      
      const stars = response.data.map((starredRepo: {
        repo?: {
          name?: string;
          full_name?: string;
          html_url?: string;
        };
        starred_at?: string;
        name?: string;
        full_name?: string;
        html_url?: string;
      }) => ({
        repo: starredRepo.repo || starredRepo,
        created_at: starredRepo.starred_at || new Date().toISOString(),
        name: starredRepo.repo?.name || starredRepo.name,
        full_name: starredRepo.repo?.full_name || starredRepo.full_name,
        html_url: starredRepo.repo?.html_url || starredRepo.html_url
      }));
      
      // Filter by repo if specified
      if (repo) {
        return stars.filter((star: {name?: string; repo?: {name?: string}}) => 
          star.name?.toLowerCase() === repo.toLowerCase() ||
          star.repo?.name?.toLowerCase() === repo.toLowerCase()
        );
      }
      
      return stars;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch starred activity',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get user events from GitHub
   */
  private async getUserEvents(type?: string) {
    try {
      const username = await this.getAuthenticatedUsername();
      const response = await axios.get(
        `${githubConfig.apiUrl}/users/${username}/events?per_page=100`,
        {
          headers: {
            Authorization: `token ${this.token}`
          }
        }
      );
      
      if (type) {
        return response.data.filter((event: any) => event.type === type);
      }
      
      return response.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch user events',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get authenticated username
   */
  private async getAuthenticatedUsername() {
    const user = await this.getUserProfile();
    return user.login;
  }
  
  /**
   * Get contribution count
   */
  async getContributionCount() {
    try {
      const username = await this.getAuthenticatedUsername();
      const contributionCalendar = await this.getContributionCalendar(username);
      
      return {
        totalContributions: contributionCalendar.totalContributions || 0
      };
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch contribution count',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get stars received count
   */
  async getStarsReceived() {
    try {
      const username = await this.getAuthenticatedUsername();
      let totalStars = 0;
      
      // Get user's repositories
      const repos = await this.getRepositories();
      
      // Sum up stars from all repos
      repos.forEach((repo: any) => {
        totalStars += repo.stargazers_count || 0;
      });
      
      return totalStars;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch stars received',
        error.response?.status || 500
      );
    }
  }
  
  /**
   * Get contribution statistics
   */
  async getContributionStats(since?: string) {
    try {
      const username = await this.getAuthenticatedUsername();
      
      // Get contribution calendar for day of week data
      const contributionCalendar = await this.getContributionCalendar(username);
      
      // Calculate day of week activity
      const dayOfWeekActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
      
      if (contributionCalendar && contributionCalendar.weeks) {
        contributionCalendar.weeks.forEach((week: any) => {
          if (week.contributionDays) {
            week.contributionDays.forEach((day: any) => {
              const date = new Date(day.date);
              const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 6 is Saturday
              dayOfWeekActivity[dayOfWeek] += day.contributionCount;
            });
          }
        });
      }
      
      // Get different types of contributions
      const events = await this.getUserEvents();
      
      // Count different event types
      const commitEvents = events.filter((event: any) => event.type === 'PushEvent').length;
      const pullRequestEvents = events.filter((event: any) => 
        event.type === 'PullRequestEvent' && 
        event.payload.action === 'opened'
      ).length;
      const issueEvents = events.filter((event: any) => 
        event.type === 'IssuesEvent' && 
        event.payload.action === 'opened'
      ).length;
      const reviewEvents = events.filter((event: any) => 
        event.type === 'PullRequestReviewEvent'
      ).length;
      
      // Get stars given
      const starsGiven = await this.getStarredActivity();
      
      return {
        commits: commitEvents,
        pullRequests: pullRequestEvents,
        issues: issueEvents,
        reviews: reviewEvents,
        starsGiven: starsGiven.length,
        totalContributions: contributionCalendar.totalContributions || 0,
        dayOfWeekActivity
      };
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch contribution statistics',
        error.response?.status || 500
      );
    }
  }

  /**
   * Get file content from a repository
   */
  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const response = await axios.get(
        `${githubConfig.apiUrl}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3.raw'
          }
        }
      );
      
      return {
        content: response.data,
        path: path
      };
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch file content',
        error.response?.status || 500
      );
    }
  }
}

/**
 * Exchange OAuth code for access token
 */
export const getGitHubAccessToken = async (code: string) => {
  try {
    const response = await axios.post(
      githubConfig.tokenUrl,
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error: any) {
    throw new AppError(
      error.response?.data?.message || 'Failed to exchange code for token',
      error.response?.status || 500
    );
  }
}; 