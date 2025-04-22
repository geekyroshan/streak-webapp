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
   * Note: GitHub API doesn't provide direct contribution calendar data,
   * we can approximate this by getting commits and events
   */
  async getUserContributions(username: string, since?: string) {
    const sinceDate = since || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // Get user events (includes various contribution types)
      const eventsResponse = await axios.get(
        `${githubConfig.apiUrl}/users/${username}/events?per_page=100`, 
        {
          headers: {
            Authorization: `token ${this.token}`
          }
        }
      );
      return eventsResponse.data;
    } catch (error: any) {
      throw new AppError(
        error.response?.data?.message || 'Failed to fetch user contributions',
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
      // Create a temporary directory for git operations
      const tempDir = path.join(__dirname, '../../temp', Date.now().toString());
      fs.mkdirSync(tempDir, { recursive: true });
      
      const git = simpleGit(tempDir);
      
      // Clone the repository
      await git.clone(repoUrl, tempDir);
      
      // Create file path ensuring directories exist
      const fullFilePath = path.join(tempDir, filePath);
      const dirPath = path.dirname(fullFilePath);
      fs.mkdirSync(dirPath, { recursive: true });
      
      // Check if file exists and read content
      let fileContent = '';
      try {
        fileContent = fs.readFileSync(fullFilePath, 'utf8');
      } catch (error) {
        // File doesn't exist, will be created
      }
      
      // Create or update the file
      fs.writeFileSync(fullFilePath, content || `${fileContent}\n\n// Updated: ${new Date().toISOString()}`);
      
      // Configure git user info (using authenticated user's info)
      const userResponse = await this.getUserProfile();
      await git.addConfig('user.name', userResponse.name || userResponse.login);
      await git.addConfig('user.email', userResponse.email || `${userResponse.login}@users.noreply.github.com`);
      
      // Stage, commit with backdated timestamp, and push
      await git.add(filePath);
      
      // Set commit date environment variables
      const env = { 
        GIT_AUTHOR_DATE: dateTime,
        GIT_COMMITTER_DATE: dateTime
      };
      
      await git.env(env).commit(commitMessage);
      await git.push('origin', 'master');
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return { success: true, message: 'Backdated commit created successfully' };
    } catch (error: any) {
      throw new AppError(
        error.message || 'Failed to create backdated commit',
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