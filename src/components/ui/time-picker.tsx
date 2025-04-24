import React, { useState, useEffect } from 'react';
import { Clock, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  className?: string;
  multiMode?: boolean;
  times?: string[];
  setTimes?: (times: string[]) => void;
}

export function TimePicker({ 
  time, 
  setTime, 
  className, 
  multiMode = false, 
  times = [], 
  setTimes
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localHours, setLocalHours] = useState('12');
  const [localMinutes, setLocalMinutes] = useState('00');
  const [localPeriod, setLocalPeriod] = useState('PM');
  
  // Parse current time whenever it changes externally
  useEffect(() => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      const hour = parseInt(match[1]);
      setLocalHours(hour.toString());
      setLocalMinutes(match[2]);
      setLocalPeriod(match[3].toUpperCase());
    }
  }, [time]);

  const applyTimeChange = () => {
    // Ensure hours and minutes are valid numbers
    let hours = parseInt(localHours) || 12;
    if (hours < 1) hours = 1;
    if (hours > 12) hours = 12;
    
    let minutes = parseInt(localMinutes) || 0;
    if (minutes < 0) minutes = 0;
    if (minutes > 59) minutes = 59;
    
    // Format correctly
    const formattedHours = hours.toString();
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    const formattedTime = `${formattedHours}:${formattedMinutes} ${localPeriod}`;
    
    if (multiMode && setTimes) {
      // In multi-mode, add the time to the array if it's not already there
      if (!times.includes(formattedTime)) {
        setTimes([...times, formattedTime]);
      }
    } else {
      // In single-mode, just set the time
      setTime(formattedTime);
    }
    
    setIsOpen(false);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 12)) {
      setLocalHours(value);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
      setLocalMinutes(value);
    }
  };

  const togglePeriod = () => {
    setLocalPeriod(localPeriod === 'AM' ? 'PM' : 'AM');
  };

  const generateRandomTimes = () => {
    if (!setTimes) return;
    
    // Generate 5 random times between 9AM and 7PM (typical work hours)
    const randomTimes = [];
    for (let i = 0; i < 5; i++) {
      // Generate random hour between 9AM and 7PM (9-19)
      const hour = Math.floor(Math.random() * 11) + 9;
      // Generate random minute (0-59)
      const minute = Math.floor(Math.random() * 60);
      
      // Format the time
      let formattedHour = hour;
      let period = 'AM';
      
      if (hour >= 12) {
        period = 'PM';
        if (hour > 12) {
          formattedHour = hour - 12;
        }
      }
      
      const formattedMinute = minute.toString().padStart(2, '0');
      const formattedTime = `${formattedHour}:${formattedMinute} ${period}`;
      
      randomTimes.push(formattedTime);
    }
    
    // Set the random times
    setTimes(randomTimes);
  };

  const removeTime = (timeToRemove: string) => {
    if (multiMode && setTimes) {
      setTimes(times.filter(t => t !== timeToRemove));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && !times.length && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {multiMode ? 
            (times.length ? `${times.length} times selected` : "Select times") : 
            (time || "Select time")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center justify-between space-x-2">
          <div className="grid gap-1 text-center">
            <div className="text-xs">Hour</div>
            <Input
              className="w-14 text-center"
              value={localHours}
              onChange={handleHoursChange}
              type="number"
              min="1"
              max="12"
            />
          </div>
          <div className="text-xl">:</div>
          <div className="grid gap-1 text-center">
            <div className="text-xs">Minute</div>
            <Input
              className="w-14 text-center"
              value={localMinutes}
              onChange={handleMinutesChange}
              type="number"
              min="0"
              max="59"
            />
          </div>
          <div className="grid gap-1">
            <div className="text-xs">Period</div>
            <Button
              variant="outline"
              className={cn(
                "w-14",
                localPeriod === "AM" && "bg-slate-100",
                localPeriod === "PM" && "bg-slate-100"
              )}
              onClick={togglePeriod}
            >
              {localPeriod}
            </Button>
          </div>
        </div>
        
        {multiMode && (
          <div className="mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-800 text-green-700"
                    onClick={generateRandomTimes}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Random Times
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate 5 random times between 9AM and 7PM</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {multiMode && times.length > 0 && (
          <div className="mt-4">
            <div className="text-xs mb-2">Selected Times:</div>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => (
                <Badge key={t} variant="secondary" className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200" onClick={() => removeTime(t)}>
                  {t} <span className="ml-1">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button 
            size="sm"
            onClick={applyTimeChange}
            className="bg-green-600 hover:bg-green-700"
          >
            {multiMode ? "Add Time" : "Set Time"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 