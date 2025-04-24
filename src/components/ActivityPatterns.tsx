import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ActivityPatterns = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Patterns</CardTitle>
        <CardDescription>Analysis of your contribution habits</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-3">Contribution by Day of Week</h3>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Day of week chart placeholder</p>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-3">Contribution by Time of Day</h3>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Time of day chart placeholder</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityPatterns; 