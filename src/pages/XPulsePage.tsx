import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Twitter, TrendingUp, Users } from 'lucide-react';

const XPulsePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">X Pulse</h1>
          <p className="text-muted-foreground">
            Top AI tweets and social signals from X.com
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
          <Twitter className="h-3 w-3 mr-1" />
          Live Feed
        </Badge>
      </div>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            X Pulse will aggregate the top GenAI tweets from thought leaders and provide AI-powered summaries.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              <span>Track AI influencers like Sam Altman, Elon Musk, and Yann LeCun</span>
            </div>
            <div className="flex items-center">
              <Twitter className="h-4 w-4 mr-2 text-blue-500" />
              <span>AI-summarized tweets for quick insights</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
              <span>Real-time trending AI hashtags</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XPulsePage;