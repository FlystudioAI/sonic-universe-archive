import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Archive, Clock } from 'lucide-react';

const SavedPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Content</h1>
          <p className="text-muted-foreground">
            Your bookmarked articles and saved podcast episodes
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-500/10 text-green-500">
          <Bookmark className="h-3 w-3 mr-1" />
          Personal Library
        </Badge>
      </div>

      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Archive className="h-5 w-5 mr-2" />
            Your Personal AI News Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Save articles and podcast episodes to access them later. Your saved content syncs across all devices.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Bookmark className="h-4 w-4 mr-2 text-green-500" />
              <span>Save articles for offline reading</span>
            </div>
            <div className="flex items-center">
              <Archive className="h-4 w-4 mr-2 text-green-500" />
              <span>Organize content by topics and tags</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-green-500" />
              <span>Access your reading history</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedPage;