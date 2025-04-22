import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlassCardHeader, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Sparkle, SparkleGroup } from '@/components/ui/sparkle';
import { Github, GitMerge, CalendarDays, LineChart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl w-full space-y-12">
          <div className="text-center relative">
            <div className="absolute -top-24 right-1/4">
              <Sparkle size="lg" color="bg-purple-500" className="animate-float" />
            </div>
            <div className="absolute -top-10 right-1/3">
              <Sparkle size="md" color="bg-pink-400" className="animate-float delay-300" />
            </div>
            <div className="absolute top-20 right-1/4">
              <Sparkle size="sm" color="bg-blue-400" className="animate-float delay-700" />
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              GitHub Streak Manager
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
              Maintain your GitHub contribution streak with ease. Analyze patterns, backdate commits, and keep your coding momentum going.
            </p>
            <div className="mt-10 flex justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="glass-button text-lg px-8 py-6 h-auto"
              >
                <Github className="mr-2 h-5 w-5" />
                {isAuthenticated ? 'Go to Dashboard' : 'Login with GitHub'}
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <GlassCard className="transition-all duration-300 hover:translate-y-[-5px]">
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/20">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Track Contributions</h3>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-muted-foreground">
                  Visualize your GitHub activity with an interactive calendar and detailed analytics.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="transition-all duration-300 hover:translate-y-[-5px]" variant="opaque">
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <GitMerge className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Backdate Commits</h3>
                </div>
                <SparkleGroup count={3} className="absolute top-3 right-3" />
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-muted-foreground">
                  Create legitimate commits for days when you worked locally but forgot to push your changes.
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="transition-all duration-300 hover:translate-y-[-5px]">
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <LineChart className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Streak Analytics</h3>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-muted-foreground">
                  Get insights into your coding patterns and maintain consistent GitHub activity.
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            GitHub Streak Manager · Maintain your coding momentum · Designed with 💚
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
