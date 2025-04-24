import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileEdit, Search, X, Info } from 'lucide-react';
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

interface FileSelectorProps {
  file: string;
  setFile: (file: string) => void;
  repository?: string;
  repoOwner?: string;
  className?: string;
}

export function FileSelector({ file, setFile, repository, repoOwner, className }: FileSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState('');
  
  // Combine recommended files (documentation) with common source files
  const possibleFiles = [
    // Documentation files (recommended, rarely in .gitignore)
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'CHANGELOG.md',
    'docs/README.md',
    'docs/index.md',
    
    // Source code files
    'src/index.js',
    'src/App.js',
    'src/main.js',
    'src/index.ts',
    'src/App.tsx',
    'src/components/Header.js',
    'src/components/Footer.js',
    'src/pages/Home.js',
    'src/pages/About.js',
    'src/utils/helpers.js',
    'src/utils/format.js',
    
    // Configuration files
    'package.json',
    'tsconfig.json',
    '.eslintrc.js',
    'webpack.config.js',
    'vite.config.js',
    
    // Other common files
    'public/index.html',
    'styles/main.css',
    'assets/style.css'
  ];
  
  // Filter files based on search term
  const filteredFiles = possibleFiles.filter(f => 
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
  
  return (
    <Dialog>
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
          
          <div className="max-h-60 overflow-y-auto rounded-md border">
            <div className="p-1">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((filePath) => (
                  <button
                    key={filePath}
                    onClick={() => handleSelectFile(filePath)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 text-left text-sm rounded-sm",
                      file === filePath ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    <span>{filePath}</span>
                    {file === filePath && (
                      <Badge variant="outline" className="ml-auto">Selected</Badge>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No files found matching your search.
                </div>
              )}
            </div>
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