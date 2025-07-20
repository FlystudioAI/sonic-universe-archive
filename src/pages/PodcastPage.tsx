import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PodcastService } from '@/podcastGenerator/podcastService';
import { NewsService } from '@/newsFetcher/newsService';
import { useAuth } from '@/hooks/useAuth';
import { PodcastEpisode, NewsArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Pause, 
  Download, 
  Share, 
  Clock,
  Headphones,
  Calendar,
  Mic,
  Volume2,
  SkipBack,
  SkipForward,
  RefreshCw,
  Plus,
  Crown,
  Sparkles,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PodcastPage = () => {
  const { user, authService } = useAuth();
  const [podcastService] = useState(new PodcastService());
  const [newsService] = useState(new NewsService());
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Custom podcast creation state
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [selectedStories, setSelectedStories] = useState<NewsArticle[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [availableStories, setAvailableStories] = useState<NewsArticle[]>([]);

  // Fetch recent podcast episodes
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ['podcast-episodes'],
    queryFn: () => podcastService.getRecentEpisodes(7),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch available stories for custom podcast creation
  const { data: stories = [] } = useQuery({
    queryKey: ['available-stories'],
    queryFn: async () => {
      const allStories = await newsService.aggregateNews();
      setAvailableStories(allStories);
      return allStories;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Generate today's personalized podcast
  const { data: todaysPodcast, isLoading: isLoadingToday } = useQuery({
    queryKey: ['todays-podcast', user?.uid, new Date().toDateString()],
    queryFn: async () => {
      if (!user) return null;
      const topStories = await newsService.aggregateNews();
      return await podcastService.generatePersonalizedPodcast(user, topStories);
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Audio event handlers (unchanged)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      handleEpisodeComplete();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentEpisode]);

  const playEpisode = async (episode: PodcastEpisode) => {
    if (currentEpisode?.id === episode.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentEpisode(episode);
      setCurrentTime(0);
      
      if (audioRef.current) {
        audioRef.current.src = episode.audioUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }

      if (user) {
        await authService.trackUserInteraction({
          itemId: episode.id,
          itemType: 'podcast',
          actionType: 'view'
        });
      }

      await podcastService.incrementListenCount(episode.id);
    }
  };

  const handleEpisodeComplete = async () => {
    if (user && currentEpisode) {
      await authService.trackUserInteraction({
        itemId: currentEpisode.id,
        itemType: 'podcast',
        actionType: 'listen_complete'
      });
    }
  };

  const seekTo = (percentage: number) => {
    if (audioRef.current && duration) {
      const newTime = (percentage / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const downloadEpisode = async (episode: PodcastEpisode) => {
    try {
      const response = await fetch(episode.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      await podcastService.incrementDownloadCount(episode.id);
      toast.success('Episode downloaded');
    } catch (error) {
      toast.error('Failed to download episode');
    }
  };

  const shareEpisode = (episode: PodcastEpisode) => {
    const shareData = {
      title: episode.title,
      text: episode.description,
      url: window.location.href + `?episode=${episode.id}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('Episode link copied to clipboard');
    }
  };

  const generatePersonalizedEpisode = async () => {
    if (!user) {
      toast.error('Please sign in to generate personalized episodes');
      return;
    }

    setIsGenerating(true);
    try {
      const topStories = await newsService.aggregateNews();
      const newEpisode = await podcastService.generatePersonalizedPodcast(user, topStories);
      toast.success('Personalized episode generated!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to generate personalized episode');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStorySelection = (story: NewsArticle, checked: boolean) => {
    if (checked) {
      if (selectedStories.length >= 10) {
        toast.error('Maximum 10 stories allowed for custom podcast');
        return;
      }
      setSelectedStories(prev => [...prev, story]);
    } else {
      setSelectedStories(prev => prev.filter(s => s.id !== story.id));
    }
  };

  const generateCustomEpisode = async () => {
    if (!user) {
      toast.error('Please sign in to create custom podcasts');
      return;
    }

    if (user.subscriptionTier !== 'premium') {
      toast.error('Custom podcast creation is a Premium feature. Upgrade to access this feature!');
      return;
    }

    if (selectedStories.length === 0) {
      toast.error('Please select at least one story');
      return;
    }

    setIsGenerating(true);
    try {
      const customEpisode = await podcastService.generateCustomPodcast(
        user, 
        selectedStories, 
        customTitle || undefined
      );
      
      toast.success('Custom podcast created successfully!');
      setShowCustomDialog(false);
      setSelectedStories([]);
      setCustomTitle('');
      setCustomDescription('');
      
      // Play the new episode
      await playEpisode(customEpisode);
    } catch (error) {
      toast.error('Failed to create custom podcast');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CTRLcast</h1>
          <p className="text-muted-foreground">
            Conversational AI podcasts featuring CTRL/Alex, CTRL/Sam, and CTRL/Jae
          </p>
          {user && (
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                <Users className="h-3 w-3 mr-1" />
                Personalized for you
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                <MessageSquare className="h-3 w-3 mr-1" />
                NotebookLM Style
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
            <Mic className="h-3 w-3 mr-1" />
            AI Hosts
          </Badge>
          
          {/* Generate Personalized Episode */}
          <Button 
            onClick={generatePersonalizedEpisode}
            disabled={isGenerating || !user}
            size="sm"
            variant="outline"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Personal Episode
          </Button>

          {/* Custom Podcast Creation */}
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={!user || user.subscriptionTier !== 'premium'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Podcast
                {user?.subscriptionTier !== 'premium' && (
                  <Crown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-amber-500" />
                  Create Custom Podcast
                </DialogTitle>
                <DialogDescription>
                  Select stories for a personalized conversational podcast with our AI hosts
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-title">Podcast Title (Optional)</Label>
                    <Input
                      id="custom-title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Deep Dive: OpenAI Updates"
                    />
                  </div>
                  <div>
                    <Label>Selected Stories: {selectedStories.length}/10</Label>
                    <div className="text-sm text-muted-foreground">
                      Choose stories for focused discussion
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h4 className="font-medium mb-3">Available Stories</h4>
                  <div className="space-y-3">
                    {availableStories.slice(0, 20).map((story) => (
                      <div key={story.id} className="flex items-start space-x-3 p-2 border rounded">
                        <Checkbox
                          checked={selectedStories.some(s => s.id === story.id)}
                          onCheckedChange={(checked) => handleStorySelection(story, checked as boolean)}
                          disabled={!selectedStories.some(s => s.id === story.id) && selectedStories.length >= 10}
                        />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium line-clamp-2">{story.title}</h5>
                          <p className="text-xs text-muted-foreground line-clamp-2">{story.summary}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant="outline" className="text-xs">{story.source}</Badge>
                            <Badge variant="outline" className={cn("text-xs", 
                              story.tone === 'breaking' && "border-red-500/20 text-red-500",
                              story.tone === 'positive' && "border-green-500/20 text-green-500"
                            )}>
                              {story.tone}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {selectedStories.length > 0 && (
                      <>Estimated podcast length: {Math.round(selectedStories.length * 1.5)}-{Math.round(selectedStories.length * 2)} minutes</>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={generateCustomEpisode}
                      disabled={selectedStories.length === 0 || isGenerating}
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mic className="h-4 w-4 mr-2" />
                      )}
                      Create Podcast
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Premium Feature Callout for Free Users */}
      {user?.subscriptionTier === 'free' && (
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <Crown className="h-6 w-6 text-amber-500 mt-1" />
                <div>
                  <h3 className="font-medium">Unlock Custom Podcast Creation</h3>
                  <p className="text-sm text-muted-foreground">
                    Premium users can create personalized podcasts from any combination of stories with conversational AI hosts
                  </p>
                  <div className="flex items-center mt-2 space-x-4 text-xs">
                    <span className="flex items-center">
                      <Mic className="h-3 w-3 mr-1" />
                      Choose your stories
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Conversational style
                    </span>
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Multiple AI hosts
                    </span>
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio Player */}
      <audio ref={audioRef} preload="metadata" />

      {/* Current Player */}
      {currentEpisode && (
        <Card className="border-primary/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Button
                size="icon"
                variant="default"
                onClick={() => playEpisode(currentEpisode)}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              
              <div className="flex-1">
                <h3 className="font-semibold">{currentEpisode.title}</h3>
                <p className="text-sm text-muted-foreground">{currentEpisode.description}</p>
                
                <div className="mt-2 flex items-center space-x-4">
                  <Progress 
                    value={duration ? (currentTime / duration) * 100 : 0} 
                    className="flex-1 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                      seekTo(percentage);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Personalized Episode */}
      {todaysPodcast && (
        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500 text-blue-50">Your Daily Briefing</Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(todaysPodcast.publishedAt)}
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                  <Users className="h-3 w-3 mr-1" />
                  Personalized
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDuration(todaysPodcast.duration)}
              </div>
            </div>
            <CardTitle>{todaysPodcast.title}</CardTitle>
            <p className="text-muted-foreground">{todaysPodcast.description}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => playEpisode(todaysPodcast)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {currentEpisode?.id === todaysPodcast.id && isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2 ml-1" />
                  )}
                  {currentEpisode?.id === todaysPodcast.id && isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadEpisode(todaysPodcast)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareEpisode(todaysPodcast)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Headphones className="h-4 w-4 mr-1" />
                  {todaysPodcast.listenCount} listens
                </div>
              </div>
            </div>

            {/* Featured Stories */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Stories Discussed:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {todaysPodcast.stories.slice(0, 4).map((story) => (
                  <div key={story.id} className="p-2 bg-background/50 rounded border">
                    <h5 className="text-sm font-medium line-clamp-1">{story.title}</h5>
                    <p className="text-xs text-muted-foreground">{story.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Episodes (rest of component remains the same) */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Episodes</h2>
        
        {user?.subscriptionTier === 'free' && (
          <Card className="border-amber-500/20 bg-amber-500/5 mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Free Tier - 3 episodes per week</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Premium for daily personalized episodes and custom creation
                  </p>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500">
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {isLoading || isLoadingToday ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            episodes.slice(0, user?.subscriptionTier === 'premium' ? 7 : 3).map((episode) => (
              <Card key={episode.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(episode.publishedAt)}
                      </Badge>
                      {episode.id.includes('custom') && (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                          <Crown className="h-3 w-3 mr-1" />
                          Custom
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(episode.duration)}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-1">{episode.title}</CardTitle>
                  <p className="text-muted-foreground line-clamp-2">{episode.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => playEpisode(episode)}
                        variant={currentEpisode?.id === episode.id ? "default" : "outline"}
                      >
                        {currentEpisode?.id === episode.id && isPlaying ? (
                          <Pause className="h-4 w-4 mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2 ml-1" />
                        )}
                        {currentEpisode?.id === episode.id && isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadEpisode(episode)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => shareEpisode(episode)}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Headphones className="h-4 w-4 mr-1" />
                        {episode.listenCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;