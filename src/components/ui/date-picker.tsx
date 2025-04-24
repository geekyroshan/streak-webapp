import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

// Custom Calendar wrapper with proper styling
const StyledCalendar = (props: any) => {
  const { selected, onSelect, className, ...rest } = props;
  
  // Create a type-safe handler for onSelect
  const handleSelect = React.useCallback(
    (day: Date | undefined) => {
      onSelect?.(day);
    },
    [onSelect]
  );
  
  // Default styles for all calendars in the app
  const defaultClassNames = {
    day_selected: "bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white",
    day_today: "bg-accent text-accent-foreground border border-green-400",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-xs",
    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-md last:[&:has([aria-selected])]:rounded-md focus-within:relative focus-within:z-20",
    month: "space-y-2",
    caption: "flex justify-between pt-1 relative items-center px-2",
    caption_label: "text-sm font-medium text-center",
    nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-md",
  };
  
  // Merge any custom classNames with the defaults
  const mergedClassNames = { 
    ...defaultClassNames, 
    ...(props.classNames || {}) 
  };
  
  return (
    <Calendar 
      {...rest} 
      selected={selected} 
      onSelect={handleSelect} 
      className={cn("rounded-md border", className)}
      classNames={mergedClassNames}
    />
  );
};

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <StyledCalendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 