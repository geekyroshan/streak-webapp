
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, Calendar, GitCommit, BarChart2 } from 'lucide-react';

export const WelcomeModal = () => {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  
  const steps = [
    {
      title: 'Welcome to GitHub Streak Manager',
      description: 'Your personal assistant for maintaining consistent GitHub contributions.',
      icon: <Github className="w-12 h-12 text-primary mb-2" />,
      content: (
        <div className="flex flex-col items-center text-center">
          <p className="mb-4">
            Never miss a streak again. We'll help you analyze your activity patterns and identify missed contribution days.
          </p>
          <p className="text-sm text-muted-foreground">
            Let's get started by exploring the key features.
          </p>
        </div>
      )
    },
    {
      title: 'Visualize Your Contributions',
      description: 'Get detailed insights into your GitHub activity.',
      icon: <Calendar className="w-12 h-12 text-primary mb-2" />,
      content: (
        <div className="space-y-4">
          <p>
            The interactive contribution calendar shows your activity patterns with:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Color-coded intensity for contribution volume</li>
            <li>Clear highlights of missing days</li>
            <li>Year/month/week view toggles</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Manage Your Repositories',
      description: 'Choose which repos to track and maintain.',
      icon: <GitCommit className="w-12 h-12 text-primary mb-2" />,
      content: (
        <div className="space-y-4">
          <p>
            Browse and select repositories to include in your streak management:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Sort by last updated, name, or stars</li>
            <li>Filter by repository type</li>
            <li>Quick selection for backfill targets</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Track Your Progress',
      description: 'Monitor your streaks and commit patterns.',
      icon: <BarChart2 className="w-12 h-12 text-primary mb-2" />,
      content: (
        <div className="space-y-4">
          <p>
            Get valuable metrics to improve your consistency:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Current and longest streak counters</li>
            <li>Average weekly contributions</li>
            <li>Day-of-week pattern analysis</li>
            <li>Consistency score</li>
          </ul>
        </div>
      )
    }
  ];
  
  const currentStep = steps[step - 1];
  
  const handleNextStep = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      setOpen(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          {currentStep.icon}
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {currentStep.content}
        </div>
        
        <div className="flex items-center justify-center mb-4">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full mx-1 transition-all ${
                index + 1 === step ? 'bg-primary w-6' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        
        <DialogFooter>
          <Button onClick={handleNextStep} className="w-full">
            {step === steps.length ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
