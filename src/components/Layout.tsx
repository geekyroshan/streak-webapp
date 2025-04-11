
import React from 'react';
import { Sidebar } from './Sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[72px] p-6">
        <Alert variant="default" className="bg-primary/5 border-primary/20 mb-4">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <AlertDescription className="text-xs">
              This application helps you recover missed GitHub contributions for legitimate work. 
              Please use responsibly to reflect actual work done, not to create misleading activity patterns.
            </AlertDescription>
          </div>
        </Alert>
        {children}
      </main>
    </div>
  );
};
