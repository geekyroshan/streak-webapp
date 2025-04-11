
import React, { useState } from 'react';
import { ContributionCalendar } from '@/components/ContributionCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download } from 'lucide-react';

const CalendarPage = () => {
  const [view, setView] = useState('year');
  const [yearSelected, setYearSelected] = useState('2025');

  const years = ['2023', '2024', '2025'];
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contribution Calendar</h1>
          <p className="text-muted-foreground">Visualize your GitHub activity over time.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Calendar</CardTitle>
              <CardDescription>Your contribution history</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={view} onValueChange={setView} className="w-[300px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {view === 'year' && (
                <Select value={yearSelected} onValueChange={setYearSelected}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {view === 'month' && (
                <>
                  <Select defaultValue="April">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="2025">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              
              {view === 'week' && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>April 5 - 11, 2025</span>
                  </div>
                  
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Total: 782 contributions</span>
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <span>Daily Average: 2.1</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={view} className="w-full">
            <TabsContent value="year">
              <ContributionCalendar />
            </TabsContent>
            
            <TabsContent value="month">
              <div className="h-[500px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Month view calendar visualization</p>
              </div>
            </TabsContent>
            
            <TabsContent value="week">
              <div className="h-[500px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Week view calendar visualization</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
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
    </div>
  );
};

export default CalendarPage;
