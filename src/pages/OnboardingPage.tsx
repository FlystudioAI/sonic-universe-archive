import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();

  const handleCompleteOnboarding = () => {
    // TODO: Implement interest selection
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to CTRL/news</CardTitle>
          <p className="text-muted-foreground">
            Let's personalize your AI news experience
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              We'll help you discover the most relevant GenAI news based on your interests.
            </p>
          </div>
          
          <Button 
            onClick={handleCompleteOnboarding}
            className="w-full"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;