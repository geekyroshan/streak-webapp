import { useState, useEffect } from 'react';
import { userService } from '@/lib/api';
import { useToast } from './use-toast';

export interface UserSettings {
  darkMode: boolean;
  timezone: string;
  defaultRepository?: string;
  notificationsEnabled: boolean;
  reminderTime?: string;
  commitMessageTemplates: string[];
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await userService.getUserSettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedSettings = await userService.updateUserSettings(newSettings);
      setSettings(updatedSettings);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      console.error('Error updating settings:', err);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const addCommitTemplate = async (template: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const templates = await userService.addCommitTemplate(template);
      if (settings) {
        setSettings({
          ...settings,
          commitMessageTemplates: templates
        });
      }
      toast({
        title: "Success",
        description: "Commit template added successfully",
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to add template');
      console.error('Error adding template:', err);
      toast({
        title: "Error",
        description: "Failed to add commit template. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeCommitTemplate = async (template: string) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const templates = await userService.removeCommitTemplate(template);
      if (settings) {
        setSettings({
          ...settings,
          commitMessageTemplates: templates
        });
      }
      toast({
        title: "Success",
        description: "Commit template removed successfully",
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove template');
      console.error('Error removing template:', err);
      toast({
        title: "Error",
        description: "Failed to remove commit template. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { 
    settings, 
    isLoading, 
    isSaving,
    error, 
    updateSettings,
    addCommitTemplate,
    removeCommitTemplate,
    refetch: fetchSettings 
  };
} 