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
      {/* Background pattern overlay */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-repeat" 
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      ></div>
      
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 animate-gradient"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slower"></div>
        </div>
        
        <div className="max-w-6xl w-full space-y-12 z-10">
          <div className="text-center relative">
            <div className="absolute -top-24 left-1/4">
              <Sparkle size="lg" color="bg-primary" className="animate-float" />
            </div>
            <div className="absolute -top-24 right-1/4">
              <Sparkle size="lg" color="bg-purple-500" className="animate-float" />
            </div>
            <div className="absolute -top-10 right-1/3">
              <Sparkle size="md" color="bg-pink-400" className="animate-float delay-300" />
            </div>
            <div className="absolute top-20 right-1/4">
              <Sparkle size="sm" color="bg-blue-400" className="animate-float delay-700" />
            </div>
            <div className="absolute top-10 left-1/3">
              <Sparkle size="md" color="bg-cyan-400" className="animate-float delay-500" />
            </div>
            <div className="absolute bottom-0 right-1/3">
              <Sparkle size="sm" color="bg-indigo-400" className="animate-float delay-200" />
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
                className="glass-button text-lg px-8 py-6 h-auto shadow-glow hover:shadow-glow-hover transition-all duration-300"
              >
                <Github className="mr-2 h-5 w-5" />
                {isAuthenticated ? 'Go to Dashboard' : 'Login with GitHub'}
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Track Contributions Card */}
            <GlassCard 
              className="transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg relative group overflow-hidden"
              style={{
                backgroundImage: 'linear-gradient(to bottom right, rgba(23, 27, 43, 0.7), rgba(16, 185, 129, 0.05))'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Track Contributions</h3>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-muted-foreground">
                  Visualize your GitHub activity with an interactive calendar and detailed analytics.
                </p>
                <div className="mt-4 h-1 w-10 bg-primary/40 group-hover:w-20 transition-all duration-300"></div>
              </GlassCardContent>
            </GlassCard>

            {/* Backdate Commits Card */}
            <GlassCard 
              className="transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg relative group overflow-hidden" 
              variant="dark"
              style={{
                backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 31, 0.85), rgba(124, 58, 237, 0.08))'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <GitMerge className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Backdate Commits</h3>
                </div>
                <SparkleGroup count={3} className="absolute top-3 right-3" />
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-gray-200">
                  Create legitimate commits for days when you worked locally but forgot to push your changes.
                </p>
                <div className="mt-4 h-1 w-10 bg-purple-500/40 group-hover:w-20 transition-all duration-300"></div>
              </GlassCardContent>
            </GlassCard>

            {/* Streak Analytics Card */}
            <GlassCard 
              className="transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg relative group overflow-hidden"
              style={{
                backgroundImage: 'linear-gradient(to bottom right, rgba(23, 27, 43, 0.7), rgba(59, 130, 246, 0.08))'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <GlassCardHeader>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <LineChart className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold">Streak Analytics</h3>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-muted-foreground">
                  Get insights into your coding patterns and maintain consistent GitHub activity.
                </p>
                <div className="mt-4 h-1 w-10 bg-blue-500/40 group-hover:w-20 transition-all duration-300"></div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-center text-sm text-muted-foreground">
              GitHub Streak Manager · Maintain your coding momentum
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2 md:mt-0">
              Designed with <span className="text-primary">♥</span> for developers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
