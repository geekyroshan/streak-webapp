import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileEdit, Search, X, Info, Loader2, Folder, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { githubFileService } from '@/lib/api';

interface FileSelectorProps {
  file: string;
  setFile: (file: string) => void;
  repository?: string;
  repoOwner?: string;
  className?: string;
}

interface RepoFile {
  name: string;
  path: string;
  type: string; // 'file' or 'dir'
  size: number;
  url: string;
}

export function FileSelector({ file, setFile, repository, repoOwner, className }: FileSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState('');
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Common file types for fallback
  const commonFiles = [
    'README.md',
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'src/index.js',
    'src/index.ts',
    'src/App.js',
    'src/App.tsx',
  ];
  
  // Load repository files when dialog opens
  const handleDialogOpen = async (open: boolean) => {
    setDialogOpen(open);
    if (open && repository && repoOwner) {
      await loadRepositoryContents();
    }
  };
  
  // Load repository contents for a specific path
  const loadRepositoryContents = async (path: string = '') => {
    if (!repository || !repoOwner) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const contents = await githubFileService.getRepoContents(repoOwner, repository, path);
      setRepoFiles(contents);
      setCurrentPath(path);
    } catch (err: any) {
      console.error('Error loading repository contents:', err);
      setError(err.message || 'Failed to load repository contents');
      setRepoFiles([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle navigation to a directory
  const handleNavigateToDirectory = (dirPath: string) => {
    loadRepositoryContents(dirPath);
  };
  
  // Handle navigation to parent directory
  const handleNavigateUp = () => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/');
    loadRepositoryContents(parentPath);
  };
  
  const handleSelectFile = (filePath: string) => {
    setFile(filePath);
    // Also add to selected files if not already there
    if (!selectedFiles.includes(filePath)) {
      setSelectedFiles([...selectedFiles, filePath].slice(-5)); // Keep last 5 selections
    }
  };
  
  const handleAddCustomPath = () => {
    if (customPath && customPath.trim()) {
      handleSelectFile(customPath.trim());
      setCustomPath('');
    }
  };
  
  const handleRemoveFile = () => {
    setFile('');
  };
  
  // Filter files based on search term
  const getFilteredFiles = () => {
    if (repoFiles.length > 0) {
      return repoFiles.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return commonFiles
        .filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(f => ({ name: f, path: f, type: 'file', size: 0, url: '' }));
    }
  };
  
  const filteredFiles = getFilteredFiles();
  
  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
      <div className={cn("relative", className)}>
        <Input 
          value={file}
          onChange={(e) => setFile(e.target.value)} 
          placeholder="Enter file path"
          className="pr-12"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {file && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 mr-1" 
              onClick={handleRemoveFile}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <FileEdit className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
        </div>
      </div>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Select File
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    You can select any file in the repository. 
                    If the file is in .gitignore, the system will
                    force add it using "git add -f".
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Choose a file from {repository || 'your repository'} to modify.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {currentPath && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNavigateUp}
                disabled={isLoading}
              >
                ../ (Up)
              </Button>
              <div className="text-sm text-muted-foreground">
                Current: /{currentPath}
              </div>
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto rounded-md border">
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading files...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">
                Error: {error}
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="p-1">
                {filteredFiles.map((fileItem) => (
                  <button
                    key={fileItem.path}
                    onClick={() => fileItem.type === 'dir' 
                      ? handleNavigateToDirectory(fileItem.path)
                      : handleSelectFile(fileItem.path)
                    }
                    className={cn(
                      "w-full flex items-center p-2 text-left text-sm rounded-sm",
                      fileItem.path === file ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    {fileItem.type === 'dir' ? (
                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                    ) : (
                      <File className="h-4 w-4 mr-2 text-gray-500" />
                    )}
                    <span>{fileItem.name}</span>
                    {fileItem.path === file && (
                      <Badge variant="outline" className="ml-auto">Selected</Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No files found matching your search.
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom File Path</div>
            <div className="flex space-x-2">
              <Input
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="Enter any file path..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPath()}
              />
              <Button
                onClick={handleAddCustomPath}
                disabled={!customPath.trim()}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can enter any file path, even if it's not in the list above.
            </p>
          </div>
          
          {selectedFiles.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Recently Selected</div>
              <div className="space-y-1">
                {selectedFiles.slice(-3).map((filePath) => (
                  <button
                    key={filePath}
                    onClick={() => handleSelectFile(filePath)}
                    className={cn(
                      "w-full flex items-center text-left text-sm p-1.5 rounded-sm",
                      file === filePath ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    {filePath}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="secondary"
            onClick={() => setSearchTerm('')}
            disabled={!searchTerm}
          >
            Clear search
          </Button>
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}