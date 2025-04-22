import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import AppError from '../utils/appError';

// Get user settings
export const getUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      status: 'success',
      data: {
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user settings
export const updateUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { 
      darkMode, 
      timezone, 
      defaultRepository, 
      notificationsEnabled, 
      reminderTime,
      commitMessageTemplates
    } = req.body;
    
    // Create updates object with only defined fields
    const updates: any = {};
    
    if (darkMode !== undefined) updates['settings.darkMode'] = darkMode;
    if (timezone) updates['settings.timezone'] = timezone;
    if (defaultRepository) updates['settings.defaultRepository'] = defaultRepository;
    if (notificationsEnabled !== undefined) updates['settings.notificationsEnabled'] = notificationsEnabled;
    if (reminderTime) updates['settings.reminderTime'] = reminderTime;
    if (commitMessageTemplates) updates['settings.commitMessageTemplates'] = commitMessageTemplates;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        settings: updatedUser.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add a commit message template
export const addCommitTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { template } = req.body;
    
    if (!template) {
      return next(new AppError('Please provide a template message', 400));
    }
    
    // Check if template already exists
    if (user.settings.commitMessageTemplates.includes(template)) {
      return next(new AppError('Template already exists', 400));
    }
    
    // Add template
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { 'settings.commitMessageTemplates': template } },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        templates: updatedUser!.settings.commitMessageTemplates
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove a commit message template
export const removeCommitTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const { template } = req.body;
    
    if (!template) {
      return next(new AppError('Please provide a template message', 400));
    }
    
    // Remove template
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { 'settings.commitMessageTemplates': template } },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        templates: updatedUser!.settings.commitMessageTemplates
      }
    });
  } catch (error) {
    next(error);
  }
}; 