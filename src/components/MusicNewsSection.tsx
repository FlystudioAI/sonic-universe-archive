import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Newspaper, 
  ExternalLink, 
  Calendar, 
  User, 
  Bookmark, 
  Share2, 
  Loader2,
  RefreshCw,
  Filter,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  source: string;
  author?: string;
  published_at: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface MusicNewsSectionProps {
  className?: string;
}

const MusicNewsSection: React.FC<MusicNewsSectionProps> = ({ className }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const { toast } = useToast();

  const categories = [
    { id: 'all', label: 'All News', icon: Newspaper },
    { id: 'general', label: 'General', icon: Newspaper },
    { id: 'music', label: 'Music', icon: TrendingUp },
    { id: 'industry', label: 'Industry', icon: User },
    { id: 'festivals', label: 'Festivals', icon: Calendar }
  ];

  useEffect(() => {
    loadNews();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('music_news_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'music_news'
      }, (payload) => {
        setNews(prev => [payload.new as NewsItem, ...prev]);
        toast({
          title: "New Music News!",
          description: "Fresh music news just arrived",
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeCategory]);

  const loadNews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('music-news-and-charts', {
        body: { 
          action: 'get-news', 
          limit: 50,
          category: activeCategory === 'all' ? undefined : activeCategory
        }
      });

      if (error) throw error;

      setNews(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "Error loading news",
        description: "Failed to load music news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    try {
      setRefreshing(true);
      
      // Trigger news fetch
      const { data, error } = await supabase.functions.invoke('music-news-and-charts', {
        body: { action: 'fetch-news' }
      });

      if (error) throw error;

      toast({
        title: "News Updated!",
        description: `Fetched ${data.count} new articles`,
      });
      
      // Reload the news
      await loadNews();
    } catch (error) {
      console.error('Error refreshing news:', error);
      toast({
        title: "Error refreshing news",
        description: "Failed to refresh news. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async (newsItem: NewsItem) => {
    try {
      await navigator.share({
        title: newsItem.title,
        text: newsItem.description,
        url: newsItem.url
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(newsItem.url);
      toast({
        title: "Link copied!",
        description: "News link copied to clipboard",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getSourceIcon = (source: string) => {
    const firstLetter = source.charAt(0).toUpperCase();
    return firstLetter;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Music News</h2>
            <p className="text-muted-foreground">Latest updates from the music world</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshNews} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-grid">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {news.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No news available in this category yet.
                </p>
                <Button className="mt-4" onClick={refreshNews}>
                  Fetch Latest News
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {news.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Article Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Article Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getSourceIcon(item.source)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{item.source}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(item.published_at)}
                            </span>
                          </div>
                          
                          <Badge variant="secondary" className="ml-2">
                            {item.category}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                          {item.description}
                        </p>
                        
                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Author */}
                        {item.author && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <User className="h-3 w-3" />
                            <span>{item.author}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(item.url, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Read More
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleShare(item)}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          
                          <Button variant="ghost" size="sm">
                            <Bookmark className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MusicNewsSection;