import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  className?: string;
}

export function TimePicker({ time, setTime, className }: TimePickerProps) {
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
    
    // Set the time with formatted values
    setTime(`${formattedHours}:${formattedMinutes} ${localPeriod}`);
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
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
              className="w-14"
              onClick={togglePeriod}
            >
              {localPeriod}
            </Button>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button 
            size="sm"
            onClick={applyTimeChange}
          >
            Set Time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 