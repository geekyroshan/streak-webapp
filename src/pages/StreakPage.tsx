import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  GitCommit, 
  Calendar,
  Clock,
  FileEdit,
  AlertTriangle,
  Check,
  MessageSquare,
  RotateCcw,
  Loader2,
  Globe,
  Lock,
  CalendarIcon,
  CalendarCheck,
  Trash,
  RefreshCcw,
  X,
} from "lucide-react";
import { useRepositories } from "@/hooks/use-repositories";
import { useToast } from "@/hooks/use-toast";
import { streakService, githubFileService } from "@/lib/api";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { FileSelector } from "@/components/ui/file-selector";
import { format, parseISO } from "date-fns";
import {
  useCommitHistory,
  CommitHistoryItem,
} from "@/hooks/use-commit-history";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  addDays,
  isBefore,
  isAfter,
  startOfDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label as UILabel } from "@/components/ui/label";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import CodeEditor from "@/components/ui/code-editor";

// Custom Calendar wrapper with proper type handling and consistent styling
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
    day_selected:
      "bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white",
    day_today: "bg-accent text-accent-foreground border border-green-400",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-xs",
    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-md last:[&:has([aria-selected])]:rounded-md focus-within:relative focus-within:z-20",
    month: "space-y-2",
    caption: "flex justify-between pt-1 relative items-center px-2",
    caption_label: "text-sm font-medium text-center",
    nav_button:
      "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-md",
  };
  
  // Merge any custom classNames with the defaults
  const mergedClassNames = { 
    ...defaultClassNames, 
    ...(props.classNames || {}),
  };
  
  return (
    <CalendarComponent 
      {...rest} 
      selected={selected} 
      onSelect={handleSelect} 
      className={cn("rounded-md border", className)}
      classNames={mergedClassNames}
    />
  );
};

const BulkDatePicker = ({ 
  date, 
  setDate, 
  disabledDate,
}: { 
  date: Date | undefined; 
  setDate: (date: Date | undefined) => void; 
  disabledDate?: (date: Date) => boolean;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className="w-full justify-start text-left font-normal"
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
          disabled={disabledDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const StreakPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState(
    "Update documentation with new API endpoints"
  );
  const [selectedFile, setSelectedFile] = useState<string>("docs/api-reference.md");
  const [commitTime, setCommitTime] = useState("2:30 PM");
  const [isCreatingCommit, setIsCreatingCommit] = useState(false);
  const [isSchedulingCommit, setIsSchedulingCommit] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState<Date | undefined>(
    undefined
  );
  const [bulkEndDate, setBulkEndDate] = useState<Date | undefined>(undefined);
  const [frequency, setFrequency] = useState<
    "daily" | "weekdays" | "weekends" | "custom"
  >("weekdays");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday-Friday by default
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    "Update documentation"
  );
  const [timeSelectionMode, setTimeSelectionMode] = useState<
    "single" | "multiple"
  >("single");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  // Add state for cleaning up commits
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [fileContent, setFileContent] = useState<string>(
    "// Loading file content..."
  );
  const [isLoadingFileContent, setIsLoadingFileContent] =
    useState<boolean>(false);
  const [fileLanguage, setFileLanguage] = useState<string>("javascript");
  const [originalFileContent, setOriginalFileContent] = useState<string>("");
  // Add state for multiple message templates and file list
  const [messageTemplates, setMessageTemplates] = useState<string>(
    "Update documentation\nFix typo in API reference\nImprove code comments\nUpdate changelog for {date}"
  );
  const [filesToChange, setFilesToChange] = useState<string[]>([]);
  const [commitPreview, setCommitPreview] = useState<Array<{
    date: string;
    time: string;
    message: string;
    file: string;
  }>>([]);

  const {
    repositories,
    isLoading: isLoadingRepos,
    error: repoError,
  } = useRepositories();
  const { 
    commitHistory, 
    isLoading: isLoadingHistory, 
    error: historyError, 
    refetch: refetchHistory,
    cancelCommit,
    retryCommit,
  } = useCommitHistory();
  const { toast } = useToast();
  
  const formattedDate = selectedDate
    ? format(selectedDate, "MMMM d, yyyy")
    : "";
  const daysSince = selectedDate
    ? Math.floor(
        (new Date().getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;
  
  // Handle cleaning up all pending commits
  const handleCleanupPendingCommits = async () => {
    if (
      window.confirm(
        "Are you sure you want to clean up all pending commits? This action cannot be undone."
      )
    ) {
      setIsCleaningUp(true);
      try {
        const result = await streakService.cleanupPendingCommits();
        toast({
          title: "Cleanup successful",
          description: `Cleaned up ${result.data.commitsDeleted} pending commits and cancelled ${result.data.bulkSchedulesCancelled} bulk schedules.`,
        });
        // Refresh the history after cleanup
        refetchHistory();
      } catch (error: any) {
        toast({
          title: "Cleanup failed",
          description:
            error.message || "An unexpected error occurred during cleanup",
          variant: "destructive",
        });
      } finally {
        setIsCleaningUp(false);
      }
    }
  };
  
  // Reset form function
  const handleReset = () => {
    setSelectedDate(new Date());
    setSelectedRepoId("");
    setCommitMessage("Update documentation with new API endpoints");
    setSelectedFile("docs/api-reference.md");
    setCommitTime("2:30 PM");
  };
  
  // Handle create commit with immediate refresh 
  const handleCreateCommit = async () => {
    if (!selectedRepoId || !commitMessage || !selectedFile || !selectedDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingCommit(true);
    
    try {
      const selectedRepo = repositories.find(
        (repo) => repo.id.toString() === selectedRepoId
      );
      
      if (!selectedRepo) {
        throw new Error("Selected repository not found");
      }
      
      // Format according to what the server expects in streak.controller.ts
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      // Convert time like "2:30 PM" to ISO datetime format
      const timeComponents = commitTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hours = parseInt(timeComponents?.[1] || "12");
      const minutes = timeComponents?.[2] || "00";
      const period = timeComponents?.[3]?.toUpperCase() || "PM";
      
      // Adjust hours for PM
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${minutes}:00`;
      const dateTime = `${formattedDate}T${formattedTime}Z`;
      
      await streakService.createBackdatedCommit({
        // Original fields for compatibility
        repositoryName: selectedRepo.name, 
        owner: selectedRepo.owner.login,
        date: formattedDate,
        time: commitTime,
        message: commitMessage,
        filePath: selectedFile,
        // Server-required fields
        repository: selectedRepo.name,
        repositoryUrl: selectedRepo.html_url,
        commitMessage: commitMessage,
        dateTime: dateTime,
        content: fileContent, // Use the actual edited content
      });
      
      toast({
        title: "Success",
        description: "Commit created successfully",
      });
      
      // Reset form
      setCommitMessage("");
      setSelectedFile("");
      
      // Refresh commit history immediately and then again after a delay
      // to ensure we catch both immediate changes and status updates
      refetchHistory();
      setTimeout(() => {
        refetchHistory();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating commit:", error);
      toast({
        title: "Failed to create commit",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCommit(false);
    }
  };
  
  // Handle cancel commit
  const handleCancelCommit = async (commitId: string) => {
    try {
      // Optimistically update UI first for better UX
      toast({
        title: "Cancelling commit...",
        description: "Please wait while we cancel the commit",
      });
      
      const success = await cancelCommit(commitId);
      
      if (success) {
        toast({
          title: "Commit cancelled",
          description: "The commit has been removed from your activity list",
        });
        
        // Force refresh history after a short delay
        setTimeout(() => {
          refetchHistory();
        }, 500);
      } else {
        toast({
          title: "Failed to cancel commit",
          description: "There was an error cancelling the commit",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Cancel commit error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle retry commit
  const handleRetryCommit = async (commitId: string) => {
    try {
      const success = await retryCommit(commitId);
      if (success) {
        toast({
          title: "Retry initiated",
          description: "The commit is being retried",
        });
      } else {
        toast({
          title: "Failed to retry commit",
          description: "There was an error retrying the commit",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Format dates safely
  const formatDateFromString = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };
  
  const handleScheduleCommit = async () => {
    if (!selectedRepoId || !selectedDate || !selectedFile || !commitMessage) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSchedulingCommit(true);
    
    try {
      const selectedRepo = repositories.find(
        (repo) => repo.id.toString() === selectedRepoId
      );
      
      if (!selectedRepo) {
        throw new Error("Selected repository not found");
      }
      
      // Format according to what the server expects in streak.controller.ts
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      // Convert time like "2:30 PM" to ISO datetime format
      const timeComponents = commitTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hours = parseInt(timeComponents?.[1] || "12");
      const minutes = timeComponents?.[2] || "00";
      const period = timeComponents?.[3]?.toUpperCase() || "PM";
      
      // Adjust hours for PM
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${minutes}:00`;
      const dateTime = `${formattedDate}T${formattedTime}Z`;
      
      await streakService.scheduleCommit({
        repositoryName: selectedRepo.name,
        owner: selectedRepo.owner.login,
        date: formattedDate,
        time: commitTime,
        message: commitMessage,
        filePath: selectedFile,
        repository: selectedRepo.name,
        repositoryUrl: selectedRepo.html_url,
        commitMessage: commitMessage,
        dateTime: dateTime,
        content: fileContent, // Use the actual edited content
      });
      
      toast({
        title: "Success",
        description: "Commit scheduled successfully",
      });
      
      // Reset form
      setCommitMessage("");
      setSelectedFile("");
      
      // Refresh commit history immediately and then again after a delay
      // to ensure we catch both immediate changes and status updates
      refetchHistory();
      setTimeout(() => {
        refetchHistory();
      }, 2000);
    } catch (error: any) {
      console.error("Error scheduling commit:", error);
      toast({
        title: "Failed to schedule commit",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSchedulingCommit(false);
    }
  };
  
  // Handle bulk scheduling
  const handleBulkSchedule = async () => {
    if (
      !selectedRepoId ||
      !bulkStartDate ||
      !bulkEndDate
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for files - either selectedFile or filesToChange must have values
    if (!selectedFile && filesToChange.length === 0) {
      toast({
        title: "Missing file selection",
        description: "Please select at least one file to modify",
        variant: "destructive",
      });
      return;
    }

    // Ensure we have at least one message template
    const templates = messageTemplates.split('\n').filter(t => t.trim());
    if (templates.length === 0) {
      toast({
        title: "Missing commit messages",
        description: "Please provide at least one commit message template",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure there's at least one time selected if in multiple mode
    if (timeSelectionMode === "multiple" && selectedTimes.length === 0) {
      toast({
        title: "Missing time selection",
        description: "Please select at least one time or generate random times",
        variant: "destructive",
      });
      return;
    }
    
    // Validate dates
    if (isBefore(bulkEndDate, bulkStartDate)) {
      toast({
        title: "Invalid date range",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }
    
    setIsBulkScheduling(true);
    
    try {
      const selectedRepo = repositories.find(
        (repo) => repo.id.toString() === selectedRepoId
      );
      
      if (!selectedRepo) {
        throw new Error("Selected repository not found");
      }
      
      // Format dates
      const startDateStr = format(bulkStartDate, "yyyy-MM-dd");
      const endDateStr = format(bulkEndDate, "yyyy-MM-dd");
      
      // Get the time components
      let timeRange;
      
      if (timeSelectionMode === "single") {
        // Single time mode - use the same time for start and end
        const timeComponents = commitTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        let hours = parseInt(timeComponents?.[1] || "12");
        const minutes = timeComponents?.[2] || "00";
        const period = timeComponents?.[3]?.toUpperCase() || "PM";
        
        // Adjust hours for PM
        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        
        // Format time range
        const formattedTime = `${hours
          .toString()
          .padStart(2, "0")}:${minutes}:00`;
        
        timeRange = {
          start: formattedTime,
          end: formattedTime, // Same time for all commits
        };
      } else {
        // Multiple times mode - collect all times into an array
        // We need to convert to 24-hour format for the server
        const times24h = selectedTimes.map((time) => {
          const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return "12:00:00";
          
          let hours = parseInt(match[1]);
          const minutes = match[2];
          const period = match[3].toUpperCase();
          
          if (period === "PM" && hours < 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          
          return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
        });
        
        // If we have multiple times, pick random ones for each day
        // The server will distribute these times across the scheduled days
        timeRange = {
          times: times24h,
        };
      }
      
      // Calculate days in the range
      const dateRange = eachDayOfInterval({
        start: bulkStartDate,
        end: bulkEndDate,
      });
      
      // Preview what days will be included based on frequency
      const daysToCommit = dateRange.filter((date) => {
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
        
        switch (frequency) {
          case "daily":
            return true;
          case "weekdays":
            return dayOfWeek > 0 && dayOfWeek < 6; // Monday to Friday
          case "weekends":
            return dayOfWeek === 0 || dayOfWeek === 6; // Saturday & Sunday
          case "custom":
            return selectedDays.includes(dayOfWeek);
          default:
            return false;
        }
      });
      
      // Generate a preview before submitting
      generateCommitPreview();

      // Get all files to change (either from the list or just the selected file)
      const filesToSubmit = filesToChange.length > 0 
        ? filesToChange 
        : [selectedFile];

      // Schedule the bulk commits with the array of message templates
      await streakService.scheduleBulkCommits({
        repositoryName: selectedRepo.name,
        owner: selectedRepo.owner.login,
        startDate: startDateStr,
        endDate: endDateStr,
        timeRange: timeRange,
        messageTemplates: templates, // Send all templates
        filesToChange: filesToSubmit,
        frequency: frequency,
        customDays: frequency === "custom" ? selectedDays : undefined,
        repositoryUrl: selectedRepo.html_url,
      });
      
      toast({
        title: "Success",
        description: `Scheduled ${daysToCommit.length} commits successfully`,
      });
      
      // Reset form
      setMessageTemplate("Update documentation");
      setSelectedFile("");
      
      // Refresh commit history
      refetchHistory();
    } catch (error: any) {
      console.error("Error scheduling bulk commits:", error);
      toast({
        title: "Failed to schedule bulk commits",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsBulkScheduling(false);
    }
  };
  
  // Helper function to toggle a day in selectedDays array
  const toggleSelectedDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  // Calendar selection handlers (to fix type issues)
  const handleStartDateSelect = (date: Date | undefined) => {
    setBulkStartDate(date);
  };
  
  const handleEndDateSelect = (date: Date | undefined) => {
    setBulkEndDate(date);
  };

  // Function to generate sample commit messages
  const generateSampleMessages = () => {
    const samples = [
      "Update documentation for {date}",
      "Fix typo in API reference",
      "Add missing code comments",
      "Update changelog with recent changes",
      "Refactor code for better readability",
      "Fix formatting issues",
      "Update dependencies list",
      "Add examples to documentation",
      "Improve error handling documentation",
      "Update API usage examples"
    ];
    setMessageTemplates(samples.join("\n"));
  };

  // Functions to manage multiple files for bulk commits
  const addFileToList = () => {
    if (selectedFile && !filesToChange.includes(selectedFile)) {
      setFilesToChange((prev) => [...prev, selectedFile]);
      setSelectedFile(""); // Clear selected file after adding
    }
  };

  const removeFileFromList = (index: number) => {
    setFilesToChange((prev) => prev.filter((_, i) => i !== index));
  };

  // Add a preview generation function for bulk commits
  const generateCommitPreview = () => {
    if (!bulkStartDate || !bulkEndDate) {
      return [];
    }
    
    // Files to use for preview - either the selected files list or current selected file
    const files = filesToChange.length > 0 ? filesToChange : [selectedFile];
    if (files.length === 0 || !files[0]) {
      return [];
    }
    
    // Filter days based on frequency
    const dateRange = eachDayOfInterval({
      start: bulkStartDate,
      end: bulkEndDate,
    });
    
    const daysToCommit = dateRange.filter((date) => {
      const dayOfWeek = date.getDay();
      switch (frequency) {
        case 'daily': return true;
        case 'weekdays': return dayOfWeek > 0 && dayOfWeek < 6;
        case 'weekends': return dayOfWeek === 0 || dayOfWeek === 6;
        case 'custom': return selectedDays.includes(dayOfWeek);
        default: return false;
      }
    });
    
    if (daysToCommit.length === 0) {
      return [];
    }
    
    // Generate random times if using multiple times
    const times = timeSelectionMode === 'single' 
      ? [commitTime]
      : selectedTimes.length > 0 
        ? selectedTimes
        : ['9:30 AM', '11:45 AM', '2:15 PM', '4:30 PM', '6:20 PM'];
    
    // Get message templates
    const templates = messageTemplates.split('\n').filter(t => t.trim());
    if (templates.length === 0) {
      return [];
    }
    
    // Generate preview (up to 5 entries)
    const previewCount = Math.min(5, daysToCommit.length);
    const preview: Array<{date: string; time: string; message: string; file: string}> = [];
    
    for (let i = 0; i < previewCount; i++) {
      const date = daysToCommit[i];
      const randomTime = times[Math.floor(Math.random() * times.length)];
      let randomMessage = templates[Math.floor(Math.random() * templates.length)];
      
      // Replace template variables
      randomMessage = randomMessage.replace('{date}', format(date, 'MMM d, yyyy'));
      
      const randomFile = files[Math.floor(Math.random() * files.length)];
      
      preview.push({
        date: format(date, 'EEE, MMM d, yyyy'),
        time: randomTime,
        message: randomMessage,
        file: randomFile
      });
    }
    
    // Explicitly update the state - ensure we're creating a new array
    setCommitPreview([...preview]);
    return preview;
  };
  
  // Auto-generate preview when all required fields are set
  useEffect(() => {
    if (
      selectedRepoId &&
      bulkStartDate &&
      bulkEndDate &&
      (filesToChange.length > 0 || selectedFile) &&
      messageTemplates.split('\n').filter(t => t.trim()).length > 0
    ) {
      generateCommitPreview();
    }
  }, [
    selectedRepoId, 
    bulkStartDate, 
    bulkEndDate, 
    filesToChange, 
    selectedFile, 
    messageTemplates,
    frequency,
    selectedDays,
    timeSelectionMode,
    commitTime,
    selectedTimes
  ]);
  
  // Add this new function to fetch file content when a file is selected
  const fetchFileContent = async (
    owner: string,
    repo: string,
    path: string
  ) => {
    setIsLoadingFileContent(true);
    try {
      const data = await githubFileService.getFileContent(owner, repo, path);
      setFileContent(data.content);
      setOriginalFileContent(data.content);
      
      // Set language based on file extension
      const extension = path.split(".").pop()?.toLowerCase();
      switch (extension) {
        case "js":
          setFileLanguage("javascript");
          break;
        case "ts":
          setFileLanguage("typescript");
          break;
        case "jsx":
          setFileLanguage("javascript");
          break;
        case "tsx":
          setFileLanguage("typescript");
          break;
        case "py":
          setFileLanguage("python");
          break;
        case "html":
          setFileLanguage("html");
          break;
        case "css":
          setFileLanguage("css");
          break;
        case "json":
          setFileLanguage("json");
          break;
        case "md":
          setFileLanguage("markdown");
          break;
        default:
          setFileLanguage("plaintext");
      }
    } catch (error: any) {
      toast({
        title: "Failed to fetch file content",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setFileContent("// Error loading file content. Please try another file.");
    } finally {
      setIsLoadingFileContent(false);
    }
  };
  
  // Add a useEffect hook to fetch file content when repository or file changes
  useEffect(() => {
    if (selectedRepoId && selectedFile) {
      const selectedRepo = repositories.find(
        (repo) => repo.id.toString() === selectedRepoId
      );
      if (selectedRepo) {
        fetchFileContent(
          selectedRepo.owner.login,
          selectedRepo.name,
          selectedFile
        );
      }
    }
  }, [selectedRepoId, selectedFile, repositories]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streak Manager</h1>
          <p className="text-muted-foreground">
            Fix gaps in your contribution timeline.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="fix-gaps">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fix-gaps">Fix Missed Days</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Commits</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fix-gaps" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Fix Missed Contribution</CardTitle>
                <CardDescription>
                  Create a legitimate commit for a day when local work wasn't
                  pushed
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <div className="flex gap-4">
                    <div className="w-full">
                      <DatePicker
                        date={selectedDate}
                        setDate={setSelectedDate}
                      />
                      {selectedDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(selectedDate, "EEEE")} ({daysSince} days ago)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Repository
                  </label>
                  <Select 
                    value={selectedRepoId} 
                    onValueChange={setSelectedRepoId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingRepos ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading repositories...</span>
                        </div>
                      ) : repoError ? (
                        <div className="text-red-500 p-2 text-sm">
                          {repoError}
                        </div>
                      ) : repositories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No repositories found
                        </div>
                      ) : (
                        repositories.map((repo) => (
                          <SelectItem key={repo.id} value={repo.id.toString()}>
                            <div className="flex items-center gap-2">
                              {repo.private ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Globe className="h-3 w-3" />
                              )}
                              {repo.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message</label>
                  <Textarea 
                    placeholder="Enter commit message" 
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      File to Change
                    </label>
                  </div>
                  <FileSelector 
                    file={selectedFile}
                    setFile={setSelectedFile}
                    repository={
                      repositories.find(
                        (repo) => repo.id.toString() === selectedRepoId
                      )?.name
                    }
                    repoOwner={
                      repositories.find(
                        (repo) => repo.id.toString() === selectedRepoId
                      )?.owner?.login
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">File Content</label>
                    {isLoadingFileContent && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Loading...
                      </div>
                    )}
                </div>
                
                  <CodeEditor
                    value={fileContent}
                    onChange={setFileContent}
                    language={fileLanguage}
                    height="250px"
                    className={selectedFile ? "border-border" : "border-dashed"}
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Edit file content to include with your commit</span>
                    {fileContent !== originalFileContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs"
                        onClick={() => setFileContent(originalFileContent)}
                      >
                        Reset changes
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Time</label>
                  <TimePicker time={commitTime} setTime={setCommitTime} />
                  <div className="text-xs text-muted-foreground mt-1">
                    Select a time that matches your typical activity pattern
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button 
                  className="gap-2" 
                  onClick={handleCreateCommit}
                  disabled={isCreatingCommit || !selectedRepoId}
                >
                  {isCreatingCommit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitCommit className="h-4 w-4" />
                  )}
                  Create Commit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>
                  Check details before creating commit
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Repository
                  </div>
                  <div className="text-sm font-medium">
                    {selectedRepoId
                      ? repositories.find(
                          (repo) => repo.id.toString() === selectedRepoId
                        )?.name || "Not selected"
                      : "Not selected"}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm font-medium">{formattedDate}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-sm font-medium">{commitTime}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Message</div>
                  <div className="text-sm font-medium">{commitMessage}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">File</div>
                  <div className="text-sm font-medium">{selectedFile}</div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  {selectedRepoId && commitMessage && selectedFile ? (
                    <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
                      <Check className="h-4 w-4" />
                      Valid configuration
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-500 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Please complete all fields
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    This will create a legitimate commit that reflects work you
                    did locally but didn't push.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activities</span>
                {isLoadingHistory && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                Your recent streak management actions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {historyError ? (
                <div className="text-red-500 p-2">{historyError}</div>
              ) : commitHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activities found
                </div>
              ) : (
                <div className="space-y-4">
                  {commitHistory.slice(0, 5).map((commit) => (
                    <div
                      key={commit._id}
                      className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      {commit.status === "completed" ? (
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      ) : commit.status === "pending" ? (
                        <div className="bg-amber-500/10 p-2 rounded-full">
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="bg-red-500/10 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {commit.status === "completed"
                              ? "Commit created successfully"
                              : commit.status === "pending"
                              ? "Commit in progress"
                              : "Commit failed"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {commit.timeAgo ||
                              format(new Date(commit.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          {commit.status === "pending"
                            ? "Creating"
                            : commit.status === "completed"
                            ? "Created"
                            : "Failed to create"}{" "}
                          commit for {formatDateFromString(commit.dateTime)} in
                          repository{" "}
                          <span className="font-medium">
                            {commit.repository}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{commit.commitMessage}</span>
                          </div>
                          
                          {commit.hashId && (
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-3.5 w-3.5" />
                              <span>{commit.hashId.substring(0, 7)}</span>
                            </div>
                          )}
                        </div>
                        
                        {commit.status === "failed" && commit.errorMessage && (
                          <div className="bg-red-500/10 text-red-500 text-xs p-2 rounded mt-2">
                            Error: {commit.errorMessage}
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-2">
                          {commit.status === "pending" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 gap-1"
                              onClick={() => handleCancelCommit(commit._id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          )}
                          
                          {commit.status === "failed" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7"
                              onClick={() => handleRetryCommit(commit._id)}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Future Commits</CardTitle>
              <CardDescription>
                Plan commits for days when you know you'll be away
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Repository
                    </label>
                    <Select 
                      value={selectedRepoId} 
                      onValueChange={setSelectedRepoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingRepos ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading repositories...</span>
                          </div>
                        ) : repoError ? (
                          <div className="text-red-500 p-2 text-sm">
                            {repoError}
                          </div>
                        ) : repositories.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No repositories found
                          </div>
                        ) : (
                          repositories.map((repo) => (
                            <SelectItem
                              key={repo.id}
                              value={repo.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                {repo.private ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <Globe className="h-3 w-3" />
                                )}
                                {repo.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Date</label>
                    <div className="grid gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <StyledCalendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              isBefore(date, startOfDay(new Date()))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {selectedDate && (
                        <div className="text-xs text-muted-foreground">
                          {format(selectedDate, "EEEE")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commit Time</label>
                    <TimePicker time={commitTime} setTime={setCommitTime} />
                    <div className="text-xs text-muted-foreground">
                      Select a time that matches your typical activity pattern
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Commit Message
                    </label>
                    <Textarea 
                      placeholder="Enter commit message" 
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Files to Change
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                    <FileSelector 
                      file={selectedFile}
                      setFile={setSelectedFile}
                          repository={
                            repositories.find(
                              (repo) => repo.id.toString() === selectedRepoId
                            )?.name
                          }
                          repoOwner={
                            repositories.find(
                              (repo) => repo.id.toString() === selectedRepoId
                            )?.owner?.login
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={addFileToList}
                        disabled={!selectedFile}
                        className="self-end"
                      >
                        Add to List
                      </Button>
                    </div>
                    
                    {filesToChange.length > 0 && (
                      <div className="mt-2 border rounded-md p-2">
                        <div className="text-sm font-medium mb-1">Selected Files:</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {filesToChange.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{file}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFileFromList(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Add one or more files to be modified with each commit
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        File Content
                      </label>
                      {isLoadingFileContent && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Loading...
                        </div>
                      )}
                    </div>
                    
                    <CodeEditor
                      value={fileContent}
                      onChange={setFileContent}
                      language={fileLanguage}
                      height="300px"
                      className={
                        selectedFile ? "border-border" : "border-dashed"
                      }
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Edit file content to include with your commit</span>
                      {fileContent !== originalFileContent && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 px-2 text-xs"
                          onClick={() => setFileContent(originalFileContent)}
                        >
                          Reset changes
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4 mt-4">
                    <h3 className="font-medium text-sm">Schedule Summary</h3>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Repository:
                      </div>
                      <div className="font-medium">
                        {selectedRepoId
                          ? repositories.find(
                              (repo) => repo.id.toString() === selectedRepoId
                            )?.name || "Not selected"
                          : "Not selected"}
                      </div>
                      </div>
                      
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Date Range:
                      </div>
                      <div className="font-medium">
                        {bulkStartDate && bulkEndDate
                          ? `${format(
                              bulkStartDate,
                              "MMM d, yyyy"
                            )} to ${format(bulkEndDate, "MMM d, yyyy")}`
                          : "Not selected"}
                      </div>
                      </div>
                      
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Frequency:
                      </div>
                      <div className="font-medium capitalize">
                        {frequency}
                        {frequency === "custom" && selectedDays.length > 0 && (
                          <span className="text-xs ml-2 text-muted-foreground">
                            (
                            {selectedDays
                              .sort()
                              .map(
                                (day) =>
                                  [
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                  ][day]
                              )
                              .join(", ")}
                            )
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Total Commits:
                      </div>
                      <div className="font-medium">
                        {bulkStartDate && bulkEndDate ? (
                          <Badge>
                            {
                              eachDayOfInterval({
                                start: bulkStartDate,
                                end: bulkEndDate,
                              }).filter((date) => {
                                const dayOfWeek = date.getDay();
                                switch (frequency) {
                                  case "daily":
                                    return true;
                                  case "weekdays":
                                    return dayOfWeek > 0 && dayOfWeek < 6;
                                  case "weekends":
                                    return dayOfWeek === 0 || dayOfWeek === 6;
                                  case "custom":
                                    return selectedDays.includes(dayOfWeek);
                                  default:
                                    return false;
                                }
                              }).length
                            }{" "}
                            commits
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Time Settings:
                      </div>
                      <div className="font-medium">
                        {timeSelectionMode === "single"
                          ? commitTime
                          : selectedTimes.length > 0
                          ? `${selectedTimes.length} time${
                              selectedTimes.length !== 1 ? "s" : ""
                            } selected`
                          : "No times selected"}
                      </div>
                    </div>

                    {/* Commit Preview Section */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Commit Preview: {commitPreview.length > 0 ? `${commitPreview.length} items` : 'Empty'}</h4>
                      {commitPreview.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {commitPreview.map((preview, index) => (
                            <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium">{preview.date}</span>
                                <span className="text-muted-foreground">{preview.time}</span>
                              </div>
                              <div className="text-sm mt-1">{preview.message}</div>
                              <div className="text-xs text-muted-foreground mt-1">File: {preview.file}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
                          Click "Generate Preview" to see sample commits
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        This is a sample of how your commits will look. Each commit will randomly select from your message templates and files.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-4">
                      <Button 
                        onClick={() => {
                          // Generate preview and immediately update state with the returned data
                          const preview = generateCommitPreview();
                          // Force a state update by creating a new array to ensure rerenders
                          setCommitPreview([...preview]);
                          
                          // Scroll to preview section
                          setTimeout(() => {
                            const previewElement = document.getElementById('bulk-commit-preview-section');
                            if (previewElement) {
                              previewElement.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        variant="secondary"
                      >
                        Generate Preview
                      </Button>
                      
                      {/* Commit Preview Section */}
                      <div id="bulk-commit-preview-section" className="border border-border rounded-md p-4 mt-4">
                        <h3 className="text-lg font-medium mb-2">Commit Preview</h3>
                        {commitPreview.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-2">
                              Preview of {Math.min(5, commitPreview.length)} commits out of {commitPreview.length} total:
                            </p>
                            {commitPreview.map((item, index) => (
                              <div key={index} className="bg-secondary/50 p-2 rounded-md">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{item.date}</span>
                                  <span>{item.time}</span>
                                </div>
                                <div className="font-medium mt-1">{item.message}</div>
                                <div className="text-xs text-muted-foreground mt-1">File: {item.file}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p>No preview available. Click "Generate Preview" to see example commits.</p>
                            <p className="text-xs mt-1">
                              Make sure you've selected date range, frequency, and added message templates.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Scheduled Commits</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleCleanupPendingCommits}
                    disabled={isCleaningUp || isLoadingHistory}
                  >
                    {isCleaningUp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cleaning...
                      </>
                    ) : (
                      <>
                        <Trash className="h-4 w-4" />
                        Clean All Pending
                      </>
                    )}
                  </Button>
                </div>
                
                {isLoadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commitHistory
                      .filter((commit) => commit.status === "pending")
                      .map((commit) => (
                        <div
                          key={commit._id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-amber-500/10 p-2 rounded-full">
                              <Clock className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {formatDateFromString(commit.dateTime)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {commit.repository}: {commit.commitMessage}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancelCommit(commit._id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ))}
                    
                    {commitHistory.filter(
                      (commit) => commit.status === "pending"
                    ).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No scheduled commits found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Create multiple commits across a date range
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Select Repository
                    </label>
                    <Select 
                      value={selectedRepoId} 
                      onValueChange={setSelectedRepoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingRepos ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading repositories...</span>
                          </div>
                        ) : repoError ? (
                          <div className="text-red-500 p-2 text-sm">
                            {repoError}
                          </div>
                        ) : repositories.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No repositories found
                          </div>
                        ) : (
                          repositories.map((repo) => (
                            <SelectItem
                              key={repo.id}
                              value={repo.id.toString()}
                            >
                              <div className="flex items-center gap-2">
                                {repo.private ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <Globe className="h-3 w-3" />
                                )}
                                {repo.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <BulkDatePicker
                        date={bulkStartDate}
                        setDate={setBulkStartDate}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <BulkDatePicker
                        date={bulkEndDate}
                        setDate={setBulkEndDate}
                        disabledDate={(date) =>
                          bulkStartDate ? isBefore(date, bulkStartDate) : false
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Commit Time</label>
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          variant={
                            timeSelectionMode === "single"
                              ? "default"
                              : "outline"
                          }
                          className="h-7 text-xs"
                          onClick={() => setTimeSelectionMode("single")}
                        >
                          Single Time
                        </Button>
                        <Button 
                          size="sm" 
                          variant={
                            timeSelectionMode === "multiple"
                              ? "default"
                              : "outline"
                          }
                          className="h-7 text-xs"
                          onClick={() => setTimeSelectionMode("multiple")}
                        >
                          Multiple Times
                        </Button>
                      </div>
                    </div>
                    
                    {timeSelectionMode === "single" ? (
                      <TimePicker time={commitTime} setTime={setCommitTime} />
                    ) : (
                      <TimePicker 
                        time={commitTime} 
                        setTime={setCommitTime} 
                        multiMode={true} 
                        times={selectedTimes} 
                        setTimes={setSelectedTimes} 
                      />
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {timeSelectionMode === "single"
                        ? "All commits will be scheduled at this time"
                        : "Select multiple times or generate random times for varied activity patterns"}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Commit Message Templates
                    </label>
                    <div className="space-y-2">
                    <Textarea 
                        placeholder="Enter multiple message templates (one per line)"
                        value={messageTemplates}
                        onChange={(e) => setMessageTemplates(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={generateSampleMessages}
                          className="text-xs"
                        >
                          <RefreshCcw className="h-3 w-3 mr-1" />
                          Generate Samples
                        </Button>
                    <div className="text-xs text-muted-foreground">
                          Each line will be used as a separate message template
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Use {"{date}"} for dynamic date insertion, e.g.: "Update for {"{date}"}"
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Files to Change
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                    <FileSelector 
                      file={selectedFile}
                      setFile={setSelectedFile}
                          repository={
                            repositories.find(
                              (repo) => repo.id.toString() === selectedRepoId
                            )?.name
                          }
                          repoOwner={
                            repositories.find(
                              (repo) => repo.id.toString() === selectedRepoId
                            )?.owner?.login
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={addFileToList}
                        disabled={!selectedFile}
                        className="self-end"
                      >
                        Add to List
                      </Button>
                    </div>
                    
                    {filesToChange.length > 0 && (
                      <div className="mt-2 border rounded-md p-2">
                        <div className="text-sm font-medium mb-1">Selected Files:</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {filesToChange.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="truncate">{file}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFileFromList(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Add one or more files to be modified with each commit
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select 
                      value={frequency} 
                      onValueChange={(value) =>
                        setFrequency(
                          value as "daily" | "weekdays" | "weekends" | "custom"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily (Every day)</SelectItem>
                        <SelectItem value="weekdays">
                          Weekdays (Monday-Friday)
                        </SelectItem>
                        <SelectItem value="weekends">
                          Weekends (Saturday-Sunday)
                        </SelectItem>
                        <SelectItem value="custom">
                          Custom (Select days)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {frequency === "custom" && (
                    <div className="space-y-2 border rounded-lg p-4">
                      <label className="text-sm font-medium">
                        Select days of week
                      </label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {[
                          { day: 0, label: "Sunday" },
                          { day: 1, label: "Monday" },
                          { day: 2, label: "Tuesday" },
                          { day: 3, label: "Wednesday" },
                          { day: 4, label: "Thursday" },
                          { day: 5, label: "Friday" },
                          { day: 6, label: "Saturday" },
                        ].map(({ day, label }) => (
                          <div
                            key={day}
                            className="flex items-center space-x-2"
                          >
                            <Switch
                              id={`day-${day}`}
                              checked={selectedDays.includes(day)}
                              onCheckedChange={() => toggleSelectedDay(day)}
                            />
                            <UILabel htmlFor={`day-${day}`}>{label}</UILabel>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    
                    <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Time Settings:
                      </div>
                      <div className="font-medium">
                      {timeSelectionMode === "single"
                          ? commitTime 
                          : selectedTimes.length > 0 
                        ? `${selectedTimes.length} time${
                            selectedTimes.length !== 1 ? "s" : ""
                          } selected`
                        : "No times selected"}
                      </div>
                    </div>
                    
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Generate preview and immediately update state with the returned data
                        const preview = generateCommitPreview();
                        // Force a state update by creating a new array to ensure rerenders
                        setCommitPreview([...preview]);
                        
                        // Scroll to preview section
                        setTimeout(() => {
                          const previewElement = document.getElementById('bulk-commit-preview-section');
                          if (previewElement) {
                            previewElement.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 100);
                      }}
                      disabled={
                        !selectedRepoId ||
                        !bulkStartDate ||
                        !bulkEndDate ||
                        (filesToChange.length === 0 && !selectedFile) ||
                        messageTemplates.split("\n").filter(t => t.trim()).length === 0
                      }
                    >
                      Generate Preview
                    </Button>
                    
                    <Button 
                      className="flex-1"
                      onClick={handleBulkSchedule}
                      disabled={
                        isBulkScheduling ||
                        !selectedRepoId ||
                        !bulkStartDate ||
                        !bulkEndDate ||
                        (filesToChange.length === 0 && !selectedFile) ||
                        messageTemplates.split("\n").filter(t => t.trim()).length === 0
                      }
                    >
                      {isBulkScheduling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Scheduling...
                        </>
                      ) : (
                        <>Schedule Bulk Commits</>
                      )}
                    </Button>
                  </div>
                  
                  {/* Add Commit Preview Section to Bulk Tab */}
                  <div id="bulk-commit-preview-section" className="border rounded-md p-4 mt-6">
                    <h3 className="text-lg font-medium mb-2">Commit Preview</h3>
                    {commitPreview.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Preview of {Math.min(5, commitPreview.length)} commits out of {commitPreview.length} total:
                        </p>
                        {commitPreview.map((item, index) => (
                          <div key={index} className="bg-secondary/50 p-2 rounded-md mb-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.date}</span>
                              <span>{item.time}</span>
                            </div>
                            <div className="font-medium mt-1">{item.message}</div>
                            <div className="text-xs text-muted-foreground mt-1">File: {item.file}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No preview available. Click "Generate Preview" to see example commits.</p>
                        <p className="text-xs mt-1">
                          Make sure you've selected date range, frequency, and added message templates.
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      This is a sample of how your commits will look. Each commit will randomly select from your message templates and files.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StreakPage;
