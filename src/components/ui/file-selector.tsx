import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileEdit, Search, X } from 'lucide-react';
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
  
  // For demo purposes, we'll use a predefined list of files
  // In a real application, this would be fetched from the GitHub API
  const possibleFiles = [
    'README.md',
    'LICENSE',
    'src/App.js',
    'src/index.js',
    'src/components/Header.js',
    'src/components/Footer.js',
    'src/pages/Home.js',
    'src/pages/About.js',
    'src/pages/Contact.js',
    'src/styles/main.css',
    'public/index.html',
    'docs/api-reference.md',
    'tests/App.test.js',
    'package.json',
    '.gitignore',
  ];
  
  // Filter files based on search term
  const filteredFiles = possibleFiles.filter(f => 
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelectFile = (filePath: string) => {
    setFile(filePath);
    // Also add to selected files if not already there
    if (!selectedFiles.includes(filePath)) {
      setSelectedFiles([...selectedFiles, filePath]);
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
          <DialogTitle>Select File</DialogTitle>
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
          
          {selectedFiles.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Recently Selected</div>
              <div className="space-y-1">
                {selectedFiles.slice(0, 3).map((filePath) => (
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