import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NewsService } from '@/newsFetcher/newsService';
import { AISummarizer } from '@/summarizer/aiSummarizer';
import { useAuth } from '@/hooks/useAuth';
import { NewsArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  ExternalLink, 
  Heart, 
  Share, 
  Bookmark, 
  Zap,
  TrendingUp,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const FeedPage = () => {
  const { user, authService } = useAuth();
  const [newsService] = useState(new NewsService());
  const [aiSummarizer] = useState(new AISummarizer());
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  // Fetch news articles
  const { data: articles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['news-feed'],
    queryFn: async () => {
      const rawArticles = await newsService.aggregateNews();
      // Enhance with AI summaries
      return await aiSummarizer.generateBatchSummaries(rawArticles);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // Auto-refresh every 30 minutes
  });

  // Load saved articles
  useEffect(() => {
    const loadSavedArticles = async () => {
      if (user) {
        try {
          const saved = await authService.getSavedArticles();
          setSavedArticles(saved);
        } catch (error) {
          console.error('Error loading saved articles:', error);
        }
      }
    };

    loadSavedArticles();
  }, [user, authService]);

  const handleArticleClick = async (article: NewsArticle) => {
    // Track user interaction
    if (user) {
      await authService.trackUserInteraction({
        itemId: article.id,
        itemType: 'article',
        actionType: 'view'
      });
    }

    // Open article in new tab
    window.open(article.url, '_blank');
  };

  const handleSaveArticle = async (articleId: string) => {
    if (!user) {
      toast.error('Please sign in to save articles');
      return;
    }

    try {
      if (savedArticles.includes(articleId)) {
        await authService.unsaveArticle(articleId);
        setSavedArticles(prev => prev.filter(id => id !== articleId));
        toast.success('Article removed from saved');
      } else {
        await authService.saveArticle(articleId);
        setSavedArticles(prev => [...prev, articleId]);
        toast.success('Article saved');
      }
    } catch (error) {
      toast.error('Failed to save article');
    }
  };

  const handleLikeArticle = async (articleId: string) => {
    if (!user) {
      toast.error('Please sign in to like articles');
      return;
    }

    await authService.trackUserInteraction({
      itemId: articleId,
      itemType: 'article',
      actionType: 'like'
    });

    toast.success('Article liked');
  };

  const handleShareArticle = (article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url,
      });
    } else {
      navigator.clipboard.writeText(article.url);
      toast.success('Link copied to clipboard');
    }
  };

  const getToneColor = (tone: NewsArticle['tone']) => {
    switch (tone) {
      case 'breaking': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'positive': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getToneIcon = (tone: NewsArticle['tone']) => {
    switch (tone) {
      case 'breaking': return <Zap className="h-3 w-3" />;
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <Eye className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Unable to load news</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the latest AI news. Please try again.
          </p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI News Feed</h1>
          <p className="text-muted-foreground">
            Latest GenAI developments curated by AI
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            Live
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Free tier limitation notice */}
      {user?.subscriptionTier === 'free' && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Free Tier - 10 stories per day</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Premium for unlimited access and no ads
                </p>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : (
          // Actual articles
          articles.slice(0, user?.subscriptionTier === 'premium' ? 50 : 10).map((article) => (
            <Card 
              key={article.id} 
              className="group hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleArticleClick(article)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getToneColor(article.tone))}
                    >
                      {getToneIcon(article.tone)}
                      <span className="ml-1 capitalize">{article.tone}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {article.source}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(article.publishedAt)}
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                
                {article.author && (
                  <p className="text-sm text-muted-foreground">
                    By {article.author}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {article.summary}
                </p>

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeArticle(article.id);
                      }}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Like
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveArticle(article.id);
                      }}
                      className={cn(
                        "text-muted-foreground",
                        savedArticles.includes(article.id) 
                          ? "text-blue-500 hover:text-blue-600" 
                          : "hover:text-blue-500"
                      )}
                    >
                      <Bookmark className={cn(
                        "h-4 w-4 mr-1",
                        savedArticles.includes(article.id) && "fill-current"
                      )} />
                      {savedArticles.includes(article.id) ? 'Saved' : 'Save'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareArticle(article);
                      }}
                      className="text-muted-foreground hover:text-blue-500"
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArticleClick(article);
                    }}
                  >
                    {article.ctaText || 'Read more'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load more for premium users */}
      {user?.subscriptionTier === 'premium' && articles.length >= 50 && (
        <div className="text-center py-6">
          <Button variant="outline" onClick={() => refetch()}>
            Load More Stories
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeedPage;