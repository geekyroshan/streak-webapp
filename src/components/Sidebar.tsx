
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { 
  CalendarDays, 
  GitCommit, 
  Github, 
  LineChart, 
  Settings, 
  Code, 
  Clock, 
  LogOut
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: SidebarItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
              active 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const UserAvatar = () => {
  return (
    <div className="flex flex-col items-center gap-2 py-4 border-b border-sidebar-border">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-sidebar-accent flex items-center justify-center">
          <Github className="w-6 h-6 text-sidebar-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">3</span>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigationItems = [
    { icon: LineChart, label: 'Dashboard', path: '/' },
    { icon: CalendarDays, label: 'Contribution Calendar', path: '/calendar' },
    { icon: GitCommit, label: 'Streak Manager', path: '/streak' },
    { icon: Code, label: 'Repositories', path: '/repositories' },
    { icon: Clock, label: 'Activity History', path: '/activity' },
  ];
  
  const bottomItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: LogOut, label: 'Logout', path: '/logout' }
  ];
  
  return (
    <div className="h-screen w-[72px] bg-sidebar fixed left-0 top-0 border-r border-sidebar-border flex flex-col justify-between p-3">
      <div className="flex flex-col gap-3">
        <UserAvatar />
        <div className="pt-3 flex flex-col gap-2">
          {navigationItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </div>
  );
};
