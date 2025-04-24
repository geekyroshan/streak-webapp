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
      
      // Stage the changes
      console.log(`[GitHub] Staging changes for file: ${filePath}`);
      await git.add(filePath);
      
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