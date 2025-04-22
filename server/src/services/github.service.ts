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
      console.log(`Starting backdated commit process for ${repoUrl}`);
      
      // Create a temporary directory for git operations
      const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
      console.log(`Creating temp directory: ${tempDir}`);
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
          const repoIndex = urlParts.findIndex(part => part === 'github.com') + 1;
          
          if (urlParts.length > repoIndex + 1) {
            owner = urlParts[repoIndex];
            repo = urlParts[repoIndex + 1];
          }
        }
        
        if (owner && repo) {
          // Use HTTPS URL with token for auth
          cloneUrl = `https://${this.token}@github.com/${owner}/${repo}.git`;
        } else {
          // Append .git if not present
          cloneUrl = repoUrl.endsWith('/') ? `${repoUrl}.git` : `${repoUrl}.git`;
        }
      }
      
      console.log(`Cloning repository: ${cloneUrl.replace(this.token, '[TOKEN_REDACTED]')}`);
      
      // Clone the repository
      try {
        await git.clone(cloneUrl, tempDir);
        console.log('Repository cloned successfully');
      } catch (cloneError) {
        console.error('Clone error:', cloneError);
        throw new AppError(`Failed to clone repository: ${cloneError.message}`, 500);
      }
      
      // Create file path ensuring directories exist
      const fullFilePath = path.join(tempDir, filePath);
      const dirPath = path.dirname(fullFilePath);
      console.log(`Creating directory structure: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Check if file exists and read content
      let fileContent = '';
      try {
        fileContent = fs.readFileSync(fullFilePath, 'utf8');
        console.log('Existing file found, will update content');
      } catch (error) {
        console.log('File does not exist, will create new file');
      }
      
      // Create or update the file
      console.log(`Writing content to file: ${fullFilePath}`);
      fs.writeFileSync(fullFilePath, content || `${fileContent}\n\n// Updated: ${new Date().toISOString()}`);
      
      // Configure git user info (using authenticated user's info)
      const userResponse = await this.getUserProfile();
      await git.addConfig('user.name', userResponse.name || userResponse.login);
      await git.addConfig('user.email', userResponse.email || `${userResponse.login}@users.noreply.github.com`);
      console.log(`Git user configured as: ${userResponse.name || userResponse.login}`);
      
      // Stage, commit with backdated timestamp, and push
      console.log(`Staging file: ${filePath}`);
      await git.add(filePath);
      
      // Set commit date environment variables
      const env = { 
        GIT_AUTHOR_DATE: dateTime,
        GIT_COMMITTER_DATE: dateTime
      };
      
      console.log(`Creating commit with message: ${commitMessage}`);
      await git.env(env).commit(commitMessage);
      
      // Try to push to the default branch ('master' or 'main')
      try {
        console.log('Attempting to push to master branch');
        await git.push('origin', 'master');
      } catch (masterPushError) {
        console.log('Push to master failed, trying main branch instead');
        try {
          await git.push('origin', 'main');
        } catch (mainPushError) {
          // Get the current branch name and try that
          const branchSummary = await git.branch();
          const currentBranch = branchSummary.current;
          console.log(`Push to main failed, trying current branch: ${currentBranch}`);
          
          await git.push('origin', currentBranch);
        }
      }
      
      console.log('Push successful');
      
      // Clean up
      try {
        console.log(`Cleaning up temp directory: ${tempDir}`);
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean up temp directory:', cleanupError);
      }
      
      return { success: true, message: 'Backdated commit created successfully' };
    } catch (error: any) {
      console.error('Error in createBackdatedCommit:', error);
      throw new AppError(
        `Failed to create backdated commit: ${error.message}`,
        500
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