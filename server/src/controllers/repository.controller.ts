import { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github.service';
import AppError from '../utils/appError';

// Get all repositories for user
export const getUserRepositories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    const githubService = new GitHubService(user.accessToken);
    const repositories = await githubService.getRepositories();
    
    res.status(200).json({
      status: 'success',
      results: repositories.length,
      data: {
        repositories
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific repository
export const getRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const user = req.user;
    
    if (!user.accessToken) {
      return next(new AppError('Access token not available', 401));
    }
    
    const githubService = new GitHubService(user.accessToken);
    const repository = await githubService.getRepository(owner, repo);
    
    res.status(200).json({
      status: 'success',
      data: {
        repository
      }
    });
  } catch (error) {
    next(error);
  }
}; 