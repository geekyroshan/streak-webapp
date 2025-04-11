
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCommit, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

export const BackdatingCard = () => {
  // Example missed days data
  const missedDays = [
    { date: 'March 25, 2025', dayOfWeek: 'Tuesday', daysAgo: 8, priority: 'high' },
    { date: 'April 2, 2025', dayOfWeek: 'Wednesday', daysAgo: 2, priority: 'medium' }
  ];

  return (
    <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-secondary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-primary" />
              GitHub Streak Backdating
            </CardTitle>
            <CardDescription>
              Fix gaps in your contribution history with legitimate commits
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">Core Feature</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We've detected <span className="font-semibold text-primary">{missedDays.length} missed days</span> in your recent GitHub activity that could break your streak.
          </p>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Fix Missed Contributions:</h4>
            {missedDays.map((day, index) => (
              <div key={index} className="flex items-center gap-2 bg-secondary/20 p-3 rounded-md cursor-pointer hover:bg-secondary/30 transition-colors">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">{day.date}</div>
                  <div className="text-xs text-muted-foreground">{day.dayOfWeek} ({day.daysAgo} days ago)</div>
                </div>
                <Badge className="ml-auto" variant={day.priority === 'high' ? 'default' : 'secondary'}>
                  {day.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Last updated 5 minutes ago
          </div>
          <Link to="/streak">
            <Button className="gap-2">
              <GitCommit className="h-4 w-4" />
              Fix Missed Days
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
