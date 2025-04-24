/**
 * Parses a time string in HH:MM format into hours and minutes
 */
export const parseTimeString = (timeString: string): { hours: number, minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Generate a random time within a specified range for a given date
 * @param date The base date
 * @param startTime Start time in format "HH:MM"
 * @param endTime End time in format "HH:MM"
 * @returns Date object with random time in the specified range
 */
export const generateRandomTimeInRange = (
  date: Date,
  startTime: string,
  endTime: string
): Date => {
  // Parse start and end times
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);
  
  // Calculate start and end minutes since midnight
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  
  // Handle case where end time is earlier than start time (next day)
  const totalMinutes = endMinutes > startMinutes 
    ? endMinutes - startMinutes 
    : (24 * 60 - startMinutes) + endMinutes;
  
  // Generate random number of minutes to add to start time
  const randomMinutes = Math.floor(Math.random() * totalMinutes);
  
  // Create a new date object to avoid modifying the original
  const scheduledTime = new Date(date);
  
  // Set the hours and minutes
  const finalMinutes = (startMinutes + randomMinutes) % (24 * 60);
  const hours = Math.floor(finalMinutes / 60);
  const minutes = finalMinutes % 60;
  
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  return scheduledTime;
}; 