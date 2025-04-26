import React, { useEffect, useState } from 'react';
import { StreakStats } from '@/components/StreakStats';
import { ContributionCalendar } from '@/components/ContributionCalendar';
import { ActivityPatterns } from '@/components/ActivityPatterns';
import { WelcomeModal } from '@/components/WelcomeModal';
import { BackdatingCard } from '@/components/BackdatingCard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowRight, Loader2, Bug, RefreshCcw, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { contributionService } from '@/lib/api';
import { testApiConnection, verifyToken } from '@/lib/api-test';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // Check for token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      console.log('Token found in URL, storing...');
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Clean up the URL by removing the token parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Reload the page to apply the token
      window.location.reload();
    }
  }, [location]);

  // Fetch current streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getStreakStats();
        setCurrentStreak(data.currentStreak);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch streak data:', error);
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchStreakData();
    }
  }, [isAuthenticated]);

  // Function to run API tests
  const runApiTests = async () => {
    setDebugLoading(true);
    try {
      const testResults = await testApiConnection();
      setDebugInfo(testResults);
      
      const tokenResults = await verifyToken();
      setTokenInfo(tokenResults);
    } catch (error) {
      console.error('Error running API tests:', error);
      setDebugInfo({ error });
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Developer!
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => {
              setShowDebug(!showDebug);
              if (!debugInfo && !showDebug) {
                runApiTests();
              }
            }}
          >
            <Bug className="h-4 w-4" />
            {showDebug ? 'Hide Debug' : 'Debug APIs'}
          </Button>
          
          <div className="text-right">
            <p className="text-sm font-medium">Current streak</p>
            {loading ? (
              <div className="h-8 w-24 bg-muted/30 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            {loading ? (
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-lg font-bold text-primary-foreground">
                {currentStreak}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug information card */}
      {showDebug && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-yellow-500">API Debug Information</CardTitle>
                <CardDescription>Testing API connectivity and token validation</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runApiTests} 
                disabled={debugLoading}
              >
                {debugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                {debugLoading ? 'Testing...' : 'Retest'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {debugLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Running API tests...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Authentication Status:</h3>
                  <Alert variant={tokenInfo?.valid ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {tokenInfo?.valid ? "Token Valid" : "Token Invalid"}
                    </AlertTitle>
                    <AlertDescription>
                      {tokenInfo?.valid 
                        ? `Authenticated as ${tokenInfo.username}`
                        : `Reason: ${tokenInfo?.reason || 'Unknown'}`
                      }
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Debug Info:</h3>
                  <pre className="bg-black/10 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Token in localStorage: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                  <p>Token length: {localStorage.getItem('token')?.length || 0} characters</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Prominent backdating card */}
      <BackdatingCard />
      
      <StreakStats />
      
      <ContributionCalendar />
      
      <ActivityPatterns />
      
      <div className="flex justify-center mt-6">
        <Link to="/streak">
          <Button size="lg" className="px-8 gap-2">
            Manage Your Streak <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <WelcomeModal />
    </div>
  );
};

export default Dashboard;
