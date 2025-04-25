import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '300px',
  className,
  readOnly = false,
  placeholder = '// Enter your code here...'
}: CodeEditorProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  const handleEditorChange = (value: string | undefined) => {
    onChange(value);
  };

  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  // Auto-detect language based on file extension
  const detectLanguage = (fileName: string | undefined): string => {
    if (!fileName) return 'javascript';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'javascript';
    }
  };

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {!isEditorReady && (
        <div className="flex items-center justify-center h-full min-h-[200px] bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value || placeholder}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          theme: 'vs-dark'
        }}
      />
    </div>
  );
}

export default CodeEditor; 