import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LineChart, Line } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';

interface RepositoryStatsProps {
  repositoryName: string | null;
}

// Mock data - this would be replaced with actual API data
const generateMockCommitData = (repositoryName: string) => {
  const mockData = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = subMonths(today, 11 - i);
    mockData.push({
      month: format(date, 'MMM'),
      date: format(date, 'yyyy-MM-dd'),
      commits: Math.floor(Math.random() * 30) + 5,
    });
  }
  
  return mockData;
};

const generateMockFrequencyData = (repositoryName: string) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek.map(day => ({
    day,
    value: Math.floor(Math.random() * 20) + 1,
  }));
};

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm p-3 border border-border rounded shadow-md text-xs">
        <p className="font-semibold text-sm mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: payload[0].color || payload[0].stroke }} 
          />
          <p className="text-foreground">
            {`Commits: ${payload[0].value}`}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Color scales for the charts
const getBarColor = (value: number) => {
  if (value > 15) return '#10b981'; // High activity - green
  if (value > 8) return '#0ea5e9';  // Medium activity - blue
  if (value > 3) return '#6366f1';  // Low activity - indigo
  return '#8b5cf6';                 // Very low activity - purple
};

export const ContributionFrequency = ({ data }: { data: any[] }) => {
  const freqMax = Math.max(...data.map(d => d.value), 10);
  
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-sm font-medium mb-3">Contribution Frequency</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.15} />
            <XAxis 
              dataKey="day" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dy={5}
            />
            <YAxis 
              hide={true} 
              domain={[0, freqMax + Math.ceil(freqMax * 0.2)]} // Add 20% space on top
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]} 
              minPointSize={3}
              barSize={26}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.value)} 
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ActivityTrends = ({ data }: { data: any[] }) => {
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-sm font-medium mb-3">Activity Trends</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.15} />
            <XAxis 
              dataKey="month" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dy={5}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="commits" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ r: 3, fill: "#0ea5e9" }}
              activeDot={{ r: 5, stroke: "#0ea5e9", strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const RepositoryStats = ({ repositoryName }: RepositoryStatsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepositoryStats = async () => {
      if (!repositoryName) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // In a real application, you would fetch this data from your API
        // const response = await repoService.getRepositoryStats(repositoryName);
        
        // For now, we'll use mock data
        const mockFrequencyData = generateMockFrequencyData(repositoryName);
        const mockTrendsData = generateMockCommitData(repositoryName);
        
        // Short delay to simulate API call
        setTimeout(() => {
          setFrequencyData(mockFrequencyData);
          setTrendsData(mockTrendsData);
          setLoading(false);
        }, 800);
        
      } catch (err: any) {
        console.error('Failed to fetch repository stats:', err);
        setError(err.message || 'Failed to load repository statistics');
        setLoading(false);
      }
    };
    
    fetchRepositoryStats();
  }, [repositoryName]);

  if (!repositoryName) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        Please select a repository to view statistics
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground ml-3">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ContributionFrequency data={frequencyData} />
          <ActivityTrends data={trendsData} />
        </div>
      )}
    </>
  );
};

export default RepositoryStats; 